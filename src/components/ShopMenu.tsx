import React, { useState } from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA, SHOP_CATALOG } from '../game/constants';

const ShopMenu: React.FC = () => {
  const { engine, coins, setGameState } = useGame();
  const [tab, setTab] = useState<'skins' | 'stages'>('skins');
  const [selectedChar, setSelectedChar] = useState<string | null>(null);

  const btnStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.1), transparent)',
    border: '1px solid #87ceeb', color: '#87ceeb', padding: 12, margin: 6,
    cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 2,
    fontFamily: "'Orbitron', monospace", width: '100%',
  };

  const buySkin = (charName: string, item: typeof SHOP_CATALOG['KAITO'][0]) => {
    if (coins < item.cost) return;
    engine.updatePrisms(-item.cost);
    const k = charName.toLowerCase();
    engine.inventory[k] = engine.inventory[k] || {};
    engine.inventory[k][item.id] = true;
    engine.saveInv();
    setSelectedChar(charName); // force re-render
  };

  const buyStage = () => {
    if (coins < 100) return;
    engine.updatePrisms(-100);
    engine.inventory.stages = engine.inventory.stages || {};
    engine.inventory.stages.nada = true;
    engine.saveInv();
    setTab('stages'); // re-render
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
      <div style={{
        border: '2px solid #87ceeb', boxShadow: '0 0 20px rgba(0,255,255,.4)',
        background: 'rgba(10,10,20,0.95)', padding: 25, textAlign: 'center', transform: 'skew(-2deg)',
        minWidth: 450,
      }}>
        <h2 style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff', marginBottom: 15 }}>TIENDA GALÁCTICA</h2>
        <div style={{ marginBottom: 10, color: '#00ffff', fontSize: 20, fontWeight: 'bold' }}>🔷 {coins}</div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 15, justifyContent: 'center' }}>
          {(['skins', 'stages'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setSelectedChar(null); }} style={{
              padding: '8px 15px', border: '1px solid #87ceeb', cursor: 'pointer',
              background: tab === t ? '#87ceeb' : 'rgba(0,0,0,0.5)',
              color: tab === t ? '#000' : '#87ceeb',
              boxShadow: tab === t ? '0 0 15px #87ceeb' : 'none',
              fontFamily: "'Orbitron', monospace",
            }}>
              {t === 'skins' ? 'Skins' : 'Escenarios'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ minHeight: 200, maxHeight: 300, overflowY: 'auto', background: 'rgba(0,0,0,0.4)', padding: 10 }}>
          {tab === 'skins' && !selectedChar && CHAR_DATA.map(ch => (
            <div
              key={ch.name}
              onClick={() => setSelectedChar(ch.name)}
              style={{
                display: 'inline-block', verticalAlign: 'top',
                background: 'rgba(0,0,0,0.7)', border: `1px solid ${ch.color}`,
                padding: 10, margin: 5, width: 110, textAlign: 'center', cursor: 'pointer',
                color: ch.color, fontFamily: "'Orbitron', monospace",
              }}
            >
              <div style={{ width: 50, height: 50, borderRadius: '50%', border: `2px solid ${ch.color}`, margin: '0 auto 5px', background: '#333' }} />
              {ch.name}
            </div>
          ))}

          {tab === 'skins' && selectedChar && (
            <>
              {(SHOP_CATALOG[selectedChar] || []).map(item => {
                const inv = engine.inventory[selectedChar.toLowerCase()] || {};
                const isOwned = inv[item.id] === true;
                return (
                  <div
                    key={item.id}
                    onClick={() => !isOwned && buySkin(selectedChar, item)}
                    style={{
                      display: 'inline-block', verticalAlign: 'top',
                      background: 'rgba(0,0,0,0.7)', border: '1px solid #444',
                      padding: 10, margin: 5, width: 110, textAlign: 'center',
                      cursor: isOwned ? 'default' : 'pointer',
                      color: '#87ceeb', fontFamily: "'Orbitron', monospace",
                    }}
                  >
                    <div style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid white', margin: '0 auto 5px', background: '#000' }} />
                    <div style={{ fontSize: 11 }}>{item.name}</div>
                    <div style={{ color: isOwned ? '#0f0' : '#fff' }}>{isOwned ? '✔' : `💎 ${item.cost}`}</div>
                  </div>
                );
              })}
              <button onClick={() => setSelectedChar(null)} style={btnStyle}>ATRÁS</button>
            </>
          )}

          {tab === 'stages' && (
            <div style={{
              display: 'inline-block', background: 'rgba(0,0,0,0.7)', border: '1px solid #444',
              padding: 10, margin: 5, width: 110, textAlign: 'center',
              cursor: engine.inventory?.stages?.nada ? 'default' : 'pointer',
              color: '#87ceeb', fontFamily: "'Orbitron', monospace",
            }} onClick={() => !engine.inventory?.stages?.nada && buyStage()}>
              <div style={{ width: '100%', height: 60, border: '1px solid white', marginBottom: 5, background: '#000' }} />
              <div style={{ fontWeight: 'bold' }}>La Nada</div>
              <div>{engine.inventory?.stages?.nada ? '✔' : '💎 100'}</div>
            </div>
          )}
        </div>

        <button onClick={() => setGameState('MENU')} style={btnStyle}>Volver</button>
      </div>
    </div>
  );
};

export default ShopMenu;
