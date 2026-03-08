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

// ===== Draw in-game style fighter (exact match to fighter.ts _drawBody + _drawHands idle) =====
function drawGameSprite(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  charIdx: number, char: CharRenderData | null, customChar: CustomCharData | null,
  side: number, time: number, scale: number
) {
  const s = scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(side * s, s);
  // Breathing
  const breath = Math.sin(time * 0.1) * 0.03;
  ctx.scale(1, 1 + breath);
  ctx.translate(-x / (side * s), -y / s);

  const skinC = customChar ? customChar.skinColor : (charIdx === 0 ? '#f5deb3' : '#f5d1ad');
  const clothC = customChar ? customChar.clothesColor : (charIdx === 0 ? '#b00000' : '#ffffff');
  const pantsC = customChar ? (customChar.pantsColor || '#000') : '#000';
  const hairC = customChar ? (customChar.hairColor || customChar.clothesColor) : (charIdx === 0 ? '#5a3a1a' : '#ffffff');
  const eyeC = customChar ? customChar.eyesColor : (charIdx === 0 ? '#00ffff' : '#ffff00');
  const handC = customChar ? customChar.handsColor : (charIdx === 0 ? '#d4af37' : '#f5d1ad');
  const cx = x / (side * s);
  const cy = y / s;

  // Body sphere
  ctx.beginPath(); ctx.arc(cx, cy, 25, 0, Math.PI * 2);
  ctx.fillStyle = skinC; ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
  // Clothes
  ctx.beginPath(); (ctx as any).roundRect(cx - 25, cy, 50, 11, 0);
  ctx.fillStyle = clothC; ctx.fill(); ctx.stroke();
  // Pants
  ctx.save(); ctx.translate(cx, cy + 11); ctx.scale(1, 0.6);
  ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI);
  ctx.fillStyle = pantsC; ctx.fill(); ctx.stroke(); ctx.restore();
  // Hair
  ctx.save(); ctx.translate(cx, cy - 10); ctx.scale(1, 0.7);
  ctx.beginPath(); ctx.arc(0, 0, 22, Math.PI, 0);
  ctx.fillStyle = hairC; ctx.fill(); ctx.stroke(); ctx.restore();
  // Eyes
  ctx.fillStyle = eyeC;
  const ex = cx + 6;
  ctx.beginPath(); ctx.arc(ex - 4, cy - 6, 3, 0, Math.PI * 2);
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fill();
  ctx.beginPath(); ctx.arc(ex + 4, cy - 6, 3, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
  // Hands (idle swing)
  const handPhase = time * 0.08;
  const swing = Math.sin(handPhase) * 6;
  const lx = cx + 18 + swing;
  const rx = cx + 30 - swing;
  const ly = cy + 8 + Math.cos(handPhase * 1.3) * 3;
  const ry = cy + 8 + Math.sin(handPhase * 1.1) * 3;
  ctx.fillStyle = handC;
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(lx, ly, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(rx, ry, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.restore();
}

// ===== Center stage canvas - shows fighters in game style =====
const StageCanvas: React.FC<{
  p1Char: CharRenderData | null;
  p2Char: CharRenderData | null;
  p1Custom: CustomCharData | null;
}> = ({ p1Char, p2Char, p1Custom }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const frameRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.parentElement?.clientWidth || 500;
    const H = canvas.parentElement?.clientHeight || 300;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    frameRef.current++;
    const t = frameRef.current;

    // Stage background - dark arena with grid floor
    const floorY = H * 0.72;

    // Floor grid perspective
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#ffcc33';
    ctx.lineWidth = 0.5;
    for (let i = -10; i <= 10; i++) {
      const x1 = W / 2 + i * 30;
      const x2 = W / 2 + i * 80;
      ctx.beginPath();
      ctx.moveTo(x1, floorY);
      ctx.lineTo(x2, H);
      ctx.stroke();
    }
    for (let j = 0; j < 5; j++) {
      const yy = floorY + j * (H - floorY) / 4;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(W, yy);
      ctx.stroke();
    }
    ctx.restore();

    // Floor line glow
    ctx.save();
    ctx.globalAlpha = 0.3;
    const floorGrad = ctx.createLinearGradient(W * 0.1, floorY, W * 0.9, floorY);
    floorGrad.addColorStop(0, 'transparent');
    floorGrad.addColorStop(0.3, '#ffcc3360');
    floorGrad.addColorStop(0.5, '#ffcc3380');
    floorGrad.addColorStop(0.7, '#ffcc3360');
    floorGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY - 1, W, 3);
    ctx.restore();

    // Spotlight from above on each character position
    if (p1Char || p1Custom) {
      ctx.save();
      ctx.globalAlpha = 0.04;
      const spotGrad = ctx.createRadialGradient(W * 0.3, floorY - 30, 0, W * 0.3, floorY - 30, H * 0.5);
      spotGrad.addColorStop(0, (p1Custom ? p1Custom.eyesColor : p1Char?.eyeColor) || '#00ffff');
      spotGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, W * 0.6, H);
      ctx.restore();
    }
    if (p2Char) {
      ctx.save();
      ctx.globalAlpha = 0.04;
      const spotGrad = ctx.createRadialGradient(W * 0.7, floorY - 30, 0, W * 0.7, floorY - 30, H * 0.5);
      spotGrad.addColorStop(0, p2Char.eyeColor);
      spotGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = spotGrad;
      ctx.fillRect(W * 0.4, 0, W * 0.6, H);
      ctx.restore();
    }

    // Draw P1 fighter sprite
    const spriteScale = Math.min(W / 350, H / 200, 2.2);
    if (p1Char || p1Custom) {
      const charIdx = p1Custom ? -1 : p1Char!.idx;
      // Shadow
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(W * 0.3, floorY + 5, 30 * spriteScale, 6 * spriteScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawGameSprite(ctx, W * 0.3, floorY - 25 * spriteScale, charIdx, p1Char, p1Custom, 1, t, spriteScale);
    }

    // Draw P2 fighter sprite
    if (p2Char) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(W * 0.7, floorY + 5, 30 * spriteScale, 6 * spriteScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawGameSprite(ctx, W * 0.7, floorY - 25 * spriteScale, p2Char.idx, p2Char, null, -1, t, spriteScale);
    }

    // VS text in center if both selected
    if ((p1Char || p1Custom) && p2Char) {
      ctx.save();
      const pulse = 0.8 + Math.sin(t * 0.06) * 0.2;
      ctx.globalAlpha = 0.15 * pulse;
      ctx.font = `bold ${40 * spriteScale}px Orbitron, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffcc33';
      ctx.fillText('VS', W / 2, floorY - 20 * spriteScale);
      ctx.restore();
    }

    // Floating particles
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 8; i++) {
      const px = (W * 0.15 + ((t * 0.5 + i * 137) % (W * 0.7)));
      const py = H * 0.2 + Math.sin(t * 0.02 + i * 1.5) * H * 0.15;
      const sz = 1 + Math.sin(t * 0.04 + i) * 0.8;
      ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#ffcc33' : '#ff880060';
      ctx.fill();
    }

    animRef.current = requestAnimationFrame(draw);
  }, [p1Char, p2Char, p1Custom]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
};

// ===== Big animated portrait for P1/P2 =====
const BigPortrait: React.FC<{
  char: CharRenderData | null;
  customChar: CustomCharData | null;
  color: string;
  facing?: number;
  label: string;
}> = ({ char, customChar, color, facing = 1, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.parentElement?.clientWidth || 300;
    const H = canvas.parentElement?.clientHeight || 400;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    frameRef.current++;
    const t = frameRef.current;

    if (char || customChar) {
      const skinC = customChar ? customChar.skinColor : char!.skinColor;
      const hairC = customChar ? (customChar as any).hairColor || customChar.clothesColor : char!.hairColor;
      const clothC = customChar ? customChar.clothesColor : char!.clothesColor;
      const pantsC = customChar ? '#1a1a2e' : char!.pantsColor;
      const eyeC = customChar ? customChar.eyesColor : char!.eyeColor;
      const handC = customChar ? skinC : char!.handsColor;

      // Dramatic background glow
      ctx.save();
      ctx.globalAlpha = 0.12;
      const bgGlow = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, Math.min(W, H) * 0.7);
      bgGlow.addColorStop(0, eyeC);
      bgGlow.addColorStop(0.5, eyeC + '40');
      bgGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Diagonal speed lines
      ctx.save();
      ctx.globalAlpha = 0.03;
      for (let i = 0; i < 8; i++) {
        const lineY = H * 0.1 + i * H * 0.1;
        ctx.beginPath();
        ctx.moveTo(facing > 0 ? 0 : W, lineY);
        ctx.lineTo(facing > 0 ? W * 0.6 : W * 0.4, lineY + 20);
        ctx.strokeStyle = eyeC;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // Breathing + idle sway
      const breathe = 1 + Math.sin(t * 0.04) * 0.02;
      const sway = Math.sin(t * 0.025) * 3;
      const sc = Math.min(W, H) / 48;

      ctx.save();
      ctx.translate(W / 2 + sway, H * 0.42);
      ctx.scale(breathe, breathe);

      drawCharOnCanvas(ctx, 0, 0, skinC, hairC, clothC, pantsC, eyeC, handC, sc, t, facing);

      // Energy particles orbiting
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 8; i++) {
        const angle = (t * 0.015 + i * Math.PI / 4) % (Math.PI * 2);
        const dist = sc * 38 + Math.sin(t * 0.035 + i) * sc * 6;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        const pSize = 1.5 + Math.sin(t * 0.05 + i * 2) * 1;
        ctx.beginPath(); ctx.arc(px, py, pSize * sc * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = eyeC; ctx.fill();
      }
      ctx.restore();

      // Ground platform glow
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.ellipse(W / 2, H * 0.78, W * 0.3, H * 0.03, 0, 0, Math.PI * 2);
      const platGrad = ctx.createRadialGradient(W / 2, H * 0.78, 0, W / 2, H * 0.78, W * 0.3);
      platGrad.addColorStop(0, eyeC);
      platGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = platGrad;
      ctx.fill();
      ctx.restore();
    } else {
      // Empty silhouette with pulsing ? 
      ctx.globalAlpha = 0.06;
      ctx.beginPath(); ctx.arc(W / 2, H * 0.42, Math.min(W, H) * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
      ctx.globalAlpha = 0.2 + Math.sin(t * 0.04) * 0.1;
      ctx.font = `bold ${Math.min(W, H) * 0.3}px Orbitron, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.fillText('?', W / 2, H * 0.42);
    }

    animRef.current = requestAnimationFrame(draw);
  }, [char, customChar, color, facing]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};

// ===== Animated background canvas =====
const BgCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    // Particles
    const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string; alpha: number; life: number }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -Math.random() * 0.4 - 0.15,
        size: Math.random() * 2.5 + 0.3,
        color: ['#00ffff', '#ff8c00', '#ffff00', '#ff00ff', '#00ff88'][Math.floor(Math.random() * 5)],
        alpha: Math.random() * 0.6 + 0.1,
        life: Math.random() * 1000,
      });
    }

    // Nebula clouds
    const nebulas: { x: number; y: number; r: number; color: string; speed: number }[] = [];
    for (let i = 0; i < 5; i++) {
      nebulas.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 100 + Math.random() * 200,
        color: ['#ffcc33', '#ff8800', '#8844ff', '#ff4400', '#ffaa00'][i],
        speed: (Math.random() - 0.5) * 0.3,
      });
    }

    let frame = 0;
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
      frame++;

      // Deep space gradient
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
      bg.addColorStop(0, '#0c0c30');
      bg.addColorStop(0.4, '#080822');
      bg.addColorStop(0.7, '#050518');
      bg.addColorStop(1, '#020210');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Nebula clouds (soft glowing blobs)
      nebulas.forEach(n => {
        n.x += n.speed;
        if (n.x < -n.r) n.x = W + n.r;
        if (n.x > W + n.r) n.x = -n.r;
        ctx.save();
        ctx.globalAlpha = 0.04 + Math.sin(frame * 0.008 + n.y) * 0.015;
        const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        ng.addColorStop(0, n.color);
        ng.addColorStop(0.5, n.color + '40');
        ng.addColorStop(1, 'transparent');
        ctx.fillStyle = ng;
        ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
        ctx.restore();
      });

      // Hexagonal grid pattern (faint)
      ctx.save();
      ctx.globalAlpha = 0.025;
      ctx.strokeStyle = '#886622';
      ctx.lineWidth = 0.5;
      const hexSize = 40;
      const hexH = hexSize * Math.sqrt(3);
      for (let row = -1; row < H / hexH + 1; row++) {
        for (let col = -1; col < W / (hexSize * 1.5) + 1; col++) {
          const cx = col * hexSize * 1.5;
          const cy = row * hexH + (col % 2 ? hexH / 2 : 0);
          ctx.beginPath();
          for (let a = 0; a < 6; a++) {
            const angle = Math.PI / 3 * a + Math.PI / 6;
            const px = cx + hexSize * 0.5 * Math.cos(angle);
            const py = cy + hexSize * 0.5 * Math.sin(angle);
            a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.stroke();
        }
      }
      ctx.restore();

      // Central energy column
      const centerX = W / 2;
      ctx.save();
      ctx.globalAlpha = 0.06 + Math.sin(frame * 0.025) * 0.03;
      const colGrad = ctx.createLinearGradient(centerX - 80, 0, centerX + 80, 0);
      colGrad.addColorStop(0, 'transparent');
      colGrad.addColorStop(0.3, '#ff8c0015');
      colGrad.addColorStop(0.5, '#ff8c0040');
      colGrad.addColorStop(0.7, '#ff8c0015');
      colGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = colGrad;
      ctx.fillRect(centerX - 80, 0, 160, H);
      ctx.restore();

      // P1 side glow (cyan, left)
      ctx.save();
      ctx.globalAlpha = 0.035;
      const p1Glow = ctx.createRadialGradient(0, H * 0.5, 0, 0, H * 0.5, W * 0.4);
      p1Glow.addColorStop(0, '#00ffff');
      p1Glow.addColorStop(1, 'transparent');
      ctx.fillStyle = p1Glow;
      ctx.fillRect(0, 0, W * 0.5, H);
      ctx.restore();

      // P2 side glow (orange, right)
      ctx.save();
      ctx.globalAlpha = 0.035;
      const p2Glow = ctx.createRadialGradient(W, H * 0.5, 0, W, H * 0.5, W * 0.4);
      p2Glow.addColorStop(0, '#ff8c00');
      p2Glow.addColorStop(1, 'transparent');
      ctx.fillStyle = p2Glow;
      ctx.fillRect(W * 0.5, 0, W * 0.5, H);
      ctx.restore();

      // Particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        ctx.save();
        ctx.globalAlpha = p.alpha * (0.4 + Math.sin(p.life * 0.04) * 0.6);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        pg.addColorStop(0, p.color);
        pg.addColorStop(1, 'transparent');
        ctx.fillStyle = pg; ctx.fill();
        ctx.restore();
      });

      // Scanlines (very subtle)
      ctx.save();
      ctx.globalAlpha = 0.015;
      for (let y = 0; y < H; y += 3) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, y, W, 1);
      }
      ctx.restore();

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
  const [cursorIdx, setCursorIdx] = useState(0);
  const [showCustomMenu, setShowCustomMenu] = useState(false);
  const [customChars, setCustomChars] = useState<(CustomCharData | null)[]>([null, null, null, null, null, null]);
  const [konamiProgress, setKonamiProgress] = useState(0);
  const [cheatActive, setCheatActive] = useState(false);
  const [selectFlash, setSelectFlash] = useState<number | null>(null);

  const charRenderData = getCharRenderData();

  // Build flat list of all grid items for navigation
  const allGridItems = React.useMemo(() => {
    const items: { type: 'char' | 'custom' | 'random'; idx: number }[] = [
      ...charRenderData.map((_, i) => ({ type: 'char' as const, idx: i })),
      { type: 'custom' as const, idx: -1 },
      { type: 'random' as const, idx: -2 },
    ];
    return items;
  }, [charRenderData]);

  const GRID_COLS = Math.min(allGridItems.length, 4);

  // WASD navigation
  React.useEffect(() => {
    if (skinSelectFor || showCustomMenu) return;
    const handler = (e: KeyboardEvent) => {
      const totalItems = allGridItems.length;
      const rows = Math.ceil(totalItems / GRID_COLS);
      const curRow = Math.floor(cursorIdx / GRID_COLS);
      const curCol = cursorIdx % GRID_COLS;

      let newIdx = cursorIdx;
      switch (e.code) {
        case 'KeyW': {
          const nr = (curRow - 1 + rows) % rows;
          newIdx = Math.min(nr * GRID_COLS + curCol, totalItems - 1);
          break;
        }
        case 'KeyS': {
          const nr = (curRow + 1) % rows;
          newIdx = Math.min(nr * GRID_COLS + curCol, totalItems - 1);
          break;
        }
        case 'KeyA':
          newIdx = cursorIdx > 0 ? cursorIdx - 1 : totalItems - 1;
          break;
        case 'KeyD':
          newIdx = cursorIdx < totalItems - 1 ? cursorIdx + 1 : 0;
          break;
        case 'KeyF': {
          // Confirm selection
          const item = allGridItems[cursorIdx];
          if (item.type === 'char') handleSelect(item.idx);
          else if (item.type === 'custom') { setShowCustomMenu(true); playConfirmSound(); }
          else if (item.type === 'random') handleRandomSelect();
          return;
        }
        default: return;
      }
      if (newIdx !== cursorIdx) {
        setCursorIdx(newIdx);
        const item = allGridItems[newIdx];
        if (item.type === 'char') setHoveredIdx(item.idx);
        else setHoveredIdx(null);
        playSelectSound();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cursorIdx, allGridItems, GRID_COLS, skinSelectFor, showCustomMenu]);


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

      {/* === GOLDEN TOP BORDER === */}
      <div style={{
        position: 'relative', zIndex: 3, height: 4,
        background: 'linear-gradient(90deg, transparent 5%, #ffcc33 20%, #ff8800 50%, #ffcc33 80%, transparent 95%)',
        boxShadow: '0 2px 15px #ffcc3340',
      }} />

      {/* === TOP BAR: P1 SIDE | TITLE | P2 SIDE === */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 25px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 100%)',
        borderBottom: '2px solid rgba(255,204,51,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            color: '#ffcc33', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(10px, 1.4vw, 14px)',
            letterSpacing: 3, textShadow: '0 0 10px #ffcc3360', fontWeight: 900, opacity: 0.7,
          }}>PLAYER 1 SIDE</span>
        </div>
        <div style={{
          color: '#ffcc33', fontFamily: "'Orbitron', monospace",
          fontSize: 'clamp(16px, 3vw, 32px)', fontWeight: 900,
          textShadow: '0 0 25px #ffcc3360, 0 0 50px #ff880030',
          letterSpacing: 6,
        }}>
          {isP2Turn ? 'PLAYER SELECT' : 'CHARACTER SELECT'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            color: '#ffcc33', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(10px, 1.4vw, 14px)',
            letterSpacing: 3, textShadow: '0 0 10px #ffcc3360', fontWeight: 900, opacity: 0.7,
          }}>PLAYER 2 SIDE</span>
        </div>
      </div>

      {/* === MAIN AREA: PORTRAITS + STAGE + ROSTER === */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2, minHeight: 0 }}>

        {/* TOP HALF: P1 Portrait | Stage Preview | P2 Portrait */}
        <div style={{
          flex: '0 0 48%', display: 'flex', position: 'relative',
          borderBottom: '2px solid rgba(255,204,51,0.15)',
        }}>
          {/* P1 Portrait - floating, no box */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: 'clamp(180px, 28vw, 380px)', zIndex: 5,
            pointerEvents: 'none',
          }}>
            <BigPortrait
              char={displayP1 || null}
              customChar={p1Custom}
              color="#00ffff"
              facing={1}
              label="P1"
            />
            {/* Name plate floating */}
            <div style={{
              position: 'absolute', bottom: 10, left: 15, right: 15,
              pointerEvents: 'none',
            }}>
              <div style={{
                color: '#ffcc33', fontFamily: "'Orbitron', monospace",
                fontSize: 'clamp(16px, 2.8vw, 28px)', fontWeight: 900,
                letterSpacing: 3, textShadow: '0 0 15px #ffcc3360, 0 2px 8px rgba(0,0,0,0.8)',
              }}>
                {p1Name}
              </div>
              {displayP1 && (
                <div style={{ marginTop: 4, display: 'flex', gap: 10, maxWidth: 200 }}>
                  <StatBar label="VEL" value={displayP1.speed / 10} color="#ffcc33" />
                  <StatBar label="POD" value={displayP1.weight} color="#ff6600" />
                </div>
              )}
            </div>
          </div>

          {/* Center stage - full width behind portraits */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <StageCanvas
              p1Char={displayP1 || null}
              p2Char={displayP2 || null}
              p1Custom={p1Custom}
            />
            {/* VS watermark */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              fontSize: 'clamp(50px, 10vw, 100px)', fontFamily: "'Orbitron', monospace", fontWeight: 900,
              color: 'rgba(255,204,51,0.04)', letterSpacing: 10, pointerEvents: 'none',
            }}>VS</div>
          </div>

          {/* P2 Portrait - floating, no box */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: 'clamp(180px, 28vw, 380px)', zIndex: 5,
            pointerEvents: 'none',
          }}>
            <BigPortrait
              char={displayP2 || null}
              customChar={null}
              color="#ff8c00"
              facing={-1}
              label="P2"
            />
            <div style={{
              position: 'absolute', bottom: 10, left: 15, right: 15, textAlign: 'right',
              pointerEvents: 'none',
            }}>
              <div style={{
                color: '#ffcc33', fontFamily: "'Orbitron', monospace",
                fontSize: 'clamp(16px, 2.8vw, 28px)', fontWeight: 900,
                letterSpacing: 3, textShadow: '0 0 15px #ffcc3360, 0 2px 8px rgba(0,0,0,0.8)',
              }}>
                {p2Name}
              </div>
              {displayP2 && (
                <div style={{ marginTop: 4, display: 'flex', gap: 10, justifyContent: 'flex-end', maxWidth: 200, marginLeft: 'auto' }}>
                  <StatBar label="VEL" value={displayP2.speed / 10} color="#ffcc33" />
                  <StatBar label="POD" value={displayP2.weight} color="#ff6600" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM HALF: Hexagonal roster grid */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative', padding: '8px 0',
        }}>
          {/* Hex grid */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            {(() => {
              const allItems = [
                ...charRenderData.map((ch, i) => ({ type: 'char' as const, ch, i })),
                { type: 'custom' as const, ch: null as any, i: -1 },
                { type: 'random' as const, ch: null as any, i: -2 },
              ];
              const cols = Math.min(allItems.length, 4);
              const hexW = Math.min(window.innerWidth * 0.09, 85);
              const hexH = hexW * 1.155;
              const rows: (typeof allItems[number])[][] = [];
              for (let r = 0; r < Math.ceil(allItems.length / cols); r++) {
                rows.push(allItems.slice(r * cols, r * cols + cols));
              }
              let flatIdx = 0;
              return rows.map((row, rIdx) => (
                <div key={rIdx} style={{
                  display: 'flex', gap: 2, justifyContent: 'center',
                  marginTop: rIdx > 0 ? -hexH * 0.12 : 0,
                  marginLeft: rIdx % 2 !== 0 ? hexW * 0.52 : 0,
                }}>
                  {row.map((item) => {
                    const myFlatIdx = flatIdx++;
                    const isCursor = cursorIdx === myFlatIdx;
                    if (item.type === 'char') {
                      const ch = item.ch!;
                      const i = item.i;
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
                            width: hexW, height: hexH,
                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                            cursor: 'pointer', position: 'relative',
                            background: isFlashing
                              ? `linear-gradient(135deg, #ffcc3350, #ffcc3320)`
                              : isP1Selected
                                ? 'linear-gradient(135deg, rgba(255,204,51,0.2), rgba(255,136,0,0.1))'
                                : isHovered
                                  ? 'linear-gradient(135deg, rgba(40,35,20,0.95), rgba(30,25,15,0.9))'
                                  : 'linear-gradient(135deg, rgba(20,18,35,0.95), rgba(12,10,25,0.98))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s ease-out',
                            transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                            zIndex: isHovered ? 10 : 1,
                            filter: isP1Selected
                              ? 'drop-shadow(0 0 10px #ffcc3350)'
                              : isHovered
                                ? `drop-shadow(0 0 10px ${ch.eyeColor}50)`
                                : 'none',
                          }}
                        >
                          <CanvasPortrait
                            char={ch}
                            size={Math.min(hexW * 0.5, 45)}
                            isSelected={isP1Selected}
                            isHovered={isHovered}
                            facing={1}
                          />
                          {isP1Selected && (
                            <div style={{
                              position: 'absolute', bottom: '10%',
                              color: '#ffcc33', fontSize: 7, fontFamily: "'Orbitron', monospace",
                              fontWeight: 900, textShadow: '0 0 5px #ffcc33', letterSpacing: 2,
                            }}>P1</div>
                          )}
                        </div>
                      );
                    }
                    if (item.type === 'custom') {
                      return (
                        <div
                          key="custom"
                          onClick={() => { setShowCustomMenu(true); playConfirmSound(); }}
                          onMouseEnter={() => setHoveredIdx(null)}
                          style={{
                            width: hexW, height: hexH,
                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg, rgba(20,18,35,0.95), rgba(12,10,25,0.98))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}
                        >
                          <span style={{ color: '#ffcc33', fontSize: hexW * 0.3, fontWeight: 900, fontFamily: "'Orbitron', monospace", textShadow: '0 0 10px #ffcc3340' }}>?</span>
                        </div>
                      );
                    }
                    return (
                      <div
                        key="random"
                        onClick={handleRandomSelect}
                        onMouseEnter={() => setHoveredIdx(null)}
                        style={{
                          width: hexW, height: hexH,
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                          cursor: 'pointer',
                          background: 'linear-gradient(135deg, rgba(20,18,35,0.95), rgba(12,10,25,0.98))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{ fontSize: hexW * 0.25 }}>🎲</span>
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>

          {/* Character name below grid */}
          <div style={{
            marginTop: 10, height: 24, textAlign: 'center',
            color: hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < charRenderData.length
              ? '#ffcc33'
              : 'rgba(255,255,255,0.2)',
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(12px, 1.8vw, 18px)',
            letterSpacing: 5, fontWeight: 900,
            textShadow: hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < charRenderData.length
              ? '0 0 15px #ffcc3360'
              : 'none',
            transition: 'all 0.2s',
          }}>
            {hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < charRenderData.length
              ? charRenderData[hoveredIdx].name
              : ''}
          </div>
        </div>
      </div>

      {/* === BOTTOM BAR === */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 25px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 100%)',
        borderTop: '2px solid rgba(255,204,51,0.15)',
      }}>
        <div style={{
          color: 'rgba(255,204,51,0.4)', fontFamily: "'Orbitron', monospace",
          fontSize: 'clamp(7px, 0.9vw, 10px)', letterSpacing: 2,
        }}>
          1P: WASD + F/G/H
        </div>
        <button onClick={() => setGameState('MENU')} style={{
          padding: '6px 25px', background: 'transparent',
          border: '1px solid rgba(255,204,51,0.3)', color: '#ffcc33',
          cursor: 'pointer', fontFamily: "'Orbitron', monospace",
          fontSize: 'clamp(8px, 1.1vw, 11px)', letterSpacing: 4,
          transition: 'all 0.3s', textShadow: '0 0 8px #ffcc3330',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#ffcc33'; e.currentTarget.style.boxShadow = '0 0 15px #ffcc3330'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,204,51,0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
        >VOLVER</button>
        <div style={{
          color: 'rgba(255,204,51,0.4)', fontFamily: "'Orbitron', monospace",
          fontSize: 'clamp(7px, 0.9vw, 10px)', letterSpacing: 2, textAlign: 'right',
        }}>
          2P: ↑↓←→ + [ ] \
        </div>
      </div>

      {/* Golden bottom border */}
      <div style={{
        position: 'relative', zIndex: 3, height: 4,
        background: 'linear-gradient(90deg, transparent 5%, #ffcc33 20%, #ff8800 50%, #ffcc33 80%, transparent 95%)',
        boxShadow: '0 -2px 15px #ffcc3340',
      }} />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

// ===== Stat bar component =====
const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
    <span style={{
      color: 'rgba(255,255,255,0.4)', fontFamily: "'Orbitron', monospace",
      fontSize: 7, letterSpacing: 1,
    }}>{label}</span>
    <div style={{
      flex: 1, height: 3, background: 'rgba(255,255,255,0.08)',
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: `${value * 100}%`,
        background: `linear-gradient(90deg, ${color}60, ${color})`,
        boxShadow: `0 0 6px ${color}40`,
        transition: 'width 0.3s ease-out',
      }} />
    </div>
  </div>
);

export default CharacterSelect;
