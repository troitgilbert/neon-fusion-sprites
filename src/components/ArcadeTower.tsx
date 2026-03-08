import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA } from '../game/constants';
import type { ArcadeStage, CustomCharData } from '../game/types';

const ARCADE_STAGES: ArcadeStage[] = [
  { type: 'fight', label: 'COMBATE', description: 'Un oponente aleatorio' },
  { type: 'army', label: 'EJÉRCITO', description: '20 versiones con vida reducida' },
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
  fight: '#00ffff',
  army: '#ff8c00',
  minigame: '#00ff66',
  '2v2': '#ffff00',
  '3vGiant': '#ff00ff',
  miniboss: '#ff4444',
  boss: '#ffffff',
};

const stageSymbols: Record<string, string> = {
  fight: 'VS',
  army: 'x20',
  minigame: 'MG',
  '2v2': '2v2',
  '3vGiant': '3v1',
  miniboss: 'MB',
  boss: '!!!',
};

// J-shape constellation positions (normalized 0-1, mapped to container)
// The J goes: top-right vertical down, then curves left at bottom
const J_POSITIONS = [
  { x: 0.72, y: 0.06 },  // 10 - BIG BANG (top of J)
  { x: 0.72, y: 0.16 },  // 9
  { x: 0.71, y: 0.27 },  // 8
  { x: 0.70, y: 0.38 },  // 7
  { x: 0.69, y: 0.49 },  // 6
  { x: 0.67, y: 0.59 },  // 5
  { x: 0.62, y: 0.69 },  // 4 - curve starts
  { x: 0.52, y: 0.78 },  // 3
  { x: 0.38, y: 0.84 },  // 2
  { x: 0.24, y: 0.82 },  // 1 - bottom-left hook of J
];

// Helper: draw chibi character (simplified version for preview)
function drawCharPreview(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, scale: number,
  charIdx: number, customChar: CustomCharData | null, time: number
) {
  const s = scale;
  const R = 25 * s;

  const skinC = customChar ? customChar.skinColor : (charIdx === 0 ? '#f5deb3' : '#f5deb3');
  const hairC = customChar ? (customChar.hairColor || customChar.clothesColor) : (charIdx === 0 ? '#8B4513' : '#ffffff');
  const clothC = customChar ? customChar.clothesColor : (charIdx === 0 ? '#b00000' : '#f0f0f5');
  const pantsC = customChar ? (customChar.pantsColor || '#1a1a2e') : (charIdx === 0 ? '#1a1a2e' : '#111111');
  const eyeC = customChar ? customChar.eyesColor : (charIdx === 0 ? '#00ffff' : '#ffff00');

  // Breathing
  const breath = Math.sin(time * 0.04) * 0.02;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 1 + breath);

  // Outer glow
  ctx.save();
  ctx.globalAlpha = 0.15;
  const glow = ctx.createRadialGradient(0, 0, R * 0.5, 0, 0, R * 1.8);
  glow.addColorStop(0, eyeC);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, R * 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Head
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
  const skinGrad = ctx.createRadialGradient(-R * 0.2, -R * 0.2, 0, R * 0.1, R * 0.1, R);
  skinGrad.addColorStop(0, lighten(skinC, 30));
  skinGrad.addColorStop(0.5, skinC);
  skinGrad.addColorStop(1, darken(skinC, 40));
  ctx.fillStyle = skinGrad; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5 * s; ctx.stroke();

  // Clothes
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, R * 0.99, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = clothC;
  ctx.fillRect(-R * 1.1, 0, R * 2.2, R * 0.4);
  ctx.fillStyle = pantsC;
  ctx.fillRect(-R * 1.1, R * 0.4, R * 2.2, R * 0.7);
  ctx.restore();

  // Hair
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, R * 0.99, 0, Math.PI * 2); ctx.clip();
  ctx.translate(0, -R * 0.65);
  ctx.scale(1, 0.7);
  ctx.beginPath(); ctx.arc(0, 0, R * 0.8, Math.PI, 0);
  ctx.fillStyle = hairC; ctx.fill();
  ctx.restore();

  // Eyes
  ctx.fillStyle = eyeC;
  ctx.beginPath(); ctx.arc(-R * 0.2, -R * 0.22, R * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(R * 0.2, -R * 0.22, R * 0.12, 0, Math.PI * 2); ctx.fill();
  // Pupils
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.arc(-R * 0.2, -R * 0.22, R * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(R * 0.2, -R * 0.22, R * 0.05, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

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

// Full constellation canvas (background + path + nodes + character)
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
    bg.addColorStop(0, '#06050a');
    bg.addColorStop(0.5, '#0a0810');
    bg.addColorStop(1, '#050408');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 200; i++) {
      const sx = ((i * 137.5 + 50) % W);
      const sy = ((i * 97.3 + 30) % H);
      const twinkle = (Math.sin(t * 0.015 + i * 2.1) + 1) * 0.5;
      ctx.globalAlpha = 0.15 + twinkle * 0.4;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.4 + twinkle * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = i % 7 === 0 ? '#ffddaa' : '#aabbdd';
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Compute pixel positions for J shape (reversed: index 0 = stage 10 at top)
    const positions = J_POSITIONS.map(p => ({
      x: p.x * W,
      y: p.y * H,
    }));

    // Map stage index to position (stage 0 = bottom = positions[9], stage 9 = top = positions[0])
    const stagePos = (stageIdx: number) => positions[9 - stageIdx];

    // Draw constellation lines
    for (let i = 0; i < ARCADE_STAGES.length - 1; i++) {
      const from = stagePos(i);
      const to = stagePos(i + 1);
      const isCompleted = i < currentStage;
      const isCurrent = i === currentStage;

      // Line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);

      if (isCompleted) {
        ctx.strokeStyle = '#ffcc33';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.7;
        ctx.shadowColor = '#ffcc33';
        ctx.shadowBlur = 10;
      } else if (isCurrent) {
        ctx.strokeStyle = '#ffcc33';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3 + Math.sin(t * 0.04) * 0.15;
        ctx.setLineDash([6, 6]);
      } else {
        ctx.strokeStyle = '#334';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.setLineDash([3, 6]);
      }
      ctx.stroke();
      ctx.restore();
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
      const nodeR = isCurrent || isHovered ? 18 : 14;

      // Node glow
      if (isCurrent || isHovered) {
        ctx.save();
        ctx.globalAlpha = 0.2 + Math.sin(t * 0.05) * 0.1;
        const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, nodeR * 3);
        glow.addColorStop(0, color);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, nodeR * 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // Node circle
      ctx.beginPath(); ctx.arc(pos.x, pos.y, nodeR, 0, Math.PI * 2);
      if (isCompleted) {
        const grad = ctx.createRadialGradient(pos.x - 3, pos.y - 3, 0, pos.x, pos.y, nodeR);
        grad.addColorStop(0, lighten(color, 40));
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
      } else if (isCurrent) {
        ctx.fillStyle = `${color}25`;
      } else {
        ctx.fillStyle = isLocked ? 'rgba(15,15,25,0.9)' : 'rgba(20,20,35,0.9)';
      }
      ctx.fill();
      ctx.strokeStyle = isLocked ? '#222' : isCurrent ? color : isCompleted ? `${color}90` : '#333';
      ctx.lineWidth = isCurrent ? 2.5 : 2;
      ctx.stroke();

      // Node text
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isCompleted) {
        ctx.font = `bold ${nodeR * 0.9}px Orbitron, monospace`;
        ctx.fillStyle = '#000';
        ctx.fillText('✓', pos.x, pos.y + 1);
      } else {
        ctx.font = `bold ${nodeR * 0.55}px Orbitron, monospace`;
        ctx.fillStyle = isLocked ? '#333' : color;
        ctx.globalAlpha = isLocked ? 0.4 : 1;
        ctx.fillText(stageSymbols[stage.type], pos.x, pos.y + 1);
      }
      ctx.restore();

      // Stage number label
      ctx.save();
      ctx.font = `bold ${10}px Orbitron, monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = isLocked ? '#222' : isCurrent ? '#ffcc33' : isCompleted ? '#888' : '#444';
      ctx.globalAlpha = isLocked ? 0.4 : 1;
      ctx.fillText(`${i + 1}`, pos.x, pos.y + nodeR + 14);
      ctx.restore();

      // Stage name for current/hovered
      if (isCurrent || isHovered) {
        ctx.save();
        ctx.font = `bold 10px Orbitron, monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        ctx.fillText(stage.label, pos.x, pos.y - nodeR - 8);
        ctx.restore();
      }
    }

    // Draw player character at current stage position
    if (p1Choice !== null) {
      const charPos = stagePos(currentStage);
      const customChar = p1Choice >= 100 ? customChars[p1Choice - 100] : null;
      const charIdx = p1Choice < 100 ? p1Choice : -1;
      
      // Position character slightly to the left of the node
      const charX = charPos.x - 40;
      const charY = charPos.y;
      
      // Bobbing animation
      const bob = Math.sin(t * 0.03) * 3;
      
      drawCharPreview(ctx, charX, charY + bob, 0.7, charIdx, customChar, t);
    }

    // Vignette
    const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.65);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,0,0.55)');
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

  const handleStart = () => {
    engine.startArcadeStage(currentStage);
  };

  const activeStage = hoveredStage !== null ? hoveredStage : currentStage;
  const activeData = ARCADE_STAGES[activeStage];
  const activeColor = stageColors[activeData?.type] || '#fff';

  // Clickable overlay zones for each stage node
  const stagePos = (i: number) => J_POSITIONS[9 - i];

  return (
    <div className="fixed inset-0 z-50" style={{ overflow: 'hidden' }}>
      <ConstellationCanvas
        currentStage={currentStage}
        hoveredStage={hoveredStage}
        p1Choice={engine.p1Choice}
        customChars={customChars}
      />

      {/* Clickable stage hit areas */}
      {ARCADE_STAGES.map((stage, i) => {
        const pos = stagePos(i);
        const isLocked = i > currentStage;
        return (
          <div
            key={i}
            onMouseEnter={() => !isLocked && setHoveredStage(i)}
            onMouseLeave={() => setHoveredStage(null)}
            onClick={() => { if (i === currentStage) handleStart(); }}
            style={{
              position: 'absolute',
              left: `${pos.x * 100}%`, top: `${pos.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 50, height: 50,
              borderRadius: '50%',
              cursor: isLocked ? 'default' : i === currentStage ? 'pointer' : 'default',
              zIndex: 5,
            }}
          />
        );
      })}

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '14px 30px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(18px, 3vw, 32px)', fontWeight: 900,
            letterSpacing: 8,
            background: 'linear-gradient(180deg, #fff8e0 0%, #ffcc33 40%, #ff8800 70%, #cc6600 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8)) drop-shadow(0 0 12px rgba(255,150,0,0.3))',
          }}>TORRE ARCADE</h1>
          <div style={{
            fontFamily: "'Orbitron', monospace", fontSize: 'clamp(7px, 0.9vw, 10px)',
            letterSpacing: 4, color: 'rgba(255,204,51,0.4)', marginTop: 2,
          }}>STAGE {activeStage + 1} / {ARCADE_STAGES.length}</div>
        </div>

        <button onClick={() => setGameState('MENU')} style={{
          padding: '7px 22px', background: 'rgba(255,204,51,0.06)',
          border: '1.5px solid rgba(255,204,51,0.3)', color: '#ffcc33',
          cursor: 'pointer', fontFamily: "'Orbitron', monospace",
          fontSize: 10, letterSpacing: 3, fontWeight: 700,
          transition: 'all 0.3s', marginTop: 4,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#ffcc33'; e.currentTarget.style.boxShadow = '0 0 12px rgba(255,204,51,0.2)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,204,51,0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
        >VOLVER</button>
      </div>

      {/* Bottom info panel */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: '20px 30px 16px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Stage info */}
        <div>
          <div style={{
            fontFamily: "'Orbitron', monospace", fontSize: 'clamp(7px, 0.8vw, 9px)',
            letterSpacing: 4, color: 'rgba(255,204,51,0.5)', marginBottom: 4,
          }}>STAGE {activeStage + 1}</div>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(16px, 2.5vw, 26px)', fontWeight: 900,
            letterSpacing: 4, color: activeColor,
            textShadow: `0 0 15px ${activeColor}40`,
          }}>{activeData?.label}</div>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(8px, 1vw, 11px)',
            color: '#667', letterSpacing: 2, marginTop: 4,
          }}>{activeData?.description}</div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {ARCADE_STAGES.map((s, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i < currentStage ? stageColors[s.type] : i === currentStage ? `${stageColors[s.type]}60` : '#1a1a2e',
              border: `1px solid ${i <= currentStage ? stageColors[s.type] + '60' : '#222'}`,
              boxShadow: i === currentStage ? `0 0 6px ${stageColors[s.type]}40` : 'none',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* Fight button */}
        {currentStage < ARCADE_STAGES.length && (
          <button onClick={handleStart} style={{
            padding: '10px 35px',
            background: `linear-gradient(180deg, ${activeColor}18, ${activeColor}06)`,
            border: `2px solid ${activeColor}70`,
            color: activeColor,
            cursor: 'pointer', fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(11px, 1.3vw, 15px)', letterSpacing: 5, fontWeight: 900,
            transition: 'all 0.3s',
            textShadow: `0 0 10px ${activeColor}50`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = activeColor;
            e.currentTarget.style.boxShadow = `0 0 25px ${activeColor}35, inset 0 0 15px ${activeColor}08`;
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = `${activeColor}70`;
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
