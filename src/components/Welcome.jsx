import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../utils/soundManager';
import introVideo from '../assets/intro.mp4';

export default function Welcome({ onStart }) {
  const [introStep, setIntroStep] = useState('logo'); // 'logo', 'video', 'menu'
  const [, forceUpdate] = useState(0); // For re-rendering when sound settings change
  const videoRef = useRef(null);

  // Sequence Timer
  useEffect(() => {
    // Start beach ambience when logo appears
    soundManager.playBeachAmbience();

    // 1. Logo Phase (6 seconds total: text glow, settle, beach reveal)
    const logoTimer = setTimeout(() => {
      soundManager.stopBeachAmbience(); // Stop beach sounds before video
      setIntroStep('video');
    }, 6000);

    return () => {
      clearTimeout(logoTimer);
      soundManager.stopBeachAmbience(); // Cleanup on unmount
    };
  }, []);

  // Video Phase Logic
  useEffect(() => {
    if (introStep === 'video' && videoRef.current) {
      // ... same video logic ...
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => videoRef.current.muted = true);
      }
    }
  }, [introStep]);

  // ... (keep handlers same) ...

  const handleVideoEnded = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIntroStep('menu');
  };

  const handleGameStart = () => {
    console.log("Welcome: Maceraya Başla clicked");
    try {
      soundManager.playMusic();
    } catch (e) {
      console.error("Music play failed:", e);
    }

    if (onStart) {
      console.log("Welcome: Calling onStart...");
      onStart();
    } else {
      console.error("Welcome: onStart prop is missing!");
    }
  };

  return (
    <div className="card fade-in" style={{
      textAlign: 'center',
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      position: 'relative',
      overflow: 'hidden',
      background: 'black'
    }}>

      {/* 1. YAZ GAMES LOGO OVERLAY */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'black',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column', // Stack vertically
        alignItems: 'center',
        justifyContent: 'center',
        opacity: introStep === 'logo' ? 1 : 0,
        pointerEvents: 'none',
        transition: 'opacity 1s ease-in-out'
      }}>
        {/* Animated Text */}
        <h1 style={{
          fontSize: '5vw',
          fontWeight: '900',
          marginBottom: '2rem',
          letterSpacing: '5px',
          animation: 'glow-settle 3s ease-out forwards' // Glow then settle
        }}>
          YAZ GAMES
        </h1>

        {/* Beach Scene Container */}
        <div style={{
          position: 'relative',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'linear-gradient(to bottom, #60a5fa 55%, #fcd34d 55%)', // Sea and Sand
          boxShadow: '0 0 30px rgba(252, 211, 77, 0.3)', // Sunlight glow
          opacity: 0,
          animation: 'pop-in 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          animationDelay: '1.5s' // Appear after text starts settling
        }}>
          {/* Sea Shine */}
          <div style={{
            position: 'absolute', top: '20%', left: '0', width: '100%', height: '10px',
            background: 'rgba(255,255,255,0.2)', transform: 'skewY(-5deg)'
          }}></div>

          {/* Deck Chair / Lounger */}
          <div style={{
            position: 'absolute',
            bottom: '30px',
            left: '50px',
            fontSize: '3rem',
            opacity: 0,
            animation: 'pop-in 0.8s ease-out forwards',
            animationDelay: '2.5s'
          }}>
            🪑
          </div>

          {/* Beach Umbrella - rotated to stand upright */}
          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '85px',
            fontSize: '4rem',
            opacity: 0,
            animation: 'pop-in 0.8s ease-out forwards',
            animationDelay: '3.2s',
            transform: 'scaleX(-1)' // Mirror to face correct direction
          }}>
            ⛱️
          </div>
        </div>
      </div>

      {/* 2. BACKGROUND VIDEO */}
      <video
        ref={videoRef}
        playsInline
        onEnded={handleVideoEnded} // Trigger menu when video finishes
        onClick={handleVideoEnded} // Also trigger menu on click (Skip)
        muted // Default to muted
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain', // Fit screen, do not crop
          opacity: introStep === 'video' ? 1 : 0, // Only visible during video step
          transition: 'opacity 0.5s ease',
          zIndex: 0,
          cursor: introStep === 'video' ? 'pointer' : 'default' // Indicate clickable
        }}
      >
        <source src={introVideo} type="video/mp4" />
      </video>

      {/* 3. MENU OVERLAY */}
      <div style={{
        zIndex: 1,
        padding: '2rem',
        opacity: introStep === 'menu' ? 1 : 0,
        transform: introStep === 'menu' ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 1s ease',
        pointerEvents: introStep === 'menu' ? 'all' : 'none',
        position: 'relative' // For absolute positioning of settings
      }}>
        {/* Audio Settings Toggles */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '0',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => {
              const isEnabled = soundManager.toggleMusic();
              forceUpdate(n => n + 1); // Helper to re-render
            }}
            className="secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '1.2rem', borderRadius: '10px' }}
            title="Müziği Aç/Kapat"
          >
            {soundManager.musicMuted ? '🔇 Müzik' : '🎵 Müzik'}
          </button>
          <button
            onClick={() => {
              const isEnabled = soundManager.toggleSfx();
              forceUpdate(n => n + 1);
            }}
            className="secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '1.2rem', borderRadius: '10px' }}
            title="Ses Efektlerini Aç/Kapat"
          >
            {soundManager.sfxMuted ? '🔇 Efekt' : '🔊 Efekt'}
          </button>
        </div>

        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</h1>
        <h1 style={{ marginBottom: '1rem', textShadow: '0 0 20px rgba(0,0,0,0.8)' }}>Matematik Yarışması</h1>
        <p style={{ fontSize: '1.2rem', color: '#e0e7ff', marginBottom: '3rem', textShadow: '0 0 10px rgba(0,0,0,1)' }}>
          Uzayda matematik okuma saati başlasın!
        </p>

        <button
          onClick={handleGameStart}
          className="pulse-btn"
          style={{
            fontSize: '1.5rem',
            padding: '1rem 4rem',
            background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
            border: 'none',
            borderRadius: '50px',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
            transition: 'transform 0.2s'
          }}
        >
          Maceraya Başla ▶️
        </button>
      </div>
    </div>
  );
}
