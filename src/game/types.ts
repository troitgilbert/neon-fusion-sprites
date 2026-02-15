export type GameState = 'MENU' | 'VERSUS_TYPE' | 'SELECT' | 'SKIN_SELECT' | 'STAGE_SELECT' | 'FIGHT' | 'PAUSED' | 'ROUND_OVER' | 'SHOP' | 'CONFIG' | 'CREATOR';

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
