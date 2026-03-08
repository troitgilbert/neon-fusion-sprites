import React, { useState } from 'react';
import { useGame } from '../game/GameContext';
import { CONTROLS, TRANSFORM_KEY, CHAR_DATA } from '../game/constants';
import { SPECIAL_ABILITIES, SUPER_ABILITIES, ULTRA_ABILITIES } from '../game/skills';

const MOVE_LIST = [
  { category: 'MOVIMIENTO', moves: [
    { name: 'Mover Izquierda', p1: 'A', p2: '←', icon: '🏃' },
    { name: 'Mover Derecha', p1: 'D', p2: '→', icon: '🏃' },
    { name: 'Saltar', p1: 'W', p2: '↑', icon: '⬆' },
    { name: 'Agacharse', p1: 'S', p2: '↓', icon: '⬇' },
    { name: 'Esquivar', p1: 'T', p2: ';', icon: '💨' },
  ]},
  { category: 'ATAQUES', moves: [
    { name: 'Golpe', p1: 'F', p2: '[', icon: '👊' },
    { name: 'Especial', p1: 'G', p2: ']', icon: '✨' },
    { name: 'Super', p1: 'H', p2: '\\', icon: '🔥' },
    { name: 'Ultra', p1: 'E', p2: 'Enter', icon: '💥' },
  ]},
  { category: 'DEFENSA', moves: [
    { name: 'Bloquear', p1: 'R', p2: "'", icon: '🛡' },
    { name: 'Transformar', p1: 'Y', p2: 'P', icon: '⚡' },
  ]},
];

const PauseMenu: React.FC = () => {
  const { engine, setGameState } = useGame();
  const isTraining = engine.mode === 'training';
  const [showMoves, setShowMoves] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const p1Char = engine.p1Choice !== null && engine.p1Choice < CHAR_DATA.length ? CHAR_DATA[engine.p1Choice] : null;
  const p2Char = engine.p2Choice !== null && engine.p2Choice < CHAR_DATA.length ? CHAR_DATA[engine.p2Choice] : null;

  const findAbility = (abilities: typeof SPECIAL_ABILITIES, name: string) =>
    abilities.find(a => a.source.toLowerCase() === name.toLowerCase() || a.source.toLowerCase().includes(name.slice(0,4).toLowerCase()));

  const charMoves: any[] = [];
  if (p1Char) {
    charMoves.push({ char: p1Char.name, spec: findAbility(SPECIAL_ABILITIES, p1Char.name), sup: findAbility(SUPER_ABILITIES, p1Char.name), ultra: findAbility(ULTRA_ABILITIES, p1Char.name), eyeColor: p1Char.eyes });
  }
  if (p2Char && p2Char.name !== p1Char?.name) {
    charMoves.push({ char: p2Char.name, spec: findAbility(SPECIAL_ABILITIES, p2Char.name), sup: findAbility(SUPER_ABILITIES, p2Char.name), ultra: findAbility(ULTRA_ABILITIES, p2Char.name), eyeColor: p2Char.eyes });
  }

  const menuButtons = [
    { id: 'continue', label: 'CONTINUAR', icon: '▶', action: () => engine.resume(), color: '#00ffcc' },
    { id: 'commands', label: 'COMANDOS', icon: '📋', action: () => setShowMoves(true), color: '#87ceeb' },
    { id: 'config', label: 'CONFIGURACIÓN', icon: '⚙', action: () => setGameState('CONFIG'), color: '#87ceeb' },
    { id: 'restart', label: 'REINICIAR', icon: '🔄', action: () => engine.restart(), color: '#ffcc33' },
    { id: 'mainmenu', label: 'MENÚ PRINCIPAL', icon: '🏠', action: () => engine.goToMainMenu(), color: '#ff4d4d' },
  ];

  if (showMoves) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}>
        <div style={{
          background: 'linear-gradient(145deg, rgba(8,8,28,0.98), rgba(4,4,18,0.99))',
          border: '1px solid rgba(0,255,255,0.25)',
          boxShadow: '0 0 60px rgba(0,255,255,0.08), inset 0 0 40px rgba(0,0,0,0.5), 0 25px 80px rgba(0,0,0,0.6)',
          padding: '28px 32px',
          maxWidth: 520,
          maxHeight: '85vh',
          overflowY: 'auto',
          width: '92vw',
          borderRadius: 2,
          position: 'relative',
        }}>
          {/* Top accent line */}
          <div style={{
            position: 'absolute', top: 0, left: '10%', right: '10%', height: 2,
            background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
            boxShadow: '0 0 20px #00ffff50',
          }} />

          <h2 style={{
            color: '#00ffff',
            textShadow: '0 0 30px rgba(0,255,255,0.5), 0 0 60px rgba(0,255,255,0.15)',
            fontFamily: "'Orbitron', monospace",
            fontSize: 20,
            letterSpacing: 8,
            fontWeight: 900,
            textAlign: 'center',
            marginBottom: 24,
          }}>COMANDOS</h2>

          {MOVE_LIST.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: 18 }}>
              <div style={{
                color: '#ffcc33',
                fontFamily: "'Orbitron', monospace",
                fontSize: 10,
                letterSpacing: 5,
                marginBottom: 8,
                paddingBottom: 6,
                borderBottom: '1px solid rgba(255,204,51,0.15)',
                textShadow: '0 0 10px rgba(255,204,51,0.3)',
              }}>{cat.category}</div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 65px 65px',
                gap: 4,
                marginBottom: 6,
                padding: '0 4px',
              }}>
                <div style={{ color: 'rgba(135,206,235,0.4)', fontFamily: "'Orbitron', monospace", fontSize: 7, letterSpacing: 3 }}>ACCIÓN</div>
                <div style={{ color: 'rgba(0,255,255,0.4)', fontFamily: "'Orbitron', monospace", fontSize: 7, letterSpacing: 2, textAlign: 'center' }}>P1</div>
                <div style={{ color: 'rgba(255,100,100,0.4)', fontFamily: "'Orbitron', monospace", fontSize: 7, letterSpacing: 2, textAlign: 'center' }}>P2</div>
              </div>

              {cat.moves.map((move, mi) => (
                <div key={mi} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 65px 65px',
                  gap: 4,
                  padding: '6px 4px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  animation: `itemCascade 0.3s cubic-bezier(0.16,1,0.3,1) ${(ci * 5 + mi) * 0.03}s both`,
                  transition: 'background 0.2s',
                }}>
                  <div style={{
                    color: '#ccdde8',
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 11,
                    letterSpacing: 1,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: 13, opacity: 0.7 }}>{move.icon}</span>
                    {move.name}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    background: 'rgba(0,255,255,0.06)',
                    border: '1px solid rgba(0,255,255,0.2)',
                    borderRadius: 4,
                    color: '#00ffff',
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 11,
                    fontWeight: 900,
                    padding: '3px 6px',
                    textShadow: '0 0 8px rgba(0,255,255,0.3)',
                  }}>{move.p1}</div>
                  <div style={{
                    textAlign: 'center',
                    background: 'rgba(255,80,80,0.06)',
                    border: '1px solid rgba(255,80,80,0.2)',
                    borderRadius: 4,
                    color: '#ff6666',
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 11,
                    fontWeight: 900,
                    padding: '3px 6px',
                    textShadow: '0 0 8px rgba(255,80,80,0.3)',
                  }}>{move.p2}</div>
                </div>
              ))}
            </div>
          ))}

          {charMoves.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{
                color: '#ff00ff',
                fontFamily: "'Orbitron', monospace",
                fontSize: 10,
                letterSpacing: 5,
                marginBottom: 10,
                paddingBottom: 6,
                borderBottom: '1px solid rgba(255,0,255,0.15)',
                textShadow: '0 0 10px rgba(255,0,255,0.3)',
              }}>HABILIDADES DE PERSONAJE</div>

              {charMoves.map((cm, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{
                    color: cm.eyeColor || '#fff',
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 13,
                    fontWeight: 900,
                    letterSpacing: 4,
                    marginBottom: 6,
                    textShadow: `0 0 15px ${cm.eyeColor || '#fff'}60`,
                  }}>{cm.char}</div>

                  {[
                    { label: 'ESPECIAL', ability: cm.spec, color: '#00ff66', key: 'G / ]' },
                    { label: 'SUPER', ability: cm.sup, color: '#ffcc33', key: 'H / \\' },
                    { label: 'ULTRA', ability: cm.ultra, color: '#ff4444', key: 'E / Enter' },
                  ].map((row, ri) => row.ability && (
                    <div key={ri} style={{
                      display: 'grid',
                      gridTemplateColumns: '60px 1fr 75px',
                      gap: 8,
                      padding: '5px 0',
                      alignItems: 'center',
                      animation: `itemCascade 0.3s cubic-bezier(0.16,1,0.3,1) ${0.3 + (i * 3 + ri) * 0.05}s both`,
                    }}>
                      <div style={{
                        color: row.color,
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 8,
                        letterSpacing: 1,
                        fontWeight: 700,
                        textShadow: `0 0 8px ${row.color}40`,
                      }}>{row.label}</div>
                      <div style={{
                        color: '#ccdde8',
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 11,
                        letterSpacing: 1,
                      }}>{row.ability.name}</div>
                      <div style={{
                        textAlign: 'center',
                        background: `${row.color}0a`,
                        border: `1px solid ${row.color}25`,
                        borderRadius: 4,
                        color: row.color,
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 10,
                        fontWeight: 900,
                        padding: '3px 6px',
                        textShadow: `0 0 6px ${row.color}30`,
                      }}>{row.key}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowMoves(false)}
            onMouseEnter={() => setHoveredBtn('back-moves')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: hoveredBtn === 'back-moves' ? 'rgba(0,255,255,0.1)' : 'transparent',
              border: `1px solid ${hoveredBtn === 'back-moves' ? '#00ffff' : 'rgba(135,206,235,0.3)'}`,
              color: hoveredBtn === 'back-moves' ? '#00ffff' : '#87ceeb',
              cursor: 'pointer',
              fontFamily: "'Orbitron', monospace",
              fontSize: 13,
              letterSpacing: 4,
              fontWeight: 900,
              transition: 'all 0.3s ease',
              boxShadow: hoveredBtn === 'back-moves' ? '0 0 25px rgba(0,255,255,0.2)' : 'none',
              marginTop: 8,
              borderRadius: 2,
            }}
          >VOLVER</button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}>
      <div style={{
        background: 'linear-gradient(145deg, rgba(8,8,28,0.98), rgba(4,4,18,0.99))',
        border: '1px solid rgba(0,255,255,0.2)',
        boxShadow: '0 0 80px rgba(0,255,255,0.06), inset 0 0 60px rgba(0,0,0,0.5), 0 30px 100px rgba(0,0,0,0.7)',
        padding: '35px 40px',
        textAlign: 'center',
        minWidth: 360,
        position: 'relative',
        borderRadius: 2,
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: 2,
          background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
          boxShadow: '0 0 30px #00ffff40',
        }} />

        {/* Bottom accent line */}
        <div style={{
          position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.3), transparent)',
        }} />

        {/* Corner decorations */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => (
          <div key={corner} style={{
            position: 'absolute',
            [corner.includes('top') ? 'top' : 'bottom']: -1,
            [corner.includes('left') ? 'left' : 'right']: -1,
            width: 12, height: 12,
            borderTop: corner.includes('top') ? '2px solid #00ffff' : 'none',
            borderBottom: corner.includes('bottom') ? '2px solid #00ffff' : 'none',
            borderLeft: corner.includes('left') ? '2px solid #00ffff' : 'none',
            borderRight: corner.includes('right') ? '2px solid #00ffff' : 'none',
            opacity: 0.6,
          }} />
        ))}

        {/* Pause icon */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12,
        }}>
          <div style={{ width: 6, height: 28, background: 'linear-gradient(180deg, #00ffff, #0088aa)', borderRadius: 2, boxShadow: '0 0 15px #00ffff50' }} />
          <div style={{ width: 6, height: 28, background: 'linear-gradient(180deg, #00ffff, #0088aa)', borderRadius: 2, boxShadow: '0 0 15px #00ffff50' }} />
        </div>

        <h2 style={{
          color: '#00ffff',
          textShadow: '0 0 30px rgba(0,255,255,0.5), 0 0 60px rgba(0,255,255,0.15)',
          marginBottom: 28,
          fontFamily: "'Orbitron', monospace",
          fontSize: 26,
          letterSpacing: 10,
          fontWeight: 900,
        }}>PAUSA</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {menuButtons.map((btn, i) => (
            <button
              key={btn.id}
              onClick={btn.action}
              onMouseEnter={() => setHoveredBtn(btn.id)}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                background: hoveredBtn === btn.id
                  ? `linear-gradient(90deg, transparent, ${btn.color}18, transparent)`
                  : 'transparent',
                border: `1px solid ${hoveredBtn === btn.id ? btn.color : 'rgba(135,206,235,0.15)'}`,
                color: hoveredBtn === btn.id ? btn.color : 'rgba(135,206,235,0.7)',
                padding: '13px 24px',
                width: 300,
                cursor: 'pointer',
                fontFamily: "'Orbitron', monospace",
                fontSize: 13,
                letterSpacing: 4,
                fontWeight: 700,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: hoveredBtn === btn.id ? 'translateX(4px)' : 'none',
                boxShadow: hoveredBtn === btn.id ? `0 0 30px ${btn.color}20, inset 0 0 20px ${btn.color}08` : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                borderRadius: 2,
                animation: `itemCascade 0.4s cubic-bezier(0.16,1,0.3,1) ${0.08 + i * 0.06}s both`,
                textShadow: hoveredBtn === btn.id ? `0 0 15px ${btn.color}50` : 'none',
              }}
            >
              <span style={{ fontSize: 16, opacity: 0.8, width: 22, textAlign: 'center' }}>{btn.icon}</span>
              {btn.label}
            </button>
          ))}
        </div>

        {isTraining && (
          <div style={{
            marginTop: 24,
            borderTop: '1px solid rgba(0,255,255,0.1)',
            paddingTop: 20,
          }}>
            <div style={{
              color: '#ffcc33',
              fontFamily: "'Orbitron', monospace",
              fontSize: 10,
              letterSpacing: 5,
              marginBottom: 16,
              textShadow: '0 0 10px rgba(255,204,51,0.3)',
            }}>
              OPCIONES DE ENTRENAMIENTO
            </div>

            {[
              { label: 'OPONENTE', value: engine.trainingAI, onChange: (v: string) => { engine.trainingAI = v as any; }, options: [
                { value: 'dummy', label: 'MANIQUÍ (no pelea)' },
                { value: 'fight', label: 'PELEA' },
              ]},
              { label: 'ENERGÍA', value: engine.trainingEnergy, onChange: (v: string) => { engine.trainingEnergy = v as any; }, options: [
                { value: 'infinite', label: 'INFINITA' },
                { value: 'progressive', label: 'PROGRESIVA' },
                { value: 'none', label: 'SIN ENERGÍA' },
              ]},
            ].map((opt, i) => (
              <div key={i} style={{ marginBottom: 12, textAlign: 'left' }}>
                <div style={{
                  color: 'rgba(135,206,235,0.5)',
                  fontSize: 9,
                  letterSpacing: 3,
                  marginBottom: 5,
                  fontFamily: "'Orbitron', monospace",
                }}>{opt.label}</div>
                <select
                  value={opt.value}
                  onChange={e => opt.onChange(e.target.value)}
                  style={{
                    background: 'rgba(6,6,20,0.95)',
                    border: '1px solid rgba(0,255,255,0.15)',
                    color: '#87ceeb',
                    padding: '8px 12px',
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 11,
                    letterSpacing: 2,
                    cursor: 'pointer',
                    width: '100%',
                    borderRadius: 2,
                    outline: 'none',
                    transition: 'border-color 0.3s',
                  }}
                >
                  {opt.options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* ESC hint */}
        <div style={{
          marginTop: 20,
          color: 'rgba(135,206,235,0.25)',
          fontFamily: "'Orbitron', monospace",
          fontSize: 9,
          letterSpacing: 4,
        }}>
          PRESIONA ESC PARA CONTINUAR
        </div>
      </div>
    </div>
  );
};

export default PauseMenu;
