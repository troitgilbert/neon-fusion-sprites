import React, { useState } from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA, SHOP_CATALOG } from '../game/constants';

const ShopMenu: React.FC = () => {
  const { engine, coins, setGameState } = useGame();
  const [tab, setTab] = useState<'skins' | 'stages'>('skins');
  const [selectedChar, setSelectedChar] = useState<string | null>(null);

  const buySkin = (charName: string, item: typeof SHOP_CATALOG['KAITO'][0]) => {
    if (coins < item.cost) return;
    engine.updatePrisms(-item.cost);
    const k = charName.toLowerCase();
    engine.inventory[k] = engine.inventory[k] || {};
    engine.inventory[k][item.id] = true;
    engine.saveInv();
    setSelectedChar(charName);
  };

  const buyStage = () => {
    if (coins < 100) return;
    engine.updatePrisms(-100);
    engine.inventory.stages = engine.inventory.stages || {};
    engine.inventory.stages.nada = true;
    engine.saveInv();
    setTab('stages');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}>
      <div style={{
        border: '2px solid rgba(0,255,255,0.5)', boxShadow: '0 0 40px rgba(0,255,255,.3), inset 0 0 30px rgba(0,255,255,.05)',
        background: 'linear-gradient(135deg, rgba(10,10,30,0.98), rgba(20,10,40,0.98))',
        padding: 'clamp(20px, 4vw, 40px)', textAlign: 'center',
        width: 'clamp(400px, 70vw, 750px)', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        animation: 'scaleIn 0.3s ease-out',
      }}>
        <h2 style={{ color: '#00ffff', textShadow: '0 0 20px #00ffff', marginBottom: 15, fontFamily: "'Orbitron', monospace", fontSize: 'clamp(20px, 3.5vw, 32px)', letterSpacing: 4 }}>
          TIENDA GALÁCTICA
        </h2>
        <div style={{ marginBottom: 12, color: '#00ffff', fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 'bold', fontFamily: "'Orbitron', monospace" }}>🔷 {coins}</div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 15, justifyContent: 'center' }}>
          {(['skins', 'stages'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setSelectedChar(null); }} style={{
              padding: '10px 25px', border: `2px solid ${tab === t ? '#00ffff' : '#87ceeb40'}`, cursor: 'pointer',
              background: tab === t ? 'rgba(0,255,255,0.15)' : 'rgba(10,10,30,0.8)',
              color: tab === t ? '#00ffff' : '#87ceeb',
              boxShadow: tab === t ? '0 0 15px rgba(0,255,255,0.3)' : 'none',
              fontFamily: "'Orbitron', monospace", fontSize: 'clamp(11px, 1.5vw, 14px)', letterSpacing: 2,
              transition: 'all 0.3s',
            }}>
              {t === 'skins' ? 'SKINS' : 'ESCENARIOS'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minHeight: 250, maxHeight: 400, overflowY: 'auto', background: 'rgba(0,0,0,0.4)', padding: 15, border: '1px solid rgba(0,255,255,0.1)' }}>
          {tab === 'skins' && !selectedChar && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
              {CHAR_DATA.map(ch => (
                <div
                  key={ch.name}
                  onClick={() => setSelectedChar(ch.name)}
                  style={{
                    background: 'rgba(10,10,30,0.9)', border: `2px solid ${ch.eyes}30`,
                    padding: 15, textAlign: 'center', cursor: 'pointer',
                    color: ch.eyes, fontFamily: "'Orbitron', monospace", fontSize: 12,
                    transition: 'all 0.3s', letterSpacing: 2,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = ch.eyes; e.currentTarget.style.boxShadow = `0 0 20px ${ch.eyes}40`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${ch.eyes}30`; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ width: 60, height: 60, borderRadius: '50%', border: `3px solid ${ch.eyes}`, margin: '0 auto 8px', background: ch.color, boxShadow: `0 0 15px ${ch.eyes}30` }} />
                  {ch.name}
                </div>
              ))}
            </div>
          )}

          {tab === 'skins' && selectedChar && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                {(SHOP_CATALOG[selectedChar] || []).map(item => {
                  const inv = engine.inventory[selectedChar.toLowerCase()] || {};
                  const isOwned = inv[item.id] === true;
                  return (
                    <div
                      key={item.id}
                      onClick={() => !isOwned && buySkin(selectedChar, item)}
                      style={{
                        background: 'rgba(10,10,30,0.9)', border: `2px solid ${isOwned ? '#00ff6640' : '#87ceeb30'}`,
                        padding: 15, textAlign: 'center',
                        cursor: isOwned ? 'default' : 'pointer',
                        color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 11,
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={e => { if (!isOwned) { e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,255,0.3)'; } }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = isOwned ? '#00ff6640' : '#87ceeb30'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ width: 55, height: 55, borderRadius: '50%', border: '3px solid #87ceeb', margin: '0 auto 8px', background: '#000', boxShadow: '0 0 12px rgba(0,255,255,0.2)' }} />
                      <div style={{ fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>{item.name}</div>
                      <div style={{ color: isOwned ? '#00ff66' : '#ffcc00', fontWeight: 'bold' }}>{isOwned ? '✔ COMPRADO' : `🔷 ${item.cost}`}</div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setSelectedChar(null)} style={{
                marginTop: 15, padding: '10px 30px', background: 'transparent', border: '2px solid #87ceeb',
                color: '#87ceeb', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2,
                transition: 'all 0.3s',
              }}>ATRÁS</button>
            </div>
          )}

          {tab === 'stages' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              <div style={{
                background: 'rgba(10,10,30,0.9)', border: `2px solid ${engine.inventory?.stages?.nada ? '#00ff6640' : '#87ceeb30'}`,
                padding: 15, textAlign: 'center',
                cursor: engine.inventory?.stages?.nada ? 'default' : 'pointer',
                color: '#87ceeb', fontFamily: "'Orbitron', monospace",
                transition: 'all 0.3s',
              }} onClick={() => !engine.inventory?.stages?.nada && buyStage()}>
                <div style={{ width: '100%', height: 70, border: '1px solid #333', marginBottom: 8, background: '#000', boxShadow: 'inset 0 0 20px rgba(255,255,255,0.03)' }} />
                <div style={{ fontWeight: 'bold', fontSize: 13, letterSpacing: 2, marginBottom: 4 }}>La Nada</div>
                <div style={{ color: engine.inventory?.stages?.nada ? '#00ff66' : '#ffcc00' }}>
                  {engine.inventory?.stages?.nada ? '✔ COMPRADO' : '🔷 100'}
                </div>
              </div>
            </div>
          )}
        </div>

        <button onClick={() => setGameState('MENU')} style={{
          marginTop: 15, padding: '12px 40px', background: 'transparent', border: '2px solid #ff4d4d',
          color: '#ff4d4d', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
          transition: 'all 0.3s',
        }}>VOLVER</button>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ShopMenu;