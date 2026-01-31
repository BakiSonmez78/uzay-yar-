import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../utils/soundManager';

export default function Game({ questions, opponent, opponentScore, socket, roomId, playerId, myName, onFinish, startTime, duration, onQuit }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(duration || 90);
    const [streak, setStreak] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [bonusPoints, setBonusPoints] = useState(0); // For UI display
    const [lives, setLives] = useState(3); // 3 lives system
    const [opponentLives, setOpponentLives] = useState(3);
    const [isFinished, setIsFinished] = useState(false); // To stop timer and interactions

    const [localOpponentScore, setLocalOpponentScore] = useState(opponentScore || 0);

    // Refs to avoid stale closures in socket listeners
    const scoreRef = useRef(score);
    const opponentScoreRef = useRef(localOpponentScore);

    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { opponentScoreRef.current = localOpponentScore; }, [localOpponentScore]);

    const currentQuestion = questions[currentIndex];

    // Debug logging
    useEffect(() => {
        console.log('[Game] Questions array:', questions);
        console.log('[Game] Current index:', currentIndex);
        console.log('[Game] Current question:', currentQuestion);
    }, [currentIndex, questions, currentQuestion]);

    // Sync local state if prop changes (initial setup)
    useEffect(() => {
        setLocalOpponentScore(opponentScore);
    }, [opponentScore]);

    // Wrap onFinish to prevent multiple calls and ensure cleanup
    const handleFinishGame = (result) => {
        if (isFinished) return;
        setIsFinished(true); // Stop everything

        // Slight delay to allow UI (alerts) to show before unmounting
        setTimeout(() => {
            onFinish(result);
        }, 100);
    };

    useEffect(() => {
        if (timeLeft <= 0) {
            handleFinishGame({ score, opScore: localOpponentScore });
            return;
        }

        // Stop timer if finished
        if (isFinished) return;

        // Calculate absolute end time based on server start time
        // Note: Using client clock for 'now' vs server clock for 'startTime' assumes roughly synced clocks.
        // For simple web apps, this is usually acceptable.
        // A more robust way would be calculating offset, but this solves the "loading delay" drift directly.
        const endTime = (startTime || Date.now()) + ((duration || 90) * 1000);

        // Timer Interval
        const timer = setInterval(() => {
            const now = Date.now();
            const msRemaining = endTime - now;
            const secRemaining = Math.max(0, Math.ceil(msRemaining / 1000));

            setTimeLeft(prev => {
                // If we jumped significantly (e.g. tab inactive), simple decrement might drift.
                // Re-syncing every tick with secRemaining is safer.

                // Only trigger effects if second actually changed to prevent flutter
                if (secRemaining !== prev) {
                    // Tick Tock Logic
                    if (secRemaining <= 20 && secRemaining > 0) {
                        const isUrgent = secRemaining <= 10;
                        soundManager.playTick(isUrgent);

                        // Double time (extra tick) for last 10 seconds
                        if (isUrgent) {
                            setTimeout(() => soundManager.playTick(true), 500);
                        }
                    }
                }
                return secRemaining;
            });

        }, 100); // Check more frequently to align seconds

        return () => clearInterval(timer);
    }, [timeLeft, onFinish, score, startTime, duration]);

    useEffect(() => {
        socket.on('question_solved', ({ winnerId, newScores, nextIndex, streak, bonus }) => {
            // Update Opponent Score Locally
            const opponentId = Object.keys(newScores).find(id => id !== playerId);
            if (opponentId) {
                setLocalOpponentScore(newScores[opponentId]);
            }

            // If OPPONENT solved it, we must advance too!
            if (winnerId !== playerId) {
                // Opponent won - sync my score from server (I didn't get points)
                setScore(newScores[playerId] || 0);

                console.log("[Game] Opponent solved question. Advancing...");

                // Small delay or instant? Instant is better for sync.
                setCurrentIndex(nextIndex);

                // Reset streak and bonus when opponent wins
                setStreak(0);
                setBonusPoints(0);
                setFeedback(null);
            } else {
                // I won - keep my optimistic score (already updated in handleAnswer)
                // Just verify it matches server (for debugging)
                const serverScore = newScores[playerId] || 0;
                if (Math.abs(score - serverScore) > 1) {
                    console.warn('[Game] Score mismatch!', { client: score, server: serverScore });
                    setScore(serverScore); // Sync if there's a big difference
                }
            }

            // Sync final scores check
            if (nextIndex >= questions.length) {
                setTimeout(() => {
                    handleFinishGame({ score: newScores[playerId], opScore: opponentId ? newScores[opponentId] : 0 });
                }, 1000);
            }
        });

        socket.on('opponent_eliminated', ({ winnerId, eliminatedId }) => {
            if (isFinished) return;
            console.log('[Game] opponent_eliminated received:', { winnerId, eliminatedId, myId: playerId });

            // Logic: If the eliminated player is NOT me, then I won!
            if (eliminatedId !== playerId) {
                setIsFinished(true);
                // Opponent eliminated, I win
                handleFinishGame({ score: scoreRef.current + 100, opScore: opponentScoreRef.current, outcome: 'opponent_eliminated' });
            }
        });

        socket.on('opponent_disconnected', ({ winnerId, winnerScore, loserScore }) => {
            if (isFinished) return;
            if (winnerId === playerId) {
                // Opponent left, we win!
                setFeedback('correct');

                // Backward compatibility: if server doesn't send scores, calculate them
                const finalWinnerScore = winnerScore !== undefined ? winnerScore : Math.max(50, scoreRef.current);
                const finalLoserScore = loserScore !== undefined ? loserScore : 0;

                console.log('[Game] Opponent disconnected (old event)', { finalWinnerScore, finalLoserScore });
                handleFinishGame({ score: finalWinnerScore, opScore: finalLoserScore, outcome: 'opponent_disconnected' });
            }
        });

        socket.on('opponent_wrong_answer', () => {
            setOpponentLives(prev => Math.max(0, prev - 1));
        });

        // NEW: Handle forfeit win (opponent left/disconnected)
        socket.on('game_forfeit_win', ({ myScore, opponentScore, outcome }) => {
            if (isFinished) return;
            console.log('[Game] Opponent forfeited, I win!', { myScore, opponentScore });
            setIsFinished(true);
            setFeedback('correct');
            handleFinishGame({ score: myScore, opScore: opponentScore, outcome: 'opponent_disconnected' });
        });

        // NEW: Handle forfeit loss (I left/disconnected)
        socket.on('game_forfeit_loss', ({ myScore, opponentScore, outcome }) => {
            if (isFinished) return;
            console.log('[Game] I forfeited, I lose', { myScore, opponentScore });
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
    }, [socket, questions.length, playerId, isFinished]); // Removed score from dependency to avoid re-binding loop

    const handleAnswer = (selected, e) => {
        if (e && e.target) {
            e.target.blur();
        }
        if (!currentQuestion) return;

        // If feedback is already showing (we are waiting for next question), ignore input
        if (feedback) return;

        // Optimistic check: if wrong, show local wrong immediately
        if (selected !== currentQuestion.answer) {
            setStreak(0);
            setFeedback('wrong');
            soundManager.playWrong();

            // Deduct a life
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    // Game over - eliminated
                    setIsFinished(true);
                    setTimeout(() => {
                        // Notify server about elimination
                        socket.emit('player_eliminated', { roomId, playerId });
                        alert('5 hata yaptın! Elendin! 💔');
                        handleFinishGame({ score, opScore: localOpponentScore, outcome: 'eliminated' });
                    }, 500);
                }
                return newLives;
            });

            // Notify server to reset streak
            console.log('[Game] Emitting wrong_answer:', { roomId, playerId });
            socket.emit('wrong_answer', { roomId, playerId });

            setTimeout(() => setFeedback(null), 1000); // Clear wrong feedback
            return;
        }

        // Optimistic Success: Assume we are right immediately!
        setFeedback('correct');
        soundManager.playCorrect();

        // Calculate optimistic score update (visual only)
        const basePoints = 10;
        const nextStreak = streak + 1;
        const streakBonus = nextStreak >= 3 ? nextStreak : 0;
        setBonusPoints(streakBonus);
        setScore(prev => prev + basePoints + streakBonus);
        setStreak(nextStreak);

        // Emit to server to sync and allow validation
        socket.emit('solve_question', {
            roomId,
            playerId,
            index: currentIndex,
            answer: selected
        });

        // Automatically move to next question after delay
        // We do NOT wait for server 'question_solved' for visual transition anymore
        // However, we still listen to it to sync accurate scores
        setTimeout(() => {
            setFeedback(null);
            setBonusPoints(0);

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
        <div className="card fade-in" style={{ maxWidth: '900px', position: 'relative', overflow: 'hidden' }}>


            {/* Quit Button - Top Right */}
            <button
                onClick={() => {
                    if (confirm('Oyunu terk etmek istediğinize emin misiniz?')) {
                        if (onQuit) {
                            onQuit();
                        } else {
                            window.location.reload();
                        }
                    }
                }}
                style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    zIndex: 10
                }}
                title="Oyunu Terk Et"
            >
                ❌ Çık
            </button>

            {/* Timer - Top Center */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div className={`timer-circle ${timeLeft <= 20 ? 'urgent' : ''} ${timeLeft <= 10 ? 'pulse-fast' : ''}`} style={{
                    width: '80px',
                    height: '80px',
                    fontSize: '2.5rem'
                }}>
                    {timeLeft}
                </div>
            </div>

            {/* Player & Opponent - Side by Side */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                {/* Player */}
                <div>
                    {/* Name outside card */}
                    <div style={{
                        fontSize: '1.3rem',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                        color: '#60a5fa'
                    }}>
                        {myName}
                    </div>
                    {/* Card */}
                    <div style={{
                        background: 'rgba(96, 165, 250, 0.1)',
                        padding: '1rem',
                        borderRadius: '15px',
                        border: '2px solid rgba(96, 165, 250, 0.3)',
                        textAlign: 'center'
                    }}>
                        {/* Small hearts on top */}
                        <div style={{ fontSize: '1.3rem', letterSpacing: '0.2rem', marginBottom: '0.5rem' }}>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <span key={i} style={{ opacity: i < lives ? 1 : 0.2 }}>
                                    ❤️
                                </span>
                            ))}
                        </div>
                        {/* Big score at bottom */}
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#60a5fa' }}>
                            {score}
                        </div>
                    </div>
                </div>

                {/* Opponent */}
                <div style={{ opacity: opponent ? 1 : 0.5 }}>
                    {/* Name outside card */}
                    <div style={{
                        fontSize: '1.3rem',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                        color: '#f87171'
                    }}>
                        {opponent ? opponent.name : 'Robot'}
                    </div>
                    {/* Card */}
                    <div style={{
                        background: 'rgba(248, 113, 113, 0.1)',
                        padding: '1rem',
                        borderRadius: '15px',
                        border: '2px solid rgba(248, 113, 113, 0.3)',
                        textAlign: 'center'
                    }}>
                        {/* Small hearts on top */}
                        <div style={{ fontSize: '1.3rem', letterSpacing: '0.2rem', marginBottom: '0.5rem' }}>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <span key={i} style={{ opacity: i < opponentLives ? 1 : 0.2 }}>
                                    ❤️
                                </span>
                            ))}
                        </div>
                        {/* Big score at bottom */}
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#f87171' }}>
                            {localOpponentScore}
                        </div>
                    </div>
                </div>
            </div>

            {/* Question */}
            <div style={{
                fontSize: currentQuestion.text ? '1.8rem' : '3rem',
                fontWeight: 'bold',
                margin: '1.5rem 0 2rem',
                color: feedback === 'correct' ? '#4ade80' : feedback === 'wrong' ? '#ef4444' : 'white',
                transition: 'color 0.3s',
                lineHeight: 1.3,
                padding: '0 1rem',
                textAlign: 'center'
            }}>
                {(() => {
                    console.log('[Game] Current Question:', currentQuestion);
                    return currentQuestion.text || `${currentQuestion.num1} ${currentQuestion.op} ${currentQuestion.num2} = ?`;
                })()}
            </div>

            {/* Options */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                maxWidth: '500px',
                margin: '0 auto'
            }}>
                {currentQuestion.options.map((opt, idx) => (
                    <button
                        key={`${currentIndex}-${idx}`}
                        className="option-btn"
                        onClick={(e) => {
                            e.currentTarget.blur();
                            handleAnswer(opt, e);
                        }}
                        disabled={feedback !== null}
                        style={{
                            minHeight: '100px',
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            padding: '1rem',
                            borderRadius: '15px',
                            background: feedback && opt === currentQuestion.answer ? 'rgba(74, 222, 128, 0.3)' : 'rgba(139, 92, 246, 0.2)',
                            border: feedback && opt === currentQuestion.answer ? '3px solid #4ade80' : '2px solid rgba(139, 92, 246, 0.5)',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {opt}
                    </button>
                ))}
            </div>

            {streak > 2 && (
                <div style={{ marginTop: '1rem', color: '#fbbf24', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    🔥 {streak} Seri!
                </div>
            )}

            {bonusPoints > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    color: '#fbbf24',
                    textShadow: '0 0 20px rgba(0,0,0,0.8)',
                    animation: 'floatUp 1.5s ease-out forwards',
                    pointerEvents: 'none',
                    zIndex: 100
                }}>
                    +{bonusPoints} BONUS!
                </div>
            )}
        </div>
    );
}
