import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function Results({ score, opponentScore, opponentName, onRestart, onPlayAgain, outcomeOverride, isTournament }) {
    const scoreNum = Number(score);
    const opponentScoreNum = Number(opponentScore);

    // Determine result based on explicit outcome override (elimination) or score comparison
    let isWinner, isDraw;

    if (outcomeOverride === 'eliminated' || outcomeOverride === 'you_left') {
        isWinner = false;
        isDraw = false;
    } else if (outcomeOverride === 'opponent_eliminated' || outcomeOverride === 'opponent_disconnected') {
        isWinner = true;
        isDraw = false;
    } else {
        isWinner = scoreNum > opponentScoreNum;
        isDraw = scoreNum === opponentScoreNum;
    }

    const handleRestart = onRestart || onPlayAgain;

    useEffect(() => {
        if (isWinner) {
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#4ade80', '#fbbf24']
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#4ade80', '#fbbf24']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }

        // Auto-return to menu after 5 seconds
        const autoReturnTimer = setTimeout(() => {
            if (handleRestart) handleRestart();
        }, 5000);

        return () => clearTimeout(autoReturnTimer);
    }, [isWinner, handleRestart]);

    return (
        <div className={`card fade-in ${!isWinner && !isDraw ? 'sad-effect' : ''}`} style={{
            maxWidth: '600px',
            textAlign: 'center',
            filter: !isWinner && !isDraw ? 'grayscale(0.8) contrast(1.2)' : 'none',
            transition: 'filter 1s ease'
        }}>
            {!isWinner && !isDraw && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="rain-drop" style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${1 + Math.random()}s`
                        }}>💧</div>
                    ))}
                </div>
            )}

            <div style={{ fontSize: '5rem', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                {isWinner ? '🏆' : isDraw ? '🤝' : '💔'}
            </div>
            <h1 style={{
                color: isWinner ? '#4ade80' : isDraw ? '#fbbf24' : '#ef4444',
                textShadow: isWinner ? '0 0 20px rgba(74, 222, 128, 0.5)' : 'none',
                position: 'relative', zIndex: 1
            }}>
                {isWinner ? 'TEBRİKLER!' : isDraw ? 'BERABERE!' : 'ÜZGÜNÜM...'}
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                {isWinner ? 'Harika bir iş çıkardın!' : isDraw ? 'Dostluk kazandı.' : 'Bir dahaki sefere başaracaksın!'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', margin: '2rem 0', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>SEN</div>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: isWinner ? '#4ade80' : 'white' }}>
                        {score}
                    </div>
                </div>

                <div style={{ alignSelf: 'center', fontSize: '2rem', color: 'var(--text-secondary)' }}>VS</div>

                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>{opponentName || 'Rakip'}</div>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: !isWinner && !isDraw ? '#4ade80' : 'white' }}>
                        {opponentScore}
                    </div>
                </div>
            </div>

            <button onClick={handleRestart} className="success" style={{ position: 'relative', zIndex: 1, minWidth: '200px' }}>
                {isTournament ? (isWinner ? 'Sıradaki Tura Geç ➡️' : 'Turnuva Tablosuna Dön 📋') : 'Ana Menüye Dön 🏠'}
            </button>

            <style>{`
                .rain-drop {
                    position: absolute;
                    top: -20px;
                    font-size: 1.5rem;
                    opacity: 0.6;
                    animation: rain-fall linear infinite;
                }
                @keyframes rain-fall {
                    to { transform: translateY(600px); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
