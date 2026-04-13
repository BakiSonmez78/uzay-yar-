import React, { useState } from 'react';
import { getAuth, signInWithPopup, signInWithCredential, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { ANIMAL_AVATARS } from './Profile';
import astromathLogo from '../assets/astromath_logo.jpg';
import { t, getLang, toggleLang } from '../utils/i18n';

export default function Login({ onLoginSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lang, setLangState] = useState(getLang());

    const auth = getAuth();
    const isNative = Capacitor.isNativePlatform();

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            if (isNative) {
                console.log('[Login] Using Capacitor Firebase Authentication for mobile');
                const result = await FirebaseAuthentication.signInWithGoogle();
                console.log('[Login] Capacitor sign-in result:', result);

                const credential = GoogleAuthProvider.credential(result.credential?.idToken);
                const userCredential = await signInWithCredential(auth, credential);
                const user = userCredential.user;

                console.log('[Login] Sign-in successful:', user.email);
                onLoginSuccess({
                    name: user.displayName || 'Google User',
                    avatar: localStorage.getItem('selectedAvatar') || 'cat',
                    email: user.email,
                    uid: user.uid,
                    isGuest: false
                });
            } else {
                console.log('[Login] Using signInWithPopup for web');
                const provider = new GoogleAuthProvider();
                provider.setCustomParameters({ prompt: 'select_account' });

                const result = await signInWithPopup(auth, provider);
                const user = result.user;

                console.log('[Login] Sign-in successful:', user.email);
                onLoginSuccess({
                    name: user.displayName || 'Google User',
                    avatar: localStorage.getItem('selectedAvatar') || 'cat',
                    email: user.email,
                    uid: user.uid,
                    isGuest: false
                });
            }
        } catch (err) {
            console.error('[Login] Google login error:', err);
            console.error('[Login] Error code:', err.code);
            console.error('[Login] Error message:', err.message);

            if (err.code === 'auth/popup-closed-by-user') {
                setError('Giriş penceresi kapatıldı. Lütfen tekrar deneyin.');
            } else if (err.code === 'auth/popup-blocked') {
                setError('Popup engellendi. Lütfen tarayıcı ayarlarınızı kontrol edin.');
            } else if (err.code === 'auth/cancelled-popup-request') {
                setError('Giriş iptal edildi.');
            } else {
                setError('Google girişi başarısız. Lütfen tekrar deneyin.');
            }
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await signInAnonymously(auth);
            const user = result.user;

            const timestamp = Date.now();
            const combined = user.uid + timestamp.toString();

            let hash = 0;
            for (let i = 0; i < combined.length; i++) {
                hash = ((hash << 5) - hash) + combined.charCodeAt(i);
                hash = hash & hash;
            }
            const guestNumber = Math.abs(hash) % 10000;
            const randomAnimal = ANIMAL_AVATARS[Math.abs(hash) % ANIMAL_AVATARS.length];

            onLoginSuccess({
                name: `Guest #${guestNumber}`,
                avatar: randomAnimal.id,
                uid: user.uid + '_' + timestamp,
                isGuest: true
            });
        } catch (err) {
            console.error('Guest login error:', err);
            setError('Misafir girişi başarısız. Lütfen tekrar deneyin.');
            setLoading(false);
        }
    };

    return (
        <div className="card fade-in" style={{
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            padding: '3rem'
        }}>
            <img src={astromathLogo} alt="Astromath" style={{
                width: '120px', height: '120px', borderRadius: '24px',
                marginBottom: '1rem', boxShadow: '0 8px 30px rgba(59,130,246,0.3)'
            }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t('login_title')}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                {t('login_version')}
            </p>

            {/* Language Toggle - flag buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                {[{ code: 'tr', src: 'https://flagcdn.com/w40/tr.png', alt: 'Türkçe' }, { code: 'en', src: 'https://flagcdn.com/w40/gb.png', alt: 'English' }].map(l => (
                    <button key={l.code}
                        onClick={() => { 
                            if (lang !== l.code) { toggleLang(); setLangState(l.code); }
                        }}
                        title={l.alt}
                        style={{
                            width: '42px', height: '42px', borderRadius: '50%',
                            background: lang === l.code
                                ? 'rgba(99,102,241,0.3)'
                                : 'rgba(255,255,255,0.06)',
                            border: lang === l.code
                                ? '2.5px solid #818cf8'
                                : '2.5px solid rgba(255,255,255,0.15)',
                            cursor: 'pointer', padding: '0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s', overflow: 'hidden',
                            boxShadow: lang === l.code
                                ? '0 0 14px rgba(99,102,241,0.4)'
                                : 'none'
                        }}
                    >
                        <img src={l.src} alt={l.alt} style={{ width: '26px', height: '18px', objectFit: 'cover', borderRadius: '2px' }} />
                    </button>
                ))}
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
                {t('login_subtitle')}
            </p>

            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '2rem',
                    color: '#ef4444'
                }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="primary"
                    style={{
                        fontSize: '1.2rem',
                        padding: '1rem 2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: 'linear-gradient(45deg, #4285f4, #34a853)',
                        opacity: loading ? 0.6 : 1
                    }}
                >
                    <span style={{ fontSize: '1.5rem' }}>🔐</span>
                    {t('login_google')}
                </button>

                <button
                    onClick={handleGuestLogin}
                    disabled={loading}
                    className="secondary"
                    style={{
                        fontSize: '1.2rem',
                        padding: '1rem 2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: loading ? 0.6 : 1
                    }}
                >
                    <span style={{ fontSize: '1.5rem' }}>👤</span>
                    {t('login_guest')}
                </button>
            </div>

            {loading && (
                <div style={{ marginTop: '2rem', color: 'var(--text-secondary)' }}>
                    {t('login_loading')}
                </div>
            )}

            <p style={{
                marginTop: '2rem',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)'
            }}>
                {t('login_info')}
            </p>


        </div>
    );
}
