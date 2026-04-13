import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export default function Leaderboard({ onBack }) {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScores = async () => {
            try {
                const q = query(
                    collection(db, "scores"),
                    orderBy("score", "desc"),
                    limit(20) // Increased limit to show more players
                );
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => doc.data());

                // Remove duplicates based on name (keep highest score) if needed, 
                // or just display as is. For now displaying all.
                setScores(data);
            } catch (error) {
                console.error("Error fetching leaderboard: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
    }, []);

    const getFlagEmoji = (countryCode) => {
        if (!countryCode) return '';
        return countryCode.toUpperCase().replace(/./g, char =>
            String.fromCodePoint(127397 + char.charCodeAt(0))
        );
    };

    const getRankStyle = (index) => {
        switch (index) {
            case 0: return {
                bg: 'linear-gradient(90deg, rgba(234, 179, 8, 0.2), rgba(234, 179, 8, 0.05))',
                border: '1px solid rgba(234, 179, 8, 0.5)',
                color: '#fcd34d',
                icon: '👑'
            };
            case 1: return {
                bg: 'linear-gradient(90deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.05))',
                border: '1px solid rgba(148, 163, 184, 0.5)',
                color: '#e2e8f0',
                icon: '🥈'
            };
            case 2: return {
                bg: 'linear-gradient(90deg, rgba(180, 83, 9, 0.2), rgba(180, 83, 9, 0.05))',
                border: '1px solid rgba(180, 83, 9, 0.5)',
                color: '#fdba74',
                icon: '🥉'
            };
            default: return {
                bg: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: 'white',
                icon: `#${index + 1}`
            };
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle at 50% 0%, #172554 0%, #020617 100%)',
            display: 'flex',
            flexDirection: 'column',
            padding: 'clamp(1rem, 3vw, 2rem)',
            gap: '20px',
            fontFamily: '"Outfit", sans-serif',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
                width: '100%',
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        fontSize: '2rem',
                        background: 'rgba(255,255,255,0.1)',
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        🏆
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Liderlik Tablosu</h2>
                        <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>En iyi oyuncular</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={onBack}
                        style={{
                            padding: '0 20px',
                            height: '44px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            backdropFilter: 'blur(4px)'
                        }}
                    >
                        ✕ Kapat
                    </button>
                </div>
            </div>

            {/* List Container */}
            <div style={{
                flex: 1,
                width: '100%',
                maxWidth: '800px',
                margin: '0 auto',
                overflowY: 'auto',
                paddingRight: '4px', // Space for scrollbar
            }}>
                {loading ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        opacity: 0.7
                    }}>
                        <div className="spinner" style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
                        <div>Yükleniyor...</div>
                    </div>
                ) : scores.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        opacity: 0.7,
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '24px',
                        border: '2px dashed rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏜️</div>
                        <div>Henüz skor yok. İlk sen ol!</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {scores.map((player, index) => {
                            const style = getRankStyle(index);
                            return (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '16px 20px',
                                    background: style.bg,
                                    border: style.border,
                                    borderRadius: '16px',
                                    backdropFilter: 'blur(4px)',
                                    transition: 'transform 0.1s',
                                    animation: `fadeIn 0.3s ease-out forwards ${index * 0.05}s`,
                                    opacity: 0 // For animation
                                }}>
                                    {/* Rank */}
                                    <div style={{
                                        width: '40px',
                                        fontSize: index < 3 ? '1.8rem' : '1.2rem',
                                        fontWeight: '800',
                                        color: style.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '12px'
                                    }}>
                                        {style.icon}
                                    </div>

                                    {/* Avatar */}
                                    <div style={{
                                        fontSize: '2rem',
                                        marginRight: '16px',
                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                                    }}>
                                        {player.avatar || '👤'}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '2px'
                                        }}>
                                            <span style={{
                                                fontWeight: '700',
                                                fontSize: '1.2rem',
                                                color: 'white',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {player.name}
                                            </span>
                                            {player.country && (
                                                <span style={{ fontSize: '1.2rem' }}>{getFlagEmoji(player.country)}</span>
                                            )}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            gap: '12px',
                                            fontSize: '0.85rem',
                                            color: 'rgba(255,255,255,0.5)'
                                        }}>
                                            {player.school && (
                                                <span>🏫 {player.school}</span>
                                            )}
                                            <span>📅 {new Date(player.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div style={{
                                        fontSize: '1.6rem',
                                        fontWeight: '800',
                                        color: style.color,
                                        textShadow: `0 0 20px ${style.color}40`,
                                        fontVariantNumeric: 'tabular-nums'
                                    }}>
                                        {player.score}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                /* Custom Scrollbar */
                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
