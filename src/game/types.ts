export type GameState = 'MENU' | 'VERSUS_TYPE' | 'SELECT' | 'SKIN_SELECT' | 'STAGE_SELECT' | 'FIGHT' | 'PAUSED' | 'ROUND_OVER' | 'SHOP' | 'CONFIG' | 'CREATOR' | 'ACHIEVEMENTS' | 'STORY_SELECT' | 'ARCADE_TOWER' | 'ADVENTURE_SELECT' | 'ADVENTURE_CHAR_SELECT' | 'MISSIONS' | 'EVENTS' | 'BOSS_RUSH' | 'BOSS_SELECT' | 'MIND_GAMES' | 'DATING' | 'DOCUMENTS' | 'MINIGAMES' | 'DIFFICULTY_SELECT' | 'ADVENTURE_PLAY' | 'ONLINE';

export type Difficulty = 'facil' | 'normal' | 'dificil' | 'muy_dificil' | 'concepto' | 'debes_morir' | '1hit';

export interface CustomCharData {
  name: string;
  hairColor: string;
  skinColor: string;
  clothesColor: string;
  pantsColor: string;
  handsColor: string;
  shoesColor: string;
  eyesColor: string;
  speed: 'lento' | 'normal' | 'rapido' | 'velocista';
  size: 'pequeño' | 'normal' | 'grande';
  effectColor: string;
  specialAbility: string;
  superAbility: string;
  ultraAbility: string;
}

export type GameMode = '' | 'arcade' | 'survival' | 'versus' | 'vs_cpu' | 'training' | 'story' | 'adventure' | 'boss_rush' | 'boss_select' | 'missions' | 'events' | 'mystery';

export interface Controls {
  up: string; down: string; left: string; right: string;
  hit: string; spec: string; super: string; ultra: string;
  block: string; dodge: string;
}

export interface CharData {
  name: string; color: string; eyes: string; speed: number; weight: number;
}

export interface SkinCatalogItem {
  id: string; name: string; cost: number; cssClass: string;
}

export interface StarData {
  x: number; y: number; s: number; blink: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  difficulty: 'normal' | 'dificil' | 'muy_dificil' | 'bastante_dificil';
  reward: number;
  condition: (stats: GameStats) => boolean;
}

export interface GameStats {
  totalFights: number;
  totalWins: number;
  totalKOs: number;
  comboMax: number;
  totalDamage: number;
  customCharsCreated: number;
  roundsSurvived: number;
  perfectWins: number;
  totalBlocks: number;
  totalSpecials: number;
  totalSupers: number;
  totalUltras: number;
  totalTransforms: number;
}

export interface ArcadeStage {
  type: 'fight' | 'army' | 'minigame' | '2v2' | '3vGiant' | 'miniboss' | 'boss';
  label: string;
  description: string;
}

export interface DifficultyInfo {
  id: Difficulty;
  label: string;
  color: string;
  hpMult: number;
  dmgMult: number;
  playerHp: number; // -1 = normal
  description: string;
}

export const DIFFICULTIES: DifficultyInfo[] = [
  { id: 'facil', label: 'FÁCIL', color: '#00ff66', hpMult: 0.5, dmgMult: 0.5, playerHp: -1, description: 'Enemigos débiles y lentos' },
  { id: 'normal', label: 'NORMAL', color: '#00ffff', hpMult: 1, dmgMult: 1, playerHp: -1, description: 'Experiencia equilibrada' },
  { id: 'dificil', label: 'DIFÍCIL', color: '#ffff00', hpMult: 1.5, dmgMult: 1.5, playerHp: -1, description: 'Enemigos más resistentes y agresivos' },
  { id: 'muy_dificil', label: 'MUY DIFÍCIL', color: '#ff8c00', hpMult: 2, dmgMult: 2, playerHp: -1, description: 'Combates brutales sin piedad' },
  { id: 'concepto', label: 'CONCEPTO', color: '#ff0000', hpMult: 3, dmgMult: 3, playerHp: -1, description: 'Solo los mejores sobreviven' },
  { id: 'debes_morir', label: 'TU DEBES MORIR', color: '#aa0000', hpMult: 2, dmgMult: 999, playerHp: 1, description: 'Un solo golpe te mata. Sobrevive.' },
  { id: '1hit', label: '1 HIT', color: '#ffffff', hpMult: 1, dmgMult: 999, playerHp: 1, description: 'Un golpe mata a cualquiera. Tú o ellos.' },
];
