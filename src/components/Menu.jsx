import React, { useState, useEffect } from 'react';
import { soundManager } from '../utils/soundManager';
import hedgehogImg from '../assets/hedgehog_pointing.png';
// actually, I'll just use the absolute path for the src attribute for now? No, web browser can't access C:
// I must write the file to the src/assets folder.

// I'll do that first in a separate tool or just write the content to src/components/Menu.jsx assuming the image is there.

export default function Menu({ onStart, onShowLeaderboard, totalScore = 0 }) {
    const [name, setName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('🐶');
    const [showAvatars, setShowAvatars] = useState(false);
    const [, forceUpdate] = useState(0);

    const AVATARS = ['🐶', '🐱', '🦁', '🐯', '🐻', '🐼', '🐨', '🐸', '🦄', '🐲'];

    useEffect(() => {
        console.log("Menu Hub Mounted. Score:", totalScore);
    }, [totalScore]);

    const handleStart = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onStart(name, selectedAvatar);
        }
    };

    const toggleAudio = (type) => {
        if (type === 'music') soundManager.toggleMusic();
        if (type === 'sfx') soundManager.toggleSfx();
        forceUpdate(n => n + 1);
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            maxWidth: '480px', // Mobile view width
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1rem',
            position: 'relative',
            // FRAME STYLE
            border: '8px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '40px',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5), 0 0 0 10px rgba(0,0,0,0.2)',
            background: 'rgba(15, 23, 42, 0.6)' // Slight dark tint for contrast
        }}>
            {/* TOP BAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                {/* Profile / Stats Placeholder */}
                <div style={{
                    background: 'rgba(0,0,0,0.5)',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    <span>🏆</span>
                    <span style={{ fontWeight: 'bold' }}>{totalScore}</span>
                </div>

                {/* Settings & Leaderboard */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={onShowLeaderboard} className="icon-btn" title="Skor Tablosu">
                        🏆
                    </button>
                    <button onClick={() => toggleAudio('music')} className="icon-btn" title="Müzik">
                        {soundManager.musicMuted ? '🔇' : '🎵'}
                    </button>
                    <button onClick={() => toggleAudio('sfx')} className="icon-btn" title="Ses">
                        {soundManager.sfxMuted ? '🔇' : '🔊'}
                    </button>
                </div>
            </div>

            {/* CENTER CHARACTER */}
            {/* CENTER CHARACTER & STAGE */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'flex-end', // Align to bottom of this flexible space
                justifyContent: 'center',
                position: 'relative',
                zIndex: 5,
                paddingBottom: '2rem' // Give some space above the bottom panel
            }}>
                {/* Character */}
                <img
                    src={hedgehogImg}
                    alt="Hero"
                    className="breathe-animation" // Add class for animation
                    style={{
                        width: '100%',
                        maxWidth: '350px',
                        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))',
                        // Removed float animation
                        marginBottom: '-20px' // Slight overlap with bottom panel for depth
                    }}
                />
            </div>

            {/* BOTTOM AREA */}
            <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '30px 30px 0 0',
                padding: '2rem 1.5rem',
                margin: '0 -1rem -1rem -1rem', // Stretch to bottom edges
                borderTop: '1px solid rgba(255,255,255,0.2)',
                zIndex: 10
            }}>
                {/* Name & Avatar Selection */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div
                        onClick={() => setShowAvatars(!showAvatars)}
                        style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            cursor: 'pointer',
                            border: '3px solid white',
                            flexShrink: 0
                        }}>
                        {selectedAvatar}
                    </div>

                    <input
                        type="text"
                        placeholder="İsmin nedir?"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={15}
                        style={{
                            margin: 0,
                            background: 'rgba(0,0,0,0.3)',
                            border: 'none',
                            height: '50px',
                            borderRadius: '15px'
                        }}
                    />
                </div>

                {/* Avatar Slider (Expandable) */}
                {showAvatars && (
                    <div className="fade-in" style={{
                        display: 'flex',
                        gap: '0.5rem',
                        overflowX: 'auto',
                        paddingBottom: '1rem',
                        marginBottom: '1rem'
                    }}>
                        {AVATARS.map(a => (
                            <button
                                key={a}
                                onClick={() => { setSelectedAvatar(a); setShowAvatars(false); }}
                                style={{
                                    fontSize: '2rem',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: selectedAvatar === a ? '2px solid white' : 'none',
                                    borderRadius: '50%',
                                    width: '50px',
                                    height: '50px',
                                    flexShrink: 0,
                                    padding: 0
                                }}
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                )}

                {/* PLAY BUTTON */}
                <button
                    onClick={handleStart}
                    disabled={!name.trim()}
                    className="pulse-btn"
                    style={{
                        width: '100%',
                        padding: '1.2rem',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        background: 'linear-gradient(to bottom, #facc15, #ca8a04)', // Yellow/Gold
                        border: 'none',
                        borderRadius: '20px',
                        color: '#422006',
                        boxShadow: '0 4px 0 #a16207, 0 10px 20px rgba(0,0,0,0.3)',
                        transform: 'translateY(0)',
                        cursor: disabled => disabled ? 'not-allowed' : 'pointer',
                        opacity: name.trim() ? 1 : 0.7
                    }}
                >
                    OYNA ▶️
                </button>
            </div>
        </div>
    );
}
