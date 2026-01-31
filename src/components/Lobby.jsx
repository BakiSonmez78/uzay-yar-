import React from 'react';
import { soundManager } from '../utils/soundManager';

export default function Lobby({ name, avatar, onSelectMode, initialOpponentType = 'human', onBack }) {
    const [opponentType, setOpponentType] = React.useState(initialOpponentType); // 'human' or 'bot'
    const [botDifficulty, setBotDifficulty] = React.useState('medium'); // 'easy', 'medium', 'hard'
    const [, forceUpdate] = React.useState(0); // For re-rendering when sound settings change

    const modes = [
        { id: '+', label: 'Toplama', icon: '+', category: 'Temel' },
        { id: '-', label: 'Çıkartma', icon: '-', category: 'Temel' },
        { id: '*', label: 'Çarpma', icon: '×', category: 'Temel' },
        { id: '/', label: 'Bölme', icon: '÷', category: 'Temel' },
        { id: 'mixed', label: 'Karışık', icon: '?', category: 'Temel' },
        { id: 'fractions_add', label: 'Kesir Toplama', icon: '½+¼', category: 'İleri' },
        { id: 'fractions_compare', label: 'Kesir Karşılaştırma', icon: '½>¼', category: 'İleri' },
        { id: 'percentages', label: 'Yüzdeler', icon: '%', category: 'İleri' },
        { id: 'area_rectangle', label: 'Alan (Dikdörtgen)', icon: '□', category: 'İleri' },
        { id: 'perimeter', label: 'Çevre', icon: '⬜', category: 'İleri' },
        { id: 'word_problems', label: 'Sözel Problemler', icon: '📝', category: 'İleri' },
        { id: 'time', label: 'Saat Hesaplama', icon: '🕐', category: 'İleri' },
        { id: 'patterns', label: 'Örüntüler', icon: '🔢', category: 'İleri' },
    ];

    return (
        <div className="card fade-in" style={{ position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
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

            <div style={{
                margin: '1rem 0',
                padding: '0.5rem 1rem',
                background: opponentType === 'human' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                border: opponentType === 'human' ? '1px solid #3b82f6' : '1px solid #10b981',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 'bold'
            }}>
                {opponentType === 'human' ? '🌍 Online Mod' : '💻 Bilgisayara Karşı'}
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
                Hangi konuda yarışmak istersin?
            </p>

            {/* Temel Matematik */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                    fontSize: '1.2rem',
                    marginBottom: '1rem',
                    color: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    ➕ Temel Matematik
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    {modes.filter(m => m.category === 'Temel').map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => onSelectMode(mode.id, opponentType, botDifficulty)}
                            className="secondary"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '1rem 0.5rem'
                            }}
                        >
                            <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{mode.icon}</span>
                            <span style={{ fontSize: '0.9rem' }}>{mode.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* İleri Matematik */}
            <div style={{ marginBottom: '1rem' }}>
                <h3 style={{
                    fontSize: '1.2rem',
                    marginBottom: '1rem',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    🎓 İleri Matematik
                </h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.8rem'
                }}>
                    {modes.filter(m => m.category === 'İleri').map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => onSelectMode(mode.id, opponentType, botDifficulty)}
                            className="secondary"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '1rem 0.5rem',
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{mode.icon}</span>
                            <span style={{ fontSize: '0.85rem', textAlign: 'center' }}>{mode.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Back Button */}
            <button
                onClick={onBack || (() => window.location.reload())}
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
