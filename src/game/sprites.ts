// Image-based sprite system for Edowado
// Uses high-quality anime-style sprites

import idleImg from '@/assets/edowado-idle.png';
import idle2Img from '@/assets/edowado-idle2.png';
import idle3Img from '@/assets/edowado-idle3.png';
import idle4Img from '@/assets/edowado-idle4.png';
import idle5Img from '@/assets/edowado-idle5.png';
import idle6Img from '@/assets/edowado-idle6.png';
import idle7Img from '@/assets/edowado-idle7.png';
import idle8Img from '@/assets/edowado-idle8.png';
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

const SPRITE_SOURCES: Record<string, string> = {
  idle1: idleImg,
  idle2: idle2Img,
  idle3: idle3Img,
  idle4: idle4Img,
  idle5: idle5Img,
  idle6: idle6Img,
  idle7: idle7Img,
  idle8: idle8Img,
  walk1: walk1Img,
  walk2: walk2Img,
  walk3: walk3Img,
  walk4: walk4Img,
  walk5: walk5Img,
  walk6: walk6Img,
  walk7: walk7Img,
  walk8: walk8Img,
  attack: attackImg,
  jump: jumpImg,
  fly: flyImg,
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
    img.onerror = () => resolve();
    img.src = src;
  });
}

const loadPromise = Promise.all(
  Object.entries(SPRITE_SOURCES).map(([key, src]) => loadImage(key, src))
).then(() => { imagesLoaded = true; });

export function preloadSprites(): Promise<void> {
  return loadPromise;
}

// Animation config
const SPRITE_FRAMES: Record<SpriteState, { keys: string[]; speed: number }> = {
  idle:   { keys: ['idle1', 'idle2', 'idle3', 'idle4', 'idle5', 'idle6', 'idle7', 'idle8'], speed: 0.08 },
  walk:   { keys: ['walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'walk6', 'walk7', 'walk8'], speed: 0.15 },
  attack: { keys: ['attack'],  speed: 0.2 },
  jump:   { keys: ['jump'],    speed: 0.1 },
  fly:    { keys: ['fly'],     speed: 0.08 },
  block:  { keys: ['block'],   speed: 0.08 },
  hurt:   { keys: ['hurt'],    speed: 0.15 },
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

  // For idle: smooth crossfade between frames for fluid hand movement
  if (state === 'idle' && keys.length === 2) {
    const img1 = imageCache.get(keys[0]);
    const img2 = imageCache.get(keys[1]);

    if (!img1 && !img2) {
      ctx.save();
      ctx.fillStyle = '#c02020';
      ctx.fillRect(x - 15 * scale, y - 40 * scale, 30 * scale, 45 * scale);
      ctx.restore();
      return;
    }

    // Use a sine wave for smooth 0→1→0 blend (period ~120 frames ≈ 2s at 60fps)
    const blend = (Math.sin(frame * 0.04) + 1) / 2; // 0..1 smoothly

    const refImg = img1 || img2!;
    const targetHeight = 85 * scale;
    const aspect = refImg.width / refImg.height;
    const targetWidth = targetHeight * aspect;

    const breathScale = 1 + Math.sin(frame * 0.06) * 0.012;
    const breathY = Math.sin(frame * 0.06) * 1.5;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(x, y);
    ctx.scale(side, 1);

    const dx = -targetWidth / 2;
    const dy = -targetHeight + 15 - breathY;
    const dw = targetWidth * breathScale;
    const dh = targetHeight * breathScale;

    // Draw frame 1 with (1 - blend) opacity
    if (img1) {
      ctx.globalAlpha = 1 - blend;
      ctx.drawImage(img1, dx, dy, dw, dh);
    }
    // Draw frame 2 with blend opacity
    if (img2) {
      ctx.globalAlpha = blend;
      ctx.drawImage(img2, dx, dy, dw, dh);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }

  const frameIdx = Math.floor(frame * speed) % keys.length;
  const img = imageCache.get(keys[frameIdx]);

  if (!img) {
    ctx.save();
    ctx.fillStyle = '#c02020';
    ctx.fillRect(x - 15 * scale, y - 40 * scale, 30 * scale, 45 * scale);
    ctx.restore();
    return;
  }

  const targetHeight = 85 * scale;
  const aspect = img.width / img.height;
  const targetWidth = targetHeight * aspect;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(x, y);
  ctx.scale(side, 1);

  ctx.drawImage(
    img,
    -targetWidth / 2,
    -targetHeight + 15,
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
