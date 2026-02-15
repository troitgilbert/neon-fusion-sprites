import React from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA, SHOP_CATALOG } from '../game/constants';

const CharacterSelect: React.FC = () => {
  const { engine, setGameState } = useGame();
  const [skinSelectFor, setSkinSelectFor] = React.useState<{ charIdx: number; pNum: number } | null>(null);
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  const isP2Turn = engine.p1Choice !== null && (engine.mode === 'versus' || engine.mode === 'vs_cpu') && engine.p2Choice === null;
  const currentPlayer = isP2Turn ? 2 : 1;

  const handleSelect = (idx: number) => {
    setSkinSelectFor({ charIdx: idx, pNum: engine.p1Choice === null ? 1 : 2 });
  };

  const handleSkinConfirm = (skinId: string | null) => {
    if (!skinSelectFor) return;
    engine.confirmSkinChoice(skinSelectFor.charIdx, skinId, skinSelectFor.pNum);
    setSkinSelectFor(null);
  };

  const availableSkins = (charIdx: number) => {
    const charName = CHAR_DATA[charIdx].name;
    const inv = engine.inventory[charName.toLowerCase()] || {};
    const catalog = SHOP_CATALOG[charName] || [];
    const skins: { id: string | null; name: string }[] = [{ id: null, name: 'Original' }];
    catalog.forEach(item => { if (inv[item.id]) skins.push({ id: item.id, name: item.name }); });
    return skins;
  };

  // Skin selector overlay
  if (skinSelectFor) {
    const skins = availableSkins(skinSelectFor.charIdx);
    const ch = CHAR_DATA[skinSelectFor.charIdx];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 600, width: '90%', textAlign: 'center' }}>
          <h2 style={{
            color: '#00ffff', fontSize: 'clamp(24px, 4vw, 40px)',
            textShadow: '0 0 20px #00ffff',
            marginBottom: 30, fontFamily: "'Orbitron', monospace", letterSpacing: 4
          }}>
            ELIGE ESTILO P{skinSelectFor.pNum}: {ch.name}
          </h2>
          {/* Large preview */}
          <div style={{
            width: 120, height: 120, margin: '0 auto 30px', borderRadius: '50%',
            background: ch.color, border: `4px solid ${ch.eyes}`,
            boxShadow: `0 0 40px ${ch.eyes}60, 0 0 80px ${ch.eyes}20`,
          }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 15 }}>
            {skins.map(skin => (
              <button
                key={skin.id || 'original'}
                onClick={() => handleSkinConfirm(skin.id)}
                style={{
                  border: '2px solid rgba(0,255,255,0.3)', background: 'rgba(10,10,30,0.8)',
                  padding: 20, cursor: 'pointer', color: '#87ceeb',
                  fontFamily: "'Orbitron', monospace", fontSize: 14, transition: 'all 0.3s',
                  boxShadow: '0 0 15px rgba(0,255,255,0.1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.boxShadow = '0 0 25px rgba(0,255,255,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,255,255,0.3)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,255,0.1)'; }}
              >
                <div style={{
                  width: 70, height: 70, margin: '0 auto 10px', borderRadius: '50%',
                  border: '3px solid #87ceeb',
                  background: skin.id === 'demonioBlanco' || skin.id === 'demonioBlanco2' ? '#000' : '#333',
                  boxShadow: '0 0 15px rgba(0,255,255,0.3)'
                }} />
                {skin.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSkinSelectFor(null)}
            style={{
              marginTop: 30, padding: '12px 40px', background: 'transparent',
              border: '2px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer',
              fontFamily: "'Orbitron', monospace", fontSize: 16, letterSpacing: 3,
              transition: 'all 0.3s',
            }}
          >
            CANCELAR
          </button>
        </div>
      </div>
    );
  }

  const displayChar = hoveredIdx !== null ? hoveredIdx : 0;
  const p1Char = engine.p1Choice !== null ? CHAR_DATA[engine.p1Choice] : (hoveredIdx !== null && !isP2Turn ? CHAR_DATA[hoveredIdx] : null);
  const p2Char = isP2Turn && hoveredIdx !== null ? CHAR_DATA[hoveredIdx] : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '15px 30px', borderBottom: '2px solid rgba(0,255,255,0.3)',
        background: 'rgba(0,0,0,0.5)',
      }}>
        <div style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(12px, 2vw, 18px)', letterSpacing: 2 }}>
          The king of Fighters
        </div>
        <div style={{
          color: '#ffff00', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(18px, 3.5vw, 36px)',
          textShadow: '0 0 20px #ffff00, 0 0 40px rgba(255,255,0,0.3)', letterSpacing: 4,
          fontWeight: 900,
        }}>
          PLAYER SELECT
        </div>
        <div style={{ color: '#ff8c00', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(12px, 2vw, 18px)', letterSpacing: 2 }}>
          The king of Fighters
        </div>
      </div>

      {/* Main area: P1 portrait | Grid | P2 portrait */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '10px 20px', minHeight: 0 }}>
        {/* P1 side portrait */}
        <div style={{
          width: 'clamp(100px, 20vw, 250px)', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(16px, 3vw, 30px)',
            marginBottom: 15, textShadow: '0 0 15px #00ffff', fontWeight: 900, letterSpacing: 3,
          }}>
            {p1Char ? p1Char.name : '???'}
          </div>
          <div style={{
            width: 'clamp(80px, 15vw, 180px)', height: 'clamp(80px, 15vw, 180px)',
            borderRadius: '50%',
            background: p1Char ? p1Char.color : '#222',
            border: `4px solid ${p1Char ? p1Char.eyes : '#555'}`,
            boxShadow: p1Char ? `0 0 40px ${p1Char.eyes}60, 0 0 80px ${p1Char.eyes}20` : 'none',
            transition: 'all 0.3s',
          }} />
        </div>

        {/* Center grid — hexagonal style */}
        <div style={{
          flex: 1, maxWidth: 500, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20,
        }}>
          <div style={{
            color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(10px, 1.5vw, 14px)',
            letterSpacing: 2, marginBottom: 5,
          }}>
            press ● to select type
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(CHAR_DATA.length + 1, 4)}, clamp(70px, 10vw, 110px))`,
            gap: 'clamp(8px, 1.5vw, 15px)', justifyContent: 'center',
          }}>
            {CHAR_DATA.map((ch, i) => {
              const isSelected = engine.p1Choice === i || (isP2Turn && hoveredIdx === i);
              const isP1Selected = engine.p1Choice === i;
              return (
                <div
                  key={ch.name}
                  onClick={() => handleSelect(i)}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    width: 'clamp(70px, 10vw, 110px)', height: 'clamp(70px, 10vw, 110px)',
                    cursor: 'pointer', position: 'relative',
                    background: 'rgba(20,20,60,0.9)',
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s',
                    boxShadow: isSelected ? `0 0 30px ${ch.eyes}` : '0 0 10px rgba(0,255,255,0.1)',
                    outline: 'none',
                  }}
                >
                  {/* Inner hexagon content */}
                  <div style={{
                    width: '90%', height: '90%', position: 'absolute',
                    clipPath: 'polygon(50% 2%, 98% 26%, 98% 74%, 50% 98%, 2% 74%, 2% 26%)',
                    background: isP1Selected ? 'rgba(0,255,255,0.15)' : hoveredIdx === i ? 'rgba(0,255,255,0.1)' : 'rgba(10,10,40,0.95)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}>
                    <div style={{
                      width: 'clamp(30px, 5vw, 55px)', height: 'clamp(30px, 5vw, 55px)',
                      borderRadius: '50%', background: ch.color,
                      border: `3px solid ${ch.eyes}`,
                      boxShadow: `0 0 15px ${ch.eyes}40`,
                    }} />
                  </div>
                  {isP1Selected && (
                    <div style={{
                      position: 'absolute', bottom: '5%', color: '#00ffff',
                      fontSize: 'clamp(6px, 1vw, 10px)', fontFamily: "'Orbitron', monospace",
                      fontWeight: 900, textShadow: '0 0 5px #00ffff',
                    }}>P1</div>
                  )}
                </div>
              );
            })}
            {/* Random/mystery slot */}
            <div
              style={{
                width: 'clamp(70px, 10vw, 110px)', height: 'clamp(70px, 10vw, 110px)',
                background: 'rgba(20,20,60,0.6)',
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0.5,
              }}
            >
              <span style={{ color: '#ffff00', fontSize: 'clamp(20px, 3vw, 40px)', fontWeight: 900 }}>?</span>
            </div>
          </div>
        </div>

        {/* P2 side portrait */}
        <div style={{
          width: 'clamp(100px, 20vw, 250px)', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            color: '#ff8c00', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(16px, 3vw, 30px)',
            marginBottom: 15, textShadow: '0 0 15px #ff8c00', fontWeight: 900, letterSpacing: 3,
          }}>
            {p2Char ? p2Char.name : (isP2Turn ? '???' : '---')}
          </div>
          <div style={{
            width: 'clamp(80px, 15vw, 180px)', height: 'clamp(80px, 15vw, 180px)',
            borderRadius: '50%',
            background: p2Char ? p2Char.color : '#222',
            border: `4px solid ${p2Char ? p2Char.eyes : '#555'}`,
            boxShadow: p2Char ? `0 0 40px ${p2Char.eyes}60, 0 0 80px ${p2Char.eyes}20` : 'none',
            transition: 'all 0.3s',
          }} />
        </div>
      </div>

      {/* Bottom control hints */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 30px', borderTop: '2px solid rgba(0,255,255,0.3)',
        background: 'rgba(0,0,0,0.5)',
      }}>
        <div style={{ color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(9px, 1.2vw, 13px)', letterSpacing: 1 }}>
          1P select:'W','S','A','D'  confirm:'F'
        </div>
        <button
          onClick={() => setGameState('MENU')}
          style={{
            padding: '8px 30px', background: 'transparent',
            border: '2px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer',
            fontFamily: "'Orbitron', monospace", fontSize: 'clamp(10px, 1.5vw, 14px)', letterSpacing: 3,
            transition: 'all 0.3s',
          }}
        >
          VOLVER
        </button>
        <div style={{ color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(9px, 1.2vw, 13px)', letterSpacing: 1, textAlign: 'right' }}>
          2P select:'↑','↓','←','→'  confirm:'['
        </div>
      </div>
    </div>
  );
};

export default CharacterSelect;
