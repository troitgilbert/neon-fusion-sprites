import React from 'react';
import { useGame } from '../game/GameContext';
import { playSelectSound } from '../game/audio';

const MinigamesMenu: React.FC = () => {
  const { setGameState } = useGame();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a2e, #0a2040)' }}>
      <h1 style={{ color: '#00ff66', fontFamily: "'Orbitron', monospace", fontSize: 32, letterSpacing: 6, marginBottom: 50, textShadow: '0 0 15px #00ff66' }}>
        MINIJUEGOS
      </h1>

      <div onClick={() => { playSelectSound(); /* TODO: bowling */ }} style={{
        width: 280, padding: '30px 25px', cursor: 'pointer', textAlign: 'center',
        background: 'rgba(10,10,30,0.9)', border: '2px solid rgba(0,255,102,0.3)',
        transition: 'all 0.3s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ff66'; e.currentTarget.style.boxShadow = '0 0 25px rgba(0,255,102,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,255,102,0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div style={{ fontSize: 40, marginBottom: 10 }}>🎳</div>
        <div style={{ color: '#00ff66', fontFamily: "'Orbitron', monospace", fontSize: 18, letterSpacing: 3 }}>BOLOS</div>
        <p style={{ color: '#87ceeb', fontSize: 11, marginTop: 8 }}>
          Usa a tu personaje para golpear enemigos. 1 minuto. 1 enemigo = 0.5 diamantes.
        </p>
      </div>

      <button onClick={() => setGameState('MENU')} style={{
        marginTop: 40, padding: '10px 35px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
        cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 3,
      }}>VOLVER</button>
    </div>
  );
};

export default MinigamesMenu;
