import React, { useState, useEffect } from 'react';

export default function PrivateRoom({ socket, userData, onBack, onRoomCreated, onRoomJoined }) {
    const [mode, setMode] = useState('menu'); // 'menu', 'create', 'join'
    const [roomCode, setRoomCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState('');
    const [selectedGameMode, setSelectedGameMode] = useState('+');
    const [activeTab, setActiveTab] = useState('basic'); // 'basic' or 'advanced'

    const gameModes = [
        { id: '+', label: 'Toplama', icon: '+', category: 'basic' },
        { id: '-', label: 'Çıkartma', icon: '-', category: 'basic' },
        { id: '*', label: 'Çarpma', icon: '×', category: 'basic' },
        { id: '/', label: 'Bölme', icon: '÷', category: 'basic' },
        { id: 'mixed', label: 'Karışık', icon: '?', category: 'basic' },
        { id: 'fractions_add', label: 'Kesir Toplama', icon: '½+¼', category: 'advanced' },
        { id: 'fractions_compare', label: 'Kesir Karşılaştırma', icon: '½>¼', category: 'advanced' },
        { id: 'percentages', label: 'Yüzdeler', icon: '%', category: 'advanced' },
        { id: 'area_rectangle', label: 'Alan', icon: '□', category: 'advanced' },
        { id: 'perimeter', label: 'Çevre', icon: '⬜', category: 'advanced' },
        { id: 'word_problems', label: 'Sözel Problemler', icon: '📝', category: 'advanced' },
        { id: 'time', label: 'Saat', icon: '🕐', category: 'advanced' },
        { id: 'patterns', label: 'Örüntüler', icon: '🔢', category: 'advanced' },
    ];

    const activeModes = gameModes.filter(m => m.category === activeTab);

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

                    {/* Tab Navigation */}
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '1rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '0.3rem',
                        borderRadius: '12px'
                    }}>
                        <button
                            onClick={() => {
                                setActiveTab('basic');
                                setSelectedGameMode('+'); // Reset to first basic mode
                            }}
                            style={{
                                flex: 1,
                                padding: '0.6rem 1rem',
                                background: activeTab === 'basic'
                                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                                    : 'transparent',
                                border: 'none',
                                borderRadius: '10px',
                                color: 'white',
                                fontWeight: activeTab === 'basic' ? 'bold' : 'normal',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                fontSize: '0.9rem',
                                boxShadow: activeTab === 'basic' ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none'
                            }}
                        >
                            ➕ 4 İşlem
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('advanced');
                                setSelectedGameMode('fractions_add'); // Reset to first advanced mode
                            }}
                            style={{
                                flex: 1,
                                padding: '0.6rem 1rem',
                                background: activeTab === 'advanced'
                                    ? 'linear-gradient(135deg, #10b981, #059669)'
                                    : 'transparent',
                                border: 'none',
                                borderRadius: '10px',
                                color: 'white',
                                fontWeight: activeTab === 'advanced' ? 'bold' : 'normal',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                fontSize: '0.9rem',
                                boxShadow: activeTab === 'advanced' ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 'none'
                            }}
                        >
                            🎓 İleri Seviye
                        </button>
                    </div>

                    {/* Mode Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
                        {activeModes.map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedGameMode(mode.id)}
                                className={selectedGameMode === mode.id ? 'primary' : 'secondary'}
                                style={{
                                    padding: '1rem 0.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: selectedGameMode === mode.id
                                        ? (activeTab === 'basic'
                                            ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                                            : 'linear-gradient(135deg, #10b981, #059669)')
                                        : (activeTab === 'basic'
                                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))'
                                            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))'),
                                    border: selectedGameMode === mode.id
                                        ? 'none'
                                        : (activeTab === 'basic'
                                            ? '1px solid rgba(59, 130, 246, 0.3)'
                                            : '1px solid rgba(16, 185, 129, 0.3)'),
                                    borderRadius: '10px',
                                    minHeight: '90px'
                                }}
                            >
                                <span style={{ fontSize: '1.8rem' }}>{mode.icon}</span>
                                <span style={{ fontSize: '0.85rem', textAlign: 'center' }}>{mode.label}</span>
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
