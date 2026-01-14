import React from 'react';
import { soundManager } from '../utils/soundManager';

export default function Lobby({ name, avatar, onSelectMode }) {
    const [opponentType, setOpponentType] = React.useState('human'); // 'human' or 'bot'
    const [botDifficulty, setBotDifficulty] = React.useState('medium'); // 'easy', 'medium', 'hard'
    const [, forceUpdate] = React.useState(0); // For re-rendering when sound settings change

    const modes = [
        { id: '+', label: 'Toplama', icon: '+' },
        { id: '-', label: 'Çıkartma', icon: '-' },
        { id: '*', label: 'Çarpma', icon: '×' },
        { id: '/', label: 'Bölme', icon: '÷' },
        { id: 'mixed', label: 'Karışık', icon: '?' },
    ];

    return (
        <div className="card fade-in" style={{ position: 'relative' }}>
            {/* Audio Controls - Top Right */}
            <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                gap: '0.5rem',
                zIndex: 10
            }}>
                <button
                    onClick={() => {
                        soundManager.toggleMusic();
                        forceUpdate(n => n + 1);
                    }}
                    className="secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '1rem', borderRadius: '8px' }}
                    title="Müziği Aç/Kapat"
                >
                    {soundManager.musicMuted ? '🔇' : '🎵'}
                </button>
                <button
                    onClick={() => {
                        soundManager.toggleSfx();
                        forceUpdate(n => n + 1);
                    }}
                    className="secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '1rem', borderRadius: '8px' }}
                    title="Ses Efektlerini Aç/Kapat"
                >
                    {soundManager.sfxMuted ? '🔇' : '🔊'}
                </button>
            </div>

            <div className="avatar">{avatar}</div>
            <h2>Merhaba, {name}!</h2>

            <div style={{ marginBottom: '2rem' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Rakibini Seç:</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button
                        className={opponentType === 'human' ? 'primary' : 'secondary'}
                        onClick={() => setOpponentType('human')}
                        style={{ flex: 1 }}
                    >
                        🌍 Gerçek Oyuncu
                    </button>
                    <button
                        className={opponentType === 'bot' ? 'primary' : 'secondary'}
                        onClick={() => setOpponentType('bot')}
                        style={{ flex: 1 }}
                    >
                        💻 Bilgisayar
                    </button>
                </div>
            </div>

            {/* Bot Difficulty Selection */}
            {opponentType === 'bot' && (
                <div style={{ marginBottom: '2rem' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Zorluk Seviyesi:</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button
                            className={botDifficulty === 'easy' ? 'primary' : 'secondary'}
                            onClick={() => setBotDifficulty('easy')}
                            style={{ flex: 1, fontSize: '0.9rem' }}
                        >
                            😊 Kolay
                        </button>
                        <button
                            className={botDifficulty === 'medium' ? 'primary' : 'secondary'}
                            onClick={() => setBotDifficulty('medium')}
                            style={{ flex: 1, fontSize: '0.9rem' }}
                        >
                            😐 Orta
                        </button>
                        <button
                            className={botDifficulty === 'hard' ? 'primary' : 'secondary'}
                            onClick={() => setBotDifficulty('hard')}
                            style={{ flex: 1, fontSize: '0.9rem' }}
                        >
                            😈 Zor
                        </button>
                    </div>
                </div>
            )}

            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Hangi işlemde yarışmak istersin?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {modes.map(mode => (
                    <button
                        key={mode.id}
                        onClick={() => onSelectMode(mode.id, opponentType, botDifficulty)}
                        className="secondary"
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{mode.icon}</span>
                        <span>{mode.label}</span>
                    </button>
                ))}
            </div>

            {/* Back Button */}
            <button
                onClick={() => window.location.reload()}
                className="secondary"
                style={{
                    marginTop: '2rem',
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer'
                }}
            >
                ← Geri Dön
            </button>
        </div>
    );
}
