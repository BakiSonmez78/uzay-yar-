// Private Room System for Friend-to-Friend Matches
// Generates 4-character alphanumeric room codes

const privateRooms = {}; // { roomCode: { host, guest, gameMode, roomId, status } }

// Generate random 4-character room code
const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (I, O, 0, 1)
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Find unique room code
const getUniqueRoomCode = () => {
    let code;
    let attempts = 0;
    do {
        code = generateRoomCode();
        attempts++;
        if (attempts > 100) {
            throw new Error('Failed to generate unique room code');
        }
    } while (privateRooms[code]);
    return code;
};

const setupPrivateRoomHandlers = (io, socket, games, generateQuestions) => {

    // Create private room
    socket.on('create_private_room', ({ playerId, playerName, avatar, gameMode }) => {
        try {
            const roomCode = getUniqueRoomCode();
            const roomId = `private_${roomCode}`;

            privateRooms[roomCode] = {
                code: roomCode,
                roomId: roomId,
                host: {
                    id: playerId,
                    socketId: socket.id,
                    name: playerName,
                    avatar: avatar
                },
                guest: null,
                gameMode: gameMode,
                status: 'waiting',
                createdAt: Date.now()
            };

            socket.join(roomId);

            console.log(`[PrivateRoom] Created room ${roomCode} by ${playerName}`);

            socket.emit('private_room_created', { roomCode });

        } catch (error) {
            console.error('[PrivateRoom] Error creating room:', error);
            socket.emit('private_room_error', { message: 'Oda oluşturulamadı. Tekrar deneyin.' });
        }
    });

    // Join private room
    socket.on('join_private_room', ({ roomCode, playerId, playerName, avatar }) => {
        const room = privateRooms[roomCode];

        if (!room) {
            socket.emit('private_room_error', { message: 'Oda bulunamadı. Kodu kontrol edin.' });
            return;
        }

        if (room.status !== 'waiting') {
            socket.emit('private_room_error', { message: 'Bu oda dolu veya oyun başlamış.' });
            return;
        }

        if (room.host.id === playerId) {
            socket.emit('private_room_error', { message: 'Kendi odanıza katılamazsınız.' });
            return;
        }

        // Add guest
        room.guest = {
            id: playerId,
            socketId: socket.id,
            name: playerName,
            avatar: avatar
        };
        room.status = 'ready';

        socket.join(room.roomId);

        console.log(`[PrivateRoom] ${playerName} joined room ${roomCode}`);

        // Create game
        const questions = generateQuestions(room.gameMode);
        const players = {
            [room.host.id]: {
                ...room.host,
                score: 0,
                lives: 5
            },
            [room.guest.id]: {
                ...room.guest,
                score: 0,
                lives: 5
            }
        };

        games[room.roomId] = {
            roomId: room.roomId,
            questions,
            currentIndex: 0,
            scores: {
                [room.host.id]: 0,
                [room.guest.id]: 0
            },
            streaks: {
                [room.host.id]: 0,
                [room.guest.id]: 0
            },
            players,
            playersList: [room.host, room.guest],
            isPrivateRoom: true,
            startTime: Date.now(),
            duration: 90
        };

        // Notify both players
        io.to(room.roomId).emit('private_room_joined', {
            roomId: room.roomId,
            players,
            gameMode: room.gameMode
        });

        console.log(`[PrivateRoom] Game starting in room ${roomCode}`);
    });

    // Handle disconnect - clean up private rooms
    socket.on('disconnect', () => {
        // Find and clean up any private rooms where this socket was host or guest
        Object.keys(privateRooms).forEach(code => {
            const room = privateRooms[code];
            if (room.host.socketId === socket.id || room.guest?.socketId === socket.id) {
                console.log(`[PrivateRoom] Cleaning up room ${code} due to disconnect`);
                delete privateRooms[code];
            }
        });
    });

    // Clean up old rooms (older than 10 minutes)
    setInterval(() => {
        const now = Date.now();
        Object.keys(privateRooms).forEach(code => {
            const room = privateRooms[code];
            if (now - room.createdAt > 10 * 60 * 1000) {
                console.log(`[PrivateRoom] Cleaning up expired room ${code}`);
                delete privateRooms[code];
            }
        });
    }, 60000); // Check every minute
};

module.exports = { setupPrivateRoomHandlers, privateRooms };
