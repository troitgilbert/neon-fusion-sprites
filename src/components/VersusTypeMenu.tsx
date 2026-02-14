import React from 'react';
import { useGame } from '../game/GameContext';

const VersusTypeMenu: React.FC = () => {
  const { setGameState } = useGame();

  const btnStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.1), transparent)',
    border: '1px solid #87ceeb', color: '#87ceeb', padding: 12, margin: 6, width: 240,
    cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 2,
    fontFamily: "'Orbitron', monospace",
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
      <div style={{
        border: '2px solid #87ceeb', boxShadow: '0 0 20px rgba(0,255,255,.4)',
        background: 'rgba(10,10,20,0.95)', padding: 25, textAlign: 'center', transform: 'skew(-2deg)'
      }}>
        <h2 style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff', marginBottom: 15 }}>MODO VERSUS</h2>
        <button onClick={() => setGameState('SELECT', 'versus')} style={btnStyle}>Versus Local</button><br/>
        <button onClick={() => setGameState('SELECT', 'vs_cpu')} style={btnStyle}>Versus CPU</button><br/>
        <button onClick={() => setGameState('MENU')} style={btnStyle}>Volver</button>
      </div>
    </div>
  );
};

export default VersusTypeMenu;
