import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export default function Leaderboard({ onBack }) {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScores = async () => {
            try {
                const q = query(
                    collection(db, "scores"),
                    orderBy("score", "desc"),
                    limit(10)
                );
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => doc.data());
                setScores(data);
            } catch (error) {
                console.error("Error fetching leaderboard: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
        // No socket cleanup needed
    }, []);

    const getFlagEmoji = (countryCode) => {
        if (!countryCode) return '';
        return countryCode.toUpperCase().replace(/./g, char =>
            String.fromCodePoint(127397 + char.charCodeAt(0))
        );
    };

    const tabs = [
        { id: 'weekly', label: 'Haftalık' },
        { id: 'monthly', label: 'Aylık' },
        { id: 'allTime', label: 'Tüm Zamanlar' }
    ];

    return (
        <div className="card fade-in" style={{ maxWidth: '600px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>🏆 Liderlik Tablosu</h2>
                <button className="secondary" onClick={onBack} style={{ padding: '0.5rem 1rem' }}>
                    ⬅️ Geri
                </button>
            </div>

            <div style={{ minHeight: '300px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        Yükleniyor...
                    </div>
                ) : scores.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        Henüz veri yok. İlk şampiyon sen ol!
                    </div>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {scores.map((player, index) => (
                            <li key={index} style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.05)',
                                marginBottom: '0.5rem',
                                borderRadius: '8px',
                                borderLeft: index === 0 ? '4px solid #fbbf24' : index === 1 ? '4px solid #94a3b8' : index === 2 ? '4px solid #b45309' : '4px solid transparent'
                            }}>
                                <div style={{ width: '30px', fontWeight: 'bold', color: index < 3 ? 'var(--accent-primary)' : 'inherit' }}>
                                    #{index + 1}
                                </div>
                                <div style={{ marginRight: '1rem', fontSize: '1.5rem' }}>
                                    {player.avatar}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {player.name} {getFlagEmoji(player.country)}
                                        {player.school && (
                                            <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 'normal' }}>
                                                • {player.school}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {new Date(player.date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#60a5fa' }}>
                                    {player.score}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
