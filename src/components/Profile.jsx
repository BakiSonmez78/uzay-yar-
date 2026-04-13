import React, { useState, useEffect } from 'react';
import { getLang, setLang, t } from '../utils/i18n';

// ---- Stats helpers ----
export function getLifetimeStats() {
    try {
        const raw = localStorage.getItem('astromath_lifetime_stats');
        return raw ? JSON.parse(raw) : {
            totalGames: 0, totalWins: 0,
            totalCorrect: 0, totalWrong: 0,
            bestStreak: 0, bossDefeated: 0,
            fastAnswers: 0, totalXpEarned: 0,
            firstPlayDate: null
        };
    } catch { return { totalGames: 0, totalWins: 0, totalCorrect: 0, totalWrong: 0, bestStreak: 0, bossDefeated: 0, fastAnswers: 0, totalXpEarned: 0, firstPlayDate: null }; }
}

export function updateLifetimeStats(gameStats) {
    const stats = getLifetimeStats();
    stats.totalGames++;
    if (gameStats.isWin) stats.totalWins++;
    stats.totalCorrect += gameStats.correctCount || 0;
    stats.totalWrong += gameStats.wrongCount || 0;
    if ((gameStats.bestStreak || 0) > stats.bestStreak) stats.bestStreak = gameStats.bestStreak;
    stats.bossDefeated += gameStats.bossDefeated || 0;
    stats.fastAnswers += gameStats.fastAnswers || 0;
    stats.totalXpEarned += gameStats.xpEarned || 0;
    if (!stats.firstPlayDate) stats.firstPlayDate = new Date().toISOString();
    localStorage.setItem('astromath_lifetime_stats', JSON.stringify(stats));
    return stats;
}

// ---- Badges ----
const BADGES = [
    { id: 'first_game', icon: '🎮', name: 'İlk Adım', desc: 'İlk oyununu oyna', check: s => s.totalGames >= 1 },
    { id: 'ten_games', icon: '🕹️', name: 'Oyun Tutkunu', desc: '10 oyun oyna', check: s => s.totalGames >= 10 },
    { id: 'fifty_games', icon: '🏟️', name: 'Veteran', desc: '50 oyun oyna', check: s => s.totalGames >= 50 },
    { id: 'first_win', icon: '🏆', name: 'İlk Zafer', desc: 'İlk oyununu kazan', check: s => s.totalWins >= 1 },
    { id: 'ten_wins', icon: '👑', name: 'Şampiyon', desc: '10 oyun kazan', check: s => s.totalWins >= 10 },
    { id: 'hundred_correct', icon: '✅', name: 'Doğru Uzmanı', desc: '100 doğru cevap ver', check: s => s.totalCorrect >= 100 },
    { id: 'five_hundred_correct', icon: '🧠', name: 'Matematik Dehası', desc: '500 doğru cevap ver', check: s => s.totalCorrect >= 500 },
    { id: 'streak_five', icon: '🔥', name: 'Ateş Serisi', desc: '5 seri yap', check: s => s.bestStreak >= 5 },
    { id: 'streak_ten', icon: '💥', name: 'Efsane Seri', desc: '10 seri yap', check: s => s.bestStreak >= 10 },
    { id: 'streak_twenty', icon: '🌟', name: 'Durdurulamaz', desc: '20 seri yap', check: s => s.bestStreak >= 20 },
    { id: 'boss_one', icon: '👹', name: 'Boss Avcısı', desc: '1 boss yen', check: s => s.bossDefeated >= 1 },
    { id: 'boss_ten', icon: '⚔️', name: 'Boss Katili', desc: '10 boss yen', check: s => s.bossDefeated >= 10 },
    { id: 'fast_fifty', icon: '⚡', name: 'Yıldırım', desc: '50 hızlı cevap ver', check: s => s.fastAnswers >= 50 },
];

export function getEarnedBadges() {
    const stats = getLifetimeStats();
    return BADGES.map(b => ({ ...b, earned: b.check(stats) }));
}

// ---- Animal Avatars ----
export const ANIMAL_AVATARS = [
    { id: 'cat', emoji: '🐱', name: 'Kedi', idle: 'animalSway', color: '#f59e0b' },
    { id: 'dog', emoji: '🐶', name: 'Köpek', idle: 'animalBounce', color: '#60a5fa' },
    { id: 'rabbit', emoji: '🐰', name: 'Tavşan', idle: 'animalHop', color: '#f472b6' },
    { id: 'bear', emoji: '🐻', name: 'Ayı', idle: 'animalWobble', color: '#a78bfa' },
    { id: 'fox', emoji: '🦊', name: 'Tilki', idle: 'animalSneak', color: '#fb923c' },
    { id: 'panda', emoji: '🐼', name: 'Panda', idle: 'animalRoll', color: '#94a3b8' },
    { id: 'frog', emoji: '🐸', name: 'Kurbağa', idle: 'animalJump', color: '#4ade80' },
    { id: 'lion', emoji: '🦁', name: 'Aslan', idle: 'animalShake', color: '#fbbf24' },
    { id: 'penguin', emoji: '🐧', name: 'Penguen', idle: 'animalWaddle', color: '#38bdf8' },
    { id: 'owl', emoji: '🦉', name: 'Baykuş', idle: 'animalBlink', color: '#c084fc' },
];

export function getAnimalById(id) {
    return ANIMAL_AVATARS.find(a => a.id === id) || ANIMAL_AVATARS[0];
}

export default function Profile({ onClose, rankName, xp, userName, avatar, onAvatarChange }) {
    const stats = getLifetimeStats();
    const badges = getEarnedBadges();
    const earnedCount = badges.filter(b => b.earned).length;
    const winRate = stats.totalGames > 0 ? Math.round((stats.totalWins / stats.totalGames) * 100) : 0;
    const accuracy = (stats.totalCorrect + stats.totalWrong) > 0
        ? Math.round((stats.totalCorrect / (stats.totalCorrect + stats.totalWrong)) * 100) : 0;

    const [tab, setTab] = useState('stats');
    const [showAvatars, setShowAvatars] = useState(false);
    const [currentLang, setCurrentLang] = useState(getLang());

    const currentAnimal = getAnimalById(avatar);

    // XP progress
    const RANKS = [
        { min: 0, name: 'Acemi' }, { min: 100, name: 'Çaylak' },
        { min: 300, name: 'Uzman' }, { min: 600, name: 'Usta' },
        { min: 1200, name: 'Efsane' }, { min: 2500, name: 'Galaktik' },
    ];
    const currentRank = RANKS.filter(r => (xp || 0) >= r.min).pop() || RANKS[0];
    const nextRank = RANKS.find(r => (xp || 0) < r.min);
    const progress = nextRank
        ? Math.round(((xp || 0) - currentRank.min) / (nextRank.min - currentRank.min) * 100)
        : 100;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', fontFamily: '"Outfit", sans-serif'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1e1b4b, #0f172a)',
                borderRadius: '24px', padding: 'clamp(16px, 3vw, 28px)',
                width: '100%', maxWidth: '480px', maxHeight: '85vh',
                overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                color: 'white'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: '800' }}>📊 {currentLang === 'tr' ? 'Profilim' : 'My Profile'}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Language Flags */}
                        {[{ code: 'tr', src: 'https://flagcdn.com/w40/tr.png', alt: 'Türkçe' }, { code: 'en', src: 'https://flagcdn.com/w40/gb.png', alt: 'English' }].map(lang => (
                            <button key={lang.code}
                                onClick={() => { setLang(lang.code); setCurrentLang(lang.code); }}
                                title={lang.alt}
                                style={{
                                    width: '38px', height: '38px', borderRadius: '50%',
                                    background: currentLang === lang.code
                                        ? 'rgba(99,102,241,0.3)'
                                        : 'rgba(255,255,255,0.06)',
                                    border: currentLang === lang.code
                                        ? '2.5px solid #818cf8'
                                        : '2.5px solid transparent',
                                    cursor: 'pointer', padding: '0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s', overflow: 'hidden',
                                    boxShadow: currentLang === lang.code
                                        ? '0 0 12px rgba(99,102,241,0.4)'
                                        : 'none'
                                }}
                            >
                                <img src={lang.src} alt={lang.alt} style={{ width: '24px', height: '16px', objectFit: 'cover', borderRadius: '2px' }} />
                            </button>
                        ))}
                        {/* Close */}
                        <button onClick={onClose} style={{
                            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                            width: '32px', height: '32px', borderRadius: '50%',
                            cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, marginLeft: '4px'
                        }}>✕</button>
                    </div>
                </div>

                {/* Welcome Card */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.2))',
                    borderRadius: '16px', padding: '16px',
                    border: '1px solid rgba(139,92,246,0.3)',
                    marginBottom: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                            onClick={() => setShowAvatars(!showAvatars)}
                            style={{
                                width: '68px', height: '68px', borderRadius: '50%',
                                background: `linear-gradient(135deg, ${currentAnimal.color}44, ${currentAnimal.color}22)`,
                                border: `3px solid ${currentAnimal.color}88`,
                                fontSize: '2.5rem', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                boxShadow: `0 4px 16px ${currentAnimal.color}44`,
                                flexShrink: 0, cursor: 'pointer',
                                position: 'relative',
                                animation: `${currentAnimal.idle} 2s ease-in-out infinite`
                            }}
                        >
                            {currentAnimal.emoji}
                            <div style={{
                                position: 'absolute', bottom: '-2px', right: '-2px',
                                width: '20px', height: '20px', borderRadius: '50%',
                                background: '#3b82f6', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.6rem', border: '2px solid #1e1b4b'
                            }}>✏️</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Hoşgeldin,</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {userName || 'İsimsiz Oyuncu'}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px', fontSize: '0.7rem', color: '#94a3b8' }}>
                        <span>🎮 {stats.totalGames} oyun</span>
                        <span>🎖️ {earnedCount}/{BADGES.length} rozet</span>
                        <span>🎯 %{accuracy} isabet</span>
                    </div>

                    {/* Avatar Picker */}
                    {showAvatars && (
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: '8px', marginTop: '12px', padding: '12px',
                            background: 'rgba(0,0,0,0.3)', borderRadius: '14px',
                            animation: 'fadeIn 0.2s ease'
                        }}>
                            {ANIMAL_AVATARS.map(a => (
                                <button key={a.id}
                                    onClick={() => {
                                        if (onAvatarChange) onAvatarChange(a.id);
                                        setShowAvatars(false);
                                    }}
                                    style={{
                                        padding: '6px 4px',
                                        background: avatar === a.id ? `${a.color}33` : 'rgba(255,255,255,0.05)',
                                        border: avatar === a.id ? `2px solid ${a.color}` : '2px solid transparent',
                                        borderRadius: '12px', cursor: 'pointer',
                                        transition: 'all 0.15s', display: 'flex',
                                        flexDirection: 'column', alignItems: 'center', gap: '2px'
                                    }}
                                >
                                    <span style={{ fontSize: '1.6rem', display: 'inline-block', animation: `${a.idle} 2s ease-in-out infinite` }}>{a.emoji}</span>
                                    <span style={{ fontSize: '0.5rem', color: '#94a3b8', fontWeight: '600' }}>{a.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <style>{`
                    @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
                    @keyframes animalSway { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} }
                    @keyframes animalBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                    @keyframes animalHop { 0%,100%{transform:translateY(0) scale(1)} 30%{transform:translateY(-12px) scale(1.05)} 60%{transform:translateY(-2px) scale(.98)} }
                    @keyframes animalWobble { 0%,100%{transform:rotate(0) scale(1)} 25%{transform:rotate(-5deg) scale(1.03)} 75%{transform:rotate(5deg) scale(1.03)} }
                    @keyframes animalSneak { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
                    @keyframes animalRoll { 0%,100%{transform:rotate(0)} 50%{transform:rotate(12deg)} }
                    @keyframes animalJump { 0%,60%,100%{transform:translateY(0) scaleY(1)} 10%{transform:translateY(3px) scaleY(.9)} 30%{transform:translateY(-14px) scaleY(1.1)} }
                    @keyframes animalShake { 0%,100%{transform:scale(1)} 25%{transform:scale(1.06) rotate(-4deg)} 75%{transform:scale(1.06) rotate(4deg)} }
                    @keyframes animalWaddle { 0%,100%{transform:rotate(0) translateX(0)} 25%{transform:rotate(-10deg) translateX(-3px)} 75%{transform:rotate(10deg) translateX(3px)} }
                    @keyframes animalBlink { 0%,42%,58%,100%{transform:scaleY(1)} 50%{transform:scaleY(.2)} }
                `}</style>

                {/* Tab Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    {[
                        { key: 'stats', label: '📈 İstatistik' },
                        { key: 'badges', label: `🎖️ Rozetler (${earnedCount})` }
                    ].map(t => (
                        <button key={t.key}
                            onClick={() => setTab(t.key)}
                            style={{
                                flex: 1, padding: '10px',
                                background: tab === t.key ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                                border: tab === t.key ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px', color: 'white',
                                fontWeight: '700', fontSize: '0.85rem',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >{t.label}</button>
                    ))}
                </div>

                {/* Stats Tab */}
                {tab === 'stats' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {[
                            { icon: '🎮', label: 'Toplam Oyun', value: stats.totalGames },
                            { icon: '🏆', label: 'Kazanılan', value: `${stats.totalWins} (${winRate}%)` },
                            { icon: '✅', label: 'Doğru Cevap', value: stats.totalCorrect },
                            { icon: '❌', label: 'Yanlış Cevap', value: stats.totalWrong },
                            { icon: '🎯', label: 'İsabet Oranı', value: `${accuracy}%` },
                            { icon: '🔥', label: 'En İyi Seri', value: stats.bestStreak },
                            { icon: '👹', label: 'Boss Yenilen', value: stats.bossDefeated },
                            { icon: '⚡', label: 'Hızlı Cevap', value: stats.fastAnswers },
                        ].map((stat, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px', padding: '12px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.3rem' }}>{stat.icon}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '2px' }}>{stat.value}</div>
                                <div style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: '600' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Badges Tab */}
                {tab === 'badges' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {badges.map(badge => (
                            <div key={badge.id} style={{
                                background: badge.earned
                                    ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.15))'
                                    : 'rgba(255,255,255,0.03)',
                                borderRadius: '14px', padding: '12px 8px',
                                border: badge.earned
                                    ? '1px solid rgba(139,92,246,0.4)'
                                    : '1px solid rgba(255,255,255,0.06)',
                                textAlign: 'center',
                                opacity: badge.earned ? 1 : 0.4,
                                transition: 'all 0.2s'
                            }}>
                                <div style={{ fontSize: '1.5rem', filter: badge.earned ? 'none' : 'grayscale(1)' }}>
                                    {badge.earned ? badge.icon : '🔒'}
                                </div>
                                <div style={{
                                    fontSize: '0.65rem', fontWeight: '700',
                                    marginTop: '4px', lineHeight: 1.2
                                }}>{badge.name}</div>
                                <div style={{
                                    fontSize: '0.55rem', opacity: 0.6,
                                    marginTop: '2px', lineHeight: 1.2
                                }}>{badge.desc}</div>
                            </div>
                        ))}
                    </div>
                )}

                {stats.firstPlayDate && (
                    <div style={{
                        textAlign: 'center', fontSize: '0.7rem',
                        opacity: 0.4, marginTop: '16px'
                    }}>
                        🗓️ {currentLang === 'tr' ? 'İlk oyun' : 'First game'}: {new Date(stats.firstPlayDate).toLocaleDateString(currentLang === 'tr' ? 'tr-TR' : 'en-US')}
                    </div>
                )}


            </div>
        </div>
    );
}
