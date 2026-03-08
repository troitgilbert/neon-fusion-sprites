// Image-based sprite system for Edowado
// Uses high-quality anime-style sprites

import idleSheetImg from '@/assets/edowado-idle-sheet.png';
import walk1Img from '@/assets/edowado-walk1.png';
import walk2Img from '@/assets/edowado-walk2.png';
import walk3Img from '@/assets/edowado-walk3.png';
import walk4Img from '@/assets/edowado-walk4.png';
import walk5Img from '@/assets/edowado-walk5.png';
import walk6Img from '@/assets/edowado-walk6.png';
import walk7Img from '@/assets/edowado-walk7.png';
import walk8Img from '@/assets/edowado-walk8.png';
import attackImg from '@/assets/edowado-attack.png';
import jumpImg from '@/assets/edowado-jump.png';
import flyImg from '@/assets/edowado-fly.png';
import blockImg from '@/assets/edowado-block.png';
import hurtImg from '@/assets/edowado-hurt.png';

export type SpriteState = 'idle' | 'walk' | 'attack' | 'jump' | 'fly' | 'block' | 'hurt';

// Preload all images
const imageCache: Map<string, HTMLImageElement> = new Map();
let imagesLoaded = false;

// Sprite sheet config: key -> { src, columns } for sheets, or just src for single frames
interface SpriteSheetInfo {
  src: string;
  columns: number; // 1 = single frame image
}

const SPRITE_SOURCES: Record<string, SpriteSheetInfo> = {
  idleSheet: { src: idleSheetImg, columns: 4 },
  walk1: { src: walk1Img, columns: 1 },
  walk2: { src: walk2Img, columns: 1 },
  walk3: { src: walk3Img, columns: 1 },
  walk4: { src: walk4Img, columns: 1 },
  walk5: { src: walk5Img, columns: 1 },
  walk6: { src: walk6Img, columns: 1 },
  walk7: { src: walk7Img, columns: 1 },
  walk8: { src: walk8Img, columns: 1 },
  attack: { src: attackImg, columns: 1 },
  jump: { src: jumpImg, columns: 1 },
  fly: { src: flyImg, columns: 1 },
  block: { src: blockImg, columns: 1 },
  hurt: { src: hurtImg, columns: 1 },
};

function loadImage(key: string, src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(key, img);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

const loadPromise = Promise.all(
  Object.entries(SPRITE_SOURCES).map(([key, info]) => loadImage(key, info.src))
).then(() => { imagesLoaded = true; });

export function preloadSprites(): Promise<void> {
  return loadPromise;
}

// Animation config - for sprite sheets, use { sheet, columns, frames, speed }
interface SheetAnim {
  type: 'sheet';
  sheetKey: string;
  columns: number;
  frames: number;
  speed: number;
}
interface KeysAnim {
  type: 'keys';
  keys: string[];
  speed: number;
}
type AnimConfig = SheetAnim | KeysAnim;

const SPRITE_FRAMES: Record<SpriteState, AnimConfig> = {
  idle:   { type: 'sheet', sheetKey: 'idleSheet', columns: 4, frames: 4, speed: 0.06 },
  walk:   { type: 'keys', keys: ['walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'walk6', 'walk7', 'walk8'], speed: 0.15 },
  attack: { type: 'keys', keys: ['attack'],  speed: 0.2 },
  jump:   { type: 'keys', keys: ['jump'],    speed: 0.1 },
  fly:    { type: 'keys', keys: ['fly'],     speed: 0.08 },
  block:  { type: 'keys', keys: ['block'],   speed: 0.08 },
  hurt:   { type: 'keys', keys: ['hurt'],    speed: 0.15 },
};

/**
 * Draw Edowado sprite using high-quality images
 */
export function drawEdowadoSprite(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  state: SpriteState,
  frame: number,
  side: number,
  scale: number = 1,
) {
  const data = SPRITE_FRAMES[state];
  if (!data) return;

  const targetHeight = 85 * scale;

  ctx.save();
  ctx.imageSmoothingEnabled = false; // pixel art looks better without smoothing
  ctx.translate(x, y);
  ctx.scale(side, 1);

  if (data.type === 'sheet') {
    const img = imageCache.get(data.sheetKey);
    if (!img) {
      ctx.fillStyle = '#c02020';
      ctx.fillRect(-15 * scale, -40 * scale, 30 * scale, 45 * scale);
      ctx.restore();
      return;
    }

    const frameIdx = Math.floor(frame * data.speed) % data.frames;
    const frameW = img.width / data.columns;
    const frameH = img.height;
    const aspect = frameW / frameH;
    const targetWidth = targetHeight * aspect;

    // Source rect from sprite sheet
    const sx = frameIdx * frameW;

    ctx.drawImage(
      img,
      sx, 0, frameW, frameH,
      -targetWidth / 2,
      -targetHeight + 15,
      targetWidth,
      targetHeight
    );
  } else {
    const frameIdx = Math.floor(frame * data.speed) % data.keys.length;
    const img = imageCache.get(data.keys[frameIdx]);

    if (!img) {
      ctx.fillStyle = '#c02020';
      ctx.fillRect(-15 * scale, -40 * scale, 30 * scale, 45 * scale);
      ctx.restore();
      return;
    }

    const aspect = img.width / img.height;
    const targetWidth = targetHeight * aspect;

    ctx.drawImage(
      img,
      -targetWidth / 2,
      -targetHeight + 15,
      targetWidth,
      targetHeight
    );
  }

  ctx.restore();
}

/**
 * Get the idle sprite image for menus (first frame of idle sheet)
 */
export function getIdleSpriteImage(): HTMLImageElement | null {
  return imageCache.get('idleSheet') || null;
}

/**
 * Draw idle sprite for menu use (single frame from sheet)
 */
export function drawIdleMenuSprite(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  width: number, height: number
) {
  const img = imageCache.get('idleSheet');
  if (!img) return;
  const frameW = img.width / 4;
  ctx.drawImage(img, 0, 0, frameW, img.height, x, y, width, height);
}

/**
 * Get sprite state from fighter properties
 */
export function getSpriteState(
  hitFlash: number, stun: number, isBlocking: boolean,
  handMode: string, isGrounded: boolean, vx: number,
  isFlying: boolean = false
): SpriteState {
  if (hitFlash > 0 && stun > 0) return 'hurt';
  if (isBlocking) return 'block';
  if (handMode === 'strike' || handMode === 'together' || handMode === 'slam') return 'attack';
  if (isFlying) return 'fly';
  if (!isGrounded) return 'jump';
  if (Math.abs(vx) > 1.5) return 'walk';
  return 'idle';
}
