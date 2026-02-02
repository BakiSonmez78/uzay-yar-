import React, { useState, useEffect } from 'react';
import { soundManager } from '../utils/soundManager';
import hedgehogImg from '../assets/hedgehog_pointing.png';

const AVATARS = ['⭐', '🚀', '🎮', '🎯', '🏆', '💎', '🔥', '⚡', '🌟', '🎨'];

export default function Menu({ userData, onStart, onShowLeaderboard, onShowTournament, onShowPrivateRoom, totalScore, onLogout }) {
    const [name, setName] = useState(userData?.name || '');
    const [selectedAvatar, setSelectedAvatar] = useState(userData?.avatar || '⭐');
    const [school, setSchool] = useState(userData?.school || '');
    const [showAvatars, setShowAvatars] = useState(false);

    useEffect(() => {
        soundManager.playMusic();
    }, []);

    return (
        <div style={{
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '2rem 1.5rem',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxSizing: 'border-box'
        }}>

            {/* Top Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                flexShrink: 0
            }}>
                {/* Score */}
                <div style={{
                    background: 'rgba(0,0,0,0.5)',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    border: '2px solid rgba(255,255,255,0.2)'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>🏆</span>
                    <span style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{totalScore}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={onShowLeaderboard} style={{
                        padding: '0.75rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }} title="Liderlik Tablosu">
                        📊
                    </button>
                    <button onClick={() => { soundManager.toggleMusic(); }} style={{
                        padding: '0.75rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }} title="Müzik">
                        {soundManager.musicMuted ? '🔇' : '🎵'}
                    </button>
                    <button onClick={() => { soundManager.toggleSfx(); }} style={{
                        padding: '0.75rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }} title="Ses Efektleri">
                        {soundManager.sfxMuted ? '🔇' : '🔊'}
                    </button>
                    {userData && !userData.isGuest && onLogout && (
                        <button onClick={onLogout} style={{
                            padding: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.3)',
                            border: '2px solid rgba(239, 68, 68, 0.5)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            width: '50px',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }} title="Çıkış Yap">
                            🚪
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content - Horizontal Layout */}
            <div style={{
                flex: 1,
                display: 'flex',
                gap: '3rem',
                minHeight: 0,
                overflow: 'hidden',
                alignItems: 'center'
            }}>

                {/* Left - Character */}
                <div style={{
                    flex: '0 0 350px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img
                        src={hedgehogImg}
                        alt="Hero"
                        style={{
                            width: '100%',
                            maxWidth: '350px',
                            filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))',
                            animation: 'breathe 3s ease-in-out infinite'
                        }}
                    />
                </div>

                {/* Right - Controls */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '1.5rem',
                    maxWidth: '500px'
                }}>

                    {/* Profile Section */}
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '20px',
                        padding: '1.5rem',
                        border: '2px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: showAvatars ? '1rem' : 0 }}>
                            <div
                                onClick={() => setShowAvatars(!showAvatars)}
                                style={{
                                    width: '70px',
                                    height: '70px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2.5rem',
                                    cursor: 'pointer',
                                    border: '4px solid white',
                                    flexShrink: 0,
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                                }}>
                                {selectedAvatar}
                            </div>

                            <div style={{
                                flex: 1,
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: '14px',
                                padding: '1rem 1.25rem',
                                fontSize: '1.3rem',
                                fontWeight: 'bold',
                                position: 'relative',
                                border: '2px solid rgba(255,255,255,0.1)'
                            }}>
                                {name || 'İsim Yok'}
                                <button
                                    onClick={() => {
                                        const newName = prompt('Yeni isminizi girin:', name);
                                        if (newName && newName.trim()) setName(newName.trim());
                                    }}
                                    style={{
                                        position: 'absolute',
                                        right: '0.75rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        padding: '0.5rem 0.75rem',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '2px solid rgba(255,255,255,0.2)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '1rem'
                                    }}
                                >
                                    ✏️
                                </button>
                            </div>
                        </div>

                        {showAvatars && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: '0.75rem',
                                marginTop: '1rem'
                            }}>
                                {AVATARS.map(a => (
                                    <button
                                        key={a}
                                        onClick={() => { setSelectedAvatar(a); setShowAvatars(false); }}
                                        style={{
                                            fontSize: '2rem',
                                            background: selectedAvatar === a ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                                            border: selectedAvatar === a ? '3px solid white' : '2px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            aspectRatio: '1',
                                            cursor: 'pointer',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {a}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Game Mode Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={() => { if (name.trim()) onStart(name, selectedAvatar, school, 'human'); }}
                            style={{
                                padding: '1.25rem',
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                border: 'none',
                                borderRadius: '16px',
                                color: 'white',
                                boxShadow: '0 6px 0 #1e40af, 0 10px 25px rgba(59, 130, 246, 0.4)',
                                cursor: 'pointer',
                                transition: 'transform 0.1s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem'
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'translateY(6px)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <span style={{ fontSize: '1.5rem' }}>🌍</span>
                            <span>Online Oyna</span>
                        </button>

                        <button
                            onClick={() => { if (name.trim()) onShowPrivateRoom(); }}
                            style={{
                                padding: '1.25rem',
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                border: 'none',
                                borderRadius: '16px',
                                color: 'white',
                                boxShadow: '0 6px 0 #b45309, 0 10px 25px rgba(245, 158, 11, 0.4)',
                                cursor: 'pointer',
                                transition: 'transform 0.1s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem'
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'translateY(6px)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <span style={{ fontSize: '1.5rem' }}>👥</span>
                            <span>Arkadaşınla Oyna</span>
                        </button>

                        <button
                            onClick={() => { if (name.trim()) onStart(name, selectedAvatar, school, 'bot'); }}
                            style={{
                                padding: '1.25rem',
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, #10b981, #047857)',
                                border: 'none',
                                borderRadius: '16px',
                                color: 'white',
                                boxShadow: '0 6px 0 #047857, 0 10px 25px rgba(16, 185, 129, 0.4)',
                                cursor: 'pointer',
                                transition: 'transform 0.1s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem'
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'translateY(6px)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <span style={{ fontSize: '1.5rem' }}>💻</span>
                            <span>Bilgisayara Karşı</span>
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes breathe {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
            `}</style>
        </div>
    );
}
