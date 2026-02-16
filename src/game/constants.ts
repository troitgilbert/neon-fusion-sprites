import { CharData, Controls, SkinCatalogItem } from './types';

export const CANVAS_W = 640;
export const CANVAS_H = 480;
export const GROUND_Y = 400;
export const FLOOR_Y = 425;
export const RENDER_SCALE = 2;

export const CHAR_DATA: CharData[] = [
  { name: 'EDOWADO', color: '#8B4513', eyes: '#00ffff', speed: 5, weight: 1 },
  { name: 'KAITO', color: '#ffffff', eyes: '#ffff00', speed: 8.5, weight: 0.9 }
];

export const CONTROLS: { p1: Controls; p2: Controls } = {
  p1: {
    up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD',
    hit: 'KeyF', spec: 'KeyG', super: 'KeyH', ultra: 'KeyE',
    block: 'KeyR', dodge: 'KeyT'
  },
  p2: {
    up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
    hit: 'BracketLeft', spec: 'BracketRight', super: 'Backslash', ultra: 'Enter',
    block: 'Quote', dodge: 'Semicolon'
  }
};

export const TRANSFORM_KEY = { p1: 'KeyY', p2: 'KeyP' };

export const SHOP_CATALOG: Record<string, SkinCatalogItem[]> = {
  'KAITO': [
    { id: 'demonioBlanco2', name: 'El asesino del ojo por ojo', cost: 150, cssClass: 'demonio' },
    { id: 'demonioBlanco', name: 'Demonio Blanco', cost: 100, cssClass: 'demonio' }
  ],
  'EDOWADO': []
};

export const MODE_INFO: Record<string, string> = {
  "HISTORIA": "Vive la trama principal del juego, enfrentando enemigos y jefes mientras descubres los secretos del mundo.",
  "ARCADE": "10 combates consecutivos con la estructura de torre. Enfrenta rivales, ejércitos, minijuegos y al temible Big Bang.",
  "AVENTURA": "Mundo abierto 2D con tres destinos: Galaxia, Infierno y Cielo. Explora, combate y derrota a los jefes.",
  "VERSUS": "Enfréntate a otro jugador o a la IA en combates directos.",
  "BATALLA LIBRE": "Elige personajes y reglas personalizadas para pelear sin restricciones.",
  "MISIONES": "Completa objetivos específicos con condiciones especiales y gana diamantes según la dificultad.",
  "EVENTOS": "Desafíos temporales con reglas únicas y recompensas especiales.",
  "SUPERVIVENCIA": "Resiste oleadas infinitas de enemigos hasta caer derrotado.",
  "BOSS RUSH": "Enfréntate únicamente a los jefes, uno tras otro, sin descanso.",
  "ENTRENAMIENTO": "Practica combos, movimientos y estrategias sin presión.",
  "JUEGOS MENTALES": "Pon a prueba tu ingenio con puzzles y desafíos de inteligencia.",
  "CITAS": "Interactúa con los personajes del juego en escenarios sociales.",
  "CREADOR DE PERSONAJES": "Diseña tu propio luchador personalizado con apariencia, habilidades y estilo únicos.",
  "CREACIÓN DE NIVELES": "Diseña tus propios escenarios y desafíos personalizados.",
  "MINIJUEGOS": "Juega a una variedad de minijuegos divertidos y desafiantes.",
  "TIENDA": "Compra personajes, skins y mejoras usando cristales.",
  "DOCUMENTOS": "Consulta información del mundo, historia y guías internas.",
  "LOGROS": "Revisa tus hazañas y desafíos completados durante el juego.",
  "CONFIGURACIÓN": "Ajusta controles, sonido, gráficos y opciones generales.",
  "SALIR": "Cierra el juego.",
  "PERSONALIZABLE": "Selecciona o crea un personaje completamente personalizado.",
  "MODOS DE JUEGO": "Accede a modos especiales con reglas y desafíos únicos.",
  "EXTRAS": "Contenido adicional, documentos y logros del juego.",
  "???": "",
  "SELECCIÓN DE JEFES": "Elige un jefe y enfréntalo en combate directo.",
};

export const MISSION_DIFFICULTIES = [
  { id: 'universal', label: 'UNIVERSAL', color: '#00ffff', reward: 5 },
  { id: 'multiversal', label: 'MULTIVERSAL', color: '#00ff66', reward: 10 },
  { id: 'hyperversal', label: 'HYPERVERSAL', color: '#ffff00', reward: 20 },
  { id: 'ultraversal', label: 'ULTRAVERSAL', color: '#ff8c00', reward: 40 },
  { id: 'omniversal', label: 'OMNIVERSAL', color: '#ff0000', reward: 80 },
  { id: 'mas_alla', label: 'MÁS ALLÁ DEL OMNIVERSO', color: '#ff00ff', reward: 100 },
];

export const INTELLIGENCE_GRADES = [
  { id: 'estupido', label: 'ESTÚPIDO', reward: 1, winChance: 0.5, color: '#888' },
  { id: 'normal', label: 'NORMAL', reward: 4, winChance: 0.4, color: '#aaa' },
  { id: 'inteligente', label: 'INTELIGENTE', reward: 10, winChance: 0.33, color: '#00ff66' },
  { id: 'prodigio', label: 'PRODIGIO', reward: 20, winChance: 0.25, color: '#00ffff' },
  { id: 'genio', label: 'GENIO', reward: 30, winChance: 0.2, color: '#ffff00' },
  { id: 'super_genio', label: 'SUPER GENIO', reward: 50, winChance: 0.1, color: '#ff8c00' },
  { id: 'casi_omnisciente', label: 'CASI OMNISCIENTE', reward: 100, winChance: 0.01, color: '#ff0000' },
  { id: 'omnisciente', label: 'OMNISCIENTE', reward: 200, winChance: 0.0001, color: '#ff00ff' },
];

export const CHAR_INTELLIGENCE: Record<string, string> = {
  'EDOWADO': 'prodigio',
  'KAITO': 'genio',
};
