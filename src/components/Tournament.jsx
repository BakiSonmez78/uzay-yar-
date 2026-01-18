import React, { useState, useEffect } from 'react';

export default function Tournament({ socket, userData, onBack }) {
    const [view, setView] = useState('menu'); // 'menu', 'create', 'browse', 'waiting'
    const [currentTournament, setCurrentTournament] = useState(null);
    const [availableTournaments, setAvailableTournaments] = useState([]);
    const [isCreator, setIsCreator] = useState(false);

    useEffect(() => {
        // Get available tournaments
        socket.emit('get_tournaments');

        socket.on('tournament_list_update', (tournaments) => {
            setAvailableTournaments(tournaments);
        });

        socket.on('tournament_created', (tournament) => {
            setCurrentTournament(tournament);
            setIsCreator(true);
            setView('waiting');
        });

        socket.on('join_request_sent', ({ tournamentId }) => {
            console.log('[Tournament] Join request sent for:', tournamentId);
            console.log('[Tournament] Available tournaments:', availableTournaments);
            // Find the tournament we just requested to join
            const tournament = availableTournaments.find(t => t.id === tournamentId);
            console.log('[Tournament] Found tournament:', tournament);
            if (tournament) {
                setCurrentTournament(tournament);
                setIsCreator(false); // We're a participant, not creator
                setView('waiting');
                console.log('[Tournament] Switched to waiting view');
            } else {
                console.error('[Tournament] Could not find tournament in available list!');
            }
        });

        socket.on('tournament_update', (tournament) => {
            console.log('[Tournament] Received update:', tournament);
            console.log('[Tournament] Current tournament:', currentTournament);
            // Only update if we're in this tournament
            if (currentTournament?.id === tournament.id) {
                console.log('[Tournament] Updating current tournament');
                setCurrentTournament(tournament);
            }
            // Update available list too
            setAvailableTournaments(prev =>
                prev.map(t => t.id === tournament.id ? tournament : t)
            );
        });

        socket.on('tournament_started', (data) => {
            console.log('[Tournament] Tournament started!', data);
            const { tournament, firstRoundMatches } = data;

            // Find my match
            const myMatch = firstRoundMatches.find(match =>
                match.players.some(p => p.uid === userData.uid)
            );

            if (myMatch) {
                console.log('[Tournament] Found my match:', myMatch);
                // Emit join_match to get game data
                socket.emit('join_match', { roomId: myMatch.roomId });
            } else {
                alert('Turnuva başladı ama eşleşme bulunamadı!');
            }
        });

        return () => {
            socket.off('tournament_list_update');
            socket.off('tournament_created');
            socket.off('join_request_sent');
            socket.off('tournament_update');
            socket.off('tournament_started');
        };
    }, [socket, currentTournament, availableTournaments]);

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
        // Don't set currentTournament here - wait for join_request_sent event
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
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Açık Turnuvalar</h1>

                {availableTournaments.length === 0 ? (
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
                                    <button onClick={() => handleRequestJoin(t.id)} style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}>
                                        Katıl
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

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

    // WAITING VIEW
    if (view === 'waiting' && currentTournament) {
        return (
            <div className="card fade-in" style={{ maxWidth: '600px', margin: '2rem auto' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    {isCreator ? '🏆 Turnuvan' : '⏳ Bekleniyor...'}
                </h1>

                <div style={{
                    padding: '1.5rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '15px',
                    marginBottom: '1.5rem'
                }}>
                    <p style={{ fontSize: '1.2rem', textAlign: 'center' }}>
                        {currentTournament.players.length} / {currentTournament.size} Oyuncu
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
                                <span>{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pending Requests (Creator Only) */}
                {isCreator && currentTournament.pendingRequests?.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3>Katılma İstekleri:</h3>
                        {currentTournament.pendingRequests.map((req, idx) => (
                            <div key={idx} style={{
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '10px',
                                marginBottom: '0.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{req.player.avatar}</span>
                                    <span>{req.player.name}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleApprove(req.player.uid)} style={{
                                        padding: '0.5rem 1rem',
                                        background: '#22c55e',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}>
                                        ✓ Kabul
                                    </button>
                                    <button onClick={() => handleReject(req.player.uid)} style={{
                                        padding: '0.5rem 1rem',
                                        background: '#ef4444',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}>
                                        ✗ Reddet
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button onClick={handleLeave} style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '10px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}>
                    ❌ Ayrıl
                </button>
            </div>
        );
    }

    return null;
}
