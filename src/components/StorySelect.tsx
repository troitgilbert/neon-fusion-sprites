import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../game/GameContext';
import { playSelectSound, playConfirmSound } from '../game/audio';

interface StoryChar {
  skinColor: string; hairColor: string; clothesColor: string;
  pantsColor: string; shoesColor: string; handsColor: string; eyeColor: string;
}

const CHAR_EDOWADO: StoryChar = {
  skinColor: '#f5deb3', hairColor: '#8B4513', clothesColor: '#b00000',
  pantsColor: '#1a1a2e', shoesColor: '#333', handsColor: '#f5deb3', eyeColor: '#00ffff',
};
const CHAR_KAITO: StoryChar = {
  skinColor: '#fff', hairColor: '#fff', clothesColor: '#222',
  pantsColor: '#111', shoesColor: '#444', handsColor: '#fff', eyeColor: '#ffff00',
};

const STORIES = [
  {
    id: 'complete', name: 'HISTORIA COMPLETA', color: '#ffcc33', accent: '#ff8800',
    description: 'Vive la historia completa del universo. Todos los capítulos, todos los personajes, todos los secretos revelados en un épico viaje sin interrupciones.',
    icon: '⚔️', chapters: 24, difficulty: 'ÉPICA',
    chars: [CHAR_EDOWADO, CHAR_KAITO],
  },
  {
    id: 'edowado', name: 'EDOWADO', color: '#00ddff', accent: '#0088cc',
    description: 'La historia de un guerrero que busca proteger lo que queda del universo. Su poder interior despierta ante las amenazas del vacío.',
    icon: '🔥', chapters: 8, difficulty: 'DIFÍCIL',
    chars: [CHAR_EDOWADO],
  },
  {
    id: 'kaito', name: 'KAITO', color: '#ffee44', accent: '#ccaa00',
    description: 'Un luchador veloz con un pasado oscuro. Su camino lo lleva a confrontar la verdad sobre su propia existencia.',
    icon: '⚡', chapters: 8, difficulty: 'NORMAL',
    chars: [CHAR_KAITO],
  },
  {
    id: 'custom', name: 'PERSONALIZADO', color: '#dd44ff', accent: '#9900cc',
    description: 'Crea tu propia historia. Elige tu personaje personalizado y forja un camino único a través del universo.',
    icon: '✦', chapters: 6, difficulty: 'VARIABLE',
    chars: null,
  },
];

// Draw a fighter character on canvas — facing direction: 1=right, -1=left
function drawChar(ctx: CanvasRenderingContext2D, cx: number, cy: number, c: StoryChar, scale: number, time: number, facing: number = 1) {
  const s = scale;
  const r = 25 * s;
  const handSwing = Math.sin(time * 0.03) * 5 * s;
  const f = facing; // 1 = face right, -1 = face left

  // Ground shadow
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 1.15, r * 0.8, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // === SHOES ===
  ctx.fillStyle = c.shoesColor;
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5 * s;
  ctx.beginPath(); ctx.arc(cx - r * 0.35, cy + r * 1.0, r * 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + r * 0.35, cy + r * 1.0, r * 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // === PANTS (two legs) ===
  ctx.fillStyle = c.pantsColor;
  // Left leg
  ctx.beginPath();
  ctx.roundRect(cx - r * 0.55, cy + r * 0.42, r * 0.45, r * 0.6, [0, 0, 4 * s, 4 * s]);
  ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1 * s; ctx.stroke();
  // Right leg
  ctx.beginPath();
  ctx.roundRect(cx + r * 0.1, cy + r * 0.42, r * 0.45, r * 0.6, [0, 0, 4 * s, 4 * s]);
  ctx.fill();
  ctx.stroke();
  // Pants shading (inner seam)
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#000';
  ctx.fillRect(cx - r * 0.1, cy + r * 0.45, r * 0.2, r * 0.55);
  ctx.restore();
  // Belt
  ctx.fillStyle = '#222';
  ctx.fillRect(cx - r * 0.6, cy + r * 0.38, r * 1.2, r * 0.1);
  ctx.strokeStyle = '#555'; ctx.lineWidth = 0.5 * s;
  ctx.strokeRect(cx - r * 0.6, cy + r * 0.38, r * 1.2, r * 0.1);
  // Belt buckle
  ctx.fillStyle = '#aa8833';
  ctx.fillRect(cx - r * 0.08, cy + r * 0.39, r * 0.16, r * 0.08);

  // === BODY (torso with clothes) ===
  ctx.beginPath();
  ctx.roundRect(cx - r * 0.7, cy - r * 0.3, r * 1.4, r * 0.75, [6 * s, 6 * s, 0, 0]);
  ctx.fillStyle = c.clothesColor; ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5 * s; ctx.stroke();
  // Torso shading (3D effect)
  ctx.save();
  const torsoGrad = ctx.createLinearGradient(cx - r * 0.7, 0, cx + r * 0.7, 0);
  torsoGrad.addColorStop(0, f > 0 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)');
  torsoGrad.addColorStop(0.5, 'transparent');
  torsoGrad.addColorStop(1, f > 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.15)');
  ctx.fillStyle = torsoGrad;
  ctx.fillRect(cx - r * 0.7, cy - r * 0.3, r * 1.4, r * 0.75);
  ctx.restore();
  // Collar detail
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.25, cy - r * 0.3);
  ctx.lineTo(cx, cy - r * 0.1);
  ctx.lineTo(cx + r * 0.25, cy - r * 0.3);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5 * s; ctx.stroke();

  // === ARMS + HANDS ===
  ctx.strokeStyle = c.clothesColor; ctx.lineWidth = 8 * s;
  // Left arm
  ctx.beginPath(); ctx.moveTo(cx - r * 0.7, cy - r * 0.1);
  ctx.lineTo(cx - r * 1.1, cy + r * 0.2 + handSwing); ctx.stroke();
  // Right arm
  ctx.beginPath(); ctx.moveTo(cx + r * 0.7, cy - r * 0.1);
  ctx.lineTo(cx + r * 1.1, cy + r * 0.2 - handSwing); ctx.stroke();
  // Arm shading
  ctx.save(); ctx.globalAlpha = 0.2; ctx.strokeStyle = '#000'; ctx.lineWidth = 3 * s;
  ctx.beginPath(); ctx.moveTo(cx - r * 0.7, cy - r * 0.1);
  ctx.lineTo(cx - r * 1.1, cy + r * 0.2 + handSwing); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + r * 0.7, cy - r * 0.1);
  ctx.lineTo(cx + r * 1.1, cy + r * 0.2 - handSwing); ctx.stroke();
  ctx.restore();

  // Hands (skin)
  ctx.fillStyle = c.handsColor;
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1 * s;
  ctx.beginPath(); ctx.arc(cx - r * 1.1, cy + r * 0.2 + handSwing, r * 0.18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + r * 1.1, cy + r * 0.2 - handSwing, r * 0.18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Hand shading
  ctx.save(); ctx.globalAlpha = 0.15;
  ctx.beginPath(); ctx.arc(cx - r * 1.1 - 1 * s, cy + r * 0.22 + handSwing, r * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = '#000'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 1.1 - 1 * s, cy + r * 0.22 - handSwing, r * 0.12, 0, Math.PI * 2);
  ctx.fill(); ctx.restore();

  // === HEAD ===
  ctx.beginPath(); ctx.arc(cx, cy - r * 0.55, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = c.skinColor; ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5 * s; ctx.stroke();
  // Head shading
  ctx.save();
  const headGrad = ctx.createRadialGradient(cx + f * r * 0.15, cy - r * 0.65, r * 0.1, cx, cy - r * 0.55, r * 0.55);
  headGrad.addColorStop(0, 'rgba(255,255,255,0.12)');
  headGrad.addColorStop(0.5, 'transparent');
  headGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = headGrad;
  ctx.beginPath(); ctx.arc(cx, cy - r * 0.55, r * 0.54, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // === HAIR ===
  ctx.save();
  ctx.translate(cx, cy - r * 0.85);
  ctx.scale(1, 0.75);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.6, Math.PI, 0);
  ctx.fillStyle = c.hairColor; ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1 * s; ctx.stroke();
  // Hair highlight
  ctx.globalAlpha = 0.2;
  ctx.beginPath(); ctx.arc(f * r * 0.1, -r * 0.05, r * 0.35, Math.PI, 0);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
  ctx.restore();
  // Side hair strands
  ctx.fillStyle = c.hairColor;
  ctx.beginPath();
  ctx.ellipse(cx + f * r * 0.45, cy - r * 0.6, r * 0.12, r * 0.3, f * 0.3, 0, Math.PI * 2);
  ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8 * s; ctx.stroke();

  // === EYES (facing direction) ===
  const eyeOffX = f * r * 0.12; // shift eyes toward facing direction
  const eyeLX = cx + eyeOffX - 5 * s;
  const eyeRX = cx + eyeOffX + 5 * s;
  const eyeY = cy - r * 0.55;
  // Eye whites
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(eyeLX, eyeY, 4 * s, 3.5 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(eyeRX, eyeY, 4 * s, 3.5 * s, 0, 0, Math.PI * 2); ctx.fill();
  // Pupils
  ctx.fillStyle = c.eyeColor;
  ctx.beginPath(); ctx.arc(eyeLX + f * 1.2 * s, eyeY, 2.5 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(eyeRX + f * 1.2 * s, eyeY, 2.5 * s, 0, Math.PI * 2); ctx.fill();
  // Eye outline
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1 * s;
  ctx.beginPath(); ctx.ellipse(eyeLX, eyeY, 4 * s, 3.5 * s, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(eyeRX, eyeY, 4 * s, 3.5 * s, 0, 0, Math.PI * 2); ctx.stroke();

  // Eye glow
  ctx.save();
  ctx.globalAlpha = 0.3;
  const glow = ctx.createRadialGradient(cx + eyeOffX, eyeY, 0, cx + eyeOffX, eyeY, 14 * s);
  glow.addColorStop(0, c.eyeColor);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(cx + eyeOffX - 14 * s, eyeY - 14 * s, 28 * s, 28 * s);
  ctx.restore();
}

const CharacterPreview: React.FC<{ chars: StoryChar[] | null; color: string; accent: string; id: string }> = ({ chars, color, accent, id }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = 200, h = 200;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);
    timeRef.current++;
    const t = timeRef.current;

    if (chars && chars.length > 0) {
      if (chars.length === 1) {
        drawChar(ctx, w / 2, h / 2 + 10, chars[0], 2.2, t);
      } else {
        drawChar(ctx, w / 2 - 35, h / 2 + 10, chars[0], 1.6, t);
        drawChar(ctx, w / 2 + 35, h / 2 + 10, chars[1], 1.6, t + 50);
      }
    } else {
      // Custom: question mark
      ctx.fillStyle = color;
      ctx.font = 'bold 60px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.7 + Math.sin(t * 0.05) * 0.3;
      ctx.fillText('?', w / 2, h / 2);
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(draw);
  }, [chars, color]);

  useEffect(() => {
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [draw]);

  return (
    <div style={{
      width: 200, height: 200,
      borderRadius: '50%',
      overflow: 'hidden',
      border: `3px solid ${color}60`,
      boxShadow: `0 0 40px ${color}25, 0 0 80px ${color}10, inset 0 0 30px ${color}15`,
      marginBottom: 'clamp(16px, 2.5vh, 30px)',
      position: 'relative',
      background: `radial-gradient(circle at 35% 35%, ${color}20, rgba(10,5,20,0.95))`,
    }}>
      {/* Orbital ring */}
      <div style={{
        position: 'absolute', inset: -12,
        border: `1px solid ${color}20`,
        borderRadius: '50%',
        animation: 'storyOrbit 8s linear infinite',
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)',
          width: 6, height: 6, borderRadius: '50%',
          background: color,
          boxShadow: `0 0 10px ${color}`,
        }} />
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

const StorySelect: React.FC = () => {
  const { setGameState } = useGame();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 400);
    const t3 = setTimeout(() => setPhase(3), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setSelectedIdx(i => (i + 1) % STORIES.length);
        playSelectSound();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setSelectedIdx(i => (i - 1 + STORIES.length) % STORIES.length);
        playSelectSound();
      }
      if (e.key === 'Enter') playConfirmSound();
      if (e.key === 'Escape') setGameState('MENU');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setGameState]);

  const selected = STORIES[selectedIdx];

  return (
    <div className="fixed inset-0 z-50" style={{
      background: 'radial-gradient(ellipse at 30% 20%, rgba(40,15,0,0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(0,20,60,0.3) 0%, transparent 50%), #060208',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Ambient particles */}
      {phase >= 2 && Array.from({ length: 30 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: Math.random() * 2 + 1,
          height: Math.random() * 2 + 1,
          background: `rgba(${150 + Math.random() * 105},${100 + Math.random() * 100},${50 + Math.random() * 100},${0.2 + Math.random() * 0.4})`,
          borderRadius: '50%',
          animation: `storyFloat ${6 + Math.random() * 8}s ease-in-out ${Math.random() * 4}s infinite alternate`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Decorative top line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent 10%, ${selected.color}40 30%, ${selected.color}80 50%, ${selected.color}40 70%, transparent 90%)`,
        boxShadow: `0 0 20px ${selected.color}30`,
        transition: 'all 0.5s',
      }} />

      {/* ══════ HEADER ══════ */}
      <div style={{
        flexShrink: 0, padding: 'clamp(20px, 4vh, 40px) clamp(20px, 4vw, 60px)',
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div style={{ width: 'clamp(40px, 8vw, 80px)', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,180,50,0.4))' }} />
          <span style={{ fontSize: 'clamp(8px, 0.9vw, 11px)', letterSpacing: 6, color: 'rgba(255,180,80,0.4)', fontFamily: "'Orbitron', monospace" }}>MODO</span>
          <div style={{ width: 'clamp(40px, 8vw, 80px)', height: 1, background: 'linear-gradient(270deg, transparent, rgba(255,180,50,0.4))' }} />
        </div>
        <h1 style={{
          fontFamily: "'Orbitron', serif", fontSize: 'clamp(28px, 4.5vw, 56px)',
          fontWeight: 900, letterSpacing: 'clamp(4px, 1vw, 12px)',
          color: '#e8d5a3',
          textShadow: '0 0 25px rgba(255,120,0,0.5), 0 0 60px rgba(255,60,0,0.2), 0 2px 0 #8b6914',
        }}>
          HISTORIA
        </h1>
      </div>

      {/* ══════ MAIN CONTENT ══════ */}
      <div style={{
        flex: 1, minHeight: 0,
        display: 'flex', flexDirection: 'row',
        padding: '0 clamp(20px, 4vw, 60px)',
        gap: 'clamp(20px, 3vw, 50px)',
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 0.8s ease 0.2s',
      }}>
        {/* LEFT: Story cards (capsule style) */}
        <div style={{
          width: 'clamp(280px, 34vw, 420px)',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          gap: 6,
        }}>
          {STORIES.map((story, i) => {
            const active = selectedIdx === i;
            const num = String(i + 1).padStart(2, '0');
            return (
              <button
                key={story.id}
                onClick={() => { setSelectedIdx(i); playConfirmSound(); }}
                onMouseEnter={() => { setSelectedIdx(i); playSelectSound(); }}
                style={{
                  position: 'relative', width: '100%', padding: 0,
                  cursor: 'pointer', border: 'none', background: 'transparent',
                  display: 'flex', alignItems: 'center', gap: 0,
                  transform: active ? 'translateX(8px) scale(1.03)' : 'scale(1)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  animation: `storyCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.08 * i}s both`,
                  filter: active ? 'brightness(1.2)' : 'brightness(0.6)',
                }}
              >
                {/* Number badge */}
                <div style={{
                  width: 'clamp(36px, 3.8vw, 52px)',
                  height: 'clamp(36px, 3.8vw, 52px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active
                    ? `linear-gradient(135deg, ${story.color}, ${story.accent})`
                    : 'linear-gradient(135deg, #5a5040, #3a3028, #2a2018)',
                  borderRadius: 'clamp(18px, 1.9vw, 26px) 0 0 clamp(18px, 1.9vw, 26px)',
                  fontFamily: "'Orbitron', monospace",
                  fontSize: 'clamp(12px, 1.3vw, 18px)',
                  fontWeight: 900,
                  color: active ? '#0a0500' : '#3a3530',
                  textShadow: active ? '0 1px 0 rgba(255,255,200,0.3)' : 'none',
                  flexShrink: 0,
                  boxShadow: active
                    ? `0 0 20px ${story.color}50, inset 0 1px 0 rgba(255,255,200,0.3)`
                    : 'inset 0 1px 0 rgba(255,255,255,0.08)',
                  transition: 'all 0.25s',
                }}>
                  {num}
                </div>

                {/* Label capsule */}
                <div style={{
                  flex: 1,
                  height: 'clamp(36px, 3.8vw, 52px)',
                  display: 'flex', alignItems: 'center',
                  padding: '0 clamp(14px, 1.6vw, 22px)',
                  background: active
                    ? `linear-gradient(180deg, rgba(${hexToRgb(story.accent)},0.25), rgba(${hexToRgb(story.accent)},0.08))`
                    : 'linear-gradient(180deg, rgba(40,35,28,0.8), rgba(20,16,10,0.9))',
                  borderRadius: '0 clamp(18px, 1.9vw, 26px) clamp(18px, 1.9vw, 26px) 0',
                  border: active ? `1px solid ${story.color}50` : '1px solid rgba(100,80,50,0.15)',
                  borderLeft: 'none',
                  position: 'relative', overflow: 'hidden',
                  boxShadow: active ? `0 0 25px ${story.color}15` : 'none',
                  transition: 'all 0.25s',
                }}>
                  {/* Sheen */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: active
                      ? `linear-gradient(180deg, rgba(${hexToRgb(story.color)},0.1) 0%, transparent 30%)`
                      : 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 40%)',
                    pointerEvents: 'none',
                  }} />

                  {active && <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(90deg, transparent 20%, ${story.color}08 45%, transparent 80%)`,
                    animation: 'storySweep 2.5s ease-in-out infinite',
                    pointerEvents: 'none',
                  }} />}

                  {/* Dots */}
                  <div style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    display: 'flex', gap: 3, opacity: active ? 0.5 : 0.12,
                  }}>
                    {Array.from({ length: 5 }).map((_, di) => (
                      <div key={di} style={{
                        width: 4, height: 4, borderRadius: '50%',
                        background: active ? story.color : 'rgba(150,130,100,0.3)',
                        boxShadow: active ? `0 0 4px ${story.color}60` : 'none',
                      }} />
                    ))}
                  </div>

                  <span style={{
                    position: 'relative', zIndex: 1,
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontFamily: "'Orbitron', serif",
                    fontSize: 'clamp(12px, 1.3vw, 17px)',
                    fontWeight: active ? 800 : 600,
                    letterSpacing: active ? 3 : 1.5,
                    color: active ? story.color : 'rgba(180,160,130,0.45)',
                    textShadow: active ? `0 0 15px ${story.color}60` : 'none',
                    transition: 'all 0.25s',
                  }}>
                    <span style={{ fontSize: 'clamp(14px, 1.5vw, 20px)' }}>{story.icon}</span>
                    {story.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT: Detail panel */}
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {/* Character canvas */}
          <CharacterPreview chars={selected.chars} color={selected.color} accent={selected.accent} id={selected.id} />

          {/* Story name */}
          <h2 style={{
            fontFamily: "'Orbitron', serif",
            fontSize: 'clamp(22px, 3vw, 38px)',
            fontWeight: 900,
            letterSpacing: 'clamp(4px, 0.8vw, 10px)',
            color: selected.color,
            textShadow: `0 0 20px ${selected.color}60, 0 0 50px ${selected.accent}30`,
            marginBottom: 8,
            transition: 'all 0.4s',
          }}>
            {selected.name}
          </h2>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: 'clamp(16px, 2vw, 30px)',
            marginBottom: 'clamp(12px, 2vh, 20px)',
          }}>
            {[
              { label: 'CAPÍTULOS', value: selected.chapters },
              { label: 'DIFICULTAD', value: selected.difficulty },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 'clamp(6px, 0.65vw, 8px)', letterSpacing: 4,
                  color: 'rgba(200,160,100,0.35)', fontFamily: "'Orbitron', monospace",
                  marginBottom: 4,
                }}>{stat.label}</div>
                <div style={{
                  fontSize: 'clamp(14px, 1.5vw, 20px)', fontWeight: 900,
                  color: selected.color, fontFamily: "'Orbitron', monospace",
                  textShadow: `0 0 8px ${selected.color}40`,
                }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Separator */}
          <div style={{
            width: 'clamp(120px, 16vw, 220px)', height: 1, marginBottom: 'clamp(12px, 2vh, 20px)',
            background: `linear-gradient(90deg, transparent, ${selected.color}40, transparent)`,
          }} />

          {/* Description */}
          <p style={{
            maxWidth: 'clamp(280px, 28vw, 400px)',
            fontSize: 'clamp(10px, 1vw, 13px)',
            lineHeight: 1.8,
            color: 'rgba(200,185,160,0.55)',
            fontFamily: "'Orbitron', sans-serif",
            textAlign: 'center',
            transition: 'all 0.4s',
          }}>
            {selected.description}
          </p>

          {/* Start button */}
          <button
            onClick={() => playConfirmSound()}
            style={{
              marginTop: 'clamp(20px, 3vh, 35px)',
              padding: 'clamp(10px, 1.2vh, 14px) clamp(30px, 4vw, 50px)',
              background: `linear-gradient(135deg, ${selected.color}20, ${selected.accent}15)`,
              border: `2px solid ${selected.color}50`,
              borderRadius: 'clamp(20px, 2vw, 30px)',
              color: selected.color,
              fontFamily: "'Orbitron', serif",
              fontSize: 'clamp(12px, 1.2vw, 16px)',
              fontWeight: 800,
              letterSpacing: 4,
              cursor: 'pointer',
              transition: 'all 0.3s',
              textShadow: `0 0 10px ${selected.color}40`,
              boxShadow: `0 0 20px ${selected.color}15`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${selected.color}35, ${selected.accent}25)`;
              e.currentTarget.style.boxShadow = `0 0 35px ${selected.color}30`;
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${selected.color}20, ${selected.accent}15)`;
              e.currentTarget.style.boxShadow = `0 0 20px ${selected.color}15`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ▶ COMENZAR
          </button>
        </div>
      </div>

      {/* ══════ FOOTER ══════ */}
      <div style={{
        flexShrink: 0, height: 'clamp(36px, 5vh, 50px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        opacity: phase >= 3 ? 1 : 0,
        transition: 'opacity 0.8s ease 0.4s',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 10%, rgba(255,120,0,0.15) 50%, transparent 90%)',
        }} />
        <div style={{ display: 'flex', gap: 20 }}>
          {[{ key: '◀▶', label: 'SELECCIONAR' }, { key: '↵', label: 'CONFIRMAR' }, { key: 'ESC', label: 'VOLVER' }].map(c => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                padding: '2px 7px', background: 'rgba(180,60,0,0.08)',
                border: '1px solid rgba(180,60,0,0.15)', borderRadius: 4,
                fontSize: 'clamp(7px, 0.7vw, 9px)', color: 'rgba(200,150,80,0.4)',
                fontFamily: "'Orbitron', monospace",
              }}>{c.key}</span>
              <span style={{
                fontSize: 'clamp(5px, 0.6vw, 7px)', letterSpacing: 2,
                color: 'rgba(180,140,100,0.2)', fontFamily: "'Orbitron', monospace",
              }}>{c.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setGameState('MENU')}
          style={{
            position: 'absolute', left: 'clamp(16px, 3vw, 40px)', top: '50%', transform: 'translateY(-50%)',
            padding: '6px 20px', background: 'rgba(200,50,0,0.06)',
            border: '1px solid rgba(200,50,0,0.15)', borderRadius: 16,
            color: 'rgba(200,120,60,0.4)', cursor: 'pointer',
            fontFamily: "'Orbitron', serif", fontSize: 'clamp(8px, 0.8vw, 11px)',
            fontWeight: 700, letterSpacing: 3,
            transition: 'all 0.25s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#e8a060'; e.currentTarget.style.borderColor = 'rgba(255,120,0,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(200,120,60,0.4)'; e.currentTarget.style.borderColor = 'rgba(200,50,0,0.15)'; }}
        >
          ◀ VOLVER
        </button>
      </div>

      <style>{`
        @keyframes storyCardIn {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes storySweep {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        @keyframes storyPulseGlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        @keyframes storyOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes storyFloat {
          from { transform: translateY(0) translateX(0); opacity: 0.3; }
          to { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default StorySelect;
