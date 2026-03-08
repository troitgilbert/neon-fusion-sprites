// Character-based abilities for custom characters

export interface CharAbility {
  name: string;
  source: string;
  attackId: string;
}

export const SPECIAL_ABILITIES: CharAbility[] = [
  { name: 'Cristal', source: 'Edowado', attackId: 'edowado_special' },
  { name: 'Estela Dorada', source: 'Kaito', attackId: 'kaito_special' },
  { name: 'Intangibilidad', source: 'Demonio Blanco', attackId: 'demonio_special' },
  { name: 'Estela Asesina', source: 'Asesino', attackId: 'asesino_special' },
];

export const SUPER_ABILITIES: CharAbility[] = [
  { name: 'Impacto Rojo', source: 'Edowado', attackId: 'edowado_super' },
  { name: 'Esfera Rebotante', source: 'Kaito', attackId: 'kaito_super' },
  { name: 'Teletransporte Oscuro', source: 'Demonio Blanco', attackId: 'demonio_super' },
  { name: 'Teletransporte Rojo', source: 'Asesino', attackId: 'asesino_super' },
];

export const ULTRA_ABILITIES: CharAbility[] = [
  { name: 'Persecución Blanca', source: 'Edowado', attackId: 'edowado_ultra' },
  { name: 'Detención Temporal', source: 'Kaito', attackId: 'kaito_ultra' },
  { name: 'Eclipse Negro', source: 'Demonio Blanco', attackId: 'demonio_ultra' },
  { name: 'Juicio Final', source: 'Asesino', attackId: 'asesino_ultra' },
];

// Legacy compat
export const SPECIAL_SKILLS = SPECIAL_ABILITIES.map(a => a.name);
export const SUPER_SKILLS = SUPER_ABILITIES.map(a => a.name);
export const ULTRA_SKILLS = ULTRA_ABILITIES.map(a => a.name);
