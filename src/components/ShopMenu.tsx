import React, { useState, useRef, useEffect, useCallback } from 'react';
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

/* Animated galaxy background canvas */
const GalaxyBg: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const starsRef = useRef<{ x: number; y: number; r: number; s: number; b: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Generate stars once
    const stars: typeof starsRef.current = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random(), y: Math.random(),
        r: Math.random() * 1.8 + 0.3,
        s: Math.random() * 0.02 + 0.005,
        b: Math.random() * 0.7 + 0.3,
      });
    }
    starsRef.current = stars;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.parentElement?.clientWidth || 800;
    const H = canvas.parentElement?.clientHeight || 600;
    canvas.width = W; canvas.height = H;

    const t = Date.now() * 0.001;

    // Deep blue-black gradient background
    const bg = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0a1628');
    bg.addColorStop(0.4, '#050d1a');
    bg.addColorStop(1, '#020408');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Blue nebula clouds
    const drawNebula = (cx: number, cy: number, radius: number, color: string, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      g.addColorStop(0, color);
      g.addColorStop(0.5, color + '40');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    drawNebula(W * 0.2, H * 0.3, W * 0.35, '#1a3a6a', 0.25 + Math.sin(t * 0.3) * 0.05);
    drawNebula(W * 0.8, H * 0.6, W * 0.3, '#0d2a5a', 0.2 + Math.sin(t * 0.4 + 1) * 0.05);
    drawNebula(W * 0.5, H * 0.15, W * 0.25, '#2a4a8a', 0.15 + Math.sin(t * 0.5 + 2) * 0.04);
    drawNebula(W * 0.7, H * 0.85, W * 0.2, '#152a55', 0.2);

    // Stars
    starsRef.current.forEach(star => {
      const flicker = Math.sin(t * star.s * 100 + star.x * 100) * 0.3 + 0.7;
      ctx.globalAlpha = star.b * flicker;
      ctx.fillStyle = '#aaccff';
      ctx.beginPath();
      ctx.arc(star.x * W, star.y * H, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Subtle horizontal light streaks
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 3; i++) {
      const sy = H * (0.2 + i * 0.3) + Math.sin(t * 0.2 + i) * 20;
      const sg = ctx.createLinearGradient(0, sy, W, sy);
      sg.addColorStop(0, 'transparent');
      sg.addColorStop(0.3, '#4488cc');
      sg.addColorStop(0.7, '#4488cc');
      sg.addColorStop(1, 'transparent');
      ctx.fillStyle = sg;
      ctx.fillRect(0, sy - 15, W, 30);
    }
    ctx.restore();

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ overflow: 'hidden' }}>
      {/* Animated galaxy background */}
      <GalaxyBg />

      {/* Frosted overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,8,20,0.5)', backdropFilter: 'blur(4px)' }} />

      {/* Main panel */}
      <div style={{
        position: 'relative', zIndex: 2,
        border: '1px solid rgba(100,180,255,0.25)',
        borderTop: '2px solid rgba(100,180,255,0.5)',
        boxShadow: '0 0 60px rgba(30,100,200,0.15), inset 0 1px 0 rgba(100,180,255,0.1)',
        background: 'linear-gradient(180deg, rgba(8,16,35,0.92), rgba(4,10,25,0.96))',
        padding: 'clamp(20px, 4vw, 40px)', textAlign: 'center',
        width: 'clamp(400px, 75vw, 850px)', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        animation: 'shopSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        borderRadius: 2,
      }}>
        {/* Title */}
        <h2 style={{
          marginBottom: 8,
          fontFamily: "'Orbitron', monospace",
          fontSize: 'clamp(22px, 4vw, 38px)',
          fontWeight: 900,
          letterSpacing: 8,
          background: 'linear-gradient(180deg, #e8f4ff 0%, #7ab8ff 40%, #3a80cc 70%, #2060aa 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 12px rgba(80,160,255,0.6)) drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
        }}>
          TIENDA GALÁCTICA
        </h2>

        {/* Decorative line under title */}
        <div style={{
          width: '60%', height: 2, margin: '0 auto 14px',
          background: 'linear-gradient(90deg, transparent, rgba(100,180,255,0.5), transparent)',
          boxShadow: '0 0 10px rgba(80,160,255,0.3)',
        }} />

        {/* Crystals display */}
        <div style={{
          marginBottom: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '6px 24px', margin: '0 auto 16px',
          background: 'rgba(30,80,150,0.15)', border: '1px solid rgba(80,160,255,0.2)', borderRadius: 20,
        }}>
          <span style={{ fontSize: 'clamp(16px, 2vw, 20px)' }}>🔷</span>
          <span style={{
            fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: 'clamp(18px, 2.5vw, 26px)',
            background: 'linear-gradient(180deg, #b0d8ff, #5a9ae0)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 6px rgba(80,160,255,0.4))',
          }}>{coins}</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, justifyContent: 'center' }}>
          {(['skins', 'stages'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setSelectedChar(null); }} style={{
              padding: '10px 28px',
              border: 'none',
              borderBottom: tab === t ? '2px solid #6ab4ff' : '2px solid transparent',
              cursor: 'pointer',
              background: tab === t ? 'rgba(40,100,200,0.15)' : 'transparent',
              color: tab === t ? '#a0d0ff' : '#4a6a8a',
              fontFamily: "'Orbitron', monospace",
              fontSize: 'clamp(11px, 1.5vw, 14px)',
              fontWeight: tab === t ? 800 : 500,
              letterSpacing: 3,
              transition: 'all 0.3s',
            }}>
              {t === 'skins' ? 'SKINS' : 'ESCENARIOS'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1, minHeight: 250, maxHeight: 450, overflowY: 'auto',
          background: 'rgba(4,10,25,0.5)',
          padding: 18,
          border: '1px solid rgba(60,120,200,0.08)',
        }}>
          {tab === 'skins' && !selectedChar && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
              {CHAR_DATA.map(ch => (
                <div
                  key={ch.name}
                  onClick={() => setSelectedChar(ch.name)}
                  style={{
                    background: 'linear-gradient(180deg, rgba(15,25,50,0.9), rgba(8,15,35,0.95))',
                    border: '1px solid rgba(80,150,255,0.15)',
                    padding: 18, textAlign: 'center', cursor: 'pointer',
                    fontFamily: "'Orbitron', monospace", fontSize: 12,
                    transition: 'all 0.35s', letterSpacing: 3,
                    color: '#8ab8e8',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(100,180,255,0.5)';
                    e.currentTarget.style.boxShadow = '0 0 25px rgba(60,140,255,0.2), inset 0 0 20px rgba(60,140,255,0.05)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(80,150,255,0.15)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <SkinPreview colors={SKIN_COLORS[ch.name]?.['_base'] || { skin: ch.color, clothes: '#888', pants: '#333', hair: '#444', eyes: ch.eyes, hands: '#ddd' }} size={75} />
                  <div style={{ marginTop: 8, fontWeight: 700 }}>{ch.name}</div>
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
                        background: 'linear-gradient(135deg, rgba(10,20,40,0.9), rgba(6,14,30,0.95))',
                        border: `1px solid ${isOwned ? 'rgba(0,200,100,0.2)' : 'rgba(80,150,255,0.12)'}`,
                        padding: '14px 22px',
                        cursor: isOwned ? 'default' : 'pointer',
                        fontFamily: "'Orbitron', monospace",
                        transition: 'all 0.35s',
                      }}
                      onMouseEnter={e => {
                        if (!isOwned) {
                          e.currentTarget.style.borderColor = 'rgba(100,180,255,0.45)';
                          e.currentTarget.style.boxShadow = '0 0 30px rgba(60,140,255,0.15), inset 0 0 15px rgba(60,140,255,0.03)';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = isOwned ? 'rgba(0,200,100,0.2)' : 'rgba(80,150,255,0.12)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {/* Character preview */}
                      <div style={{
                        flexShrink: 0,
                        background: 'radial-gradient(circle, rgba(30,60,120,0.3), transparent)',
                        border: '1px solid rgba(80,150,255,0.1)',
                        padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 4,
                      }}>
                        {skinColors ? (
                          <SkinPreview colors={skinColors} size={90} />
                        ) : (
                          <div style={{ width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a5a7a', fontSize: 30 }}>?</div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{
                          fontSize: 16, letterSpacing: 2, marginBottom: 6, fontWeight: 800,
                          background: 'linear-gradient(180deg, #ddeeff, #8ab8e8)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>{item.name}</div>
                        <div style={{ fontSize: 10, color: '#4a7aaa', marginBottom: 10, letterSpacing: 2, fontWeight: 500 }}>{selectedChar} • SKIN ESPECIAL</div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 16px',
                          background: isOwned ? 'rgba(0,200,100,0.08)' : 'rgba(60,140,255,0.08)',
                          border: `1px solid ${isOwned ? 'rgba(0,200,100,0.2)' : 'rgba(80,160,255,0.2)'}`,
                          borderRadius: 16,
                          color: isOwned ? '#66ddaa' : '#7ab8ff',
                          fontWeight: 700, fontSize: 13, letterSpacing: 1,
                        }}>
                          {isOwned ? '✔ COMPRADO' : `🔷 ${item.cost}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setSelectedChar(null)} style={{
                marginTop: 18, padding: '10px 30px', background: 'rgba(30,60,120,0.15)',
                border: '1px solid rgba(100,180,255,0.25)',
                color: '#7ab8ff', cursor: 'pointer', fontFamily: "'Orbitron', monospace",
                fontSize: 12, letterSpacing: 3, fontWeight: 600,
                transition: 'all 0.3s', borderRadius: 2,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(40,80,160,0.25)'; e.currentTarget.style.borderColor = 'rgba(100,180,255,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30,60,120,0.15)'; e.currentTarget.style.borderColor = 'rgba(100,180,255,0.25)'; }}
              >ATRÁS</button>
            </div>
          )}

          {tab === 'stages' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
              <div style={{
                background: 'linear-gradient(180deg, rgba(10,20,40,0.9), rgba(4,10,25,0.95))',
                border: `1px solid ${engine.inventory?.stages?.nada ? 'rgba(0,200,100,0.2)' : 'rgba(80,150,255,0.12)'}`,
                padding: 18, textAlign: 'center',
                cursor: engine.inventory?.stages?.nada ? 'default' : 'pointer',
                fontFamily: "'Orbitron', monospace",
                transition: 'all 0.35s',
              }} onClick={() => !engine.inventory?.stages?.nada && buyStage()}
              onMouseEnter={e => { if (!engine.inventory?.stages?.nada) { e.currentTarget.style.borderColor = 'rgba(100,180,255,0.45)'; e.currentTarget.style.boxShadow = '0 0 25px rgba(60,140,255,0.15)'; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = engine.inventory?.stages?.nada ? 'rgba(0,200,100,0.2)' : 'rgba(80,150,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  width: '100%', height: 75, marginBottom: 10,
                  background: 'linear-gradient(180deg, #050810, #000)',
                  border: '1px solid rgba(60,100,180,0.1)',
                  boxShadow: 'inset 0 0 30px rgba(30,60,120,0.1)',
                }} />
                <div style={{
                  fontWeight: 800, fontSize: 14, letterSpacing: 3, marginBottom: 6,
                  color: '#8ab8e8',
                }}>La Nada</div>
                <div style={{
                  color: engine.inventory?.stages?.nada ? '#66ddaa' : '#7ab8ff',
                  fontWeight: 700, fontSize: 13,
                }}>
                  {engine.inventory?.stages?.nada ? '✔ COMPRADO' : '🔷 100'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back button */}
        <button onClick={() => setGameState('MENU')} style={{
          marginTop: 18, padding: '12px 45px',
          background: 'rgba(200,40,40,0.08)',
          border: '1px solid rgba(255,80,80,0.3)',
          color: '#ff7070', cursor: 'pointer',
          fontFamily: "'Orbitron', monospace",
          fontSize: 14, fontWeight: 700, letterSpacing: 4,
          transition: 'all 0.3s', borderRadius: 2,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,40,40,0.2)'; e.currentTarget.style.borderColor = 'rgba(255,80,80,0.6)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(255,60,60,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,40,40,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,80,80,0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
        >VOLVER</button>
      </div>

      <style>{`
        @keyframes shopSlideIn {
          from { transform: translateY(20px) scale(0.97); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ShopMenu;
