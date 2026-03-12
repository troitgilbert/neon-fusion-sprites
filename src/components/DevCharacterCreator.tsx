import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../game/GameContext';
import type { DevCharData, DevSkinData, DevAttackConfig } from '../game/types';
import { DEV_ATTACK_OPTIONS } from '../game/types';
import { playSelectSound, playConfirmSound } from '../game/audio';

const COLORS = [
  '#ff0000','#ff4400','#ff8800','#ffbb00','#ffff00','#aaff00',
  '#00ff00','#00ff88','#00ffcc','#00ffff','#0088ff','#0044ff',
  '#0000ff','#4400ff','#8800ff','#cc00ff','#ff00ff','#ff0088',
  '#ffffff','#dddddd','#bbbbbb','#888888','#555555','#333333',
  '#000000','#5a3a1a','#8B4513','#D2691E','#f5deb3','#f5d1ad',
  '#d4af37','#ffd700','#ff4d4d','#1a1a2e','#16213e','#0f3460',
];

const SPEEDS = [
  { label: 'LENTO', value: 'lento' as const },
  { label: 'NORMAL', value: 'normal' as const },
  { label: 'RÁPIDO', value: 'rapido' as const },
  { label: 'VELOCISTA', value: 'velocista' as const },
];

const SIZES = [
  { label: 'PEQUEÑO', value: 'pequeño' as const },
  { label: 'NORMAL', value: 'normal' as const },
  { label: 'GRANDE', value: 'grande' as const },
];

const defaultAttacks: DevAttackConfig = {
  forwardHit: 'hook_forward',
  upHit: 'uppercut',
  downHit: 'hook_down',
  airDownHit: 'temblor',
  airForwardHit: 'air_hook_down',
  forwardSpecial: 'crystal_invocation',
  downSpecial: 'crystal_bounce_shot',
  upSpecial: 'crystal_curve_shot',
  airDownSpecial: 'crystal_descend',
  airForwardSpecial: 'crystal_impact',
  basicSpecial: 'cristal',
  downSuper: 'super_impulso',
  upSuper: 'super_cohete',
  forwardSuper: 'super_atraccion',
  airDownSuper: 'super_presion',
  airForwardSuper: 'super_agarre',
  basicSuper: 'impacto_rojo',
  ultra: 'persecucion_blanca',
};

const defaultDevChar: DevCharData = {
  name: '',
  hairColor: '#5a3a1a',
  skinColor: '#f5deb3',
  clothesColor: '#0088ff',
  pantsColor: '#222222',
  handsColor: '#f5d1ad',
  eyesColor: '#00ffff',
  speed: 'normal',
  size: 'normal',
  effectColor: '#00ffff',
  attacks: { ...defaultAttacks },
  skins: [],
};

const ColorPicker: React.FC<{ label: string; value: string; onChange: (c: string) => void }> = ({ label, value, onChange }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ color: '#87ceeb', fontSize: 9, letterSpacing: 2, marginBottom: 2, fontFamily: "'Orbitron', monospace" }}>{label}</div>
    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {COLORS.map(c => (
        <div key={c} onClick={() => { onChange(c); playSelectSound(); }} style={{
          width: 16, height: 16, background: c, cursor: 'pointer',
          border: value === c ? '2px solid #fff' : '1px solid #444',
          borderRadius: 2, boxShadow: value === c ? `0 0 6px ${c}` : 'none',
        }} />
      ))}
    </div>
  </div>
);

// Large versus-style preview
function drawDevCharPreview(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  char: DevCharData, time: number, skinOverride?: DevSkinData | null
) {
  ctx.clearRect(0, 0, w, h);
  const skin = skinOverride || char;
  const cx = w / 2;
  const cy = h * 0.42;
  const scale = char.size === 'pequeño' ? 0.8 : char.size === 'grande' ? 1.3 : 1;
  const R = 55 * scale;

  // Aura glow
  ctx.save();
  ctx.globalAlpha = 0.12;
  const aura = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 3);
  aura.addColorStop(0, skin.effectColor);
  aura.addColorStop(1, 'transparent');
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Ground shadow
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(cx, h * 0.82, R * 1.2, R * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Body (head sphere)
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  const skinGrad = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.05, cx + R * 0.1, cy + R * 0.1, R);
  skinGrad.addColorStop(0, lighten(skin.skinColor, 30));
  skinGrad.addColorStop(0.5, skin.skinColor);
  skinGrad.addColorStop(1, darken(skin.skinColor, 40));
  ctx.fillStyle = skinGrad; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.stroke();

  // Rim light
  ctx.save(); ctx.globalAlpha = 0.25;
  const rim = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.4, 0, cx - R * 0.4, cy - R * 0.4, R * 0.7);
  rim.addColorStop(0, 'rgba(255,255,255,0.6)');
  rim.addColorStop(1, 'transparent');
  ctx.fillStyle = rim;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Clothes (clipped)
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.99, 0, Math.PI * 2); ctx.clip();
  const clothY = cy;
  ctx.fillStyle = skin.clothesColor;
  ctx.fillRect(cx - R * 1.1, clothY, R * 2.2, R * 0.4);
  // Pants
  ctx.save(); ctx.translate(cx, cy + R * 0.4); ctx.scale(1, 0.6);
  ctx.beginPath(); ctx.arc(0, 0, R * 0.85, 0, Math.PI);
  ctx.fillStyle = skin.pantsColor; ctx.fill();
  ctx.restore();
  // NO FEET
  ctx.restore();

  // Hair
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.99, 0, Math.PI * 2); ctx.clip();
  ctx.translate(cx, cy - R * 0.65); ctx.scale(1, 0.7);
  const hairGrad = ctx.createRadialGradient(R * 0.1, -R * 0.15, 0, 0, 0, R * 0.8);
  hairGrad.addColorStop(0, lighten(skin.hairColor, 20));
  hairGrad.addColorStop(1, darken(skin.hairColor, 35));
  ctx.beginPath(); ctx.arc(0, 0, R * 0.8, Math.PI, 0);
  ctx.fillStyle = hairGrad; ctx.fill();
  // Hair shine
  ctx.globalAlpha = 0.3;
  ctx.beginPath(); ctx.arc(R * 0.15, -R * 0.08, R * 0.35, Math.PI, 0);
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
  ctx.restore();

  // Eyes
  const eyeLX = cx - R * 0.2, eyeRX = cx + R * 0.2, eyeY = cy - R * 0.22, eyeR = R * 0.16;
  [eyeLX, eyeRX].forEach(ex => {
    const eg = ctx.createRadialGradient(ex - eyeR * 0.3, eyeY - eyeR * 0.3, 0, ex, eyeY, eyeR);
    eg.addColorStop(0, lighten(skin.eyesColor, 50));
    eg.addColorStop(0.5, skin.eyesColor);
    eg.addColorStop(1, darken(skin.eyesColor, 30));
    ctx.beginPath(); ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fillStyle = eg; ctx.fill();
    // Highlight
    ctx.save(); ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.arc(ex - eyeR * 0.25, eyeY - eyeR * 0.25, eyeR * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
    ctx.restore();
    // Pupil
    ctx.beginPath(); ctx.arc(ex, eyeY, eyeR * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
  });

  // Hands (floating, bobbing)
  const handR = R * 0.28;
  const swing = Math.sin(time * 0.05) * 8;
  const lx = cx - R - 14 + swing;
  const rx = cx + R + 14 - swing;
  const ly = cy + R * 0.2 + Math.cos(time * 0.07) * 4;
  const ry = cy + R * 0.2 + Math.sin(time * 0.06) * 4;
  [{ x: lx, y: ly }, { x: rx, y: ry }].forEach(h => {
    ctx.beginPath(); ctx.arc(h.x, h.y, handR, 0, Math.PI * 2);
    ctx.fillStyle = skin.handsColor; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
  });

  // Name
  ctx.font = `bold ${18 * scale}px Orbitron, monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = skin.eyesColor;
  ctx.shadowColor = skin.eyesColor;
  ctx.shadowBlur = 15;
  ctx.fillText(char.name || 'SIN NOMBRE', cx, h * 0.9);
  ctx.shadowBlur = 0;
}

function lighten(hex: string, amt: number) {
  const h = hex.startsWith('#') ? hex : '#000';
  const f = h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
  const r = Math.min(255, parseInt(f.slice(1, 3), 16) + amt);
  const g = Math.min(255, parseInt(f.slice(3, 5), 16) + amt);
  const b = Math.min(255, parseInt(f.slice(5, 7), 16) + amt);
  return `rgb(${r},${g},${b})`;
}
function darken(hex: string, amt: number) {
  const h = hex.startsWith('#') ? hex : '#000';
  const f = h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
  const r = Math.max(0, parseInt(f.slice(1, 3), 16) - amt);
  const g = Math.max(0, parseInt(f.slice(3, 5), 16) - amt);
  const b = Math.max(0, parseInt(f.slice(5, 7), 16) - amt);
  return `rgb(${r},${g},${b})`;
}

type Tab = 'apariencia' | 'atributos' | 'ataques_basicos' | 'ataques_especiales' | 'ataques_super' | 'ultra' | 'skins';

const ATTACK_CATEGORIES = {
  ataques_basicos: [
    { key: 'forwardHit' as const, label: '→ + GOLPE' },
    { key: 'upHit' as const, label: '↑ + GOLPE' },
    { key: 'downHit' as const, label: '↓ + GOLPE' },
    { key: 'airDownHit' as const, label: 'AIRE ↓ + GOLPE' },
    { key: 'airForwardHit' as const, label: 'AIRE → + GOLPE' },
  ],
  ataques_especiales: [
    { key: 'basicSpecial' as const, label: 'ESPECIAL' },
    { key: 'forwardSpecial' as const, label: '→ + ESPECIAL' },
    { key: 'upSpecial' as const, label: '↑ + ESPECIAL' },
    { key: 'downSpecial' as const, label: '↓ + ESPECIAL' },
    { key: 'airDownSpecial' as const, label: 'AIRE ↓ + ESP' },
    { key: 'airForwardSpecial' as const, label: 'AIRE → + ESP' },
  ],
  ataques_super: [
    { key: 'basicSuper' as const, label: 'SUPER' },
    { key: 'forwardSuper' as const, label: '→ + SUPER' },
    { key: 'upSuper' as const, label: '↑ + SUPER' },
    { key: 'downSuper' as const, label: '↓ + SUPER' },
    { key: 'airDownSuper' as const, label: 'AIRE ↓ + SUPER' },
    { key: 'airForwardSuper' as const, label: 'AIRE → + SUPER' },
  ],
  ultra: [
    { key: 'ultra' as const, label: 'ULTRA' },
  ],
};

const DevCharacterCreator: React.FC = () => {
  const { setGameState } = useGame();
  const [devChars, setDevChars] = useState<(DevCharData | null)[]>([null, null, null, null, null, null, null, null]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [char, setChar] = useState<DevCharData>({ ...defaultDevChar, attacks: { ...defaultAttacks }, skins: [] });
  const [tab, setTab] = useState<Tab>('apariencia');
  const [editingSkin, setEditingSkin] = useState<number | null>(null);
  const [skinData, setSkinData] = useState<DevSkinData>({ id: '', name: '', hairColor: '#5a3a1a', skinColor: '#f5deb3', clothesColor: '#0088ff', pantsColor: '#222222', handsColor: '#f5d1ad', eyesColor: '#00ffff', effectColor: '#00ffff' });
  const [previewSkin, setPreviewSkin] = useState<DevSkinData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('devChars') || '[]');
      const arr: (DevCharData | null)[] = Array(32).fill(null);
      saved.forEach((ch: any, i: number) => { if (i < 32 && ch) arr[i] = { ...defaultDevChar, ...ch, attacks: { ...defaultAttacks, ...(ch.attacks || {}) }, skins: ch.skins || [] }; });
      setDevChars(arr);
    } catch {}
  }, []);

  // Canvas preview animation
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || editIdx === null) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = 300, h = 400;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    frameRef.current++;
    drawDevCharPreview(ctx, w, h, char, frameRef.current, previewSkin);
    animRef.current = requestAnimationFrame(drawPreview);
  }, [char, editIdx, previewSkin]);

  useEffect(() => {
    if (editIdx !== null) {
      animRef.current = requestAnimationFrame(drawPreview);
      return () => cancelAnimationFrame(animRef.current);
    }
  }, [drawPreview, editIdx]);

  const save = () => {
    if (!char.name.trim()) char.name = `DEV ${(editIdx ?? 0) + 1}`;
    const updated = [...devChars];
    if (editIdx !== null) updated[editIdx] = { ...char };
    setDevChars(updated);
    localStorage.setItem('devChars', JSON.stringify(updated));
    playConfirmSound();
    setEditIdx(null);
  };

  const deleteChar = () => {
    if (editIdx === null) return;
    const updated = [...devChars];
    updated[editIdx] = null;
    setDevChars(updated);
    localStorage.setItem('devChars', JSON.stringify(updated));
    setEditIdx(null);
  };

  const update = (key: keyof DevCharData, val: any) => setChar(c => ({ ...c, [key]: val }));
  const updateAttack = (key: keyof DevAttackConfig, val: string) => setChar(c => ({ ...c, attacks: { ...c.attacks, [key]: val } }));

  const saveSkin = () => {
    if (!skinData.name.trim()) skinData.name = `Skin ${char.skins.length + 1}`;
    skinData.id = skinData.name.toLowerCase().replace(/\s/g, '_') + '_' + Date.now();
    const newSkins = [...char.skins];
    if (editingSkin !== null && editingSkin < newSkins.length) {
      newSkins[editingSkin] = { ...skinData };
    } else {
      newSkins.push({ ...skinData });
    }
    setChar(c => ({ ...c, skins: newSkins }));
    setEditingSkin(null);
    setPreviewSkin(null);
    playConfirmSound();
  };

  // List view
  if (editIdx === null) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0020 50%, #0a0a1a 100%)' }}>
        <div style={{ padding: '16px 30px', borderBottom: '2px solid rgba(255,0,100,0.4)', background: 'rgba(0,0,0,0.6)', textAlign: 'center' }}>
          <h2 style={{ color: '#ff0066', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(18px, 3.5vw, 32px)', letterSpacing: 4, textShadow: '0 0 20px #ff0066, 0 0 40px #ff006640' }}>
            🔧 CREADOR PROGRAMADOR
          </h2>
          <div style={{ color: '#ff6699', fontSize: 10, letterSpacing: 3, marginTop: 4, fontFamily: "'Orbitron', monospace" }}>MODO DESARROLLADOR</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, maxWidth: 700 }}>
            {devChars.map((ch, i) => (
              <div key={i} onClick={() => { setEditIdx(i); setChar(ch ? { ...ch, attacks: { ...defaultAttacks, ...(ch.attacks || {}) }, skins: [...(ch.skins || [])] } : { ...defaultDevChar, attacks: { ...defaultAttacks }, skins: [] }); setTab('apariencia'); playSelectSound(); }}
                style={{
                  padding: 16, cursor: 'pointer', textAlign: 'center',
                  background: 'rgba(10,10,20,0.9)', border: `2px solid ${ch ? 'rgba(255,0,100,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  transition: 'all 0.3s', minHeight: 120,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ch ? (ch.eyesColor || '#ff0066') : '#ff0066'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ch ? 'rgba(255,0,100,0.4)' : 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {ch ? (
                  <>
                    <div style={{
                      width: 50, height: 50, borderRadius: '50%', background: ch.skinColor,
                      border: `3px solid ${ch.eyesColor}`, boxShadow: `0 0 12px ${ch.eyesColor}40`,
                      position: 'relative', margin: '0 auto 6px',
                    }}>
                      <div style={{ position: 'absolute', top: '38%', left: '28%', width: 7, height: 7, borderRadius: '50%', background: ch.eyesColor }} />
                      <div style={{ position: 'absolute', top: '38%', right: '28%', width: 7, height: 7, borderRadius: '50%', background: ch.eyesColor }} />
                      <div style={{ position: 'absolute', top: -3, left: '12%', right: '12%', height: '38%', borderRadius: '50% 50% 0 0', background: ch.hairColor }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '22%', borderRadius: '0 0 50% 50%', background: ch.clothesColor }} />
                    </div>
                    <div style={{ color: '#eafcff', fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 2 }}>{ch.name}</div>
                    {ch.skins.length > 0 && <div style={{ color: '#ff6699', fontSize: 8, marginTop: 2 }}>{ch.skins.length} skins</div>}
                  </>
                ) : (
                  <>
                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
                      <span style={{ color: '#555', fontSize: 24, fontWeight: 900 }}>+</span>
                    </div>
                    <div style={{ color: '#555', fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 2 }}>VACÍO</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '12px 30px', borderTop: '2px solid rgba(255,0,100,0.3)', background: 'rgba(0,0,0,0.5)', textAlign: 'center', display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => setGameState('DEV_STAGE_CREATOR')} style={{
            padding: '8px 24px', background: 'rgba(0,200,100,0.15)', border: '2px solid #00cc66', color: '#00cc66',
            cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2,
          }}>🌍 CREAR ESCENARIO</button>
          <button onClick={() => setGameState('MENU')} style={{
            padding: '8px 30px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
            cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2,
          }}>VOLVER</button>
        </div>
      </div>
    );
  }

  // Skin editor overlay
  if (editingSkin !== null) {
    return (
      <div className="fixed inset-0 z-[60] flex" style={{ background: 'rgba(0,0,0,0.95)' }}>
        <div style={{ width: '55%', overflowY: 'auto', padding: '15px 20px' }}>
          <h3 style={{ color: '#ff6699', fontFamily: "'Orbitron', monospace", fontSize: 16, letterSpacing: 3, marginBottom: 10 }}>EDITAR SKIN</h3>
          <div style={{ marginBottom: 8 }}>
            <div style={{ color: '#87ceeb', fontSize: 9, letterSpacing: 2, marginBottom: 2, fontFamily: "'Orbitron', monospace" }}>NOMBRE DE SKIN</div>
            <input value={skinData.name} onChange={e => setSkinData(s => ({ ...s, name: e.target.value.toUpperCase().slice(0, 20) }))} maxLength={20}
              style={{ width: '100%', padding: '5px 8px', background: 'rgba(10,10,30,0.9)', border: '2px solid rgba(255,0,100,0.3)', color: '#eafcff', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2 }} />
          </div>
          <ColorPicker label="CABELLO" value={skinData.hairColor} onChange={c => { setSkinData(s => ({ ...s, hairColor: c })); setPreviewSkin(p => p ? { ...p, hairColor: c } : null); }} />
          <ColorPicker label="PIEL" value={skinData.skinColor} onChange={c => { setSkinData(s => ({ ...s, skinColor: c })); setPreviewSkin(p => p ? { ...p, skinColor: c } : null); }} />
          <ColorPicker label="ROPA" value={skinData.clothesColor} onChange={c => { setSkinData(s => ({ ...s, clothesColor: c })); setPreviewSkin(p => p ? { ...p, clothesColor: c } : null); }} />
          <ColorPicker label="PANTALONES" value={skinData.pantsColor} onChange={c => { setSkinData(s => ({ ...s, pantsColor: c })); setPreviewSkin(p => p ? { ...p, pantsColor: c } : null); }} />
          <ColorPicker label="MANOS" value={skinData.handsColor} onChange={c => { setSkinData(s => ({ ...s, handsColor: c })); setPreviewSkin(p => p ? { ...p, handsColor: c } : null); }} />
          <ColorPicker label="OJOS" value={skinData.eyesColor} onChange={c => { setSkinData(s => ({ ...s, eyesColor: c })); setPreviewSkin(p => p ? { ...p, eyesColor: c } : null); }} />
          <ColorPicker label="EFECTOS" value={skinData.effectColor} onChange={c => { setSkinData(s => ({ ...s, effectColor: c })); setPreviewSkin(p => p ? { ...p, effectColor: c } : null); }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={saveSkin} style={{ flex: 1, padding: '8px', background: 'rgba(0,255,100,0.15)', border: '2px solid #00ff66', color: '#00ff66', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 11 }}>GUARDAR SKIN</button>
            <button onClick={() => { setEditingSkin(null); setPreviewSkin(null); }} style={{ flex: 1, padding: '8px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 11 }}>CANCELAR</button>
          </div>
        </div>
        <div style={{ width: '45%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    );
  }

  // Editor view
  const tabs: { id: Tab; label: string; color: string }[] = [
    { id: 'apariencia', label: 'VISUAL', color: '#00ffff' },
    { id: 'atributos', label: 'ATRIB', color: '#00ff66' },
    { id: 'ataques_basicos', label: 'GOLPES', color: '#ffcc00' },
    { id: 'ataques_especiales', label: 'ESPEC', color: '#00ccff' },
    { id: 'ataques_super', label: 'SUPER', color: '#ff8800' },
    { id: 'ultra', label: 'ULTRA', color: '#ff0044' },
    { id: 'skins', label: 'SKINS', color: '#ff66cc' },
  ];

  const renderAttackSelector = (key: keyof DevAttackConfig, label: string) => {
    const options = (DEV_ATTACK_OPTIONS as any)[key] as { id: string; name: string; desc: string; source: string }[];
    if (!options) return null;
    return (
      <div key={key} style={{ marginBottom: 10 }}>
        <div style={{ color: '#aaa', fontSize: 9, letterSpacing: 2, marginBottom: 4, fontFamily: "'Orbitron', monospace" }}>{label}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
          {options.map(opt => (
            <button key={opt.id} onClick={() => { updateAttack(key, opt.id); playSelectSound(); }}
              style={{
                padding: '6px 4px', cursor: 'pointer', textAlign: 'left',
                background: char.attacks[key] === opt.id ? 'rgba(255,0,100,0.2)' : 'rgba(10,10,30,0.8)',
                border: `1px solid ${char.attacks[key] === opt.id ? '#ff0066' : '#333'}`,
                color: char.attacks[key] === opt.id ? '#ff6699' : '#87ceeb',
                fontFamily: "'Orbitron', monospace", fontSize: 8,
              }}>
              <div style={{ fontWeight: 700 }}>{opt.name}</div>
              <div style={{ fontSize: 7, color: '#666', marginTop: 1 }}>{opt.desc}</div>
              <div style={{ fontSize: 6, color: '#444', marginTop: 1 }}>de {opt.source}</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0020 50%, #0a0a1a 100%)' }}>
      {/* Left panel */}
      <div style={{ width: '55%', overflowY: 'auto', padding: '12px 18px', borderRight: '2px solid rgba(255,0,100,0.3)', background: 'rgba(0,0,0,0.4)' }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: '#ff6699', fontSize: 9, letterSpacing: 2, marginBottom: 2, fontFamily: "'Orbitron', monospace" }}>NOMBRE</div>
          <input value={char.name} onChange={e => update('name', e.target.value.toUpperCase().slice(0, 16))} maxLength={16}
            style={{ width: '100%', padding: '5px 8px', background: 'rgba(10,10,30,0.9)', border: '2px solid rgba(255,0,100,0.3)', color: '#eafcff', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2 }} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 8, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '4px 6px', cursor: 'pointer',
              background: tab === t.id ? `${t.color}20` : 'rgba(10,10,30,0.8)',
              border: `1.5px solid ${tab === t.id ? t.color : '#333'}`,
              color: tab === t.id ? t.color : '#666',
              fontFamily: "'Orbitron', monospace", fontSize: 8, letterSpacing: 1,
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'apariencia' && (
          <>
            <ColorPicker label="CABELLO" value={char.hairColor} onChange={c => update('hairColor', c)} />
            <ColorPicker label="PIEL" value={char.skinColor} onChange={c => update('skinColor', c)} />
            <ColorPicker label="ROPA" value={char.clothesColor} onChange={c => update('clothesColor', c)} />
            <ColorPicker label="PANTALONES" value={char.pantsColor} onChange={c => update('pantsColor', c)} />
            <ColorPicker label="MANOS" value={char.handsColor} onChange={c => update('handsColor', c)} />
            <ColorPicker label="OJOS" value={char.eyesColor} onChange={c => update('eyesColor', c)} />
            <ColorPicker label="COLOR DE EFECTOS" value={char.effectColor} onChange={c => update('effectColor', c)} />
          </>
        )}

        {tab === 'atributos' && (
          <>
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: '#87ceeb', fontSize: 9, letterSpacing: 2, marginBottom: 4, fontFamily: "'Orbitron', monospace" }}>VELOCIDAD</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {SPEEDS.map(s => (
                  <button key={s.value} onClick={() => { update('speed', s.value); playSelectSound(); }} style={{
                    flex: 1, padding: '6px 0', cursor: 'pointer',
                    background: char.speed === s.value ? 'rgba(0,255,255,0.2)' : 'rgba(10,10,30,0.8)',
                    border: `2px solid ${char.speed === s.value ? '#00ffff' : '#333'}`,
                    color: char.speed === s.value ? '#00ffff' : '#87ceeb',
                    fontFamily: "'Orbitron', monospace", fontSize: 8,
                  }}>{s.label}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: '#87ceeb', fontSize: 9, letterSpacing: 2, marginBottom: 4, fontFamily: "'Orbitron', monospace" }}>TAMAÑO</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {SIZES.map(s => (
                  <button key={s.value} onClick={() => { update('size', s.value); playSelectSound(); }} style={{
                    flex: 1, padding: '6px 0', cursor: 'pointer',
                    background: char.size === s.value ? 'rgba(0,255,255,0.2)' : 'rgba(10,10,30,0.8)',
                    border: `2px solid ${char.size === s.value ? '#00ffff' : '#333'}`,
                    color: char.size === s.value ? '#00ffff' : '#87ceeb',
                    fontFamily: "'Orbitron', monospace", fontSize: 8,
                  }}>{s.label}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'ataques_basicos' && ATTACK_CATEGORIES.ataques_basicos.map(a => renderAttackSelector(a.key, a.label))}
        {tab === 'ataques_especiales' && ATTACK_CATEGORIES.ataques_especiales.map(a => renderAttackSelector(a.key, a.label))}
        {tab === 'ataques_super' && ATTACK_CATEGORIES.ataques_super.map(a => renderAttackSelector(a.key, a.label))}
        {tab === 'ultra' && ATTACK_CATEGORIES.ultra.map(a => renderAttackSelector(a.key, a.label))}

        {tab === 'skins' && (
          <>
            <div style={{ color: '#ff66cc', fontSize: 10, letterSpacing: 2, marginBottom: 8, fontFamily: "'Orbitron', monospace" }}>
              SKINS ({char.skins.length}/4)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {char.skins.map((sk, i) => (
                <div key={i} style={{ padding: 8, background: 'rgba(10,10,30,0.9)', border: '1px solid rgba(255,0,100,0.3)', cursor: 'pointer' }}
                  onClick={() => { setEditingSkin(i); setSkinData({ ...sk }); setPreviewSkin({ ...sk }); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: sk.skinColor, border: `2px solid ${sk.eyesColor}` }} />
                    <div style={{ color: '#eafcff', fontFamily: "'Orbitron', monospace", fontSize: 9 }}>{sk.name}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); const ns = [...char.skins]; ns.splice(i, 1); setChar(c => ({ ...c, skins: ns })); }}
                    style={{ marginTop: 4, padding: '2px 6px', background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer', fontSize: 7, fontFamily: "'Orbitron', monospace" }}>ELIMINAR</button>
                </div>
              ))}
            </div>
            {char.skins.length < 4 && (
              <button onClick={() => {
                setSkinData({ id: '', name: '', hairColor: char.hairColor, skinColor: char.skinColor, clothesColor: char.clothesColor, pantsColor: char.pantsColor, handsColor: char.handsColor, eyesColor: char.eyesColor, effectColor: char.effectColor });
                setPreviewSkin({ id: '', name: '', hairColor: char.hairColor, skinColor: char.skinColor, clothesColor: char.clothesColor, pantsColor: char.pantsColor, handsColor: char.handsColor, eyesColor: char.eyesColor, effectColor: char.effectColor });
                setEditingSkin(char.skins.length);
              }}
                style={{ marginTop: 8, padding: '8px 16px', background: 'rgba(255,0,100,0.15)', border: '2px solid #ff0066', color: '#ff0066', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 2, width: '100%' }}>
                + AGREGAR SKIN
              </button>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={save} style={{
            flex: 1, padding: '8px 0', background: 'rgba(0,255,100,0.15)', border: '2px solid #00ff66',
            color: '#00ff66', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 2,
          }}>GUARDAR</button>
          <button onClick={deleteChar} style={{
            padding: '8px 16px', background: 'rgba(255,0,0,0.15)', border: '2px solid #ff0000',
            color: '#ff0000', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 11,
          }}>🗑</button>
          <button onClick={() => setEditIdx(null)} style={{
            flex: 1, padding: '8px 0', background: 'transparent', border: '2px solid #ff4d4d',
            color: '#ff4d4d', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 2,
          }}>CANCELAR</button>
        </div>
      </div>

      {/* Right panel — large versus preview */}
      <div style={{ width: '45%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 50%, rgba(255,0,100,0.05), transparent 70%)' }}>
        <canvas ref={canvasRef} />
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <div style={{ color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 2 }}>
            VEL: {char.speed.toUpperCase()} | TAM: {char.size.toUpperCase()}
          </div>
          <div style={{ color: '#ff6699', fontFamily: "'Orbitron', monospace", fontSize: 8, marginTop: 4, letterSpacing: 1 }}>
            {char.skins.length} SKINS | {Object.keys(char.attacks).length} ATAQUES
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevCharacterCreator;
