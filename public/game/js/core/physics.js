// === CONSTANTS & PHYSICS ===
export const CANVAS_W = 640;
export const CANVAS_H = 480;
export const GROUND_Y = 400;
export const FLOOR_Y = 425;
export const RENDER_SCALE = 2;

export const CHAR_DATA = [
  { name: 'EDOWADO', color: '#8B4513', eyes: '#00ffff', speed: 5, weight: 1 },
  { name: 'KAITO', color: '#ffffff', eyes: '#ffff00', speed: 8.5, weight: 0.9 }
];

export const CONTROLS = {
  p1: {
    up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD',
    hit: 'KeyF', spec: 'KeyG', super: 'KeyH', ultra: 'KeyE',
    block: 'KeyR', dodge: 'KeyT', emote: 'KeyU'
  },
  p2: {
    up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
    hit: 'BracketLeft', spec: 'BracketRight', super: 'Backslash', ultra: 'Enter',
    block: 'Quote', dodge: 'Semicolon', emote: 'KeyL'
  }
};

export const DIFFICULTIES = [
  { id: 'facil', label: 'FÁCIL', color: '#00ff66', hpMult: 0.5, dmgMult: 0.5, playerHp: -1, description: 'Enemigos débiles y lentos' },
  { id: 'normal', label: 'NORMAL', color: '#00ffff', hpMult: 1, dmgMult: 1, playerHp: -1, description: 'Experiencia equilibrada' },
  { id: 'dificil', label: 'DIFÍCIL', color: '#ffff00', hpMult: 1.5, dmgMult: 1.5, playerHp: -1, description: 'Enemigos más resistentes y agresivos' },
  { id: 'muy_dificil', label: 'MUY DIFÍCIL', color: '#ff8c00', hpMult: 2, dmgMult: 2, playerHp: -1, description: 'Combates brutales sin piedad' },
  { id: 'concepto', label: 'CONCEPTO', color: '#ff0000', hpMult: 3, dmgMult: 3, playerHp: -1, description: 'Solo los mejores sobreviven' },
  { id: 'debes_morir', label: 'TU DEBES MORIR', color: '#aa0000', hpMult: 2, dmgMult: 999, playerHp: 1, description: 'Un solo golpe te mata. Sobrevive.' },
  { id: '1hit', label: '1 HIT', color: '#ffffff', hpMult: 1, dmgMult: 999, playerHp: 1, description: 'Un golpe mata a cualquiera. Tú o ellos.' },
];

export const MODE_INFO = {
  "HISTORIA": "Vive la trama principal del juego.",
  "ARCADE": "10 combates consecutivos con la estructura de torre.",
  "AVENTURA": "Mundo abierto 2D con tres destinos.",
  "VERSUS": "Enfréntate a otro jugador o a la IA.",
  "BATALLA LIBRE": "Elige personajes y reglas personalizadas.",
  "SUPERVIVENCIA": "Resiste oleadas infinitas de enemigos.",
  "ENTRENAMIENTO": "Practica combos y movimientos sin presión.",
  "TIENDA": "Compra personajes, skins y mejoras.",
  "CONFIGURACIÓN": "Ajusta controles, sonido y opciones.",
  "SALIR": "Cierra el juego.",
};
