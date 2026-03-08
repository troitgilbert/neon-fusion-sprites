import React from 'react';
import { useGame } from '../game/GameContext';
import type { ArcadeStage } from '../game/types';

const ARCADE_STAGES: ArcadeStage[] = [
  { type: 'fight', label: '1. COMBATE', description: 'Un oponente aleatorio' },
  { type: 'army', label: '2. EJÉRCITO', description: '20 versiones con vida reducida' },
  { type: 'fight', label: '3. COMBATE II', description: 'Rival más fuerte' },
  { type: 'minigame', label: '4. MINIJUEGO', description: 'Desafío especial' },
  { type: '2v2', label: '5. DOS VS DOS', description: 'Pelea en equipo' },
  { type: '3vGiant', label: '6. TRES VS GIGANTE', description: 'Contra un coloso' },
  { type: 'minigame', label: '7. MINIJUEGO II', description: 'Desafío avanzado' },
  { type: 'fight', label: '8. COMBATE III', description: 'Rival experto' },
  { type: 'miniboss', label: '9. MINI BOSS', description: 'Primordiales' },
  { type: 'boss', label: '10. BOSS', description: 'BIG BANG' },
];

const stageColors: Record<string, string> = {
  fight: '#00ffff',
  army: '#ff8c00',
  minigame: '#00ff66',
  '2v2': '#ffff00',
  '3vGiant': '#ff00ff',
  miniboss: '#ff4444',
  boss: '#ffffff',
};

const ArcadeTower: React.FC = () => {
  const { engine, setGameState } = useGame();
  const currentStage = engine.arcadeStage || 0;

  const handleStart = () => {
    engine.startArcadeStage(currentStage);
  };

  return (
    <div className="fixed inset-0 z-50 flex anim-screen-slide-up scanline-overlay" style={{
      background: 'linear-gradient(180deg, #0a0a2e 0%, #000 100%)',
    }}>
      {/* Tower on the left */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <h2 style={{ color: '#ffcc33', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(18px, 3vw, 28px)', letterSpacing: 4, marginBottom: 20, textShadow: '0 0 15px #ff6600' }}>
          TORRE ARCADE
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 4, maxHeight: '70vh', overflowY: 'auto' }}>
          {ARCADE_STAGES.map((stage, i) => {
            const color = stageColors[stage.type] || '#fff';
            const isCurrent = i === currentStage;
            const isCompleted = i < currentStage;
            const isLocked = i > currentStage;

            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px', minWidth: 320,
                background: isCurrent ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.3)',
                border: `2px solid ${isCurrent ? color : isCompleted ? color + '40' : 'rgba(255,255,255,0.05)'}`,
                boxShadow: isCurrent ? `0 0 20px ${color}40` : 'none',
                opacity: isLocked ? 0.35 : 1,
                transition: 'all 0.3s',
              }}>
                {/* Stage indicator */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: isCompleted ? color : isCurrent ? `${color}30` : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isCurrent ? `0 0 10px ${color}60` : 'none',
                }}>
                  {isCompleted && <span style={{ color: '#000', fontWeight: 900, fontSize: 14 }}>✓</span>}
                  {isCurrent && <span style={{ color, fontWeight: 900, fontSize: 10 }}>▶</span>}
                </div>

                <div>
                  <div style={{ color: isCurrent ? color : isCompleted ? '#aaa' : '#444', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2, fontWeight: 900 }}>
                    {stage.label}
                  </div>
                  <div style={{ color: isLocked ? '#333' : '#666', fontSize: 10, marginTop: 2 }}>
                    {stage.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel - current stage info */}
      <div style={{ width: 350, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30, borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
        <div style={{
          color: stageColors[ARCADE_STAGES[currentStage]?.type] || '#fff',
          fontFamily: "'Orbitron', monospace", fontSize: 24, letterSpacing: 3, fontWeight: 900, marginBottom: 15,
          textShadow: `0 0 15px ${stageColors[ARCADE_STAGES[currentStage]?.type] || '#fff'}50`,
        }}>
          {ARCADE_STAGES[currentStage]?.label || 'FIN'}
        </div>
        <p style={{ color: '#87ceeb', fontSize: 13, textAlign: 'center', marginBottom: 30, lineHeight: 1.6 }}>
          {ARCADE_STAGES[currentStage]?.description}
        </p>

        {currentStage < ARCADE_STAGES.length && (
          <button onClick={handleStart} style={{
            padding: '14px 50px', background: 'rgba(255,255,255,0.05)',
            border: `2px solid ${stageColors[ARCADE_STAGES[currentStage]?.type] || '#fff'}`,
            color: stageColors[ARCADE_STAGES[currentStage]?.type] || '#fff',
            cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 16, letterSpacing: 4,
            boxShadow: `0 0 20px ${stageColors[ARCADE_STAGES[currentStage]?.type] || '#fff'}30`,
            transition: 'all 0.3s',
          }}>¡LUCHAR!</button>
        )}

        <button onClick={() => setGameState('MENU')} style={{
          marginTop: 30, padding: '8px 30px', background: 'transparent',
          border: '2px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer',
          fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 3,
        }}>VOLVER</button>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default ArcadeTower;
