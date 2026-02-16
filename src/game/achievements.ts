import type { Achievement, GameStats } from './types';

export const ACHIEVEMENTS: Achievement[] = [
  // Normal (5 crystals)
  { id: 'first_fight', name: 'PRIMER COMBATE', description: 'Completa tu primer combate', difficulty: 'normal', reward: 5, condition: s => s.totalFights >= 1 },
  { id: 'first_win', name: 'PRIMERA VICTORIA', description: 'Gana tu primer combate', difficulty: 'normal', reward: 5, condition: s => s.totalWins >= 1 },
  { id: 'combo_3', name: 'COMBO BÁSICO', description: 'Realiza un combo de 3 golpes', difficulty: 'normal', reward: 5, condition: s => s.comboMax >= 3 },
  { id: 'block_10', name: 'DEFENSOR', description: 'Bloquea 10 ataques', difficulty: 'normal', reward: 5, condition: s => s.totalBlocks >= 10 },
  { id: 'create_char', name: 'CREADOR', description: 'Crea tu primer personaje personalizado', difficulty: 'normal', reward: 5, condition: s => s.customCharsCreated >= 1 },
  { id: 'special_5', name: 'ESPECIALISTA', description: 'Usa 5 habilidades especiales', difficulty: 'normal', reward: 5, condition: s => s.totalSpecials >= 5 },
  
  // Dificil (10 crystals)
  { id: 'wins_10', name: 'GUERRERO EXPERTO', description: 'Gana 10 combates', difficulty: 'dificil', reward: 10, condition: s => s.totalWins >= 10 },
  { id: 'combo_8', name: 'COMBO MAESTRO', description: 'Realiza un combo de 8 golpes', difficulty: 'dificil', reward: 10, condition: s => s.comboMax >= 8 },
  { id: 'survive_5', name: 'SUPERVIVIENTE', description: 'Sobrevive 5 oleadas', difficulty: 'dificil', reward: 10, condition: s => s.roundsSurvived >= 5 },
  { id: 'super_10', name: 'PODER SUPREMO', description: 'Usa 10 ataques súper', difficulty: 'dificil', reward: 10, condition: s => s.totalSupers >= 10 },
  { id: 'damage_500', name: 'DESTRUCTOR', description: 'Inflige 500 de daño total', difficulty: 'dificil', reward: 10, condition: s => s.totalDamage >= 500 },
  
  // Muy complicado (20 crystals)
  { id: 'combo_15', name: 'ULTRA COMBO', description: 'Realiza un combo de 15 golpes', difficulty: 'muy_dificil', reward: 20, condition: s => s.comboMax >= 15 },
  { id: 'perfect_win', name: 'VICTORIA PERFECTA', description: 'Gana sin recibir daño', difficulty: 'muy_dificil', reward: 20, condition: s => s.perfectWins >= 1 },
  { id: 'survive_10', name: 'INMORTAL', description: 'Sobrevive 10 oleadas', difficulty: 'muy_dificil', reward: 20, condition: s => s.roundsSurvived >= 10 },
  { id: 'wins_50', name: 'LEYENDA', description: 'Gana 50 combates', difficulty: 'muy_dificil', reward: 20, condition: s => s.totalWins >= 50 },
  { id: 'ultra_5', name: 'PODER DEFINITIVO', description: 'Usa 5 ataques ultra', difficulty: 'muy_dificil', reward: 20, condition: s => s.totalUltras >= 5 },
  
  // Bastante dificil (50 crystals)
  { id: 'combo_20', name: 'EXTREME COMBO', description: 'Realiza un combo de 20 golpes', difficulty: 'bastante_dificil', reward: 50, condition: s => s.comboMax >= 20 },
  { id: 'wins_100', name: 'DIOS DEL COMBATE', description: 'Gana 100 combates', difficulty: 'bastante_dificil', reward: 50, condition: s => s.totalWins >= 100 },
  { id: 'survive_20', name: 'ETERNO', description: 'Sobrevive 20 oleadas', difficulty: 'bastante_dificil', reward: 50, condition: s => s.roundsSurvived >= 20 },
  { id: 'perfect_5', name: 'PERFECCIONISTA', description: 'Consigue 5 victorias perfectas', difficulty: 'bastante_dificil', reward: 50, condition: s => s.perfectWins >= 5 },
  { id: 'create_6', name: 'MAESTRO CREADOR', description: 'Crea 6 personajes personalizados', difficulty: 'bastante_dificil', reward: 50, condition: s => s.customCharsCreated >= 6 },
];

const DEFAULT_STATS: GameStats = {
  totalFights: 0, totalWins: 0, totalKOs: 0, comboMax: 0,
  totalDamage: 0, customCharsCreated: 0, roundsSurvived: 0,
  perfectWins: 0, totalBlocks: 0, totalSpecials: 0,
  totalSupers: 0, totalUltras: 0, totalTransforms: 0,
};

export function loadStats(): GameStats {
  try { return { ...DEFAULT_STATS, ...JSON.parse(localStorage.getItem('gameStats') || '{}') }; }
  catch { return { ...DEFAULT_STATS }; }
}

export function saveStats(stats: GameStats) {
  localStorage.setItem('gameStats', JSON.stringify(stats));
}

export function loadUnlocked(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem('unlockedAchievements') || '[]')); }
  catch { return new Set(); }
}

export function loadClaimed(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem('claimedAchievements') || '[]')); }
  catch { return new Set(); }
}

export function saveUnlocked(set: Set<string>) {
  localStorage.setItem('unlockedAchievements', JSON.stringify([...set]));
}

export function saveClaimed(set: Set<string>) {
  localStorage.setItem('claimedAchievements', JSON.stringify([...set]));
}

export function checkAchievements(stats: GameStats): Achievement[] {
  const unlocked = loadUnlocked();
  const newlyUnlocked: Achievement[] = [];
  ACHIEVEMENTS.forEach(a => {
    if (!unlocked.has(a.id) && a.condition(stats)) {
      unlocked.add(a.id);
      newlyUnlocked.push(a);
    }
  });
  if (newlyUnlocked.length > 0) saveUnlocked(unlocked);
  return newlyUnlocked;
}

export function getDifficultyColor(d: Achievement['difficulty']): string {
  switch (d) {
    case 'normal': return '#00ff66';
    case 'dificil': return '#ffcc00';
    case 'muy_dificil': return '#ff8800';
    case 'bastante_dificil': return '#ff0044';
  }
}

export function getDifficultyLabel(d: Achievement['difficulty']): string {
  switch (d) {
    case 'normal': return 'NORMAL';
    case 'dificil': return 'DIFÍCIL';
    case 'muy_dificil': return 'MUY DIFÍCIL';
    case 'bastante_dificil': return 'BASTANTE DIFÍCIL';
  }
}
