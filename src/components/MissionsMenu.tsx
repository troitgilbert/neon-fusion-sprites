import React, { useState, useMemo } from 'react';
import { useGame } from '../game/GameContext';
import { MISSION_DIFFICULTIES } from '../game/constants';
import { playSelectSound, playConfirmSound } from '../game/audio';

const MISSION_NAMES = [
  'Sobrevive sin bloquear', 'Solo golpes especiales', 'Derrota en 30 segundos',
  'Sin recibir daño', 'Combo de 15 hits', 'Gana volando', 'Sin usar ultra',
  'Derrota a 3 seguidos', 'Solo esquivar y contraatacar', 'Gana sin saltar',
];

const MissionsMenu: React.FC = () => {
  const { engine, setGameState } = useGame();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const missions = useMemo(() => {
    const shuffled = [...MISSION_NAMES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5).map((name, i) => {
      const diff = MISSION_DIFFICULTIES[Math.min(i, MISSION_DIFFICULTIES.length - 1)];
      return { name, difficulty: diff };
    });
  }, []);

  const selected = missions[selectedIdx];

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)' }}>
      {/* Mission list */}
      <div style={{ flex: 1, padding: 30, overflowY: 'auto', borderRight: '2px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ color: '#ffcc33', fontFamily: "'Orbitron', monospace", fontSize: 28, letterSpacing: 4, marginBottom: 25, textShadow: '0 0 15px #ff6600' }}>
          MISIONES
        </h2>
        {missions.map((m, i) => (
          <div key={i} onClick={() => { setSelectedIdx(i); playSelectSound(); }}
            style={{
              padding: '14px 18px', marginBottom: 8, cursor: 'pointer',
              background: selectedIdx === i ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.3)',
              border: `2px solid ${selectedIdx === i ? m.difficulty.color : 'rgba(255,255,255,0.05)'}`,
              boxShadow: selectedIdx === i ? `0 0 15px ${m.difficulty.color}30` : 'none',
              transition: 'all 0.3s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#eafcff', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 2 }}>{m.name}</span>
              <span style={{ color: m.difficulty.color, fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 1 }}>{m.difficulty.label}</span>
            </div>
            <div style={{ color: '#00ff66', fontSize: 11, marginTop: 4, fontFamily: "'Orbitron', monospace" }}>🔷 +{m.difficulty.reward}</div>
          </div>
        ))}
        <button onClick={() => setGameState('MENU')} style={{
          marginTop: 20, padding: '10px 30px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
          cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 3,
        }}>VOLVER</button>
      </div>

      {/* Preview panel */}
      <div style={{ width: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
        <div style={{
          width: 120, height: 120, borderRadius: '50%', marginBottom: 25,
          background: `radial-gradient(circle, ${selected.difficulty.color}30, transparent)`,
          border: `3px solid ${selected.difficulty.color}40`,
          boxShadow: `0 0 40px ${selected.difficulty.color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 40 }}>⚔️</span>
        </div>
        <div style={{ color: selected.difficulty.color, fontFamily: "'Orbitron', monospace", fontSize: 22, letterSpacing: 3, fontWeight: 900, marginBottom: 12, textAlign: 'center' }}>
          {selected.name}
        </div>
        <div style={{ color: selected.difficulty.color, fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 2, marginBottom: 15, padding: '4px 12px', border: `1px solid ${selected.difficulty.color}40`, background: `${selected.difficulty.color}10` }}>
          {selected.difficulty.label}
        </div>
        <div style={{ color: '#87ceeb', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
          Completa esta misión especial para ganar cristales
        </div>
        <div style={{ color: '#00ff66', fontFamily: "'Orbitron', monospace", fontSize: 18, fontWeight: 'bold', marginBottom: 25 }}>
          🔷 +{selected.difficulty.reward} CRISTALES
        </div>
        <button onClick={() => { playConfirmSound(); setGameState('SELECT'); engine.mode = 'missions'; }} style={{
          padding: '12px 40px', background: `${selected.difficulty.color}15`, border: `2px solid ${selected.difficulty.color}`,
          color: selected.difficulty.color, cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 15, letterSpacing: 3,
        }}>INICIAR</button>
      </div>
    </div>
  );
};

export default MissionsMenu;
