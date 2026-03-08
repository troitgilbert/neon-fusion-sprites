import React from 'react';
import { useGame } from '../game/GameContext';

const VersusTypeMenu: React.FC = () => {
  const { setGameState } = useGame();

  const btnStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.1), transparent)',
    border: '1px solid #87ceeb', color: '#87ceeb', padding: 12, margin: 6, width: 240,
    cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 2,
    fontFamily: "'Orbitron', monospace",
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center anim-screen-fade" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
      <div className="anim-screen-zoom anim-neon-flash" style={{
        border: '2px solid #87ceeb', boxShadow: '0 0 20px rgba(0,255,255,.4)',
        background: 'rgba(10,10,20,0.95)', padding: 25, textAlign: 'center', transform: 'skew(-2deg)'
      }}>
        <h2 className="anim-title-slam" style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff', marginBottom: 15 }}>MODO VERSUS</h2>
        <button onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(6px) scale(1.04)'; e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,255,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#87ceeb'; e.currentTarget.style.boxShadow = ''; }} onClick={() => setGameState('SELECT', 'versus')} style={{...btnStyle, animation: 'itemCascade 0.4s cubic-bezier(0.16,1,0.3,1) 0.1s both'}}>Versus Local</button><br/>
        <button onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(6px) scale(1.04)'; e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,255,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#87ceeb'; e.currentTarget.style.boxShadow = ''; }} onClick={() => setGameState('SELECT', 'vs_cpu')} style={{...btnStyle, animation: 'itemCascade 0.4s cubic-bezier(0.16,1,0.3,1) 0.2s both'}}>Versus CPU</button><br/>
        <button onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(6px) scale(1.04)'; e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,255,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#87ceeb'; e.currentTarget.style.boxShadow = ''; }} onClick={() => setGameState('MENU')} style={{...btnStyle, animation: 'itemCascade 0.4s cubic-bezier(0.16,1,0.3,1) 0.3s both'}}>Volver</button>
      </div>
    </div>
  );
};

export default VersusTypeMenu;
