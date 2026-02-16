import React from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA, SHOP_CATALOG } from '../game/constants';
import type { CustomCharData } from '../game/types';
import { playSelectSound, playConfirmSound } from '../game/audio';

// Draw a mini ball portrait for characters
const CharPortrait: React.FC<{ color: string; eyes: string; hairColor?: string; size?: number }> = ({ color, eyes, hairColor, size = 45 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: color, border: `3px solid ${eyes}`,
    boxShadow: `0 0 15px ${eyes}40, inset 0 -5px 10px rgba(0,0,0,0.3)`,
    position: 'relative', overflow: 'visible',
  }}>
    {/* Hair spikes */}
    <div style={{
      position: 'absolute', top: -size * 0.25, left: '10%', right: '10%', height: size * 0.5,
      background: hairColor || eyes,
      clipPath: 'polygon(0% 100%, 10% 30%, 25% 70%, 40% 10%, 55% 60%, 70% 0%, 85% 50%, 100% 100%)',
      filter: `drop-shadow(0 0 3px ${hairColor || eyes})`,
    }} />
    {/* Eyes */}
    <div style={{ position: 'absolute', top: '35%', left: '22%', width: size * 0.17, height: size * 0.17, borderRadius: '50%', background: eyes, boxShadow: `0 0 4px ${eyes}` }} />
    <div style={{ position: 'absolute', top: '35%', right: '22%', width: size * 0.17, height: size * 0.17, borderRadius: '50%', background: eyes, boxShadow: `0 0 4px ${eyes}` }} />
    {/* Pupils */}
    <div style={{ position: 'absolute', top: '40%', left: '26%', width: size * 0.08, height: size * 0.08, borderRadius: '50%', background: '#000' }} />
    <div style={{ position: 'absolute', top: '40%', right: '26%', width: size * 0.08, height: size * 0.08, borderRadius: '50%', background: '#000' }} />
  </div>
);

const CustomPortrait: React.FC<{ ch: CustomCharData; size?: number }> = ({ ch, size = 45 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: ch.skinColor, border: `3px solid ${ch.eyesColor}`,
    boxShadow: `0 0 15px ${ch.eyesColor}40, inset 0 -5px 10px rgba(0,0,0,0.3)`,
    position: 'relative',
  }}>
    {/* Hair spikes */}
    <div style={{
      position: 'absolute', top: -size * 0.25, left: '10%', right: '10%', height: size * 0.5,
      background: ch.hairColor,
      clipPath: 'polygon(0% 100%, 10% 30%, 25% 70%, 40% 10%, 55% 60%, 70% 0%, 85% 50%, 100% 100%)',
      filter: `drop-shadow(0 0 3px ${ch.hairColor})`,
    }} />
    {/* Clothes */}
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '28%', borderRadius: `0 0 ${size}px ${size}px`, background: ch.clothesColor }} />
    {/* Eyes */}
    <div style={{ position: 'absolute', top: '35%', left: '22%', width: size * 0.17, height: size * 0.17, borderRadius: '50%', background: ch.eyesColor, boxShadow: `0 0 4px ${ch.eyesColor}` }} />
    <div style={{ position: 'absolute', top: '35%', right: '22%', width: size * 0.17, height: size * 0.17, borderRadius: '50%', background: ch.eyesColor, boxShadow: `0 0 4px ${ch.eyesColor}` }} />
  </div>
);

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
      saved.forEach((ch: any, i: number) => { if (i < 6 && ch) arr[i] = { ...ch }; });
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
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.3s ease-out' }}>
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
                onMouseEnter={e => { if (ch) { e.currentTarget.style.borderColor = ch.eyesColor; e.currentTarget.style.boxShadow = `0 0 25px ${ch.eyesColor}40`; e.currentTarget.style.transform = 'scale(1.05)'; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ch ? 'rgba(0,255,255,0.4)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {ch ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <CustomPortrait ch={ch} size={55} />
                    <div style={{ color: '#eafcff', fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 2 }}>{ch.name}</div>
                  </div>
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
            fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3, transition: 'all 0.3s',
          }}>VOLVER</button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
      </div>
    );
  }

  // Skin selector overlay
  if (skinSelectFor) {
    const skins = availableSkins(skinSelectFor.charIdx);
    const ch = CHAR_DATA[skinSelectFor.charIdx];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.3s ease-out' }}>
        <div style={{ maxWidth: 600, width: '90%', textAlign: 'center' }}>
          <h2 style={{ color: '#00ffff', fontSize: 'clamp(22px, 3.5vw, 36px)', textShadow: '0 0 20px #00ffff', marginBottom: 25, fontFamily: "'Orbitron', monospace", letterSpacing: 4 }}>
            ELIGE ESTILO P{skinSelectFor.pNum}: {ch.name}
          </h2>
          <div style={{ margin: '0 auto 25px', display: 'flex', justifyContent: 'center' }}>
            <CharPortrait color={ch.color} eyes={ch.eyes} hairColor={skinSelectFor.charIdx === 0 ? '#5a3a1a' : '#fff'} size={90} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            {skins.map(skin => (
              <button key={skin.id || 'original'} onClick={() => handleSkinConfirm(skin.id)}
                style={{
                  border: '2px solid rgba(0,255,255,0.3)', background: 'rgba(10,10,30,0.8)',
                  padding: 16, cursor: 'pointer', color: '#87ceeb',
                  fontFamily: "'Orbitron', monospace", fontSize: 13, transition: 'all 0.3s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,255,0.4)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,255,255,0.3)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div style={{ margin: '0 auto 8px', display: 'flex', justifyContent: 'center' }}>
                  <CharPortrait
                    color={skin.id === 'demonioBlanco' ? '#000' : skin.id === 'demonioBlanco2' ? '#222' : ch.color}
                    eyes={skin.id === 'demonioBlanco' ? '#ff0000' : skin.id === 'demonioBlanco2' ? '#ff4444' : ch.eyes}
                    hairColor={skin.id ? '#444' : (skinSelectFor.charIdx === 0 ? '#5a3a1a' : '#fff')}
                    size={50}
                  />
                </div>
                {skin.name}
              </button>
            ))}
          </div>
          <button onClick={() => setSkinSelectFor(null)} style={{
            marginTop: 25, padding: '10px 35px', background: 'transparent',
            border: '2px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer',
            fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3, transition: 'all 0.3s',
          }}>CANCELAR</button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
      </div>
    );
  }

  const p1Char = engine.p1Choice !== null && engine.p1Choice < 100 ? CHAR_DATA[engine.p1Choice] : null;
  const p1Custom = engine.p1Choice !== null && engine.p1Choice >= 100 ? customChars[engine.p1Choice - 100] : null;
  const p2Char = isP2Turn && hoveredIdx !== null && hoveredIdx < 100 ? CHAR_DATA[hoveredIdx] : null;

  const p1Name = p1Custom ? p1Custom.name : (p1Char ? p1Char.name : (hoveredIdx !== null && !isP2Turn && hoveredIdx < 100 ? CHAR_DATA[hoveredIdx]?.name : '???'));
  const p1Color = p1Custom ? p1Custom.skinColor : (p1Char ? p1Char.color : (hoveredIdx !== null && !isP2Turn && hoveredIdx < 100 ? CHAR_DATA[hoveredIdx]?.color : '#222'));
  const p1Eyes = p1Custom ? p1Custom.eyesColor : (p1Char ? p1Char.eyes : (hoveredIdx !== null && !isP2Turn && hoveredIdx < 100 ? CHAR_DATA[hoveredIdx]?.eyes : '#555'));
  const p1Hair = p1Custom ? p1Custom.hairColor : (p1Char ? (engine.p1Choice === 0 ? '#5a3a1a' : '#fff') : '#333');

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)', animation: 'fadeIn 0.4s ease-out' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 25px', borderBottom: '2px solid rgba(0,255,255,0.3)', background: 'rgba(0,0,0,0.5)',
      }}>
        <div style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(12px, 2vw, 16px)', letterSpacing: 2, textShadow: '0 0 8px #00ffff' }}>P1</div>
        <div style={{ color: '#ffff00', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(16px, 3vw, 30px)', textShadow: '0 0 20px #ffff00', letterSpacing: 4, fontWeight: 900 }}>
          SELECCIÓN DE PERSONAJE
        </div>
        <div style={{ color: '#ff8c00', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(12px, 2vw, 16px)', letterSpacing: 2, textShadow: '0 0 8px #ff8c00' }}>P2</div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '10px 20px', minHeight: 0 }}>
        {/* P1 portrait */}
        <div style={{ width: 'clamp(90px, 18vw, 220px)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(14px, 2.5vw, 24px)', marginBottom: 15, textShadow: '0 0 15px #00ffff', fontWeight: 900, letterSpacing: 3 }}>
            {p1Name}
          </div>
          {p1Custom ? (
            <CustomPortrait ch={p1Custom} size={Math.min(window.innerWidth * 0.12, 130)} />
          ) : (
            <CharPortrait color={p1Color} eyes={p1Eyes} hairColor={p1Hair} size={Math.min(window.innerWidth * 0.12, 130)} />
          )}
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
                    <CharPortrait color={ch.color} eyes={ch.eyes} hairColor={i === 0 ? '#5a3a1a' : '#fff'} size={Math.min(window.innerWidth * 0.04, 45)} />
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
          <div style={{ color: '#ff8c00', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(14px, 2.5vw, 24px)', marginBottom: 15, textShadow: '0 0 15px #ff8c00', fontWeight: 900, letterSpacing: 3 }}>
            {p2Char ? p2Char.name : (isP2Turn ? '???' : '---')}
          </div>
          {p2Char ? (
            <CharPortrait color={p2Char.color} eyes={p2Char.eyes} hairColor={hoveredIdx === 0 ? '#5a3a1a' : '#fff'} size={Math.min(window.innerWidth * 0.12, 130)} />
          ) : (
            <div style={{
              width: 'clamp(70px, 13vw, 130px)', height: 'clamp(70px, 13vw, 130px)', borderRadius: '50%',
              background: '#222', border: '4px solid #555', transition: 'all 0.3s',
            }} />
          )}
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
          transition: 'all 0.3s',
        }}>VOLVER</button>
        <div style={{ color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(8px, 1.1vw, 11px)', letterSpacing: 1, textAlign: 'right' }}>
          2P: ↑↓←→ + [
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default CharacterSelect;