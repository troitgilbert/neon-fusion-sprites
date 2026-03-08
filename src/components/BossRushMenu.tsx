import React from 'react';
import { useGame } from '../game/GameContext';
import { playConfirmSound } from '../game/audio';

const BOSSES = [
  { name: 'LUCIFER', color: '#ff4400', desc: 'Demonio veloz con disparos de fuego' },
  { name: 'DIOS ANTIGUO', color: '#ff0000', desc: 'Esfera roja que hace llover sangre' },
  { name: 'PERLA NEGRA', color: '#8B4513', desc: 'Barco masivo con proyectiles rastreadores' },
  { name: 'PRIMORDIALES', color: '#aa00ff', desc: 'Los seres más antiguos del universo' },
  { name: 'BIG BANG', color: '#ffffff', desc: 'La destrucción final del cosmos' },
];

const BossRushMenu: React.FC = () => {
  const { engine, setGameState } = useGame();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center anim-screen-shutter" style={{ background: 'linear-gradient(180deg, #0a0a2e, #1a0000, #000)' }}>
      <h1 className="anim-title-slam" style={{ color: '#ff4444', fontFamily: "'Orbitron', monospace", fontSize: 36, letterSpacing: 6, marginBottom: 15, textShadow: '0 0 30px #ff0000' }}>
        BOSS RUSH
      </h1>
      <p className="anim-text-reveal" style={{ color: '#87ceeb', fontSize: 13, marginBottom: 40 }}>Derrota a todos los jefes en secuencia</p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 700 }}>
        {BOSSES.map((b, i) => (
          <div key={b.name} style={{
            padding: '12px 18px', background: 'rgba(0,0,0,0.6)', border: `1px solid ${b.color}30`,
            textAlign: 'center', minWidth: 120,
          }}>
            <div style={{ color: b.color, fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 2, fontWeight: 900 }}>
              {i + 1}. {b.name}
            </div>
            <div style={{ color: '#666', fontSize: 9, marginTop: 4 }}>{b.desc}</div>
          </div>
        ))}
      </div>

      <button onClick={() => { playConfirmSound(); engine.mode = 'boss_rush'; setGameState('SELECT'); }} style={{
        marginTop: 40, padding: '14px 50px', background: 'rgba(255,0,0,0.1)', border: '2px solid #ff4444',
        color: '#ff4444', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 16, letterSpacing: 4,
        boxShadow: '0 0 25px rgba(255,0,0,0.3)',
      }}>COMENZAR</button>

      <button onClick={() => setGameState('MENU')} style={{
        marginTop: 20, padding: '8px 30px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
        cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 3,
      }}>VOLVER</button>
    </div>
  );
};

export default BossRushMenu;
