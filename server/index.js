const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Version 1.0.7 - Fixed pendingRequests bug
const app = express();
app.use(cors());

const requestIp = require('request-ip');

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

const io = new Server(server, {
    cors: {
        origin: [
            "https://math-games-6c136.web.app",
            "https://math-games-6c136.firebaseapp.com",
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
const startGame = (roomId, mode, players, isBotGame = false) => {
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
        startBotLoop(roomId);
    }
};

const startBotLoop = (roomId, difficulty = 'medium') => {
    const game = games[roomId];
    if (!game) return;

    // Difficulty settings
    const difficultySettings = {
        easy: { minTime: 4000, maxTime: 7000, accuracy: 0.60 },
        medium: { minTime: 2500, maxTime: 5000, accuracy: 0.75 },
        hard: { minTime: 1000, maxTime: 3000, accuracy: 0.90 }
    };

    const settings = difficultySettings[difficulty] || difficultySettings.medium;

    // Recursive bot turn function
    const nextBotTurn = () => {
        const currentGame = games[roomId];
        if (!currentGame) return; // Game over

        // Determine bot reaction time based on difficulty
        const reactionTime = Math.random() * (settings.maxTime - settings.minTime) + settings.minTime;

        setTimeout(() => {
            const liveGame = games[roomId];
            // Verify game state is still valid and index hasn't changed while waiting
            if (!liveGame) return;

            // Bot attempts to solve CURRENT question
            const isCorrect = Math.random() < settings.accuracy;

            if (isCorrect) {
                // Simulate Bot "Clicking" Correct Answer
                const q = liveGame.questions[liveGame.currentIndex];
                if (q) {
                    // Bot uses fixed ID 'bot-1'
                    handleAnswer(roomId, 'bot-1', liveGame.currentIndex, q.answer);
                }
            } else {
                // Bot checks wrong
                nextBotTurn();
            }
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
        // "3 seride 3 puan, 4 seride 4 puan gibi"
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

    socket.on('join_queue', async ({ name, avatar, mode, matchType, playerId }) => {
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
            ], true);
        } else {
            // Safety check
            if (!queues[mode]) {
                console.warn(`[join_queue] Unknown mode ${mode}, initializing queue.`);
                queues[mode] = [];
            }

            console.log(`[join_queue] Queue for ${mode} has ${queues[mode].length} players.`);

            if (queues[mode].length > 0) {
                const opponent = queues[mode].shift();

                // Prevent self-matching (unlikely but possible with weird network glitches)
                if (opponent.socket.id === socket.id) {
                    console.log(`[join_queue] Skipped self-match, putting back in queue.`);
                    queues[mode].push(opponent);
                    queues[mode].push({ socket, playerId: stableId, name, avatar, joinedAt: Date.now(), country });
                    return;
                }

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

    socket.on('disconnect', () => {
        console.log(`[Disconnect] Client ${socket.id} disconnected.`);

        // Remove from matchmaking queues
        for (const mode in queues) {
            queues[mode] = queues[mode].filter(p => p.socket.id !== socket.id);
        }

        // Handle tournament cleanup if player was in a waiting tournament
        Object.keys(tournaments).forEach(tournamentId => {
            const tournament = tournaments[tournamentId];
            if (tournament.status === 'waiting') {
                // If creator disconnected, we could delete the tournament, 
                // but let's just log for now to see if it's necessary.
                // For now, let's keep it but maybe remove from participants if we had a way to map socket.id to uid easily.
                // Since uid is stored, we'd need to track socketId mappings.
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
            const disconnectedPlayer = game.players.find(p => p.socketId === socket.id);

            if (disconnectedPlayer) {
                console.log(`Player ${disconnectedPlayer.name} disconnected from room ${roomId}`);

                // Find opponent
                const opponent = game.players.find(p => p.socketId !== socket.id);
                if (opponent && !opponent.isBot) {
                    console.log(`Notifying opponent ${opponent.name} (Socket: ${opponent.socketId})`);
                    io.to(opponent.socketId).emit('opponent_disconnected', {
                        winnerId: opponent.playerId
                    });
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

        // Start tournament if full
        if (tournament.players.length === tournament.size) {
            tournament.status = 'in_progress';
            io.emit('tournament_started', tournamentId);
            console.log(`Tournament ${tournamentId} started with ${tournament.size} players`);
            // TODO: Create bracket and start matches
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
            
            // Update socketId record
            const player = activeTournament.players.find(p => p.uid === uid);
            if (player) player.socketId = socket.id;

            // Send full details
            socket.emit('tournament_rejoined', { tournament: activeTournament });
        } else {
            console.log(`[Tournament] Rejoin failed. No active tournament found for ${uid}`);
            socket.emit('tournament_rejoined', { tournament: null });
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
