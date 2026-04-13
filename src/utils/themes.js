// Theme definitions for the game
// Each rank unlocks a new visual theme automatically

export const THEMES = {
    space: {
        name: 'Uzay',
        icon: '🚀',
        rank: 'Acemi',
        bg: 'radial-gradient(circle at 50% 0%, #172554 0%, #020617 100%)',
        bgStreak3: 'radial-gradient(circle at 50% 0%, #1e3a5f 0%, #020617 100%)',
        bgStreak5: 'radial-gradient(circle at 50% 0%, #3b1f6e 0%, #020617 100%)',
        particleColor: '#60a5fa',
        particleColorStreak: '#fbbf24',
        accentColor: '#3b82f6',
        timerBorder: '#8b5cf6',
        menuGlow: 'rgba(59, 130, 246, 0.2)'
    },
    ocean: {
        name: 'Okyanus',
        icon: '🌊',
        rank: 'Çaylak',
        bg: 'radial-gradient(circle at 50% 0%, #0c4a6e 0%, #042f2e 100%)',
        bgStreak3: 'radial-gradient(circle at 50% 0%, #155e75 0%, #042f2e 100%)',
        bgStreak5: 'radial-gradient(circle at 50% 0%, #0e7490 0%, #042f2e 100%)',
        particleColor: '#22d3ee',
        particleColorStreak: '#2dd4bf',
        accentColor: '#06b6d4',
        timerBorder: '#14b8a6',
        menuGlow: 'rgba(6, 182, 212, 0.2)'
    },
    forest: {
        name: 'Orman',
        icon: '🌲',
        rank: 'Uzman',
        bg: 'radial-gradient(circle at 50% 0%, #14532d 0%, #052e16 100%)',
        bgStreak3: 'radial-gradient(circle at 50% 0%, #166534 0%, #052e16 100%)',
        bgStreak5: 'radial-gradient(circle at 50% 0%, #15803d 0%, #052e16 100%)',
        particleColor: '#4ade80',
        particleColorStreak: '#a3e635',
        accentColor: '#22c55e',
        timerBorder: '#16a34a',
        menuGlow: 'rgba(34, 197, 94, 0.2)'
    },
    sunset: {
        name: 'Gün Batımı',
        icon: '🌅',
        rank: 'Usta',
        bg: 'radial-gradient(circle at 50% 0%, #78350f 0%, #451a03 100%)',
        bgStreak3: 'radial-gradient(circle at 50% 0%, #92400e 0%, #451a03 100%)',
        bgStreak5: 'radial-gradient(circle at 50% 0%, #b45309 0%, #451a03 100%)',
        particleColor: '#fbbf24',
        particleColorStreak: '#f97316',
        accentColor: '#f59e0b',
        timerBorder: '#d97706',
        menuGlow: 'rgba(245, 158, 11, 0.2)'
    },
    volcano: {
        name: 'Volkan',
        icon: '🌋',
        rank: 'Efsane',
        bg: 'radial-gradient(circle at 50% 0%, #7f1d1d 0%, #450a0a 100%)',
        bgStreak3: 'radial-gradient(circle at 50% 0%, #991b1b 0%, #450a0a 100%)',
        bgStreak5: 'radial-gradient(circle at 50% 0%, #b91c1c 0%, #450a0a 100%)',
        particleColor: '#f87171',
        particleColorStreak: '#fbbf24',
        accentColor: '#ef4444',
        timerBorder: '#dc2626',
        menuGlow: 'rgba(239, 68, 68, 0.2)'
    },
    aurora: {
        name: 'Aurora',
        icon: '🌌',
        rank: 'Galaktik',
        bg: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0f0535 100%)',
        bgStreak3: 'radial-gradient(circle at 30% 0%, #4c1d95 0%, #1e1b4b 50%, #0f766e 100%)',
        bgStreak5: 'radial-gradient(circle at 70% 0%, #7c3aed 0%, #4c1d95 30%, #0d9488 70%, #0f0535 100%)',
        particleColor: '#c084fc',
        particleColorStreak: '#2dd4bf',
        accentColor: '#8b5cf6',
        timerBorder: '#a855f7',
        menuGlow: 'rgba(139, 92, 246, 0.3)'
    }
};

const RANK_TO_THEME = {
    'Acemi': ['space'],
    'Çaylak': ['space', 'ocean'],
    'Uzman': ['space', 'ocean', 'forest'],
    'Usta': ['space', 'ocean', 'forest', 'sunset'],
    'Efsane': ['space', 'ocean', 'forest', 'sunset', 'volcano'],
    'Galaktik': ['space', 'ocean', 'forest', 'sunset', 'volcano', 'aurora']
};

export const getUnlockedThemes = (rankName) => {
    const unlocked = RANK_TO_THEME[rankName] || ['space'];
    return unlocked.map(key => ({ key, ...THEMES[key] }));
};

export const getSelectedTheme = () => {
    const key = localStorage.getItem('astromath_theme') || 'space';
    return THEMES[key] || THEMES.space;
};

export const setSelectedTheme = (key) => {
    localStorage.setItem('astromath_theme', key);
};
