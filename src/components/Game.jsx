import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../utils/soundManager';

export default function Game({ questions, opponent, opponentScore, socket, roomId, playerId, myName, onFinish, startTime, duration, onQuit }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(duration || 90);
    const [streak, setStreak] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [lives, setLives] = useState(3);
    const [opponentLives, setOpponentLives] = useState(3);
    const [isFinished, setIsFinished] = useState(false);
    const [localOpponentScore, setLocalOpponentScore] = useState(opponentScore || 0);

    const scoreRef = useRef(score);
    const opponentScoreRef = useRef(localOpponentScore);

    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { opponentScoreRef.current = localOpponentScore; }, [localOpponentScore]);

    const currentQuestion = questions[currentIndex];

    useEffect(() => {
        setLocalOpponentScore(opponentScore);
    }, [opponentScore]);

    const handleFinishGame = (result) => {
        if (isFinished) return;
        setIsFinished(true);
        setTimeout(() => onFinish(result), 100);
    };

    useEffect(() => {
        if (timeLeft <= 0) {
            handleFinishGame({ score, opScore: localOpponentScore });
            return;
        }
        if (isFinished) return;

        const endTime = (startTime || Date.now()) + ((duration || 90) * 1000);
        const timer = setInterval(() => {
            const now = Date.now();
            const msRemaining = endTime - now;
            const secRemaining = Math.max(0, Math.ceil(msRemaining / 1000));
            setTimeLeft(prev => {
                if (secRemaining !== prev && secRemaining <= 20 && secRemaining > 0) {
                    soundManager.playTick(secRemaining <= 10);
                    if (secRemaining <= 10) {
                        setTimeout(() => soundManager.playTick(true), 500);
                    }
                }
                return secRemaining;
            });
        }, 100);

        return () => clearInterval(timer);
    }, [timeLeft, score, startTime, duration, isFinished]);

    useEffect(() => {
        socket.on('question_solved', ({ winnerId, newScores, nextIndex }) => {
            const opponentId = Object.keys(newScores).find(id => id !== playerId);
            if (opponentId) setLocalOpponentScore(newScores[opponentId]);

            if (winnerId !== playerId) {
                setCurrentIndex(nextIndex);
                setStreak(0);
                setFeedback(null);
            } else {
                setScore(newScores[playerId] || 0);
            }

            if (nextIndex >= questions.length) {
                setTimeout(() => {
                    handleFinishGame({ score: newScores[playerId], opScore: opponentId ? newScores[opponentId] : 0 });
                }, 1000);
            }
        });

        socket.on('opponent_eliminated', ({ eliminatedId }) => {
            if (isFinished) return;
            if (eliminatedId !== playerId) {
                setIsFinished(true);
                handleFinishGame({ score: scoreRef.current + 100, opScore: opponentScoreRef.current, outcome: 'opponent_eliminated' });
            }
        });

        socket.on('opponent_disconnected', ({ winnerId, winnerScore, loserScore }) => {
            if (isFinished) return;
            if (winnerId === playerId) {
                setFeedback('correct');
                handleFinishGame({
                    score: winnerScore !== undefined ? winnerScore : Math.max(50, scoreRef.current),
                    opScore: loserScore !== undefined ? loserScore : 0,
                    outcome: 'opponent_disconnected'
                });
            }
        });

        socket.on('opponent_wrong_answer', () => {
            setOpponentLives(prev => Math.max(0, prev - 1));
        });

        socket.on('game_forfeit_win', ({ myScore, opponentScore, outcome }) => {
            if (isFinished) return;
            setIsFinished(true);
            setFeedback('correct');
            handleFinishGame({ score: myScore, opScore: opponentScore, outcome: 'opponent_disconnected' });
        });

        socket.on('game_forfeit_loss', ({ myScore, opponentScore, outcome }) => {
            if (isFinished) return;
            setIsFinished(true);
            handleFinishGame({ score: myScore, opScore: opponentScore, outcome: 'you_left' });
        });

        return () => {
            socket.off('question_solved');
            socket.off('opponent_disconnected');
            socket.off('opponent_eliminated');
            socket.off('opponent_wrong_answer');
            socket.off('game_forfeit_win');
            socket.off('game_forfeit_loss');
        };
    }, [socket, questions.length, playerId, isFinished]);

    const handleAnswer = (selected, e) => {
        if (e && e.target) e.target.blur();
        if (!currentQuestion || feedback) return;

        if (selected !== currentQuestion.answer) {
            setStreak(0);
            setFeedback('wrong');
            soundManager.playWrong();

            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    setIsFinished(true);
                    setTimeout(() => {
                        socket.emit('player_eliminated', { roomId, playerId });
                        alert('3 hata yaptın! Elendin! 💔');
                        handleFinishGame({ score, opScore: localOpponentScore, outcome: 'eliminated' });
                    }, 500);
                }
                return newLives;
            });

            socket.emit('wrong_answer', { roomId, playerId });
            setTimeout(() => setFeedback(null), 1000);
            return;
        }

        setFeedback('correct');
        soundManager.playCorrect();

        const basePoints = 10;
        const nextStreak = streak + 1;
        const streakBonus = nextStreak >= 3 ? nextStreak : 0;
        setScore(prev => prev + basePoints + streakBonus);
        setStreak(nextStreak);

        socket.emit('solve_question', {
            roomId,
            playerId,
            index: currentIndex,
            answer: selected
        });

        setTimeout(() => {
            setFeedback(null);
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);

            if (nextIndex >= questions.length) {
                handleFinishGame({ score: score + basePoints + streakBonus, opScore: localOpponentScore });
            }
        }, 1000);
    };

    if (isFinished) return <div className="card fade-in">Oyun Bitti! Yönlendiriliyor...</div>;
    if (!currentQuestion) return <div>Yükleniyor...</div>;

    return (
        <div style={{
            width: '100%',
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '1.5rem',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxSizing: 'border-box'
        }}>

            {/* Top Bar - Players Side by Side + Timer + Quit */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                flexShrink: 0,
                gap: '1rem'
            }}>
                {/* Left Player (Me) */}
                <div style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1))',
                    border: '2px solid rgba(59, 130, 246, 0.5)',
                    borderRadius: '16px',
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.25rem' }}>
                            {myName}
                        </div>
                        <div style={{ fontSize: '0.9rem' }}>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <span key={i} style={{ opacity: i < lives ? 1 : 0.3 }}>❤️</span>
                            ))}
                        </div>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#60a5fa' }}>
                        {score}
                    </div>
                </div>

                {/* Center Timer */}
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: timeLeft <= 10 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                    border: `4px solid ${timeLeft <= 10 ? '#ef4444' : '#8b5cf6'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    animation: timeLeft <= 10 ? 'pulse 1s infinite' : 'none',
                    flexShrink: 0
                }}>
                    {timeLeft}
                </div>

                {/* Right Player (Opponent) */}
                <div style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.2), rgba(220, 38, 38, 0.1))',
                    border: '2px solid rgba(248, 113, 113, 0.5)',
                    borderRadius: '16px',
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    opacity: opponent ? 1 : 0.5
                }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f87171' }}>
                        {localOpponentScore}
                    </div>
                    <div style={{ textAlign: 'right', flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.25rem' }}>
                            {opponent ? opponent.name : 'Robot'}
                        </div>
                        <div style={{ fontSize: '0.9rem' }}>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <span key={i} style={{ opacity: i < opponentLives ? 1 : 0.3 }}>❤️</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quit Button */}
                <button
                    onClick={() => {
                        if (confirm('Oyunu terk etmek istediğinize emin misiniz?')) {
                            onQuit ? onQuit() : window.location.reload();
                        }
                    }}
                    style={{
                        padding: '0.75rem 1.25rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '2px solid rgba(239, 68, 68, 0.5)',
                        borderRadius: '12px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        flexShrink: 0
                    }}
                >
                    ❌ Çık
                </button>
            </div>

            {/* Question & Options - Centered */}
            <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                padding: '3rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 0,
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                {/* Question */}
                <div style={{
                    fontSize: currentQuestion.text ? '2rem' : '3.5rem',
                    fontWeight: 'bold',
                    marginBottom: '3rem',
                    color: feedback === 'correct' ? '#4ade80' : feedback === 'wrong' ? '#ef4444' : 'white',
                    transition: 'color 0.3s',
                    textAlign: 'center'
                }}>
                    {currentQuestion.text || `${currentQuestion.num1} ${currentQuestion.op} ${currentQuestion.num2} = ?`}
                </div>

                {/* Options Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1.5rem',
                    width: '100%',
                    maxWidth: '700px'
                }}>
                    {currentQuestion.options.map((opt, idx) => (
                        <button
                            key={`${currentIndex}-${idx}`}
                            onClick={(e) => {
                                e.currentTarget.blur();
                                handleAnswer(opt, e);
                            }}
                            disabled={feedback !== null}
                            style={{
                                minHeight: '120px',
                                fontSize: '2.5rem',
                                fontWeight: 'bold',
                                padding: '1.5rem',
                                borderRadius: '16px',
                                background: feedback && opt === currentQuestion.answer
                                    ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.4), rgba(34, 197, 94, 0.2))'
                                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(109, 40, 217, 0.1))',
                                border: feedback && opt === currentQuestion.answer
                                    ? '3px solid #4ade80'
                                    : '2px solid rgba(139, 92, 246, 0.5)',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                            onMouseEnter={e => {
                                if (!feedback) {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)';
                                }
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                            }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                {/* Streak Indicator */}
                {streak > 2 && (
                    <div style={{
                        marginTop: '2rem',
                        color: '#fbbf24',
                        fontWeight: 'bold',
                        fontSize: '1.5rem',
                        textShadow: '0 2px 8px rgba(251, 191, 36, 0.5)'
                    }}>
                        🔥 {streak} Seri!
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `}</style>
        </div>
    );
}
