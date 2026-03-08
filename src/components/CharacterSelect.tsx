import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA, SHOP_CATALOG } from '../game/constants';
import type { CustomCharData } from '../game/types';
import { playSelectSound, playConfirmSound } from '../game/audio';

// ===== Color helpers =====
function lightenColor(hex: string, amount: number): string {
  const h = hex.startsWith('#') ? hex : '#000000';
  const full = h.length === 4
    ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
    : h;
  const r = Math.min(255, parseInt(full.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(full.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(full.slice(5, 7), 16) + amount);
  return `rgb(${r},${g},${b})`;
}
function darkenColor(hex: string, amount: number): string {
  const h = hex.startsWith('#') ? hex : '#000000';
  const full = h.length === 4
    ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
    : h;
  const r = Math.max(0, parseInt(full.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(full.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(full.slice(5, 7), 16) - amount);
  return `rgb(${r},${g},${b})`;
}

// ===== Draw a chibi character on canvas =====
function drawCharOnCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  skinColor: string, hairColor: string, clothesColor: string,
  pantsColor: string, eyeColor: string, handsColor: string,
  scale: number, time: number, facing: number = 1
) {
  const s = scale;
  const R = 30 * s;
  const f = facing;

  // Outer glow
  ctx.save();
  ctx.globalAlpha = 0.1;
  const outerGlow = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.6);
  outerGlow.addColorStop(0, eyeColor);
  outerGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = outerGlow;
  ctx.beginPath(); ctx.arc(cx, cy, R * 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Head (skin sphere)
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  const skinGrad = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.05, cx + R * 0.1, cy + R * 0.1, R);
  skinGrad.addColorStop(0, lightenColor(skinColor, 30));
  skinGrad.addColorStop(0.5, skinColor);
  skinGrad.addColorStop(1, darkenColor(skinColor, 40));
  ctx.fillStyle = skinGrad; ctx.fill();
  // Rim light
  ctx.save(); ctx.globalAlpha = 0.25;
  const rimGrad = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.4, 0, cx - R * 0.4, cy - R * 0.4, R * 0.7);
  rimGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
  rimGrad.addColorStop(0.4, 'rgba(255,255,255,0.1)');
  rimGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = rimGrad;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Bottom shadow
  ctx.save(); ctx.globalAlpha = 0.2;
  const botShadow = ctx.createLinearGradient(cx, cy + R * 0.3, cx, cy + R);
  botShadow.addColorStop(0, 'transparent');
  botShadow.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = botShadow;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5 * s; ctx.stroke();

  // Clothes + pants (clipped)
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.99, 0, Math.PI * 2); ctx.clip();
  const clothesY = cy;
  const clothesH = R * 0.4;
  const clothGrad = ctx.createLinearGradient(cx, clothesY, cx, clothesY + clothesH);
  clothGrad.addColorStop(0, lightenColor(clothesColor, 15));
  clothGrad.addColorStop(0.5, clothesColor);
  clothGrad.addColorStop(1, darkenColor(clothesColor, 25));
  ctx.fillStyle = clothGrad;
  ctx.fillRect(cx - R * 1.1, clothesY, R * 2.2, clothesH);
  const clothSideGrad = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
  clothSideGrad.addColorStop(0, 'rgba(0,0,0,0.2)');
  clothSideGrad.addColorStop(0.3, 'transparent');
  clothSideGrad.addColorStop(0.7, 'transparent');
  clothSideGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = clothSideGrad;
  ctx.fillRect(cx - R * 1.1, clothesY, R * 2.2, clothesH);
  // Collar V
  ctx.beginPath();
  ctx.moveTo(cx - R * 0.15, clothesY);
  ctx.lineTo(cx, clothesY + R * 0.12);
  ctx.lineTo(cx + R * 0.15, clothesY);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1.5 * s; ctx.stroke();
  // Pants
  const pantsY = clothesY + clothesH;
  const pantsH = R * 0.7;
  const pantsGrad = ctx.createLinearGradient(cx, pantsY, cx, pantsY + pantsH);
  pantsGrad.addColorStop(0, lightenColor(pantsColor, 10));
  pantsGrad.addColorStop(0.5, pantsColor);
  pantsGrad.addColorStop(1, darkenColor(pantsColor, 30));
  ctx.fillStyle = pantsGrad;
  ctx.fillRect(cx - R * 1.1, pantsY, R * 2.2, pantsH);
  ctx.fillStyle = clothSideGrad;
  ctx.fillRect(cx - R * 1.1, pantsY, R * 2.2, pantsH);
  // Belt
  ctx.fillStyle = 'rgba(180,150,80,0.3)';
  ctx.fillRect(cx - R * 0.06, pantsY - 1, R * 0.12, R * 0.06);
  // Seam
  ctx.beginPath();
  ctx.moveTo(cx, pantsY + R * 0.05);
  ctx.lineTo(cx, pantsY + pantsH);
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1 * s; ctx.stroke();
  ctx.restore();

  // Hair
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.99, 0, Math.PI * 2); ctx.clip();
  ctx.translate(cx, cy - R * 0.65);
  ctx.scale(1, 0.7);
  const hairGrad = ctx.createRadialGradient(f * R * 0.1, -R * 0.15, 0, 0, 0, R * 0.8);
  hairGrad.addColorStop(0, lightenColor(hairColor, 20));
  hairGrad.addColorStop(0.6, hairColor);
  hairGrad.addColorStop(1, darkenColor(hairColor, 35));
  ctx.beginPath(); ctx.arc(0, 0, R * 0.8, Math.PI, 0);
  ctx.fillStyle = hairGrad; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1 * s; ctx.stroke();
  ctx.globalAlpha = 0.3;
  ctx.beginPath(); ctx.arc(f * R * 0.15, -R * 0.08, R * 0.35, Math.PI, 0);
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
  ctx.globalAlpha = 0.15;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * R * 0.15, -R * 0.3);
    ctx.quadraticCurveTo(i * R * 0.18, R * 0.1, i * R * 0.12, R * 0.3);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.5 * s; ctx.stroke();
  }
  ctx.restore();

  // Eyes
  const eyeLX = cx - R * 0.2;
  const eyeRX = cx + R * 0.2;
  const eyeY = cy - R * 0.22;
  const eyeR = R * 0.14;
  ctx.save(); ctx.globalAlpha = 0.15;
  const eyeAura = ctx.createRadialGradient(cx, eyeY, 0, cx, eyeY, R * 0.6);
  eyeAura.addColorStop(0, eyeColor);
  eyeAura.addColorStop(1, 'transparent');
  ctx.fillStyle = eyeAura;
  ctx.fillRect(cx - R * 0.6, eyeY - R * 0.4, R * 1.2, R * 0.8);
  ctx.restore();
  [eyeLX, eyeRX].forEach(ex => {
    const eyeGrad = ctx.createRadialGradient(ex - eyeR * 0.3, eyeY - eyeR * 0.3, 0, ex, eyeY, eyeR);
    eyeGrad.addColorStop(0, lightenColor(eyeColor, 50));
    eyeGrad.addColorStop(0.5, eyeColor);
    eyeGrad.addColorStop(1, darkenColor(eyeColor, 30));
    ctx.beginPath(); ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fillStyle = eyeGrad; ctx.fill();
    ctx.save(); ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.arc(ex - eyeR * 0.25, eyeY - eyeR * 0.25, eyeR * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(ex, eyeY, eyeR * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
  });
}

// ===== Character data for canvas =====
interface CharRenderData {
  name: string;
  skinColor: string;
  hairColor: string;
  clothesColor: string;
  pantsColor: string;
  eyeColor: string;
  handsColor: string;
  speed: number;
  weight: number;
  isCustom: boolean;
  idx: number;
}

function getCharRenderData(): CharRenderData[] {
  const chars: CharRenderData[] = CHAR_DATA.map((c, i) => ({
    name: c.name,
    skinColor: i === 0 ? '#f5deb3' : '#f5deb3',
    hairColor: i === 0 ? '#8B4513' : '#ffffff',
    clothesColor: i === 0 ? '#b00000' : '#f0f0f5',
    pantsColor: i === 0 ? '#1a1a2e' : '#111111',
    eyeColor: c.eyes.length === 4 ? `#${c.eyes[1]}${c.eyes[1]}${c.eyes[2]}${c.eyes[2]}${c.eyes[3]}${c.eyes[3]}` : c.eyes,
    handsColor: '#f5deb3',
    speed: c.speed,
    weight: c.weight,
    isCustom: false,
    idx: i,
  }));
  return chars;
}

// ===== Canvas portrait component =====
const CanvasPortrait: React.FC<{
  char: CharRenderData;
  size: number;
  isSelected?: boolean;
  isHovered?: boolean;
  facing?: number;
}> = ({ char, size, isSelected, isHovered, facing = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);
    frameRef.current++;

    const scale = size / 75;
    drawCharOnCanvas(
      ctx, size / 2, size / 2,
      char.skinColor, char.hairColor, char.clothesColor,
      char.pantsColor, char.eyeColor, char.handsColor,
      scale, frameRef.current, facing
    );

    // Power aura for selected/hovered
    if (isSelected || isHovered) {
      ctx.save();
      ctx.globalAlpha = isSelected ? 0.3 : 0.15;
      const aura = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.48);
      aura.addColorStop(0, 'transparent');
      aura.addColorStop(0.7, char.eyeColor);
      aura.addColorStop(1, 'transparent');
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.arc(size / 2, size / 2, size * 0.48, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    animRef.current = requestAnimationFrame(draw);
  }, [char, size, isSelected, isHovered, facing]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
};

// ===== Big portrait for P1/P2 side =====
const BigPortrait: React.FC<{
  char: CharRenderData | null;
  customChar: CustomCharData | null;
  color: string;
  facing?: number;
}> = ({ char, customChar, color, facing = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const animRef = useRef<number>(0);
  const size = 220;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);
    frameRef.current++;
    const t = frameRef.current;

    if (char || customChar) {
      const sc = size / 75;
      const skinC = customChar ? customChar.skinColor : char!.skinColor;
      const hairC = customChar ? (customChar as any).hairColor || customChar.clothesColor : char!.hairColor;
      const clothC = customChar ? customChar.clothesColor : char!.clothesColor;
      const pantsC = customChar ? '#1a1a2e' : char!.pantsColor;
      const eyeC = customChar ? customChar.eyesColor : char!.eyeColor;
      const handC = customChar ? skinC : char!.handsColor;

      // Breathing animation
      const breathe = 1 + Math.sin(t * 0.04) * 0.015;
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.scale(breathe, breathe);
      ctx.translate(-size / 2, -size / 2);

      drawCharOnCanvas(ctx, size / 2, size / 2, skinC, hairC, clothC, pantsC, eyeC, handC, sc, t, facing);

      // Energy particles around the big portrait
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 8; i++) {
        const angle = (t * 0.02 + i * Math.PI / 4) % (Math.PI * 2);
        const dist = size * 0.35 + Math.sin(t * 0.05 + i) * 10;
        const px = size / 2 + Math.cos(angle) * dist;
        const py = size / 2 + Math.sin(angle) * dist;
        const pSize = 2 + Math.sin(t * 0.08 + i * 2) * 1.5;
        ctx.beginPath(); ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fillStyle = eyeC; ctx.fill();
      }
      ctx.restore();
    } else {
      // Empty silhouette
      ctx.globalAlpha = 0.15;
      ctx.beginPath(); ctx.arc(size / 2, size / 2, size * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
      ctx.globalAlpha = 0.4;
      ctx.font = `bold ${size * 0.35}px Orbitron, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.fillText('?', size / 2, size / 2);
    }

    animRef.current = requestAnimationFrame(draw);
  }, [char, customChar, color, facing]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />;
};

// ===== Animated background canvas =====
const BgCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; size: number; color: string; alpha: number }[]>([]);

  useEffect(() => {
    const particles: typeof particlesRef.current = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -Math.random() * 0.5 - 0.2,
        size: Math.random() * 2.5 + 0.5,
        color: ['#00ffff', '#ff8c00', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 4)],
        alpha: Math.random() * 0.5 + 0.2,
      });
    }
    particlesRef.current = particles;

    let frame = 0;
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      frame++;

      // Dark gradient bg
      const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bg.addColorStop(0, '#050520');
      bg.addColorStop(0.3, '#0a0a35');
      bg.addColorStop(0.6, '#120828');
      bg.addColorStop(1, '#050520');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Central VS energy line
      const centerX = canvas.width / 2;
      ctx.save();
      ctx.globalAlpha = 0.08 + Math.sin(frame * 0.03) * 0.04;
      const lineGrad = ctx.createLinearGradient(centerX - 2, 0, centerX + 2, 0);
      lineGrad.addColorStop(0, 'transparent');
      lineGrad.addColorStop(0.5, '#ff8c00');
      lineGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = lineGrad;
      ctx.fillRect(centerX - 40, 0, 80, canvas.height);
      ctx.restore();

      // Grid lines
      ctx.save();
      ctx.globalAlpha = 0.03;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      ctx.restore();

      // Particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        ctx.save();
        ctx.globalAlpha = p.alpha * (0.5 + Math.sin(frame * 0.05 + p.x) * 0.5);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.fill();
        ctx.restore();
      });

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />;
};

// ===== Custom portrait for submenu =====
const CustomPortrait: React.FC<{ ch: CustomCharData; size?: number }> = ({ ch, size = 45 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: ch.skinColor, border: `2px solid ${ch.eyesColor}`,
    boxShadow: `0 0 15px ${ch.effectColor}50, 0 0 30px ${ch.effectColor}20`,
    position: 'relative',
  }}>
    <div style={{ position: 'absolute', top: '38%', left: '25%', width: size * 0.15, height: size * 0.15, borderRadius: '50%', background: ch.eyesColor, boxShadow: `0 0 4px ${ch.eyesColor}` }} />
    <div style={{ position: 'absolute', top: '38%', right: '25%', width: size * 0.15, height: size * 0.15, borderRadius: '50%', background: ch.eyesColor, boxShadow: `0 0 4px ${ch.eyesColor}` }} />
    <div style={{
      position: 'absolute', inset: -6, borderRadius: '50%',
      border: `2px solid ${ch.effectColor}40`,
      boxShadow: `0 0 10px ${ch.effectColor}30`,
    }} />
  </div>
);

const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

const CharacterSelect: React.FC = () => {
  const { engine, setGameState } = useGame();
  const [skinSelectFor, setSkinSelectFor] = useState<{ charIdx: number; pNum: number } | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showCustomMenu, setShowCustomMenu] = useState(false);
  const [customChars, setCustomChars] = useState<(CustomCharData | null)[]>([null, null, null, null, null, null]);
  const [konamiProgress, setKonamiProgress] = useState(0);
  const [cheatActive, setCheatActive] = useState(false);
  const [selectFlash, setSelectFlash] = useState<number | null>(null);

  const charRenderData = getCharRenderData();

  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('customChars') || '[]');
      const arr: (CustomCharData | null)[] = [null, null, null, null, null, null];
      saved.forEach((ch: any, i: number) => { if (i < 6 && ch) arr[i] = { ...ch }; });
      setCustomChars(arr);
    } catch {}
  }, []);

  // Konami code
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === KONAMI_CODE[konamiProgress]) {
        const next = konamiProgress + 1;
        if (next === KONAMI_CODE.length) {
          setCheatActive(true);
          setKonamiProgress(0);
          const notif = document.createElement('div');
          notif.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:rgba(0,0,0,0.95);border:3px solid #ffff00;padding:20px 40px;color:#ffff00;font-family:"Orbitron",monospace;font-size:24px;letter-spacing:4px;text-shadow:0 0 20px #ffff00;animation:fadeIn 0.3s ease-out;';
          notif.textContent = '¡CÓDIGO ACTIVO!';
          document.body.appendChild(notif);
          setTimeout(() => notif.remove(), 2500);
        } else {
          setKonamiProgress(next);
        }
      } else {
        setKonamiProgress(e.code === KONAMI_CODE[0] ? 1 : 0);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [konamiProgress]);

  const isP2Turn = engine.p1Choice !== null && (engine.mode === 'versus' || engine.mode === 'vs_cpu') && engine.p2Choice === null;

  const handleSelect = (idx: number) => {
    playConfirmSound();
    setSelectFlash(idx);
    setTimeout(() => setSelectFlash(null), 300);
    setSkinSelectFor({ charIdx: idx, pNum: engine.p1Choice === null ? 1 : 2 });
  };

  const handleCustomSelect = (customIdx: number) => {
    const ch = customChars[customIdx];
    if (!ch) return;
    playConfirmSound();
    engine.confirmSkinChoice(100 + customIdx, null, engine.p1Choice === null ? 1 : 2);
    setShowCustomMenu(false);
  };

  const handleRandomSelect = () => {
    const allOptions: number[] = [...CHAR_DATA.map((_, i) => i)];
    customChars.forEach((ch, i) => { if (ch) allOptions.push(100 + i); });
    const pick = allOptions[Math.floor(Math.random() * allOptions.length)];
    playConfirmSound();
    if (pick >= 100) {
      engine.confirmSkinChoice(pick, null, engine.p1Choice === null ? 1 : 2);
    } else {
      setSkinSelectFor({ charIdx: pick, pNum: engine.p1Choice === null ? 1 : 2 });
    }
  };

  const handleSkinConfirm = (skinId: string | null) => {
    if (!skinSelectFor) return;
    playConfirmSound();
    engine.confirmSkinChoice(skinSelectFor.charIdx, skinId, skinSelectFor.pNum);
    setSkinSelectFor(null);
  };

  const availableSkins = (charIdx: number) => {
    const charName = CHAR_DATA[charIdx].name;
    const inv = engine.inventory[charName.toLowerCase()] || {};
    const catalog = SHOP_CATALOG[charName] || [];
    const skins: { id: string | null; name: string }[] = [{ id: null, name: 'Original' }];
    if (cheatActive) {
      catalog.forEach(item => skins.push({ id: item.id, name: item.name }));
    } else {
      catalog.forEach(item => { if (inv[item.id]) skins.push({ id: item.id, name: item.name }); });
    }
    return skins;
  };

  // Custom character submenu
  if (showCustomMenu) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.3s ease-out' }}>
        <div style={{ maxWidth: 650, width: '90%', textAlign: 'center' }}>
          <h2 style={{ color: '#ffff00', fontSize: 'clamp(20px, 3.5vw, 32px)', textShadow: '0 0 20px #ffff00', marginBottom: 25, fontFamily: "'Orbitron', monospace", letterSpacing: 4 }}>
            PERSONAJES PERSONALIZADOS
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
            {customChars.map((ch, i) => (
              <div
                key={i}
                onClick={() => ch && handleCustomSelect(i)}
                style={{
                  padding: 18, cursor: ch ? 'pointer' : 'default', textAlign: 'center',
                  background: 'rgba(10,10,30,0.9)',
                  border: `2px solid ${ch ? 'rgba(0,255,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  opacity: ch ? 1 : 0.4, transition: 'all 0.3s',
                }}
                onMouseEnter={e => { if (ch) { e.currentTarget.style.borderColor = ch.eyesColor; e.currentTarget.style.boxShadow = `0 0 25px ${ch.eyesColor}40`; e.currentTarget.style.transform = 'scale(1.05)'; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ch ? 'rgba(0,255,255,0.4)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {ch ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <CustomPortrait ch={ch} size={55} />
                    <div style={{ color: '#eafcff', fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 2 }}>{ch.name}</div>
                  </div>
                ) : (
                  <div style={{
                    width: 55, height: 55, borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
                    border: '2px dashed rgba(255,255,255,0.1)', margin: '0 auto 8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: '#333', fontSize: 20 }}>—</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setShowCustomMenu(false)} style={{
            marginTop: 25, padding: '10px 35px', background: 'transparent',
            border: '2px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer',
            fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
          }}>VOLVER</button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
      </div>
    );
  }

  // Skin selector overlay
  if (skinSelectFor) {
    const skins = availableSkins(skinSelectFor.charIdx);
    const ch = CHAR_DATA[skinSelectFor.charIdx];
    const renderCh = charRenderData[skinSelectFor.charIdx];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.3s ease-out' }}>
        <div style={{ maxWidth: 600, width: '90%', textAlign: 'center' }}>
          <h2 style={{ color: '#00ffff', fontSize: 'clamp(22px, 3.5vw, 36px)', textShadow: '0 0 20px #00ffff', marginBottom: 25, fontFamily: "'Orbitron', monospace", letterSpacing: 4 }}>
            ELIGE ESTILO P{skinSelectFor.pNum}: {ch.name}
          </h2>
          <div style={{ margin: '0 auto 25px', display: 'flex', justifyContent: 'center' }}>
            <CanvasPortrait char={renderCh} size={120} isSelected facing={1} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            {skins.map(skin => (
              <button key={skin.id || 'original'} onClick={() => handleSkinConfirm(skin.id)}
                style={{
                  border: '2px solid rgba(0,255,255,0.3)', background: 'rgba(10,10,30,0.8)',
                  padding: 16, cursor: 'pointer', color: '#87ceeb',
                  fontFamily: "'Orbitron', monospace", fontSize: 13, transition: 'all 0.3s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,255,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,255,255,0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {skin.name}
              </button>
            ))}
          </div>
          <button onClick={() => setSkinSelectFor(null)} style={{
            marginTop: 25, padding: '10px 35px', background: 'transparent',
            border: '2px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer',
            fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
          }}>CANCELAR</button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
      </div>
    );
  }

  // Get current selections
  const p1Char = engine.p1Choice !== null && engine.p1Choice < 100 ? charRenderData[engine.p1Choice] : null;
  const p1Custom = engine.p1Choice !== null && engine.p1Choice >= 100 ? customChars[engine.p1Choice - 100] : null;
  const hoveredChar = hoveredIdx !== null && hoveredIdx < 100 ? charRenderData[hoveredIdx] : null;

  const displayP1 = p1Char || (!isP2Turn ? hoveredChar : null);
  const displayP2 = isP2Turn ? hoveredChar : null;

  const p1Name = p1Custom ? p1Custom.name : (displayP1 ? displayP1.name : '???');
  const p2Name = displayP2 ? displayP2.name : (isP2Turn ? '???' : '---');

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ overflow: 'hidden', animation: 'fadeIn 0.4s ease-out' }}>
      <BgCanvas />

      {/* Top bar - cinematic */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 30px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 80%, transparent 100%)',
        borderBottom: '1px solid rgba(0,255,255,0.15)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #00ffff20, #00ffff05)',
            border: '1px solid #00ffff40', transform: 'rotate(45deg)',
          }}>
            <span style={{ transform: 'rotate(-45deg)', color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 14, fontWeight: 900 }}>P1</span>
          </div>
          <div style={{
            color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(14px, 2.2vw, 22px)',
            letterSpacing: 3, textShadow: '0 0 15px #00ffff60', fontWeight: 900,
          }}>
            {p1Name}
          </div>
        </div>

        <div style={{
          color: '#ff8c00', fontFamily: "'Orbitron', monospace",
          fontSize: 'clamp(18px, 3.5vw, 36px)', fontWeight: 900,
          textShadow: '0 0 30px #ff8c0080, 0 0 60px #ff8c0040',
          letterSpacing: 6, position: 'relative',
        }}>
          <span style={{ position: 'relative', zIndex: 1 }}>
            {isP2Turn ? 'JUGADOR 2' : 'ELIGE LUCHADOR'}
          </span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            color: '#ff8c00', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(14px, 2.2vw, 22px)',
            letterSpacing: 3, textShadow: '0 0 15px #ff8c0060', fontWeight: 900,
          }}>
            {p2Name}
          </div>
          <div style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #ff8c0020, #ff8c0005)',
            border: '1px solid #ff8c0040', transform: 'rotate(45deg)',
          }}>
            <span style={{ transform: 'rotate(-45deg)', color: '#ff8c00', fontFamily: "'Orbitron', monospace", fontSize: 14, fontWeight: 900 }}>P2</span>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2, minHeight: 0 }}>

        {/* P1 side portrait */}
        <div style={{
          width: 'clamp(120px, 22vw, 280px)', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {/* P1 color bar */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
            background: 'linear-gradient(180deg, transparent 10%, #00ffff 50%, transparent 90%)',
            opacity: 0.5,
          }} />
          <BigPortrait
            char={displayP1 || null}
            customChar={p1Custom}
            color="#00ffff"
            facing={1}
          />
          {/* Stats */}
          {displayP1 && (
            <div style={{ marginTop: 15, width: '80%' }}>
              <StatBar label="VEL" value={displayP1.speed / 10} color="#00ffff" />
              <StatBar label="POD" value={displayP1.weight} color="#ff4444" />
            </div>
          )}
        </div>

        {/* Center roster grid */}
        <div style={{
          flex: 1, maxWidth: 520, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 10px',
        }}>
          {/* VS emblem */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(80px, 15vw, 160px)', fontFamily: "'Orbitron', monospace", fontWeight: 900,
            color: 'rgba(255,140,0,0.04)', letterSpacing: 20, pointerEvents: 'none', zIndex: 0,
          }}>VS</div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(CHAR_DATA.length + 2, 4)}, 1fr)`,
            gap: 'clamp(8px, 1.5vw, 16px)', justifyContent: 'center',
            position: 'relative', zIndex: 1,
          }}>
            {/* Base characters */}
            {charRenderData.map((ch, i) => {
              const isP1Selected = engine.p1Choice === i;
              const isHovered = hoveredIdx === i;
              const isFlashing = selectFlash === i;
              return (
                <div
                  key={ch.name}
                  onClick={() => handleSelect(i)}
                  onMouseEnter={() => { setHoveredIdx(i); playSelectSound(); }}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    width: 'clamp(80px, 12vw, 120px)',
                    height: 'clamp(100px, 15vw, 150px)',
                    cursor: 'pointer', position: 'relative',
                    background: isFlashing
                      ? `linear-gradient(135deg, ${ch.eyeColor}40, ${ch.eyeColor}10)`
                      : isP1Selected
                        ? 'linear-gradient(135deg, rgba(0,255,255,0.15), rgba(0,255,255,0.05))'
                        : isHovered
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))'
                          : 'linear-gradient(135deg, rgba(15,15,40,0.9), rgba(10,10,30,0.95))',
                    border: isP1Selected
                      ? '2px solid #00ffff'
                      : isHovered
                        ? `2px solid ${ch.eyeColor}80`
                        : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: isP1Selected
                      ? `0 0 30px #00ffff40, inset 0 0 20px #00ffff10`
                      : isHovered
                        ? `0 0 20px ${ch.eyeColor}30`
                        : '0 2px 10px rgba(0,0,0,0.3)',
                    transition: 'all 0.25s ease-out',
                    transform: isHovered ? 'scale(1.08) translateY(-4px)' : 'scale(1)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 6,
                    overflow: 'hidden',
                  }}
                >
                  {/* Top accent line */}
                  <div style={{
                    position: 'absolute', top: 0, left: '10%', right: '10%', height: 2,
                    background: isP1Selected ? '#00ffff' : isHovered ? ch.eyeColor : 'transparent',
                    boxShadow: isP1Selected ? '0 0 10px #00ffff' : isHovered ? `0 0 8px ${ch.eyeColor}` : 'none',
                    transition: 'all 0.25s',
                  }} />

                  <CanvasPortrait
                    char={ch}
                    size={Math.min(window.innerWidth * 0.06, 70)}
                    isSelected={isP1Selected}
                    isHovered={isHovered}
                    facing={1}
                  />

                  <div style={{
                    color: isP1Selected ? '#00ffff' : isHovered ? ch.eyeColor : 'rgba(255,255,255,0.6)',
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 'clamp(8px, 1.2vw, 11px)',
                    letterSpacing: 2, fontWeight: 900,
                    textShadow: isP1Selected ? '0 0 10px #00ffff' : isHovered ? `0 0 8px ${ch.eyeColor}60` : 'none',
                    transition: 'all 0.25s',
                  }}>
                    {ch.name}
                  </div>

                  {isP1Selected && (
                    <div style={{
                      position: 'absolute', bottom: 4,
                      color: '#00ffff', fontSize: 8, fontFamily: "'Orbitron', monospace",
                      fontWeight: 900, textShadow: '0 0 5px #00ffff', letterSpacing: 2,
                    }}>● P1</div>
                  )}
                </div>
              );
            })}

            {/* Custom character slot */}
            <div
              onClick={() => { setShowCustomMenu(true); playConfirmSound(); }}
              onMouseEnter={() => setHoveredIdx(null)}
              style={{
                width: 'clamp(80px, 12vw, 120px)',
                height: 'clamp(100px, 15vw, 150px)',
                cursor: 'pointer', position: 'relative',
                background: 'linear-gradient(135deg, rgba(15,15,40,0.9), rgba(10,10,30,0.95))',
                border: '1px solid rgba(255,255,0,0.15)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 6, transition: 'all 0.25s',
              }}
              
            >
              <div style={{
                width: 'clamp(35px, 5vw, 55px)', height: 'clamp(35px, 5vw, 55px)', borderRadius: '50%',
                background: 'linear-gradient(135deg, #33333380, #55555580)',
                border: '2px solid #ffff0060',
                boxShadow: '0 0 20px #ffff0020',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: '#ffff00', fontSize: 'clamp(16px, 3vw, 28px)', fontWeight: 900, fontFamily: "'Orbitron', monospace" }}>?</span>
              </div>
              <div style={{
                color: 'rgba(255,255,0,0.6)', fontFamily: "'Orbitron', monospace",
                fontSize: 'clamp(6px, 0.9vw, 9px)', letterSpacing: 2,
              }}>CUSTOM</div>
            </div>

            {/* Random selector */}
            <div
              onClick={handleRandomSelect}
              onMouseEnter={() => setHoveredIdx(null)}
              style={{
                width: 'clamp(80px, 12vw, 120px)',
                height: 'clamp(100px, 15vw, 150px)',
                cursor: 'pointer', position: 'relative',
                background: 'linear-gradient(135deg, rgba(15,15,40,0.9), rgba(10,10,30,0.95))',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 6, transition: 'all 0.25s',
              }}
            >
              <div style={{
                width: 'clamp(35px, 5vw, 55px)', height: 'clamp(35px, 5vw, 55px)', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff008880, #00ffff80, #ffff0080)',
                border: '2px solid #ffffff40',
                boxShadow: '0 0 15px #ffffff20',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 'clamp(14px, 2.5vw, 22px)' }}>🎲</span>
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.5)', fontFamily: "'Orbitron', monospace",
                fontSize: 'clamp(6px, 0.9vw, 9px)', letterSpacing: 2,
              }}>RANDOM</div>
            </div>
          </div>
        </div>

        {/* P2 side portrait */}
        <div style={{
          width: 'clamp(120px, 22vw, 280px)', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 4,
            background: 'linear-gradient(180deg, transparent 10%, #ff8c00 50%, transparent 90%)',
            opacity: 0.5,
          }} />
          <BigPortrait
            char={displayP2 || null}
            customChar={null}
            color="#ff8c00"
            facing={-1}
          />
          {displayP2 && (
            <div style={{ marginTop: 15, width: '80%' }}>
              <StatBar label="VEL" value={displayP2.speed / 10} color="#ff8c00" />
              <StatBar label="POD" value={displayP2.weight} color="#ff4444" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 30px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 80%, transparent 100%)',
        borderTop: '1px solid rgba(0,255,255,0.1)',
      }}>
        <div style={{
          color: 'rgba(135,206,235,0.5)', fontFamily: "'Orbitron', monospace",
          fontSize: 'clamp(7px, 1vw, 10px)', letterSpacing: 2,
        }}>
          P1: WASD + F/G/H
        </div>
        <button onClick={() => setGameState('MENU')} style={{
          padding: '8px 30px', background: 'transparent',
          border: '1px solid rgba(255,77,77,0.5)', color: '#ff4d4d',
          cursor: 'pointer', fontFamily: "'Orbitron', monospace",
          fontSize: 'clamp(9px, 1.2vw, 12px)', letterSpacing: 4,
          transition: 'all 0.3s', textShadow: '0 0 8px #ff4d4d40',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff4d4d'; e.currentTarget.style.boxShadow = '0 0 20px #ff4d4d30'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,77,77,0.5)'; e.currentTarget.style.boxShadow = 'none'; }}
        >VOLVER</button>
        <div style={{
          color: 'rgba(135,206,235,0.5)', fontFamily: "'Orbitron', monospace",
          fontSize: 'clamp(7px, 1vw, 10px)', letterSpacing: 2, textAlign: 'right',
        }}>
          P2: ↑↓←→ + [ ] \
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

// ===== Stat bar component =====
const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
    <span style={{
      color: 'rgba(255,255,255,0.4)', fontFamily: "'Orbitron', monospace",
      fontSize: 8, letterSpacing: 1, width: 28, textAlign: 'right',
    }}>{label}</span>
    <div style={{
      flex: 1, height: 4, background: 'rgba(255,255,255,0.06)',
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        height: '100%', width: `${value * 100}%`,
        background: `linear-gradient(90deg, ${color}80, ${color})`,
        boxShadow: `0 0 8px ${color}40`,
        transition: 'width 0.4s ease-out',
      }} />
    </div>
  </div>
);

export default CharacterSelect;
