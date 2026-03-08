// Image-based sprite system for Edowado
// Uses high-quality anime-style sprites generated from reference

import idleImg from '@/assets/edowado-idle.png';
import idle2Img from '@/assets/edowado-idle2.png';
import walk1Img from '@/assets/edowado-walk1.png';
import walk2Img from '@/assets/edowado-walk2.png';
import attackImg from '@/assets/edowado-attack.png';
import jumpImg from '@/assets/edowado-jump.png';
import blockImg from '@/assets/edowado-block.png';
import hurtImg from '@/assets/edowado-hurt.png';

export type SpriteState = 'idle' | 'walk' | 'attack' | 'jump' | 'block' | 'hurt';

// Preload all images
const imageCache: Map<string, HTMLImageElement> = new Map();
let imagesLoaded = false;

const SPRITE_SOURCES: Record<string, string> = {
  idle1: idleImg,
  idle2: idle2Img,
  walk1: walk1Img,
  walk2: walk2Img,
  attack: attackImg,
  jump: jumpImg,
  block: blockImg,
  hurt: hurtImg,
};

function loadImage(key: string, src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(key, img);
      resolve();
    };
    img.onerror = () => resolve(); // Don't block on error
    img.src = src;
  });
}

// Start loading immediately
const loadPromise = Promise.all(
  Object.entries(SPRITE_SOURCES).map(([key, src]) => loadImage(key, src))
).then(() => { imagesLoaded = true; });

export function preloadSprites(): Promise<void> {
  return loadPromise;
}

// Animation config: which images to cycle through and at what speed
const SPRITE_FRAMES: Record<SpriteState, { keys: string[]; speed: number }> = {
  idle:   { keys: ['idle1', 'idle2'], speed: 0.03 },
  walk:   { keys: ['walk1', 'walk2'], speed: 0.12 },
  attack: { keys: ['attack'],        speed: 0.2 },
  jump:   { keys: ['jump'],          speed: 0.1 },
  block:  { keys: ['block'],         speed: 0.08 },
  hurt:   { keys: ['hurt'],          speed: 0.15 },
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

  const { keys, speed } = data;
  const frameIdx = Math.floor(frame * speed) % keys.length;
  const img = imageCache.get(keys[frameIdx]);

  if (!img) {
    // Fallback: draw a simple colored rectangle while loading
    ctx.save();
    ctx.fillStyle = '#c02020';
    ctx.fillRect(x - 15 * scale, y - 40 * scale, 30 * scale, 45 * scale);
    ctx.restore();
    return;
  }

  // Target sprite height in game units
  const targetHeight = 85 * scale;
  const aspect = img.width / img.height;
  const targetWidth = targetHeight * aspect;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(x, y);
  ctx.scale(side, 1); // Flip horizontally based on facing direction

  // Draw centered at feet position
  ctx.drawImage(
    img,
    -targetWidth / 2,
    -targetHeight + 5,
    targetWidth,
    targetHeight
  );

  ctx.restore();
}

/**
 * Get sprite state from fighter properties
 */
export function getSpriteState(
  hitFlash: number, stun: number, isBlocking: boolean,
  handMode: string, isGrounded: boolean, vx: number
): SpriteState {
  if (hitFlash > 0 && stun > 0) return 'hurt';
  if (isBlocking) return 'block';
  if (handMode === 'strike' || handMode === 'together' || handMode === 'slam') return 'attack';
  if (!isGrounded) return 'jump';
  if (Math.abs(vx) > 1.5) return 'walk';
  return 'idle';
}
