export type GameState = 'MENU' | 'VERSUS_TYPE' | 'SELECT' | 'SKIN_SELECT' | 'STAGE_SELECT' | 'FIGHT' | 'PAUSED' | 'ROUND_OVER' | 'SHOP' | 'CONFIG' | 'CREATOR' | 'ACHIEVEMENTS' | 'STORY_SELECT' | 'ARCADE_TOWER' | 'ADVENTURE_SELECT' | 'ADVENTURE_CHAR_SELECT' | 'MISSIONS' | 'EVENTS' | 'BOSS_RUSH' | 'BOSS_SELECT' | 'MIND_GAMES' | 'DATING' | 'DOCUMENTS' | 'MINIGAMES' | 'DIFFICULTY_SELECT' | 'ADVENTURE_PLAY' | 'ONLINE' | 'DEV_CREATOR' | 'DEV_STAGE_CREATOR';

// === DEV CHARACTER CREATOR TYPES ===
export interface DevAttackConfig {
  forwardHit: string;
  upHit: string;
  downHit: string;
  airDownHit: string;
  airForwardHit: string;
  forwardSpecial: string;
  downSpecial: string;
  upSpecial: string;
  airDownSpecial: string;
  airForwardSpecial: string;
  basicSpecial: string;
  downSuper: string;
  upSuper: string;
  forwardSuper: string;
  airDownSuper: string;
  airForwardSuper: string;
  basicSuper: string;
  ultra: string;
}

export interface DevSkinData {
  id: string;
  name: string;
  hairColor: string;
  skinColor: string;
  clothesColor: string;
  pantsColor: string;
  handsColor: string;
  eyesColor: string;
  effectColor: string;
}

export interface DevCharData {
  name: string;
  hairColor: string;
  skinColor: string;
  clothesColor: string;
  pantsColor: string;
  handsColor: string;
  eyesColor: string;
  speed: 'lento' | 'normal' | 'rapido' | 'velocista';
  size: 'pequeño' | 'normal' | 'grande';
  effectColor: string;
  attacks: DevAttackConfig;
  skins: DevSkinData[];
}

export interface DevStageData {
  id: string;
  name: string;
  bgColor1: string;
  bgColor2: string;
  groundColor: string;
  ambientColor: string;
  lightColor: string;
  lightIntensity: number;
  shadowColor: string;
  shadowIntensity: number;
  particleColor: string;
  particleCount: number;
  fogColor: string;
  fogIntensity: number;
}

// Attack option definitions for the dev creator
export const DEV_ATTACK_OPTIONS = {
  forwardHit: [
    { id: 'hook_forward', name: 'GANCHO', desc: 'Puños dorados alternantes con knockback creciente', source: 'Edowado' },
    { id: 'embestida', name: 'EMBESTIDA', desc: 'Embestida rápida hacia adelante', source: 'Kaito' },
    { id: 'rush_combo', name: 'RÁFAGA', desc: 'Combinación rápida de golpes hacia adelante', source: 'Original' },
    { id: 'palm_strike', name: 'PALMAZO', desc: 'Golpe de palma con empuje masivo', source: 'Original' },
  ],
  upHit: [
    { id: 'uppercut', name: 'UPPERCUT', desc: 'Puño ascendente dorado, lanza al enemigo', source: 'Edowado' },
    { id: 'destello_ascendente', name: 'DESTELLO ASCENDENTE', desc: 'Golpe ascendente con luz blanca', source: 'Kaito' },
    { id: 'rising_kick', name: 'PATADA LUNAR', desc: 'Patada ascendente con arco lunar', source: 'Original' },
    { id: 'sky_punch', name: 'PUÑO CELESTE', desc: 'Puño que sube al cielo con energía', source: 'Original' },
  ],
  downHit: [
    { id: 'hook_down', name: 'DAÑO VITAL', desc: 'Paraliza al enemigo 1 segundo, cuesta energía', source: 'Edowado' },
    { id: 'punto_vital', name: 'PUNTO VITAL', desc: 'Golpe paralizante con efecto púrpura', source: 'Kaito' },
    { id: 'sweep', name: 'BARRIDA', desc: 'Barrida baja que derriba', source: 'Original' },
    { id: 'ground_pound', name: 'IMPACTO BAJO', desc: 'Golpe al suelo con onda', source: 'Original' },
  ],
  airDownHit: [
    { id: 'temblor', name: 'TEMBLOR', desc: 'Caída al suelo con onda expansiva azul', source: 'Edowado' },
    { id: 'patada_meteoro', name: 'PATADA METEORO', desc: 'Patada descendente rápida', source: 'Kaito' },
    { id: 'dive_bomb', name: 'BOMBA PICADA', desc: 'Descenso explosivo con impacto', source: 'Original' },
    { id: 'stomp', name: 'PISOTÓN', desc: 'Pisotón pesado con temblor', source: 'Original' },
  ],
  airForwardHit: [
    { id: 'air_hook_down', name: 'GANCHO AÉREO', desc: 'Puño descendente con estela azul', source: 'Edowado' },
    { id: 'caida_mortal', name: 'CAÍDA MORTAL', desc: 'Golpe aéreo mortal hacia abajo', source: 'Kaito' },
    { id: 'flying_kick', name: 'PATADA VOLADORA', desc: 'Patada horizontal en el aire', source: 'Original' },
    { id: 'air_dash', name: 'EMBESTIDA AÉREA', desc: 'Dash rápido en el aire', source: 'Original' },
  ],
  forwardSpecial: [
    { id: 'crystal_invocation', name: 'INVOCACIÓN CRISTAL', desc: 'Marcador ! que avanza y libera cristal', source: 'Edowado' },
    { id: 'estela_asesina', name: 'ESTELA ASESINA', desc: 'Dash veloz con estela cortante', source: 'Asesino' },
    { id: 'wave_shot', name: 'ONDA CORTANTE', desc: 'Proyectil de onda horizontal', source: 'Original' },
    { id: 'charge_rush', name: 'CARGA ESPECIAL', desc: 'Carga hacia adelante con energía', source: 'Original' },
  ],
  downSpecial: [
    { id: 'crystal_bounce_shot', name: 'REBOTE CRISTAL', desc: 'Cristal diagonal que rebota', source: 'Edowado' },
    { id: 'intangibilidad', name: 'INTANGIBILIDAD', desc: 'Te vuelves intangible temporalmente', source: 'Demonio Blanco' },
    { id: 'mine_drop', name: 'MINA', desc: 'Deja una mina en el suelo', source: 'Original' },
    { id: 'counter', name: 'CONTRAATAQUE', desc: 'Pose defensiva que contraataca', source: 'Original' },
  ],
  upSpecial: [
    { id: 'crystal_curve_shot', name: 'CRISTAL CURVA', desc: 'Cristal con arco gravitacional', source: 'Edowado' },
    { id: 'estela_dorada', name: 'ESTELA DORADA', desc: 'Dash dorado con rastro', source: 'Kaito' },
    { id: 'rising_beam', name: 'RAYO ASCENDENTE', desc: 'Rayo de energía hacia arriba', source: 'Original' },
    { id: 'tornado', name: 'TORNADO', desc: 'Giro de energía ascendente', source: 'Original' },
  ],
  airDownSpecial: [
    { id: 'crystal_descend', name: 'DESCENSO CRISTÁLICO', desc: '2 cristales diagonales hacia abajo', source: 'Edowado' },
    { id: 'rain_shot', name: 'LLUVIA DE ENERGÍA', desc: 'Múltiples proyectiles descendentes', source: 'Original' },
    { id: 'gravity_drop', name: 'CAÍDA GRAVITACIONAL', desc: 'Descenso con campo gravitacional', source: 'Original' },
    { id: 'spike_ball', name: 'ESFERA DESCENDENTE', desc: 'Esfera de energía que baja', source: 'Original' },
  ],
  airForwardSpecial: [
    { id: 'crystal_impact', name: 'IMPACTO CRISTÁLICO', desc: 'Slam + pilar cristalino al caer', source: 'Edowado' },
    { id: 'air_rush', name: 'RUSH AÉREO', desc: 'Dash horizontal en el aire con energía', source: 'Original' },
    { id: 'energy_lance', name: 'LANZA DE ENERGÍA', desc: 'Proyectil largo horizontal aéreo', source: 'Original' },
    { id: 'comet', name: 'COMETA', desc: 'Descenso diagonal con estela', source: 'Original' },
  ],
  basicSpecial: [
    { id: 'cristal', name: 'CRISTAL', desc: 'Hexágono cristalino que avanza', source: 'Edowado' },
    { id: 'estela_dorada_basic', name: 'ESTELA DORADA', desc: 'Dash dorado con daño', source: 'Kaito' },
    { id: 'energy_ball', name: 'ESFERA DE ENERGÍA', desc: 'Esfera de energía básica', source: 'Original' },
    { id: 'shockwave_basic', name: 'ONDA DE CHOQUE', desc: 'Onda expansiva circular', source: 'Original' },
  ],
  downSuper: [
    { id: 'super_impulso', name: 'IMPULSO', desc: 'Golpe al suelo que lanza enemigos', source: 'Edowado' },
    { id: 'teletransporte_oscuro', name: 'TELETRANSPORTE OSCURO', desc: 'Teleport oscuro al enemigo', source: 'Demonio Blanco' },
    { id: 'pillar_eruption', name: 'ERUPCIÓN', desc: 'Pilares de energía del suelo', source: 'Original' },
    { id: 'super_slam', name: 'SÚPER IMPACTO', desc: 'Golpe masivo al suelo', source: 'Original' },
  ],
  upSuper: [
    { id: 'super_cohete', name: 'COHETE', desc: 'Puñetazo ascendente con fuego', source: 'Edowado' },
    { id: 'rising_dragon', name: 'DRAGÓN ASCENDENTE', desc: 'Ascenso con aura de dragón', source: 'Original' },
    { id: 'sky_beam', name: 'RAYO CELESTIAL', desc: 'Rayo vertical devastador', source: 'Original' },
    { id: 'meteor_rise', name: 'METEORO INVERSO', desc: 'Ascenso explosivo como meteoro', source: 'Original' },
  ],
  forwardSuper: [
    { id: 'super_atraccion', name: 'ATRACCIÓN', desc: 'Aura azul que atrae al enemigo', source: 'Edowado' },
    { id: 'teletransporte_rojo', name: 'TELETRANSPORTE ROJO', desc: 'Teleport rojo ofensivo', source: 'Asesino' },
    { id: 'mega_rush', name: 'MEGA RUSH', desc: 'Rush masivo hacia adelante', source: 'Original' },
    { id: 'beam_cannon', name: 'CAÑÓN DE ENERGÍA', desc: 'Rayo horizontal devastador', source: 'Original' },
  ],
  airDownSuper: [
    { id: 'super_presion', name: 'PRESIÓN', desc: 'Puño rojo gigante hacia abajo', source: 'Edowado' },
    { id: 'meteor_strike', name: 'GOLPE METEORO', desc: 'Descenso explosivo con aura', source: 'Original' },
    { id: 'gravity_crush', name: 'APLASTE GRAVITACIONAL', desc: 'Campo gravitacional aplastante', source: 'Original' },
    { id: 'diving_fist', name: 'PUÑO DESCENDENTE', desc: 'Puño gigante desde arriba', source: 'Original' },
  ],
  airForwardSuper: [
    { id: 'super_agarre', name: 'AGARRE', desc: 'Rebota por paredes hasta agarrar', source: 'Edowado' },
    { id: 'homing_rush', name: 'RUSH PERSECUTOR', desc: 'Persigue al enemigo en el aire', source: 'Original' },
    { id: 'barrage', name: 'BARRERA', desc: 'Múltiples golpes en el aire', source: 'Original' },
    { id: 'suplex_air', name: 'SUPLEX AÉREO', desc: 'Agarra y estrella al suelo', source: 'Original' },
  ],
  basicSuper: [
    { id: 'impacto_rojo', name: 'IMPACTO ROJO', desc: 'Explosión roja de alto daño', source: 'Edowado' },
    { id: 'esfera_rebotante', name: 'ESFERA REBOTANTE', desc: 'Esfera que rebota por el escenario', source: 'Kaito' },
    { id: 'mega_blast', name: 'MEGA EXPLOSIÓN', desc: 'Gran explosión de energía', source: 'Original' },
    { id: 'chain_lightning', name: 'RELÁMPAGO ENCADENADO', desc: 'Rayo que salta entre posiciones', source: 'Original' },
  ],
  ultra: [
    { id: 'persecucion_blanca', name: 'PERSECUCIÓN BLANCA', desc: 'Proyectil persecutor imparable', source: 'Edowado' },
    { id: 'detencion_temporal', name: 'DETENCIÓN TEMPORAL', desc: 'Detiene el tiempo 4 segundos', source: 'Kaito' },
    { id: 'eclipse_negro', name: 'ECLIPSE NEGRO', desc: 'Oscuridad total + daño masivo', source: 'Demonio Blanco' },
    { id: 'juicio_final', name: 'JUICIO FINAL', desc: 'Cadena de explosiones devastadoras', source: 'Asesino' },
  ],
};

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
  block: string; dodge: string; emote: string;
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
