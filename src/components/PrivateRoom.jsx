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
        socket.on('private_room_created', ({ roomCode: code }) => {
            console.log('[PrivateRoom] Room created:', code);
            setRoomCode(code);
            setWaiting(true);
        });

        socket.on('private_room_joined', (data) => {
            console.log('[PrivateRoom] Opponent joined!', data);
            onRoomJoined(data);
        });

        socket.on('private_room_join_success', (data) => {
            console.log('[PrivateRoom] Successfully joined room!', data);
            onRoomJoined(data);
        });

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

    // --- RENDER HELPERS ---
    const renderContent = () => {
        if (mode === 'menu') {
            return (
                <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                    <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '3rem', marginBottom: '0.5rem', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>🎮 Arkadaşınla Oyna</h2>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem' }}>
                            Oda oluştur veya arkadaşının odasına katıl
                        </p>
                    </div>

                    <div className="private-menu-grid">
                        <button
                            onClick={() => setMode('create')}
                            className="room-action-btn"
                            style={{
                                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                                boxShadow: '0 10px 30px -5px rgba(109, 40, 217, 0.5)'
                            }}
                        >
                            <div className="icon-wrapper">▶️</div>
                            <div className="text-wrapper">
                                <span className="title">Oda Oluştur</span>
                                <span className="desc">Kod al ve arkadaşını davet et</span>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('join')}
                            className="room-action-btn"
                            style={{
                                background: 'linear-gradient(135deg, #ec4899, #be185d)',
                                boxShadow: '0 10px 30px -5px rgba(190, 24, 93, 0.5)'
                            }}
                        >
                            <div className="icon-wrapper">👥</div>
                            <div className="text-wrapper">
                                <span className="title">Odaya Katıl</span>
                                <span className="desc">Arkadaşının oda kodunu gir</span>
                            </div>
                        </button>
                    </div>

                    <button
                        onClick={onBack}
                        style={{
                            marginTop: '3rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            padding: '1rem 3rem',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            alignSelf: 'center',
                            backdropFilter: 'blur(5px)',
                            transition: 'background 0.2s'
                        }}
                    >
                        ← Geri Dön
                    </button>

                    <style>{`
                        .private-menu-grid {
                            display: grid;
                            grid-template-columns: 1fr;
                            gap: 2rem;
                            width: 100%;
                        }
                        @media (min-width: 768px) {
                            .private-menu-grid {
                                grid-template-columns: 1fr 1fr;
                            }
                        }
                        .room-action-btn {
                            padding: 2.5rem;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            gap: 1.5rem;
                            border: none;
                            border-radius: 30px;
                            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                            cursor: pointer;
                            color: white;
                            position: relative;
                            overflow: hidden;
                        }
                        .room-action-btn:hover {
                            transform: translateY(-10px) scale(1.02);
                            filter: brightness(1.1);
                        }
                        .room-action-btn:active {
                            transform: translateY(-2px);
                        }
                        .icon-wrapper {
                            font-size: 4rem;
                            background: rgba(255,255,255,0.2);
                            width: 100px;
                            height: 100px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                        }
                        .text-wrapper {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 0.5rem;
                        }
                        .title {
                            font-size: 1.8rem;
                            fontWeight: 800;
                        }
                        .desc {
                            font-size: 1rem;
                            opacity: 0.9;
                            text-align: center;
                            font-weight: 500;
                        }
                    `}</style>
                </div>
            );
        }

        if (mode === 'create') {
            if (waiting && roomCode) {
                return (
                    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎮 Oda Hazır!</h2>

                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '30px',
                            padding: '3rem 2rem',
                            margin: '2rem 0',
                            textAlign: 'center',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                        }}>
                            <p style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem' }}>
                                Oda Kodu
                            </p>
                            <div style={{
                                fontSize: '5rem',
                                fontWeight: '900',
                                letterSpacing: '0.5rem',
                                color: '#60a5fa',
                                fontFamily: 'monospace',
                                marginBottom: '2rem',
                                textShadow: '0 0 30px rgba(96, 165, 250, 0.4)'
                            }}>
                                {roomCode}
                            </div>
                            <div className="loader" style={{ margin: '0 auto 1.5rem auto' }}></div>
                            <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)' }}>
                                Arkadaşının katılması bekleniyor...
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={handleCopyCode}
                                className="primary"
                                style={{ flex: 1, fontSize: '1.1rem', padding: '1.2rem', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                            >
                                📋 Kodu Kopyala
                            </button>
                            <button
                                onClick={() => {
                                    setMode('menu');
                                    setWaiting(false);
                                    setRoomCode('');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '1.2rem',
                                    borderRadius: '16px',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                    cursor: 'pointer',
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                İptal Et
                            </button>
                        </div>
                    </div>
                );
            }

            return (
                <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '2rem', margin: 0 }}>🎮 Oyun Modu Seç</h2>
                        <button onClick={() => setMode('menu')} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer', opacity: 0.7 }}>
                            ✕ İptal
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
                        <button
                            onClick={() => { setActiveTab('basic'); setSelectedGameMode('+'); }}
                            style={{
                                padding: '1rem 2rem',
                                background: activeTab === 'basic' ? 'white' : 'rgba(255,255,255,0.1)',
                                color: activeTab === 'basic' ? '#1e293b' : 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                flex: 1,
                                maxWidth: '200px',
                                transition: 'all 0.2s'
                            }}
                        >
                            ➕ 4 İşlem
                        </button>
                        <button
                            onClick={() => { setActiveTab('advanced'); setSelectedGameMode('fractions_add'); }}
                            style={{
                                padding: '1rem 2rem',
                                background: activeTab === 'advanced' ? 'white' : 'rgba(255,255,255,0.1)',
                                color: activeTab === 'advanced' ? '#1e293b' : 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                flex: 1,
                                maxWidth: '200px',
                                transition: 'all 0.2s'
                            }}
                        >
                            🎓 İleri Seviye
                        </button>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: '1rem',
                        maxHeight: '60vh',
                        overflowY: 'auto',
                        padding: '0.5rem'
                    }}>
                        {activeModes.map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedGameMode(mode.id)}
                                style={{
                                    padding: '1.5rem 1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    background: selectedGameMode === mode.id
                                        ? (activeTab === 'basic' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #10b981, #059669)')
                                        : 'rgba(255,255,255,0.05)',
                                    border: selectedGameMode === mode.id ? '2px solid white' : '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '20px',
                                    minHeight: '140px',
                                    transition: 'transform 0.2s',
                                    cursor: 'pointer',
                                    color: 'white',
                                    boxShadow: selectedGameMode === mode.id ? '0 10px 25px -5px rgba(0,0,0,0.5)' : 'none',
                                    transform: selectedGameMode === mode.id ? 'scale(1.02)' : 'scale(1)'
                                }}
                            >
                                <span style={{ fontSize: '2.5rem' }}>{mode.icon}</span>
                                <span style={{ fontSize: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{mode.label}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleCreateRoom}
                        style={{
                            width: '100%',
                            padding: '1.5rem',
                            marginTop: '2rem',
                            fontSize: '1.3rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            boxShadow: '0 10px 30px rgba(109, 40, 217, 0.4)',
                            transition: 'transform 0.1s'
                        }}
                    >
                        🚀 Odayı Oluştur
                    </button>
                </div>
            );
        }

        if (mode === 'join') {
            return (
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👥 Odaya Katıl</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '3rem', fontSize: '1.2rem' }}>
                        Arkadaşının gönderdiği oda kodunu gir
                    </p>

                    <input
                        type="text"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        placeholder="KODU GİR"
                        maxLength={4}
                        style={{
                            width: '100%',
                            padding: '1.5rem',
                            fontSize: '4rem',
                            textAlign: 'center',
                            letterSpacing: '1.5rem',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            background: 'rgba(0, 0, 0, 0.2)',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '24px',
                            color: 'white',
                            marginBottom: '2rem',
                            outline: 'none',
                            boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.3)'
                        }}
                    />

                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid #ef4444',
                            borderRadius: '12px',
                            padding: '1rem',
                            marginBottom: '2rem',
                            color: '#ef4444'
                        }}>
                            {error}
                        </div>
                    )}

                    {waiting ? (
                        <div style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '20px',
                            padding: '2rem',
                            marginBottom: '1rem',
                            color: '#3b82f6',
                            fontSize: '1.2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            <div className="loader" style={{ marginBottom: '1rem' }}></div>
                            ⏳ Odaya Bağlanılıyor...
                        </div>
                    ) : (
                        <button
                            onClick={handleJoinRoom}
                            style={{
                                width: '100%',
                                marginBottom: '1rem',
                                padding: '1.5rem',
                                fontSize: '1.3rem',
                                fontWeight: 'bold',
                                background: !inputCode.trim() ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #ec4899, #be185d)',
                                color: !inputCode.trim() ? 'rgba(255,255,255,0.3)' : 'white',
                                border: 'none',
                                borderRadius: '20px',
                                cursor: !inputCode.trim() ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: !inputCode.trim() ? 'none' : '0 10px 30px rgba(190, 24, 93, 0.4)'
                            }}
                            disabled={!inputCode.trim()}
                        >
                            Odaya Katıl
                        </button>
                    )}

                    <button
                        onClick={() => setMode('menu')}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '1.1rem',
                            cursor: 'pointer'
                        }}
                        disabled={waiting}
                    >
                        İptal
                    </button>
                </div>
            );
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle at 50% 0%, #172554 0%, #020617 100%)',
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem',
            overflowY: 'auto',
            fontFamily: '"Outfit", sans-serif'
        }}>
            {renderContent()}
        </div>
    );
}
