import React, { useState } from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA } from '../game/constants';
import { playSelectSound } from '../game/audio';

const DOCS = [
  {
    name: 'EDOWADO', color: '#00ffff', charColor: '#8B4513', eyes: '#00ffff',
    info: [
      { label: 'Raza', value: 'Yumeista' },
      { label: 'Dotes', value: 'Cocinero, doctor, masajista, soldado' },
      { label: 'Clase Social', value: 'Príncipe' },
    ],
  },
  {
    name: 'KAITO', color: '#ffff00', charColor: '#ffffff', eyes: '#ffff00',
    info: [
      { label: 'Raza', value: 'Biosord' },
      { label: 'Dotes', value: 'Forense' },
      { label: 'Clase Social', value: 'Forastero' },
    ],
  },
];

const DocumentsMenu: React.FC = () => {
  const { setGameState } = useGame();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (selectedIdx !== null) {
    const doc = DOCS[selectedIdx];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a2e, #0a1040)' }}>
        <div style={{ maxWidth: 500, textAlign: 'center' }}>
          {/* Portrait */}
          <div style={{
            width: 120, height: 120, borderRadius: '50%', margin: '0 auto 25px',
            background: doc.charColor, border: `4px solid ${doc.eyes}`,
            boxShadow: `0 0 30px ${doc.eyes}40`,
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: '38%', left: '25%', width: 14, height: 14, borderRadius: '50%', background: doc.eyes, boxShadow: `0 0 6px ${doc.eyes}` }} />
            <div style={{ position: 'absolute', top: '38%', right: '25%', width: 14, height: 14, borderRadius: '50%', background: doc.eyes, boxShadow: `0 0 6px ${doc.eyes}` }} />
          </div>

          <h2 style={{ color: doc.color, fontFamily: "'Orbitron', monospace", fontSize: 28, letterSpacing: 5, marginBottom: 30, textShadow: `0 0 15px ${doc.color}50` }}>
            {doc.name}
          </h2>

          <div style={{ background: 'rgba(0,0,0,0.4)', padding: 25, border: `1px solid ${doc.color}20` }}>
            {doc.info.map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2 }}>{item.label}</span>
                <span style={{ color: '#eafcff', fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 'bold' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <button onClick={() => setSelectedIdx(null)} style={{
            marginTop: 25, padding: '10px 35px', background: 'transparent', border: `2px solid ${doc.color}`, color: doc.color,
            cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 3,
          }}>VOLVER</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center anim-screen-fade" style={{ background: 'linear-gradient(135deg, #0a0a2e, #0a1040)' }}>
      <h1 className="anim-title-slam" style={{ color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 32, letterSpacing: 6, marginBottom: 50, textShadow: '0 0 15px #00ffff' }}>
        DOCUMENTOS
      </h1>

      <div style={{ display: 'flex', gap: 25 }}>
        {DOCS.map((doc, i) => (
          <div key={doc.name}
            onClick={() => { setSelectedIdx(i); playSelectSound(); }}
            style={{
              width: 200, padding: 30, cursor: 'pointer', textAlign: 'center',
              background: 'rgba(10,10,30,0.9)', border: `2px solid ${doc.color}30`,
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = doc.color; e.currentTarget.style.boxShadow = `0 0 25px ${doc.color}30`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${doc.color}30`; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{
              width: 70, height: 70, borderRadius: '50%', margin: '0 auto 15px',
              background: doc.charColor, border: `3px solid ${doc.eyes}`,
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: '38%', left: '25%', width: 10, height: 10, borderRadius: '50%', background: doc.eyes }} />
              <div style={{ position: 'absolute', top: '38%', right: '25%', width: 10, height: 10, borderRadius: '50%', background: doc.eyes }} />
            </div>
            <div style={{ color: doc.color, fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3 }}>{doc.name}</div>
          </div>
        ))}
      </div>

      <button onClick={() => setGameState('MENU')} style={{
        marginTop: 40, padding: '10px 35px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
        cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 3,
      }}>VOLVER</button>
    </div>
  );
};

export default DocumentsMenu;
