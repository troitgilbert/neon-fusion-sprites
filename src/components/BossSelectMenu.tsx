import React, { useState } from 'react';
import { useGame } from '../game/GameContext';
import { playSelectSound, playConfirmSound } from '../game/audio';

const BOSSES = [
  { id: 'lucifer', name: 'LUCIFER', color: '#ff4400', desc: 'Demonio del mismo tamaño que tú pero mucho más rápido. Lanza disparos de fuego por todas partes.', emoji: '👹' },
  { id: 'dios_antiguo', name: 'DIOS ANTIGUO', color: '#ff0000', desc: 'Esfera roja muy grande que vuela y hace que caigan gotas de sangre en el lugar.', emoji: '🔴' },
  { id: 'perla_negra', name: 'PERLA NEGRA', color: '#8B4513', desc: 'Barco masivo que lanza bolas que te siguen durante 5 segundos. Tiene mucha vida.', emoji: '🚢' },
  { id: 'big_bang', name: 'BIG BANG', color: '#ffffff', desc: 'Completamente blanco, vuela, doble de vida, energía infinita. Ataques devastadores.', emoji: '💥' },
];

const BossSelectMenu: React.FC = () => {
  const { engine, setGameState } = useGame();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const handleSelect = (bossId: string) => {
    playConfirmSound();
    engine.mode = 'boss_select';
    (engine as any).selectedBoss = bossId;
    setGameState('SELECT');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'linear-gradient(180deg, #0a0a2e, #000)' }}>
      <h1 style={{ color: '#ff8c00', fontFamily: "'Orbitron', monospace", fontSize: 32, letterSpacing: 6, marginBottom: 40, textShadow: '0 0 25px #ff6600' }}>
        SELECCIÓN DE JEFES
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 280px)', gap: 20 }}>
        {BOSSES.map((b, i) => (
          <div key={b.id}
            onClick={() => handleSelect(b.id)}
            onMouseEnter={() => { setHoveredIdx(i); playSelectSound(); }}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              padding: 25, cursor: 'pointer', textAlign: 'center',
              background: hoveredIdx === i ? 'rgba(20,10,10,0.95)' : 'rgba(10,10,30,0.9)',
              border: `2px solid ${hoveredIdx === i ? b.color : 'rgba(255,255,255,0.08)'}`,
              boxShadow: hoveredIdx === i ? `0 0 30px ${b.color}40` : 'none',
              transition: 'all 0.3s', transform: hoveredIdx === i ? 'scale(1.03)' : 'scale(1)',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 10 }}>{b.emoji}</div>
            <div style={{ color: b.color, fontFamily: "'Orbitron', monospace", fontSize: 16, letterSpacing: 3, fontWeight: 900, marginBottom: 8 }}>
              {b.name}
            </div>
            <p style={{ color: '#87ceeb', fontSize: 11, lineHeight: 1.5 }}>{b.desc}</p>
          </div>
        ))}
      </div>

      <button onClick={() => setGameState('MENU')} style={{
        marginTop: 35, padding: '10px 35px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
        cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 3,
      }}>VOLVER</button>
    </div>
  );
};

export default BossSelectMenu;
