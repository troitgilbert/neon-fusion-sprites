import React from 'react';
import { useGame } from '../game/GameContext';

const stages = [
  { id: 'default', name: 'Galaxia', bg: 'linear-gradient(180deg, #1a1a3a, #0b0b1f)', color: '#87ceeb' },
  { id: 'infierno', name: 'Infierno', bg: 'linear-gradient(180deg, #4b0000, #000000)', color: '#ff4d4d' },
  { id: 'cielo', name: 'Cielo', bg: 'linear-gradient(180deg, #87ceeb, #fff9c4)', color: '#ffff00' },
  { id: 'nada', name: 'La Nada', bg: '#000000', color: '#ffffff', unlockable: true },
];

const StageSelect: React.FC = () => {
  const { engine, setGameState } = useGame();
  const owned = engine.inventory?.stages || {};

  // Shift to go back
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Escape') {
        engine.p1Choice = null;
        engine.p2Choice = null;
        setGameState('SELECT');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [engine, setGameState]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <h2 style={{
        color: '#00ffff', fontSize: 'clamp(28px, 5vw, 48px)',
        textShadow: '0 0 20px #00ffff, 0 0 40px rgba(0,255,255,0.3)',
        marginBottom: 50, fontFamily: "'Orbitron', monospace", letterSpacing: 6
      }}>
        ELIGE ESCENARIO
      </h2>

      <div style={{ display: 'flex', gap: 30, justifyContent: 'center', flexWrap: 'wrap' }}>
        {stages.map(s => {
          if (s.unlockable && !owned.nada) return null;
          return (
            <div
              key={s.id}
              onClick={() => engine.selectStage(s.id)}
              style={{
                width: 180, padding: 15, cursor: 'pointer', textAlign: 'center',
                color: s.color, fontFamily: "'Orbitron', monospace", fontSize: 16,
                background: 'rgba(10,10,30,0.8)', border: '2px solid rgba(0,255,255,0.3)',
                transition: 'all 0.3s', boxShadow: '0 0 15px rgba(0,255,255,0.1)',
                letterSpacing: 2,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.boxShadow = `0 0 30px ${s.color}40`; e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,255,255,0.3)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{
                width: '100%', height: 100, border: '2px solid rgba(255,255,255,0.3)',
                marginBottom: 12, background: s.bg,
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
              }} />
              {s.name}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StageSelect;
