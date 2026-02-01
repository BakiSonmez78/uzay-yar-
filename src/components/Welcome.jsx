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
      className="card fade-in"

      style={{
        textAlign: 'center',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: '#1a2332',

      }}
    >


      {/* STAGE 0: YAZ GAMES */}
      {stage === 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.5s ease-in',
          pointerEvents: 'none'
        }}>

          {/* Yaz Games Beach Scene - Animated */}
          <div style={{
            position: 'relative',
            width: '90%',
            maxWidth: '800px'
          }}>
            <img
              src={beachImg}
              alt="Yaz Games Beach"
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '20px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                animation: 'fadeIn 1.5s ease-in forwards',
                opacity: 0
              }}
            />

            {/* Animated overlay elements */}
            {/* Palm tree sway effect - Left */}
            <div style={{
              position: 'absolute',
              top: '8%',
              left: '3%',
              width: '20%',
              height: '50%',
              animation: 'sway 3s ease-in-out infinite',
              transformOrigin: 'bottom center',
              pointerEvents: 'none',
              background: 'transparent'
            }} />

            {/* Palm tree sway effect - Right */}
            <div style={{
              position: 'absolute',
              top: '8%',
              right: '3%',
              width: '20%',
              height: '50%',
              animation: 'sway 3.5s ease-in-out infinite',
              animationDelay: '0.5s',
              transformOrigin: 'bottom center',
              pointerEvents: 'none',
              background: 'transparent'
            }} />

            {/* Sunglasses glint - Multiple spots */}
            <div style={{
              position: 'absolute',
              top: '38%',
              right: '28%',
              width: '8px',
              height: '8px',
              background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
              borderRadius: '50%',
              animation: 'glint 2s ease-in-out infinite',
              animationDelay: '0.3s',
              filter: 'blur(1px)'
            }} />

            <div style={{
              position: 'absolute',
              top: '39%',
              right: '23%',
              width: '6px',
              height: '6px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'glint 2s ease-in-out infinite',
              animationDelay: '0.8s',
              filter: 'blur(1px)'
            }} />

            {/* Seagull subtle movement */}
            <div style={{
              position: 'absolute',
              top: '12%',
              left: '18%',
              animation: 'float 4s ease-in-out infinite',
              fontSize: '0px'
            }} />

            {/* Wave shimmer - Ocean */}
            <div style={{
              position: 'absolute',
              bottom: '32%',
              left: '0',
              width: '100%',
              height: '3px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
              animation: 'wave-shimmer 3s linear infinite',
              borderRadius: '50%',
              filter: 'blur(2px)'
            }} />

            {/* Second wave shimmer */}
            <div style={{
              position: 'absolute',
              bottom: '28%',
              left: '0',
              width: '100%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              animation: 'wave-shimmer 4s linear infinite',
              animationDelay: '1s',
              borderRadius: '50%',
              filter: 'blur(1px)'
            }} />
          </div>

        </div>
      )}

      {/* STAGE 1: GAME TITLE */}
      {stage === 1 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
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
              animation: 'pop-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
            }}
          />

          {/* Made with Antigravity - Bottom Center */}
          <div style={{
            position: 'absolute',
            bottom: '30px',
            left: 0,
            right: 0,
          }}>
            <div style={{
              fontSize: '1.5rem',
            }}>
              <span style={{ opacity: 0.7 }}>Made with </span>
              <span style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Antigravity
              </span>
              <span style={{ opacity: 0.7 }}> by Google</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
