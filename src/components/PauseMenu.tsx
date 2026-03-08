import React, { useState } from 'react';
import { useGame } from '../game/GameContext';

const PauseMenu: React.FC = () => {
  const { engine, setGameState } = useGame();
  const isTraining = engine.mode === 'training';
  const [hoveredBtn, setHoveredBtn] = useState<number | null>(null);

  const buttons = [
    { label: 'CONTINUAR', action: () => engine.resume() },
    { label: 'CONFIGURACIÓN', action: () => setGameState('CONFIG') },
    { label: 'REINICIAR', action: () => engine.restart() },
    { label: 'MENÚ PRINCIPAL', action: () => engine.goToMainMenu(), danger: true },
  ];

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}>

      <div style={{
        width: 'clamp(300px, 28vw, 380px)',
        background: 'linear-gradient(180deg, rgba(8,10,25,0.97), rgba(4,6,16,0.99))',
        border: '1px solid rgba(255,204,51,0.2)',
        boxShadow: '0 0 60px rgba(0,0,0,0.8), 0 0 30px rgba(255,204,51,0.05), inset 0 0 40px rgba(0,0,0,0.3)',
        padding: 0, overflow: 'hidden',
        animation: 'pauseIn 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px 14px',
          borderBottom: '1px solid rgba(255,204,51,0.12)',
          background: 'linear-gradient(180deg, rgba(255,204,51,0.06), transparent)',
        }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 900,
            letterSpacing: 8, textAlign: 'center',
            background: 'linear-gradient(180deg, #fff8e0 0%, #ffcc33 50%, #cc8800 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>PAUSA</div>
          <div style={{
            width: 60, height: 2, margin: '8px auto 0',
            background: 'linear-gradient(90deg, transparent, rgba(255,204,51,0.5), transparent)',
          }} />
        </div>

        {/* Buttons */}
        <div style={{ padding: '12px 16px' }}>
          {buttons.map((btn, i) => (
            <button
              key={i}
              onClick={btn.action}
              onMouseEnter={() => setHoveredBtn(i)}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '12px 18px', marginBottom: 4,
                background: hoveredBtn === i
                  ? btn.danger
                    ? 'linear-gradient(90deg, rgba(200,40,40,0.12), transparent)'
                    : 'linear-gradient(90deg, rgba(255,204,51,0.08), transparent)'
                  : 'transparent',
                border: 'none', borderLeft: hoveredBtn === i
                  ? `3px solid ${btn.danger ? '#cc4444' : '#ffcc33'}`
                  : '3px solid transparent',
                cursor: 'pointer',
                fontFamily: "'Orbitron', monospace",
                fontSize: 12, letterSpacing: 4, fontWeight: 700,
                color: hoveredBtn === i
                  ? btn.danger ? '#ff6666' : '#ffdd66'
                  : btn.danger ? '#884444' : '#667',
                transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                textAlign: 'left',
                transform: hoveredBtn === i ? 'translateX(4px)' : 'translateX(0)',
              }}
            >
              <span style={{
                fontSize: 8, opacity: hoveredBtn === i ? 1 : 0.3,
                color: btn.danger ? '#cc4444' : '#ffcc33',
                transition: 'opacity 0.2s',
              }}>▶</span>
              {btn.label}
            </button>
          ))}
        </div>

        {/* Training options */}
        {isTraining && (
          <div style={{
            padding: '12px 16px 16px',
            borderTop: '1px solid rgba(255,204,51,0.08)',
          }}>
            <div style={{
              fontFamily: "'Orbitron', monospace", fontSize: 8,
              letterSpacing: 4, color: 'rgba(255,204,51,0.4)',
              marginBottom: 10, textAlign: 'center',
            }}>ENTRENAMIENTO</div>

            <div style={{ marginBottom: 8 }}>
              <div style={{
                fontFamily: "'Orbitron', monospace", fontSize: 8,
                letterSpacing: 2, color: '#445', marginBottom: 4,
              }}>OPONENTE</div>
              <select
                value={engine.trainingAI}
                onChange={e => { engine.trainingAI = e.target.value as any; }}
                style={{
                  width: '100%', padding: '6px 10px',
                  background: 'rgba(10,10,25,0.9)',
                  border: '1px solid rgba(255,204,51,0.12)',
                  color: '#8899aa', fontFamily: "'Orbitron', monospace",
                  fontSize: 10, letterSpacing: 1, cursor: 'pointer',
                }}
              >
                <option value="dummy">MANIQUÍ</option>
                <option value="fight">PELEA</option>
              </select>
            </div>

            <div>
              <div style={{
                fontFamily: "'Orbitron', monospace", fontSize: 8,
                letterSpacing: 2, color: '#445', marginBottom: 4,
              }}>ENERGÍA</div>
              <select
                value={engine.trainingEnergy}
                onChange={e => { engine.trainingEnergy = e.target.value as any; }}
                style={{
                  width: '100%', padding: '6px 10px',
                  background: 'rgba(10,10,25,0.9)',
                  border: '1px solid rgba(255,204,51,0.12)',
                  color: '#8899aa', fontFamily: "'Orbitron', monospace",
                  fontSize: 10, letterSpacing: 1, cursor: 'pointer',
                }}
              >
                <option value="infinite">INFINITA</option>
                <option value="progressive">PROGRESIVA</option>
                <option value="none">SIN ENERGÍA</option>
              </select>
            </div>
          </div>
        )}

        {/* Footer hint */}
        <div style={{
          padding: '8px 16px', textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.03)',
        }}>
          <span style={{
            fontFamily: "'Orbitron', monospace", fontSize: 7,
            letterSpacing: 3, color: '#334',
          }}>ESC PARA VOLVER</span>
        </div>
      </div>

      <style>{`
        @keyframes pauseIn {
          from { opacity: 0; transform: scale(0.95) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PauseMenu;
