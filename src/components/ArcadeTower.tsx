import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA } from '../game/constants';
import type { ArcadeStage, CustomCharData } from '../game/types';

const ARCADE_STAGES: ArcadeStage[] = [
  { type: 'fight', label: 'COMBATE', description: 'Un oponente aleatorio' },
  { type: 'army', label: 'EJÉRCITO', description: '20 enemigos débiles' },
  { type: 'fight', label: 'COMBATE II', description: 'Rival más fuerte' },
  { type: 'minigame', label: 'MINIJUEGO', description: 'Desafío especial' },
  { type: '2v2', label: 'DOS VS DOS', description: 'Pelea en equipo' },
  { type: '3vGiant', label: '3 VS GIGANTE', description: 'Contra un coloso' },
  { type: 'minigame', label: 'MINIJUEGO II', description: 'Desafío avanzado' },
  { type: 'fight', label: 'COMBATE III', description: 'Rival experto' },
  { type: 'miniboss', label: 'MINI BOSS', description: 'Primordiales' },
  { type: 'boss', label: 'BIG BANG', description: 'El jefe final' },
];

const stageColors: Record<string, string> = {
  fight: '#00ffff', army: '#ff8c00', minigame: '#00ff66',
  '2v2': '#ffff00', '3vGiant': '#ff00ff', miniboss: '#ff4444', boss: '#ffffff',
};

const stageSymbols: Record<string, string> = {
  fight: 'VS', army: 'x20', minigame: 'MG', '2v2': '2v2',
  '3vGiant': '3v1', miniboss: 'MB', boss: '!!',
};

// J constellation: serif bar top, vertical stem, curved hook bottom
// Positions ordered from stage 10 (top) to stage 1 (hook)
const J_POSITIONS = [
  { x: 0.32, y: 0.09 },  // 10 - BIG BANG (serif left)
  { x: 0.54, y: 0.09 },  // 9  - serif right
  { x: 0.54, y: 0.20 },  // 8  - stem
  { x: 0.54, y: 0.31 },  // 7
  { x: 0.54, y: 0.42 },  // 6
  { x: 0.54, y: 0.53 },  // 5
  { x: 0.54, y: 0.64 },  // 4
  { x: 0.47, y: 0.76 },  // 3  - curve
  { x: 0.34, y: 0.82 },  // 2  - bottom
  { x: 0.24, y: 0.74 },  // 1  - hook tip
];

// Preview card positions: which side of the node to draw (1=right, -1=left)
const CARD_SIDE = [1, -1, -1, -1, 1, -1, -1, 1, 1, 1]; // indexed by J_POSITIONS order (10→1)

function lighten(hex: string, amt: number): string {
  const h = hex.startsWith('#') ? hex : '#000000';
  const f = h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
  const r = Math.min(255, parseInt(f.slice(1, 3), 16) + amt);
  const g = Math.min(255, parseInt(f.slice(3, 5), 16) + amt);
  const b = Math.min(255, parseInt(f.slice(5, 7), 16) + amt);
  return `rgb(${r},${g},${b})`;
}
function darken(hex: string, amt: number): string {
  const h = hex.startsWith('#') ? hex : '#000000';
  const f = h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
  const r = Math.max(0, parseInt(f.slice(1, 3), 16) - amt);
  const g = Math.max(0, parseInt(f.slice(3, 5), 16) - amt);
  const b = Math.max(0, parseInt(f.slice(5, 7), 16) - amt);
  return `rgb(${r},${g},${b})`;
}

function drawCharPreview(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number,
  charIdx: number, customChar: CustomCharData | null, time: number
) {
  const R = 25 * scale;
  const skinC = customChar ? customChar.skinColor : (charIdx === 0 ? '#f5deb3' : '#f5deb3');
  const hairC = customChar ? (customChar.hairColor || customChar.clothesColor) : (charIdx === 0 ? '#8B4513' : '#ffffff');
  const clothC = customChar ? customChar.clothesColor : (charIdx === 0 ? '#b00000' : '#f0f0f5');
  const pantsC = customChar ? (customChar.pantsColor || '#1a1a2e') : (charIdx === 0 ? '#1a1a2e' : '#111111');
  const eyeC = customChar ? customChar.eyesColor : (charIdx === 0 ? '#00ffff' : '#ffff00');

  const breath = Math.sin(time * 0.04) * 0.02;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 1 + breath);

  // Glow
  ctx.save(); ctx.globalAlpha = 0.18;
  const glow = ctx.createRadialGradient(0, 0, R * 0.5, 0, 0, R * 2);
  glow.addColorStop(0, eyeC); glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, R * 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Head
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
  const sg = ctx.createRadialGradient(-R * 0.2, -R * 0.2, 0, R * 0.1, R * 0.1, R);
  sg.addColorStop(0, lighten(skinC, 30)); sg.addColorStop(0.5, skinC); sg.addColorStop(1, darken(skinC, 40));
  ctx.fillStyle = sg; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5 * scale; ctx.stroke();

  // Clothes + pants clipped
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, R * 0.99, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = clothC; ctx.fillRect(-R * 1.1, 0, R * 2.2, R * 0.4);
  ctx.fillStyle = pantsC; ctx.fillRect(-R * 1.1, R * 0.4, R * 2.2, R * 0.7);
  ctx.restore();

  // Hair
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, R * 0.99, 0, Math.PI * 2); ctx.clip();
  ctx.translate(0, -R * 0.65); ctx.scale(1, 0.7);
  ctx.beginPath(); ctx.arc(0, 0, R * 0.8, Math.PI, 0);
  ctx.fillStyle = hairC; ctx.fill();
  ctx.restore();

  // Eyes
  ctx.fillStyle = eyeC;
  ctx.beginPath(); ctx.arc(-R * 0.2, -R * 0.22, R * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(R * 0.2, -R * 0.22, R * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.arc(-R * 0.2, -R * 0.22, R * 0.04, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(R * 0.2, -R * 0.22, R * 0.04, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// Draw a preview card for a stage
function drawStageCard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, side: number,
  stage: ArcadeStage, stageIdx: number, color: string,
  isCompleted: boolean, isCurrent: boolean, isHovered: boolean, isLocked: boolean,
  t: number
) {
  const cardW = 120;
  const cardH = 42;
  const cx = side > 0 ? x + 30 : x - 30 - cardW;
  const cy = y - cardH / 2;

  // Card background
  ctx.save();
  const alpha = isLocked ? 0.15 : isCurrent || isHovered ? 0.85 : 0.5;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = isCurrent || isHovered
    ? 'rgba(10,15,30,0.95)'
    : isCompleted ? 'rgba(8,12,20,0.9)' : 'rgba(5,8,15,0.85)';
  ctx.beginPath();
  // Rounded rect
  const r = 4;
  ctx.moveTo(cx + r, cy); ctx.lineTo(cx + cardW - r, cy);
  ctx.arcTo(cx + cardW, cy, cx + cardW, cy + r, r);
  ctx.lineTo(cx + cardW, cy + cardH - r);
  ctx.arcTo(cx + cardW, cy + cardH, cx + cardW - r, cy + cardH, r);
  ctx.lineTo(cx + r, cy + cardH);
  ctx.arcTo(cx, cy + cardH, cx, cy + cardH - r, r);
  ctx.lineTo(cx, cy + r);
  ctx.arcTo(cx, cy, cx + r, cy, r);
  ctx.fill();

  // Border
  ctx.strokeStyle = isCurrent || isHovered ? color : isCompleted ? `${color}50` : '#1a1a2e';
  ctx.lineWidth = isCurrent || isHovered ? 1.5 : 1;
  ctx.stroke();
  ctx.restore();

  // Connection line from node to card
  ctx.save();
  ctx.globalAlpha = isLocked ? 0.1 : 0.3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(side > 0 ? cx : cx + cardW, y);
  ctx.strokeStyle = isLocked ? '#222' : color;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.stroke();
  ctx.restore();

  // Stage number
  ctx.save();
  ctx.globalAlpha = isLocked ? 0.2 : 0.9;
  ctx.font = 'bold 9px Orbitron, monospace';
  ctx.fillStyle = isLocked ? '#333' : isCurrent ? '#ffcc33' : isCompleted ? '#888' : '#555';
  ctx.textAlign = 'left';
  ctx.fillText(`${stageIdx + 1}.`, cx + 8, cy + 15);
  ctx.restore();

  // Stage name
  ctx.save();
  ctx.globalAlpha = isLocked ? 0.2 : 1;
  ctx.font = `bold 9px Orbitron, monospace`;
  ctx.fillStyle = isLocked ? '#222' : isCurrent || isHovered ? color : isCompleted ? '#aaa' : '#555';
  ctx.textAlign = 'left';
  ctx.fillText(stage.label, cx + 22, cy + 15);
  ctx.restore();

  // Description
  ctx.save();
  ctx.globalAlpha = isLocked ? 0.1 : 0.5;
  ctx.font = '7px Orbitron, monospace';
  ctx.fillStyle = isLocked ? '#111' : '#667';
  ctx.textAlign = 'left';
  ctx.fillText(stage.description, cx + 8, cy + 30);
  ctx.restore();

  // Color accent line at side
  ctx.save();
  ctx.globalAlpha = isLocked ? 0.08 : isCurrent || isHovered ? 0.8 : 0.3;
  ctx.fillStyle = color;
  const accentX = side > 0 ? cx : cx + cardW - 2;
  ctx.fillRect(accentX, cy + 4, 2, cardH - 8);
  ctx.restore();
}

const ConstellationCanvas: React.FC<{
  currentStage: number;
  hoveredStage: number | null;
  p1Choice: number | null;
  customChars: (CustomCharData | null)[];
}> = ({ currentStage, hoveredStage, p1Choice, customChars }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const frameRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.parentElement?.clientWidth || 800;
    const H = canvas.parentElement?.clientHeight || 600;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);
    frameRef.current++;
    const t = frameRef.current;

    // Background
    const bg = ctx.createLinearGradient(0, 0, W * 0.3, H);
    bg.addColorStop(0, '#04030a');
    bg.addColorStop(0.5, '#08060e');
    bg.addColorStop(1, '#040308');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 250; i++) {
      const sx = ((i * 137.5 + 50) % W);
      const sy = ((i * 97.3 + 30) % H);
      const twinkle = (Math.sin(t * 0.012 + i * 2.1) + 1) * 0.5;
      ctx.globalAlpha = 0.1 + twinkle * 0.35;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.3 + twinkle * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = i % 7 === 0 ? '#ffddaa' : '#99aabb';
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Faint golden J outline in background
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#ffcc33';
    ctx.lineWidth = W * 0.06;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    // Serif bar
    ctx.moveTo(W * 0.28, H * 0.09);
    ctx.lineTo(W * 0.58, H * 0.09);
    // Stem down
    ctx.moveTo(W * 0.54, H * 0.09);
    ctx.lineTo(W * 0.54, H * 0.65);
    // Curve
    ctx.quadraticCurveTo(W * 0.54, H * 0.85, W * 0.34, H * 0.85);
    ctx.quadraticCurveTo(W * 0.18, H * 0.85, W * 0.20, H * 0.70);
    ctx.stroke();
    ctx.restore();

    const positions = J_POSITIONS.map(p => ({ x: p.x * W, y: p.y * H }));
    const stagePos = (stageIdx: number) => positions[9 - stageIdx];

    // Draw constellation lines
    for (let i = 0; i < ARCADE_STAGES.length - 1; i++) {
      const from = stagePos(i);
      const to = stagePos(i + 1);
      const isCompleted = i < currentStage;
      const isCurrent = i === currentStage;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);

      if (isCompleted) {
        ctx.strokeStyle = '#ffcc33';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.6;
        ctx.shadowColor = '#ffcc33';
        ctx.shadowBlur = 12;
      } else if (isCurrent) {
        ctx.strokeStyle = '#ffcc33';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.25 + Math.sin(t * 0.04) * 0.15;
        ctx.setLineDash([5, 5]);
      } else {
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.25;
        ctx.setLineDash([3, 5]);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw preview cards (behind nodes)
    for (let i = 0; i < ARCADE_STAGES.length; i++) {
      const pos = stagePos(i);
      const stage = ARCADE_STAGES[i];
      const color = stageColors[stage.type];
      const jIdx = 9 - i;
      const side = CARD_SIDE[jIdx];
      const isCompleted = i < currentStage;
      const isCurrent = i === currentStage;
      const isHovered = hoveredStage === i;
      const isLocked = i > currentStage;

      drawStageCard(ctx, pos.x, pos.y, side, stage, i, color, isCompleted, isCurrent, isHovered, isLocked, t);
    }

    // Draw stage nodes
    for (let i = ARCADE_STAGES.length - 1; i >= 0; i--) {
      const pos = stagePos(i);
      const stage = ARCADE_STAGES[i];
      const color = stageColors[stage.type];
      const isCompleted = i < currentStage;
      const isCurrent = i === currentStage;
      const isHovered = hoveredStage === i;
      const isLocked = i > currentStage;
      const nodeR = isCurrent || isHovered ? 16 : 12;

      // Node outer glow
      if (isCurrent || isHovered) {
        ctx.save();
        ctx.globalAlpha = 0.25 + Math.sin(t * 0.05) * 0.1;
        const gl = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, nodeR * 3.5);
        gl.addColorStop(0, color);
        gl.addColorStop(1, 'transparent');
        ctx.fillStyle = gl;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, nodeR * 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // Node circle
      ctx.beginPath(); ctx.arc(pos.x, pos.y, nodeR, 0, Math.PI * 2);
      if (isCompleted) {
        const g = ctx.createRadialGradient(pos.x - 2, pos.y - 2, 0, pos.x, pos.y, nodeR);
        g.addColorStop(0, lighten(color, 50)); g.addColorStop(1, color);
        ctx.fillStyle = g;
      } else if (isCurrent) {
        ctx.fillStyle = `${color}20`;
      } else {
        ctx.fillStyle = isLocked ? 'rgba(10,10,18,0.9)' : 'rgba(15,15,25,0.9)';
      }
      ctx.fill();
      ctx.strokeStyle = isLocked ? '#1a1a2e' : isCurrent ? color : isCompleted ? `${color}80` : '#2a2a3e';
      ctx.lineWidth = isCurrent ? 2.5 : 1.5;
      if (isCurrent) { ctx.shadowColor = color; ctx.shadowBlur = 8; }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner symbol
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (isCompleted) {
        ctx.font = `bold ${nodeR * 0.85}px Orbitron, monospace`;
        ctx.fillStyle = '#000';
        ctx.fillText('✓', pos.x, pos.y + 1);
      } else {
        ctx.font = `bold ${nodeR * 0.5}px Orbitron, monospace`;
        ctx.fillStyle = isLocked ? '#222' : color;
        ctx.globalAlpha = isLocked ? 0.3 : 0.9;
        ctx.fillText(stageSymbols[stage.type], pos.x, pos.y + 1);
      }
      ctx.restore();
    }

    // Player character at current stage
    if (p1Choice !== null) {
      const charPos = stagePos(currentStage);
      const customChar = p1Choice >= 100 ? customChars[p1Choice - 100] : null;
      const charIdx = p1Choice < 100 ? p1Choice : -1;
      const jIdx = 9 - currentStage;
      const side = CARD_SIDE[jIdx];
      // Place character on opposite side of card
      const charX = charPos.x + (side > 0 ? -35 : 35);
      const charY = charPos.y;
      const bob = Math.sin(t * 0.03) * 3;
      drawCharPreview(ctx, charX, charY + bob, 0.65, charIdx, customChar, t);
    }

    // Vignette
    const vig = ctx.createRadialGradient(W * 0.45, H * 0.45, W * 0.15, W * 0.45, H * 0.45, W * 0.7);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    animRef.current = requestAnimationFrame(draw);
  }, [currentStage, hoveredStage, p1Choice, customChars]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />;
};

const ArcadeTower: React.FC = () => {
  const { engine, setGameState } = useGame();
  const currentStage = engine.arcadeStage || 0;
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const [customChars] = useState<(CustomCharData | null)[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('customChars') || '[]');
      const arr: (CustomCharData | null)[] = [null, null, null, null, null, null];
      saved.forEach((ch: any, i: number) => { if (i < 6 && ch) arr[i] = ch; });
      return arr;
    } catch { return [null, null, null, null, null, null]; }
  });

  const handleStart = () => engine.startArcadeStage(currentStage);
  const activeStage = hoveredStage !== null ? hoveredStage : currentStage;
  const activeData = ARCADE_STAGES[activeStage];
  const activeColor = stageColors[activeData?.type] || '#fff';
  const stagePos = (i: number) => J_POSITIONS[9 - i];

  return (
    <div className="fixed inset-0 z-50" style={{ overflow: 'hidden' }}>
      <ConstellationCanvas
        currentStage={currentStage} hoveredStage={hoveredStage}
        p1Choice={engine.p1Choice} customChars={customChars}
      />

      {/* Clickable stage hit areas */}
      {ARCADE_STAGES.map((_, i) => {
        const pos = stagePos(i);
        const isLocked = i > currentStage;
        return (
          <div key={i}
            onMouseEnter={() => !isLocked && setHoveredStage(i)}
            onMouseLeave={() => setHoveredStage(null)}
            onClick={() => { if (i === currentStage) handleStart(); }}
            style={{
              position: 'absolute',
              left: `${pos.x * 100}%`, top: `${pos.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 60, height: 60, borderRadius: '50%',
              cursor: isLocked ? 'default' : i === currentStage ? 'pointer' : 'default',
              zIndex: 5,
            }}
          />
        );
      })}

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '12px 24px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(16px, 2.5vw, 28px)', fontWeight: 900, letterSpacing: 8,
            background: 'linear-gradient(180deg, #fff8e0 0%, #ffcc33 40%, #ff8800 70%, #cc6600 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8)) drop-shadow(0 0 10px rgba(255,150,0,0.25))',
          }}>ARCADE</h1>
        </div>
        <button onClick={() => setGameState('MENU')} style={{
          padding: '6px 20px', background: 'rgba(255,204,51,0.05)',
          border: '1.5px solid rgba(255,204,51,0.25)', color: '#ffcc33',
          cursor: 'pointer', fontFamily: "'Orbitron', monospace",
          fontSize: 9, letterSpacing: 3, fontWeight: 700, transition: 'all 0.3s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#ffcc33'; e.currentTarget.style.boxShadow = '0 0 10px rgba(255,204,51,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,204,51,0.25)'; e.currentTarget.style.boxShadow = 'none'; }}
        >VOLVER</button>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: '16px 24px 12px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: "'Orbitron', monospace", fontSize: 8,
            letterSpacing: 4, color: 'rgba(255,204,51,0.4)', marginBottom: 3,
          }}>STAGE {activeStage + 1} / {ARCADE_STAGES.length}</div>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(14px, 2vw, 22px)', fontWeight: 900,
            letterSpacing: 4, color: activeColor,
            textShadow: `0 0 12px ${activeColor}35`,
          }}>{activeData?.label}</div>
          <div style={{
            fontFamily: "'Orbitron', monospace", fontSize: 9,
            color: '#556', letterSpacing: 2, marginTop: 3,
          }}>{activeData?.description}</div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {ARCADE_STAGES.map((s, i) => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: i < currentStage ? stageColors[s.type] : i === currentStage ? `${stageColors[s.type]}50` : '#111',
              border: `1px solid ${i <= currentStage ? stageColors[s.type] + '50' : '#1a1a2e'}`,
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {currentStage < ARCADE_STAGES.length && (
          <button onClick={handleStart} style={{
            padding: '9px 30px',
            background: `linear-gradient(180deg, ${activeColor}15, ${activeColor}05)`,
            border: `2px solid ${activeColor}60`, color: activeColor,
            cursor: 'pointer', fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(10px, 1.2vw, 14px)', letterSpacing: 5, fontWeight: 900,
            transition: 'all 0.3s', textShadow: `0 0 8px ${activeColor}40`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = activeColor;
            e.currentTarget.style.boxShadow = `0 0 20px ${activeColor}30`;
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = `${activeColor}60`;
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          >LUCHAR</button>
        )}
      </div>
    </div>
  );
};

export default ArcadeTower;
