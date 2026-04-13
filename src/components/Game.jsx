import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../utils/soundManager';
import { saveMistake } from './MistakeBook';
import { getSelectedTheme } from '../utils/themes';
import { getAnimalById } from './Profile';

const QUICK_EMOJIS = ['😎', '🔥', '👏', '😱', '💪', '😂'];

const CORRECT_REACTIONS = ['Harika! 🎉', 'Süper! ⭐', 'Bravo! 👏', 'Müthiş! 🚀', 'Aferin! 🌟', 'Dahisin! 🧠'];
const WRONG_REACTIONS = ['Ah! 😢', 'Olsun! 💪', 'Dikkat! 🤔', 'Yakındı! 😅', 'Tekrar dene! 🔄'];

export default function Game({ questions, opponent, opponentScore, socket, roomId, playerId, myName, myAvatar, onFinish, startTime, duration, onQuit }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(duration || 90);
    const [streak, setStreak] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [lives, setLives] = useState(3);
    const [opponentLives, setOpponentLives] = useState(3);
    const [isFinished, setIsFinished] = useState(false);
    const [localOpponentScore, setLocalOpponentScore] = useState(opponentScore || 0);

    // Countdown state
    const [countdown, setCountdown] = useState(3);
    const [gameStarted, setGameStarted] = useState(false);

    // Emoji state
    const [receivedEmoji, setReceivedEmoji] = useState(null);
    const [sentEmoji, setSentEmoji] = useState(null);

    // Visual feedback
    const [screenShake, setScreenShake] = useState(false);
    const [confettiBurst, setConfettiBurst] = useState([]);
    const [toast, setToast] = useState(null);

    // Mascot reaction
    const [mascotReaction, setMascotReaction] = useState(null);

    // Opponent feedback (for opponent avatar reactions)
    const [opponentFeedback, setOpponentFeedback] = useState(null);

    // Theme + Animal Avatar
    const theme = getSelectedTheme();
    const myAnimal = getAnimalById(myAvatar);

    // Boss Battle
    const [isBossQuestion, setIsBossQuestion] = useState(false);
    const [bossDefeated, setBossDefeated] = useState(0);

    // Power-ups
    const [powerups, setPowerups] = useState([]); // [{type, icon, label}]
    const [activeEffects, setActiveEffects] = useState({ freeze: false, double: 0, shield: false });
    const freezeRef = useRef(false);

    // Stats tracking
    const statsRef = useRef({ correctCount: 0, wrongCount: 0, bestStreak: 0, totalAnswerTime: 0, answerCount: 0, fastAnswers: 0 });
    const lastQuestionTimeRef = useRef(Date.now());

    const scoreRef = useRef(score);
    const opponentScoreRef = useRef(localOpponentScore);

    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { opponentScoreRef.current = localOpponentScore; }, [localOpponentScore]);
    useEffect(() => { setLocalOpponentScore(opponentScore); }, [opponentScore]);

    const currentQuestion = questions[currentIndex];

    // --- 3-2-1 GO Countdown ---
    useEffect(() => {
        if (countdown <= 0) {
            setGameStarted(true);
            lastQuestionTimeRef.current = Date.now();
            return;
        }
        const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    // --- Achievement Toasts ---
    const showToast = (icon, text, color) => {
        setToast({ icon, text, color });
        setTimeout(() => setToast(null), 2500);
    };

    const handleFinishGame = (result) => {
        if (isFinished) return;
        setIsFinished(true);
        const finalResult = {
            ...result,
            stats: {
                ...statsRef.current,
                bossDefeated,
                avgAnswerTime: statsRef.current.answerCount > 0
                    ? Math.round(statsRef.current.totalAnswerTime / statsRef.current.answerCount)
                    : 0
            }
        };
        setTimeout(() => onFinish(finalResult), 100);
    };

    // Timer - only starts after countdown
    useEffect(() => {
        if (!gameStarted) return;
        if (timeLeft <= 0) {
            handleFinishGame({ score, opScore: localOpponentScore });
            return;
        }
        if (isFinished) return;

        const endTime = (startTime || Date.now()) + ((duration || 90) * 1000);
        const timer = setInterval(() => {
            if (freezeRef.current) return; // ❄️ Freeze active
            const now = Date.now();
            const msRemaining = endTime - now;
            const secRemaining = Math.max(0, Math.ceil(msRemaining / 1000));
            setTimeLeft(prev => {
                if (secRemaining !== prev && secRemaining <= 10 && secRemaining > 0) {
                    soundManager.playTick(secRemaining <= 5);
                }
                return secRemaining;
            });
        }, 100);

        return () => clearInterval(timer);
    }, [timeLeft, score, startTime, duration, isFinished, gameStarted]);

    // Socket listeners
    useEffect(() => {
        const onQuestionSolved = ({ winnerId, newScores, nextIndex }) => {
            const opponentId = Object.keys(newScores).find(id => id !== playerId);
            if (opponentId) setLocalOpponentScore(newScores[opponentId]);
            if (winnerId !== playerId) {
                // Opponent answered correctly - show opponent avatar reaction
                setOpponentFeedback('correct');
                setTimeout(() => setOpponentFeedback(null), 800);
                setCurrentIndex(nextIndex);
                setStreak(0);
                setFeedback(null);
                lastQuestionTimeRef.current = Date.now();
            } else {
                setScore(newScores[playerId] || 0);
            }
            if (nextIndex >= questions.length) {
                setTimeout(() => handleFinishGame({ score: newScores[playerId], opScore: opponentId ? newScores[opponentId] : 0 }), 1000);
            }
        };

        const onOpponentEliminated = ({ eliminatedId }) => {
            if (isFinished) return;
            if (eliminatedId !== playerId) {
                setIsFinished(true);
                handleFinishGame({ score: scoreRef.current + 100, opScore: opponentScoreRef.current, outcome: 'opponent_eliminated' });
            }
        };

        const onOpponentDisconnected = ({ winnerId, winnerScore, loserScore }) => {
            if (isFinished) return;
            if (winnerId === playerId) {
                setFeedback('correct');
                handleFinishGame({
                    score: winnerScore !== undefined ? winnerScore : Math.max(50, scoreRef.current),
                    opScore: loserScore !== undefined ? loserScore : 0,
                    outcome: 'opponent_disconnected'
                });
            }
        };

        // Forfeit events - when a player quits via X button
        const onForfeitWin = ({ myScore, opponentScore, outcome }) => {
            if (isFinished) return;
            console.log('[Game] Forfeit win received:', { myScore, opponentScore, outcome });
            setFeedback('correct');
            handleFinishGame({
                score: myScore,
                opScore: opponentScore,
                outcome: outcome || 'opponent_disconnected'
            });
        };

        const onForfeitLoss = ({ myScore, opponentScore, outcome }) => {
            if (isFinished) return;
            console.log('[Game] Forfeit loss received:', { myScore, opponentScore, outcome });
            handleFinishGame({
                score: myScore,
                opScore: opponentScore,
                outcome: outcome || 'you_left'
            });
        };

        const onOpponentWrong = () => {
            setOpponentLives(prev => Math.max(0, prev - 1));
            // Show opponent avatar sad reaction
            setOpponentFeedback('wrong');
            setTimeout(() => setOpponentFeedback(null), 800);
        };

        const onEmojiReceived = ({ emoji }) => {
            setReceivedEmoji(emoji);
            setTimeout(() => setReceivedEmoji(null), 2000);
        };

        socket.on('question_solved', onQuestionSolved);
        socket.on('opponent_eliminated', onOpponentEliminated);
        socket.on('opponent_disconnected', onOpponentDisconnected);
        socket.on('game_forfeit_win', onForfeitWin);
        socket.on('game_forfeit_loss', onForfeitLoss);
        socket.on('opponent_wrong_answer', onOpponentWrong);
        socket.on('receive_emoji', onEmojiReceived);

        return () => {
            socket.off('question_solved', onQuestionSolved);
            socket.off('opponent_eliminated', onOpponentEliminated);
            socket.off('opponent_disconnected', onOpponentDisconnected);
            socket.off('game_forfeit_win', onForfeitWin);
            socket.off('game_forfeit_loss', onForfeitLoss);
            socket.off('opponent_wrong_answer', onOpponentWrong);
            socket.off('receive_emoji', onEmojiReceived);
        };
    }, [socket, questions.length, playerId, isFinished]);

    // Confetti burst helper
    const triggerConfetti = () => {
        const particles = Array.from({ length: 12 }).map((_, i) => ({
            id: Date.now() + i,
            x: 50 + (Math.random() - 0.5) * 30,
            y: 40 + (Math.random() - 0.5) * 20,
            color: ['#4ade80', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa'][Math.floor(Math.random() * 5)],
            angle: Math.random() * 360,
            distance: 40 + Math.random() * 60,
            size: 4 + Math.random() * 6
        }));
        setConfettiBurst(particles);
        setTimeout(() => setConfettiBurst([]), 1000);
    };

    const handleAnswer = (selected, e) => {
        if (e?.target) e.target.blur();
        if (!currentQuestion || feedback || !gameStarted) return;

        const answerTime = Date.now() - lastQuestionTimeRef.current;

        if (selected !== currentQuestion.answer) {
            setStreak(0);
            setFeedback('wrong');
            soundManager.playWrong();
            statsRef.current.wrongCount++;

            // Mascot reaction
            setMascotReaction(WRONG_REACTIONS[Math.floor(Math.random() * WRONG_REACTIONS.length)]);
            setTimeout(() => setMascotReaction(null), 1500);

            // Save to mistake book
            saveMistake(currentQuestion, currentQuestion.answer, selected);

            // Screen shake
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 400);

            // Shield power-up check
            if (activeEffects.shield) {
                showToast('🛡️', 'Kalkan korudu!', '#10b981');
                setActiveEffects(prev => ({ ...prev, shield: false }));
            } else {
                setLives(prev => {
                    const newLives = prev - 1;
                    if (newLives <= 0) {
                        setIsFinished(true);
                        setTimeout(() => {
                            socket.emit('player_eliminated', { roomId, playerId });
                            handleFinishGame({ score, opScore: localOpponentScore, outcome: 'eliminated' });
                        }, 500);
                    }
                    return newLives;
                });
            }

            if (isBossQuestion) setIsBossQuestion(false);
            socket.emit('wrong_answer', { roomId, playerId });
            setTimeout(() => setFeedback(null), 800);
            return;
        }

        // Correct answer
        setFeedback('correct');
        soundManager.playCorrect();
        statsRef.current.correctCount++;
        statsRef.current.totalAnswerTime += answerTime;
        statsRef.current.answerCount++;
        if (answerTime < 2000) statsRef.current.fastAnswers++;

        // Mascot reaction
        setMascotReaction(CORRECT_REACTIONS[Math.floor(Math.random() * CORRECT_REACTIONS.length)]);
        setTimeout(() => setMascotReaction(null), 1500);

        // Confetti burst on correct
        triggerConfetti();

        let basePoints = 10;
        const nextStreak = streak + 1;
        const streakBonus = nextStreak >= 3 ? nextStreak : 0;

        // Boss question bonus (5x)
        if (isBossQuestion) {
            basePoints = 50;
            setBossDefeated(prev => prev + 1);
            showToast('👹', 'BOSS YENİLDİ! +50', '#ef4444');
            setIsBossQuestion(false);
        }

        // Double points power-up
        let multiplier = 1;
        if (activeEffects.double > 0) {
            multiplier = 2;
            setActiveEffects(prev => ({ ...prev, double: prev.double - 1 }));
            if (activeEffects.double === 1) showToast('💎', '2x Bitti', '#94a3b8');
        }

        const totalPoints = (basePoints + streakBonus) * multiplier;
        setScore(prev => prev + totalPoints);
        setStreak(nextStreak);

        if (nextStreak > statsRef.current.bestStreak) {
            statsRef.current.bestStreak = nextStreak;
        }

        // Achievement toasts
        if (nextStreak === 3) showToast('🔥', 'İlk Seri!', '#f59e0b');
        if (nextStreak === 5) showToast('💥', 'Süper Seri!', '#ef4444');
        if (nextStreak === 10) showToast('🌟', 'EFSANE SERİ!', '#8b5cf6');
        if (statsRef.current.correctCount === 1) showToast('✅', 'İlk Doğru!', '#4ade80');
        if (answerTime < 1500 && !isBossQuestion) showToast('⚡', 'Yıldırım Hızı!', '#3b82f6');

        // Award power-ups at streak milestones
        const POWERUP_TYPES = [
            { type: 'freeze', icon: '❄️', label: 'Zaman Dondur' },
            { type: 'double', icon: '💎', label: '2x Puan' },
            { type: 'shield', icon: '🛡️', label: 'Kalkan' }
        ];
        if (nextStreak === 4 || nextStreak === 7 || nextStreak === 11) {
            const pu = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
            setPowerups(prev => [...prev, pu]);
            showToast(pu.icon, `${pu.label} kazandın!`, '#8b5cf6');
        }

        // Check if next question should be boss
        if (statsRef.current.correctCount > 0 && statsRef.current.correctCount % 10 === 0) {
            setTimeout(() => setIsBossQuestion(true), 900);
        }

        socket.emit('solve_question', { roomId, playerId, index: currentIndex, answer: selected });

        setTimeout(() => {
            setFeedback(null);
            lastQuestionTimeRef.current = Date.now();
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            if (nextIndex >= questions.length) {
                handleFinishGame({ score: score + totalPoints, opScore: localOpponentScore });
            }
        }, 800);
    };

    const sendEmoji = (emoji) => {
        socket.emit('send_emoji', { roomId, emoji });
        setSentEmoji(emoji);
        setTimeout(() => setSentEmoji(null), 1500);
    };

    const activatePowerup = (index) => {
        const pu = powerups[index];
        if (!pu) return;

        // Remove from inventory
        setPowerups(prev => prev.filter((_, i) => i !== index));

        switch (pu.type) {
            case 'freeze':
                freezeRef.current = true;
                showToast('❄️', 'Zaman 5s dondu!', '#06b6d4');
                setTimeout(() => { freezeRef.current = false; }, 5000);
                break;
            case 'double':
                setActiveEffects(prev => ({ ...prev, double: 3 }));
                showToast('💎', '2x Puan (3 soru)!', '#a855f7');
                break;
            case 'shield':
                setActiveEffects(prev => ({ ...prev, shield: true }));
                showToast('🛡️', 'Kalkan aktif!', '#10b981');
                break;
        }
    };

    // --- COUNTDOWN SCREEN ---
    if (!gameStarted) {
        return (
            <div style={{
                position: 'fixed', inset: 0,
                background: 'radial-gradient(circle at 50% 50%, #172554, #020617)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Outfit", sans-serif', overflow: 'hidden'
            }}>
                <div key={countdown} style={{
                    fontSize: countdown === 0 ? 'clamp(4rem, 15vw, 8rem)' : 'clamp(6rem, 20vw, 12rem)',
                    fontWeight: '900',
                    color: countdown === 3 ? '#ef4444' : countdown === 2 ? '#f59e0b' : countdown === 1 ? '#4ade80' : '#3b82f6',
                    textShadow: `0 0 60px currentColor, 0 0 120px currentColor`,
                    animation: 'countdownPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    userSelect: 'none'
                }}>
                    {countdown === 0 ? 'BAŞLA!' : countdown}
                </div>

                {/* VS Info */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '2rem',
                    marginTop: '3rem', opacity: 0.7
                }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{myName}</span>
                    <span style={{ fontSize: '1.5rem', color: '#8b5cf6' }}>⚔️</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{opponent?.name || 'Robot'}</span>
                </div>

                {/* Expanding ring */}
                <div style={{
                    position: 'absolute',
                    width: '200px', height: '200px',
                    borderRadius: '50%',
                    border: `3px solid ${countdown === 3 ? '#ef4444' : countdown === 2 ? '#f59e0b' : '#4ade80'}`,
                    animation: 'ringExpand 1s ease-out infinite',
                    opacity: 0.3
                }} />

                <style>{`
                    @keyframes countdownPop {
                        0% { transform: scale(0.3); opacity: 0; }
                        50% { transform: scale(1.2); opacity: 1; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    @keyframes ringExpand {
                        0% { transform: scale(0.5); opacity: 0.6; }
                        100% { transform: scale(3); opacity: 0; }
                    }
                `}</style>
            </div>
        );
    }

    if (isFinished) return <div className="card fade-in">Oyun Bitti! Yönlendiriliyor...</div>;
    if (!currentQuestion) return <div>Yükleniyor...</div>;

    // --- Compact Player Bar ---
    const PlayerBar = ({ name, score, lives, isOpponent }) => (
        <div style={{
            display: 'flex', alignItems: 'center',
            gap: 'clamp(6px, 1.5vw, 12px)',
            padding: 'clamp(6px, 1.5vw, 12px) clamp(10px, 2vw, 16px)',
            background: isOpponent
                ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.15), rgba(185, 28, 28, 0.05))'
                : 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(29, 78, 216, 0.05))',
            border: `2px solid ${isOpponent ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
            borderRadius: 'clamp(12px, 2vw, 20px)',
            backdropFilter: 'blur(12px)',
            flex: 1, minWidth: 0, position: 'relative'
        }}>
            {isOpponent && (
                <button onClick={() => confirm('Çıkmak istiyor musunuz?') && (onQuit ? onQuit() : window.location.reload())}
                    style={{
                        position: 'absolute', top: '-8px', right: '-8px',
                        width: '28px', height: '28px', borderRadius: '50%',
                        border: '2px solid #1f2937', background: '#ef4444',
                        color: 'white', fontSize: '0.8rem', fontWeight: 'bold',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
                        zIndex: 20, padding: 0
                    }} title="Oyundan Çık">✕</button>
            )}

            {isOpponent && receivedEmoji && (
                <div style={{
                    position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
                    fontSize: '2rem', animation: 'emojiFloat 2s ease-out forwards',
                    pointerEvents: 'none', zIndex: 30
                }}>{receivedEmoji}</div>
            )}
            {!isOpponent && sentEmoji && (
                <div style={{
                    position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
                    fontSize: '2rem', animation: 'emojiFloat 1.5s ease-out forwards',
                    pointerEvents: 'none', zIndex: 30
                }}>{sentEmoji}</div>
            )}

            <div style={{
                fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: '800',
                color: isOpponent ? '#ef4444' : '#3b82f6', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                textShadow: isOpponent ? '0 0 20px rgba(239, 68, 68, 0.3)' : '0 0 20px rgba(59, 130, 246, 0.3)'
            }}>{score}</div>

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{
                    fontSize: 'clamp(0.7rem, 2vw, 1rem)', fontWeight: '700',
                    color: isOpponent ? '#fca5a5' : '#93c5fd',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>{name} {isOpponent ? '🤖' : ''}</div>
                <div style={{ display: 'flex', gap: '2px' }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <span key={i} style={{
                            fontSize: 'clamp(0.8rem, 2vw, 1.2rem)',
                            opacity: i < lives ? 1 : 0.2, transition: 'all 0.3s'
                        }}>❤️</span>
                    ))}
                </div>
            </div>
        </div>
    );

    const streakParticles = streak >= 3 ? Array.from({ length: Math.min(streak * 2, 20) }).map((_, i) => ({
        id: i, left: Math.random() * 100, size: Math.random() * 4 + 2,
        duration: Math.random() * 1.5 + 0.8, delay: Math.random() * 0.5
    })) : [];

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: streak >= 5
                ? theme.bgStreak5
                : streak >= 3
                    ? theme.bgStreak3
                    : theme.bg,
            display: 'flex', flexDirection: 'column',
            padding: 'clamp(0.5rem, 2vw, 2rem)',
            gap: 'clamp(0.5rem, 1.5vh, 1.5rem)',
            fontFamily: '"Outfit", sans-serif',
            overflow: 'hidden',
            transition: 'background 0.5s ease',
            animation: screenShake ? 'shake 0.4s ease' : 'none'
        }}>

            {/* Confetti Burst */}
            {confettiBurst.map(p => (
                <div key={p.id} style={{
                    position: 'absolute',
                    left: `${p.x}%`, top: `${p.y}%`,
                    width: `${p.size}px`, height: `${p.size}px`,
                    background: p.color, borderRadius: '50%',
                    animation: `confettiFly 0.8s ease-out forwards`,
                    '--angle': `${p.angle}deg`,
                    '--distance': `${p.distance}px`,
                    pointerEvents: 'none', zIndex: 50,
                    boxShadow: `0 0 ${p.size * 2}px ${p.color}`
                }} />
            ))}

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'absolute', top: 'clamp(80px, 12vh, 120px)',
                    left: '50%', transform: 'translateX(-50%)',
                    background: `linear-gradient(135deg, ${toast.color}dd, ${toast.color}88)`,
                    color: 'white', padding: '10px 24px',
                    borderRadius: '30px', fontWeight: '800',
                    fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: `0 4px 20px ${toast.color}66`,
                    animation: 'toastIn 0.4s ease-out',
                    zIndex: 100, whiteSpace: 'nowrap',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    <span style={{ fontSize: '1.3rem' }}>{toast.icon}</span> {toast.text}
                </div>
            )}



            {/* Streak Particles */}
            {streakParticles.map(p => (
                <div key={p.id} style={{
                    position: 'absolute', left: `${p.left}%`, bottom: '-10px',
                    width: `${p.size}px`, height: `${p.size}px`,
                    background: streak >= 5 ? theme.particleColorStreak : theme.particleColor,
                    borderRadius: '50%',
                    boxShadow: `0 0 ${p.size * 4}px ${streak >= 5 ? theme.particleColorStreak : theme.particleColor}`,
                    animation: `streakRise ${p.duration}s ease-out infinite`,
                    animationDelay: `${p.delay}s`,
                    pointerEvents: 'none', opacity: 0.8
                }} />
            ))}

            {/* HEADER */}
            <div style={{
                display: 'flex', alignItems: 'center',
                gap: 'clamp(6px, 1.5vw, 16px)',
                width: '100%', maxWidth: '1200px',
                margin: '0 auto', flexShrink: 0
            }}>
                <PlayerBar name={myName} score={score} lives={lives} />
                <div style={{
                    width: 'clamp(56px, 12vw, 100px)', height: 'clamp(56px, 12vw, 100px)',
                    borderRadius: '50%', background: 'rgba(0,0,0,0.3)',
                    border: `3px solid ${timeLeft <= 10 ? '#ef4444' : theme.timerBorder}`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 ${timeLeft <= 10 ? '30px' : '20px'} ${timeLeft <= 10 ? 'rgba(239, 68, 68, 0.5)' : theme.menuGlow}`,
                    animation: timeLeft <= 10 ? 'pulse 0.8s infinite' : 'none',
                    flexShrink: 0, backdropFilter: 'blur(4px)'
                }}>
                    <span style={{ fontSize: 'clamp(1.2rem, 3.5vw, 2.5rem)', fontWeight: '800', color: 'white', lineHeight: 1 }}>{timeLeft}</span>
                    <span style={{ fontSize: 'clamp(0.5rem, 1.2vw, 0.7rem)', opacity: 0.7, letterSpacing: '1px', fontWeight: 'bold', marginTop: '-2px' }}>SÜRE</span>
                </div>
                <PlayerBar name={opponent?.name || 'Robot'} score={localOpponentScore} lives={opponentLives} isOpponent />
            </div>

            {/* GAME AREA WITH VS MASCOTS */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center',
                width: '100%', maxWidth: '1000px', margin: '0 auto',
                gap: 'clamp(0.5rem, 2vh, 1.5rem)'
            }}>
                {/* Boss Indicator */}
                {isBossQuestion && (
                    <div style={{
                        background: 'linear-gradient(90deg, #ef4444, #f59e0b)',
                        color: 'white', padding: '6px 20px',
                        borderRadius: '30px', fontWeight: '900',
                        fontSize: 'clamp(0.85rem, 2.5vw, 1.3rem)',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 0 30px rgba(239, 68, 68, 0.6)',
                        animation: 'streakPulse 0.6s ease-in-out infinite',
                        border: '2px solid rgba(255,255,255,0.3)'
                    }}>
                        👹 BOSS SORU! (5x Puan)
                    </div>
                )}

                {/* Active Effects */}
                {(activeEffects.shield || activeEffects.double > 0) && (
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {activeEffects.shield && (
                            <span style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', borderRadius: '20px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: '700', color: '#4ade80' }}>🛡️ Kalkan</span>
                        )}
                        {activeEffects.double > 0 && (
                            <span style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid #a855f7', borderRadius: '20px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: '700', color: '#c084fc' }}>💎 2x ({activeEffects.double})</span>
                        )}
                    </div>
                )}

                {/* === VS BATTLE ROW === */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 'clamp(0.5rem, 2vw, 1.5rem)',
                    width: '100%'
                }}>
                    {/* LEFT: My Mascot */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: '4px', minWidth: 'clamp(60px, 12vw, 120px)', flexShrink: 0
                    }}>
                        {mascotReaction && (
                            <div style={{
                                background: mascotReaction.includes('😢') || mascotReaction.includes('🤔') || mascotReaction.includes('😅') || mascotReaction.includes('🔄')
                                    ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                                color: 'white', padding: '4px 10px',
                                borderRadius: '12px 12px 12px 2px',
                                fontSize: 'clamp(0.55rem, 1.3vw, 0.8rem)', fontWeight: '800',
                                boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                                animation: 'mascotFloat 1.8s ease-out forwards',
                                whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.3)'
                            }}>
                                {mascotReaction}
                            </div>
                        )}
                        <div style={{
                            position: 'relative',
                            width: 'clamp(60px, 12vw, 120px)', height: 'clamp(60px, 12vw, 120px)',
                            borderRadius: '50%',
                            background: feedback === 'correct'
                                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                : feedback === 'wrong'
                                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                    : opponentFeedback === 'correct'
                                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                        : opponentFeedback === 'wrong'
                                            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                            : `linear-gradient(135deg, ${myAnimal.color}66, ${myAnimal.color}33)`,
                            border: feedback === 'correct' ? '4px solid #4ade80'
                                : feedback === 'wrong' ? '4px solid #f87171'
                                : opponentFeedback === 'correct' ? '4px solid #f87171'
                                : opponentFeedback === 'wrong' ? '4px solid #4ade80'
                                : `4px solid ${myAnimal.color}88`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 'clamp(2rem, 6vw, 4rem)',
                            boxShadow: feedback === 'correct'
                                ? '0 0 25px rgba(74,222,128,0.6), 0 0 50px rgba(74,222,128,0.2)'
                                : feedback === 'wrong'
                                    ? '0 0 25px rgba(239,68,68,0.6), 0 0 50px rgba(239,68,68,0.2)'
                                    : opponentFeedback === 'correct'
                                        ? '0 0 25px rgba(239,68,68,0.6)'
                                        : opponentFeedback === 'wrong'
                                            ? '0 0 25px rgba(74,222,128,0.6)'
                                            : `0 4px 20px ${myAnimal.color}44`,
                            transition: 'background 0.3s, border 0.3s, box-shadow 0.3s',
                            animation: feedback === 'correct' ? 'avatarBounce 0.6s ease'
                                : feedback === 'wrong' ? 'avatarSad 0.5s ease'
                                : opponentFeedback === 'correct' ? 'avatarSad 0.5s ease'
                                : opponentFeedback === 'wrong' ? 'avatarBounce 0.6s ease'
                                : `${myAnimal.idle} 2s ease-in-out infinite`
                        }}>
                            {myAnimal.emoji}
                        </div>
                        <span style={{
                            fontSize: 'clamp(0.55rem, 1.3vw, 0.75rem)', fontWeight: '700',
                            color: 'rgba(255,255,255,0.8)',
                            background: 'rgba(0,0,0,0.25)', padding: '2px 8px',
                            borderRadius: '8px', maxWidth: '100%',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>{myName || 'Ben'}</span>
                    </div>

                    {/* CENTER: Question */}
                    <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', minWidth: 0
                    }}>
                        <div style={{
                            fontSize: currentQuestion.text && currentQuestion.text.length > 50
                                ? 'clamp(1rem, 3vw, 1.8rem)'
                                : currentQuestion.text && currentQuestion.text.length > 20
                                    ? 'clamp(1.2rem, 4vw, 2.5rem)'
                                    : 'clamp(1.6rem, 6vw, 4rem)',
                            fontWeight: '800',
                            color: feedback === 'wrong' ? '#ef4444' : feedback === 'correct' ? '#4ade80' : isBossQuestion ? '#fbbf24' : 'white',
                            filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.1))',
                            textAlign: 'center', lineHeight: 1.1,
                            padding: isBossQuestion ? '0.8rem' : '0',
                            wordWrap: 'break-word',
                            animation: isBossQuestion ? 'streakPulse 1s ease-in-out infinite'
                                : streak >= 3 ? 'questionGlow 2s ease-in-out infinite'
                                    : feedback === 'wrong' ? 'headShake 0.5s' : 'none',
                            transition: 'color 0.2s',
                            border: isBossQuestion ? '2px solid rgba(239,68,68,0.4)' : 'none',
                            borderRadius: isBossQuestion ? '16px' : '0',
                            background: isBossQuestion ? 'rgba(239,68,68,0.1)' : 'transparent'
                        }}>
                            {currentQuestion.text || `${currentQuestion.num1} ${currentQuestion.op} ${currentQuestion.num2}`}
                        </div>
                    </div>

                    {/* RIGHT: Opponent Avatar */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: '4px', minWidth: 'clamp(60px, 12vw, 120px)', flexShrink: 0
                    }}>
                        {(() => {
                            const oppAnimal = getAnimalById(opponent?.avatar);
                            const isBot = opponent?.isBot || !opponent;
                            const oppEmoji = isBot ? '🤖' : oppAnimal.emoji;
                            const oppColor = isBot ? '#60a5fa' : oppAnimal.color;
                            const oppIdle = isBot ? 'animalWobble' : oppAnimal.idle;
                            return (
                                <div style={{
                                    position: 'relative',
                                    width: 'clamp(60px, 12vw, 120px)', height: 'clamp(60px, 12vw, 120px)',
                                    borderRadius: '50%',
                                    background: opponentFeedback === 'correct'
                                        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                        : opponentFeedback === 'wrong'
                                            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                            : feedback === 'wrong'
                                                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                                : feedback === 'correct'
                                                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                                    : `linear-gradient(135deg, ${oppColor}66, ${oppColor}33)`,
                                    border: opponentFeedback === 'correct' ? '4px solid #4ade80'
                                        : opponentFeedback === 'wrong' ? '4px solid #f87171'
                                        : feedback === 'wrong' ? '4px solid #4ade80'
                                        : feedback === 'correct' ? '4px solid #f87171'
                                        : `4px solid ${oppColor}88`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 'clamp(2rem, 6vw, 4rem)',
                                    boxShadow: opponentFeedback === 'correct'
                                        ? '0 0 25px rgba(74,222,128,0.6)'
                                        : opponentFeedback === 'wrong'
                                            ? '0 0 25px rgba(239,68,68,0.6)'
                                            : feedback === 'wrong'
                                                ? '0 0 25px rgba(74,222,128,0.6)'
                                                : feedback === 'correct'
                                                    ? '0 0 25px rgba(239,68,68,0.6)'
                                                    : `0 4px 20px ${oppColor}44`,
                                    transition: 'background 0.3s, border 0.3s, box-shadow 0.3s',
                                    animation: opponentFeedback === 'correct' ? 'avatarBounce 0.6s ease'
                                        : opponentFeedback === 'wrong' ? 'avatarSad 0.5s ease'
                                        : feedback === 'wrong' ? 'avatarBounce 0.6s ease'
                                        : feedback === 'correct' ? 'avatarSad 0.5s ease'
                                        : `${oppIdle} 2s ease-in-out infinite`
                                }}>
                                    {oppEmoji}
                                </div>
                            );
                        })()}
                        <span style={{
                            fontSize: 'clamp(0.55rem, 1.3vw, 0.75rem)', fontWeight: '700',
                            color: 'rgba(255,255,255,0.8)',
                            background: 'rgba(0,0,0,0.25)', padding: '2px 8px',
                            borderRadius: '8px', maxWidth: '100%',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>{opponent?.name || 'Robot 🤖'}</span>
                    </div>
                </div>

                {/* Options Grid */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 'clamp(0.5rem, 1.5vw, 1.25rem)',
                    width: '100%', padding: '0 0.5rem'
                }}>
                    {currentQuestion.options.map((opt, idx) => {
                        const isCorrect = opt === currentQuestion.answer;
                        const showCorrect = feedback && isCorrect;
                        const showWrong = feedback === 'wrong' && !isCorrect;
                        return (
                            <button key={`${currentIndex}-${idx}`}
                                onClick={(e) => handleAnswer(opt, e)}
                                disabled={feedback !== null}
                                style={{
                                    height: 'clamp(70px, 15vh, 140px)',
                                    background: showCorrect
                                        ? 'linear-gradient(to bottom right, #22c55e, #15803d)'
                                        : 'linear-gradient(to bottom right, #3b82f6, #1d4ed8)',
                                    opacity: (feedback && !isCorrect) ? 0.3 : 1,
                                    border: 'none', borderRadius: 'clamp(14px, 3vw, 24px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                    transform: showCorrect ? 'translateY(4px) scale(1.02)' : 'translateY(0)',
                                    boxShadow: showCorrect
                                        ? 'inset 0 4px 12px rgba(0,0,0,0.3), 0 0 20px rgba(34, 197, 94, 0.4)'
                                        : '0 6px 0 #1e3a8a, 0 12px 16px rgba(0,0,0,0.3)',
                                    transition: 'all 0.15s', position: 'relative', overflow: 'hidden', color: 'white'
                                }}
                                onMouseDown={e => !feedback && (e.currentTarget.style.transform = 'translateY(6px)', e.currentTarget.style.boxShadow = 'inset 0 4px 12px rgba(0,0,0,0.3)')}
                                onMouseUp={e => !feedback && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 6px 0 #1e3a8a, 0 12px 16px rgba(0,0,0,0.3)')}
                            >
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
                                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)',
                                    borderRadius: 'clamp(14px, 3vw, 24px) clamp(14px, 3vw, 24px) 100% 100%'
                                }} />
                                <span style={{
                                    fontSize: 'clamp(1.5rem, 4vw, 3rem)', fontWeight: '800',
                                    color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)', zIndex: 1
                                }}>{opt}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Streak Badge + Emoji Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {streak > 1 && (
                        <div style={{
                            background: streak >= 5
                                ? 'linear-gradient(90deg, #ef4444, #f59e0b)'
                                : 'linear-gradient(90deg, #f59e0b, #d97706)',
                            color: 'white',
                            padding: 'clamp(4px, 1vw, 8px) clamp(12px, 3vw, 24px)',
                            borderRadius: '30px', fontWeight: '800',
                            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: streak >= 5
                                ? '0 0 20px rgba(239, 68, 68, 0.6), 0 4px 12px rgba(245, 158, 11, 0.4)'
                                : '0 4px 12px rgba(245, 158, 11, 0.4)',
                            animation: streak >= 5 ? 'streakPulse 0.5s ease-in-out infinite' : 'bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}>
                            {streak >= 10 ? '🌟' : streak >= 5 ? '💥' : '🔥'} {streak} SERİ{streak >= 5 ? '!' : ''}
                        </div>
                    )}

                    <div style={{
                        display: 'flex', gap: '4px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '24px', padding: '4px 8px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        {QUICK_EMOJIS.map(emoji => (
                            <button key={emoji} onClick={() => sendEmoji(emoji)}
                                style={{
                                    background: 'none', border: 'none',
                                    fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
                                    cursor: 'pointer', padding: '4px',
                                    borderRadius: '8px', transition: 'transform 0.1s',
                                    filter: 'grayscale(0.3)'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.3)'; e.currentTarget.style.filter = 'none'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'grayscale(0.3)'; }}
                            >{emoji}</button>
                        ))}
                    </div>

                    {/* Power-up Inventory */}
                    {powerups.length > 0 && (
                        <div style={{
                            display: 'flex', gap: '6px',
                            background: 'rgba(139, 92, 246, 0.15)',
                            borderRadius: '24px', padding: '4px 10px',
                            border: '1px solid rgba(139, 92, 246, 0.3)'
                        }}>
                            {powerups.map((pu, i) => (
                                <button key={i} onClick={() => activatePowerup(i)}
                                    title={pu.label}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '10px', padding: '6px 10px',
                                        fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
                                        cursor: 'pointer', transition: 'all 0.15s',
                                        animation: 'bounceIn 0.4s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >{pu.icon}</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                @keyframes bounceIn {
                    from { opacity: 0; transform: scale(0.5); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes streakRise {
                    0% { transform: translateY(0) scale(1); opacity: 0; }
                    20% { opacity: 0.8; }
                    100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
                }
                @keyframes streakPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }
                @keyframes questionGlow {
                    0%, 100% { text-shadow: 0 0 10px rgba(255,255,255,0.1); }
                    50% { text-shadow: 0 0 30px rgba(139, 92, 246, 0.5), 0 0 60px rgba(139, 92, 246, 0.2); }
                }
                @keyframes emojiFloat {
                    0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-60px) scale(1.5); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-8px); }
                    40% { transform: translateX(8px); }
                    60% { transform: translateX(-4px); }
                    80% { transform: translateX(4px); }
                }
                @keyframes headShake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-6px); }
                    40% { transform: translateX(6px); }
                    60% { transform: translateX(-3px); }
                    80% { transform: translateX(3px); }
                }
                @keyframes confettiFly {
                    0% { transform: translate(0, 0) scale(1); opacity: 1; }
                    100% {
                        transform: translate(
                            calc(cos(var(--angle)) * var(--distance)),
                            calc(sin(var(--angle)) * var(--distance) - 30px)
                        ) scale(0);
                        opacity: 0;
                    }
                }
                @keyframes toastIn {
                    0% { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.8); }
                    100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                }
                @keyframes mascotFloat {
                    0% { opacity: 1; transform: translateY(0) scale(1); }
                    100% { opacity: 0; transform: translateY(-30px) scale(1.1); }
                }
                @keyframes mascotBounce {
                    0% { transform: scaleX(-1) translateY(0); }
                    30% { transform: scaleX(-1) translateY(-20px) rotate(-10deg); }
                    50% { transform: scaleX(-1) translateY(-25px) rotate(5deg); }
                    70% { transform: scaleX(-1) translateY(-10px); }
                    100% { transform: scaleX(-1) translateY(0); }
                }
                @keyframes mascotSad {
                    0%, 100% { transform: scaleX(-1) translateX(0) rotate(0); }
                    20% { transform: scaleX(-1) translateX(-5px) rotate(-5deg); }
                    40% { transform: scaleX(-1) translateX(5px) rotate(5deg); }
                    60% { transform: scaleX(-1) translateX(-3px) rotate(-3deg); }
                    80% { transform: scaleX(-1) translateX(3px) rotate(3deg); }
                }
                @keyframes mascotIdle {
                    0%, 100% { transform: scaleX(-1) translateY(0); }
                    50% { transform: scaleX(-1) translateY(-4px); }
                }
                @keyframes avatarBounce {
                    0% { transform: scale(1) translateY(0); }
                    25% { transform: scale(1.2) translateY(-15px) rotate(-8deg); }
                    50% { transform: scale(1.15) translateY(-20px) rotate(5deg); }
                    75% { transform: scale(1.1) translateY(-8px) rotate(-3deg); }
                    100% { transform: scale(1) translateY(0) rotate(0); }
                }
                @keyframes avatarSad {
                    0%, 100% { transform: translateX(0) rotate(0) scale(1); }
                    15% { transform: translateX(-6px) rotate(-8deg) scale(0.9); }
                    30% { transform: translateX(6px) rotate(8deg) scale(0.9); }
                    45% { transform: translateX(-4px) rotate(-5deg) scale(0.92); }
                    60% { transform: translateX(4px) rotate(5deg) scale(0.92); }
                    75% { transform: translateX(-2px) rotate(-2deg) scale(0.95); }
                }
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
        </div>
    );
}
