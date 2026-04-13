import React from 'react';
import { soundManager } from '../utils/soundManager';

export default function Lobby({ name, avatar, onSelectMode, initialOpponentType = 'human', onBack }) {
    const [opponentType, setOpponentType] = React.useState(initialOpponentType);
    const [botDifficulty, setBotDifficulty] = React.useState('medium');
    const [activeTab, setActiveTab] = React.useState('basic');

    const modes = [
        { id: '+', label: 'Toplama', icon: '➕', category: 'basic' },
        { id: '-', label: 'Çıkarma', icon: '➖', category: 'basic' },
        { id: '*', label: 'Çarpma', icon: '✖️', category: 'basic' },
        { id: '/', label: 'Bölme', icon: '➗', category: 'basic' },
        { id: 'mixed', label: 'Karışık', icon: '🎲', category: 'basic' },
        { id: 'fractions_add', label: 'Kesir Toplama', icon: '½+¼', category: 'advanced' },
        { id: 'fractions_compare', label: 'Kesir Karşılaştırma', icon: '½>¼', category: 'advanced' },
        { id: 'percentages', label: 'Yüzdeler', icon: '%', category: 'advanced' },
        { id: 'area_rectangle', label: 'Alan', icon: '□', category: 'advanced' },
        { id: 'perimeter', label: 'Çevre', icon: '⬜', category: 'advanced' },
        { id: 'word_problems', label: 'Problemler', icon: '📝', category: 'advanced' },
        { id: 'time', label: 'Saat', icon: '🕐', category: 'advanced' },
        { id: 'patterns', label: 'Örüntüler', icon: '🔢', category: 'advanced' },
    ];

    const activeModes = modes.filter(m => m.category === activeTab);

    return (
        <div style={{
            width: '100%',
            maxWidth: '1400px',
            margin: '0 auto',
            padding: 'clamp(1rem, 3vw, 2rem)',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            overflow: 'auto'
        }}>

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'clamp(1rem, 2vh, 2rem)',
                flexShrink: 0,
                flexWrap: 'wrap',
                gap: '0.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '50%',
                        width: 'clamp(40px, 8vw, 60px)',
                        height: 'clamp(40px, 8vw, 60px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '3px solid white',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                    }}>
                        {avatar}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <h2 style={{ margin: 0, fontSize: 'clamp(1.1rem, 3vw, 1.75rem)' }}>{name}</h2>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: 'clamp(0.75rem, 2vw, 0.95rem)', opacity: 0.7 }}>Oyun modunu seç</p>
                    </div>
                </div>
                <button onClick={onBack} style={{
                    padding: '0.6rem 1.2rem',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '2px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '12px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                    fontWeight: 'bold'
                }}>
                    ← Geri
                </button>
            </div>

            {/* Main Content - Responsive: column on mobile, row on desktop */}
            <div style={{
                display: 'flex',
                gap: 'clamp(1rem, 2vw, 2rem)',
                flex: 1,
                minHeight: 0,
                flexDirection: 'column' // Mobile first: stack vertically
            }}>

                {/* Settings Bar - Horizontal on mobile, sidebar on desktop */}
                <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    flexShrink: 0,
                    flexWrap: 'wrap'
                }}>
                    {/* Opponent Type */}
                    <div style={{
                        flex: 1,
                        minWidth: '140px',
                        padding: 'clamp(0.75rem, 2vw, 1.25rem)',
                        background: opponentType === 'human'
                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.1))'
                            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.1))',
                        border: `3px solid ${opponentType === 'human' ? '#3b82f6' : '#10b981'}`,
                        borderRadius: '14px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                        boxShadow: `0 4px 12px ${opponentType === 'human' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                    }}>
                        {opponentType === 'human' ? '🌍 Online Oyuncu' : '🤖 Bilgisayar'}
                    </div>

                    {/* Bot Difficulty - inline on mobile */}
                    {opponentType === 'bot' && (
                        <>
                            {[
                                { id: 'easy', label: '😊 Kolay', color: '#10b981' },
                                { id: 'medium', label: '😐 Orta', color: '#f59e0b' },
                                { id: 'hard', label: '😈 Zor', color: '#ef4444' }
                            ].map(diff => (
                                <button
                                    key={diff.id}
                                    onClick={() => setBotDifficulty(diff.id)}
                                    style={{
                                        padding: 'clamp(0.5rem, 1.5vw, 1rem) clamp(0.75rem, 2vw, 1.25rem)',
                                        background: botDifficulty === diff.id
                                            ? `linear-gradient(135deg, ${diff.color}, ${diff.color}dd)`
                                            : 'rgba(255,255,255,0.05)',
                                        border: `2px solid ${botDifficulty === diff.id ? diff.color : 'rgba(255,255,255,0.1)'}`,
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: 'clamp(0.8rem, 2vw, 1rem)',
                                        fontWeight: botDifficulty === diff.id ? 'bold' : 'normal',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: botDifficulty === diff.id ? `0 4px 12px ${diff.color}66` : 'none'
                                    }}
                                >
                                    {diff.label}
                                </button>
                            ))}
                        </>
                    )}
                </div>

                {/* Game Modes Area */}
                <div style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '20px',
                    padding: 'clamp(1rem, 2vw, 1.5rem)',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden',
                    border: '2px solid rgba(255,255,255,0.1)'
                }}>
                    {/* Tabs */}
                    <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        marginBottom: 'clamp(0.75rem, 2vh, 1.5rem)',
                        flexShrink: 0
                    }}>
                        <button
                            onClick={() => setActiveTab('basic')}
                            style={{
                                flex: 1,
                                padding: 'clamp(0.6rem, 1.5vw, 1rem)',
                                background: activeTab === 'basic'
                                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                                    : 'rgba(255,255,255,0.05)',
                                border: activeTab === 'basic' ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.1)',
                                borderRadius: '14px',
                                color: 'white',
                                fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: activeTab === 'basic' ? '0 6px 20px rgba(59, 130, 246, 0.4)' : 'none'
                            }}
                        >
                            ➕ 4 İşlem
                        </button>
                        <button
                            onClick={() => setActiveTab('advanced')}
                            style={{
                                flex: 1,
                                padding: 'clamp(0.6rem, 1.5vw, 1rem)',
                                background: activeTab === 'advanced'
                                    ? 'linear-gradient(135deg, #10b981, #059669)'
                                    : 'rgba(255,255,255,0.05)',
                                border: activeTab === 'advanced' ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.1)',
                                borderRadius: '14px',
                                color: 'white',
                                fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: activeTab === 'advanced' ? '0 6px 20px rgba(16, 185, 129, 0.4)' : 'none'
                            }}
                        >
                            🎓 İleri Seviye
                        </button>
                    </div>

                    {/* Mode Grid - responsive columns */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(120px, 25vw, 180px), 1fr))',
                        gap: 'clamp(0.75rem, 2vw, 1.25rem)',
                        overflowY: 'auto',
                        flex: 1,
                        alignContent: 'start',
                        paddingRight: '0.5rem'
                    }}>
                        {activeModes.map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => onSelectMode(mode.id, opponentType, botDifficulty)}
                                style={{
                                    padding: 'clamp(1rem, 3vw, 1.75rem) clamp(0.5rem, 2vw, 1rem)',
                                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(109, 40, 217, 0.1))',
                                    border: '2px solid rgba(139, 92, 246, 0.4)',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    minHeight: 'clamp(100px, 18vw, 150px)',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
                                    color: 'white'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-6px)';
                                    e.currentTarget.style.borderColor = '#8b5cf6';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.4)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.2)';
                                }}
                            >
                                <div style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>{mode.icon}</div>
                                <div style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1.1rem)', fontWeight: 'bold', textAlign: 'center' }}>
                                    {mode.label}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
