import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA, SHOP_CATALOG } from '../game/constants';
import type { CustomCharData } from '../game/types';
import { playSelectSound, playConfirmSound } from '../game/audio';
import { drawEdowadoSprite } from '../game/sprites';

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

  const skinC = customChar ? customChar.skinColor : (char ? char.skinColor : (charIdx === 0 ? '#f5deb3' : '#f5d1ad'));
  const clothC = customChar ? customChar.clothesColor : (char ? char.clothesColor : (charIdx === 0 ? '#b00000' : '#ffffff'));
  const pantsC = customChar ? (customChar.pantsColor || '#000') : (char ? char.pantsColor : '#000');
  const hairC = customChar ? (customChar.hairColor || customChar.clothesColor) : (char ? char.hairColor : (charIdx === 0 ? '#5a3a1a' : '#ffffff'));
  const eyeC = customChar ? customChar.eyesColor : (char ? char.eyeColor : (charIdx === 0 ? '#00ffff' : '#ffff00'));
  const handC = customChar ? customChar.handsColor : (char ? char.handsColor : (charIdx === 0 ? '#d4af37' : '#f5d1ad'));
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
      const sway = Math.sin(t * 0.025) * 1.5;
      const sc = Math.min(W, H) / 75;

      ctx.save();
      ctx.translate(W / 2 + sway, H * 0.43);
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
      // Empty silhouette with intense pulsing ?
      ctx.globalAlpha = 0.15;
      ctx.beginPath(); ctx.arc(W / 2, H * 0.42, Math.min(W, H) * 0.25, 0, Math.PI * 2);
      const emptyGlow = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, Math.min(W, H) * 0.25);
      emptyGlow.addColorStop(0, color);
      emptyGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = emptyGlow; ctx.fill();

      // Pulsing ring
      ctx.globalAlpha = 0.25 + Math.sin(t * 0.05) * 0.15;
      ctx.beginPath(); ctx.arc(W / 2, H * 0.42, Math.min(W, H) * 0.2, 0, Math.PI * 2);
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();

      // Big bright ?
      ctx.globalAlpha = 0.5 + Math.sin(t * 0.04) * 0.25;
      ctx.font = `bold ${Math.min(W, H) * 0.35}px Orbitron, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 30;
      ctx.fillText('?', W / 2, H * 0.42);
      ctx.shadowBlur = 0;
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

// ===== AAA Background matching Main Menu style =====
const BgCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Stars with depth
    type Star = { x: number; y: number; z: number; size: number; color: [number,number,number]; twinkleSpeed: number; twinkleOffset: number };
    const stars: Star[] = [];
    const starColors: [number,number,number][] = [[255,255,255],[200,220,255],[255,200,180],[180,200,255],[255,240,200]];
    for (let i = 0; i < 800; i++) {
      stars.push({
        x: Math.random(), y: Math.random(),
        z: Math.random(),
        size: Math.random() * 2.2 + 0.3,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        twinkleSpeed: Math.random() * 0.025 + 0.008,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    // Cool grayscale nebulae
    const nebulae = [
      { bx: 0.12, by: 0.18, r: 0.45, color: [80,80,90], alpha: 0.12, sx: 0.0003, sy: 0.0004 },
      { bx: 0.82, by: 0.72, r: 0.5, color: [100,100,110], alpha: 0.11, sx: 0.0002, sy: 0.0003 },
      { bx: 0.48, by: 0.08, r: 0.35, color: [120,120,130], alpha: 0.09, sx: 0.00025, sy: 0.0002 },
      { bx: 0.72, by: 0.32, r: 0.3, color: [60,60,70], alpha: 0.08, sx: 0.00035, sy: 0.0005 },
      { bx: 0.28, by: 0.78, r: 0.38, color: [90,90,100], alpha: 0.08, sx: 0.0004, sy: 0.00025 },
      { bx: 0.55, by: 0.52, r: 0.55, color: [70,70,80], alpha: 0.07, sx: 0.0002, sy: 0.00015 },
    ];

    // Shooting stars
    type ShootingStar = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; trail: {x:number;y:number}[]; brightness: number };
    const shootingStars: ShootingStar[] = [];

    // Particles (warm colored, floating upward)
    type Particle = { x: number; y: number; vx: number; vy: number; size: number; life: number; maxLife: number; color: [number,number,number] };
    const particles: Particle[] = [];
    const pColors: [number,number,number][] = [[180,180,190],[200,200,210],[140,140,150],[220,220,230],[160,160,170]];

    let time = 0;
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.scale(dpr, dpr);
      time++;

    // Deep cool grayscale background
      const bgGrad = ctx.createLinearGradient(0, 0, W * 0.3, H);
      bgGrad.addColorStop(0, '#060608');
      bgGrad.addColorStop(0.3, '#0a0a0e');
      bgGrad.addColorStop(0.7, '#0c0c10');
      bgGrad.addColorStop(1, '#080809');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Nebulae (warm orange/amber gas clouds)
      for (const n of nebulae) {
        const cx = (n.bx + Math.sin(time * n.sx) * 0.06) * W;
        const cy = (n.by + Math.cos(time * n.sy) * 0.05) * H;
        const r = n.r * Math.max(W, H);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `rgba(${n.color[0]},${n.color[1]},${n.color[2]},${n.alpha})`);
        grad.addColorStop(0.35, `rgba(${n.color[0]},${n.color[1]},${n.color[2]},${n.alpha * 0.45})`);
        grad.addColorStop(0.7, `rgba(${n.color[0]},${n.color[1]},${n.color[2]},${n.alpha * 0.1})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      // Spiral galaxy (top-right)
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.translate(W * 0.82, H * 0.2);
      ctx.rotate(time * 0.0002);
      const gxSize = W * 0.08;
      const gxCore = ctx.createRadialGradient(0, 0, 0, 0, 0, gxSize * 0.3);
      gxCore.addColorStop(0, 'rgba(220,220,230,0.8)');
      gxCore.addColorStop(0.5, 'rgba(160,160,170,0.3)');
      gxCore.addColorStop(1, 'transparent');
      ctx.fillStyle = gxCore;
      ctx.fillRect(-gxSize, -gxSize, gxSize * 2, gxSize * 2);
      for (let arm = 0; arm < 2; arm++) {
        ctx.beginPath();
        for (let t = 0; t < 6; t += 0.05) {
          const angle = t + arm * Math.PI;
          const r = t * gxSize * 0.15;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(200,200,210,0.25)';
        ctx.lineWidth = gxSize * 0.06;
        ctx.stroke();
      }
      ctx.restore();

      // Small galaxy (bottom-left)
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.translate(W * 0.12, H * 0.78);
      ctx.rotate(-0.4 + time * 0.00015);
      const gx2 = W * 0.05;
      const gx2Core = ctx.createRadialGradient(0, 0, 0, 0, 0, gx2 * 0.4);
      gx2Core.addColorStop(0, 'rgba(180,140,255,0.7)');
      gx2Core.addColorStop(0.5, 'rgba(120,80,200,0.25)');
      gx2Core.addColorStop(1, 'transparent');
      ctx.fillStyle = gx2Core;
      ctx.fillRect(-gx2, -gx2, gx2 * 2, gx2 * 2);
      for (let arm = 0; arm < 2; arm++) {
        ctx.beginPath();
        for (let t = 0; t < 5; t += 0.06) {
          const angle = t + arm * Math.PI;
          const r = t * gx2 * 0.16;
          if (t === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
          else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.strokeStyle = 'rgba(160,120,240,0.2)';
        ctx.lineWidth = gx2 * 0.07;
        ctx.stroke();
      }
      ctx.restore();

      // Small gray planet (top area only - removed ringed planet near P2)
      const p2x = W * 0.25, p2y = H * 0.18, p2r = W * 0.02;
      const p2grad = ctx.createRadialGradient(p2x - p2r * 0.3, p2y - p2r * 0.3, p2r * 0.05, p2x, p2y, p2r);
      p2grad.addColorStop(0, 'rgba(200,200,210,0.6)');
      p2grad.addColorStop(0.5, 'rgba(140,140,150,0.4)');
      p2grad.addColorStop(1, 'rgba(80,80,90,0.2)');
      ctx.beginPath(); ctx.arc(p2x, p2y, p2r, 0, Math.PI * 2); ctx.fillStyle = p2grad; ctx.fill();

      // Cosmic dust band
      ctx.save();
      ctx.globalAlpha = 0.012 + Math.sin(time * 0.0005) * 0.004;
      ctx.translate(W * 0.5, H * 0.5);
      ctx.rotate(0.35 + Math.sin(time * 0.0001) * 0.04);
      const dustGrad = ctx.createLinearGradient(-W, 0, W, 0);
      dustGrad.addColorStop(0, 'transparent');
      dustGrad.addColorStop(0.25, 'rgba(120,120,130,1)');
      dustGrad.addColorStop(0.5, 'rgba(100,100,110,1)');
      dustGrad.addColorStop(0.75, 'rgba(80,80,90,1)');
      dustGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = dustGrad;
      ctx.fillRect(-W, -H * 0.12, W * 2, H * 0.24);
      ctx.restore();

      // Stars with parallax depth
      for (const s of stars) {
        const depth = 0.3 + s.z * 0.7;
        const twinkle = (Math.sin(time * s.twinkleSpeed + s.twinkleOffset) + 1) * 0.5;
        const alpha = depth * (0.35 + twinkle * 0.65);
        const sz = s.size * depth;
        const sx = s.x * W, sy = s.y * H;

        // Glow
        if (sz > 0.8) {
          const glowR = sz * (3 + twinkle * 4);
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
          glow.addColorStop(0, `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${alpha * 0.35})`);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.fillRect(sx - glowR, sy - glowR, glowR * 2, glowR * 2);
        }

        // Core
        ctx.beginPath();
        ctx.arc(sx, sy, sz * (0.7 + twinkle * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${alpha})`;
        ctx.fill();

        // Cross flare on bright stars
        if (sz > 1.8 && twinkle > 0.75) {
          ctx.strokeStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${alpha * 0.25})`;
          ctx.lineWidth = 0.5;
          const fl = sz * 8 * twinkle;
          ctx.beginPath();
          ctx.moveTo(sx - fl, sy); ctx.lineTo(sx + fl, sy);
          ctx.moveTo(sx, sy - fl); ctx.lineTo(sx, sy + fl);
          ctx.stroke();
        }
      }

      // Floating warm particles
      if (Math.random() < 0.1 && particles.length < 50) {
        const col = pColors[Math.floor(Math.random() * pColors.length)];
        particles.push({
          x: Math.random() * W, y: H + 5,
          vx: (Math.random() - 0.5) * 1, vy: -Math.random() * 1.5 - 0.3,
          size: Math.random() * 2 + 0.5,
          life: 0, maxLife: 200 + Math.random() * 300, color: col,
        });
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx + Math.sin(time * 0.015 + p.y * 0.008) * 0.2;
        p.y += p.vy;
        const prog = p.life / p.maxLife;
        const a = prog < 0.1 ? prog * 10 : prog > 0.6 ? (1 - prog) / 0.4 : 1;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
        glow.addColorStop(0, `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${a * 0.2})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - p.size * 5, p.y - p.size * 5, p.size * 10, p.size * 10);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + a * 0.6), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${a * 0.6})`;
        ctx.fill();
        if (p.life >= p.maxLife) particles.splice(i, 1);
      }

      // Shooting stars
      if (Math.random() < 0.005) {
        const angle = Math.PI * 0.12 + Math.random() * Math.PI * 0.25;
        const speed = 10 + Math.random() * 15;
        shootingStars.push({
          x: Math.random() * W * 0.7, y: Math.random() * H * 0.35,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 0, maxLife: 35 + Math.random() * 25, trail: [],
          brightness: 0.6 + Math.random() * 0.4,
        });
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;
        ss.trail.push({ x: ss.x, y: ss.y });
        if (ss.trail.length > 30) ss.trail.shift();
        ss.x += ss.vx; ss.y += ss.vy;
        const fade = (1 - ss.life / ss.maxLife) * ss.brightness;
        for (let j = 0; j < ss.trail.length; j++) {
          const tp = ss.trail[j];
          const ta = (j / ss.trail.length) * fade * 0.6;
          const ts = (j / ss.trail.length) * 2.5;
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, ts, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220,240,255,${ta})`;
          ctx.fill();
        }
      const headG = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 15);
        headG.addColorStop(0, `rgba(255,255,255,${fade * 0.9})`);
        headG.addColorStop(0.3, `rgba(200,200,220,${fade * 0.35})`);
        headG.addColorStop(1, 'transparent');
        ctx.fillStyle = headG;
        ctx.fillRect(ss.x - 15, ss.y - 15, 30, 30);
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${fade})`;
        ctx.fill();
        if (ss.life >= ss.maxLife) shootingStars.splice(i, 1);
      }

      // Faint hex grid
      ctx.save();
      ctx.globalAlpha = 0.012;
      ctx.strokeStyle = '#999999';
      ctx.lineWidth = 0.3;
      const hexSize = 45;
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

      // P1/P2 side glows
      ctx.save();
      ctx.globalAlpha = 0.025;
      const p1Glow = ctx.createRadialGradient(0, H * 0.5, 0, 0, H * 0.5, W * 0.35);
      p1Glow.addColorStop(0, '#aabbcc');
      p1Glow.addColorStop(1, 'transparent');
      ctx.fillStyle = p1Glow;
      ctx.fillRect(0, 0, W * 0.5, H);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.025;
      const p2Glow2 = ctx.createRadialGradient(W, H * 0.5, 0, W, H * 0.5, W * 0.35);
      p2Glow2.addColorStop(0, '#aaaaaa');
      p2Glow2.addColorStop(1, 'transparent');
      ctx.fillStyle = p2Glow2;
      ctx.fillRect(W * 0.5, 0, W * 0.5, H);
      ctx.restore();

      // Vignette
      const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.75);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      // Cool lens glow
      const la = 0.02 + Math.sin(time * 0.006) * 0.01;
      const lens = ctx.createRadialGradient(W * 0.1, H * 0.12, 0, W * 0.1, H * 0.12, W * 0.35);
      lens.addColorStop(0, `rgba(180,180,200,${la})`);
      lens.addColorStop(0.5, `rgba(120,120,140,${la * 0.25})`);
      lens.addColorStop(1, 'transparent');
      ctx.fillStyle = lens;
      ctx.fillRect(0, 0, W, H);

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
  const [previewSkinId, setPreviewSkinId] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [cursorIdx, setCursorIdx] = useState(0);
  const [showCustomMenu, setShowCustomMenu] = useState(false);
  const [customChars, setCustomChars] = useState<(CustomCharData | null)[]>([null, null, null, null, null, null]);
  const [konamiProgress, setKonamiProgress] = useState(0);
  const [cheatActive, setCheatActive] = useState(false);
  const [selectFlash, setSelectFlash] = useState<number | null>(null);
  const skinJustClosedRef = useRef(false);

  // Reset selections when entering character select
  React.useEffect(() => {
    engine.p1Choice = null;
    engine.p2Choice = null;
    engine.selectedSkins = { p1: null, p2: null };
  }, []);

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

  // Skin color overrides for preview
  const SKIN_COLOR_MAP: Record<string, Record<string, Partial<CharRenderData>>> = {
    'KAITO': {
      'demonioBlanco': { skinColor: '#000000', clothesColor: '#1a1a1a', handsColor: '#000000' },
      'demonioBlanco2': { clothesColor: '#1a1a1a', handsColor: '#444444' },
    },
    'EDOWADO': {},
  };

  // Skin preview for portrait display (inline, not overlay)
  const skinPreviewChar = React.useMemo(() => {
    if (!skinSelectFor) return null;
    const renderCh = charRenderData[skinSelectFor.charIdx];
    if (!previewSkinId) return renderCh;
    const ch = CHAR_DATA[skinSelectFor.charIdx];
    const overrides = SKIN_COLOR_MAP[ch.name]?.[previewSkinId];
    if (!overrides) return renderCh;
    return { ...renderCh, ...overrides };
  }, [skinSelectFor, previewSkinId, charRenderData]);

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
          else if (item.type === 'custom') { if (!allReadyToFight) { setShowCustomMenu(true); playConfirmSound(); } }
          else if (item.type === 'random') handleRandomSelect();
          return;
        }
        case 'Enter': {
          // Guard: skip if skin menu was just closed (prevent button Enter from triggering)
          if (skinJustClosedRef.current) return;
          // If all players selected, proceed based on game mode
          const needsP2 = engine.mode === 'versus' || engine.mode === 'vs_cpu';
          const allSelected = needsP2
            ? (engine.p1Choice !== null && engine.p2Choice !== null)
            : (engine.p1Choice !== null);
          if (allSelected) {
            playConfirmSound();
            engine.proceedFromRoster();
          }
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

  const allReadyToFight = (() => {
    const needsP2 = engine.mode === 'versus' || engine.mode === 'vs_cpu';
    return needsP2
      ? (engine.p1Choice !== null && engine.p2Choice !== null)
      : (engine.p1Choice !== null);
  })();

  const handleSelect = (idx: number) => {
    if (allReadyToFight) return;
    playConfirmSound();
    setSelectFlash(idx);
    setTimeout(() => setSelectFlash(null), 300);
    setSkinSelectFor({ charIdx: idx, pNum: engine.p1Choice === null ? 1 : 2 });
  };

  const handleCustomSelect = (customIdx: number) => {
    if (allReadyToFight) return;
    const ch = customChars[customIdx];
    if (!ch) return;
    playConfirmSound();
    engine.confirmSkinChoice(100 + customIdx, null, engine.p1Choice === null ? 1 : 2);
    setShowCustomMenu(false);
  };

  const handleRandomSelect = () => {
    if (allReadyToFight) return;
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
    setPreviewSkinId(skinId);
  };

  const handleSkinCancel = () => {
    if (!skinSelectFor) return;
    // Deselect the character
    if (skinSelectFor.pNum === 1) {
      engine.p1Choice = null;
    } else {
      engine.p2Choice = null;
    }
    setSkinSelectFor(null);
    setPreviewSkinId(null);
  };

  // Keyboard controls for skin menu (NO Enter — only button confirms)
  React.useEffect(() => {
    if (!skinSelectFor) return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'Backspace') {
        handleSkinCancel();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [skinSelectFor]);

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

  // Pre-compute skin-related display data (must be before early returns)
  const p1CharBase = engine.p1Choice !== null && engine.p1Choice < 100 ? charRenderData[engine.p1Choice] : null;
  const p1CharWithSkin = React.useMemo(() => {
    if (!p1CharBase || !engine.selectedSkins.p1) return p1CharBase;
    const overrides = SKIN_COLOR_MAP[p1CharBase.name]?.[engine.selectedSkins.p1];
    if (!overrides) return p1CharBase;
    return { ...p1CharBase, ...overrides };
  }, [p1CharBase, engine.selectedSkins.p1]);

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




  const p1Custom = engine.p1Choice !== null && engine.p1Choice >= 100 ? customChars[engine.p1Choice - 100] : null;
  const hoveredChar = hoveredIdx !== null && hoveredIdx < 100 ? charRenderData[hoveredIdx] : null;

  // If skin selector is open, show the skin-altered character in the portrait
  const displayP1 = (skinSelectFor && skinSelectFor.pNum === 1 && skinPreviewChar)
    ? skinPreviewChar
    : (p1CharWithSkin || (!isP2Turn ? hoveredChar : null));
  const displayP2 = (skinSelectFor && skinSelectFor.pNum === 2 && skinPreviewChar)
    ? skinPreviewChar
    : (isP2Turn ? hoveredChar : null);

  // Get skin display name
  const getSkinDisplayName = (charIdx: number | null, skinId: string | null): string | null => {
    if (charIdx === null || !skinId) return null;
    const ch = CHAR_DATA[charIdx];
    if (!ch) return null;
    const catalog = SHOP_CATALOG[ch.name] || [];
    const skin = catalog.find((s: any) => s.id === skinId);
    return skin?.name || skinId;
  };

  const skinSelectCharName = skinSelectFor ? CHAR_DATA[skinSelectFor.charIdx].name : null;
  const skinSelectSkinName = skinSelectFor && previewSkinId
    ? getSkinDisplayName(skinSelectFor.charIdx, previewSkinId)
    : null;
  const p1SkinName = getSkinDisplayName(engine.p1Choice, engine.selectedSkins.p1);
  
  const p1Name = skinSelectFor && skinSelectFor.pNum === 1
    ? (skinSelectCharName || '???')
    : (p1Custom ? p1Custom.name : (displayP1 ? displayP1.name : '???'));
  const p1SubName = skinSelectFor && skinSelectFor.pNum === 1
    ? skinSelectSkinName
    : p1SkinName;
  const p2Name = skinSelectFor && skinSelectFor.pNum === 2
    ? (skinSelectCharName || '???')
    : (displayP2 ? displayP2.name : (isP2Turn ? '???' : '---'));
  const p2SubName = skinSelectFor && skinSelectFor.pNum === 2
    ? skinSelectSkinName
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ overflow: 'hidden', animation: 'fadeIn 0.4s ease-out' }}>
      <BgCanvas />

      {/* === GOLDEN TOP BORDER with animated shimmer === */}
      <div style={{
        position: 'relative', zIndex: 3, height: 3,
        background: 'linear-gradient(90deg, transparent 2%, #ffcc33 15%, #ff8800 35%, #ffee88 50%, #ff8800 65%, #ffcc33 85%, transparent 98%)',
        boxShadow: '0 2px 20px #ffcc3360, 0 0 40px #ff880020',
      }} />

      {/* === TOP BAR: P1 SIDE | TITLE | P2 SIDE === */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 30px',
        background: 'linear-gradient(180deg, rgba(5,5,15,0.95) 0%, rgba(10,8,25,0.85) 60%, transparent 100%)',
        borderBottom: '1px solid rgba(255,204,51,0.15)',
      }}>
        {/* P1 indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: displayP1 ? '#00ffff' : 'rgba(0,255,255,0.3)',
            boxShadow: displayP1 ? '0 0 12px #00ffff, 0 0 25px #00ffff60' : 'none',
            transition: 'all 0.4s',
          }} />
          <span style={{
            color: displayP1 ? '#00ffff' : 'rgba(0,255,255,0.7)',
            fontFamily: "'Orbitron', monospace", fontSize: 'clamp(10px, 1.4vw, 15px)',
            letterSpacing: 4, fontWeight: 900,
            textShadow: displayP1 ? '0 0 15px #00ffff, 0 0 30px #00ffff80' : '0 0 8px #00ffff40',
            transition: 'all 0.3s',
          }}>PLAYER 1</span>
        </div>

        {/* Center title - HD golden */}
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(16px, 3vw, 34px)', fontWeight: 900,
            letterSpacing: 10,
            background: 'linear-gradient(180deg, #fff8e0 0%, #ffee88 15%, #ffcc33 35%, #ff9900 55%, #cc7700 75%, #ffcc33 90%, #ffee88 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            textShadow: 'none',
            filter: 'drop-shadow(0 0 8px rgba(255,204,51,0.4)) drop-shadow(0 2px 0 rgba(0,0,0,0.9)) drop-shadow(0 4px 8px rgba(0,0,0,0.6))',
          }}>
            {isP2Turn ? 'PLAYER SELECT' : 'CHARACTER SELECT'}
          </div>
          {/* Metallic underline accent */}
          <div style={{
            margin: '4px auto 0', width: 'clamp(120px, 20vw, 250px)', height: 2,
            background: 'linear-gradient(90deg, transparent, #ffcc33 20%, #ffee88 50%, #ffcc33 80%, transparent)',
            boxShadow: '0 0 8px rgba(255,204,51,0.3)',
          }} />
          <div style={{
            color: 'rgba(255,204,51,0.6)', fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(6px, 0.7vw, 8px)', letterSpacing: 6, marginTop: 3,
          }}>CHOOSE YOUR FIGHTER</div>
        </div>

        {/* P2 indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            color: isP2Turn ? '#ff8c00' : 'rgba(255,140,0,0.7)',
            fontFamily: "'Orbitron', monospace", fontSize: 'clamp(10px, 1.4vw, 15px)',
            letterSpacing: 4, fontWeight: 900,
            textShadow: isP2Turn ? '0 0 15px #ff8c00, 0 0 30px #ff8c0080' : '0 0 8px #ff8c0040',
            transition: 'all 0.3s',
          }}>PLAYER 2</span>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isP2Turn ? '#ff8c00' : 'rgba(255,140,0,0.3)',
            boxShadow: isP2Turn ? '0 0 12px #ff8c00, 0 0 25px #ff8c0060' : 'none',
            transition: 'all 0.4s',
          }} />
        </div>
      </div>

      {/* === MAIN AREA: Everything layered in one space === */}
      <div style={{ flex: 1, position: 'relative', zIndex: 2, minHeight: 0, overflow: 'hidden' }}>

        {/* LAYER 1 (behind): Big portraits P1 left side, P2 right side */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1,
          pointerEvents: 'none', padding: '0 clamp(10px, 3vw, 40px)',
        }}>
          {/* P1 Portrait with decorative frame */}
          <div style={{ width: 'clamp(220px, 32vw, 420px)', height: 'clamp(220px, 32vw, 420px)', position: 'relative' }}>
            <BigPortrait char={displayP1 || null} customChar={p1Custom} color="#00ffff" facing={1} label="P1" />
            {/* Name plate */}
            <div style={{
              position: 'absolute', bottom: 8, left: '10%', right: '10%', textAlign: 'center',
              background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.9))',
              padding: '12px 0 6px',
            }}>
              <div style={{
                color: '#00ffff', fontFamily: "'Orbitron', monospace",
                fontSize: 'clamp(11px, 1.8vw, 18px)', fontWeight: 900,
                letterSpacing: 3,
                textShadow: '0 0 15px #00ffff60, 0 0 30px #00ffff30, 0 2px 6px rgba(0,0,0,0.9)',
                background: 'linear-gradient(180deg, #b0ffff 0%, #00ffff 50%, #0088aa 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{p1Name}</div>
              {p1SubName && (
                <div style={{
                  color: '#7ab8ff', fontFamily: "'Orbitron', monospace",
                  fontSize: 'clamp(7px, 1vw, 11px)', letterSpacing: 2, marginTop: 2,
                  textShadow: '0 0 8px #5a9ae060',
                }}>{p1SubName}</div>
              )}
              {displayP1 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 4, padding: '0 10%' }}>
                  <StatBar label="ATK" value={0.7} color="#ff4444" />
                  <StatBar label="SPD" value={0.8} color="#00ffff" />
                  <StatBar label="DEF" value={0.5} color="#ffcc33" />
                </div>
              )}
            </div>
          </div>

          {/* P2 Portrait with decorative frame */}
          <div style={{ width: 'clamp(220px, 32vw, 420px)', height: 'clamp(220px, 32vw, 420px)', position: 'relative' }}>
            <BigPortrait char={displayP2 || null} customChar={null} color="#ff8c00" facing={-1} label="P2" />
            <div style={{
              position: 'absolute', bottom: 8, left: '10%', right: '10%', textAlign: 'center',
              background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.9))',
              padding: '12px 0 6px',
            }}>
              <div style={{
                color: '#ff8c00', fontFamily: "'Orbitron', monospace",
                fontSize: 'clamp(11px, 1.8vw, 18px)', fontWeight: 900,
                letterSpacing: 3,
                textShadow: '0 0 15px #ff8c0060, 0 0 30px #ff8c0030, 0 2px 6px rgba(0,0,0,0.9)',
                background: 'linear-gradient(180deg, #ffe0b0 0%, #ff8c00 50%, #aa5500 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{p2Name}</div>
              {p2SubName && (
                <div style={{
                  color: '#ffaa44', fontFamily: "'Orbitron', monospace",
                  fontSize: 'clamp(7px, 1vw, 11px)', letterSpacing: 2, marginTop: 2,
                  textShadow: '0 0 8px #ff8c0060',
                }}>{p2SubName}</div>
              )}
              {displayP2 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 4, padding: '0 10%' }}>
                  <StatBar label="ATK" value={0.7} color="#ff4444" />
                  <StatBar label="SPD" value={0.8} color="#ff8c00" />
                  <StatBar label="DEF" value={0.5} color="#ffcc33" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LAYER 2 (front): Idle sprites on top + roster grid in center */}
        <div style={{
          position: 'relative', zIndex: 5, height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {/* Idle sprites at the top */}
          <div style={{ width: '50%', height: '30%', position: 'relative', pointerEvents: 'none' }}>
            <StageCanvas p1Char={displayP1 || null} p2Char={displayP2 || null} p1Custom={p1Custom} />
          </div>

          {/* Roster grid with frame - diamond distribution like classic fighters */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '8px 16px', pointerEvents: allReadyToFight ? 'none' : 'auto',
            position: 'relative',
            opacity: allReadyToFight ? 0.4 : 1,
            transition: 'opacity 0.4s ease',
            filter: allReadyToFight ? 'grayscale(0.5)' : 'none',
          }}>

          {/* Honeycomb hex grid - proper beehive layout */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, position: 'relative', zIndex: 2 }}>
            {(() => {
              const allItems = [
                ...charRenderData.map((ch, i) => ({ type: 'char' as const, ch, i })),
                { type: 'custom' as const, ch: null as any, i: -1 },
                { type: 'random' as const, ch: null as any, i: -2 },
              ];
              const hexW = Math.min(window.innerWidth * 0.068, 66);
              const hexH = hexW * 1.155;
              const cols = 4;
              const totalItems = allItems.length;
              const rows: (typeof allItems[number] | null)[][] = [];
              let idx = 0;
              let rowNum = 0;
              while (idx < totalItems) {
                // Odd rows (0-indexed) get offset and same col count
                const rowCols = cols;
                const row: (typeof allItems[number] | null)[] = [];
                for (let c = 0; c < rowCols && idx < totalItems; c++) {
                  row.push(allItems[idx++]);
                }
                rows.push(row);
                rowNum++;
              }

              // Each hex cell is wrapped with a white-bordered hex container
              const HexCell: React.FC<{ children: React.ReactNode; style: React.CSSProperties }> = ({ children, style }) => (
                <div style={{
                  width: hexW + 4, height: hexH + 4,
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  background: 'rgba(255,255,255,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: hexW, height: hexH,
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    ...style,
                  }}>
                    {children}
                  </div>
                </div>
              );

              let flatIdx = 0;
              return rows.map((row, rIdx) => (
                <div key={rIdx} style={{
                  display: 'flex', gap: 3, justifyContent: 'center',
                  marginTop: rIdx > 0 ? -hexH * 0.19 : 0,
                  marginLeft: rIdx % 2 !== 0 ? (hexW + 4 + 3) * 0.5 : 0,
                }}>
                  {row.map((item) => {
                    if (!item) return null;
                    const myFlatIdx = flatIdx++;
                    const isCursor = cursorIdx === myFlatIdx;

                    if (item.type === 'char') {
                      const ch = item.ch!;
                      const i = item.i;
                      const isP1Selected = engine.p1Choice === i;
                      const isHovered = hoveredIdx === i || isCursor;
                      const isFlashing = selectFlash === i;
                      return (
                        <div
                          key={ch.name}
                          onClick={() => handleSelect(i)}
                          onMouseEnter={() => { setHoveredIdx(i); playSelectSound(); }}
                          onMouseLeave={() => setHoveredIdx(null)}
                          style={{
                            transition: 'all 0.15s ease-out',
                            transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                            zIndex: isHovered ? 10 : 1,
                            cursor: 'pointer',
                            filter: isP1Selected
                              ? 'drop-shadow(0 0 10px rgba(255,204,51,0.5))'
                              : isHovered
                                ? `drop-shadow(0 0 12px ${ch.eyeColor}60)`
                                : 'none',
                          }}
                        >
                          <HexCell style={{
                            background: isFlashing
                              ? 'linear-gradient(135deg, rgba(255,204,51,0.5), rgba(255,136,0,0.3))'
                              : isP1Selected
                                ? 'linear-gradient(135deg, rgba(255,204,51,0.25), rgba(255,136,0,0.15))'
                                : isHovered
                                  ? 'linear-gradient(135deg, rgba(40,35,20,0.98), rgba(30,25,12,0.98))'
                                  : 'linear-gradient(135deg, rgba(12,12,22,0.98), rgba(8,8,18,0.98))',
                            position: 'relative',
                          }}>
                            <CanvasPortrait
                              char={ch}
                              size={Math.min(hexW * 0.48, 40)}
                              isSelected={isP1Selected}
                              isHovered={isHovered}
                              facing={1}
                            />
                            {isP1Selected && (
                              <div style={{
                                position: 'absolute', bottom: '12%',
                                color: '#ffcc33', fontSize: 7, fontFamily: "'Orbitron', monospace",
                                fontWeight: 900, textShadow: '0 0 8px #ffcc33', letterSpacing: 2,
                              }}>P1</div>
                            )}
                          </HexCell>
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
                            transition: 'all 0.15s', cursor: 'pointer',
                            transform: isCursor ? 'scale(1.15)' : 'scale(1)',
                            zIndex: isCursor ? 10 : 1,
                            filter: isCursor ? 'drop-shadow(0 0 10px rgba(255,204,51,0.3))' : 'none',
                          }}
                        >
                          <HexCell style={{
                            background: isCursor
                              ? 'linear-gradient(135deg, rgba(40,35,20,0.98), rgba(30,25,12,0.98))'
                              : 'linear-gradient(135deg, rgba(12,12,22,0.98), rgba(8,8,18,0.98))',
                          }}>
                            <span style={{ color: '#ffcc33', fontSize: hexW * 0.3, fontWeight: 900, fontFamily: "'Orbitron', monospace", textShadow: '0 0 12px #ffcc3350' }}>?</span>
                          </HexCell>
                        </div>
                      );
                    }
                    return (
                      <div
                        key="random"
                        onClick={handleRandomSelect}
                        onMouseEnter={() => setHoveredIdx(null)}
                        style={{
                          transition: 'all 0.15s', cursor: 'pointer',
                          transform: isCursor ? 'scale(1.15)' : 'scale(1)',
                          zIndex: isCursor ? 10 : 1,
                          filter: isCursor ? 'drop-shadow(0 0 10px rgba(255,204,51,0.3))' : 'none',
                        }}
                      >
                        <HexCell style={{
                          background: isCursor
                            ? 'linear-gradient(135deg, rgba(40,35,20,0.98), rgba(30,25,12,0.98))'
                            : 'linear-gradient(135deg, rgba(12,12,22,0.98), rgba(8,8,18,0.98))',
                        }}>
                          <span style={{ fontSize: hexW * 0.25 }}>🎲</span>
                        </HexCell>
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>




        </div>
        </div>
      </div>

      {/* === SKIN SELECTOR OVERLAY PANEL === */}
      {skinSelectFor && (() => {
        const skins = availableSkins(skinSelectFor.charIdx);
        const ch = CHAR_DATA[skinSelectFor.charIdx];
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 60,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(20px)',
            animation: 'fadeIn 0.3s ease-out',
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 4,
                color: 'rgba(100,180,255,0.5)', marginBottom: 6,
              }}>▸ PLAYER {skinSelectFor.pNum}</div>
              <h2 style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 'clamp(18px, 3vw, 28px)', fontWeight: 900, letterSpacing: 6,
                color: '#7ab8ff',
                textShadow: '0 0 20px rgba(80,160,255,0.4)',
                marginBottom: 4,
              }}>SELECCIONAR ESTILO</h2>
              <div style={{
                fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
                color: '#aad4ff',
              }}>{ch.name}</div>
              <div style={{
                margin: '8px auto 0', width: 80, height: 2,
                background: 'linear-gradient(90deg, transparent, rgba(100,180,255,0.6), transparent)',
              }} />
            </div>

            {/* Skin list */}
            <div style={{ maxWidth: 500, width: '90%', maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {skins.map((skin) => {
                const renderCh = charRenderData[skinSelectFor.charIdx];
                const overrides = skin.id ? SKIN_COLOR_MAP[ch.name]?.[skin.id] : null;
                const previewData = overrides ? { ...renderCh, ...overrides } : renderCh;
                const isActive = previewSkinId === skin.id;
                const isSpecial = !!skin.id;
                return (
                  <button key={skin.id || 'original'} onClick={() => handleSkinConfirm(skin.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      border: `2px solid ${isActive ? '#7ab8ff' : 'rgba(80,150,255,0.15)'}`,
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(20,40,80,0.95), rgba(15,30,60,0.95))'
                        : 'linear-gradient(135deg, rgba(8,18,40,0.85), rgba(4,12,30,0.92))',
                      padding: '10px 16px', cursor: 'pointer',
                      fontFamily: "'Orbitron', monospace",
                      transition: 'all 0.3s',
                      textAlign: 'left', width: '100%', borderRadius: 4,
                      boxShadow: isActive ? '0 0 25px rgba(60,140,255,0.2)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'rgba(100,180,255,0.5)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'rgba(80,150,255,0.15)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    <div style={{
                      flexShrink: 0, border: `1px solid ${isActive ? 'rgba(120,180,255,0.3)' : 'rgba(60,100,180,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 3, borderRadius: 4,
                      background: 'radial-gradient(circle, rgba(30,60,120,0.2), transparent)',
                    }}>
                      <CanvasPortrait char={previewData} size={50} isSelected={isActive} facing={1} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, letterSpacing: 2, fontWeight: 800,
                        color: isActive ? '#ffffff' : isSpecial ? '#c0d8ff' : '#8aaac8',
                      }}>{skin.name}</div>
                      <span style={{
                        fontSize: 9, letterSpacing: 2, fontWeight: 600,
                        color: isSpecial ? '#5a9ae0' : '#3a5a7a',
                      }}>{isSpecial ? 'ESPECIAL' : 'BASE'}</span>
                    </div>
                    {isActive && <span style={{ color: '#7ab8ff', fontSize: 16, fontWeight: 900 }}>✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div style={{
              marginTop: 24, display: 'flex', gap: 14, justifyContent: 'center',
            }}>
              <button onClick={handleSkinCancel} style={{
                padding: '9px 28px', background: 'rgba(180,40,40,0.1)',
                border: '2px solid rgba(255,70,70,0.3)', color: '#cc5555',
                cursor: 'pointer', fontFamily: "'Orbitron', monospace",
                fontSize: 11, fontWeight: 700, letterSpacing: 3, borderRadius: 3,
                transition: 'all 0.3s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,40,40,0.2)'; e.currentTarget.style.borderColor = 'rgba(255,80,80,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(180,40,40,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,70,70,0.3)'; }}
              >CANCELAR</button>
              <button onClick={() => {
                playConfirmSound();
                engine.confirmSkinChoice(skinSelectFor.charIdx, previewSkinId, skinSelectFor.pNum);
                skinJustClosedRef.current = true;
                setTimeout(() => { skinJustClosedRef.current = false; }, 200);
                setSkinSelectFor(null);
                setPreviewSkinId(null);
              }} style={{
                padding: '9px 28px',
                background: 'linear-gradient(135deg, rgba(40,100,200,0.2), rgba(30,80,160,0.12))',
                border: '2px solid rgba(80,160,255,0.5)', color: '#7ab8ff',
                cursor: 'pointer', fontFamily: "'Orbitron', monospace",
                fontSize: 11, fontWeight: 700, letterSpacing: 3, borderRadius: 3,
                transition: 'all 0.3s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(40,100,200,0.35), rgba(30,80,160,0.25))'; e.currentTarget.style.borderColor = 'rgba(100,180,255,0.8)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(40,100,200,0.2), rgba(30,80,160,0.12))'; e.currentTarget.style.borderColor = 'rgba(80,160,255,0.5)'; }}
              >CONFIRMAR</button>
            </div>
          </div>
        );
      })()}


      {/* === BOTTOM BAR === */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 30px',
        background: 'linear-gradient(0deg, rgba(5,5,15,0.95) 0%, rgba(10,8,25,0.85) 60%, transparent 100%)',
        borderTop: '1px solid rgba(255,204,51,0.12)',
      }}>
        <div style={{
          color: 'rgba(255,204,51,0.6)', fontFamily: "'Orbitron', monospace",
          fontSize: 'clamp(7px, 0.85vw, 10px)', letterSpacing: 3,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: 'rgba(0,255,255,0.4)' }}>◆</span> 1P: WASD + F/G/H
        </div>

        {/* Center: CONTINUAR button or VOLVER */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {(() => {
            const needsP2 = engine.mode === 'versus' || engine.mode === 'vs_cpu';
            const allReady = needsP2
              ? (engine.p1Choice !== null && engine.p2Choice !== null)
              : (engine.p1Choice !== null);
            if (allReady && !skinSelectFor && !showCustomMenu) {
              return (
                <button onClick={() => { playConfirmSound(); engine.proceedFromRoster(); }} style={{
                  padding: '7px 30px',
                  background: 'linear-gradient(180deg, rgba(0,255,100,0.2), rgba(0,200,80,0.08))',
                  border: '2px solid rgba(0,255,100,0.6)', color: '#00ff66',
                  cursor: 'pointer', fontFamily: "'Orbitron', monospace",
                  fontSize: 'clamp(9px, 1.2vw, 13px)', letterSpacing: 5, fontWeight: 700,
                  transition: 'all 0.3s', textShadow: '0 0 12px #00ff6680',
                  position: 'relative', overflow: 'hidden',
                  animation: 'energyPulse 2s ease-in-out infinite',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ff66'; e.currentTarget.style.boxShadow = '0 0 25px rgba(0,255,100,0.4), inset 0 0 20px rgba(0,255,100,0.1)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,255,100,0.6)'; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = 'scale(1)'; }}
                >▶ CONTINUAR</button>
              );
            }
            return null;
          })()}
          <button onClick={() => setGameState('MENU')} style={{
            padding: '7px 30px', background: 'linear-gradient(180deg, rgba(255,204,51,0.15), rgba(255,204,51,0.06))',
            border: '2px solid rgba(255,204,51,0.5)', color: '#ffdd44',
            cursor: 'pointer', fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(9px, 1.2vw, 13px)', letterSpacing: 5, fontWeight: 700,
            transition: 'all 0.3s', textShadow: '0 0 12px #ffcc3380',
            position: 'relative', overflow: 'hidden',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ffcc33'; e.currentTarget.style.boxShadow = '0 0 20px #ffcc3330, inset 0 0 20px #ffcc3310'; e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,204,51,0.15), rgba(255,204,51,0.05))'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,204,51,0.25)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,204,51,0.08), rgba(255,204,51,0.03))'; }}
          >VOLVER</button>
        </div>

        <div style={{
          color: 'rgba(255,204,51,0.6)', fontFamily: "'Orbitron', monospace",
          fontSize: 'clamp(7px, 0.85vw, 10px)', letterSpacing: 3, textAlign: 'right',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          2P: ↑↓←→ + [ ] \ <span style={{ color: 'rgba(255,140,0,0.4)' }}>◆</span>
        </div>
      </div>

      {/* Golden bottom border */}
      <div style={{
        position: 'relative', zIndex: 3, height: 3,
        background: 'linear-gradient(90deg, transparent 2%, #ffcc33 15%, #ff8800 35%, #ffee88 50%, #ff8800 65%, #ffcc33 85%, transparent 98%)',
        boxShadow: '0 -2px 20px #ffcc3360, 0 0 40px #ff880020',
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
