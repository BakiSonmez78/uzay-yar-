import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function Results({ score, opponentScore, opponentName, onRestart, onPlayAgain, outcomeOverride, isTournament, stats }) {
    const scoreNum = Number(score) || 0;
    const opponentScoreNum = Number(opponentScore) || 0;

    console.log('[Results] Received props:', { score, opponentScore, scoreNum, opponentScoreNum, outcomeOverride, stats });

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

    // Calculate accuracy
    const totalAnswers = stats ? (stats.correctCount + stats.wrongCount) : 0;
    const accuracy = totalAnswers > 0 ? Math.round((stats.correctCount / totalAnswers) * 100) : 0;

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

        const autoReturnTimer = setTimeout(() => {
            if (handleRestart) handleRestart();
        }, 7000);

        return () => clearTimeout(autoReturnTimer);
    }, [isWinner, handleRestart]);

    const StatBox = ({ icon, label, value, color }) => (
        <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: 'clamp(8px, 2vw, 16px)',
            textAlign: 'center',
            flex: 1,
            minWidth: '80px'
        }}>
            <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', marginBottom: '4px' }}>{icon}</div>
            <div style={{
                fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
                fontWeight: '800',
                color: color || 'white'
            }}>{value}</div>
            <div style={{
                fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)',
                opacity: 0.6,
                marginTop: '2px'
            }}>{label}</div>
        </div>
    );

    return (
        <div className={`card fade-in ${!isWinner && !isDraw ? 'sad-effect' : ''}`} style={{
            maxWidth: '600px',
            textAlign: 'center',
            filter: !isWinner && !isDraw ? 'grayscale(0.8) contrast(1.2)' : 'none',
            transition: 'filter 1s ease',
            padding: 'clamp(1rem, 3vw, 2rem)'
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

            <div style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', marginBottom: '0.5rem', position: 'relative', zIndex: 1 }}>
                {isWinner ? '🏆' : isDraw ? '🤝' : '💔'}
            </div>
            <h1 style={{
                color: isWinner ? '#4ade80' : isDraw ? '#fbbf24' : '#ef4444',
                textShadow: isWinner ? '0 0 20px rgba(74, 222, 128, 0.5)' : 'none',
                position: 'relative', zIndex: 1,
                fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
                marginBottom: '0.5rem'
            }}>
                {isWinner ? 'TEBRİKLER!' : isDraw ? 'BERABERE!' : 'ÜZGÜNÜM...'}
            </h1>
            <p style={{ fontSize: 'clamp(0.8rem, 2vw, 1.1rem)', color: 'var(--text-secondary)', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                {isWinner ? 'Harika bir iş çıkardın!' : isDraw ? 'Dostluk kazandı.' : 'Bir dahaki sefere başaracaksın!'}
            </p>

            {/* Score Comparison */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(1.5rem, 4vw, 3rem)', margin: '1rem 0', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'clamp(0.8rem, 2vw, 1.2rem)', color: 'var(--text-secondary)' }}>SEN</div>
                    <div style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 'bold', color: isWinner ? '#4ade80' : 'white' }}>
                        {score !== undefined && score !== null ? score : '?'}
                    </div>
                </div>

                <div style={{ alignSelf: 'center', fontSize: 'clamp(1.2rem, 3vw, 2rem)', color: 'var(--text-secondary)' }}>VS</div>

                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'clamp(0.8rem, 2vw, 1.2rem)', color: 'var(--text-secondary)' }}>{opponentName || 'Rakip'}</div>
                    <div style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 'bold', color: !isWinner && !isDraw ? '#4ade80' : 'white' }}>
                        {opponentScore !== undefined && opponentScore !== null ? opponentScore : '?'}
                    </div>
                </div>
            </div>

            {/* Match Stats */}
            {stats && (
                <div style={{
                    display: 'flex',
                    gap: 'clamp(6px, 1.5vw, 12px)',
                    margin: '1.5rem 0',
                    position: 'relative',
                    zIndex: 1,
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    <StatBox icon="✅" label="Doğru" value={stats.correctCount || 0} color="#4ade80" />
                    <StatBox icon="❌" label="Yanlış" value={stats.wrongCount || 0} color="#ef4444" />
                    <StatBox icon="🎯" label="İsabet" value={`%${accuracy}`} color={accuracy >= 80 ? '#4ade80' : accuracy >= 50 ? '#fbbf24' : '#ef4444'} />
                    <StatBox icon="🔥" label="En İyi Seri" value={stats.bestStreak || 0} color="#f59e0b" />
                    {stats.avgAnswerTime > 0 && (
                        <StatBox icon="⚡" label="Ort. Süre" value={`${(stats.avgAnswerTime / 1000).toFixed(1)}s`} color="#8b5cf6" />
                    )}
                </div>
            )}

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
