import React, { useState } from 'react';
import { useGame } from '../game/GameContext';
import { playSelectSound, playConfirmSound } from '../game/audio';

const WORLDS = [
  {
    id: 'galaxia', name: 'LA GALAXIA', color: '#00ccff',
    bgGrad: 'linear-gradient(180deg, #050520, #0a1040, #050520)',
    description: 'Un vasto espacio infinito lleno de piratas galácticos, asteroides errantes y naves hostiles. Siempre estás volando entre las estrellas.',
    enemies: ['Piratas Galácticos', 'Asteroides', 'Naves Hostiles'],
    boss: 'PERLA NEGRA - Un barco masivo que lanza esferas rastreadores',
    bossReward: 50,
  },
  {
    id: 'infierno', name: 'EL INFIERNO', color: '#ff4400',
    bgGrad: 'linear-gradient(180deg, #1a0000, #3d0000, #1a0000)',
    description: 'Las profundidades ardientes donde habitan demonios de todo tamaño. El fuego nunca se apaga y los enemigos son despiadados.',
    enemies: ['Demonios', 'Demonios Gigantes', 'Demonios Tiradores'],
    boss: 'LUCIFER - Rápido, letal, dispara fuego por todas partes',
    bossReward: 50,
  },
  {
    id: 'cielo', name: 'EL CIELO', color: '#ffd700',
    bgGrad: 'linear-gradient(180deg, #4a90d9, #87ceeb, #fff9e0)',
    description: 'Las tierras celestiales donde ángeles corruptos acechan. Algunos ángeles te curan, pero las bestias angelicales son letales.',
    enemies: ['Ángeles Corruptos', 'Ángeles (curan)', 'Bestias Angelicales'],
    boss: 'DIOS ANTIGUO - Esfera roja gigante que hace llover sangre',
    bossReward: 50,
  },
];

const AdventureSelect: React.FC = () => {
  const { setGameState } = useGame();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedWorld, setSelectedWorld] = useState<number | null>(null);

  if (selectedWorld !== null) {
    const world = WORLDS[selectedWorld];
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{
        background: world.bgGrad, animation: 'fadeIn 0.5s ease-out',
      }}>
        <h2 style={{ color: world.color, fontFamily: "'Orbitron', monospace", fontSize: 36, letterSpacing: 5, textShadow: `0 0 25px ${world.color}60`, marginBottom: 30, fontWeight: 900 }}>
          {world.name}
        </h2>
        <div style={{ maxWidth: 500, textAlign: 'center', marginBottom: 30 }}>
          <p style={{ color: '#eafcff', fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>{world.description}</p>
          <div style={{ marginBottom: 15 }}>
            <span style={{ color: world.color, fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 2 }}>ENEMIGOS:</span>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
              {world.enemies.map(e => (
                <span key={e} style={{ padding: '4px 12px', background: `${world.color}15`, border: `1px solid ${world.color}30`, color: '#aaa', fontSize: 11, fontFamily: "'Orbitron', monospace" }}>{e}</span>
              ))}
            </div>
          </div>
          <div style={{ padding: '12px 18px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', marginBottom: 20 }}>
            <span style={{ color: '#ff4444', fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 2 }}>JEFE FINAL</span>
            <p style={{ color: '#ffaaaa', fontSize: 12, marginTop: 5 }}>{world.boss}</p>
            <p style={{ color: '#00ff66', fontFamily: "'Orbitron', monospace", fontSize: 11, marginTop: 5 }}>🔷 +{world.bossReward} CRISTALES</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 15 }}>
          <button onClick={() => { playConfirmSound(); /* TODO: start adventure */ }} style={{
            padding: '12px 40px', background: `${world.color}15`, border: `2px solid ${world.color}`,
            color: world.color, cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 16, letterSpacing: 4,
            boxShadow: `0 0 20px ${world.color}30`, transition: 'all 0.3s',
          }}>EXPLORAR</button>
          <button onClick={() => setSelectedWorld(null)} style={{
            padding: '12px 30px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
            cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 3,
          }}>VOLVER</button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{
      background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)',
      animation: 'fadeIn 0.5s ease-out',
    }}>
      <h1 style={{
        color: '#ffcc33', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(24px, 4vw, 42px)',
        letterSpacing: 6, textShadow: '0 0 20px #ff6600, 0 0 40px #ff000050',
        marginBottom: 50, fontWeight: 900,
      }}>
        AVENTURA — ELIGE TU DESTINO
      </h1>

      <div style={{ display: 'flex', gap: 25, flexWrap: 'wrap', justifyContent: 'center', padding: '0 20px' }}>
        {WORLDS.map((world, i) => (
          <div
            key={world.id}
            onClick={() => { setSelectedWorld(i); playConfirmSound(); }}
            onMouseEnter={() => { setHoveredIdx(i); playSelectSound(); }}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              width: 260, minHeight: 320, padding: '30px 20px', cursor: 'pointer', textAlign: 'center',
              background: world.bgGrad,
              border: `2px solid ${hoveredIdx === i ? world.color : 'rgba(255,255,255,0.1)'}`,
              boxShadow: hoveredIdx === i ? `0 0 40px ${world.color}30, inset 0 0 30px ${world.color}08` : 'none',
              transition: 'all 0.4s ease-out',
              transform: hoveredIdx === i ? 'scale(1.05) translateY(-8px)' : 'scale(1)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Decorative circle */}
            <div style={{
              width: 100, height: 100, borderRadius: '50%', margin: '0 auto 20px',
              background: `radial-gradient(circle, ${world.color}30, transparent)`,
              border: `2px solid ${world.color}40`,
              boxShadow: `0 0 30px ${world.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 36 }}>
                {world.id === 'galaxia' ? '🌌' : world.id === 'infierno' ? '🔥' : '☁️'}
              </span>
            </div>

            <div style={{
              color: world.color, fontFamily: "'Orbitron', monospace", fontSize: 20,
              letterSpacing: 4, fontWeight: 900, marginBottom: 12,
              textShadow: `0 0 15px ${world.color}50`,
            }}>
              {world.name}
            </div>

            <p style={{ color: '#aaa', fontSize: 11, lineHeight: 1.6, opacity: 0.8 }}>
              {world.description.substring(0, 100)}...
            </p>

            <div style={{ marginTop: 15 }}>
              <span style={{ color: '#ff4444', fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 2 }}>
                JEFE: {world.boss.split(' - ')[0]}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setGameState('MENU')} style={{
        marginTop: 40, padding: '10px 40px', background: 'transparent',
        border: '2px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer',
        fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
      }}>VOLVER</button>

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default AdventureSelect;
