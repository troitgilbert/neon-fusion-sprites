// Pixel art sprite drawing for Edowado
// Based on reference: spiky dark hair, red/dark vest, dark pants, fighting stance

export type SpriteState = 'idle' | 'walk' | 'attack' | 'jump' | 'block' | 'hurt';

// Color palette matching reference
const C = {
  // Outline
  O: '#1a1018',
  // Hair
  H: '#2a1a0a',
  Hh: '#1a0f05',
  Hs: '#4a3520', // hair spike highlight
  // Skin
  S: '#f0d0a0',
  Sd: '#d4af78',
  Sl: '#ffe8c8',
  // Shirt / vest (red)
  R: '#c02020',
  Rd: '#8b1515',
  Rl: '#e03030',
  // Undershirt (yellow/gold)
  Y: '#d4a020',
  Yd: '#a07818',
  // Pants (dark)
  P: '#1a1a30',
  Pd: '#0e0e1e',
  Pl: '#2a2a44',
  // Belt
  B: '#8B7355',
  Bd: '#6a5540',
  // Shoes
  K: '#2a1a10',
  Kl: '#3d2a18',
  // Eyes
  E: '#00ffff',
  El: '#80ffff',
  // Hands
  D: '#d4af37',
  Dd: '#b08c20',
  // White
  W: '#ffffff',
};

/**
 * Draw a filled pixel
 */
function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, s: number) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, s, s);
}

/**
 * Draw a sprite from a 2D color array
 */
function drawPixelGrid(
  ctx: CanvasRenderingContext2D,
  ox: number, oy: number,
  grid: (string | null)[][],
  s: number
) {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const c = grid[row][col];
      if (c) px(ctx, ox + col * s, oy + row * s, c, s);
    }
  }
}

// Helper: create grid from string art + palette
const _ = null;
function g(rows: string[], pal: Record<string, string | null>): (string | null)[][] {
  return rows.map(row =>
    row.split('').map(ch => pal[ch] ?? null)
  );
}

const P: Record<string, string | null> = {
  '.': _,
  'O': C.O,
  'H': C.H,
  'h': C.Hh,
  'i': C.Hs,
  'S': C.S,
  's': C.Sd,
  'l': C.Sl,
  'R': C.R,
  'r': C.Rd,
  'L': C.Rl,
  'Y': C.Y,
  'y': C.Yd,
  'P': C.P,
  'p': C.Pd,
  'q': C.Pl,
  'B': C.B,
  'b': C.Bd,
  'K': C.K,
  'k': C.Kl,
  'E': C.E,
  'e': C.El,
  'D': C.D,
  'd': C.Dd,
  'W': C.W,
};

// ====== IDLE FRAMES (4 frames for fluidity) ======
const IDLE_0 = g([
  '...OhHHiO...',
  '..OhHHHHiO..',
  '..OHHhHHHO..',
  '.OHHhHHHHO..',
  '.OSlSSSlSO..',
  '.OSESlSEsO..',
  '..OsSSSSO...',
  '..OSsllsO...',
  '...OYYYO....',
  '..ORYYRRO...',
  '..ORRRRRO...',
  '..OLRRRL O..',
  '...OBBBO....',
  '..OPPPPPO...',
  '..OqPPPqO...',
  '..OPPPPPO...',
  '...OPPO.....',
  '..OKO.OKO...',
  '..OOO.OOO...',
], P);

const IDLE_1 = g([
  '...OhHHiO...',
  '..OhHHHHiO..',
  '..OHHhHHHO..',
  '.OHHhHHHHO..',
  '.OSlSSSlSO..',
  '.OSESlSEsO..',
  '..OsSSSSO...',
  '..OSsllsO...',
  '...OYYYO....',
  '..ORYYRRO...',
  '..ORRRRRO...',
  '..OLRRRL O..',
  '...OBBBO....',
  '..OPPPPPO...',
  '..OqPPPqO...',
  '..OPPPPPO...',
  '...OPPO.....',
  '..OKO.OKO...',
  '..OOO.OOO...',
], P);

const IDLE_2 = g([
  '...OhHHiO...',
  '..OhHHHHiO..',
  '..OHHhHHHO..',
  '.OHHhHHHHO..',
  '.OSlSSSlSO..',
  '.OSESlSEsO..',
  '..OsSSSSO...',
  '..OSsllsO...',
  '...OYYYO....',
  '..ORYYRRO...',
  '..ORRRRRO...',
  '..OLRRRLO...',
  '...OBBBO....',
  '..OPPPPPO...',
  '..OqPPPqO...',
  '..OPPPPPO...',
  '...OPPO.....',
  '..OKO.OKO...',
  '..OOO.OOO...',
], P);

const IDLE_3 = g([
  '...OhHHiO...',
  '..OhHHHHiO..',
  '..OHHhHHHO..',
  '.OHHhHHHHO..',
  '.OSlSSSlSO..',
  '.OSESlSEsO..',
  '..OsSSSSO...',
  '..OSsllsO...',
  '...OYYYO....',
  '..ORYYRRO...',
  '..ORRRRRO...',
  '..OLRRRLO...',
  '...OBBBO....',
  '..OPPPPPO...',
  '..OqPPPqO...',
  '..OPPPPPO...',
  '...OPPO.....',
  '..OKO.OKO...',
  '..OOO.OOO...',
], P);

// ====== WALK FRAMES (4 frames) ======
const WALK_0 = g([
  '...OhHHiO...',
  '..OhHHHHiO..',
  '..OHHhHHHO..',
  '.OHHhHHHHO..',
  '.OSlSSSlSO..',
  '.OSESlSEsO..',
  '..OsSSSSO...',
  '..OSsllsO...',
  '...OYYYO....',
  '..ORYYRRO...',
  '..ORRRRRO...',
  '..OLRRRLO...',
  '...OBBBO....',
  '..OPPPPPO...',
  '.OqPP.PPqO..',
  '.OPP...PPO..',
  'OKO.....OKO.',
  'OOO.....OOO.',
], P);

const WALK_1 = g([
  '...OhHHiO...',
  '..OhHHHHiO..',
  '..OHHhHHHO..',
  '.OHHhHHHHO..',
  '.OSlSSSlSO..',
  '.OSESlSEsO..',
  '..OsSSSSO...',
  '..OSsllsO...',
  '...OYYYO....',
  '..ORYYRRO...',
  '..ORRRRRO...',
  '..OLRRRLO...',
  '...OBBBO....',
  '..OPPPPPO...',
  '..OqPPPqO...',
  '...OPPPO....',
  '...OKkKO....',
  '...OOOOO....',
], P);

const WALK_2 = g([
  '...OhHHiO...',
  '..OhHHHHiO..',
  '..OHHhHHHO..',
  '.OHHhHHHHO..',
  '.OSlSSSlSO..',
  '.OSESlSEsO..',
  '..OsSSSSO...',
  '..OSsllsO...',
  '...OYYYO....',
  '..ORYYRRO...',
  '..ORRRRRO...',
  '..OLRRRLO...',
  '...OBBBO....',
  '..OPPPPPO...',
  '..OPP.PPO...',
  '.OqP...PqO..',
  '.OKO...OKO..',
  '.OOO...OOO..',
], P);

const WALK_3 = g([
  '...OhHHiO...',
  '..OhHHHHiO..',
  '..OHHhHHHO..',
  '.OHHhHHHHO..',
  '.OSlSSSlSO..',
  '.OSESlSEsO..',
  '..OsSSSSO...',
  '..OSsllsO...',
  '...OYYYO....',
  '..ORYYRRO...',
  '..ORRRRRO...',
  '..OLRRRLO...',
  '...OBBBO....',
  '..OPPPPPO...',
  '..OqPPPqO...',
  '..OPPPPO....',
  '..OKOkKO....',
  '..OOO.OO....',
], P);

// ====== ATTACK FRAMES (3 frames) ======
const ATK_0 = g([
  '...OhHHiO...........',
  '..OhHHHHiO..........',
  '..OHHhHHHO..........',
  '.OHHhHHHHO..........',
  '.OSlSSSlSO..........',
  '.OSESlSEsO..........',
  '..OsSSSSO...........',
  '..OSsllsO...........',
  '...OYYYO............',
  '..ORYYRRO...........',
  '..ORRRRRO.ODDO......',
  '..OLRRRLOOODDDO.....',
  '...OBBBO..ODDO......',
  '..OPPPPPO...........',
  '..OqPPPqO...........',
  '..OPPPPPO...........',
  '...OPPO.............',
  '..OKO.OKO...........',
  '..OOO.OOO...........',
], P);

const ATK_1 = g([
  '...OhHHiO..............',
  '..OhHHHHiO.............',
  '..OHHhHHHO.............',
  '.OHHhHHHHO.............',
  '.OSlSSSlSO.............',
  '.OSESlSEsO.............',
  '..OsSSSSO..............',
  '..OSsllsO..............',
  '...OYYYO...............',
  '..ORYYRRO..............',
  '..ORRRRROOODDDDO.......',
  '..OLRRRLO..ODDDO.......',
  '...OBBBO...OODDO.......',
  '..OPPPPPO..............',
  '..OqPPPqO..............',
  '..OPPPPPO..............',
  '..OOPPO................',
  '.OKO.OKO...............',
  '.OOO.OOO...............',
], P);

const ATK_2 = g([
  '...OhHHiO.........',
  '..OhHHHHiO........',
  '..OHHhHHHO........',
  '.OHHhHHHHO........',
  '.OSlSSSlSO........',
  '.OSESlSEsO........',
  '..OsSSSSO.........',
  '..OSsllsO.........',
  '...OYYYO..........',
  '..ORYYRROOODDO....',
  '..ORRRRROODDDDO...',
  '..OLRRRLO.ODDO....',
  '...OBBBO..........',
  '..OPPPPPO.........',
  '..OqPPPqO.........',
  '..OPPPPPO.........',
  '...OPPO...........',
  '..OKO.OKO.........',
  '..OOO.OOO.........',
], P);

// ====== JUMP FRAMES (3 frames) ======
const JUMP_0 = g([
  '..OhHHiO....',
  '.OhHHHHiO...',
  '.OHHhHHHO...',
  'OHHhHHHHO...',
  'OSlSSSlSO...',
  'OSESlSEsO...',
  '.OsSSSSO....',
  '.OSsllsO....',
  '..OYYYO.....',
  'ODDYYRRODDO.',
  '.ORRRRRO....',
  '.OLRRRLO....',
  '..OBBBO.....',
  '.OPPPPPO....',
  '..OqPqO.....',
  '...OPO......',
  '..OKKO......',
  '..OOOO......',
], P);

const JUMP_1 = g([
  '.OhHHiO.....',
  'OhHHHHiO....',
  'OHHhHHHO....',
  'OHhHHHHO....',
  'OSlSSSlSO...',
  'OSESlSEsO...',
  '.OsSSSSO....',
  '.OSsllsO....',
  '..OYYYO.....',
  'ODDYYRRODDO.',
  '.ORRRRRO....',
  '.OLRRRLO....',
  '..OBBBO.....',
  '.OPPPPPO....',
  '..OPPO......',
  '..OKOKO.....',
  '..OOOOO.....',
], P);

// ====== BLOCK FRAMES (2 frames) ======
const BLOCK_0 = g([
  '...OhHHiO...',
  '..OhHHHHiO..',
  '..OHHhHHHO..',
  '.OHHhHHHHO..',
  '.OSlSSSlSO..',
  '.OSESlSEsO..',
  '..OsSSSSO...',
  'ODDSDDSDDO..',
  'ODDOYYYO....',
  '..ORYYRRO...',
  'ODDRRRRRO...',
  'ODDLRRRLO...',
  '...OBBBO....',
  '..OPPPPPO...',
  '..OqPPPqO...',
  '..OPPPPPO...',
  '...OPPO.....',
  '..OKO.OKO...',
  '..OOO.OOO...',
], P);

const BLOCK_1 = g([
  '...OhHHiO...',
  '..OhHHHHiO..',
  '..OHHhHHHO..',
  '.OHHhHHHHO..',
  '.OSlSSSlSO..',
  '.OSESlSEsO..',
  '..OsSSSSO...',
  'ODDSDDSDDO..',
  'ODDOYYYO....',
  '..ORYYRRO...',
  'ODDRRRRRO...',
  'ODDLRRRLO...',
  '...OBBBO....',
  '..OPPPPPO...',
  '..OqPPPqO...',
  '..OPPPPPO...',
  '...OPPO.....',
  '..OKO.OKO...',
  '..OOO.OOO...',
], P);

// ====== HURT FRAMES (3 frames) ======
const HURT_PAL: Record<string, string | null> = {
  ...P,
  'E': '#ff4444',
  'e': '#ff8888',
};

const HURT_0 = g([
  '.....OhHHiO.',
  '....OhHHHHiO',
  '....OHHhHHHO',
  '...OHHhHHHHO',
  '...OSlSSSlSO',
  '...OSESlSEsO',
  '....OsSSSSO.',
  '....OSsllsO.',
  '.....OYYYO..',
  '....ORYYRRO.',
  '....ORRRRRO.',
  '....OLRRRLO.',
  '.....OBBBO..',
  '....OPPPPPO.',
  '...OPP.PPO..',
  '..OqP...PqO.',
  '..OKO...OKO.',
  '..OOO...OOO.',
], HURT_PAL);

const HURT_1 = g([
  '......OhHHiO',
  '.....OhHHHiO',
  '.....OHHhHHO',
  '....OHHhHHHO',
  '....OSlSSlSO',
  '....OSESlEsO',
  '.....OsSSSOO',
  '.....OSsllsO',
  '......OYYYO.',
  '.....ORYYRRO',
  '.....ORRRRRO',
  '.....OLRRRLO',
  '......OBBBO.',
  '.....OPPPPPO',
  '....OPP.PPO.',
  '...OqP...PqO',
  '...OKO...OKO',
  '...OOO...OOO',
], HURT_PAL);

const HURT_2 = g([
  '.....OhHHiO.',
  '....OhHHHHiO',
  '....OHHhHHHO',
  '...OHHhHHHHO',
  '...OSlSSSlSO',
  '...OSESlSEsO',
  '....OsSSSSO.',
  '....OSsllsO.',
  '.....OYYYO..',
  '....ORYYRRO.',
  '....ORRRRRO.',
  '....OLRRRLO.',
  '.....OBBBO..',
  '....OPPPPPO.',
  '...OqPPPqO..',
  '....OPPPO...',
  '....OKkKO...',
  '....OOOOO...',
], HURT_PAL);

// ====== SPRITE SETS ======
const SPRITE_FRAMES: Record<SpriteState, { grids: (string | null)[][][]; speeds: number }> = {
  idle:   { grids: [IDLE_0, IDLE_1, IDLE_2, IDLE_3], speeds: 0.06 },
  walk:   { grids: [WALK_0, WALK_1, WALK_2, WALK_3], speeds: 0.18 },
  attack: { grids: [ATK_0, ATK_1, ATK_2],            speeds: 0.25 },
  jump:   { grids: [JUMP_0, JUMP_1],                  speeds: 0.1 },
  block:  { grids: [BLOCK_0, BLOCK_1],                speeds: 0.08 },
  hurt:   { grids: [HURT_0, HURT_1, HURT_2],          speeds: 0.15 },
};

/**
 * Draw Edowado pixel art sprite
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

  const { grids, speeds } = data;
  const frameIdx = Math.floor(frame * speeds) % grids.length;
  const grid = grids[frameIdx];

  const maxW = Math.max(...grid.map(r => r.length));
  const h = grid.length;
  const pxSize = 2.5 * scale;
  const totalW = maxW * pxSize;
  const totalH = h * pxSize;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  ctx.scale(side, 1);

  const ox = -totalW / 2;
  const oy = -totalH + 5 * pxSize;

  drawPixelGrid(ctx, ox, oy, grid, pxSize);
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
