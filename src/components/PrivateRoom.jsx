import React, { useState, useEffect } from 'react';

export default function PrivateRoom({ socket, userData, onBack, onRoomCreated, onRoomJoined }) {
    const [mode, setMode] = useState('menu'); // 'menu', 'create', 'join'
    const [roomCode, setRoomCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState('');
    const [selectedGameMode, setSelectedGameMode] = useState('+');

    const gameModes = [
        { id: '+', label: 'Toplama', icon: '+' },
        { id: '-', label: 'Çıkartma', icon: '-' },
        { id: '*', label: 'Çarpma', icon: '×' },
        { id: '/', label: 'Bölme', icon: '÷' },
        { id: 'mixed', label: 'Karışık', icon: '?' },
    ];

    useEffect(() => {
        // Listen for room creation
        socket.on('private_room_created', ({ roomCode: code }) => {
            console.log('[PrivateRoom] Room created:', code);
            setRoomCode(code);
            setWaiting(true);
        });

        // Listen for opponent joining
        socket.on('private_room_joined', (data) => {
            console.log('[PrivateRoom] Opponent joined!', data);
            onRoomJoined(data);
        });

        // Listen for room join success
        socket.on('private_room_join_success', (data) => {
            console.log('[PrivateRoom] Successfully joined room!', data);
            onRoomJoined(data);
        });

        // Listen for errors
        socket.on('private_room_error', ({ message }) => {
            console.error('[PrivateRoom] Error:', message);
            setError(message);
            setWaiting(false);
        });

        return () => {
            socket.off('private_room_created');
            socket.off('private_room_joined');
            socket.off('private_room_join_success');
            socket.off('private_room_error');
        };
    }, [socket, onRoomJoined]);

    const handleCreateRoom = () => {
        setError('');
        console.log('[PrivateRoom] Creating room with mode:', selectedGameMode);
        socket.emit('create_private_room', {
            playerId: userData.uid,
            playerName: userData.name,
            avatar: userData.avatar,
            gameMode: selectedGameMode
        });
    };

    const handleJoinRoom = () => {
        if (!inputCode.trim()) {
            setError('Lütfen oda kodunu girin');
            return;
        }
        setError('');
        setWaiting(true);
        console.log('[PrivateRoom] Joining room:', inputCode);
        socket.emit('join_private_room', {
            roomCode: inputCode.toUpperCase(),
            playerId: userData.uid,
            playerName: userData.name,
            avatar: userData.avatar
        });
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomCode);
        alert('Oda kodu kopyalandı! Arkadaşına gönder: ' + roomCode);
    };

    if (mode === 'menu') {
        return (
            <div className="card fade-in">
                <h2>🎮 Arkadaşınla Oyna</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Oda oluştur veya arkadaşının odasına katıl
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        onClick={() => setMode('create')}
                        className="primary"
                        style={{
                            padding: '1.5rem',
                            fontSize: '1.1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span style={{ fontSize: '2rem' }}>▶️</span>
                        <span>Oda Oluştur</span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            Kod al ve arkadaşını davet et
                        </span>
                    </button>

                    <button
                        onClick={() => setMode('join')}
                        className="secondary"
                        style={{
                            padding: '1.5rem',
                            fontSize: '1.1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span style={{ fontSize: '2rem' }}>👥</span>
                        <span>Odaya Katıl</span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            Arkadaşının oda kodunu gir
                        </span>
                    </button>
                </div>

                <button onClick={onBack} className="secondary" style={{ marginTop: '2rem', width: '100%' }}>
                    ← Geri Dön
                </button>
            </div>
        );
    }

    if (mode === 'create') {
        if (waiting && roomCode) {
            return (
                <div className="card fade-in">
                    <h2>🎮 Oda Oluşturuldu!</h2>

                    <div style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '2px solid #3b82f6',
                        borderRadius: '15px',
                        padding: '2rem',
                        margin: '2rem 0',
                        textAlign: 'center'
                    }}>
                        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                            Oda Kodu:
                        </p>
                        <div style={{
                            fontSize: '3rem',
                            fontWeight: 'bold',
                            letterSpacing: '0.5rem',
                            color: '#3b82f6',
                            fontFamily: 'monospace'
                        }}>
                            {roomCode}
                        </div>
                        <button
                            onClick={handleCopyCode}
                            className="primary"
                            style={{ marginTop: '1rem', fontSize: '0.9rem' }}
                        >
                            📋 Kodu Kopyala
                        </button>
                    </div>

                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px',
                        padding: '1rem',
                        marginBottom: '2rem'
                    }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            ⏳ Arkadaşının katılması bekleniyor...
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Oyun Modu: {gameModes.find(m => m.id === selectedGameMode)?.label}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setMode('menu');
                            setWaiting(false);
                            setRoomCode('');
                        }}
                        className="secondary"
                        style={{ width: '100%' }}
                    >
                        İptal Et
                    </button>
                </div>
            );
        }

        return (
            <div className="card fade-in">
                <h2>🎮 Oda Oluştur</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Oyun modunu seç ve oda oluştur
                </p>

                <div style={{ marginBottom: '2rem' }}>
                    <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Oyun Modu:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {gameModes.map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedGameMode(mode.id)}
                                className={selectedGameMode === mode.id ? 'primary' : 'secondary'}
                                style={{
                                    padding: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>{mode.icon}</span>
                                <span style={{ fontSize: '0.9rem' }}>{mode.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        color: '#ef4444'
                    }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleCreateRoom}
                    className="primary"
                    style={{ width: '100%', marginBottom: '1rem' }}
                >
                    Oda Oluştur
                </button>

                <button
                    onClick={() => setMode('menu')}
                    className="secondary"
                    style={{ width: '100%' }}
                >
                    ← Geri
                </button>
            </div>
        );
    }

    if (mode === 'join') {
        return (
            <div className="card fade-in">
                <h2>👥 Odaya Katıl</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Arkadaşının oda kodunu gir
                </p>

                <div style={{ marginBottom: '2rem' }}>
                    <input
                        type="text"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        placeholder="Oda Kodu (örn: A1B2)"
                        maxLength={4}
                        style={{
                            width: '100%',
                            padding: '1.5rem',
                            fontSize: '2rem',
                            textAlign: 'center',
                            letterSpacing: '0.5rem',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '10px',
                            color: 'white'
                        }}
                    />
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        color: '#ef4444'
                    }}>
                        {error}
                    </div>
                )}

                {waiting && (
                    <div style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        color: '#3b82f6'
                    }}>
                        ⏳ Odaya katılınıyor...
                    </div>
                )}

                <button
                    onClick={handleJoinRoom}
                    className="primary"
                    style={{ width: '100%', marginBottom: '1rem' }}
                    disabled={waiting || !inputCode.trim()}
                >
                    {waiting ? 'Katılınıyor...' : 'Odaya Katıl'}
                </button>

                <button
                    onClick={() => setMode('menu')}
                    className="secondary"
                    style={{ width: '100%' }}
                    disabled={waiting}
                >
                    ← Geri
                </button>
            </div>
        );
    }

    return null;
}
