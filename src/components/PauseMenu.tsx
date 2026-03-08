import React, { useState, useEffect } from 'react';
import { useGame } from '../game/GameContext';

const PauseMenu: React.FC = () => {
  const { engine, setGameState } = useGame();
  const isTraining = engine.mode === 'training';
  const [hoveredBtn, setHoveredBtn] = useState<number | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  const buttons = [
    { label: 'CONTINUAR', icon: '▶', action: () => engine.resume() },
    { label: 'REINICIAR', icon: '↻', action: () => engine.restart() },
    { label: 'CONFIGURACIÓN', icon: '⚙', action: () => setGameState('CONFIG') },
    { label: 'MENÚ PRINCIPAL', icon: '✕', action: () => engine.goToMainMenu(), danger: true },
  ];

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)',
        backdropFilter: 'blur(16px) saturate(0.7)',
        opacity: show ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>

      <div style={{
        width: 'clamp(320px, 30vw, 420px)',
        background: 'linear-gradient(180deg, rgba(12,14,32,0.98) 0%, rgba(6,8,20,0.99) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        boxShadow: `
          0 40px 80px rgba(0,0,0,0.7),
          0 0 80px rgba(0,180,255,0.04),
          inset 0 1px 0 rgba(255,255,255,0.08),
          inset 0 -1px 0 rgba(0,0,0,0.3)
        `,
        overflow: 'hidden',
        transform: show ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(-20px)',
        transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Top accent line */}
        <div style={{
          height: 2,
          background: 'linear-gradient(90deg, transparent 5%, rgba(0,180,255,0.5) 30%, rgba(0,220,255,0.8) 50%, rgba(0,180,255,0.5) 70%, transparent 95%)',
        }} />

        {/* Header */}
        <div style={{ padding: '28px 24px 20px', textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(14px, 1.8vw, 18px)',
            fontWeight: 900,
            letterSpacing: 12,
            color: 'rgba(200,220,255,0.9)',
            textShadow: '0 0 30px rgba(0,180,255,0.3)',
          }}>PAUSA</div>
          <div style={{
            width: 40, height: 1, margin: '12px auto 0',
            background: 'linear-gradient(90deg, transparent, rgba(0,180,255,0.3), transparent)',
          }} />
        </div>

        {/* Buttons */}
        <div style={{ padding: '4px 14px 16px' }}>
          {buttons.map((btn, i) => {
            const isHovered = hoveredBtn === i;
            const accentColor = btn.danger ? '#ff4466' : '#00ccff';
            return (
              <button
                key={i}
                onClick={btn.action}
                onMouseEnter={() => setHoveredBtn(i)}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  width: '100%', padding: '14px 20px', marginBottom: 2,
                  background: isHovered
                    ? `linear-gradient(90deg, ${accentColor}10, transparent 80%)`
                    : 'transparent',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontFamily: "'Orbitron', monospace",
                  fontSize: 11, letterSpacing: 4, fontWeight: 700,
                  color: isHovered ? accentColor : 'rgba(150,160,180,0.6)',
                  transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Left accent bar */}
                <div style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: 2, borderRadius: 1,
                  background: isHovered ? accentColor : 'transparent',
                  boxShadow: isHovered ? `0 0 8px ${accentColor}` : 'none',
                  transition: 'all 0.25s',
                }} />
                <span style={{
                  fontSize: 16, width: 24, textAlign: 'center',
                  opacity: isHovered ? 1 : 0.3,
                  transition: 'opacity 0.2s',
                  filter: isHovered ? `drop-shadow(0 0 4px ${accentColor})` : 'none',
                }}>{btn.icon}</span>
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>

        {/* Training options */}
        {isTraining && (
          <div style={{
            padding: '14px 20px 18px',
            margin: '0 14px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            borderRadius: '0 0 8px 8px',
          }}>
            <div style={{
              fontFamily: "'Orbitron', monospace", fontSize: 8,
              letterSpacing: 5, color: 'rgba(0,200,255,0.35)',
              marginBottom: 14, textAlign: 'center',
            }}>ENTRENAMIENTO</div>

            {[
              { label: 'OPONENTE', value: engine.trainingAI, onChange: (v: string) => { engine.trainingAI = v as any; }, options: [{ v: 'dummy', l: 'MANIQUÍ' }, { v: 'fight', l: 'PELEA' }] },
              { label: 'ENERGÍA', value: engine.trainingEnergy, onChange: (v: string) => { engine.trainingEnergy = v as any; }, options: [{ v: 'infinite', l: 'INFINITA' }, { v: 'progressive', l: 'PROGRESIVA' }, { v: 'none', l: 'SIN ENERGÍA' }] },
            ].map((opt, i) => (
              <div key={i} style={{ marginBottom: i === 0 ? 10 : 0 }}>
                <div style={{
                  fontFamily: "'Orbitron', monospace", fontSize: 8,
                  letterSpacing: 3, color: 'rgba(150,160,180,0.4)', marginBottom: 5,
                }}>{opt.label}</div>
                <select
                  value={opt.value}
                  onChange={e => opt.onChange(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 6,
                    color: 'rgba(180,200,220,0.8)', fontFamily: "'Orbitron', monospace",
                    fontSize: 10, letterSpacing: 2, cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {opt.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '10px 20px 14px', textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.03)',
        }}>
          <span style={{
            fontFamily: "'Orbitron', monospace", fontSize: 7,
            letterSpacing: 4, color: 'rgba(100,110,130,0.4)',
          }}>ESC PARA VOLVER</span>
        </div>
      </div>
    </div>
  );
};

export default PauseMenu;
