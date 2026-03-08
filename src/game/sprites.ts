// Sprite loading and management for character sprites
import edowadoIdle from '../assets/edowado-idle.png';
import edowadoIdle2 from '../assets/edowado-idle2.png';
import edowadoWalk1 from '../assets/edowado-walk1.png';
import edowadoWalk2 from '../assets/edowado-walk2.png';
import edowadoAttack from '../assets/edowado-attack.png';
import edowadoJump from '../assets/edowado-jump.png';
import edowadoBlock from '../assets/edowado-block.png';
import edowadoHurt from '../assets/edowado-hurt.png';

export interface SpriteSet {
  idle: HTMLImageElement[];
  walk: HTMLImageElement[];
  attack: HTMLImageElement[];
  jump: HTMLImageElement[];
  block: HTMLImageElement[];
  hurt: HTMLImageElement[];
}

const imageCache = new Map<string, HTMLImageElement>();

function loadImg(src: string): HTMLImageElement {
  if (imageCache.has(src)) return imageCache.get(src)!;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  imageCache.set(src, img);
  return img;
}

let edowadoSprites: SpriteSet | null = null;

export function getEdowadoSprites(): SpriteSet {
  if (edowadoSprites) return edowadoSprites;
  edowadoSprites = {
    idle: [loadImg(edowadoIdle), loadImg(edowadoIdle2)],
    walk: [loadImg(edowadoWalk1), loadImg(edowadoWalk2)],
    attack: [loadImg(edowadoAttack)],
    jump: [loadImg(edowadoJump)],
    block: [loadImg(edowadoBlock)],
    hurt: [loadImg(edowadoHurt)],
  };
  return edowadoSprites;
}

// Preload all sprites immediately
getEdowadoSprites();

export function isSpriteReady(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
}

export type SpriteState = 'idle' | 'walk' | 'attack' | 'jump' | 'block' | 'hurt';
