import React, { useEffect, useState } from 'react';
import gameTitleImg from '../assets/astromath_logo_dark.png';
import beachImg from '../assets/yaz_games_beach.jpg';

export default function Welcome({ onStart }) {
  const [stage, setStage] = useState(0); // 0: Yaz Games, 1: Game Title

  useEffect(() => {
    console.log("Welcome component mounted. Multi-stage timer starting...");

    // Stage 0 → 1 (Yaz Games → Game Title) after 3.5s
    const timer1 = setTimeout(() => {
      console.log("Stage 1: Showing game title");
      setStage(1);
    }, 3500);

    // Stage 1 → Menu after 7s total
    const timer2 = setTimeout(() => {
      console.log("Welcome sequence finished. Auto-advancing to menu...");
      if (onStart) onStart();
    }, 7000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onStart]);


  return (
    <div
      className="fade-in"
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0f172a', // Deep dark blue/black
        position: 'fixed',
        top: 0,
        left: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        textAlign: 'center'
      }}
    >

      {/* STAGE 0: YAZ GAMES */}
      {stage === 0 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.5s ease-in',
        }}>

          {/* Cinematic Background Glow */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
            zIndex: 0
          }} />

          <div style={{
            position: 'relative',
            width: 'clamp(300px, 85vw, 900px)',
            zIndex: 1,
            // Clean look, no border styling
          }}>
            <img
              src={beachImg}
              alt="Yaz Games Beach"
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '30px', // Soft modern radius
                boxShadow: '0 30px 80px rgba(0,0,0,0.6)', // Deep immersive shadow
                animation: 'cinematic-scale 3s ease-out forwards', // Faster zoom to finish before transition
                display: 'block'
              }}
            />

            {/* Vignette Overlay inner shadow */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '30px',
              background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.1) 100%)',
              pointerEvents: 'none',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)'
            }} />

            {/* --- Animated Elements Overlaid on Image --- */}

            {/* Palm Sway Left */}
            <div style={{
              position: 'absolute',
              top: '8%',
              left: '3%',
              width: '20%',
              height: '50%',
              animation: 'sway 3s ease-in-out infinite',
              transformOrigin: 'bottom center',
              pointerEvents: 'none'
            }} />

            {/* Palm Sway Right */}
            <div style={{
              position: 'absolute',
              top: '8%',
              right: '3%',
              width: '20%',
              height: '50%',
              animation: 'sway 3.5s ease-in-out infinite',
              animationDelay: '0.5s',
              transformOrigin: 'bottom center',
              pointerEvents: 'none'
            }} />

            {/* Glint Effects - Dramatic Eye Shine for Cat */}
            <div style={{
              position: 'absolute',
              top: '33%', // Slightly down
              left: '62%', // More to the right
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 20%, transparent 70%)',
              opacity: 0,
              animation: 'dramatic-glint 5s infinite', // Slower and longer
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
              filter: 'blur(2px)'
            }} />

          </div>

          <style>{`
            @keyframes cinematic-scale {
                0% { transform: scale(0.9); opacity: 0; filter: blur(10px); }
                100% { transform: scale(1); opacity: 1; filter: blur(0); }
            }
            @keyframes sway {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(2deg); }
            }
            @keyframes dramatic-glint {
                0%, 40% { opacity: 0; transform: scale(0) rotate(0deg); }
                50% { opacity: 1; transform: scale(1.5) rotate(45deg); }
                65% { opacity: 0.8; transform: scale(1.2) rotate(45deg); } /* Linger */
                80% { opacity: 0; transform: scale(0) rotate(90deg); }
                100% { opacity: 0; }
            }
          `}</style>

        </div>
      )}

      {/* STAGE 1: GAME TITLE */}
      {stage === 1 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.5s ease-in',
          pointerEvents: 'none',
          padding: '2rem'
        }}>
          <img
            src={gameTitleImg}
            alt="Astromath"
            style={{
              width: '100%',
              maxWidth: '900px',
              height: 'auto',
              objectFit: 'contain',
              animation: 'pop-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
              filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.3))'
            }}
          />

          {/* Made with Antigravity */}
          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: 0,
            right: 0,
          }}>
            <div style={{
              fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
              fontWeight: '600',
              letterSpacing: '0.5px'
            }}>
              <span style={{ opacity: 0.6, color: 'white' }}>Made with </span>
              <span style={{
                background: 'linear-gradient(90deg, #c084fc, #60a5fa, #c084fc)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '900',
                fontSize: 'clamp(1.8rem, 6vw, 2.8rem)',
                animation: 'shimmer 3s linear infinite'
              }}>
                Antigravity
              </span>
            </div>
            <div style={{
              fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
              opacity: 0.5, color: 'white',
              marginTop: '4px', fontWeight: '500'
            }}>by Google DeepMind</div>
          </div>

          <style>{`
            @keyframes shimmer {
              0% { background-position: 0% center; }
              100% { background-position: 200% center; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
