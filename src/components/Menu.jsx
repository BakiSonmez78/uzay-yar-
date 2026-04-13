import React, { useState, useEffect } from 'react';
import { soundManager } from '../utils/soundManager';
import hedgehogImg from '../assets/hedgehog_pointing.png';
import MistakeBook from './MistakeBook';
import Profile from './Profile';
import { t } from '../utils/i18n';

const AVATARS = ['⭐', '🚀', '🎮', '🎯', '🏆', '💎', '🔥', '⚡', '🌟', '🎨'];

const RANKS = [
    { min: 0, name: 'Acemi', icon: '🌱', color: '#94a3b8' },
    { min: 100, name: 'Çaylak', icon: '⭐', color: '#60a5fa' },
    { min: 300, name: 'Uzman', icon: '🌟', color: '#a78bfa' },
    { min: 600, name: 'Usta', icon: '💫', color: '#f59e0b' },
    { min: 1200, name: 'Efsane', icon: '👑', color: '#ef4444' },
    { min: 2500, name: 'Galaktik', icon: '🏆', color: '#fbbf24' },
];

const getRank = (xp) => {
    let rank = RANKS[0];
    for (const r of RANKS) {
        if (xp >= r.min) rank = r;
    }
    return rank;
};

const getNextRank = (xp) => {
    for (const r of RANKS) {
        if (xp < r.min) return r;
    }
    return null; // Max rank
};

const getProgress = (xp) => {
    const current = getRank(xp);
    const next = getNextRank(xp);
    if (!next) return 100; // Max rank
    const rangeTotal = next.min - current.min;
    const rangeCurrent = xp - current.min;
    return Math.min(100, Math.round((rangeCurrent / rangeTotal) * 100));
};

export default function Menu({ userData, onStart, onShowLeaderboard, onShowTournament, onShowPrivateRoom, totalScore, onLogout }) {
    const [name, setName] = useState(userData?.name || '');
    const [selectedAvatar, setSelectedAvatar] = useState(userData?.avatar || '⭐');
    const [school, setSchool] = useState(userData?.school || '');
    const [showAvatars, setShowAvatars] = useState(false);
    const [musicOn, setMusicOn] = useState(!soundManager.musicMuted);
    const [sfxOn, setSfxOn] = useState(!soundManager.sfxMuted);
    const [showMistakes, setShowMistakes] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    // XP (read-only for profile display)
    const xp = parseInt(localStorage.getItem('astromath_xp') || '0');
    const rank = getRank(xp);

    // Neon Particles
    const [particles, setParticles] = useState([]);
    useEffect(() => {
        const colors = ['#60a5fa', '#a78bfa', '#f472b6', '#facc15']; // blue, purple, pink, yellow
        const newParticles = Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 100,
            size: Math.random() * 4 + 2, // 2-6px
            color: colors[Math.floor(Math.random() * colors.length)],
            duration: Math.random() * 10 + 10, // 10-20s float
            delay: Math.random() * 5
        }));
        setParticles(newParticles);
    }, []);

    useEffect(() => {
        soundManager.playMusic();
    }, []);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle at 50% 0%, #172554 0%, #020617 100%)',
            display: 'flex',
            flexDirection: 'column',
            padding: 'clamp(1rem, 3vw, 2rem)',
            gap: 'clamp(1rem, 2vh, 2rem)',
            fontFamily: '"Outfit", sans-serif',
            overflow: 'auto'
        }}>
            {/* Neon Particles Layer */}
            {particles.map(p => (
                <div key={p.id} style={{
                    position: 'absolute',
                    left: `${p.left}%`,
                    top: `${p.top}%`,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    background: p.color,
                    borderRadius: '50%',
                    boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                    opacity: 0.6,
                    animation: `neonFloat ${p.duration}s infinite linear`,
                    animationDelay: `-${p.delay}s`,
                    pointerEvents: 'none',
                    zIndex: 0
                }} />
            ))}

            {/* Top Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
                position: 'relative',
                zIndex: 1
            }}>
                {/* Score Badge */}
                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                    <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 10px rgba(234, 179, 8, 0.5))' }}>🏆</span>
                    <span style={{ fontWeight: '800', fontSize: '1.5rem', color: '#fcd34d' }}>{totalScore}</span>
                </div>

                {/* Right Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                        { icon: '📊', onClick: onShowLeaderboard, title: 'Liderlik' },
                        {
                            icon: '🎵',
                            onClick: () => { soundManager.toggleMusic(); setMusicOn(!soundManager.musicMuted); },
                            title: 'Müzik',
                            off: !musicOn
                        },
                        {
                            icon: '🔊',
                            onClick: () => { soundManager.toggleSfx(); setSfxOn(!soundManager.sfxMuted); },
                            title: 'Ses Efektleri',
                            off: !sfxOn
                        },
                        (userData && !userData.isGuest && { icon: '🚪', onClick: onLogout, title: 'Çıkış', danger: true })
                    ].filter(Boolean).map((btn, i) => (
                        <button key={i} onClick={btn.onClick} title={btn.title} style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            border: `1px solid ${btn.danger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                            background: btn.danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
                            color: btn.off ? 'rgba(255,255,255,0.5)' : 'white',
                            fontSize: '1.25rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            backdropFilter: 'blur(4px)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = btn.danger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = btn.danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)'}
                        >
                            {btn.icon}
                            {btn.off && (
                                <div style={{
                                    position: 'absolute',
                                    width: '140%',
                                    height: '2px',
                                    background: '#ef4444',
                                    transform: 'rotate(-45deg)',
                                    boxShadow: '0 0 2px rgba(0,0,0,0.5)'
                                }} />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(2rem, 5vw, 6rem)',
                flexWrap: 'wrap',
                padding: '2rem 0',
                position: 'relative',
                zIndex: 1
            }}>

                {/* Left Side: Hero Image */}
                <div style={{
                    flex: '0 1 450px',
                    display: 'flex',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    <div style={{
                        width: 'clamp(280px, 40vw, 420px)',
                        aspectRatio: '1',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '8px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 0 40px rgba(59, 130, 246, 0.2)',
                        background: '#e0f2fe',
                        position: 'relative'
                    }}>
                        <img
                            src={hedgehogImg}
                            alt="Hero"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transform: 'scale(1.1) translateY(10px)'
                            }}
                        />
                        {/* Shine overlay */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 60%)',
                            pointerEvents: 'none'
                        }} />
                    </div>

                    {/* Floating elements behind */}
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '20px',
                        fontSize: '4rem',
                        animation: 'float 3s ease-in-out infinite',
                        filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))'
                    }}>✨</div>
                </div>

                {/* Right Side: Menu Controls */}
                <div style={{
                    flex: '0 1 480px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    width: '100%'
                }}>
                    {/* User Profile Card */}


                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            // TODO: v2.0 - Re-enable Online Multiplayer when user base grows
                            // {
                            //     icon: '🌍', label: t('menu_online'),
                            //     desc: t('menu_online_desc'),
                            //     onClick: () => name.trim() && onStart(name, selectedAvatar, school, 'human'),
                            //     gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            //     shadow: 'rgba(37, 99, 235, 0.4)'
                            // },
                            {
                                icon: '🤖', label: t('menu_bot'),
                                desc: t('menu_bot_desc'),
                                onClick: () => name.trim() && onStart(name, selectedAvatar, school, 'bot'),
                                gradient: 'linear-gradient(135deg, #10b981, #059669)',
                                shadow: 'rgba(5, 150, 105, 0.4)'
                            },
                            {
                                icon: '👥', label: t('menu_friends'),
                                desc: t('menu_friends_desc'),
                                onClick: () => name.trim() && onShowPrivateRoom(),
                                gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                shadow: 'rgba(217, 119, 6, 0.4)'
                            }
                        ].map((btn, i) => (
                            <button
                                key={i}
                                onClick={btn.onClick}
                                style={{
                                    padding: 'clamp(14px, 3vw, 20px) clamp(16px, 3vw, 24px)',
                                    background: btn.gradient,
                                    border: 'none',
                                    borderRadius: '20px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'clamp(12px, 2vw, 20px)',
                                    boxShadow: `0 8px 0 rgba(0,0,0,0.2), 0 20px 30px -10px ${btn.shadow}`,
                                    transition: 'all 0.1s',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    width: '100%',
                                    textAlign: 'left'
                                }}
                                onMouseDown={e => {
                                    e.currentTarget.style.transform = 'translateY(4px)';
                                    e.currentTarget.style.boxShadow = `0 4px 0 rgba(0,0,0,0.2), 0 10px 15px -5px ${btn.shadow}`;
                                }}
                                onMouseUp={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = `0 8px 0 rgba(0,0,0,0.2), 0 20px 30px -10px ${btn.shadow}`;
                                }}
                            >
                                <div style={{
                                    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                                    background: 'rgba(255,255,255,0.2)',
                                    width: 'clamp(48px, 8vw, 64px)',
                                    height: 'clamp(48px, 8vw, 64px)',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {btn.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: '800', lineHeight: 1.2 }}>{btn.label}</div>
                                    <div style={{ fontSize: 'clamp(0.7rem, 2vw, 0.9rem)', opacity: 0.9, marginTop: '2px', fontWeight: '500' }}>{btn.desc}</div>
                                </div>
                                <div style={{ fontSize: '1.5rem', opacity: 0.5 }}>➜</div>
                            </button>
                        ))}


                        {/* Secondary Row: Yanlışlarım + Profil */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowMistakes(true)} style={{
                                flex: 1, padding: 'clamp(10px, 2vw, 14px)',
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.05))',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '16px', color: 'white',
                                cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                gap: '8px', fontSize: 'clamp(0.8rem, 2vw, 1rem)',
                                fontWeight: '700', transition: 'all 0.2s'
                            }}>
                                📖 {t('menu_mistakes')}
                            </button>
                            <button onClick={() => setShowProfile(true)} style={{
                                flex: 1, padding: 'clamp(10px, 2vw, 14px)',
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.05))',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                borderRadius: '16px', color: 'white',
                                cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                gap: '8px', fontSize: 'clamp(0.8rem, 2vw, 1rem)',
                                fontWeight: '700', transition: 'all 0.2s'
                            }}>
                                📊 {t('menu_profile')}
                            </button>
                        </div>

                        {/* Privacy & Terms */}
                        <div style={{
                            display: 'flex', justifyContent: 'center', gap: '1.5rem',
                            fontSize: '0.7rem', marginTop: '8px'
                        }}>
                            <a href="/privacy.html" target="_blank" rel="noopener noreferrer"
                                style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
                                {t('menu_privacy')}
                            </a>
                            <a href="/terms.html" target="_blank" rel="noopener noreferrer"
                                style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
                                {t('menu_terms')}
                            </a>
                        </div>
                    </div>
                </div>
            </div>


            {/* Mistake Book Modal */}
            {showMistakes && (
                <MistakeBook onClose={() => setShowMistakes(false)} />
            )}

            {/* Profile Modal */}
            {showProfile && (
                <Profile
                    onClose={() => setShowProfile(false)}
                    rankName={rank.name}
                    xp={xp}
                    userName={name}
                    avatar={selectedAvatar}
                    onAvatarChange={(a) => setSelectedAvatar(a)}
                />
            )}



            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes neonFloat {
                    0% { transform: translateY(0) scale(1); opacity: 0; }
                    20% { opacity: 0.8; }
                    80% { opacity: 0.8; }
                    100% { transform: translateY(-120vh) scale(0.5); opacity: 0; }
                }
                @keyframes wobble {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-8deg); }
                    75% { transform: rotate(8deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}
