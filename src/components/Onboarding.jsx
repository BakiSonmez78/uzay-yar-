import React, { useState } from 'react';
import { t } from '../utils/i18n';
import astromathLogo from '../assets/astromath_logo.jpg';

const ONBOARD_KEY = 'astromath_onboarded';

export function needsOnboarding() {
    return !localStorage.getItem(ONBOARD_KEY);
}

export function markOnboarded() {
    localStorage.setItem(ONBOARD_KEY, 'true');
}

const steps = [
    { icon: '🎮', titleKey: 'onboard_step1_title', descKey: 'onboard_step1_desc', emoji: '🌐👥🤖' },
    { icon: '⚡', titleKey: 'onboard_step2_title', descKey: 'onboard_step2_desc', emoji: '✅❌⏱️' },
    { icon: '🏆', titleKey: 'onboard_step3_title', descKey: 'onboard_step3_desc', emoji: '⭐📊👑' },
    { icon: '🏪', titleKey: 'onboard_step4_title', descKey: 'onboard_step4_desc', emoji: '🪙🐉🎨' },
];

export default function Onboarding({ onFinish }) {
    const [step, setStep] = useState(-1); // -1 = welcome

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            markOnboarded();
            onFinish();
        }
    };

    const handleSkip = () => {
        markOnboarded();
        onFinish();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, padding: '1rem'
        }}>
            <div style={{
                maxWidth: '420px', width: '100%', textAlign: 'center',
                animation: 'fadeIn 0.5s ease'
            }}>
                {/* Welcome Screen */}
                {step === -1 && (
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                        <img src={astromathLogo} alt="Astromath" style={{
                            width: '140px', height: '140px', borderRadius: '28px',
                            boxShadow: '0 12px 40px rgba(99,102,241,0.4)',
                            marginBottom: '1.5rem',
                            animation: 'pop-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }} />
                        <h1 style={{
                            fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: '800',
                            color: 'white', marginBottom: '0.5rem'
                        }}>
                            {t('onboard_welcome')}
                        </h1>
                        <p style={{
                            color: '#94a3b8', fontSize: '1rem',
                            marginBottom: '2.5rem', lineHeight: '1.6'
                        }}>
                            {t('login_subtitle')}
                        </p>

                        <button onClick={handleNext} style={{
                            width: '100%', padding: '16px', borderRadius: '16px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none', color: 'white', fontWeight: '800',
                            fontSize: '1.1rem', cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(99,102,241,0.3)'
                        }}>
                            {t('onboard_next')} →
                        </button>
                    </div>
                )}

                {/* Tutorial Steps */}
                {step >= 0 && step < steps.length && (
                    <div style={{ animation: 'fadeIn 0.4s ease' }} key={step}>
                        {/* Progress dots */}
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '2rem' }}>
                            {steps.map((_, i) => (
                                <div key={i} style={{
                                    width: i === step ? '24px' : '8px',
                                    height: '8px', borderRadius: '4px',
                                    background: i === step ? '#6366f1' : 'rgba(255,255,255,0.2)',
                                    transition: 'all 0.3s'
                                }} />
                            ))}
                        </div>

                        {/* Icon Circle */}
                        <div style={{
                            width: '100px', height: '100px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
                            border: '2px solid rgba(99,102,241,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '3rem', margin: '0 auto 1.5rem',
                            animation: 'pop-in 0.5s ease'
                        }}>
                            {steps[step].icon}
                        </div>

                        <h2 style={{
                            fontSize: 'clamp(1.3rem, 4vw, 1.6rem)', fontWeight: '800',
                            color: 'white', marginBottom: '0.75rem'
                        }}>
                            {t(steps[step].titleKey)}
                        </h2>

                        <p style={{
                            color: '#94a3b8', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                            marginBottom: '1rem', lineHeight: '1.6'
                        }}>
                            {t(steps[step].descKey)}
                        </p>

                        {/* Emoji hints */}
                        <div style={{
                            fontSize: '2rem', letterSpacing: '8px',
                            marginBottom: '2rem', opacity: 0.7
                        }}>
                            {steps[step].emoji}
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {step > 0 && (
                                <button onClick={() => setStep(step - 1)} style={{
                                    flex: 1, padding: '14px', borderRadius: '14px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'white', fontWeight: '700',
                                    fontSize: '1rem', cursor: 'pointer'
                                }}>
                                    ← {t('onboard_prev')}
                                </button>
                            )}
                            <button onClick={handleNext} style={{
                                flex: 2, padding: '14px', borderRadius: '14px',
                                background: step === steps.length - 1
                                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none', color: 'white', fontWeight: '800',
                                fontSize: '1.1rem', cursor: 'pointer',
                                boxShadow: '0 4px 20px rgba(99,102,241,0.3)'
                            }}>
                                {step === steps.length - 1 ? t('onboard_start') : `${t('onboard_next')} →`}
                            </button>
                        </div>

                        {/* Skip */}
                        <button onClick={handleSkip} style={{
                            marginTop: '1rem', background: 'none', border: 'none',
                            color: '#64748b', fontSize: '0.85rem', cursor: 'pointer'
                        }}>
                            {t('onboard_skip')}
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pop-in {
                    0% { transform: scale(0.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
