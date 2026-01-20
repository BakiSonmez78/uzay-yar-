import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../utils/soundManager';

export default function Game({ questions, opponent, opponentScore, socket, roomId, playerId, myName, onFinish, startTime, duration, onQuit }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(duration || 90);
    const [streak, setStreak] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [bonusPoints, setBonusPoints] = useState(0); // For UI display
    const [lives, setLives] = useState(5); // 5 lives system
    const [opponentLives, setOpponentLives] = useState(5);
    const [isFinished, setIsFinished] = useState(false); // To stop timer and interactions

    const [localOpponentScore, setLocalOpponentScore] = useState(opponentScore || 0);

    // Refs to avoid stale closures in socket listeners
    const scoreRef = useRef(score);
    const opponentScoreRef = useRef(localOpponentScore);

    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { opponentScoreRef.current = localOpponentScore; }, [localOpponentScore]);

    const currentQuestion = questions[currentIndex];

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
            // Update scores using Stable PlayerID
            setScore(newScores[playerId] || 0);

            // Update Opponent Score Locally
            const opponentId = Object.keys(newScores).find(id => id !== playerId);
            if (opponentId) {
                setLocalOpponentScore(newScores[opponentId]);
            }

            // If OPPONENT solved it, we must advance too!
            if (winnerId !== playerId) {
                // Optional: Visual cue that opponent won this round
                console.log("[Game] Opponent solved question. Advancing...");

                // Small delay or instant? Instant is better for sync.
                setCurrentIndex(nextIndex);

                // Reset streak and bonus when opponent wins
                setStreak(0);
                setBonusPoints(0);
                setFeedback(null);
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

        socket.on('opponent_disconnected', ({ winnerId }) => {
            if (isFinished) return;
            if (winnerId === playerId) {
                // Opponent left, we win!
                setFeedback('correct');
                handleFinishGame({ score: scoreRef.current + 50, opScore: opponentScoreRef.current, outcome: 'opponent_disconnected' });
            }
        });

        socket.on('opponent_wrong_answer', () => {
            setOpponentLives(prev => Math.max(0, prev - 1));
        });

        return () => {
            socket.off('question_solved');
            socket.off('opponent_disconnected');
            socket.off('opponent_eliminated');
            socket.off('opponent_wrong_answer');
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
        const streakBonus = nextStreak >= 2 ? (nextStreak * 2) : 0;
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
        <div className="card fade-in" style={{ maxWidth: '900px', position: 'relative' }}>
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

            {/* Header with Scores */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2rem', marginBottom: '2rem', alignItems: 'center' }}>

                {/* Player Score */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                        {/* {getFlagEmoji(myCountry || 'TR')} */} {myName} (SEN)
                    </div>
                    <div className="score-box" style={{
                        fontSize: '2.5rem',
                        color: '#60a5fa',
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {score}
                    </div>
                    {/* Streak Indicator */}
                    {streak > 2 && (
                        <div style={{ color: '#fbbf24', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            🔥 {streak} Seri!
                        </div>
                    )}
                    {/* Lives Display */}
                    <div style={{ marginTop: '0.5rem', fontSize: '1.5rem' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} style={{ opacity: i < lives ? 1 : 0.2 }}>
                                ❤️
                            </span>
                        ))}
                    </div>
                </div>

                {/* Timer */}
                <div style={{ position: 'relative' }}>
                    <div className={`timer-circle ${timeLeft <= 20 ? 'urgent' : ''} ${timeLeft <= 10 ? 'pulse-fast' : ''}`}>
                        {timeLeft}
                    </div>
                </div>

                {/* Opponent Score */}
                <div style={{ textAlign: 'center', opacity: opponent ? 1 : 0.5 }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                        {opponent ? opponent.name : 'Rakip Bekleniyor...'} {/* {opponent && getFlagEmoji(opponent.country || 'TR')} */}
                    </div>
                    <div className="score-box" style={{
                        fontSize: '2.5rem',
                        color: '#f87171',
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {localOpponentScore}
                    </div>
                    {/* Opponent Lives Display */}
                    <div style={{ marginTop: '0.5rem', fontSize: '1.5rem' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} style={{ opacity: i < opponentLives ? 1 : 0.2 }}>
                                ❤️
                            </span>
                        ))}
                    </div>
                </div>

            </div>

            {/* Question */}
            <div style={{
                fontSize: '4rem',
                fontWeight: 'bold',
                margin: '1rem 0 2rem',
                color: feedback === 'correct' ? '#4ade80' : feedback === 'wrong' ? '#ef4444' : 'white',
                transition: 'color 0.3s'
            }}>
                {currentQuestion.num1} {currentQuestion.op} {currentQuestion.num2} = ?
            </div>

            {/* Options */}
            <div className="game-grid">
                {currentQuestion.options.map((opt, idx) => (
                    <button
                        key={`${currentIndex} -${idx} `}
                        className="option-btn"
                        onClick={(e) => {
                            e.currentTarget.blur();
                            handleAnswer(opt, e);
                        }}
                        disabled={feedback !== null}
                        style={{
                            background: feedback && opt === currentQuestion.answer ? 'rgba(74, 222, 128, 0.2)' : undefined,
                            borderColor: feedback && opt === currentQuestion.answer ? '#4ade80' : undefined
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
