import React from 'react';
import { soundManager } from '../utils/soundManager';

export default function Lobby({ name, avatar, onSelectMode, initialOpponentType = 'human', onBack }) {
    const [opponentType, setOpponentType] = React.useState(initialOpponentType);
    const [botDifficulty, setBotDifficulty] = React.useState('medium');
    const [activeTab, setActiveTab] = React.useState('basic'); // 'basic' or 'advanced'
    const [, forceUpdate] = React.useState(0);

    const modes = [
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

    const activeModes = modes.filter(m => m.category === activeTab);

    return (
        <div className="card fade-in" style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
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

            {/* Header */}
            <div className="avatar">{avatar}</div>
            <h2 style={{ marginBottom: '0.5rem' }}>Merhaba, {name}!</h2>

            {/* Opponent Type Badge */}
            <div style={{
                margin: '0.5rem 0 1.5rem 0',
                padding: '0.5rem 1rem',
                background: opponentType === 'human' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                border: opponentType === 'human' ? '1px solid #3b82f6' : '1px solid #10b981',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 'bold',
                fontSize: '0.9rem'
            }}>
                {opponentType === 'human' ? '🌍 Online Mod' : '💻 Bilgisayara Karşı'}
            </div>

            {/* Bot Difficulty Selection */}
            {opponentType === 'bot' && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Zorluk Seviyesi:</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button
                            className={botDifficulty === 'easy' ? 'primary' : 'secondary'}
                            onClick={() => setBotDifficulty('easy')}
                            style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem' }}
                        >
                            😊 Kolay
                        </button>
                        <button
                            className={botDifficulty === 'medium' ? 'primary' : 'secondary'}
                            onClick={() => setBotDifficulty('medium')}
                            style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem' }}
                        >
                            😐 Orta
                        </button>
                        <button
                            className={botDifficulty === 'hard' ? 'primary' : 'secondary'}
                            onClick={() => setBotDifficulty('hard')}
                            style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem' }}
                        >
                            😈 Zor
                        </button>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.3rem',
                borderRadius: '12px'
            }}>
                <button
                    onClick={() => setActiveTab('basic')}
                    style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        background: activeTab === 'basic'
                            ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                            : 'transparent',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        fontWeight: activeTab === 'basic' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '1rem',
                        boxShadow: activeTab === 'basic' ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none'
                    }}
                >
                    ➕ 4 İşlem
                </button>
                <button
                    onClick={() => setActiveTab('advanced')}
                    style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        background: activeTab === 'advanced'
                            ? 'linear-gradient(135deg, #10b981, #059669)'
                            : 'transparent',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        fontWeight: activeTab === 'advanced' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '1rem',
                        boxShadow: activeTab === 'advanced' ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 'none'
                    }}
                >
                    🎓 İleri Seviye
                </button>
            </div>

            {/* Mode Selection Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.5rem'
            }}>
                {activeModes.map(mode => (
                    <button
                        key={mode.id}
                        onClick={() => onSelectMode(mode.id, opponentType, botDifficulty)}
                        className="secondary"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '1.2rem 0.75rem',
                            background: activeTab === 'basic'
                                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))'
                                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
                            border: activeTab === 'basic'
                                ? '1px solid rgba(59, 130, 246, 0.3)'
                                : '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            minHeight: '100px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = activeTab === 'basic'
                                ? '0 8px 20px rgba(59, 130, 246, 0.3)'
                                : '0 8px 20px rgba(16, 185, 129, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <span style={{
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                        }}>
                            {mode.icon}
                        </span>
                        <span style={{
                            fontSize: '0.9rem',
                            textAlign: 'center',
                            fontWeight: '500'
                        }}>
                            {mode.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Back Button */}
            <button
                onClick={onBack || (() => window.location.reload())}
                className="secondary"
                style={{
                    width: '100%',
                    padding: '0.9rem',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                }}
            >
                ← Geri Dön
            </button>
        </div>
    );
}
