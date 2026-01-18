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

        // Try to rejoin any active tournament
        if (userData?.uid) {
            socket.emit('rejoin_tournament', { uid: userData.uid });
        }

        const onListUpdate = (tournaments) => {
            console.log('[Tournament] List update received:', tournaments);
            setAvailableTournaments(tournaments);
        };

        const onRejoined = ({ tournament }) => {
            if (tournament) {
                console.log('[Tournament] Rejoined active tournament:', tournament);
                setCurrentTournament(tournament);
                setIsCreator(tournament.creator.uid === userData.uid);
                setView('waiting'); // Shows lobby or bracket depending on status

                // If match is already in progress (e.g. reload during game), auto-join
                if (tournament.status === 'in_progress' && tournament.bracket) {
                    const myMatch = tournament.bracket.find(m =>
                        m.status === 'scheduled' && // Actually if in_progress on server, status here might be scheduled initially? 
                        // No, server sends updated bracket
                        m.playersList.some(p => p.uid === userData.uid) &&
                        !m.winner
                    );

                    // If server says 'scheduled' or 'in_progress' (we don't persist in_progress status on bracket match explicitly in all cases, 
                    // but we do in startTournament it sets status='scheduled'. 
                    // Wait, server code sets status='scheduled' initially.

                    if (myMatch) {
                        // Auto join ONLY if we are sure? Or user can wait.
                        // Let's auto-join to be safe.
                        console.log('[Tournament] Auto-joining pending match after rejoin:', myMatch.roomId);
                        socket.emit('join_match', { roomId: myMatch.roomId });
                    }
                }
            }
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

        const onInfoReceived = (tournament) => {
            if (tournament) {
                setCurrentTournament(prev => {
                    if (!prev || prev.id !== tournament.id) return prev; // Only update if same tournament

                    // Check state transition from waiting/undefined to in_progress
                    if (prev.status !== 'in_progress' && tournament.status === 'in_progress') {
                        console.log('[Tournament] Polling detected start! Checking for matches...');
                        if (tournament.bracket) {
                            const myMatch = tournament.bracket.find(m =>
                                m.status !== 'finished' && m.playersList.some(p => p.uid === userData.uid)
                            );
                            if (myMatch) {
                                console.log('[Tournament] Auto-joining match found via poll:', myMatch.roomId);
                                socket.emit('join_match', { roomId: myMatch.roomId });
                            }
                        }
                    }
                    return tournament;
                });
            }
        };

        socket.on('tournament_rejoined', onRejoined);
        socket.on('tournament_list_update', onListUpdate);
        socket.on('tournament_created', onCreated);
        socket.on('tournament_joined_success', onJoinedSuccess);
        socket.on('tournament_update', onUpdate);
        socket.on('tournament_started', onStarted);
        socket.on('tournament_bracket_update', onBracketUpdate);
        socket.on('tournament_round_update', onRoundUpdate);
        socket.on('tournament_finished', onFinished);
        socket.on('tournament_info', onInfoReceived);

        return () => {
            console.log('[Tournament] useEffect cleanup');
            socket.off('tournament_rejoined', onRejoined);
            socket.off('tournament_list_update', onListUpdate);
            socket.off('tournament_created', onCreated);
            socket.off('tournament_joined_success', onJoinedSuccess);
            socket.off('tournament_update', onUpdate);
            socket.off('tournament_started', onStarted);
            socket.off('tournament_bracket_update', onBracketUpdate);
            socket.off('tournament_round_update', onRoundUpdate);
            socket.off('tournament_finished', onFinished);
            socket.off('tournament_info', onInfoReceived);
        };
    }, [socket, userData.uid]);

    // Polling for tournament status (Fix for stuck players)
    useEffect(() => {
        let interval;
        if (currentTournament && currentTournament.id && (currentTournament.status === 'waiting' || currentTournament.status === 'in_progress')) {
            // console.log('[Tournament] Poll sending...'); // Too verbose
            interval = setInterval(() => {
                socket.emit('get_tournament_info', { tournamentId: currentTournament.id });
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [currentTournament?.id, currentTournament?.status, socket]);

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
            let roundsToRender = {};

            // Use real bracket if available
            if (currentTournament.bracket && currentTournament.bracket.length > 0) {
                currentTournament.bracket.forEach(match => {
                    if (!roundsToRender[match.round]) roundsToRender[match.round] = [];
                    roundsToRender[match.round].push(match);
                });
            } else {
                // Generate Placeholder Bracket Structure
                const totalRounds = Math.log2(currentTournament.size);
                for (let r = 1; r <= totalRounds; r++) {
                    roundsToRender[r] = [];
                    const matchesInRound = currentTournament.size / Math.pow(2, r);
                    for (let m = 0; m < matchesInRound; m++) {
                        roundsToRender[r].push({
                            id: `placeholder_r${r}_m${m}`,
                            round: r,
                            status: 'pending',
                            playersList: [{ name: '?' }, { name: '?' }]
                        });
                    }
                }
            }

            return (
                <div className="bracket-container" style={{ display: 'flex', gap: '2rem', overflowX: 'auto', padding: '1rem', justifyContent: 'center' }}>
                    {Object.keys(roundsToRender).map(round => (
                        <div key={round} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '1rem', minWidth: '220px' }}>
                            <h3 style={{ textAlign: 'center', color: '#fbbf24', marginBottom: '0.5rem' }}>
                                {round == Math.log2(currentTournament.size) ? '🏆 Final' : `${round}. Tur`}
                            </h3>
                            {roundsToRender[round].map((match, mIdx) => (
                                <div key={match.id || mIdx} style={{
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    border: match.status === 'finished' ? '1px solid #4ade80' : '1px solid #666',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}>
                                    {match.playersList && match.playersList.map((p, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            opacity: match.winner && match.winner.uid !== p.uid ? 0.4 : (p.name === '?' ? 0.3 : 1),
                                            fontWeight: match.winner && match.winner.uid === p.uid ? 'bold' : 'normal',
                                            color: match.winner && match.winner.uid === p.uid ? '#4ade80' : 'white',
                                            padding: '4px',
                                            borderRadius: '4px',
                                            background: p.uid === userData.uid ? 'rgba(59, 130, 246, 0.2)' : 'transparent'
                                        }}>
                                            <span style={{ fontSize: '1.2rem' }}>{p.avatar || '👤'}</span>
                                            <span>{p.name} {p.uid === userData.uid && '(Sen)'}</span>
                                            {match.winner && match.winner.uid === p.uid && ' 👑'}
                                        </div>
                                    ))}
                                    {match.status === 'in_progress' && (
                                        <div style={{ fontSize: '0.7rem', position: 'absolute', top: -10, right: 0, background: '#fbbf24', color: 'black', padding: '2px 6px', borderRadius: '10px' }}>
                                            Oynanıyor
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                    {currentTournament.winner && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '200px', justifyContent: 'center', alignItems: 'center' }}>
                            <h3 style={{ color: '#ffd700' }}>Şampiyon 🏆</h3>
                            <div style={{ fontSize: '4rem', animation: 'bounce 1s infinite' }}>{currentTournament.winner.avatar}</div>
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

                {/* Always show bracket (Placeholder or Real) */}
                <div style={{ marginBottom: '2rem' }}>
                    {renderBracket()}
                </div>

                {!isStarted && (
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
