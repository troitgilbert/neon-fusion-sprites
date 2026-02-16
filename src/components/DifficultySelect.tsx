import React, { useState } from 'react';
import { useGame } from '../game/GameContext';
import { DIFFICULTIES } from '../game/types';
import { playSelectSound, playConfirmSound } from '../game/audio';

interface Props {
  onSelect: (difficultyId: string) => void;
  onBack: () => void;
  title?: string;
}

const DifficultySelect: React.FC<Props> = ({ onSelect, onBack, title = 'ELIGE DIFICULTAD' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)' }}>
      <h2 style={{ color: '#ffcc33', fontFamily: "'Orbitron', monospace", fontSize: 28, letterSpacing: 5, marginBottom: 35, textShadow: '0 0 15px #ff6600' }}>
        {title}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 450, width: '90%' }}>
        {DIFFICULTIES.map((d, i) => (
          <div key={d.id}
            onClick={() => { playConfirmSound(); onSelect(d.id); }}
            onMouseEnter={() => { setHoveredIdx(i); playSelectSound(); }}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              padding: '12px 20px', cursor: 'pointer',
              background: hoveredIdx === i ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.3)',
              borderLeft: `5px solid ${hoveredIdx === i ? d.color : d.color + '40'}`,
              boxShadow: hoveredIdx === i ? `0 0 20px ${d.color}25` : 'none',
              transition: 'all 0.2s',
              transform: hoveredIdx === i ? 'translateX(8px)' : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: d.color, fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3, fontWeight: 900 }}>{d.label}</span>
            </div>
            <div style={{ color: '#87ceeb', fontSize: 11, marginTop: 3, opacity: 0.7 }}>{d.description}</div>
          </div>
        ))}
      </div>

      <button onClick={onBack} style={{
        marginTop: 30, padding: '10px 35px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
        cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 3,
      }}>VOLVER</button>
    </div>
  );
};

export default DifficultySelect;
