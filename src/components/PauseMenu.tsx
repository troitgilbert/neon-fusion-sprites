import React from 'react';
import { useGame } from '../game/GameContext';

const PauseMenu: React.FC = () => {
  const { engine, setGameState } = useGame();
  const isTraining = engine.mode === 'training';
  const [hoveredBtn, setHoveredBtn] = React.useState<string | null>(null);

  const buttons = [
    { id: 'continue', label: 'CONTINUAR', action: () => engine.resume(), delay: 0.1 },
    { id: 'config', label: 'CONFIGURACIÓN', action: () => setGameState('CONFIG'), delay: 0.2 },
    { id: 'restart', label: 'REINICIAR', action: () => engine.restart(), delay: 0.3 },
    { id: 'menu', label: 'MENÚ PRINCIPAL', action: () => engine.goToMainMenu(), delay: 0.4 },
  ];

  const selectStyle: React.CSSProperties = {
    background: 'rgba(5,8,20,0.9)',
    border: '1px solid rgba(255,200,50,0.15)',
    color: '#e0d0a0',
    padding: '8px 14px',
    fontFamily: "'Orbitron', monospace",
    fontSize: 11,
    letterSpacing: 1,
    cursor: 'pointer',
    width: '100%',
    borderRadius: 4,
    outline: 'none',
    transition: 'border-color 0.3s',
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center" style={{
      background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.92) 100%)',
      backdropFilter: 'blur(8px)',
      animation: 'pauseFadeIn 0.25s ease-out',
    }}>
      <div style={{
        position: 'relative',
        minWidth: 340,
        maxWidth: 380,
        padding: '0',
        overflow: 'hidden',
      }}>
        {/* Title area */}
        <div style={{
          textAlign: 'center',
          padding: '28px 30px 20px',
          background: 'linear-gradient(180deg, rgba(255,200,50,0.06) 0%, transparent 100%)',
          borderBottom: '1px solid rgba(255,200,50,0.08)',
        }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 11,
            letterSpacing: 8,
            color: 'rgba(255,200,50,0.35)',
            marginBottom: 8,
          }}>COMBATE</div>
          <h2 style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: 10,
            background: 'linear-gradient(180deg, #fff8e0 0%, #ffcc33 50%, #cc8800 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
            filter: 'drop-shadow(0 2px 8px rgba(255,180,0,0.3))',
          }}>PAUSA</h2>
        </div>

        {/* Buttons */}
        <div style={{ padding: '16px 24px 20px' }}>
          {buttons.map((btn) => {
            const isHovered = hoveredBtn === btn.id;
            return (
              <button
                key={btn.id}
                onMouseEnter={() => setHoveredBtn(btn.id)}
                onMouseLeave={() => setHoveredBtn(null)}
                onClick={btn.action}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 20px',
                  marginBottom: 6,
                  background: isHovered
                    ? 'linear-gradient(90deg, rgba(255,200,50,0.12) 0%, rgba(255,200,50,0.04) 100%)'
                    : 'transparent',
                  border: 'none',
                  borderLeft: isHovered ? '3px solid #ffcc33' : '3px solid transparent',
                  color: isHovered ? '#ffe680' : '#8a8070',
                  fontFamily: "'Orbitron', monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 4,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease-out',
                  borderRadius: 2,
                  animation: `pauseSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) ${btn.delay}s both`,
                  textShadow: isHovered ? '0 0 12px rgba(255,200,50,0.3)' : 'none',
                }}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Training options */}
        {isTraining && (
          <div style={{
            padding: '16px 24px 24px',
            borderTop: '1px solid rgba(255,200,50,0.06)',
          }}>
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 9,
              letterSpacing: 5,
              color: 'rgba(255,200,50,0.3)',
              marginBottom: 14,
              textAlign: 'center',
            }}>ENTRENAMIENTO</div>

            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 9,
                letterSpacing: 3,
                color: '#665',
                marginBottom: 6,
              }}>OPONENTE</div>
              <select
                value={engine.trainingAI}
                onChange={e => { engine.trainingAI = e.target.value as any; }}
                style={selectStyle}
              >
                <option value="dummy">MANIQUÍ (no pelea)</option>
                <option value="fight">PELEA</option>
              </select>
            </div>

            <div>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 9,
                letterSpacing: 3,
                color: '#665',
                marginBottom: 6,
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

        {/* Subtle decorative line at bottom */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,200,50,0.15), transparent)',
          margin: '0 24px',
        }} />
      </div>

      <style>{`
        @keyframes pauseFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pauseSlideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default PauseMenu;
