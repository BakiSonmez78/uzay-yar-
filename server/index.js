const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Version 1.0.7 - Fixed pendingRequests bug
const app = express();
app.use(cors());

const requestIp = require('request-ip');
const { setupPrivateRoomHandlers } = require('./privateRooms');
const { generateAdvancedQuestions } = require('./advancedQuestions');

// Helper to get country from IP
const getCountryCode = async (ip) => {
    try {
        // Handle localhost/private IPs
        if (ip === '::1' || ip === '127.0.0.1' || ip.includes('192.168.') || ip.includes('10.')) {
            return 'TR'; // Default to Turkey for local dev
        }

        const response = await fetch(`https://ipapi.co/${ip}/country/`);
        if (response.ok) {
            const text = await response.text();
            return text.trim().substring(0, 2);
        }
    } catch (e) {
        console.error("GeoIP Error:", e.message);
    }
    return 'TR'; // Fallback
};

const server = http.createServer(app);

// Health check endpoint to prevent cold starts
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now(),
        activeTournaments: Object.keys(tournaments).length,
        activeGames: Object.keys(games).length
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.send('Math Racing Backend v1.1.4 - Tournament Sync Fix');
});

// Test endpoint for advanced questions
app.get('/test-questions/:category', (req, res) => {
    const { category } = req.params;
    try {
        const questions = generateQuestions(category);
        res.json({
            category,
            count: questions.length,
            sample: questions[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const io = new Server(server, {
    cors: {
        origin: [
            "https://math-games-6c136.web.app",
            "https://math-games-6c136.firebaseapp.com",
            "https://localhost", // Capacitor mobile apps
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://192.168.1.106:5173" // Local mobile testing
        ],
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['polling', 'websocket'], // CRITICAL: Polling first, then upgrade
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    allowUpgrades: true
});

// Game State Storage
const games = {}; // { roomId: { questions: [], currentIndex: 0, scores: {}, locked: false, isBotGame: boolean } }
const queues = {
    '+': [],
    '-': [],
    '*': [],
    '/': [],
    'mixed': []
};
const tournaments = {}; // { tournamentId: { id, size, players: [], status: 'waiting'|'in_progress'|'finished', bracket: [], winner: null } }


// Generate questions for a game
const generateQuestions = (mode) => {
    // Check if it's an advanced category
    const advancedCategories = [
        'fractions_add', 'fractions_compare', 'percentages',
        'area_rectangle', 'perimeter', 'word_problems', 'time', 'patterns'
    ];

    if (advancedCategories.includes(mode)) {
        return generateAdvancedQuestions(mode);
    }

    // Original basic math questions
    const questions = [];
    for (let i = 0; i < 50; i++) { // Generate 50 questions per match
        const ops = mode === 'mixed' ? ['+', '-', '*', '/'] : [mode];
        const op = ops[Math.floor(Math.random() * ops.length)];
        let num1, num2, answer, displayOp;

        switch (op) {
            case '+':
                num1 = Math.floor(Math.random() * 50) + 1;
                num2 = Math.floor(Math.random() * 50) + 1;
                answer = num1 + num2;
                displayOp = '+';
                break;
            case '-':
                num1 = Math.floor(Math.random() * 50) + 10;
                num2 = Math.floor(Math.random() * num1);
                answer = num1 - num2;
                displayOp = '-';
                break;
            case '*':
                num1 = Math.floor(Math.random() * 12) + 1;
                num2 = Math.floor(Math.random() * 12) + 1;
                answer = num1 * num2;
                displayOp = '×';
                break;
            case '/':
                num2 = Math.floor(Math.random() * 10) + 2;
                answer = Math.floor(Math.random() * 12) + 1;
                num1 = num2 * answer;
                displayOp = '÷';
                break;
        }

        const options = new Set([answer]);
        let attempts = 0;
        while (options.size < 4 && attempts < 20) {
            const offset = Math.floor(Math.random() * 20) - 10;
            const wrong = answer + offset;
            if (wrong >= 0 && wrong !== answer) {
                options.add(wrong);
            }
            attempts++;
        }
        // Fill with randoms if stuck
        while (options.size < 4) {
            options.add(Math.floor(Math.random() * 100));
        }

        questions.push({
            id: i,
            num1,
            num2,
            op: displayOp,
            answer,
            options: Array.from(options).sort(() => Math.random() - 0.5)
        });
    }
    return questions;
};

// Helper to start a tournament and generate bracket
const startTournament = (tournamentId) => {
    const tournament = tournaments[tournamentId];
    if (!tournament || tournament.status !== 'waiting') return;

    tournament.status = 'in_progress';

    // Generate bracket (Random seeding)
    const shuffledPlayers = [...tournament.players].sort(() => Math.random() - 0.5);
    tournament.bracket = [];

    const totalRounds = Math.log2(tournament.size);
    console.log(`[Tournament] Starting ${tournamentId} with ${tournament.size} players (${totalRounds} rounds)`);

    // Create first round matches
    // Note: This logic assumes size is a power of 2 (2, 4, 8)
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
        const player1 = shuffledPlayers[i];
        const player2 = shuffledPlayers[i + 1];

        const matchId = `match_${tournamentId}_R1_${i / 2}`;
        const gameRoomId = `room_${matchId}`;
        const mode = '+'; // Default mode, or could be random

        // Create the game room for this match
        const game = {
            roomId: gameRoomId,
            tournamentId: tournamentId,
            matchId: matchId,
            round: 1,
            // Standard format: Players as Object Map
            players: {
                [player1.uid]: { ...player1, score: 0, lives: 5, socketId: player1.socketId },
                [player2.uid]: { ...player2, score: 0, lives: 5, socketId: player2.socketId }
            },
            playersList: [player1, player2],
            questions: generateQuestions(mode),
            streaks: { [player1.uid]: 0, [player2.uid]: 0 },
            scores: { [player1.uid]: 0, [player2.uid]: 0 },
            isTournamentMatch: true,
            winner: null,
            startTime: Date.now(),
            duration: 60
        };

        // Save game
        games[gameRoomId] = game;

        // Add to bracket
        tournament.bracket.push({
            id: matchId,
            round: 1,
            roomId: gameRoomId,
            players: [player1, player2],
            winner: null,
            status: 'scheduled' // scheduled, in_progress, finished
        });

        console.log(`[Tournament] Created Round 1 match: ${player1.name} vs ${player2.name} (Room: ${gameRoomId})`);
    }

    // Notify all players in the tournament
    io.to(tournamentId).emit('tournament_started', {
        tournament: tournament,
        firstRoundMatches: tournament.bracket.filter(m => m.round === 1)
    });

    // Update global list (remove from waiting)
    io.emit('tournament_list_update', Object.values(tournaments).filter(t => t.status === 'waiting'));
};

const handleTournamentMatchEnd = (game, winnerId) => {
    // Logic to update bracket and create next round matches
    const tournament = tournaments[game.tournamentId];
    if (!tournament) return;

    const match = tournament.bracket.find(m => m.roomId === game.roomId);
    if (!match) return;

    match.winner = match.players.find(p => p.uid === winnerId);
    match.status = 'finished';

    console.log(`[Tournament] Match ${match.id} finished. Winner: ${match.winner.name}`);

    // Check if current round is complete
    const currentRound = match.round;
    const roundMatches = tournament.bracket.filter(m => m.round === currentRound);

    if (roundMatches.every(m => m.status === 'finished')) {
        console.log(`[Tournament] Round ${currentRound} complete! Generating next round...`);

        const winners = roundMatches.map(m => m.winner);

        if (winners.length === 1) {
            // WE HAVE A TOURNAMENT WINNER!
            tournament.status = 'finished';
            tournament.winner = winners[0];
            io.to(tournament.id).emit('tournament_finished', { winner: winners[0] });
            console.log(`[Tournament] WINNER IS ${winners[0].name}`);
        } else {
            // Create next round
            const nextRound = currentRound + 1;
            const newMatches = [];

            for (let i = 0; i < winners.length; i += 2) {
                const p1 = winners[i];
                const p2 = winners[i + 1];

                const nextMatchId = `match_${tournament.id}_R${nextRound}_${i / 2}`;
                const nextRoomId = `room_${nextMatchId}`;

                // Create game room for next round
                const nextGame = {
                    roomId: nextRoomId,
                    tournamentId: tournament.id,
                    matchId: nextMatchId,
                    round: nextRound,
                    players: {
                        [p1.uid]: { ...p1, score: 0, lives: 5, socketId: p1.socketId },
                        [p2.uid]: { ...p2, score: 0, lives: 5, socketId: p2.socketId }
                    },
                    playersList: [p1, p2], // Helper for bracket display if needed
                    questions: generateQuestions('+'),
                    streaks: { [p1.uid]: 0, [p2.uid]: 0 },
                    scores: { [p1.uid]: 0, [p2.uid]: 0 },
                    isTournamentMatch: true,
                    winner: null,
                    startTime: Date.now(),
                    duration: 60
                };
                games[nextRoomId] = nextGame;

                const newMatch = {
                    id: nextMatchId,
                    round: nextRound,
                    roomId: nextRoomId,
                    players: [p1, p2],
                    winner: null,
                    status: 'scheduled'
                };

                tournament.bracket.push(newMatch);
                newMatches.push(newMatch);
            }

            // Notify players of next round
            io.to(tournament.id).emit('tournament_round_update', {
                round: nextRound,
                matches: newMatches
            });

            // Start the next round matches automatically? 
            // Or wait for players to be ready?
            // For now, let's auto-notify and client handles join.
            // Client listener `tournament_round_update` should check if I am in a new match and join.
        }
    } else {
        // Round not done, just update bracket UI
        io.to(tournament.id).emit('tournament_bracket_update', { bracket: tournament.bracket });
    }
};

// Start a Game Room
const startGame = (roomId, mode, players, isBotGame = false, botDifficulty = 'medium') => {
    const questions = generateQuestions(mode);

    // Initialize Game State
    games[roomId] = {
        questions,
        currentIndex: 0,
        scores: {},
        streaks: {}, // Track consecutive wins
        players: players.map(p => ({ ...p, socketId: p.id, playerId: p.playerId || p.id })), // Store players details
        isBotGame
    };

    const playersData = {}; // Initialize playersData here

    players.forEach(p => {
        // Use provided playerId, or fallback to socket.id (legacy)
        const pId = p.playerId || p.id;
        games[roomId].scores[pId] = 0;
        games[roomId].streaks[pId] = 0;
        playersData[pId] = {
            name: p.name,
            avatar: p.avatar,
            score: 0,
            isBot: p.isBot,
            country: p.country || 'TR' // Use passed country or default
        };
    });

    // Notify Players
    io.to(roomId).emit('match_found', {
        roomId,
        questions,
        players: playersData,
        startTime: Date.now(), // Source of Truth for time
        duration: 90 // Send duration explicitly
    });

    console.log(`[startGame] Game started in roo: ${roomId} (Bot: ${isBotGame})`);
    console.log(`[startGame] Initial Scores:`, games[roomId].scores);

    // Bot Logic
    if (isBotGame) {
        startBotLoop(roomId, botDifficulty);
    }
};

const startBotLoop = (roomId, difficulty = 'medium') => {
    const game = games[roomId];
    if (!game) return;

    // Difficulty settings
    const difficultySettings = {
        easy: { minTime: 10000, maxTime: 20000, accuracy: 0.40 },
        medium: { minTime: 7000, maxTime: 15000, accuracy: 0.55 },
        hard: { minTime: 2000, maxTime: 6000, accuracy: 0.85 }
    };

    const settings = difficultySettings[difficulty] || difficultySettings.medium;

    // Recursive bot turn function
    const nextBotTurn = () => {
        const currentGame = games[roomId];
        if (!currentGame) return; // Game over

        const questionIndexAtStart = currentGame.currentIndex;

        // Determine bot reaction time based on difficulty
        const reactionTime = Math.random() * (settings.maxTime - settings.minTime) + settings.minTime;

        setTimeout(() => {
            const liveGame = games[roomId];
            // Verify game state is still valid
            if (!liveGame) return;

            // CRITICAL: Check if question changed while bot was "thinking"
            // If player solved it, or bot already solved it in another loop, stop this attempt
            if (liveGame.currentIndex !== questionIndexAtStart) {
                console.log(`[Bot] Question changed from ${questionIndexAtStart} to ${liveGame.currentIndex}, starting fresh`);
                nextBotTurn(); // Start fresh on new question
                return;
            }

            // Bot attempts to solve CURRENT question
            const isCorrect = Math.random() < settings.accuracy;

            if (isCorrect) {
                // Simulate Bot "Clicking" Correct Answer
                const q = liveGame.questions[liveGame.currentIndex];
                if (q) {
                    // Bot uses fixed ID 'bot-1'
                    handleAnswer(roomId, 'bot-1', liveGame.currentIndex, q.answer);
                    // After correct answer, handleAnswer will advance currentIndex
                    // Next iteration will detect index change and start fresh
                }
            }

            // Try again (either after wrong answer, or after correct to handle next question)
            nextBotTurn();
        }, reactionTime);
    };

    nextBotTurn();
};

const handleAnswer = (roomId, playerId, questionIndex, answer) => {
    console.log(`[handleAnswer] Room: ${roomId}, Player: ${playerId}, Index: ${questionIndex}, Answer: ${answer}`);

    const game = games[roomId];
    if (!game) {
        console.error(`[handleAnswer] Game not found for room ${roomId}`);
        return;
    }

    // Concurrency Check: Is this still the active question?
    if (game.currentIndex !== questionIndex) {
        console.warn(`[handleAnswer] Stale answer. Game Index: ${game.currentIndex}, Msg Index: ${questionIndex}`);
        return; // Question already solved by someone else
    }

    // Initialize attempted tracking if not exists
    if (!game.attempted) game.attempted = {};
    if (!game.attempted[questionIndex]) game.attempted[questionIndex] = [];

    // Check if player already attempted this question
    if (game.attempted[questionIndex].includes(playerId)) {
        console.warn(`[handleAnswer] Player ${playerId} already attempted question ${questionIndex}`);
        return; // Player already tried this question
    }

    // Mark as attempted
    game.attempted[questionIndex].push(playerId);

    const q = game.questions[questionIndex];
    if (q.answer === answer) {
        // CORRECT!

        // 1. Manage Streaks
        if (!game.streaks[playerId]) game.streaks[playerId] = 0;
        game.streaks[playerId]++;

        // Reset opponent streaks
        Object.keys(game.streaks).forEach(id => {
            if (id !== playerId) game.streaks[id] = 0;
        });

        const currentStreak = game.streaks[playerId];
        let bonus = 0;

        // 2. Calculate Bonus
        // Original logic: 3rd answer = +3, 4th = +4, 5th = +5, etc.
        if (currentStreak >= 3) {
            bonus = currentStreak;
        }

        const points = 10 + bonus;

        console.log(`[handleAnswer] Correct! Player: ${playerId}, Streak: ${currentStreak}, Bonus: ${bonus}, Total Points: ${points}`);

        if (typeof game.scores[playerId] === 'undefined') {
            game.scores[playerId] = 0;
        }

        game.scores[playerId] += points;
        game.currentIndex++;

        // Broadcast Update
        io.to(roomId).emit('question_solved', {
            winnerId: playerId,
            newScores: game.scores,
            nextIndex: game.currentIndex,
            streak: currentStreak,
            bonus: bonus
        });

        // Trigger next bot turn if needed (bot needs to know to reset its timer)
        if (game.isBotGame) {
            if (game.botTimer) clearTimeout(game.botTimer);
            startBotLoop(roomId); // Restart bot thinking for NEW question
        }
    } else {
        console.log(`[handleAnswer] Wrong Answer. Correct: ${q.answer}, Provided: ${answer}`);
    }
    // Incorrect answers handled by client (penalty)
};


io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Setup private room handlers
    setupPrivateRoomHandlers(io, socket, games, generateQuestions);

    socket.on('join_queue', async ({ name, avatar, mode, matchType, playerId, botDifficulty }) => {
        // Fallback for older clients or if playerId is missing
        const stableId = playerId || socket.id;

        // Get Country
        const clientIp = requestIp.getClientIp(socket.request);
        // const country = await getCountryCode(clientIp);
        const country = 'TR'; // Temporary disable for debugging

        console.log(`[join_queue] ${name} (ID: ${stableId}) joining ${mode} (${matchType})`);

        if (matchType === 'bot') {
            const roomId = `bot-${socket.id}`;
            socket.join(roomId);

            startGame(roomId, mode, [
                { id: socket.id, playerId: stableId, name, avatar, isBot: false, country },
                { id: 'bot-1', playerId: 'bot-1', name: 'Robot 🤖', avatar: '🤖', isBot: true, country: 'TR' }
            ], true, botDifficulty || 'medium');
        } else {
            // Safety check
            if (!queues[mode]) {
                console.warn(`[join_queue] Unknown mode ${mode}, initializing queue.`);
                queues[mode] = [];
            }

            console.log(`[join_queue] Queue for ${mode} has ${queues[mode].length} players.`);

            // Find valid opponent
            let opponent = null;
            while (queues[mode].length > 0) {
                const candidate = queues[mode].shift();

                // Check if socket is still connected
                if (candidate.socket.connected) {
                    // Prevent self-matching
                    if (candidate.socket.id !== socket.id) {
                        opponent = candidate;
                        break;
                    } else {
                        // Put self back later? No, we are the one joining, so candidate must be someone else.
                        // If candidate IS us (re-join?), discard or handle properly.
                        // Ideally we shouldn't be in queue if we just joined, but race conditions happen.
                        // Let's discard self from queue to avoid loop, we will act as the "joiner" now.
                    }
                } else {
                    console.log(`[join_queue] Discarding disconnected opponent ${candidate.socket.id} from queue.`);
                }
            }

            if (opponent) {
                const roomId = `${opponent.socket.id}-${socket.id}`;
                console.log(`[join_queue] MATCH FOUND! Room: ${roomId}`);

                socket.join(roomId);
                opponent.socket.join(roomId);

                startGame(roomId, mode, [
                    { id: socket.id, playerId: stableId, name, avatar, isBot: false, country },
                    { id: opponent.socket.id, playerId: opponent.playerId, name: opponent.name, avatar: opponent.avatar, isBot: false, country: opponent.country }
                ]);
            } else {
                console.log(`[join_queue] No opponent found, adding ${name} to queue.`);
                queues[mode].push({ socket, playerId: stableId, name, avatar, joinedAt: Date.now(), country });
                console.log(`[join_queue] Waiting for opponent...`);
            }
        }
    });

    socket.on('solve_question', ({ roomId, index, answer, playerId }) => {
        // Use explicit playerId if provided, otherwise fallback to socket.id (risky but backward compat)
        handleAnswer(roomId, playerId || socket.id, index, answer);
    });

    socket.on('wrong_answer', ({ roomId, playerId }) => {
        const game = games[roomId];
        if (game && game.streaks) {
            const stableId = playerId || socket.id;
            console.log(`[wrong_answer] Resetting streak and deducting life for player ${stableId} in room ${roomId}`);
            game.streaks[stableId] = 0;

            // Broadcast to opponent so they can update their UI (reduce hearts)
            socket.to(roomId).emit('opponent_wrong_answer', { playerId: stableId });
        }
    });

    socket.on('player_eliminated', ({ roomId, playerId }) => {
        const game = games[roomId];
        if (game) {
            console.log(`[player_eliminated] Player ${playerId} eliminated in room ${roomId}`);

            // Hybrid Check: game.players can be Array (normal) or Object (tournament)
            let winner;
            if (Array.isArray(game.players)) {
                winner = game.players.find(p => p.uid !== playerId);
            } else {
                winner = Object.values(game.players).find(p => p.uid !== playerId);
            }

            if (winner) {
                io.to(roomId).emit('opponent_eliminated', {
                    winnerId: winner.uid,
                    eliminatedId: playerId
                });
                console.log(`[player_eliminated] Declared ${winner.uid} as winner (Opponent: ${playerId})`);

                // If tournament, trigger progression
                if (game.isTournamentMatch) {
                    handleTournamentMatchEnd(game, winner.uid);
                }
            } else {
                console.warn(`[player_eliminated] Could not find winner in room ${roomId}`);
            }
        }
    });

    socket.on('tournament_match_over', ({ roomId, winnerId }) => {
        const game = games[roomId];
        if (game && game.isTournamentMatch) {
            console.log(`[tournament_match_over] Match ${roomId} reported over by client. Winner: ${winnerId}`);

            // Validate? (optional)

            handleTournamentMatchEnd(game, winnerId);
        }
    });

    socket.on('leave_queue', () => {
        for (const mode in queues) {
            queues[mode] = queues[mode].filter(p => p.socket.id !== socket.id);
        }
    });

    const handleDisconnectOrLeave = (sock) => {
        // Remove from matchmaking queues
        for (const mode in queues) {
            queues[mode] = queues[mode].filter(p => p.socket.id !== sock.id);
        }

        // Find active games where this user was a player
        Object.keys(games).forEach(roomId => {
            const game = games[roomId];
            const playerIndex = game.players.findIndex(p => p.socketId === sock.id || p.id === sock.id);

            if (playerIndex !== -1) {
                console.log(`[GameTerminated] Player ${sock.id} left active game ${roomId}`);

                // Identify remaining player (winner)
                const opponent = game.players.find(p => p.socketId !== sock.id && p.id !== sock.id);

                if (opponent) {
                    // Get disconnected player
                    const disconnectedPlayer = game.players[playerIndex];
                    const disconnectedPlayerId = disconnectedPlayer.playerId || disconnectedPlayer.id;
                    const opponentPlayerId = opponent.playerId || opponent.id;

                    // Calculate scores: winner gets max(50, current_score), loser gets 0
                    const winnerCurrentScore = game.scores[opponentPlayerId] || 0;
                    const winnerFinalScore = Math.max(50, winnerCurrentScore);

                    console.log(`[GameTerminated] Winner: ${opponentPlayerId} (${winnerFinalScore} pts), Loser: ${disconnectedPlayerId} (0 pts)`);

                    // Send to WINNER (remaining player)
                    if (opponent.socketId) {
                        const winnerSocket = io.sockets.sockets.get(opponent.socketId);
                        if (winnerSocket) {
                            winnerSocket.emit('game_forfeit_win', {
                                myScore: winnerFinalScore,
                                opponentScore: 0,
                                outcome: 'opponent_disconnected'
                            });
                        }
                    }

                    // Send to LOSER (disconnecting player) - BEFORE they fully disconnect
                    sock.emit('game_forfeit_loss', {
                        myScore: 0,
                        opponentScore: winnerFinalScore,
                        outcome: 'you_left'
                    });

                    // If tournament, handle progression
                    if (game.isTournamentMatch) {
                        handleTournamentMatchEnd(game, opponent.playerId || opponent.id);
                    }
                }

                // Cleanup game
                delete games[roomId];
            }
        });

        // Handle tournament cleanup if player was in a waiting tournament
        Object.keys(tournaments).forEach(tournamentId => {
            const tournament = tournaments[tournamentId];
            if (tournament.status === 'waiting') {
                // ...
            }
        });
    };

    socket.on('leave_game', () => {
        console.log(`[leave_game] Client ${socket.id} requested to leave game.`);
        // Reuse disconnect logic to terminate game
        handleDisconnectOrLeave(socket);
    });

    socket.on('disconnect', () => {
        console.log(`[Disconnect] Client ${socket.id} disconnected.`);

        // Remove from matchmaking queues
        for (const mode in queues) {
            queues[mode] = queues[mode].filter(p => p.socket.id !== socket.id);
        }

        // Find active games where this user was a player
        Object.keys(games).forEach(roomId => {
            const game = games[roomId];
            const playerIndex = game.players.findIndex(p => p.socketId === socket.id || p.id === socket.id);

            if (playerIndex !== -1) {
                console.log(`[Disconnect] Player ${socket.id} left active game ${roomId}`);

                // Identify remaining player (winner)
                const opponent = game.players.find(p => p.socketId !== socket.id && p.id !== socket.id);

                if (opponent) {
                    // Notify opponent that they won because other disconnected
                    // Use playerId (stable ID) for winnerId
                    io.to(roomId).emit('opponent_disconnected', {
                        winnerId: opponent.playerId || opponent.id
                    });

                    // If tournament, handle progression
                    if (game.isTournamentMatch) {
                        handleTournamentMatchEnd(game, opponent.playerId || opponent.id);
                    }
                }

                // Cleanup game
                delete games[roomId];
            }
        });

        // Handle tournament cleanup if player was in a waiting tournament
        Object.keys(tournaments).forEach(tournamentId => {
            const tournament = tournaments[tournamentId];
            if (tournament.status === 'waiting') {
                // ... (existing logic)
            }
        });
    });

    const fs = require('fs');
    const path = require('path');
    const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

    // ... (keep existing code)

    socket.on('game_over', ({ roomId, score }) => {
        console.log(`[game_over] Received from ${socket.id}, Room: ${roomId}, Score: ${score}`);

        let playerInfo = null;
        let foundGameId = null;

        // Try to find player in active games
        Object.keys(games).forEach(gid => {
            const g = games[gid];
            const p = g.players.find(pl => pl.socketId === socket.id);
            if (p) {
                playerInfo = p;
                foundGameId = gid;
            }
        });

        if (!playerInfo) {
            console.log(`[game_over] WARNING: Player not found in any active game. Score not saved.`);
            return;
        }

        console.log(`[game_over] Found player ${playerInfo.name} in game ${foundGameId}. Saving score...`);

        if (score > 0) {
            try {
                // Read current data
                let data = { scores: [] };
                if (fs.existsSync(LEADERBOARD_FILE)) {
                    const fileContent = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
                    if (fileContent.trim()) {
                        data = JSON.parse(fileContent);
                    }
                }

                data.scores.push({
                    name: playerInfo.name,
                    score: score,
                    country: playerInfo.country || 'TR',
                    avatar: playerInfo.avatar,
                    date: Date.now()
                });

                fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(data, null, 2));
                console.log(`[game_over] Score saved to leaderboard.json`);
            } catch (e) {
                console.error("[game_over] Leaderboard Save Error:", e);
            }
        } else {
            console.log(`[game_over] Score is 0, skipping save.`);
        }
    });

    socket.on('get_leaderboard', () => {
        try {
            const data = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8'));
            const now = Date.now();
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            const oneMonth = 30 * 24 * 60 * 60 * 1000;

            const filterAndSort = (timeLimit) => {
                return data.scores
                    .filter(s => (now - s.date) < timeLimit)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10);
            };

            const allTime = data.scores.sort((a, b) => b.score - a.score).slice(0, 10);

            socket.emit('leaderboard_data', {
                weekly: filterAndSort(oneWeek),
                monthly: filterAndSort(oneMonth),
                allTime: allTime
            });
        } catch (e) {
            console.error("Leaderboard Read Error:", e);
            socket.emit('leaderboard_data', { weekly: [], monthly: [], allTime: [] });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Remove from queues
        for (const mode in queues) {
            queues[mode] = queues[mode].filter(p => p.socket.id !== socket.id);
        }

        // Check active games
        Object.keys(games).forEach(roomId => {
            const game = games[roomId];

            // Helper to get players array regardless of structure
            let playersArray = [];
            if (Array.isArray(game.players)) {
                playersArray = game.players;
            } else if (game.playersList && Array.isArray(game.playersList)) {
                playersArray = game.playersList;
            } else if (typeof game.players === 'object') {
                playersArray = Object.values(game.players);
            }

            const disconnectedPlayer = playersArray.find(p => p.socketId === socket.id);

            if (disconnectedPlayer) {
                console.log(`Player ${disconnectedPlayer.name} disconnected from room ${roomId}`);

                // Find opponent
                const opponent = playersArray.find(p => p.socketId !== socket.id);

                if (opponent && !opponent.isBot) {
                    console.log(`Notifying opponent ${opponent.name} (Socket: ${opponent.socketId})`);
                    io.to(opponent.socketId).emit('opponent_disconnected', {
                        winnerId: opponent.uid || opponent.playerId
                    });
                }

                // Tournament Specific Logic: Handle forfeit
                if (game.isTournamentMatch && opponent) {
                    console.log(`[Tournament] Match forfeit. Winner: ${opponent.name}`);
                    handleTournamentMatchEnd(game, opponent.uid);
                }

                // End game
                delete games[roomId];
            }
        });
    });

    // ========== TOURNAMENT HANDLERS ==========
    socket.on('get_tournaments', () => {
        const activeTournaments = Object.values(tournaments).filter(t => t.status !== 'finished');
        socket.emit('tournaments_list', activeTournaments);
    });

    socket.on('create_tournament', ({ size, creator }) => {
        const tournamentId = `tournament_${Date.now()}`;
        const tournament = {
            id: tournamentId,
            size,
            creator,
            players: [creator],
            status: 'waiting',
            bracket: [],
            createdAt: Date.now()
        };

        tournaments[tournamentId] = tournament;
        io.emit('tournaments_list', Object.values(tournaments).filter(t => t.status !== 'finished'));
        socket.emit('tournament_created', tournament);
        console.log(`Tournament created: ${tournamentId} (${size} players)`);
    });

    socket.on('join_tournament', ({ tournamentId, player }) => {
        const tournament = tournaments[tournamentId];

        if (!tournament) {
            socket.emit('error', { message: 'Turnuva bulunamadı' });
            return;
        }

        if (tournament.status !== 'waiting') {
            socket.emit('error', { message: 'Turnuva zaten başladı' });
            return;
        }

        if (tournament.players.length >= tournament.size) {
            socket.emit('error', { message: 'Turnuva dolu' });
            return;
        }

        if (tournament.players.some(p => p.uid === player.uid)) {
            socket.emit('error', { message: 'Zaten katıldınız' });
            return;
        }

        tournament.players.push(player);
        io.emit('tournaments_list', Object.values(tournaments).filter(t => t.status !== 'finished'));
        socket.emit('tournament_joined', tournament);

        if (tournament.players.length === tournament.size) {
            tournament.status = 'in_progress';
            io.emit('tournament_started', tournamentId);
            console.log(`Tournament ${tournamentId} started with ${tournament.size} players`);
            // TODO: Create bracket and start matches
            startTournament(tournamentId);
        }
    });

    socket.on('tournament_match_over', ({ roomId, winnerId }) => {
        const game = games[roomId];
        if (game && game.isTournamentMatch) {
            console.log(`[Tournament] Client reported match over: ${roomId}, Winner: ${winnerId}`);
            handleTournamentMatchEnd(game, winnerId);
        } else {
            console.log(`[Tournament] Warning: Match over reported for invalid/missing game: ${roomId}`);
            // Fallback: Try to find tournament and match manually?
            // For now, assume sync is correct.
        }
    });

    // ========== AUTO TOURNAMENT QUEUE ==========
    socket.on('join_tournament_queue', ({ size, player }) => {
        console.log(`[Tournament] Player ${player.name} requesting ${size}-player tournament`);

        let tournament = Object.values(tournaments).find(t => t.size === size && t.status === 'waiting');

        if (!tournament) {
            const tournamentId = `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            tournament = {
                id: tournamentId,
                size: size,
                players: [],
                status: 'waiting',
                bracket: [],
                createdAt: Date.now()
            };
            tournaments[tournamentId] = tournament;
            console.log(`[Tournament] Created new ${size}-player tournament: ${tournamentId}`);
        }

        const isAlreadyIn = tournament.players.some(p => p.uid === player.uid);
        if (!isAlreadyIn) {
            tournament.players.push(player);
            socket.join(tournament.id);
        }

        io.to(tournament.id).emit('tournament_update', tournament);
        socket.emit('tournament_joined_success', tournament);

        console.log(`[Tournament] ${tournament.id} - Players: ${tournament.players.length}/${tournament.size}`);

        if (tournament.players.length >= tournament.size) {
            tournament.status = 'in_progress';
            io.to(tournament.id).emit('tournament_started', tournament);
            console.log(`[Tournament] ${tournament.id} STARTED!`);
            startTournament(tournament.id);
        }
    });

    socket.on('leave_tournament', ({ tournamentId, playerId }) => {
        const tournament = tournaments[tournamentId];
        if (tournament && tournament.status === 'waiting') {
            tournament.players = tournament.players.filter(p => p.uid !== playerId);
            socket.leave(tournamentId);

            io.to(tournamentId).emit('tournament_update', tournament);

            if (tournament.players.length === 0) {
                delete tournaments[tournamentId];
            }
        }
    });

    // ========== APPROVAL-BASED TOURNAMENT ==========
    socket.on('create_tournament', ({ size, creator }) => {
        // Check if creator already has an active tournament
        const existingTournament = Object.values(tournaments).find(
            t => t.status === 'waiting' && t.creator.uid === creator.uid
        );

        if (existingTournament) {
            socket.emit('error', { message: 'Zaten aktif bir turnuvanız var' });
            return;
        }

        const tournamentId = `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tournament = {
            id: tournamentId,
            size: size,
            creator: creator,
            players: [creator],
            pendingRequests: [],
            status: 'waiting',
            bracket: [],
            createdAt: Date.now()
        };

        tournaments[tournamentId] = tournament;
        socket.join(tournamentId);

        socket.emit('tournament_created', tournament);

        // Broadcast to EVERYONE that a new tournament is available
        const currentList = Object.values(tournaments).filter(t => t.status === 'waiting');
        io.emit('tournament_list_update', currentList);

        console.log(`[Tournament] Created: ${tournamentId} by ${creator.name}. Total active: ${currentList.length}`);
    });

    socket.on('get_tournaments', () => {
        const availableTournaments = Object.values(tournaments).filter(t => t.status === 'waiting');
        socket.emit('tournament_list_update', availableTournaments);
        console.log(`[Tournament] Sent list to ${socket.id}. Count: ${availableTournaments.length}`);
    });

    socket.on('request_join_tournament', ({ tournamentId, player }) => {
        console.log(`[Tournament] ========== SKIP APPROVAL JOIN ==========`);
        console.log(`[Tournament] Tournament ID: ${tournamentId}, Player: ${player.name}`);

        const tournament = tournaments[tournamentId];

        if (!tournament || tournament.status !== 'waiting') return;

        // Prevent duplicates
        if (tournament.players.some(p => p.uid === player.uid)) return;

        // Check if full
        if (tournament.players.length >= tournament.size) {
            socket.emit('tournament_full');
            return;
        }

        // Add player directly (bypass pendingRequests)
        player.socketId = socket.id; // Ensure socketId is up to date
        tournament.players.push(player);
        socket.join(tournamentId);

        console.log(`[Tournament] ${player.name} joined ${tournamentId}. (${tournament.players.length}/${tournament.size})`);

        // Notify everyone
        io.to(tournamentId).emit('tournament_update', tournament);
        socket.emit('tournament_joined_success', tournament); // Tell client they are IN

        // Check start condition
        if (tournament.players.length >= tournament.size) {
            startTournament(tournamentId);
        }

        // Update global list
        io.emit('tournament_list_update', Object.values(tournaments).filter(t => t.status === 'waiting'));
    });

    socket.on('approve_join_request', ({ tournamentId, playerUid }) => {
        const tournament = tournaments[tournamentId];
        if (!tournament) return;

        const requestIndex = tournament.pendingRequests.findIndex(r => r.player.uid === playerUid);
        if (requestIndex === -1) return;

        const request = tournament.pendingRequests[requestIndex];
        tournament.players.push(request.player);
        tournament.pendingRequests.splice(requestIndex, 1);

        io.to(tournamentId).emit('tournament_update', tournament);

        if (tournament.players.length >= tournament.size) {
            startTournament(tournamentId);
        }
    });

    socket.on('reject_join_request', ({ tournamentId, playerUid }) => {
        const tournament = tournaments[tournamentId];
        if (!tournament) return;

        const requestIndex = tournament.pendingRequests.findIndex(r => r.player.uid === playerUid);
        if (requestIndex !== -1) {
            tournament.pendingRequests.splice(requestIndex, 1);
            io.to(tournamentId).emit('tournament_update', tournament);
        }
    });

    // Join a specific match (for tournaments)
    socket.on('join_match', ({ roomId }) => {
        const game = games[roomId];
        if (!game) {
            console.log(`[Match] Room ${roomId} not found`);
            return;
        }

        socket.join(roomId);
        socket.emit('match_found', game);
        console.log(`[Match] Player joined room ${roomId}`);
    });

    socket.on('rejoin_tournament', ({ uid }) => {
        // Find if user is in any active tournament
        const activeTournament = Object.values(tournaments).find(t =>
            (t.status === 'waiting' || t.status === 'in_progress') &&
            t.players.some(p => p.uid === uid)
        );

        if (activeTournament) {
            console.log(`[Tournament] Player ${uid} rejoining tournament ${activeTournament.id}`);

            // Re-join socket room
            socket.join(activeTournament.id);

            // Update socketId record in TOURNAMENT
            const player = activeTournament.players.find(p => p.uid === uid);
            if (player) player.socketId = socket.id;

            // Check for active game and rejoin
            if (activeTournament.bracket) {
                const activeMatch = activeTournament.bracket.find(m =>
                    m.status === 'in_progress' && m.players && m.players.some(p => p.uid === uid)
                );

                if (activeMatch) {
                    const game = games[activeMatch.roomId];
                    if (game) {
                        console.log(`[Tournament] Also rejoining active game room: ${activeMatch.roomId}`);
                        socket.join(activeMatch.roomId);

                        // Update socketId in game.playersList (Array)
                        if (game.playersList) {
                            const pList = game.playersList.find(p => p.uid === uid);
                            if (pList) pList.socketId = socket.id;
                        }

                        // Update socketId in game.players (Object Map)
                        if (game.players && !Array.isArray(game.players) && game.players[uid]) {
                            game.players[uid].socketId = socket.id;
                        }
                    }
                }
            }

            // Send full details
            socket.emit('tournament_rejoined', { tournament: activeTournament });
        } else {
            console.log(`[Tournament] Rejoin failed. No active tournament found for ${uid}`);
            socket.emit('tournament_rejoined', { tournament: null });
        }
    });

    socket.on('get_tournament_info', ({ tournamentId }) => {
        const tournament = tournaments[tournamentId];
        if (tournament) {
            socket.emit('tournament_info', tournament);
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
