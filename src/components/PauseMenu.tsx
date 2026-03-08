import React from 'react';
import { useGame } from '../game/GameContext';

const PauseMenu: React.FC = () => {
  const { engine, setGameState } = useGame();
  const isTraining = engine.mode === 'training';

  const menuItems = [
    { label: 'CONTINUAR', action: () => engine.resume(), delay: 0.1 },
    { label: 'CONFIGURACIÓN', action: () => setGameState('CONFIG'), delay: 0.15 },
    { label: 'REINICIAR', action: () => engine.restart(), delay: 0.2 },
    { label: 'MENÚ PRINCIPAL', action: () => engine.goToMainMenu(), delay: 0.25 },
  ];

  const selectStyle: React.CSSProperties = {
    background: 'rgba(8,10,25,0.95)',
    border: '1px solid rgba(0,200,255,0.2)',
    color: '#7fefff',
    padding: '8px 14px',
    fontFamily: "'Orbitron', monospace",
    fontSize: 11,
    letterSpacing: 1,
    cursor: 'pointer',
    width: '100%',
    borderRadius: 4,
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(12px)',
        animation: 'pauseFadeIn 0.25s ease-out',
      }}
    >
      <div style={{
        position: 'relative',
        minWidth: 300,
        maxWidth: 340,
        animation: 'pauseSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Decorative top line */}
        <div style={{
          height: 2,
          background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
          marginBottom: 0,
          opacity: 0.6,
        }} />

        {/* Main container */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(6,8,18,0.97) 0%, rgba(4,5,12,0.98) 100%)',
          border: '1px solid rgba(0,200,255,0.12)',
          borderTop: 'none',
          padding: '28px 24px 20px',
        }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: 10,
              background: 'linear-gradient(180deg, #b0f0ff 0%, #00d4ff 50%, #0077aa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
            }}>
              PAUSA
            </h2>
            <div style={{
              width: 40,
              height: 1,
              background: 'rgba(0,200,255,0.3)',
              margin: '10px auto 0',
            }} />
          </div>

          {/* Menu buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {menuItems.map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = 'linear-gradient(90deg, rgba(0,200,255,0.08), rgba(0,200,255,0.15), rgba(0,200,255,0.08))';
                  el.style.borderColor = 'rgba(0,200,255,0.5)';
                  el.style.color = '#b0f0ff';
                  el.style.transform = 'translateX(4px)';
                  el.style.boxShadow = '0 0 20px rgba(0,200,255,0.1), inset 0 0 20px rgba(0,200,255,0.03)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = 'rgba(0,200,255,0.03)';
                  el.style.borderColor = 'rgba(0,200,255,0.1)';
                  el.style.color = '#6ab8cc';
                  el.style.transform = 'translateX(0)';
                  el.style.boxShadow = 'none';
                }}
                style={{
                  background: 'rgba(0,200,255,0.03)',
                  border: '1px solid rgba(0,200,255,0.1)',
                  borderRadius: 3,
                  color: '#6ab8cc',
                  padding: '12px 18px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: 4,
                  fontSize: 11,
                  fontFamily: "'Orbitron', monospace",
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  animation: `pauseItemIn 0.3s cubic-bezier(0.16,1,0.3,1) ${item.delay}s both`,
                }}
              >
                <span style={{ opacity: 0.4, marginRight: 10, fontSize: 9 }}>{'>'}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Training options */}
          {isTraining && (
            <div style={{
              marginTop: 18,
              borderTop: '1px solid rgba(0,200,255,0.08)',
              paddingTop: 16,
              animation: 'pauseItemIn 0.3s cubic-bezier(0.16,1,0.3,1) 0.35s both',
            }}>
              <div style={{
                color: '#ffcc66',
                fontFamily: "'Orbitron', monospace",
                fontSize: 8,
                letterSpacing: 4,
                marginBottom: 14,
                textAlign: 'center',
                opacity: 0.7,
              }}>
                ENTRENAMIENTO
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{
                  color: 'rgba(0,200,255,0.5)',
                  fontSize: 8,
                  letterSpacing: 3,
                  marginBottom: 5,
                  fontFamily: "'Orbitron', monospace",
                }}>OPONENTE</div>
                <select
                  value={engine.trainingAI}
                  onChange={e => { engine.trainingAI = e.target.value as any; }}
                  style={selectStyle}
                >
                  <option value="dummy">MANIQUÍ</option>
                  <option value="fight">PELEA</option>
                </select>
              </div>

              <div>
                <div style={{
                  color: 'rgba(0,200,255,0.5)',
                  fontSize: 8,
                  letterSpacing: 3,
                  marginBottom: 5,
                  fontFamily: "'Orbitron', monospace",
                }}>ENERGÍA</div>
                <select
                  value={engine.trainingEnergy}
                  onChange={e => { engine.trainingEnergy = e.target.value as any; }}
                  style={selectStyle}
                >
                  <option value="infinite">INFINITA</option>
                  <option value="progressive">PROGRESIVA</option>
                  <option value="none">SIN ENERGÍA</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Decorative bottom line */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(0,200,255,0.3), transparent)',
          marginTop: 0,
        }} />
      </div>

      <style>{`
        @keyframes pauseFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pauseSlideIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pauseItemIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default PauseMenu;
