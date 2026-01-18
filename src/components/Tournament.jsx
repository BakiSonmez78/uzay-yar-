import React, { useState, useEffect } from 'react';

export default function Tournament({ socket, userData, onBack }) {
    const [view, setView] = useState('menu'); // 'menu', 'create', 'browse', 'waiting'
    const [currentTournament, setCurrentTournament] = useState(null);
    const [availableTournaments, setAvailableTournaments] = useState([]);
    const [isCreator, setIsCreator] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        console.log('[Tournament] useEffect mounted. Socket connected:', socket.connected);

        // Get available tournaments
        socket.emit('get_tournaments');

        const onListUpdate = (tournaments) => {
            console.log('[Tournament] List update received:', tournaments);
            setAvailableTournaments(tournaments);
        };

        const onCreated = (tournament) => {
            console.log('[Tournament] Tournament created:', tournament);
            setCurrentTournament(tournament);
            setIsCreator(true);
            setView('waiting');
        };

        const onJoinedSuccess = (tournament) => {
            console.log('[Tournament] Joined success:', tournament);
            setCurrentTournament(tournament);
            setIsCreator(false);
            setView('waiting');
            setIsRequesting(false); // Enable buttons again
        };

        const onUpdate = (tournament) => {
            console.log('[Tournament] Update received:', tournament);

            // Only update current if it matches
            setCurrentTournament(prev => {
                if (prev?.id === tournament.id) {
                    return tournament;
                }
                return prev;
            });

            // Update available list 
            setAvailableTournaments(prev =>
                prev.map(t => t.id === tournament.id ? tournament : t)
            );
        };

        const onStarted = (data) => {
            console.log('[Tournament] Started event received:', data);

            if (!data || !data.tournament) {
                console.error('[Tournament] Invalid started event data:', data);
                return;
            }

            const { tournament, firstRoundMatches } = data;
            setCurrentTournament(tournament); // Sync state with server including bracket

            if (!firstRoundMatches) return;

            const myMatch = firstRoundMatches.find(match =>
                match.players.some(p => p.uid === userData.uid)
            );

            if (myMatch) {
                console.log('[Tournament] My match found, joining room:', myMatch.roomId);
                socket.emit('join_match', { roomId: myMatch.roomId });
            } else {
                console.log('[Tournament] No match for me in this round (maybe waiting for next round)');
            }
        };

        const onBracketUpdate = ({ bracket }) => {
            console.log('[Tournament] Bracket updated:', bracket);
            setCurrentTournament(prev => prev ? { ...prev, bracket } : prev);
        };

        const onRoundUpdate = ({ round, matches }) => {
            console.log(`[Tournament] Round ${round} started`, matches);

            // Update bracket in state needs full tournament sync usually, but we can try to append
            // For now, let's rely on tournament_update or if this payload has full bracket? 
            // It has 'matches' for the new round.
            // Safer to just re-fetch or let's assume we get tournament_update too? 
            // Let's manually check if I am in these matches

            const myMatch = matches.find(match =>
                match.players.some(p => p.uid === userData.uid)
            );

            if (myMatch) {
                console.log(`[Tournament] Round ${round} match found! Joining...`);
                socket.emit('join_match', { roomId: myMatch.roomId });
                alert("Sıradaki tur başlıyor! 🚀");
            }
        };

        const onFinished = ({ winner }) => {
            alert(`Turnuva Bitti! Kazanan: ${winner.name} 🏆`);
            // Maybe show confetti or specialized winner view
        };

        socket.on('tournament_list_update', onListUpdate);
        socket.on('tournament_created', onCreated);
        socket.on('tournament_joined_success', onJoinedSuccess);
        socket.on('tournament_update', onUpdate);
        socket.on('tournament_started', onStarted);
        socket.on('tournament_bracket_update', onBracketUpdate);
        socket.on('tournament_round_update', onRoundUpdate);
        socket.on('tournament_finished', onFinished);

        return () => {
            console.log('[Tournament] useEffect cleanup');
            socket.off('tournament_list_update', onListUpdate);
            socket.off('tournament_created', onCreated);
            socket.off('tournament_joined_success', onJoinedSuccess);
            socket.off('tournament_update', onUpdate);
            socket.off('tournament_started', onStarted);
            socket.off('tournament_bracket_update', onBracketUpdate);
            socket.off('tournament_round_update', onRoundUpdate);
            socket.off('tournament_finished', onFinished);
        };
    }, [socket, userData.uid]);

    const handleCreateTournament = (size) => {
        socket.emit('create_tournament', {
            size,
            creator: {
                uid: userData.uid,
                name: userData.name,
                avatar: userData.avatar
            }
        });
    };

    const handleRequestJoin = (tournamentId) => {
        if (isRequesting) {
            console.log('[Tournament] Already requesting, ignoring duplicate click');
            return;
        }

        setIsRequesting(true);
        console.log('[Tournament] handleRequestJoin called with:', tournamentId);
        console.log('[Tournament] userData:', userData);
        socket.emit('request_join_tournament', {
            tournamentId,
            player: {
                uid: userData.uid,
                name: userData.name,
                avatar: userData.avatar
            }
        });
        console.log('[Tournament] Emitted request_join_tournament event');

        // Reset after 3 seconds if no response
        setTimeout(() => setIsRequesting(false), 3000);
    };

    const handleApprove = (playerUid) => {
        socket.emit('approve_join_request', {
            tournamentId: currentTournament.id,
            playerUid
        });
    };

    const handleReject = (playerUid) => {
        socket.emit('reject_join_request', {
            tournamentId: currentTournament.id,
            playerUid
        });
    };

    const handleLeave = () => {
        if (currentTournament) {
            socket.emit('leave_tournament', {
                tournamentId: currentTournament.id,
                playerId: userData.uid
            });
        }
        setCurrentTournament(null);
        setIsCreator(false);
        setView('menu');
    };

    // MENU VIEW
    if (view === 'menu') {
        return (
            <div className="card fade-in" style={{ maxWidth: '600px', margin: '2rem auto' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>🏆 Turnuva</h1>

                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    <button
                        onClick={() => setView('create')}
                        style={{
                            padding: '1.5rem',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)',
                            border: 'none',
                            borderRadius: '15px',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        ➕ Turnuva Oluştur
                    </button>

                    <button
                        onClick={() => {
                            setView('browse');
                            socket.emit('get_tournaments');
                        }}
                        style={{
                            padding: '1.5rem',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(to bottom, #facc15, #ca8a04)',
                            border: 'none',
                            borderRadius: '15px',
                            color: '#422006',
                            cursor: 'pointer'
                        }}
                    >
                        🔍 Turnuvalara Katıl
                    </button>
                </div>

                <button onClick={onBack} style={{
                    marginTop: '2rem',
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer'
                }}>
                    ← Geri Dön
                </button>
            </div>
        );
    }

    // CREATE VIEW
    if (view === 'create') {
        return (
            <div className="card fade-in" style={{ maxWidth: '600px', margin: '2rem auto' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Turnuva Oluştur</h1>

                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    <button onClick={() => handleCreateTournament(4)} style={{
                        padding: '1.5rem',
                        fontSize: '1.5rem',
                        background: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)',
                        border: 'none',
                        borderRadius: '15px',
                        color: 'white',
                        cursor: 'pointer'
                    }}>
                        🎮 4 Kişilik
                    </button>

                    <button onClick={() => handleCreateTournament(8)} style={{
                        padding: '1.5rem',
                        fontSize: '1.5rem',
                        background: 'linear-gradient(to bottom, #facc15, #ca8a04)',
                        border: 'none',
                        borderRadius: '15px',
                        color: '#422006',
                        cursor: 'pointer'
                    }}>
                        🏆 8 Kişilik
                    </button>
                </div>

                <button onClick={() => setView('menu')} style={{
                    marginTop: '2rem',
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer'
                }}>
                    ← Geri
                </button>
            </div>
        );
    }

    // BROWSE VIEW
    if (view === 'browse') {
        return (
            <div className="card fade-in" style={{ maxWidth: '600px', margin: '2rem auto' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <h1 style={{ margin: 0 }}>Açık Turnuvalar</h1>
                    <button
                        onClick={() => socket.emit('get_tournaments')}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '10px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        🔄 Yenile
                    </button>
                </div>

                {
                    availableTournaments.length === 0 ? (
                        <p style={{ textAlign: 'center', opacity: 0.7 }}>Henüz açık turnuva yok</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {availableTournaments.map(t => (
                                <div key={t.id} style={{
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{t.creator.avatar} {t.creator.name}</div>
                                            <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>
                                                {t.players.length}/{t.size} Oyuncu
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRequestJoin(t.id)}
                                            disabled={isRequesting}
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                background: isRequesting ? '#666' : 'linear-gradient(to bottom, #3b82f6, #1d4ed8)',
                                                border: 'none',
                                                borderRadius: '10px',
                                                color: 'white',
                                                cursor: isRequesting ? 'not-allowed' : 'pointer',
                                                fontWeight: 'bold',
                                                opacity: isRequesting ? 0.6 : 1
                                            }}>
                                            {isRequesting ? 'Gönderiliyor...' : 'Katıl'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                }

                <button onClick={() => setView('menu')} style={{
                    marginTop: '2rem',
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer'
                }}>
                    ← Geri
                </button>
            </div >
        );
    }

    // WAITING / BRACKET VIEW
    if (view === 'waiting' && currentTournament) {

        const isStarted = currentTournament.status === 'in_progress' || currentTournament.status === 'finished';

        const renderBracket = () => {
            if (!currentTournament.bracket) return <div>Eşleşmeler hazırlanıyor...</div>;

            // Group by rounds
            const rounds = {};
            currentTournament.bracket.forEach(match => {
                if (!rounds[match.round]) rounds[match.round] = [];
                rounds[match.round].push(match);
            });

            return (
                <div className="bracket-container" style={{ display: 'flex', gap: '2rem', overflowX: 'auto', padding: '1rem' }}>
                    {Object.keys(rounds).map(round => (
                        <div key={round} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '220px' }}>
                            <h3 style={{ textAlign: 'center', color: '#fbbf24' }}>Tur {round}</h3>
                            {rounds[round].map(match => (
                                <div key={match.id} style={{
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    border: match.status === 'finished' ? '1px solid #4ade80' : '1px solid #666',
                                    position: 'relative'
                                }}>
                                    {match.playersList && match.playersList.map((p, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            opacity: match.winner && match.winner.uid !== p.uid ? 0.4 : 1,
                                            marginTop: idx > 0 ? '0.5rem' : 0,
                                            fontWeight: match.winner && match.winner.uid === p.uid ? 'bold' : 'normal',
                                            color: match.winner && match.winner.uid === p.uid ? '#4ade80' : 'white'
                                        }}>
                                            <span style={{ fontSize: '1.2rem' }}>{p.avatar}</span>
                                            <span>{p.name} {p.uid === userData.uid && '(Sen)'}</span>
                                            {match.winner && match.winner.uid === p.uid && ' 👑'}
                                        </div>
                                    ))}
                                    {match.status === 'in_progress' && (
                                        <div style={{ fontSize: '0.7rem', position: 'absolute', top: '5px', right: '5px', color: '#fbbf24' }}>
                                            Oynanıyor...
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                    {currentTournament.winner && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '200px', justifyContent: 'center', alignItems: 'center' }}>
                            <h3 style={{ color: '#ffd700' }}>Şampiyon 🏆</h3>
                            <div style={{ fontSize: '3rem' }}>{currentTournament.winner.avatar}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{currentTournament.winner.name}</div>
                        </div>
                    )}
                </div>
            );
        };

        return (
            <div className="card fade-in" style={{ maxWidth: '900px', margin: '2rem auto' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    {isStarted ? '🏆 Turnuva Tablosu' : (isCreator ? '🏆 Turnuvan (Lobi)' : '⏳ Bekleniyor...')}
                </h1>

                {!isStarted ? (
                    <>
                        <div style={{
                            padding: '1.5rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: '15px',
                            marginBottom: '1.5rem'
                        }}>
                            <p style={{ fontSize: '1.2rem', textAlign: 'center' }}>
                                {currentTournament.players.length} / {currentTournament.size} Oyuncu Hazır
                            </p>
                            <p style={{ textAlign: 'center', opacity: 0.7, fontSize: '0.9rem' }}>
                                Yeterli oyuncu sayısına ulaşılınca turnuva otomatik başlayacak.
                            </p>
                        </div>

                        {/* Players */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3>Katılımcılar:</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {currentTournament.players.map((p, idx) => (
                                    <div key={idx} style={{
                                        padding: '0.5rem 1rem',
                                        background: 'rgba(34, 197, 94, 0.2)',
                                        border: '1px solid rgba(34, 197, 94, 0.5)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <span>{p.avatar}</span>
                                        <span>{p.name} {p.uid === userData.uid && '(Sen)'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    // STARTED VIEW - BRACKET
                    <div style={{ marginBottom: '2rem' }}>
                        {renderBracket()}
                    </div>
                )}

                <button onClick={handleLeave} style={{
                    width: '100%',
                    padding: '1rem',
                    marginTop: '2rem',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '10px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}>
                    {isStarted ? '❌ Turnuvadan Çık' : '❌ Ayrıl'}
                </button>
            </div>
        );
    }

    return null;
}
