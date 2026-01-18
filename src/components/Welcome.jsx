import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../utils/soundManager';
import introVideo from '../assets/intro.mp4';

export default function Welcome({ onStart }) {
  const [introStep, setIntroStep] = useState('logo');
  const [, forceUpdate] = useState(0);

  const finishIntro = () => {
    try {
      soundManager.stopBeachAmbience();
    } catch (e) {
      console.warn("Sound stop failed", e);
    }
    console.log("Welcome: Intro finished. Transitioning to login...");
    if (onStart) onStart();
  };

  // Sequence Timer
  useEffect(() => {
    // Start beach ambience when logo appears
    try {
      soundManager.playBeachAmbience();
    } catch (e) {
      console.warn("Sound play failed", e);
    }

    // Logo Phase (3 seconds now, faster)
    const logoTimer = setTimeout(() => {
      finishIntro();
    }, 3000);

    return () => {
      clearTimeout(logoTimer);
      try { soundManager.stopBeachAmbience(); } catch (e) { }
    };
  }, [onStart]);

  return (
    <div
      className="card fade-in"
      onClick={finishIntro} // Click to skip
      style={{
        textAlign: 'center',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'black',
        cursor: 'pointer' // Show it's clickable
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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 1,
        pointerEvents: 'none',
      }}>
        {/* Animated Text */}
        <h1 style={{
          fontSize: '5vw',
          fontWeight: '900',
          marginBottom: '2rem',
          letterSpacing: '5px',
          animation: 'glow-settle 3s ease-out forwards',
          color: 'white'
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
          animation: 'pop-in 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          animationDelay: '0.5s'
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
            animation: 'pop-in 0.8s ease-out forwards',
            animationDelay: '1s'
          }}>
            🪑
          </div>

          {/* Beach Umbrella */}
          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '85px',
            fontSize: '4rem',
            animation: 'pop-in 0.8s ease-out forwards',
            animationDelay: '1.2s',
            transform: 'scaleX(-1)' // Mirror
          }}>
            ⛱️
          </div>
        </div>
      </div>
    </div>
  );
}
