import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../game/GameContext';
import type { DevStageData } from '../game/types';
import { playSelectSound, playConfirmSound } from '../game/audio';

const COLORS = [
  '#ff0000','#ff4400','#ff8800','#ffbb00','#ffff00','#aaff00',
  '#00ff00','#00ff88','#00ffcc','#00ffff','#0088ff','#0044ff',
  '#0000ff','#4400ff','#8800ff','#cc00ff','#ff00ff','#ff0088',
  '#ffffff','#dddddd','#bbbbbb','#888888','#555555','#333333',
  '#000000','#5a3a1a','#8B4513','#D2691E','#1a1a2e','#16213e',
  '#0f3460','#4b0000','#003300','#000033',
];

const defaultStage: DevStageData = {
  id: '', name: '', bgColor1: '#1a1a3a', bgColor2: '#0b0b1f',
  groundColor: '#333333', ambientColor: '#4488ff', lightColor: '#ffffff',
  lightIntensity: 0.3, shadowColor: '#000000', shadowIntensity: 0.5,
  particleColor: '#ffcc33', particleCount: 15, fogColor: '#000044', fogIntensity: 0.1,
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

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }> = ({ label, value, min, max, step, onChange }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ color: '#87ceeb', fontSize: 9, letterSpacing: 2, marginBottom: 2, fontFamily: "'Orbitron', monospace", display: 'flex', justifyContent: 'space-between' }}>
      <span>{label}</span>
      <span style={{ color: '#00ffff' }}>{value.toFixed(1)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))}
      style={{ width: '100%', accentColor: '#00ffff' }} />
  </div>
);

function drawStagePreview(ctx: CanvasRenderingContext2D, w: number, h: number, stage: DevStageData, time: number) {
  ctx.clearRect(0, 0, w, h);

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, stage.bgColor1);
  bg.addColorStop(1, stage.bgColor2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Ambient light
  ctx.save();
  ctx.globalAlpha = stage.lightIntensity;
  const light = ctx.createRadialGradient(w * 0.5, h * 0.2, 0, w * 0.5, h * 0.2, w * 0.6);
  light.addColorStop(0, stage.lightColor);
  light.addColorStop(1, 'transparent');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Fog
  if (stage.fogIntensity > 0) {
    ctx.save();
    ctx.globalAlpha = stage.fogIntensity;
    const fog = ctx.createLinearGradient(0, h * 0.5, 0, h);
    fog.addColorStop(0, 'transparent');
    fog.addColorStop(1, stage.fogColor);
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Ground
  const groundY = h * 0.78;
  ctx.fillStyle = stage.groundColor;
  ctx.fillRect(0, groundY, w, h - groundY);
  // Ground line glow
  ctx.save();
  ctx.globalAlpha = 0.5;
  const glowGrad = ctx.createLinearGradient(w * 0.1, groundY, w * 0.9, groundY);
  glowGrad.addColorStop(0, 'transparent');
  glowGrad.addColorStop(0.5, stage.ambientColor);
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, groundY - 1, w, 3);
  ctx.restore();

  // Shadows
  ctx.save();
  ctx.globalAlpha = stage.shadowIntensity;
  const shadow = ctx.createLinearGradient(0, groundY, 0, h);
  shadow.addColorStop(0, 'transparent');
  shadow.addColorStop(1, stage.shadowColor);
  ctx.fillStyle = shadow;
  ctx.fillRect(0, groundY, w, h - groundY);
  ctx.restore();

  // Particles
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < stage.particleCount; i++) {
    const px = (w * 0.1 + ((time * 0.3 + i * 97) % (w * 0.8)));
    const py = h * 0.1 + Math.sin(time * 0.015 + i * 1.7) * h * 0.3;
    const sz = 1 + Math.sin(time * 0.03 + i) * 0.8;
    ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2);
    ctx.fillStyle = stage.particleColor;
    ctx.fill();
  }

  // Ambient color glow at edges
  ctx.save();
  ctx.globalAlpha = 0.08;
  const ambL = ctx.createLinearGradient(0, 0, w * 0.3, 0);
  ambL.addColorStop(0, stage.ambientColor);
  ambL.addColorStop(1, 'transparent');
  ctx.fillStyle = ambL;
  ctx.fillRect(0, 0, w * 0.3, h);
  const ambR = ctx.createLinearGradient(w * 0.7, 0, w, 0);
  ambR.addColorStop(0, 'transparent');
  ambR.addColorStop(1, stage.ambientColor);
  ctx.fillStyle = ambR;
  ctx.fillRect(w * 0.7, 0, w * 0.3, h);
  ctx.restore();

  // Name
  ctx.font = 'bold 14px Orbitron, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = stage.ambientColor;
  ctx.shadowColor = stage.ambientColor;
  ctx.shadowBlur = 10;
  ctx.fillText(stage.name || 'SIN NOMBRE', w / 2, h * 0.92);
  ctx.shadowBlur = 0;
}

const DevStageCreator: React.FC = () => {
  const { setGameState } = useGame();
  const [stages, setStages] = useState<(DevStageData | null)[]>([null, null, null, null, null, null]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [stage, setStage] = useState<DevStageData>({ ...defaultStage });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('devStages') || '[]');
      const arr: (DevStageData | null)[] = [null, null, null, null, null, null];
      saved.forEach((s: any, i: number) => { if (i < 6 && s) arr[i] = { ...defaultStage, ...s }; });
      setStages(arr);
    } catch {}
  }, []);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || editIdx === null) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = 360, h = 240;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    frameRef.current++;
    drawStagePreview(ctx, w, h, stage, frameRef.current);
    animRef.current = requestAnimationFrame(drawPreview);
  }, [stage, editIdx]);

  useEffect(() => {
    if (editIdx !== null) {
      animRef.current = requestAnimationFrame(drawPreview);
      return () => cancelAnimationFrame(animRef.current);
    }
  }, [drawPreview, editIdx]);

  const save = () => {
    if (!stage.name.trim()) stage.name = `ESCENARIO ${(editIdx ?? 0) + 1}`;
    stage.id = 'dev_' + stage.name.toLowerCase().replace(/\s/g, '_') + '_' + (editIdx ?? 0);
    const updated = [...stages];
    if (editIdx !== null) updated[editIdx] = { ...stage };
    setStages(updated);
    localStorage.setItem('devStages', JSON.stringify(updated));
    playConfirmSound();
    setEditIdx(null);
  };

  const deleteStage = () => {
    if (editIdx === null) return;
    const updated = [...stages];
    updated[editIdx] = null;
    setStages(updated);
    localStorage.setItem('devStages', JSON.stringify(updated));
    setEditIdx(null);
  };

  const upd = (key: keyof DevStageData, val: any) => setStage(s => ({ ...s, [key]: val }));

  // List view
  if (editIdx === null) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #001a0a 50%, #0a0a1a 100%)' }}>
        <div style={{ padding: '16px 30px', borderBottom: '2px solid rgba(0,200,100,0.4)', background: 'rgba(0,0,0,0.6)', textAlign: 'center' }}>
          <h2 style={{ color: '#00cc66', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(18px, 3.5vw, 32px)', letterSpacing: 4, textShadow: '0 0 20px #00cc66' }}>
            🌍 CREADOR DE ESCENARIOS
          </h2>
          <div style={{ color: '#66cc99', fontSize: 10, letterSpacing: 3, marginTop: 4, fontFamily: "'Orbitron', monospace" }}>MODO DESARROLLADOR</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 600 }}>
            {stages.map((s, i) => (
              <div key={i} onClick={() => { setEditIdx(i); setStage(s ? { ...s } : { ...defaultStage }); playSelectSound(); }}
                style={{
                  padding: 12, cursor: 'pointer', textAlign: 'center',
                  background: 'rgba(10,10,20,0.9)', border: `2px solid ${s ? 'rgba(0,200,100,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  transition: 'all 0.3s', minHeight: 100,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s ? (s.ambientColor || '#00cc66') : '#00cc66'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = s ? 'rgba(0,200,100,0.4)' : 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {s ? (
                  <>
                    <div style={{ width: '100%', height: 50, background: `linear-gradient(180deg, ${s.bgColor1}, ${s.bgColor2})`, border: `1px solid ${s.ambientColor}40`, marginBottom: 6 }} />
                    <div style={{ color: '#eafcff', fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 2 }}>{s.name}</div>
                  </>
                ) : (
                  <>
                    <div style={{ width: '100%', height: 50, background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <span style={{ color: '#555', fontSize: 20, fontWeight: 900 }}>+</span>
                    </div>
                    <div style={{ color: '#555', fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 2 }}>VACÍO</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '12px 30px', borderTop: '2px solid rgba(0,200,100,0.3)', background: 'rgba(0,0,0,0.5)', textAlign: 'center', display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => setGameState('DEV_CREATOR')} style={{
            padding: '8px 24px', background: 'rgba(255,0,100,0.15)', border: '2px solid #ff0066', color: '#ff0066',
            cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2,
          }}>🔧 PERSONAJES</button>
          <button onClick={() => setGameState('MENU')} style={{
            padding: '8px 30px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
            cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2,
          }}>VOLVER</button>
        </div>
      </div>
    );
  }

  // Editor view
  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #001a0a 50%, #0a0a1a 100%)' }}>
      <div style={{ width: '50%', overflowY: 'auto', padding: '12px 18px', borderRight: '2px solid rgba(0,200,100,0.3)', background: 'rgba(0,0,0,0.4)' }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: '#00cc66', fontSize: 9, letterSpacing: 2, marginBottom: 2, fontFamily: "'Orbitron', monospace" }}>NOMBRE</div>
          <input value={stage.name} onChange={e => upd('name', e.target.value.toUpperCase().slice(0, 20))} maxLength={20}
            style={{ width: '100%', padding: '5px 8px', background: 'rgba(10,10,30,0.9)', border: '2px solid rgba(0,200,100,0.3)', color: '#eafcff', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2 }} />
        </div>

        <ColorPicker label="FONDO SUPERIOR" value={stage.bgColor1} onChange={c => upd('bgColor1', c)} />
        <ColorPicker label="FONDO INFERIOR" value={stage.bgColor2} onChange={c => upd('bgColor2', c)} />
        <ColorPicker label="SUELO" value={stage.groundColor} onChange={c => upd('groundColor', c)} />
        <ColorPicker label="COLOR AMBIENTAL" value={stage.ambientColor} onChange={c => upd('ambientColor', c)} />
        <ColorPicker label="LUZ" value={stage.lightColor} onChange={c => upd('lightColor', c)} />
        <Slider label="INTENSIDAD DE LUZ" value={stage.lightIntensity} min={0} max={1} step={0.05} onChange={v => upd('lightIntensity', v)} />
        <ColorPicker label="SOMBRA" value={stage.shadowColor} onChange={c => upd('shadowColor', c)} />
        <Slider label="INTENSIDAD DE SOMBRA" value={stage.shadowIntensity} min={0} max={1} step={0.05} onChange={v => upd('shadowIntensity', v)} />
        <ColorPicker label="PARTÍCULAS" value={stage.particleColor} onChange={c => upd('particleColor', c)} />
        <Slider label="CANTIDAD DE PARTÍCULAS" value={stage.particleCount} min={0} max={50} step={1} onChange={v => upd('particleCount', v)} />
        <ColorPicker label="NIEBLA" value={stage.fogColor} onChange={c => upd('fogColor', c)} />
        <Slider label="INTENSIDAD DE NIEBLA" value={stage.fogIntensity} min={0} max={1} step={0.05} onChange={v => upd('fogIntensity', v)} />

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={save} style={{
            flex: 1, padding: '8px 0', background: 'rgba(0,255,100,0.15)', border: '2px solid #00ff66',
            color: '#00ff66', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 2,
          }}>GUARDAR</button>
          <button onClick={deleteStage} style={{
            padding: '8px 16px', background: 'rgba(255,0,0,0.15)', border: '2px solid #ff0000',
            color: '#ff0000', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 11,
          }}>🗑</button>
          <button onClick={() => setEditIdx(null)} style={{
            flex: 1, padding: '8px 0', background: 'transparent', border: '2px solid #ff4d4d',
            color: '#ff4d4d', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 2,
          }}>CANCELAR</button>
        </div>
      </div>

      {/* Preview */}
      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <canvas ref={canvasRef} />
        <div style={{ marginTop: 10, color: '#66cc99', fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 2 }}>
          VISTA PREVIA EN TIEMPO REAL
        </div>
      </div>
    </div>
  );
};

export default DevStageCreator;
