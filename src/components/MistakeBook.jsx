import React, { useState } from 'react';

const getMistakes = () => {
    try {
        return JSON.parse(localStorage.getItem('astromath_mistakes') || '[]');
    } catch { return []; }
};

export const saveMistake = (question, correctAnswer, yourAnswer) => {
    try {
        const mistakes = getMistakes();
        mistakes.unshift({
            question: question.text || `${question.num1} ${question.op} ${question.num2}`,
            correct: correctAnswer,
            yours: yourAnswer,
            date: Date.now()
        });
        // Keep last 50
        if (mistakes.length > 50) mistakes.length = 50;
        localStorage.setItem('astromath_mistakes', JSON.stringify(mistakes));
    } catch (e) {
        console.error('[Mistakes] Save failed:', e);
    }
};

export const clearMistakes = () => {
    localStorage.removeItem('astromath_mistakes');
};

export default function MistakeBook({ onClose }) {
    const [mistakes] = useState(getMistakes());
    const [practiceMode, setPracticeMode] = useState(false);
    const [practiceIndex, setPracticeIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [practiceScore, setPracticeScore] = useState({ correct: 0, wrong: 0 });

    const handlePracticeAnswer = (isCorrect) => {
        setPracticeScore(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            wrong: prev.wrong + (isCorrect ? 0 : 1)
        }));
        setShowAnswer(true);
        setTimeout(() => {
            setShowAnswer(false);
            if (practiceIndex + 1 < mistakes.length) {
                setPracticeIndex(prev => prev + 1);
            } else {
                setPracticeMode(false); // End of practice
            }
        }, 1500);
    };

    if (practiceMode && mistakes.length > 0) {
        const current = mistakes[practiceIndex];
        return (
            <div style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, backdropFilter: 'blur(8px)'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #1e1b4b, #0f172a)',
                    borderRadius: '32px', padding: 'clamp(1.5rem, 4vw, 2.5rem)',
                    maxWidth: '450px', width: '90%', textAlign: 'center',
                    border: '2px solid rgba(239, 68, 68, 0.3)',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                        Soru {practiceIndex + 1}/{mistakes.length} •
                        ✅ {practiceScore.correct} ❌ {practiceScore.wrong}
                    </div>

                    <div style={{
                        fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                        fontWeight: '800', color: 'white',
                        marginBottom: '2rem',
                        textShadow: '0 0 20px rgba(255,255,255,0.1)'
                    }}>{current.question} = ?</div>

                    {showAnswer ? (
                        <div style={{
                            fontSize: '2rem', fontWeight: '800',
                            color: '#4ade80', marginBottom: '1rem',
                            animation: 'bounceIn 0.3s'
                        }}>
                            ✅ {current.correct}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => handlePracticeAnswer(true)} style={{
                                padding: '16px 32px', background: 'linear-gradient(135deg, #22c55e, #15803d)',
                                border: 'none', borderRadius: '16px', color: 'white',
                                fontSize: '1.3rem', fontWeight: '800', cursor: 'pointer',
                                boxShadow: '0 4px 0 #166534, 0 8px 16px rgba(0,0,0,0.3)'
                            }}>{current.correct}</button>

                            <button onClick={() => handlePracticeAnswer(false)} style={{
                                padding: '16px 32px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                border: 'none', borderRadius: '16px', color: 'white',
                                fontSize: '1.3rem', fontWeight: '800', cursor: 'pointer',
                                boxShadow: '0 4px 0 #1e3a8a, 0 8px 16px rgba(0,0,0,0.3)'
                            }}>{current.yours}</button>
                        </div>
                    )}

                    <button onClick={() => setPracticeMode(false)} style={{
                        marginTop: '2rem', padding: '10px 24px',
                        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '12px', color: 'white', cursor: 'pointer', fontSize: '0.9rem'
                    }}>Çıkış</button>
                </div>

                <style>{`@keyframes bounceIn { from { transform: scale(0.5); } to { transform: scale(1); } }`}</style>
            </div>
        );
    }

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
                borderRadius: '32px', padding: 'clamp(1.5rem, 4vw, 2.5rem)',
                maxWidth: '450px', width: '90%', maxHeight: '80vh',
                display: 'flex', flexDirection: 'column',
                border: '2px solid rgba(239, 68, 68, 0.3)',
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
                    background: 'linear-gradient(90deg, #f87171, #ef4444)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem', textAlign: 'center'
                }}>📖 Yanlış Defteri</h2>

                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {mistakes.length} yanlış kayıtlı
                </p>

                {mistakes.length > 0 && (
                    <button onClick={() => { setPracticeMode(true); setPracticeIndex(0); setPracticeScore({ correct: 0, wrong: 0 }); }} style={{
                        padding: '12px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        border: 'none', borderRadius: '14px', color: 'white',
                        fontWeight: '800', fontSize: '1rem', cursor: 'pointer',
                        marginBottom: '1rem',
                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                    }}>🧠 Tekrar Et ({mistakes.length} soru)</button>
                )}

                <div style={{
                    flex: 1, overflowY: 'auto', display: 'flex',
                    flexDirection: 'column', gap: '8px',
                    paddingRight: '4px'
                }}>
                    {mistakes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                            <p>Henüz yanlış yok! Harika gidiyorsun!</p>
                        </div>
                    ) : (
                        mistakes.map((m, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '12px', padding: '12px 14px',
                                display: 'flex', alignItems: 'center', gap: '12px'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'white' }}>
                                        {m.question}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                                        <span style={{ color: '#4ade80' }}>✅ {m.correct}</span>
                                        <span style={{ margin: '0 8px', color: '#475569' }}>•</span>
                                        <span style={{ color: '#ef4444' }}>❌ {m.yours}</span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#475569' }}>
                                    {new Date(m.date).toLocaleDateString('tr')}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {mistakes.length > 0 && (
                    <button onClick={() => {
                        if (confirm('Tüm yanlışları silmek istediğinize emin misiniz?')) {
                            clearMistakes();
                            onClose();
                        }
                    }} style={{
                        marginTop: '12px', padding: '8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '10px', color: '#ef4444',
                        fontSize: '0.8rem', cursor: 'pointer'
                    }}>🗑️ Tümünü Temizle</button>
                )}
            </div>

            <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
}
