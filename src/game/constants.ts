import { CharData, Controls, SkinCatalogItem } from './types';

export const CANVAS_W = 640;
export const CANVAS_H = 480;
export const GROUND_Y = 400;
export const FLOOR_Y = 425;

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
  "ARCADE": "Combates consecutivos contra distintos rivales hasta llegar al jefe final.",
  "AVENTURA": "Explora escenarios especiales con retos únicos y progresión libre.",
  "VERSUS": "Enfréntate a otro jugador o a la IA en combates directos.",
  "BATALLA LIBRE": "Elige personajes y reglas personalizadas para pelear sin restricciones.",
  "MISIONES": "Completa objetivos específicos con condiciones especiales.",
  "EVENTOS": "Desafíos temporales con reglas únicas y recompensas especiales.",
  "SUPERVIVENCIA": "Resiste oleadas infinitas de enemigos hasta caer derrotado.",
  "BOSS RUSH": "Enfréntate únicamente a los jefes, uno tras otro, sin descanso.",
  "ENTRENAMIENTO": "Practica combos, movimientos y estrategias sin presión.",
  "TIENDA": "Compra personajes, skins y mejoras usando cristales.",
  "DOCUMENTOS": "Consulta información del mundo, historia y guías internas.",
  "LOGROS": "Revisa tus hazañas y desafíos completados durante el juego.",
  "CONFIGURACIÓN": "Ajusta controles, sonido, gráficos y opciones generales.",
  "SALIR": "Cierra el juego."
};
