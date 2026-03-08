import React from 'react';
import { useGame } from '../game/GameContext';
import { playSelectSound } from '../game/audio';

const DatingMenu: React.FC = () => {
  const { setGameState } = useGame();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center anim-screen-wipe" style={{ background: 'linear-gradient(135deg, #1a0020, #2a0040, #1a0020)' }}>
      <h1 className="anim-title-slam" style={{ color: '#ff88cc', fontFamily: "'Orbitron', monospace", fontSize: 36, letterSpacing: 6, marginBottom: 15, textShadow: '0 0 25px #ff00aa' }}>
        CITAS
      </h1>
      <p className="anim-text-reveal" style={{ color: '#cc88ff', fontSize: 13, marginBottom: 50 }}>Elige tu preferencia</p>

      <div style={{ display: 'flex', gap: 30 }}>
        {[
          { label: 'HOMBRES', emoji: '♂️', color: '#4488ff' },
          { label: 'MUJERES', emoji: '♀️', color: '#ff44aa' },
        ].map(opt => (
          <div key={opt.label}
            onClick={() => { playSelectSound(); /* TODO */ }}
            style={{
              width: 200, padding: '40px 20px', cursor: 'pointer', textAlign: 'center',
              background: 'rgba(10,5,20,0.9)', border: `2px solid ${opt.color}40`,
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = opt.color; e.currentTarget.style.boxShadow = `0 0 30px ${opt.color}40`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${opt.color}40`; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: 50, marginBottom: 15 }}>{opt.emoji}</div>
            <div style={{ color: opt.color, fontFamily: "'Orbitron', monospace", fontSize: 16, letterSpacing: 3 }}>
              {opt.label}
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setGameState('MENU')} style={{
        marginTop: 50, padding: '10px 35px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
        cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 3,
      }}>VOLVER</button>
    </div>
  );
};

export default DatingMenu;
