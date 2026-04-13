import React, { useState, useEffect } from 'react';

const PRIZES = [
    { label: '10 XP', value: 10, color: '#3b82f6', icon: '⭐' },
    { label: '25 XP', value: 25, color: '#8b5cf6', icon: '💫' },
    { label: '50 XP', value: 50, color: '#ec4899', icon: '🌟' },
    { label: '5 XP', value: 5, color: '#6366f1', icon: '✨' },
    { label: '100 XP', value: 100, color: '#f59e0b', icon: '🏆' },
    { label: '15 XP', value: 15, color: '#10b981', icon: '💎' },
    { label: '30 XP', value: 30, color: '#ef4444', icon: '🔥' },
    { label: '20 XP', value: 20, color: '#14b8a6', icon: '⚡' },
];

export default function DailyWheel({ onClose, onPrize }) {
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [prize, setPrize] = useState(null);
    const [canSpin, setCanSpin] = useState(true);

    useEffect(() => {
        const lastSpin = localStorage.getItem('astromath_last_spin');
        if (lastSpin) {
            const lastDate = new Date(parseInt(lastSpin));
            const now = new Date();
            const isSameDay = lastDate.toDateString() === now.toDateString();
            if (isSameDay) setCanSpin(false);
        }
    }, []);

    const spin = () => {
        if (spinning || !canSpin) return;
        setSpinning(true);
        setPrize(null);

        // Pick random prize (weighted: common = low XP, rare = high XP)
        const weights = [20, 15, 8, 25, 2, 12, 8, 10]; // Weight distribution
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        let prizeIndex = 0;
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) { prizeIndex = i; break; }
        }

        const segmentAngle = 360 / PRIZES.length;
        const targetAngle = 360 - (prizeIndex * segmentAngle + segmentAngle / 2);
        const totalRotation = rotation + 1440 + targetAngle; // 4 full spins + land on prize

        setRotation(totalRotation);

        setTimeout(() => {
            setSpinning(false);
            setPrize(PRIZES[prizeIndex]);
            setCanSpin(false);
            localStorage.setItem('astromath_last_spin', Date.now().toString());

            // Callback to parent with XP reward
            if (onPrize) onPrize(PRIZES[prizeIndex].value);
        }, 4000); // Match CSS transition duration
    };

    const segmentAngle = 360 / PRIZES.length;

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out',
            backdropFilter: 'blur(8px)'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1e1b4b, #0f172a)',
                borderRadius: '32px',
                padding: 'clamp(1.5rem, 4vw, 3rem)',
                maxWidth: '450px',
                width: '90%',
                textAlign: 'center',
                border: '2px solid rgba(139, 92, 246, 0.3)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(139, 92, 246, 0.1)',
                position: 'relative'
            }}>
                {/* Close button */}
                <button onClick={onClose} style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'rgba(255,255,255,0.1)', border: 'none',
                    color: 'white', width: '36px', height: '36px',
                    borderRadius: '50%', fontSize: '1.2rem',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                }}>✕</button>

                <h2 style={{
                    fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                    fontWeight: '800',
                    background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '1.5rem'
                }}>🎰 Günlük Çark</h2>

                {/* Wheel */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
                    {/* Pointer */}
                    <div style={{
                        position: 'absolute', top: '-16px', left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '14px solid transparent',
                        borderRight: '14px solid transparent',
                        borderTop: '24px solid #fbbf24',
                        zIndex: 10,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                    }} />

                    {/* Wheel SVG */}
                    <svg
                        width="280" height="280"
                        viewBox="0 0 280 280"
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                            filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.4))',
                            maxWidth: '100%',
                            height: 'auto'
                        }}
                    >
                        {PRIZES.map((p, i) => {
                            const startAngle = i * segmentAngle;
                            const endAngle = startAngle + segmentAngle;
                            const startRad = (startAngle - 90) * Math.PI / 180;
                            const endRad = (endAngle - 90) * Math.PI / 180;
                            const x1 = 140 + 130 * Math.cos(startRad);
                            const y1 = 140 + 130 * Math.sin(startRad);
                            const x2 = 140 + 130 * Math.cos(endRad);
                            const y2 = 140 + 130 * Math.sin(endRad);
                            const largeArc = segmentAngle > 180 ? 1 : 0;

                            const midRad = ((startAngle + endAngle) / 2 - 90) * Math.PI / 180;
                            const textX = 140 + 80 * Math.cos(midRad);
                            const textY = 140 + 80 * Math.sin(midRad);
                            const textRotation = (startAngle + endAngle) / 2;

                            return (
                                <g key={i}>
                                    <path
                                        d={`M140,140 L${x1},${y1} A130,130 0 ${largeArc},1 ${x2},${y2} Z`}
                                        fill={p.color}
                                        stroke="rgba(255,255,255,0.3)"
                                        strokeWidth="1.5"
                                    />
                                    <text
                                        x={textX} y={textY}
                                        textAnchor="middle" dominantBaseline="middle"
                                        fill="white" fontWeight="bold"
                                        fontSize="14"
                                        transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                                    >
                                        {p.icon} {p.label}
                                    </text>
                                </g>
                            );
                        })}
                        {/* Center circle */}
                        <circle cx="140" cy="140" r="25" fill="#1e1b4b" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                        <text x="140" y="140" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="20">🎯</text>
                    </svg>
                </div>

                {/* Prize Display */}
                {prize && (
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.1))',
                        border: '2px solid #fbbf24',
                        borderRadius: '16px',
                        padding: '16px',
                        marginBottom: '1rem',
                        animation: 'bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}>
                        <div style={{ fontSize: '2rem' }}>{prize.icon}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fbbf24' }}>
                            {prize.label} Kazandın!
                        </div>
                    </div>
                )}

                {/* Spin Button */}
                <button
                    onClick={spin}
                    disabled={spinning || !canSpin}
                    style={{
                        padding: '14px 40px',
                        background: canSpin
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                            : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '16px',
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: '800',
                        cursor: canSpin ? 'pointer' : 'not-allowed',
                        opacity: spinning ? 0.7 : 1,
                        boxShadow: canSpin ? '0 6px 0 #92400e, 0 12px 20px rgba(217, 119, 6, 0.3)' : 'none',
                        transition: 'all 0.2s',
                        width: '100%',
                        maxWidth: '300px'
                    }}
                >
                    {spinning ? '🎰 Dönüyor...' : canSpin ? '🎰 Çevir!' : '⏰ Yarın tekrar gel!'}
                </button>

                {!canSpin && !prize && (
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '12px' }}>
                        Bugün çarkını zaten çevirdin. Yarın tekrar dene!
                    </p>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes bounceIn {
                    from { opacity: 0; transform: scale(0.5); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
