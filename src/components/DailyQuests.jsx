import React, { useState, useEffect } from 'react';

const QUEST_POOL = [
    { id: 'play_games', label: '🎮 {target} oyun oyna', targets: [2, 3, 5], xp: [15, 25, 40], key: 'gamesPlayed' },
    { id: 'correct_answers', label: '✅ {target} doğru cevap ver', targets: [10, 20, 30], xp: [20, 35, 50], key: 'correctAnswers' },
    { id: 'win_games', label: '🏆 {target} oyun kazan', targets: [1, 2, 3], xp: [25, 40, 60], key: 'gamesWon' },
    { id: 'streak', label: '🔥 {target} seri yap', targets: [3, 5, 7], xp: [20, 35, 50], key: 'bestStreak' },
    { id: 'fast_answers', label: '⚡ {target} hızlı cevap ver (<2s)', targets: [3, 5, 8], xp: [15, 30, 45], key: 'fastAnswers' },
];

// Generate 3 daily quests based on date seed
const generateDailyQuests = () => {
    const today = new Date().toDateString();
    let seed = 0;
    for (let i = 0; i < today.length; i++) seed += today.charCodeAt(i);

    const shuffled = [...QUEST_POOL].sort((a, b) => {
        const ha = (seed * 31 + a.id.charCodeAt(0)) % 100;
        const hb = (seed * 31 + b.id.charCodeAt(0)) % 100;
        return ha - hb;
    });

    return shuffled.slice(0, 3).map((quest, i) => {
        const diffIndex = (seed + i) % quest.targets.length;
        return {
            ...quest,
            target: quest.targets[diffIndex],
            reward: quest.xp[diffIndex],
            label: quest.label.replace('{target}', quest.targets[diffIndex]),
            progress: 0,
            claimed: false
        };
    });
};

const getStoredQuests = () => {
    try {
        const stored = JSON.parse(localStorage.getItem('astromath_daily_quests') || '{}');
        const today = new Date().toDateString();
        if (stored.date === today) return stored.quests;
        // New day - generate new quests
        const quests = generateDailyQuests();
        localStorage.setItem('astromath_daily_quests', JSON.stringify({ date: today, quests }));
        return quests;
    } catch {
        return generateDailyQuests();
    }
};

export const updateQuestProgress = (stats) => {
    try {
        const today = new Date().toDateString();
        const stored = JSON.parse(localStorage.getItem('astromath_daily_quests') || '{}');
        if (stored.date !== today) return;

        const quests = stored.quests.map(q => {
            if (q.claimed) return q;
            let newProgress = q.progress;
            if (q.key === 'gamesPlayed') newProgress += 1;
            if (q.key === 'correctAnswers') newProgress += (stats.correctCount || 0);
            if (q.key === 'gamesWon' && stats.isWin) newProgress += 1;
            if (q.key === 'bestStreak') newProgress = Math.max(newProgress, stats.bestStreak || 0);
            if (q.key === 'fastAnswers') newProgress += (stats.fastAnswers || 0);
            return { ...q, progress: newProgress };
        });

        localStorage.setItem('astromath_daily_quests', JSON.stringify({ date: today, quests }));
    } catch (e) {
        console.error('[Quests] Update failed:', e);
    }
};

export default function DailyQuests({ onClose, onClaimXp }) {
    const [quests, setQuests] = useState(getStoredQuests());

    const claimReward = (index) => {
        const quest = quests[index];
        if (quest.claimed || quest.progress < quest.target) return;

        const updated = [...quests];
        updated[index] = { ...quest, claimed: true };
        setQuests(updated);

        const today = new Date().toDateString();
        localStorage.setItem('astromath_daily_quests', JSON.stringify({ date: today, quests: updated }));

        if (onClaimXp) onClaimXp(quest.reward);
    };

    const completedCount = quests.filter(q => q.claimed).length;

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1e1b4b, #0f172a)',
                borderRadius: '32px',
                padding: 'clamp(1.5rem, 4vw, 2.5rem)',
                maxWidth: '450px', width: '90%',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                position: 'relative'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'rgba(255,255,255,0.1)', border: 'none',
                    color: 'white', width: '36px', height: '36px',
                    borderRadius: '50%', fontSize: '1.2rem',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                }}>✕</button>

                <h2 style={{
                    fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: '800',
                    background: 'linear-gradient(90deg, #60a5fa, #3b82f6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem', textAlign: 'center'
                }}>🎯 Günlük Görevler</h2>

                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    {completedCount}/3 tamamlandı • Her gün yenilenir
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {quests.map((quest, i) => {
                        const isComplete = quest.progress >= quest.target;
                        const percentage = Math.min(100, Math.round((quest.progress / quest.target) * 100));

                        return (
                            <div key={i} style={{
                                background: quest.claimed
                                    ? 'rgba(74, 222, 128, 0.1)'
                                    : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${quest.claimed ? 'rgba(74, 222, 128, 0.3)' : isComplete ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '16px',
                                padding: '14px 16px',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                opacity: quest.claimed ? 0.6 : 1,
                                transition: 'all 0.3s'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                                        fontWeight: '700',
                                        color: quest.claimed ? '#4ade80' : 'white',
                                        marginBottom: '6px',
                                        textDecoration: quest.claimed ? 'line-through' : 'none'
                                    }}>{quest.label}</div>

                                    {/* Progress bar */}
                                    <div style={{
                                        width: '100%', height: '6px',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '3px', overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${percentage}%`, height: '100%',
                                            background: quest.claimed ? '#4ade80' : isComplete ? '#fbbf24' : '#3b82f6',
                                            borderRadius: '3px',
                                            transition: 'width 0.5s ease'
                                        }} />
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                                        {quest.progress}/{quest.target}
                                    </div>
                                </div>

                                {/* Reward / Claim */}
                                {quest.claimed ? (
                                    <div style={{ fontSize: '1.5rem' }}>✅</div>
                                ) : isComplete ? (
                                    <button onClick={() => claimReward(i)} style={{
                                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                        border: 'none', borderRadius: '12px',
                                        padding: '8px 14px', color: 'white',
                                        fontWeight: '800', fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        animation: 'bounceIn 0.5s',
                                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
                                    }}>
                                        +{quest.reward} XP
                                    </button>
                                ) : (
                                    <div style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '12px', padding: '8px 12px',
                                        fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600'
                                    }}>
                                        +{quest.reward} XP
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes bounceIn { from { transform: scale(0.5); } to { transform: scale(1); } }
            `}</style>
        </div>
    );
}
