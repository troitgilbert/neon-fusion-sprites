import React, { useState } from 'react';
import { useGame } from '../game/GameContext';
import { CONTROLS, TRANSFORM_KEY, CHAR_DATA } from '../game/constants';
import { SPECIAL_ABILITIES, SUPER_ABILITIES, ULTRA_ABILITIES } from '../game/skills';

const MOVE_LIST = [
  { category: 'MOVIMIENTO', moves: [
    { name: 'Mover Izquierda', p1: 'A', p2: '←' },
    { name: 'Mover Derecha', p1: 'D', p2: '→' },
    { name: 'Saltar', p1: 'W', p2: '↑' },
    { name: 'Agacharse', p1: 'S', p2: '↓' },
    { name: 'Super Salto', p1: 'S+W', p2: '↓+↑' },
    { name: 'Esquivar', p1: 'T', p2: ';' },
  ]},
  { category: 'ATAQUES', moves: [
    { name: 'Golpe', p1: 'F', p2: '[' },
    { name: 'Daño Vital (↓+Golpe)', p1: 'S+F', p2: '↓+[' },
    { name: 'Uppercut (↑+Golpe)', p1: 'W+F', p2: '↑+[' },
    { name: 'Gancho (→+Golpe)', p1: 'D+F', p2: '→+[' },
    { name: 'Especial', p1: 'G', p2: ']' },
    { name: 'Super', p1: 'H', p2: '\\' },
    { name: 'Ultra', p1: 'E', p2: 'Enter' },
  ]},
  { category: 'DEFENSA', moves: [
    { name: 'Bloquear', p1: 'R', p2: "'" },
    { name: 'Transformar', p1: 'Y', p2: 'P' },
  ]},
  { category: 'EXTRA', moves: [
    { name: 'Emote', p1: 'U', p2: 'L' },
  ]},
];

const PauseMenu: React.FC = () => {
  const { engine, setGameState } = useGame();
  const isTraining = engine.mode === 'training';
  const [showMoves, setShowMoves] = useState(false);

  const hoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    el.style.transform = 'translateX(6px) scale(1.04)';
    el.style.borderColor = '#00ffff';
    el.style.boxShadow = '0 0 20px rgba(0,255,255,0.4)';
  };
  const hoverOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    el.style.transform = '';
    el.style.borderColor = '#87ceeb';
    el.style.boxShadow = '';
  };

  const btnStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.1), transparent)',
    border: '1px solid #87ceeb',
    color: '#87ceeb',
    padding: 12,
    margin: 6,
    width: 280,
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 2,
    fontFamily: "'Orbitron', monospace",
    display: 'block',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  const selectStyle: React.CSSProperties = {
    background: 'rgba(10,10,30,0.9)',
    border: '1px solid #87ceeb',
    color: '#87ceeb',
    padding: '6px 12px',
    fontFamily: "'Orbitron', monospace",
    fontSize: 11,
    letterSpacing: 1,
    cursor: 'pointer',
    width: '100%',
  };

  // Get character-specific moves
  const p1Char = engine.p1Choice !== null && engine.p1Choice < CHAR_DATA.length ? CHAR_DATA[engine.p1Choice] : null;
  const p2Char = engine.p2Choice !== null && engine.p2Choice < CHAR_DATA.length ? CHAR_DATA[engine.p2Choice] : null;

  const charMoves = [];
  if (p1Char) {
    const spec = SPECIAL_ABILITIES.find(a => a.source === p1Char.name || a.source.includes(p1Char.name.slice(0,4)));
    const sup = SUPER_ABILITIES.find(a => a.source === p1Char.name || a.source.includes(p1Char.name.slice(0,4)));
    const ultra = ULTRA_ABILITIES.find(a => a.source === p1Char.name || a.source.includes(p1Char.name.slice(0,4)));
    charMoves.push({ char: p1Char.name, spec, sup, ultra, eyeColor: p1Char.eyes });
  }
  if (p2Char && p2Char.name !== p1Char?.name) {
    const spec = SPECIAL_ABILITIES.find(a => a.source === p2Char.name || a.source.includes(p2Char.name.slice(0,4)));
    const sup = SUPER_ABILITIES.find(a => a.source === p2Char.name || a.source.includes(p2Char.name.slice(0,4)));
    const ultra = ULTRA_ABILITIES.find(a => a.source === p2Char.name || a.source.includes(p2Char.name.slice(0,4)));
    charMoves.push({ char: p2Char.name, spec, sup, ultra, eyeColor: p2Char.eyes });
  }

  if (showMoves) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center anim-screen-fade scanline-overlay" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
        <div className="anim-screen-zoom" style={{
          border: '2px solid #87ceeb',
          boxShadow: '0 0 20px rgba(0,255,255,.4)',
          background: 'rgba(10,10,20,0.95)',
          padding: 20,
          transform: 'skew(-2deg)',
          maxWidth: 500,
          maxHeight: '80vh',
          overflowY: 'auto',
          width: '90vw',
        }}>
          {/* Title */}
          <h2 style={{
            color: '#00ffff',
            textShadow: '0 0 10px #00ffff',
            fontFamily: "'Orbitron', monospace",
            fontSize: 18,
            letterSpacing: 5,
            fontWeight: 900,
            textAlign: 'center',
            marginBottom: 16,
          }}>COMANDOS</h2>

          {/* Move categories */}
          {MOVE_LIST.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: 14 }}>
              <div style={{
                color: '#ffcc33',
                fontFamily: "'Orbitron', monospace",
                fontSize: 9,
                letterSpacing: 4,
                marginBottom: 6,
                borderBottom: '1px solid rgba(255,204,51,0.2)',
                paddingBottom: 4,
              }}>{cat.category}</div>

              {/* Header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 60px 60px',
                gap: 4,
                marginBottom: 4,
              }}>
                <div style={{ color: '#555', fontFamily: "'Orbitron', monospace", fontSize: 7, letterSpacing: 2 }}>ACCIÓN</div>
                <div style={{ color: '#555', fontFamily: "'Orbitron', monospace", fontSize: 7, letterSpacing: 2, textAlign: 'center' }}>P1</div>
                <div style={{ color: '#555', fontFamily: "'Orbitron', monospace", fontSize: 7, letterSpacing: 2, textAlign: 'center' }}>P2</div>
              </div>

              {cat.moves.map((move, mi) => {
                // Find character-specific ability name for attack moves
                let abilityName: string | null = null;
                let abilityColor: string | null = null;
                if (cat.category === 'ATAQUES' && charMoves.length > 0) {
                  const cm = charMoves[0]; // Use P1's character
                  if (move.name === 'Especial' && cm.spec) {
                    abilityName = cm.spec.name;
                    abilityColor = '#00ff66';
                  } else if (move.name === 'Super' && cm.sup) {
                    abilityName = cm.sup.name;
                    abilityColor = '#ffcc33';
                  } else if (move.name === 'Ultra' && cm.ultra) {
                    abilityName = cm.ultra.name;
                    abilityColor = '#ff4444';
                  }
                }

                return (
                  <div key={mi} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 60px 60px',
                    gap: 4,
                    padding: '4px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    animation: `itemCascade 0.3s cubic-bezier(0.16,1,0.3,1) ${(ci * 5 + mi) * 0.04}s both`,
                  }}>
                    <div>
                      <div style={{
                        color: '#ccdde8',
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 10,
                        letterSpacing: 1,
                      }}>{move.name}</div>
                      {abilityName && (
                        <div style={{
                          color: abilityColor || '#aaa',
                          fontFamily: "'Orbitron', monospace",
                          fontSize: 7,
                          letterSpacing: 1,
                          marginTop: 1,
                          opacity: 0.9,
                        }}>» {abilityName}</div>
                      )}
                    </div>
                    <div style={{
                      textAlign: 'center',
                      background: 'rgba(0,255,255,0.08)',
                      border: '1px solid rgba(0,255,255,0.15)',
                      borderRadius: 3,
                      color: '#00ffff',
                      fontFamily: "'Orbitron', monospace",
                      fontSize: 10,
                      fontWeight: 900,
                      padding: '2px 4px',
                    }}>{move.p1}</div>
                    <div style={{
                      textAlign: 'center',
                      background: 'rgba(255,100,100,0.08)',
                      border: '1px solid rgba(255,100,100,0.15)',
                      borderRadius: 3,
                      color: '#ff6666',
                      fontFamily: "'Orbitron', monospace",
                      fontSize: 10,
                      fontWeight: 900,
                      padding: '2px 4px',
                    }}>{move.p2}</div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Character-specific abilities */}
          {charMoves.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{
                color: '#ff00ff',
                fontFamily: "'Orbitron', monospace",
                fontSize: 9,
                letterSpacing: 4,
                marginBottom: 8,
                borderBottom: '1px solid rgba(255,0,255,0.2)',
                paddingBottom: 4,
              }}>HABILIDADES DE PERSONAJE</div>

              {charMoves.map((cm, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{
                    color: cm.eyeColor || '#fff',
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 3,
                    marginBottom: 4,
                    textShadow: `0 0 8px ${cm.eyeColor || '#fff'}50`,
                  }}>{cm.char}</div>

                  {[
                    { label: 'ESPECIAL', ability: cm.spec, color: '#00ff66', key: 'G / ]' },
                    { label: 'SUPER', ability: cm.sup, color: '#ffcc33', key: 'H / \\' },
                    { label: 'ULTRA', ability: cm.ultra, color: '#ff4444', key: 'E / Enter' },
                  ].map((row, ri) => row.ability && (
                    <div key={ri} style={{
                      display: 'grid',
                      gridTemplateColumns: '55px 1fr 70px',
                      gap: 6,
                      padding: '3px 0',
                      alignItems: 'center',
                      animation: `itemCascade 0.3s cubic-bezier(0.16,1,0.3,1) ${0.4 + (i * 3 + ri) * 0.05}s both`,
                    }}>
                      <div style={{
                        color: row.color,
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 7,
                        letterSpacing: 1,
                        fontWeight: 700,
                      }}>{row.label}</div>
                      <div style={{
                        color: '#ccdde8',
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 10,
                        letterSpacing: 1,
                      }}>{row.ability.name}</div>
                      <div style={{
                        textAlign: 'center',
                        background: `${row.color}12`,
                        border: `1px solid ${row.color}30`,
                        borderRadius: 3,
                        color: row.color,
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 9,
                        fontWeight: 900,
                        padding: '2px 4px',
                      }}>{row.key}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Back button */}
          <button
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
            onClick={() => setShowMoves(false)}
            style={{
              ...btnStyle,
              width: '100%',
              textAlign: 'center',
              animation: 'itemCascade 0.4s cubic-bezier(0.16,1,0.3,1) 0.5s both',
            }}
          >Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center anim-screen-fade scanline-overlay" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
      <div className="anim-screen-zoom anim-neon-flash" style={{
        border: '2px solid #87ceeb',
        boxShadow: '0 0 20px rgba(0,255,255,.4)',
        background: 'rgba(10,10,20,0.95)',
        padding: 25,
        textAlign: 'center',
        transform: 'skew(-2deg)',
        minWidth: 320,
      }}>
        <h2 className="anim-title-slam" style={{
          color: '#00ffff',
          textShadow: '0 0 10px #00ffff',
          marginBottom: 15,
          fontFamily: "'Orbitron', monospace",
          letterSpacing: 5,
          fontWeight: 900,
        }}>PAUSA</h2>

        <button onMouseEnter={hoverIn} onMouseLeave={hoverOut} onClick={() => engine.resume()} style={{...btnStyle, animation: 'itemCascade 0.4s cubic-bezier(0.16,1,0.3,1) 0.1s both'}}>Continuar</button>
        <button onMouseEnter={hoverIn} onMouseLeave={hoverOut} onClick={() => setShowMoves(true)} style={{...btnStyle, animation: 'itemCascade 0.4s cubic-bezier(0.16,1,0.3,1) 0.15s both'}}>Comandos</button>
        <button onMouseEnter={hoverIn} onMouseLeave={hoverOut} onClick={() => setGameState('CONFIG')} style={{...btnStyle, animation: 'itemCascade 0.4s cubic-bezier(0.16,1,0.3,1) 0.2s both'}}>Configuración</button>
        <button onMouseEnter={hoverIn} onMouseLeave={hoverOut} onClick={() => engine.restart()} style={{...btnStyle, animation: 'itemCascade 0.4s cubic-bezier(0.16,1,0.3,1) 0.3s both'}}>Reiniciar</button>
        <button onMouseEnter={hoverIn} onMouseLeave={hoverOut} onClick={() => engine.goToMainMenu()} style={{...btnStyle, animation: 'itemCascade 0.4s cubic-bezier(0.16,1,0.3,1) 0.4s both'}}>Menú Principal</button>

        {isTraining && (
          <div style={{ marginTop: 20, borderTop: '1px solid rgba(0,255,255,0.2)', paddingTop: 15 }}>
            <div style={{ color: '#ffcc66', fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 3, marginBottom: 12 }}>
              OPCIONES DE ENTRENAMIENTO
            </div>
            <div style={{ marginBottom: 10, textAlign: 'left' }}>
              <div style={{ color: '#87ceeb', fontSize: 10, letterSpacing: 2, marginBottom: 4, fontFamily: "'Orbitron', monospace" }}>OPONENTE</div>
              <select value={engine.trainingAI} onChange={e => { engine.trainingAI = e.target.value as any; }} style={selectStyle}>
                <option value="dummy">MANIQUÍ (no pelea)</option>
                <option value="fight">PELEA</option>
              </select>
            </div>
            <div style={{ marginBottom: 10, textAlign: 'left' }}>
              <div style={{ color: '#87ceeb', fontSize: 10, letterSpacing: 2, marginBottom: 4, fontFamily: "'Orbitron', monospace" }}>ENERGÍA</div>
              <select value={engine.trainingEnergy} onChange={e => { engine.trainingEnergy = e.target.value as any; }} style={selectStyle}>
                <option value="infinite">INFINITA</option>
                <option value="progressive">PROGRESIVA</option>
                <option value="none">SIN ENERGÍA</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PauseMenu;
