import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA, SHOP_CATALOG } from '../game/constants';

/* Color definitions per skin for canvas preview */
const SKIN_COLORS: Record<string, Record<string, { skin: string; clothes: string; pants: string; hair: string; eyes: string; hands: string }>> = {
  'KAITO': {
    '_base': { skin: '#f5d1ad', clothes: '#ffffff', pants: '#000000', hair: '#ffffff', eyes: '#ffff00', hands: '#f5c6a0' },
    'demonioBlanco': { skin: '#000000', clothes: '#1a1a1a', pants: '#000000', hair: '#ffffff', eyes: '#ffff00', hands: '#000000' },
    'demonioBlanco2': { skin: '#f5d1ad', clothes: '#1a1a1a', pants: '#000000', hair: '#ffffff', eyes: '#ffff00', hands: '#444444' },
  },
  'EDOWADO': {
    '_base': { skin: '#f5deb3', clothes: '#b00000', pants: '#000000', hair: '#5a3a1a', eyes: '#00ffff', hands: '#d4af37' },
  },
};

/* Mini canvas that draws the character chibi with skin colors */
const SkinPreview: React.FC<{ colors: typeof SKIN_COLORS['KAITO']['_base']; size?: number }> = ({ colors, size = 100 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = size * 2, H = size * 2;
    canvas.width = W; canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2, cy = H * 0.42;
    const r = W * 0.22;

    // Aura glow
    const aura = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.8);
    aura.addColorStop(0, colors.eyes + '30');
    aura.addColorStop(1, 'transparent');
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2); ctx.fill();

    // Body (skin)
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = colors.skin; ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();

    // Clothes band
    ctx.beginPath(); (ctx as any).roundRect(cx - r, cy, r * 2, r * 0.44, 0);
    ctx.fillStyle = colors.clothes; ctx.fill(); ctx.stroke();

    // Pants
    ctx.save(); ctx.translate(cx, cy + r * 0.44); ctx.scale(1, 0.6);
    ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, Math.PI);
    ctx.fillStyle = colors.pants; ctx.fill(); ctx.stroke(); ctx.restore();

    // Hair
    ctx.save(); ctx.translate(cx, cy - r * 0.4); ctx.scale(1, 0.7);
    ctx.beginPath(); ctx.arc(0, 0, r * 0.88, Math.PI, 0);
    ctx.fillStyle = colors.hair; ctx.fill(); ctx.stroke(); ctx.restore();

    // Eyes
    ctx.fillStyle = colors.eyes;
    const eyeR = r * 0.12;
    const eyeY = cy - r * 0.24;
    const eyeSpacing = r * 0.16;
    const eyeCenterX = cx + r * 0.24;
    ctx.beginPath(); ctx.arc(eyeCenterX - eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeCenterX + eyeSpacing, eyeY, eyeR, 0, Math.PI * 2); ctx.stroke(); ctx.fill();

    // Hands
    ctx.fillStyle = colors.hands;
    const handY = cy + r * 0.32;
    ctx.beginPath(); ctx.arc(cx - r * 0.9, handY, r * 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + r * 0.9, handY, r * 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Feet
    ctx.fillStyle = '#222222';
    const footY = cy + r * 0.95;
    ctx.beginPath(); ctx.arc(cx - r * 0.35, footY, r * 0.18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + r * 0.35, footY, r * 0.18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }, [colors, size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size, imageRendering: 'pixelated' }} />;
};

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
        width: 'clamp(400px, 75vw, 850px)', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
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
        <div style={{ flex: 1, minHeight: 250, maxHeight: 450, overflowY: 'auto', background: 'rgba(0,0,0,0.4)', padding: 15, border: '1px solid rgba(0,255,255,0.1)' }}>
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
                  <SkinPreview colors={SKIN_COLORS[ch.name]?.['_base'] || { skin: ch.color, clothes: '#888', pants: '#333', hair: '#444', eyes: ch.eyes, hands: '#ddd' }} size={70} />
                  <div style={{ marginTop: 6 }}>{ch.name}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'skins' && selectedChar && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(SHOP_CATALOG[selectedChar] || []).map(item => {
                  const inv = engine.inventory[selectedChar.toLowerCase()] || {};
                  const isOwned = inv[item.id] === true;
                  const skinColors = SKIN_COLORS[selectedChar]?.[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => !isOwned && buySkin(selectedChar, item)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 20,
                        background: 'rgba(10,10,30,0.9)',
                        border: `2px solid ${isOwned ? '#00ff6640' : '#87ceeb30'}`,
                        padding: '12px 20px',
                        cursor: isOwned ? 'default' : 'pointer',
                        color: '#87ceeb', fontFamily: "'Orbitron', monospace",
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={e => { if (!isOwned) { e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,255,0.3)'; } }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = isOwned ? '#00ff6640' : '#87ceeb30'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      {/* Character preview */}
                      <div style={{ flexShrink: 0, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,255,0.15)', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {skinColors ? (
                          <SkinPreview colors={skinColors} size={90} />
                        ) : (
                          <div style={{ width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 30 }}>?</div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: 15, letterSpacing: 2, marginBottom: 6, color: '#ffffff', fontWeight: 'bold' }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#87ceebaa', marginBottom: 8, letterSpacing: 1 }}>{selectedChar}</div>
                        <div style={{
                          display: 'inline-block', padding: '4px 14px',
                          background: isOwned ? 'rgba(0,255,102,0.1)' : 'rgba(255,204,0,0.1)',
                          border: `1px solid ${isOwned ? '#00ff6640' : '#ffcc0040'}`,
                          color: isOwned ? '#00ff66' : '#ffcc00',
                          fontWeight: 'bold', fontSize: 13, letterSpacing: 1,
                        }}>
                          {isOwned ? '✔ COMPRADO' : `🔷 ${item.cost}`}
                        </div>
                      </div>
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
