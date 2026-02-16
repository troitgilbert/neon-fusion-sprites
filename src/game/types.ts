export type GameState = 'MENU' | 'VERSUS_TYPE' | 'SELECT' | 'SKIN_SELECT' | 'STAGE_SELECT' | 'FIGHT' | 'PAUSED' | 'ROUND_OVER' | 'SHOP' | 'CONFIG' | 'CREATOR' | 'ACHIEVEMENTS';

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

export type GameMode = '' | 'arcade' | 'survival' | 'versus' | 'vs_cpu' | 'training';

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
  reward: number; // crystals
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
