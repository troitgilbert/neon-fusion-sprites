// Pixel art sprite drawing for Edowado
// Draws directly on canvas - no image loading needed

export type SpriteState = 'idle' | 'walk' | 'attack' | 'jump' | 'block' | 'hurt';

const P = 2; // pixel size for the pixel art

// Color palette
const SKIN = '#f5deb3';
const SKIN_DARK = '#d4b896';
const HAIR = '#5a3a1a';
const HAIR_DARK = '#3d2710';
const SHIRT = '#b00000';
const SHIRT_DARK = '#800000';
const PANTS = '#1a1a2e';
const PANTS_DARK = '#0d0d17';
const EYE = '#00ffff';
const EYE_GLOW = '#80ffff';
const SHOE = '#3a2a1a';
const HAND = '#d4af37';
const OUTLINE = '#222222';
const BELT = '#8B7355';

/**
 * Draw a single pixel-art pixel
 */
function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number = P) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
}

/**
 * Draw a row of pixels from a color map
 * Each character maps to a color (. = transparent)
 */
function drawRow(ctx: CanvasRenderingContext2D, ox: number, y: number, row: string, palette: Record<string, string>, size: number = P) {
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch !== '.' && palette[ch]) {
      ctx.fillStyle = palette[ch];
      ctx.fillRect(ox + i * size, y, size, size);
    }
  }
}

const PAL: Record<string, string> = {
  'O': OUTLINE,
  'S': SKIN,
  's': SKIN_DARK,
  'H': HAIR,
  'h': HAIR_DARK,
  'R': SHIRT,
  'r': SHIRT_DARK,
  'P': PANTS,
  'p': PANTS_DARK,
  'E': EYE,
  'G': EYE_GLOW,
  'B': BELT,
  'K': SHOE,
  'D': HAND,
  'd': '#b8962e',
};

// Sprite definitions as pixel rows (each char = 1 pixel)
// ~16x20 pixel sprites

const IDLE_1 = [
  '....OOOOO....',
  '...OHHHHHO...',
  '..OHHHHHHO...',
  '..OHSSSSHHO..',
  '..OSSEESSO..',
  '..OSSSSSSO..',
  '..OOSSSOO...',
  '...ORRRO....',
  '..ORRRRRO...',
  '..ORRRRRO...',
  '...OBBBO....',
  '..OPPPPPO...',
  '..OPPPPO....',
  '...OPPO.....',
  '..ODDODDO...',
  '..OO..OO....',
  '..OK..KO....',
  '..OO..OO....',
];

const IDLE_2 = [
  '....OOOOO....',
  '...OHHHHHO...',
  '..OHHHHHHO...',
  '..OHSSSSHHO..',
  '..OSSEESSO..',
  '..OSSSSSSO..',
  '..OOSSSOO...',
  '...ORRRO....',
  '..ORRRRRO...',
  '..ORRRRRO...',
  '...OBBBO....',
  '..OPPPPPO...',
  '..OPPPPO....',
  '...OPPO.....',
  '.ODDOODDO...',
  '..OO..OO....',
  '..OK..KO....',
  '..OO..OO....',
];

const WALK_1 = [
  '....OOOOO....',
  '...OHHHHHO...',
  '..OHHHHHHO...',
  '..OHSSSSHHO..',
  '..OSSEESSO..',
  '..OSSSSSSO..',
  '..OOSSSOO...',
  '...ORRRO....',
  '..ORRRRRO...',
  '..ORRRRRO...',
  '...OBBBO....',
  '..OPPPPPO...',
  '..OPPPPO....',
  '...OPPO.....',
  '..ODD.ODDO..',
  '..OO...OO...',
  '.OK.....KO..',
  '.OO.....OO..',
];

const WALK_2 = [
  '....OOOOO....',
  '...OHHHHHO...',
  '..OHHHHHHO...',
  '..OHSSSSHHO..',
  '..OSSEESSO..',
  '..OSSSSSSO..',
  '..OOSSSOO...',
  '...ORRRO....',
  '..ORRRRRO...',
  '..ORRRRRO...',
  '...OBBBO....',
  '..OPPPPPO...',
  '..OPPPPO....',
  '...OPPO.....',
  '..ODDODDO...',
  '...OO.OO....',
  '...KOKO.....',
  '...OOOO.....',
];

const ATTACK = [
  '....OOOOO....',
  '...OHHHHHO...',
  '..OHHHHHHO...',
  '..OHSSSSHHO..',
  '..OSSEESSO..',
  '..OSSSSSSO..',
  '..OOSSSOO...',
  '...ORRRO.ODD.',
  '..ORRRRRODDO.',
  '..ORRRRRO....',
  '...OBBBO....',
  '..OPPPPPO...',
  '..OPPPPO....',
  '...OPPO.....',
  '..ODDODDO...',
  '..OO..OO....',
  '..OK..KO....',
  '..OO..OO....',
];

const JUMP = [
  '....OOOOO....',
  '...OHHHHHO...',
  '..OHHHHHHO...',
  '..OHSSSSHHO..',
  '..OSSEESSO..',
  '..OSSSSSSO..',
  '..OOSSSOO...',
  '.ODD.RRRODDO.',
  '..ORRRRRO....',
  '..ORRRRRO....',
  '...OBBBO....',
  '..OPPPPPO...',
  '...OPPPO....',
  '....OPO.....',
  '...OKKO.....',
  '...OOOO.....',
];

const BLOCK = [
  '....OOOOO....',
  '...OHHHHHO...',
  '..OHHHHHHO...',
  '..OHSSSSHHO..',
  '..OSSEESSO..',
  '..OSSSSSSO..',
  '..OOSSSOO...',
  '..ODDRRRODDO.',
  '..ODDRRRODDO.',
  '..ORRRRRO....',
  '...OBBBO....',
  '..OPPPPPO...',
  '..OPPPPO....',
  '...OPPO.....',
  '..ODDODDO...',
  '..OO..OO....',
  '..OK..KO....',
  '..OO..OO....',
];

const HURT = [
  '......OOOOO..',
  '.....OHHHHHO.',
  '....OHHHHHHO.',
  '....OHSSSSHhO',
  '....OSSxESSO.',
  '....OSSSSSSO.',
  '....OOSSSOO..',
  '.....ORRRO...',
  '....ORRRRRO..',
  '....ORRRRRO..',
  '.....OBBBO...',
  '....OPPPPPO..',
  '....OPPPPO...',
  '.....OPPO....',
  '....ODD.ODDO.',
  '....OO...OO..',
  '....OK...KO..',
  '....OO...OO..',
];

const HURT_PAL: Record<string, string> = {
  ...PAL,
  'x': '#ff4444', // hurt eye flash
};

const SPRITES: Record<SpriteState, { frames: string[][]; palette: Record<string, string> }> = {
  idle: { frames: [IDLE_1, IDLE_2], palette: PAL },
  walk: { frames: [WALK_1, WALK_2], palette: PAL },
  attack: { frames: [ATTACK], palette: PAL },
  jump: { frames: [JUMP], palette: PAL },
  block: { frames: [BLOCK], palette: PAL },
  hurt: { frames: [HURT], palette: HURT_PAL },
};

/**
 * Draw Edowado as pixel art on the canvas.
 * @param ctx Canvas context
 * @param x Center X position
 * @param y Center Y position (feet)
 * @param state Current animation state
 * @param frame Animation frame counter
 * @param side -1 for facing left, 1 for facing right
 * @param scale Drawing scale multiplier
 */
export function drawEdowadoSprite(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  state: SpriteState,
  frame: number,
  side: number,
  scale: number = 1,
) {
  const spriteData = SPRITES[state];
  if (!spriteData) return;

  const { frames, palette } = spriteData;
  const frameIdx = Math.floor(frame * 0.12) % frames.length;
  const rows = frames[frameIdx];

  // Calculate sprite dimensions
  const maxW = Math.max(...rows.map(r => r.length));
  const h = rows.length;
  const pxSize = P * scale;
  const totalW = maxW * pxSize;
  const totalH = h * pxSize;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  
  // Position: x,y is center-bottom
  ctx.translate(x, y);
  ctx.scale(side, 1); // flip for facing direction
  
  const ox = -totalW / 2;
  const oy = -totalH + 4 * pxSize; // offset so feet are near y

  for (let row = 0; row < rows.length; row++) {
    drawRow(ctx, ox, oy + row * pxSize, rows[row], palette, pxSize);
  }

  ctx.restore();
}

/**
 * Get the sprite state from fighter properties
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
