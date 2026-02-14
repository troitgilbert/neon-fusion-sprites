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

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
      <div style={{
        border: '2px solid #87ceeb', boxShadow: '0 0 20px rgba(0,255,255,.4)',
        background: 'rgba(10,10,20,0.95)', padding: 25, textAlign: 'center', transform: 'skew(-2deg)'
      }}>
        <h2 style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff', marginBottom: 15 }}>ELIGE ESCENARIO</h2>
        <div style={{ display: 'flex', gap: 15 }}>
          {stages.map(s => {
            if (s.unlockable && !owned.nada) return null;
            return (
              <div
                key={s.id}
                onClick={() => engine.selectStage(s.id)}
                style={{
                  border: '1px solid #555', background: 'rgba(0,0,0,0.5)', padding: 10,
                  cursor: 'pointer', color: s.color, fontFamily: "'Orbitron', monospace"
                }}
              >
                <div style={{ width: 100, height: 60, border: '1px solid white', marginBottom: 5, background: s.bg }} />
                {s.name}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StageSelect;
