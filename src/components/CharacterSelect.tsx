import React from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA, SHOP_CATALOG } from '../game/constants';
import type { CustomCharData } from '../game/types';
import { playSelectSound, playConfirmSound } from '../game/audio';

const CharacterSelect: React.FC = () => {
  const { engine, setGameState } = useGame();
  const [skinSelectFor, setSkinSelectFor] = React.useState<{ charIdx: number; pNum: number } | null>(null);
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
  const [showCustomMenu, setShowCustomMenu] = React.useState(false);
  const [customChars, setCustomChars] = React.useState<(CustomCharData | null)[]>([null, null, null, null, null, null]);

  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('customChars') || '[]');
      const arr: (CustomCharData | null)[] = [null, null, null, null, null, null];
      saved.forEach((ch: any, i: number) => { if (i < 6 && ch) arr[i] = ch; });
      setCustomChars(arr);
    } catch {}
  }, []);

  const isP2Turn = engine.p1Choice !== null && (engine.mode === 'versus' || engine.mode === 'vs_cpu') && engine.p2Choice === null;

  const handleSelect = (idx: number) => {
    playConfirmSound();
    setSkinSelectFor({ charIdx: idx, pNum: engine.p1Choice === null ? 1 : 2 });
  };

  const handleCustomSelect = (customIdx: number) => {
    const ch = customChars[customIdx];
    if (!ch) return;
    playConfirmSound();
    // Store custom char index as 100 + idx for identification
    const charSelectIdx = 100 + customIdx;
    engine.confirmSkinChoice(charSelectIdx, null, engine.p1Choice === null ? 1 : 2);
    setShowCustomMenu(false);
  };

  const handleRandomSelect = () => {
    const allOptions: number[] = [...CHAR_DATA.map((_, i) => i)];
    customChars.forEach((ch, i) => { if (ch) allOptions.push(100 + i); });
    const pick = allOptions[Math.floor(Math.random() * allOptions.length)];
    playConfirmSound();
    if (pick >= 100) {
      engine.confirmSkinChoice(pick, null, engine.p1Choice === null ? 1 : 2);
    } else {
      setSkinSelectFor({ charIdx: pick, pNum: engine.p1Choice === null ? 1 : 2 });
    }
  };

  const handleSkinConfirm = (skinId: string | null) => {
    if (!skinSelectFor) return;
    playConfirmSound();
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

  // Custom character submenu
  if (showCustomMenu) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 650, width: '90%', textAlign: 'center' }}>
          <h2 style={{ color: '#ffff00', fontSize: 'clamp(20px, 3.5vw, 32px)', textShadow: '0 0 20px #ffff00', marginBottom: 25, fontFamily: "'Orbitron', monospace", letterSpacing: 4 }}>
            PERSONAJES PERSONALIZADOS
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
            {customChars.map((ch, i) => (
              <div
                key={i}
                onClick={() => ch && handleCustomSelect(i)}
                style={{
                  padding: 18, cursor: ch ? 'pointer' : 'default', textAlign: 'center',
                  background: 'rgba(10,10,30,0.9)',
                  border: `2px solid ${ch ? 'rgba(0,255,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  opacity: ch ? 1 : 0.4, transition: 'all 0.3s',
                }}
                onMouseEnter={e => { if (ch) { e.currentTarget.style.borderColor = ch.eyesColor; e.currentTarget.style.boxShadow = `0 0 20px ${ch.eyesColor}40`; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ch ? 'rgba(0,255,255,0.4)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {ch ? (
                  <>
                    <div style={{
                      width: 55, height: 55, borderRadius: '50%', background: ch.skinColor,
                      border: `3px solid ${ch.eyesColor}`, boxShadow: `0 0 12px ${ch.eyesColor}40`,
                      position: 'relative', margin: '0 auto 8px',
                    }}>
                      <div style={{ position: 'absolute', top: -3, left: '12%', right: '12%', height: '40%', borderRadius: '50% 50% 0 0', background: ch.hairColor }} />
                      <div style={{ position: 'absolute', top: '38%', left: '25%', width: 7, height: 7, borderRadius: '50%', background: ch.eyesColor }} />
                      <div style={{ position: 'absolute', top: '38%', right: '25%', width: 7, height: 7, borderRadius: '50%', background: ch.eyesColor }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%', borderRadius: '0 0 50px 50px', background: ch.clothesColor }} />
                    </div>
                    <div style={{ color: '#eafcff', fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 2 }}>{ch.name}</div>
                  </>
                ) : (
                  <div style={{
                    width: 55, height: 55, borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
                    border: '2px dashed rgba(255,255,255,0.1)', margin: '0 auto 8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: '#333', fontSize: 20 }}>—</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setShowCustomMenu(false)} style={{
            marginTop: 25, padding: '10px 35px', background: 'transparent',
            border: '2px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer',
            fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
          }}>VOLVER</button>
        </div>
      </div>
    );
  }

  // Skin selector overlay
  if (skinSelectFor) {
    const skins = availableSkins(skinSelectFor.charIdx);
    const ch = CHAR_DATA[skinSelectFor.charIdx];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 600, width: '90%', textAlign: 'center' }}>
          <h2 style={{ color: '#00ffff', fontSize: 'clamp(22px, 3.5vw, 36px)', textShadow: '0 0 20px #00ffff', marginBottom: 25, fontFamily: "'Orbitron', monospace", letterSpacing: 4 }}>
            ELIGE ESTILO P{skinSelectFor.pNum}: {ch.name}
          </h2>
          <div style={{
            width: 100, height: 100, margin: '0 auto 25px', borderRadius: '50%',
            background: skinSelectFor.charIdx === 1 ? '#f5d1ad' : ch.color,
            border: `4px solid ${ch.eyes}`, boxShadow: `0 0 30px ${ch.eyes}60`,
          }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            {skins.map(skin => (
              <button key={skin.id || 'original'} onClick={() => handleSkinConfirm(skin.id)}
                style={{
                  border: '2px solid rgba(0,255,255,0.3)', background: 'rgba(10,10,30,0.8)',
                  padding: 16, cursor: 'pointer', color: '#87ceeb',
                  fontFamily: "'Orbitron', monospace", fontSize: 13, transition: 'all 0.3s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,255,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,255,255,0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  width: 55, height: 55, margin: '0 auto 8px', borderRadius: '50%',
                  border: '3px solid #87ceeb', background: skin.id === 'demonioBlanco' || skin.id === 'demonioBlanco2' ? '#000' : '#333',
                  boxShadow: '0 0 12px rgba(0,255,255,0.3)',
                }} />
                {skin.name}
              </button>
            ))}
          </div>
          <button onClick={() => setSkinSelectFor(null)} style={{
            marginTop: 25, padding: '10px 35px', background: 'transparent',
            border: '2px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer',
            fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
          }}>CANCELAR</button>
        </div>
      </div>
    );
  }

  const p1Char = engine.p1Choice !== null && engine.p1Choice < 100 ? CHAR_DATA[engine.p1Choice] : null;
  const p1Custom = engine.p1Choice !== null && engine.p1Choice >= 100 ? customChars[engine.p1Choice - 100] : null;
  const p2Char = isP2Turn && hoveredIdx !== null && hoveredIdx < 100 ? CHAR_DATA[hoveredIdx] : null;

  const p1Name = p1Custom ? p1Custom.name : (p1Char ? p1Char.name : (hoveredIdx !== null && !isP2Turn && hoveredIdx < 100 ? CHAR_DATA[hoveredIdx]?.name : '???'));
  const p1Color = p1Custom ? p1Custom.skinColor : (p1Char ? p1Char.color : (hoveredIdx !== null && !isP2Turn && hoveredIdx < 100 ? CHAR_DATA[hoveredIdx]?.color : '#222'));
  const p1Eyes = p1Custom ? p1Custom.eyesColor : (p1Char ? p1Char.eyes : (hoveredIdx !== null && !isP2Turn && hoveredIdx < 100 ? CHAR_DATA[hoveredIdx]?.eyes : '#555'));

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 25px', borderBottom: '2px solid rgba(0,255,255,0.3)', background: 'rgba(0,0,0,0.5)',
      }}>
        <div style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(12px, 2vw, 16px)', letterSpacing: 2 }}>P1</div>
        <div style={{ color: '#ffff00', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(16px, 3vw, 30px)', textShadow: '0 0 15px #ffff00', letterSpacing: 4, fontWeight: 900 }}>
          SELECCIÓN DE PERSONAJE
        </div>
        <div style={{ color: '#ff8c00', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(12px, 2vw, 16px)', letterSpacing: 2 }}>P2</div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '10px 20px', minHeight: 0 }}>
        {/* P1 portrait */}
        <div style={{ width: 'clamp(90px, 18vw, 220px)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(14px, 2.5vw, 24px)', marginBottom: 12, textShadow: '0 0 12px #00ffff', fontWeight: 900, letterSpacing: 3 }}>
            {p1Name}
          </div>
          <div style={{
            width: 'clamp(70px, 13vw, 150px)', height: 'clamp(70px, 13vw, 150px)', borderRadius: '50%',
            background: p1Color, border: `4px solid ${p1Eyes}`,
            boxShadow: `0 0 30px ${p1Eyes}60`, transition: 'all 0.3s',
          }} />
        </div>

        {/* Center grid */}
        <div style={{ flex: 1, maxWidth: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 15 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(CHAR_DATA.length + 2, 5)}, clamp(60px, 9vw, 100px))`,
            gap: 'clamp(6px, 1.2vw, 12px)', justifyContent: 'center',
          }}>
            {/* Base characters */}
            {CHAR_DATA.map((ch, i) => {
              const isP1Selected = engine.p1Choice === i;
              return (
                <div key={ch.name} onClick={() => handleSelect(i)}
                  onMouseEnter={() => { setHoveredIdx(i); playSelectSound(); }}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    width: 'clamp(60px, 9vw, 100px)', height: 'clamp(60px, 9vw, 100px)', cursor: 'pointer', position: 'relative',
                    background: 'rgba(20,20,60,0.9)',
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
                    boxShadow: isP1Selected ? `0 0 25px ${ch.eyes}` : hoveredIdx === i ? `0 0 15px ${ch.eyes}60` : '0 0 8px rgba(0,255,255,0.1)',
                  }}
                >
                  <div style={{
                    width: '90%', height: '90%', position: 'absolute',
                    clipPath: 'polygon(50% 2%, 98% 26%, 98% 74%, 50% 98%, 2% 74%, 2% 26%)',
                    background: isP1Selected ? 'rgba(0,255,255,0.15)' : hoveredIdx === i ? 'rgba(0,255,255,0.08)' : 'rgba(10,10,40,0.95)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 'clamp(25px, 4.5vw, 45px)', height: 'clamp(25px, 4.5vw, 45px)', borderRadius: '50%',
                      background: ch.color, border: `3px solid ${ch.eyes}`, boxShadow: `0 0 12px ${ch.eyes}40`,
                    }} />
                  </div>
                  {isP1Selected && (
                    <div style={{ position: 'absolute', bottom: '6%', color: '#00ffff', fontSize: 'clamp(6px, 1vw, 9px)', fontFamily: "'Orbitron', monospace", fontWeight: 900, textShadow: '0 0 5px #00ffff' }}>P1</div>
                  )}
                </div>
              );
            })}

            {/* ? Custom character sphere */}
            <div
              onClick={() => { setShowCustomMenu(true); playConfirmSound(); }}
              onMouseEnter={() => setHoveredIdx(null)}
              style={{
                width: 'clamp(60px, 9vw, 100px)', height: 'clamp(60px, 9vw, 100px)', cursor: 'pointer', position: 'relative',
                background: 'rgba(20,20,60,0.9)',
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
              }}
            >
              <div style={{
                width: '90%', height: '90%', position: 'absolute',
                clipPath: 'polygon(50% 2%, 98% 26%, 98% 74%, 50% 98%, 2% 74%, 2% 26%)',
                background: 'rgba(10,10,40,0.95)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 'clamp(25px, 4.5vw, 45px)', height: 'clamp(25px, 4.5vw, 45px)', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #333, #555)', border: '3px solid #ffff00',
                  boxShadow: '0 0 15px #ffff0040',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: '#ffff00', fontSize: 'clamp(14px, 2.5vw, 24px)', fontWeight: 900, fontFamily: "'Orbitron', monospace" }}>?</span>
                </div>
              </div>
            </div>

            {/* Random selector */}
            <div
              onClick={handleRandomSelect}
              onMouseEnter={() => setHoveredIdx(null)}
              style={{
                width: 'clamp(60px, 9vw, 100px)', height: 'clamp(60px, 9vw, 100px)', cursor: 'pointer', position: 'relative',
                background: 'rgba(20,20,60,0.9)',
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
              }}
            >
              <div style={{
                width: '90%', height: '90%', position: 'absolute',
                clipPath: 'polygon(50% 2%, 98% 26%, 98% 74%, 50% 98%, 2% 74%, 2% 26%)',
                background: 'rgba(10,10,40,0.95)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              }}>
                <div style={{
                  width: 'clamp(25px, 4.5vw, 45px)', height: 'clamp(25px, 4.5vw, 45px)', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff0088, #00ffff, #ffff00)', border: '3px solid #fff',
                  boxShadow: '0 0 15px #ffffff40',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 'clamp(10px, 1.8vw, 16px)', fontWeight: 900 }}>🎲</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* P2 portrait */}
        <div style={{ width: 'clamp(90px, 18vw, 220px)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#ff8c00', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(14px, 2.5vw, 24px)', marginBottom: 12, textShadow: '0 0 12px #ff8c00', fontWeight: 900, letterSpacing: 3 }}>
            {p2Char ? p2Char.name : (isP2Turn ? '???' : '---')}
          </div>
          <div style={{
            width: 'clamp(70px, 13vw, 150px)', height: 'clamp(70px, 13vw, 150px)', borderRadius: '50%',
            background: p2Char ? p2Char.color : '#222',
            border: `4px solid ${p2Char ? p2Char.eyes : '#555'}`,
            boxShadow: p2Char ? `0 0 30px ${p2Char.eyes}60` : 'none', transition: 'all 0.3s',
          }} />
        </div>
      </div>

      {/* Bottom */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 25px', borderTop: '2px solid rgba(0,255,255,0.3)', background: 'rgba(0,0,0,0.5)',
      }}>
        <div style={{ color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(8px, 1.1vw, 11px)', letterSpacing: 1 }}>
          1P: WASD + F
        </div>
        <button onClick={() => setGameState('MENU')} style={{
          padding: '7px 25px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
          cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(10px, 1.3vw, 13px)', letterSpacing: 3,
        }}>VOLVER</button>
        <div style={{ color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(8px, 1.1vw, 11px)', letterSpacing: 1, textAlign: 'right' }}>
          2P: ↑↓←→ + [
        </div>
      </div>
    </div>
  );
};

export default CharacterSelect;
