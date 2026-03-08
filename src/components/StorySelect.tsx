import React, { useState } from 'react';
import { useGame } from '../game/GameContext';
import { playSelectSound, playConfirmSound } from '../game/audio';

const STORIES = [
  { id: 'complete', name: 'HISTORIA COMPLETA', color: '#ffcc33', description: 'Vive la historia completa del universo. Todos los capítulos, todos los personajes, todos los secretos revelados en un épico viaje sin interrupciones.' },
  { id: 'edowado', name: 'EDOWADO', color: '#00ffff', description: 'La historia de un guerrero que busca proteger lo que queda del universo. Su poder interior despierta ante las amenazas del vacío.' },
  { id: 'kaito', name: 'KAITO', color: '#ffff00', description: 'Un luchador veloz con un pasado oscuro. Su camino lo lleva a confrontar la verdad sobre su propia existencia.' },
  { id: 'custom', name: 'PERSONALIZADO', color: '#ff00ff', description: 'Crea tu propia historia. Elige tu personaje personalizado y forja un camino único a través del universo.' },
];

const StorySelect: React.FC = () => {
  const { setGameState } = useGame();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{
      background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)',
      animation: 'fadeIn 0.5s ease-out',
    }}>
      <h1 style={{
        color: '#ffcc33', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(28px, 5vw, 48px)',
        letterSpacing: 6, textShadow: '0 0 20px #ff6600, 0 0 40px #ff000050',
        marginBottom: 50, fontWeight: 900,
      }}>
        SELECCIÓN DE HISTORIA
      </h1>

      <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', justifyContent: 'center', padding: '0 20px' }}>
        {STORIES.map((story, i) => (
          <div
            key={story.id}
            onClick={() => { playConfirmSound(); /* TODO: start story */ }}
            onMouseEnter={() => { setHoveredIdx(i); playSelectSound(); }}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              width: 220, padding: '30px 20px', cursor: 'pointer', textAlign: 'center',
              background: hoveredIdx === i ? 'rgba(20,20,60,0.95)' : 'rgba(10,10,30,0.9)',
              border: `2px solid ${hoveredIdx === i ? story.color : 'rgba(255,255,255,0.1)'}`,
              boxShadow: hoveredIdx === i ? `0 0 30px ${story.color}40, inset 0 0 20px ${story.color}10` : 'none',
              transition: 'all 0.4s ease-out',
              transform: hoveredIdx === i ? 'scale(1.05) translateY(-5px)' : 'scale(1)',
            }}
          >
            {/* Character sphere */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
              background: story.id === 'edowado' ? '#8B4513' : story.id === 'kaito' ? '#ffffff' : 'linear-gradient(135deg, #ff00ff, #00ffff)',
              border: `3px solid ${story.color}`,
              boxShadow: `0 0 20px ${story.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {story.id !== 'custom' && (
                <>
                  <div style={{ position: 'absolute', top: '38%', left: '25%', width: 10, height: 10, borderRadius: '50%', background: story.color, boxShadow: `0 0 5px ${story.color}` }} />
                  <div style={{ position: 'absolute', top: '38%', right: '25%', width: 10, height: 10, borderRadius: '50%', background: story.color, boxShadow: `0 0 5px ${story.color}` }} />
                </>
              )}
              {story.id === 'custom' && (
                <span style={{ fontSize: 30, color: '#fff', fontWeight: 900, fontFamily: "'Orbitron', monospace" }}>?</span>
              )}
            </div>

            <div style={{
              color: story.color, fontFamily: "'Orbitron', monospace", fontSize: 18,
              letterSpacing: 3, fontWeight: 900, marginBottom: 12,
              textShadow: `0 0 10px ${story.color}50`,
            }}>
              {story.name}
            </div>

            <p style={{ color: '#87ceeb', fontSize: 11, lineHeight: 1.6, opacity: 0.8 }}>
              {story.description}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={() => setGameState('MENU')}
        style={{
          marginTop: 50, padding: '10px 40px', background: 'transparent',
          border: '2px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer',
          fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
          transition: 'all 0.3s',
        }}
      >VOLVER</button>

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default StorySelect;
