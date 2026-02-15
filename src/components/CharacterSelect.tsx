import React from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA, SHOP_CATALOG } from '../game/constants';

const CharacterSelect: React.FC = () => {
  const { engine, setGameState } = useGame();
  const [skinSelectFor, setSkinSelectFor] = React.useState<{ charIdx: number; pNum: number } | null>(null);

  const isP2Turn = engine.p1Choice !== null && (engine.mode === 'versus' || engine.mode === 'vs_cpu') && engine.p2Choice === null;
  const title = engine.mode === 'survival' ? 'ELIGE TU GUERRERO' : isP2Turn ? 'P2: ELIGE PERSONAJE' : 'P1: ELIGE PERSONAJE';

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

  if (skinSelectFor) {
    const skins = availableSkins(skinSelectFor.charIdx);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 600, width: '90%', textAlign: 'center' }}>
          <h2 style={{
            color: '#00ffff', fontSize: 'clamp(24px, 4vw, 40px)',
            textShadow: '0 0 20px #00ffff, 0 0 40px rgba(0,255,255,0.3)',
            marginBottom: 30, fontFamily: "'Orbitron', monospace", letterSpacing: 4
          }}>
            ELIGE ESTILO P{skinSelectFor.pNum}: {CHAR_DATA[skinSelectFor.charIdx].name}
          </h2>
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <h2 style={{
        color: '#00ffff', fontSize: 'clamp(28px, 5vw, 48px)',
        textShadow: '0 0 20px #00ffff, 0 0 40px rgba(0,255,255,0.3)',
        marginBottom: 50, fontFamily: "'Orbitron', monospace", letterSpacing: 6
      }}>
        {title}
      </h2>

      <div style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
        {CHAR_DATA.map((ch, i) => (
          <button
            key={ch.name}
            onClick={() => handleSelect(i)}
            style={{
              width: 200, height: 260, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              background: 'rgba(10,10,30,0.8)', border: '2px solid rgba(0,255,255,0.3)',
              color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 18,
              letterSpacing: 3, transition: 'all 0.3s',
              boxShadow: '0 0 20px rgba(0,255,255,0.1)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(0,255,255,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,255,255,0.3)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,255,0.1)'; }}
          >
            <div style={{
              width: 100, height: 100, background: ch.color, borderRadius: '50%', marginBottom: 20,
              border: `3px solid ${ch.eyes}`, boxShadow: `0 0 25px ${ch.eyes}40`
            }} />
            {ch.name}
          </button>
        ))}
      </div>

      <button
        onClick={() => setGameState('MENU')}
        style={{
          marginTop: 50, padding: '12px 40px', background: 'transparent',
          border: '2px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer',
          fontFamily: "'Orbitron', monospace", fontSize: 16, letterSpacing: 3,
        }}
      >
        VOLVER
      </button>
    </div>
  );
};

export default CharacterSelect;
