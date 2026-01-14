import React, { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';

export default function Login({ onLoginSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const auth = getAuth();

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            onLoginSuccess({
                name: user.displayName || 'Google User',
                avatar: '👤',
                email: user.email,
                uid: user.uid,
                isGuest: false
            });
        } catch (err) {
            console.error('Google login error:', err);
            setError('Google girişi başarısız. Lütfen tekrar deneyin.');
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await signInAnonymously(auth);
            const user = result.user;

            // Generate guest number from uid
            const guestNumber = parseInt(user.uid.substring(0, 8), 36) % 10000;
            const avatars = ['🚀', '🌟', '⚡', '🎯', '🏆', '💫', '🔥', '⭐'];

            onLoginSuccess({
                name: `Guest #${guestNumber}`,
                avatar: avatars[Math.floor(Math.random() * avatars.length)],
                uid: user.uid,
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
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</h1>
            <h2 style={{ marginBottom: '0.5rem' }}>Matematik Uzay Yarışı</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
                Giriş yaparak maceraya başla!
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
                    Google ile Giriş Yap
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
                    Misafir Olarak Devam Et
                </button>
            </div>

            {loading && (
                <div style={{ marginTop: '2rem', color: 'var(--text-secondary)' }}>
                    Giriş yapılıyor...
                </div>
            )}

            <p style={{
                marginTop: '2rem',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)'
            }}>
                Google ile giriş yaparak skorlarınız kaydedilir ve liderlik tablosunda görünürsünüz.
            </p>
        </div>
    );
}
