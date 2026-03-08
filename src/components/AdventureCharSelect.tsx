import React, { useState } from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA } from '../game/constants';
import { playSelectSound, playConfirmSound } from '../game/audio';

const AdventureCharSelect: React.FC = () => {
  const { engine, setGameState } = useGame();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Get custom characters
  const getCustomChars = () => {
    try {
      return JSON.parse(localStorage.getItem('customChars') || '[]');
    } catch { return []; }
  };
  const customs = getCustomChars();

  const allChars = [
    ...CHAR_DATA.map((c, i) => ({ name: c.name, color: c.color, eyes: c.eyes, idx: i, isCustom: false })),
    ...customs.map((c: any, i: number) => ({ name: c.name || `CUSTOM ${i + 1}`, color: c.clothesColor || '#ff00ff', eyes: c.eyesColor || '#fff', idx: 100 + i, isCustom: true })),
  ];

  const selectChar = (idx: number) => {
    playConfirmSound();
    (engine as any).adventureCharIdx = idx;
    setGameState('ADVENTURE_SELECT' as any);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{
      background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)',
    }}>
      <h1 style={{
        color: '#ffcc33', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(24px, 4vw, 42px)',
        letterSpacing: 6, textShadow: '0 0 20px #ff6600',
        marginBottom: 40, fontWeight: 900,
      }}>
        ELIGE TU PERSONAJE
      </h1>

      <div style={{ display: 'flex', gap: 25, flexWrap: 'wrap', justifyContent: 'center', padding: '0 20px' }}>
        {allChars.map((char, i) => (
          <div
            key={char.idx}
            onClick={() => selectChar(char.idx)}
            onMouseEnter={() => { setHoveredIdx(i); playSelectSound(); }}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              width: 180, padding: '25px 15px', cursor: 'pointer', textAlign: 'center',
              background: hoveredIdx === i ? 'rgba(20,20,60,0.95)' : 'rgba(10,10,30,0.9)',
              border: `2px solid ${hoveredIdx === i ? char.color : 'rgba(255,255,255,0.1)'}`,
              boxShadow: hoveredIdx === i ? `0 0 30px ${char.color}40` : 'none',
              transition: 'all 0.3s ease-out',
              transform: hoveredIdx === i ? 'scale(1.05) translateY(-5px)' : 'scale(1)',
            }}
          >
            {/* Character body */}
            <div style={{ position: 'relative', width: 80, height: 120, margin: '0 auto 15px' }}>
              {/* Head */}
              <div style={{
                width: 45, height: 45, borderRadius: '50%',
                background: char.isCustom ? char.color : (char.idx === 0 ? '#8B4513' : '#ffffff'),
                border: `2px solid ${char.color}`, margin: '0 auto',
                position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: '40%', left: '20%', width: 6, height: 6, borderRadius: '50%', background: char.eyes, boxShadow: `0 0 4px ${char.eyes}` }} />
                <div style={{ position: 'absolute', top: '40%', right: '20%', width: 6, height: 6, borderRadius: '50%', background: char.eyes, boxShadow: `0 0 4px ${char.eyes}` }} />
              </div>
              {/* Body/clothes */}
              <div style={{
                width: 35, height: 30, margin: '2px auto 0',
                background: char.isCustom ? char.color : (char.idx === 0 ? '#1a3a6a' : '#333'),
                borderRadius: '5px 5px 0 0',
              }} />
              {/* Pants */}
              <div style={{
                width: 35, height: 20, margin: '0 auto',
                background: char.isCustom ? '#333' : (char.idx === 0 ? '#2a2a2a' : '#1a1a1a'),
                display: 'flex', gap: 2, justifyContent: 'center',
              }}>
                <div style={{ width: 15, height: 20, background: 'inherit' }} />
                <div style={{ width: 15, height: 20, background: 'inherit' }} />
              </div>
              {/* Hands */}
              <div style={{
                position: 'absolute', top: 50, left: -5,
                width: 12, height: 12, borderRadius: '50%',
                background: char.isCustom ? '#f5deb3' : (char.idx === 0 ? '#8B4513' : '#f5deb3'),
              }} />
              <div style={{
                position: 'absolute', top: 50, right: -5,
                width: 12, height: 12, borderRadius: '50%',
                background: char.isCustom ? '#f5deb3' : (char.idx === 0 ? '#8B4513' : '#f5deb3'),
              }} />
            </div>

            <div style={{
              color: char.color, fontFamily: "'Orbitron', monospace", fontSize: 14,
              letterSpacing: 2, fontWeight: 900,
              textShadow: `0 0 10px ${char.color}50`,
            }}>
              {char.name}
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setGameState('MENU')} style={{
        marginTop: 35, padding: '10px 40px', background: 'transparent',
        border: '2px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer',
        fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
      }}>VOLVER</button>
    </div>
  );
};

export default AdventureCharSelect;
