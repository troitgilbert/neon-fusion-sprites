import React from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA, SHOP_CATALOG } from '../game/constants';

const CharacterSelect: React.FC = () => {
  const { engine, setGameState } = useGame();
  const [skinSelectFor, setSkinSelectFor] = React.useState<{ charIdx: number; pNum: number } | null>(null);

  const isP2Turn = engine.p1Choice !== null && (engine.mode === 'versus' || engine.mode === 'vs_cpu') && engine.p2Choice === null;
  const title = engine.mode === 'survival' ? 'ELIGE TU GUERRERO' : isP2Turn ? 'P2: ELIGE PERSONAJE' : 'P1: ELIGE PERSONAJE';

  const handleSelect = (idx: number) => {
    const pNum = engine.p1Choice === null ? 1 : 2;
    setSkinSelectFor({ charIdx: idx, pNum });
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

  const btnStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.1), transparent)',
    border: '1px solid #87ceeb', color: '#87ceeb', padding: 12, margin: 6,
    cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 2,
    fontFamily: "'Orbitron', monospace", ...extra
  });

  if (skinSelectFor) {
    const skins = availableSkins(skinSelectFor.charIdx);
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
        <div style={{
          border: '2px solid #87ceeb', boxShadow: '0 0 20px rgba(0,255,255,.4), inset 0 0 20px rgba(0,255,255,.1)',
          background: 'rgba(10,10,20,0.95)', padding: 25, textAlign: 'center', transform: 'skew(-2deg)'
        }}>
          <h2 style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff', marginBottom: 15 }}>
            ELIGE ESTILO P{skinSelectFor.pNum}: {CHAR_DATA[skinSelectFor.charIdx].name}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {skins.map(skin => (
              <button
                key={skin.id || 'original'}
                onClick={() => handleSkinConfirm(skin.id)}
                style={{
                  border: '1px solid #555', background: 'rgba(0,0,0,0.5)', padding: 10,
                  cursor: 'pointer', color: '#87ceeb', fontFamily: "'Orbitron', monospace"
                }}
              >
                <div style={{
                  width: 50, height: 50, margin: '0 auto 5px', borderRadius: '50%',
                  border: '2px solid white',
                  background: skin.id === 'demonioBlanco' || skin.id === 'demonioBlanco2' ? '#000' : '#333'
                }} />
                {skin.name}
              </button>
            ))}
          </div>
          <button onClick={() => setSkinSelectFor(null)} style={btnStyle({ width: '100%', marginTop: 20 })}>CANCELAR</button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
      <div style={{
        border: '2px solid #87ceeb', boxShadow: '0 0 20px rgba(0,255,255,.4), inset 0 0 20px rgba(0,255,255,.1)',
        background: 'rgba(10,10,20,0.95)', padding: 25, textAlign: 'center', transform: 'skew(-2deg)'
      }}>
        <h2 style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff', marginBottom: 15 }}>{title}</h2>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          {CHAR_DATA.map((ch, i) => (
            <button key={ch.name} onClick={() => handleSelect(i)} style={{
              ...btnStyle({ width: 140, height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' })
            }}>
              <div style={{
                width: 80, height: 80, background: ch.color, borderRadius: '50%', marginBottom: 10,
                border: `2px solid ${ch.eyes}`
              }} />
              {ch.name}
            </button>
          ))}
        </div>
        <button onClick={() => setGameState('MENU')} style={btnStyle({ width: '100%', marginTop: 20 })}>VOLVER</button>
      </div>
    </div>
  );
};

export default CharacterSelect;
