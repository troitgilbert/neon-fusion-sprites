// Sprite sheet animation system for Edowado
// Uses horizontal sprite strips generated in Melty Blood pixel art style

import idleSheet from '@/assets/edowado-idle-sheet.png';
import walkSheet from '@/assets/edowado-walk-sheet.png';
import attackSheet from '@/assets/edowado-attack-sheet.png';
import jumpSheet from '@/assets/edowado-jump-sheet.png';
import hurtSheet from '@/assets/edowado-hurt-sheet.png';
import blockSheet from '@/assets/edowado-block-sheet.png';
import dashSheet from '@/assets/edowado-dash-sheet.png';
import specialSheet from '@/assets/edowado-special-sheet.png';
import idleImg from '@/assets/edowado-idle1.png';

export type SpriteState = 'idle' | 'walk' | 'attack' | 'jump' | 'fly' | 'block' | 'hurt' | 'dash' | 'special';

// Sheet config: each sheet is a horizontal strip, we auto-detect frame count from aspect ratio
interface SheetConfig {
  src: string;
  cols: number;   // frames in top row
  rows: number;   // rows in sheet
  totalFrames: number;
  speed: number;  // frames per game tick multiplier
  loop: boolean;
}

const SHEET_CONFIGS: Record<SpriteState, SheetConfig> = {
  idle:    { src: idleSheet,    cols: 8, rows: 1, totalFrames: 8,  speed: 0.1,  loop: true },
  walk:    { src: walkSheet,    cols: 8, rows: 1, totalFrames: 8,  speed: 0.15, loop: true },
  attack:  { src: attackSheet,  cols: 4, rows: 2, totalFrames: 8,  speed: 0.22, loop: false },
  jump:    { src: jumpSheet,    cols: 5, rows: 1, totalFrames: 5,  speed: 0.1,  loop: false },
  fly:     { src: jumpSheet,    cols: 5, rows: 1, totalFrames: 5,  speed: 0.08, loop: true },
  block:   { src: blockSheet,   cols: 6, rows: 1, totalFrames: 6,  speed: 0.1,  loop: true },
  hurt:    { src: hurtSheet,    cols: 4, rows: 2, totalFrames: 8,  speed: 0.18, loop: false },
  dash:    { src: dashSheet,    cols: 3, rows: 1, totalFrames: 3,  speed: 0.2,  loop: false },
  special: { src: specialSheet, cols: 5, rows: 2, totalFrames: 10, speed: 0.12, loop: false },
};

// Loaded sheet images
const sheetImages: Map<SpriteState, HTMLImageElement> = new Map();
// Fallback single idle image
let idleFallback: HTMLImageElement | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

const loadPromise = (async () => {
  const entries = Object.entries(SHEET_CONFIGS) as [SpriteState, SheetConfig][];
  const results = await Promise.allSettled(
    entries.map(async ([state, config]) => {
      const img = await loadImage(config.src);
      sheetImages.set(state, img);
    })
  );
  // Load fallback idle
  try {
    idleFallback = await loadImage(idleImg);
  } catch {}
  console.log('Sprite sheets loaded:', results.filter(r => r.status === 'fulfilled').length, '/', entries.length);
})();

export function preloadSprites(): Promise<void> {
  return loadPromise;
}

/**
 * Draw Edowado sprite from sprite sheet
 */
export function drawEdowadoSprite(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  state: SpriteState,
  frame: number,
  side: number,
  scale: number = 1,
) {
  const config = SHEET_CONFIGS[state];
  const img = sheetImages.get(state);

  if (!img) {
    // Fallback to idle single image
    if (idleFallback) {
      const h = 85 * scale;
      const w = h * (idleFallback.width / idleFallback.height);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.translate(x, y);
      ctx.scale(side, 1);
      ctx.drawImage(idleFallback, -w / 2, -h + 15, w, h);
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = '#c02020';
      ctx.fillRect(x - 15 * scale, y - 40 * scale, 30 * scale, 45 * scale);
      ctx.restore();
    }
    return;
  }

  // Calculate frame index
  const frameIdx = config.loop
    ? Math.floor(frame * config.speed) % config.totalFrames
    : Math.min(Math.floor(frame * config.speed), config.totalFrames - 1);

  // Calculate source rect from sheet
  const frameW = img.width / config.cols;
  const frameH = img.height / config.rows;
  const col = frameIdx % config.cols;
  const row = Math.floor(frameIdx / config.cols);

  const sx = col * frameW;
  const sy = row * frameH;

  // Draw
  const targetHeight = 120 * scale;
  const aspect = frameW / frameH;
  const targetWidth = targetHeight * aspect;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(x, y);
  ctx.scale(side, 1);
  ctx.drawImage(
    img,
    sx, sy, frameW, frameH,
    -targetWidth / 2, -targetHeight + 15,
    targetWidth, targetHeight
  );
  ctx.restore();
}

/**
 * Get the idle sprite image for menus
 */
export function getIdleSpriteImage(): HTMLImageElement | null {
  return idleFallback || sheetImages.get('idle') || null;
}

/**
 * Draw idle sprite for menu use
 */
export function drawIdleMenuSprite(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  width: number, height: number
) {
  const img = idleFallback || sheetImages.get('idle');
  if (!img) return;
  
  if (img === idleFallback) {
    ctx.drawImage(img, x, y, width, height);
  } else {
    // Draw first frame of idle sheet
    const config = SHEET_CONFIGS.idle;
    const frameW = img.width / config.cols;
    const frameH = img.height / config.rows;
    ctx.drawImage(img, 0, 0, frameW, frameH, x, y, width, height);
  }
}

/**
 * Get sprite state from fighter properties
 */
export function getSpriteState(
  hitFlash: number, stun: number, isBlocking: boolean,
  handMode: string, isGrounded: boolean, vx: number,
  isFlying: boolean = false, isDashing: boolean = false
): SpriteState {
  if (hitFlash > 0 && stun > 0) return 'hurt';
  if (isBlocking) return 'block';
  if (handMode === 'strike' || handMode === 'together' || handMode === 'slam') return 'attack';
  if (isDashing && Math.abs(vx) > 8) return 'dash';
  if (isFlying) return 'fly';
  if (!isGrounded) return 'jump';
  if (Math.abs(vx) > 1.5) return 'walk';
  return 'idle';
}
