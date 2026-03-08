import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA } from '../game/constants';
import { playHitSound, playSpecialSound, playSuperSound } from '../game/audio';

// ============= TYPES =============
interface Weapon {
  x: number; y: number; type: 'pistola' | 'sable' | 'canon_gamma' | 'espada_fuego' | 'rafaga_fuego' | 'hacha_huesos';
  ammo: number; maxAmmo: number; picked: boolean;
}

interface Enemy {
  x: number; y: number; hp: number; maxHp: number; type: string;
  vx: number; vy: number; size: number; isFlying: boolean;
  shootTimer: number; speed: number;
  hatColor?: string; clothesColor?: string; pantsColor?: string;
  burnTimer?: number; facing?: number;
  attackCooldown: number; isAttacking: boolean;
}

interface Projectile {
  x: number; y: number; vx: number; vy: number; life: number;
  color: string; isPlayer: boolean; damage: number; type?: string;
  target?: { x: number; y: number };
}

interface Asteroid {
  x: number; y: number; hp: number; size: number;
}

interface Crystal {
  x: number; y: number; value: number; life: number;
}

interface Parrot {
  x: number; y: number; vx: number; alive: boolean;
}

interface BlackHole {
  x: number; y: number; radius: number; strength: number;
}

interface Portal {
  x1: number; y1: number; x2: number; y2: number; color: string;
}

interface Slave {
  x: number; y: number; freed: boolean; reward: number; hasQuest: boolean;
}

interface DarkTower {
  x: number; y: number; hp: number; width: number; height: number;
}

interface Chest {
  x: number; y: number; opened: boolean; isTrap: boolean; hasKey: boolean;
}

interface LavaPool {
  x: number; y: number; width: number;
}

interface SecretDoor {
  x: number; y: number; found: boolean;
}

interface Platform {
  x: number; y: number; w: number; h: number;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; color: string;
}

// ============= CONSTANTS =============
const WORLD_WIDTH = 8000;
const SCREEN_W = 640;
const SCREEN_H = 480;
const FLOOR = 400;
const GRAVITY = 0.5;
const ENERGY_MAX = 300;
const ENERGY_REGEN = 0.4;
const SPECIAL_COST = 49.5;
const SUPER_COST = 100;
const ULTRA_COST = 300;

const AdventurePlay: React.FC = () => {
  const { engine, setGameState } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldId = useRef((engine as any).adventureWorld || 'galaxia');
  const charIdx = useRef((engine as any).adventureCharIdx ?? 0);
  const [gameOver, setGameOver] = useState(false);
  const [crystalsCollected, setCrystalsCollected] = useState(0);
  const [crystalNotif, setCrystalNotif] = useState<{ value: number; time: number } | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const stateRef = useRef<any>(null);
  const keysRef = useRef<Record<string, boolean>>({});

  const getCharData = useCallback(() => {
    const idx = charIdx.current;
    if (idx >= 100) {
      try {
        const customs = JSON.parse(localStorage.getItem('customChars') || '[]');
        const c = customs[idx - 100];
        if (c) return { name: c.name, color: c.clothesColor || '#ff00ff', skinColor: c.skinColor || '#f5deb3', eyes: c.eyesColor || '#fff', pantsColor: c.pantsColor || '#333', handsColor: c.handsColor || '#f5deb3', hairColor: c.hairColor || '#333' };
      } catch {}
    }
    const base = CHAR_DATA[Math.min(idx, CHAR_DATA.length - 1)];
    return {
      name: base.name,
      color: idx === 0 ? '#1a3a6a' : '#333',
      skinColor: idx === 0 ? '#8B4513' : '#f5deb3',
      eyes: base.eyes,
      pantsColor: idx === 0 ? '#2a2a2a' : '#1a1a1a',
      handsColor: idx === 0 ? '#8B4513' : '#f5deb3',
      hairColor: idx === 0 ? '#3a1a0a' : '#ffff00',
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const wId = worldId.current;

    // ============= INIT STATE =============
    const s: any = {
      playerX: 100, playerY: FLOOR - 20, playerVx: 0, playerVy: 0,
      playerHp: 100, playerMaxHp: 100, playerEnergy: 0,
      cameraX: 0, isFlying: wId === 'galaxia', isGrounded: true,
      facing: 1, attackTimer: 0, specialCooldown: 0,
      weapon: null as Weapon | null, weaponTimer: 0,
      enemies: [] as Enemy[],
      platforms: [] as Platform[],
      projectiles: [] as Projectile[],
      particles: [] as Particle[],
      crystals: [] as Crystal[],
      weapons: [] as Weapon[],
      asteroids: [] as Asteroid[],
      parrots: [] as Parrot[],
      blackHoles: [] as BlackHole[],
      portals: [] as Portal[],
      slaves: [] as Slave[],
      darkTowers: [] as DarkTower[],
      chests: [] as Chest[],
      lavaPools: [] as LavaPool[],
      secretDoor: null as SecretDoor | null,
      boss: null as Enemy | null,
      bossBeamActive: false, bossBeamTimer: 0, bossBeamAngle: 0,
      kills: 0, totalCrystals: 0,
      stars: [] as { x: number; y: number; s: number; speed: number }[],
      pickupPrompt: null as { x: number; y: number } | null,
      comboHits: 0, comboTimer: 0,
    };
    stateRef.current = s;

    // Generate stars for galaxia
    if (wId === 'galaxia') {
      for (let i = 0; i < 200; i++) {
        s.stars.push({ x: Math.random() * WORLD_WIDTH, y: Math.random() * SCREEN_H, s: Math.random() * 2 + 0.5, speed: 0.2 + Math.random() * 0.5 });
      }
    }

    // Generate platforms
    if (wId === 'galaxia') {
      for (let i = 0; i < 50; i++) {
        s.platforms.push({ x: 200 + i * 150 + Math.random() * 60, y: 100 + Math.random() * 280, w: 50 + Math.random() * 80, h: 8 });
      }
    } else {
      // Infierno - tower structures as platforms
      for (let i = 0; i < 40; i++) {
        const baseX = 200 + i * 190 + Math.random() * 50;
        const towerH = 80 + Math.random() * 150;
        s.platforms.push({ x: baseX, y: FLOOR - towerH, w: 60 + Math.random() * 40, h: 10 });
        if (Math.random() > 0.5) s.platforms.push({ x: baseX + 20, y: FLOOR - towerH - 50, w: 40, h: 10 });
      }
    }

    // ============= GENERATE WEAPONS =============
    if (wId === 'galaxia') {
      for (let i = 0; i < 12; i++) {
        const types: Weapon['type'][] = ['pistola', 'sable', 'canon_gamma'];
        const t = types[Math.floor(Math.random() * types.length)];
        s.weapons.push({
          x: 300 + i * 600 + Math.random() * 200, y: FLOOR - 20,
          type: t, ammo: t === 'pistola' ? 16 : t === 'canon_gamma' ? 2 : 999,
          maxAmmo: t === 'pistola' ? 16 : t === 'canon_gamma' ? 2 : 999, picked: false,
        });
      }
    } else {
      for (let i = 0; i < 10; i++) {
        const types: Weapon['type'][] = ['espada_fuego', 'rafaga_fuego', 'hacha_huesos'];
        const t = types[Math.floor(Math.random() * types.length)];
        s.weapons.push({
          x: 400 + i * 700 + Math.random() * 200, y: FLOOR - 20,
          type: t, ammo: t === 'rafaga_fuego' ? 5 : 999,
          maxAmmo: t === 'rafaga_fuego' ? 5 : 999, picked: false,
        });
      }
    }

    // ============= GENERATE ENEMIES =============
    if (wId === 'galaxia') {
      const hatColors = ['#3a2a1a', '#222', '#1a1a1a'];
      const clothesColors = ['#8B4513', '#fff', '#333'];
      const pantsColors = ['#222', '#5a3a1a'];
      for (let i = 0; i < 35; i++) {
        const isTank = Math.random() > 0.8;
        const isFast = !isTank && Math.random() > 0.7;
        s.enemies.push({
          x: 500 + i * 200 + Math.random() * 100,
          y: 100 + Math.random() * 250,
          hp: isTank ? 40 : 12, maxHp: isTank ? 40 : 12,
          type: isTank ? 'pirata_tanque' : isFast ? 'pirata_rapido' : 'pirata',
          vx: 0, vy: 0, size: isTank ? 25 : 18, isFlying: true,
          shootTimer: 60 + Math.random() * 60, speed: isFast ? 3 : isTank ? 0.8 : 1.5,
          hatColor: hatColors[Math.floor(Math.random() * hatColors.length)],
          clothesColor: clothesColors[Math.floor(Math.random() * clothesColors.length)],
          pantsColor: pantsColors[Math.floor(Math.random() * pantsColors.length)],
          attackCooldown: 0, isAttacking: false, facing: -1,
        });
      }
      // Ship enemies
      for (let i = 0; i < 8; i++) {
        s.enemies.push({
          x: 800 + i * 900, y: 80 + Math.random() * 100,
          hp: 30, maxHp: 30, type: 'barco_pirata', vx: 0, vy: 0,
          size: 40, isFlying: true, shootTimer: 40, speed: 1,
          attackCooldown: 0, isAttacking: false, facing: -1,
        });
      }
      // Asteroids
      for (let i = 0; i < 20; i++) {
        s.asteroids.push({ x: 600 + i * 350 + Math.random() * 100, y: 50 + Math.random() * 300, hp: 4, size: 20 + Math.random() * 15 });
      }
      // Parrots
      for (let i = 0; i < 10; i++) {
        s.parrots.push({ x: 400 + i * 700, y: 50 + Math.random() * 150, vx: 2 + Math.random() * 2, alive: true });
      }
      // Black holes
      for (let i = 0; i < 4; i++) {
        s.blackHoles.push({ x: 1500 + i * 1800, y: 150 + Math.random() * 200, radius: 60, strength: 2 });
      }
      // Portals
      for (let i = 0; i < 3; i++) {
        s.portals.push({
          x1: 1000 + i * 2000, y1: 200 + Math.random() * 150,
          x2: 2000 + i * 1500 + Math.random() * 500, y2: 100 + Math.random() * 200,
          color: ['#ff00ff', '#00ffff', '#ffff00'][i],
        });
      }
      // Slaves
      for (let i = 0; i < 6; i++) {
        s.slaves.push({ x: 700 + i * 1200, y: FLOOR - 20, freed: false, reward: 3 + Math.floor(Math.random() * 5), hasQuest: Math.random() > 0.5 });
      }
      // Boss - Barco Negro Gigante
      s.boss = {
        x: WORLD_WIDTH - 400, y: 150, hp: 200, maxHp: 200,
        type: 'barco_negro', vx: 0, vy: 0, size: 80, isFlying: true,
        shootTimer: 60, speed: 1, attackCooldown: 0, isAttacking: false, facing: -1,
      };
    } else {
      // INFIERNO
      for (let i = 0; i < 40; i++) {
        const sizeVar = 0.7 + Math.random() * 0.8;
        const isFast = Math.random() > 0.7;
        s.enemies.push({
          x: 400 + i * 180 + Math.random() * 80,
          y: FLOOR - 20,
          hp: 15 * sizeVar, maxHp: 15 * sizeVar,
          type: 'demonio', vx: 0, vy: 0, size: 18 * sizeVar,
          isFlying: false, shootTimer: 100, speed: isFast ? 3.5 : 1.5,
          attackCooldown: 0, isAttacking: false, facing: -1,
        });
      }
      // Lava pools
      for (let i = 0; i < 15; i++) {
        s.lavaPools.push({ x: 500 + i * 500 + Math.random() * 200, y: FLOOR + 5, width: 80 + Math.random() * 60 });
      }
      // Dark towers
      for (let i = 0; i < 12; i++) {
        s.darkTowers.push({ x: 600 + i * 600 + Math.random() * 100, y: FLOOR - 60, hp: 4, width: 30, height: 60 });
      }
      // Chests
      for (let i = 0; i < 8; i++) {
        s.chests.push({ x: 800 + i * 900, y: FLOOR - 15, opened: false, isTrap: Math.random() > 0.5, hasKey: false });
      }
      // One key chest
      const keyIdx = Math.floor(Math.random() * s.chests.length);
      s.chests[keyIdx].isTrap = false;
      s.chests[keyIdx].hasKey = true;
      // Secret door
      s.secretDoor = { x: 3000 + Math.random() * 4000, y: FLOOR - 50, found: false };
      // Boss - Pecado
      s.boss = {
        x: WORLD_WIDTH - 300, y: FLOOR - 25, hp: 150, maxHp: 150,
        type: 'pecado', vx: 0, vy: 0, size: 30, isFlying: false,
        shootTimer: 80, speed: 2, attackCooldown: 0, isAttacking: false, facing: -1,
      };
    }

    // ============= KEY HANDLERS =============
    const onKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let animId = 0;
    const loop = () => {
      const keys = keysRef.current;
      update(s, keys, wId, engine, setGameOver, setCrystalsCollected, setCrystalNotif, setHasKey);
      draw(s, ctx, wId, getCharData());
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [engine, getCharData]);

  const handleRestart = () => {
    setGameOver(false);
    setCrystalsCollected(0);
    setHasKey(false);
    // Force remount
    setGameState('ADVENTURE_CHAR_SELECT' as any);
    setTimeout(() => {
      (engine as any).adventureWorld = worldId.current;
      (engine as any).adventureCharIdx = charIdx.current;
      setGameState('ADVENTURE_PLAY' as any);
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-50" style={{ background: '#000' }}>
      <canvas ref={canvasRef} width={1280} height={960} style={{ width: '100vw', height: '100vh', imageRendering: 'pixelated' }} />

      {/* Live HUD */}
      <div style={{ position: 'fixed', top: 15, left: 15, zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ color: '#ffcc33', fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 2, marginBottom: 5 }}>
          {worldId.current.toUpperCase()} | 🔷 {engine.coins + crystalsCollected}
        </div>
        {/* HP Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ color: '#ff4d4d', fontFamily: "'Orbitron', monospace", fontSize: 10 }}>HP</span>
          <div style={{ width: 200, height: 12, background: '#1a0000', border: '1px solid #ff4d4d30', position: 'relative' }}>
            <div style={{
              height: '100%', background: 'linear-gradient(90deg, #ff0000, #ff4d4d)',
              width: `${Math.max(0, (stateRef.current?.playerHp / stateRef.current?.playerMaxHp) * 100 || 100)}%`,
              transition: 'none', boxShadow: '0 0 8px #ff000060',
            }} />
          </div>
        </div>
        {/* Energy Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 10 }}>EN</span>
          <div style={{ width: 200, height: 8, background: '#001a1a', border: '1px solid #00ffff30' }}>
            <div style={{
              height: '100%', background: 'linear-gradient(90deg, #004488, #00ffff)',
              width: `${Math.max(0, (stateRef.current?.playerEnergy / ENERGY_MAX) * 100 || 0)}%`,
              boxShadow: '0 0 6px #00ffff40',
            }} />
          </div>
        </div>
        {stateRef.current?.weapon && (
          <div style={{ color: '#ffcc66', fontFamily: "'Orbitron', monospace", fontSize: 10, marginTop: 5 }}>
            🗡️ {stateRef.current.weapon.type.toUpperCase()} {stateRef.current.weapon.ammo < 999 ? `(${stateRef.current.weapon.ammo})` : ''}
          </div>
        )}
      </div>

      {/* Boss HP Bar */}
      {stateRef.current?.boss && stateRef.current.boss.hp > 0 && (
        <div style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 10, textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ color: '#ff4444', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 3, marginBottom: 5 }}>
            {stateRef.current.boss.type === 'barco_negro' ? 'BARCO NEGRO GIGANTE' : 'PECADO'}
          </div>
          <div style={{ width: 400, height: 14, background: '#1a0000', border: '2px solid #ff000060' }}>
            <div style={{
              height: '100%', background: 'linear-gradient(90deg, #880000, #ff0000, #ff4444)',
              width: `${(stateRef.current.boss.hp / stateRef.current.boss.maxHp) * 100}%`,
              boxShadow: '0 0 15px #ff000060',
            }} />
          </div>
        </div>
      )}

      {/* Crystal notification */}
      {crystalNotif && Date.now() - crystalNotif.time < 2000 && (
        <div style={{
          position: 'fixed', top: 80, right: 30, zIndex: 10,
          color: '#00ff66', fontFamily: "'Orbitron', monospace", fontSize: 18,
          textShadow: '0 0 10px #00ff66', animation: 'slideInRight 0.3s ease-out',
        }}>
          +{crystalNotif.value} 🔷
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        <div className="fixed inset-0 z-20 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              color: '#ff0000', fontFamily: "'Orbitron', monospace", fontSize: 48,
              letterSpacing: 8, textShadow: '0 0 30px #ff0000', marginBottom: 30,
            }}>GAME OVER</h2>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
              <button onClick={handleRestart} style={{
                padding: '12px 35px', border: '2px solid #00ffff', color: '#00ffff',
                background: 'transparent', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
              }}>REINICIAR</button>
              <button onClick={() => setGameState('MENU')} style={{
                padding: '12px 35px', border: '2px solid #ff4d4d', color: '#ff4d4d',
                background: 'transparent', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
              }}>MENÚ PRINCIPAL</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

// ============= UPDATE =============
function update(s: any, keys: Record<string, boolean>, wId: string, engine: any,
  setGameOver: (v: boolean) => void, setCrystals: (v: number) => void,
  setCrystalNotif: (v: any) => void, setHasKey: (v: boolean) => void) {
  
  const speed = 5;
  if (s.playerHp <= 0) return;

  // Movement
  if (keys['KeyA'] || keys['ArrowLeft']) { s.playerVx = -speed; s.facing = -1; }
  else if (keys['KeyD'] || keys['ArrowRight']) { s.playerVx = speed; s.facing = 1; }
  else s.playerVx *= 0.8;

  if (s.isFlying) {
    if (keys['KeyW'] || keys['ArrowUp']) s.playerVy = -speed;
    else if (keys['KeyS'] || keys['ArrowDown']) s.playerVy = speed;
    else s.playerVy *= 0.9;
  } else {
    if ((keys['KeyW'] || keys['ArrowUp']) && s.isGrounded) { s.playerVy = -13; s.isGrounded = false; }
    s.playerVy += GRAVITY;
  }

  // Energy regen
  if (s.playerEnergy < ENERGY_MAX) s.playerEnergy += ENERGY_REGEN;

  // Attack
  if (s.attackTimer > 0) s.attackTimer--;
  if (keys['KeyF'] && s.attackTimer <= 0) {
    s.attackTimer = 12;
    const range = s.weapon ? 60 : 45;
    let dmg = s.weapon?.type === 'hacha_huesos' ? 6 : s.weapon?.type === 'sable' || s.weapon?.type === 'espada_fuego' ? 4 : 3;
    
    // Hit enemies
    [...s.enemies, s.boss].filter(Boolean).forEach((e: Enemy) => {
      if (!e || e.hp <= 0) return;
      const dist = Math.hypot(e.x - s.playerX, e.y - s.playerY);
      if (dist < range && Math.sign(e.x - s.playerX) === s.facing) {
        e.hp -= dmg;
        e.vx = s.facing * 5;
        if (s.weapon?.type === 'espada_fuego') e.burnTimer = 180; // 3 sec burn
        s.comboHits++;
        s.comboTimer = 60;
        s.particles.push(...spawnParticles(e.x, e.y, '#ffaa00', 5));
        playHitSound();
      }
    });

    // Hit asteroids
    s.asteroids.forEach((a: Asteroid) => {
      const dist = Math.hypot(a.x - s.playerX, a.y - s.playerY);
      if (dist < range) { a.hp--; s.particles.push(...spawnParticles(a.x, a.y, '#888', 3)); }
    });

    // Hit dark towers
    s.darkTowers.forEach((t: DarkTower) => {
      if (t.hp <= 0) return;
      if (s.playerX > t.x - 30 && s.playerX < t.x + t.width + 30 && Math.abs(s.playerY - t.y) < t.height) {
        t.hp--;
        s.particles.push(...spawnParticles(t.x + t.width / 2, t.y, '#555', 4));
      }
    });

    // Weapon ammo
    if (s.weapon && s.weapon.type === 'pistola') {
      // Pistol shoots projectile
      s.projectiles.push({ x: s.playerX + s.facing * 20, y: s.playerY - 5, vx: s.facing * 12, vy: 0, life: 40, color: '#ffff00', isPlayer: true, damage: 5, type: 'bullet' });
      s.weapon.ammo--;
      if (s.weapon.ammo <= 0) s.weapon = null;
    }
  }

  // Weapon shoot for ranged weapons
  if (keys['KeyG'] && s.weapon?.type === 'canon_gamma' && s.weapon.ammo > 0 && s.attackTimer <= 0) {
    s.projectiles.push({ x: s.playerX + s.facing * 25, y: s.playerY, vx: s.facing * 8, vy: 0, life: 80, color: '#4488ff', isPlayer: true, damage: 25, type: 'gamma' });
    s.weapon.ammo--;
    if (s.weapon.ammo <= 0) s.weapon = null;
    s.attackTimer = 20;
    playSuperSound();
  }
  if (keys['KeyG'] && s.weapon?.type === 'rafaga_fuego' && s.weapon.ammo > 0 && s.attackTimer <= 0) {
    s.projectiles.push({ x: s.playerX + s.facing * 20, y: s.playerY, vx: s.facing * 7, vy: 0, life: 60, color: '#ff4400', isPlayer: true, damage: 8, type: 'fireball' });
    s.weapon.ammo--;
    if (s.weapon.ammo <= 0) s.weapon = null;
    s.attackTimer = 15;
  }

  // Special (G without weapon)
  if (keys['KeyG'] && !s.weapon && s.playerEnergy >= SPECIAL_COST && s.specialCooldown <= 0) {
    s.playerEnergy -= SPECIAL_COST;
    s.specialCooldown = 30;
    s.projectiles.push({ x: s.playerX + s.facing * 25, y: s.playerY, vx: s.facing * 10, vy: 0, life: 50, color: '#00ffff', isPlayer: true, damage: 10, type: 'special' });
    playSpecialSound();
  }

  // Super (H)
  if (keys['KeyH'] && s.playerEnergy >= SUPER_COST && s.specialCooldown <= 0) {
    s.playerEnergy -= SUPER_COST;
    s.specialCooldown = 45;
    for (let i = -2; i <= 2; i++) {
      s.projectiles.push({ x: s.playerX, y: s.playerY, vx: s.facing * 8, vy: i * 2, life: 60, color: '#ffcc33', isPlayer: true, damage: 15, type: 'super' });
    }
    playSuperSound();
  }

  // Ultra (E)
  if (keys['KeyE'] && s.playerEnergy >= ULTRA_COST && s.specialCooldown <= 0) {
    s.playerEnergy -= ULTRA_COST;
    s.specialCooldown = 60;
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      s.projectiles.push({ x: s.playerX, y: s.playerY, vx: Math.cos(angle) * 8, vy: Math.sin(angle) * 8, life: 80, color: '#ff00ff', isPlayer: true, damage: 20, type: 'ultra' });
    }
    playSuperSound();
  }

  if (s.specialCooldown > 0) s.specialCooldown--;
  if (s.comboTimer > 0) { s.comboTimer--; } else { s.comboHits = 0; }

  // Movement
  s.playerX += s.playerVx;
  s.playerY += s.playerVy;

  // Floor collision
  if (!s.isFlying && s.playerY >= FLOOR - 20) {
    s.playerY = FLOOR - 20; s.playerVy = 0; s.isGrounded = true;
  }

  // Platform collision
  if (!s.isFlying) {
    s.platforms.forEach((p: Platform) => {
      if (s.playerX > p.x - 10 && s.playerX < p.x + p.w + 10 &&
          s.playerY + 20 >= p.y && s.playerY + 20 <= p.y + 12 && s.playerVy > 0) {
        s.playerY = p.y - 20; s.playerVy = 0; s.isGrounded = true;
      }
    });
  }

  s.playerX = Math.max(20, Math.min(WORLD_WIDTH - 20, s.playerX));
  if (!s.isFlying) s.playerY = Math.min(FLOOR - 20, s.playerY);
  else s.playerY = Math.max(20, Math.min(FLOOR - 20, s.playerY));
  s.cameraX = Math.max(0, Math.min(WORLD_WIDTH - 640, s.playerX - 320));

  // ============= WEAPON PICKUP PROMPT =============
  s.pickupPrompt = null;
  s.weapons.forEach((w: Weapon) => {
    if (!w.picked && Math.hypot(w.x - s.playerX, w.y - s.playerY) < 40) {
      s.pickupPrompt = { x: w.x, y: w.y - 30 };
      if (keys['KeyF'] && s.attackTimer === 12) { // Just pressed
        w.picked = true;
        s.weapon = { ...w };
      }
    }
  });

  // ============= LAVA DAMAGE =============
  s.lavaPools.forEach((lp: LavaPool) => {
    if (s.playerX > lp.x && s.playerX < lp.x + lp.width && s.playerY >= FLOOR - 25) {
      s.playerHp -= 0.5; // Constant damage in lava
      s.particles.push(...spawnParticles(s.playerX, s.playerY, '#ff4400', 1));
    }
  });

  // ============= BLACK HOLES =============
  s.blackHoles.forEach((bh: BlackHole) => {
    const dx = bh.x - s.playerX;
    const dy = bh.y - s.playerY;
    const dist = Math.hypot(dx, dy);
    if (dist < 200) {
      const force = bh.strength * (1 - dist / 200);
      s.playerVx += (dx / dist) * force;
      s.playerVy += (dy / dist) * force;
    }
    if (dist < 25) s.playerHp -= 1; // Absorbed = big damage
  });

  // ============= PORTALS =============
  s.portals.forEach((p: Portal) => {
    if (Math.hypot(p.x1 - s.playerX, p.y1 - s.playerY) < 25) {
      s.playerX = p.x2; s.playerY = p.y2;
    } else if (Math.hypot(p.x2 - s.playerX, p.y2 - s.playerY) < 25) {
      s.playerX = p.x1; s.playerY = p.y1;
    }
  });

  // ============= ASTEROIDS =============
  s.asteroids = s.asteroids.filter((a: Asteroid) => {
    if (a.hp <= 0) {
      s.crystals.push({ x: a.x, y: a.y, value: 1, life: 300 });
      s.particles.push(...spawnParticles(a.x, a.y, '#888', 10));
      return false;
    }
    return true;
  });

  // ============= DARK TOWERS =============
  s.darkTowers = s.darkTowers.filter((t: DarkTower) => {
    if (t.hp <= 0) {
      s.crystals.push({ x: t.x, y: t.y - 10, value: 2, life: 300 });
      s.crystals.push({ x: t.x + 20, y: t.y - 10, value: 2, life: 300 }); // Total 4 = 2 diamonds worth
      s.particles.push(...spawnParticles(t.x + t.width / 2, t.y, '#555', 15));
      return false;
    }
    return true;
  });

  // ============= CHESTS =============
  s.chests.forEach((ch: Chest) => {
    if (!ch.opened && Math.hypot(ch.x - s.playerX, ch.y - s.playerY) < 30 && keys['KeyF']) {
      ch.opened = true;
      if (ch.isTrap) {
        s.playerHp -= 20;
        s.particles.push(...spawnParticles(ch.x, ch.y, '#ff0000', 20));
      } else if (ch.hasKey) {
        setHasKey(true);
        setCrystalNotif({ value: 0, time: Date.now() }); // Just to trigger notif
      } else {
        s.crystals.push({ x: ch.x, y: ch.y - 10, value: 3, life: 300 });
      }
    }
  });

  // ============= SECRET DOOR =============
  if (s.secretDoor && !s.secretDoor.found) {
    // Check proximity
  }

  // ============= PARROTS =============
  s.parrots.forEach((p: Parrot) => {
    if (!p.alive) return;
    p.x += p.vx;
    if (p.x > WORLD_WIDTH + 50) { p.alive = false; return; }
    // Check if player hits parrot
    if (Math.hypot(p.x - s.playerX, p.y - s.playerY) < 20 && keys['KeyF']) {
      p.alive = false;
      addCrystals(s, 3, p.x, p.y, setCrystals, setCrystalNotif, engine);
    }
  });

  // ============= SLAVES =============
  s.slaves.forEach((sl: Slave) => {
    if (!sl.freed && Math.hypot(sl.x - s.playerX, sl.y - s.playerY) < 40) {
      // Check if nearby enemies are dead
      const nearEnemies = s.enemies.filter((e: Enemy) => Math.hypot(e.x - sl.x, e.y - sl.y) < 150 && e.hp > 0);
      if (nearEnemies.length === 0) {
        sl.freed = true;
        addCrystals(s, sl.reward, sl.x, sl.y, setCrystals, setCrystalNotif, engine);
      }
    }
  });

  // ============= CRYSTALS =============
  s.crystals = s.crystals.filter((c: Crystal) => {
    c.life--;
    if (Math.hypot(c.x - s.playerX, c.y - s.playerY) < 30) {
      addCrystals(s, c.value, c.x, c.y, setCrystals, setCrystalNotif, engine);
      return false;
    }
    return c.life > 0;
  });

  // ============= ENEMIES =============
  s.enemies = s.enemies.filter((e: Enemy) => {
    if (e.hp <= 0) {
      s.kills++;
      s.particles.push(...spawnParticles(e.x, e.y, e.type.includes('demonio') ? '#ff0000' : '#ffaa00', 12));
      if (Math.random() > 0.7) s.crystals.push({ x: e.x, y: e.y, value: 1, life: 300 });
      return false;
    }

    // Burn damage
    if (e.burnTimer && e.burnTimer > 0) {
      e.burnTimer--;
      if (e.burnTimer % 20 === 0) { e.hp -= 1; s.particles.push(...spawnParticles(e.x, e.y, '#ff4400', 2)); }
    }

    // AI
    const dx = s.playerX - e.x;
    const dy = s.playerY - e.y;
    const dist = Math.hypot(dx, dy);
    e.facing = Math.sign(dx);

    if (dist < 400) {
      e.vx = Math.sign(dx) * e.speed;
      if (e.isFlying) e.vy = Math.sign(dy) * e.speed * 0.5;
    } else {
      e.vx *= 0.95;
    }

    e.x += e.vx;
    if (!e.isFlying) {
      e.vy = (e.vy || 0) + GRAVITY;
      e.y += e.vy;
      if (e.y >= FLOOR - e.size) { e.y = FLOOR - e.size; e.vy = 0; }
    } else {
      e.y += (e.vy || 0);
      e.y = Math.max(30, Math.min(FLOOR - e.size, e.y));
    }

    // Contact damage
    if (dist < e.size + 15) {
      s.playerHp -= 0.4;
    }

    // Shooting (ships / boss)
    if (e.type === 'barco_pirata') {
      e.shootTimer--;
      if (e.shootTimer <= 0) {
        e.shootTimer = 80;
        const angle = Math.atan2(s.playerY - e.y, s.playerX - e.x);
        s.projectiles.push({
          x: e.x, y: e.y, vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3,
          life: 180, color: '#ff8800', isPlayer: false, damage: 8,
          type: 'torpedo', target: { x: s.playerX, y: s.playerY },
        });
      }
    }

    return true;
  });

  // ============= BOSS UPDATE =============
  if (s.boss && s.boss.hp > 0) {
    const b = s.boss;
    const dx = s.playerX - b.x;
    const dy = s.playerY - b.y;

    if (wId === 'galaxia') {
      // Barco Negro - moves slowly, shoots 3 torpedoes
      b.vx = Math.sign(dx) * 0.5;
      b.x += b.vx;
      b.y += Math.sin(Date.now() * 0.002) * 0.5;
      
      b.shootTimer--;
      if (b.shootTimer <= 0) {
        b.shootTimer = 90;
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            if (b.hp <= 0) return;
            s.projectiles.push({
              x: b.x, y: b.y + 20, vx: Math.sign(dx) * 3, vy: (i - 1) * 1.5,
              life: 200, color: '#ff0000', isPlayer: false, damage: 12,
              type: 'torpedo', target: { x: s.playerX, y: s.playerY },
            });
          }, i * 200);
        }
      }

      // Beam special (every 15 seconds)
      if (!s.bossBeamActive && b.shootTimer === 45) {
        s.bossBeamActive = true;
        s.bossBeamTimer = 600; // 10 seconds
        s.bossBeamAngle = Math.atan2(dy, dx);
      }
    } else {
      // Pecado - melee + fire attacks
      b.vx = Math.sign(dx) * b.speed;
      b.x += b.vx;
      if (!b.isFlying) {
        b.vy = (b.vy || 0) + GRAVITY;
        b.y += b.vy;
        if (b.y >= FLOOR - b.size) { b.y = FLOOR - b.size; b.vy = 0; }
      }

      // Contact damage with fire sword
      if (Math.hypot(dx, dy) < 50) {
        s.playerHp -= 0.6;
        if (Math.random() > 0.95) s.particles.push(...spawnParticles(s.playerX, s.playerY, '#ff4400', 3));
      }

      b.shootTimer--;
      if (b.shootTimer <= 0) {
        b.shootTimer = 120;
        for (let i = 0; i < 3; i++) {
          s.projectiles.push({
            x: b.x, y: b.y, vx: Math.sign(dx) * 4, vy: (i - 1) * 2,
            life: 300, color: '#ff4400', isPlayer: false, damage: 10,
            type: 'homing', target: { x: s.playerX, y: s.playerY },
          });
        }
      }
    }

    // Boss hit detection with player attacks (handled in attack section above)
    if (b.hp <= 0) {
      const reward = wId === 'galaxia' ? 30 : 20;
      addCrystals(s, reward, b.x, b.y, setCrystals, setCrystalNotif, engine);
      s.particles.push(...spawnParticles(b.x, b.y, '#ffff00', 30));
    }
  }

  // Boss beam
  if (s.bossBeamActive && s.boss && s.boss.hp > 0) {
    s.bossBeamTimer--;
    // Beam tracks player slowly
    const targetAngle = Math.atan2(s.playerY - s.boss.y, s.playerX - s.boss.x);
    s.bossBeamAngle += (targetAngle - s.bossBeamAngle) * 0.02;
    // Beam damage
    const beamLen = 500;
    const beamEndX = s.boss.x + Math.cos(s.bossBeamAngle) * beamLen;
    const beamEndY = s.boss.y + Math.sin(s.bossBeamAngle) * beamLen;
    // Check if player is near beam line
    const px = s.playerX - s.boss.x;
    const py = s.playerY - s.boss.y;
    const bx = beamEndX - s.boss.x;
    const by = beamEndY - s.boss.y;
    const t = Math.max(0, Math.min(1, (px * bx + py * by) / (bx * bx + by * by)));
    const closestX = s.boss.x + t * bx;
    const closestY = s.boss.y + t * by;
    if (Math.hypot(s.playerX - closestX, s.playerY - closestY) < 20) {
      s.playerHp -= 0.8;
    }
    if (s.bossBeamTimer <= 0) s.bossBeamActive = false;
  }

  // ============= PROJECTILES =============
  s.projectiles = s.projectiles.filter((p: Projectile) => {
    // Homing projectiles track player
    if (p.type === 'torpedo' || p.type === 'homing') {
      const dx = s.playerX - p.x;
      const dy = s.playerY - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        p.vx += (dx / dist) * 0.15;
        p.vy += (dy / dist) * 0.15;
        const spd = Math.hypot(p.vx, p.vy);
        if (spd > 5) { p.vx = (p.vx / spd) * 5; p.vy = (p.vy / spd) * 5; }
      }
    }

    p.x += p.vx; p.y += p.vy; p.life--;

    if (p.isPlayer) {
      [...s.enemies, s.boss].filter(Boolean).forEach((e: Enemy) => {
        if (!e || e.hp <= 0) return;
        if (Math.hypot(p.x - e.x, p.y - e.y) < e.size + 8) {
          e.hp -= p.damage; p.life = 0;
          s.particles.push(...spawnParticles(e.x, e.y, p.color, 5));
        }
      });
    } else {
      if (Math.hypot(p.x - s.playerX, p.y - s.playerY) < 18) {
        s.playerHp -= p.damage; p.life = 0;
        s.particles.push(...spawnParticles(s.playerX, s.playerY, '#ff0000', 5));
      }
    }
    return p.life > 0;
  });

  // ============= PARTICLES =============
  s.particles = s.particles.filter((p: Particle) => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life--;
    return p.life > 0;
  });

  // ============= DEATH =============
  if (s.playerHp <= 0) {
    s.playerHp = 0;
    setGameOver(true);
  }

  // Stars movement (galaxia)
  if (wId === 'galaxia') {
    s.stars.forEach((star: any) => { star.x -= star.speed; if (star.x < -10) star.x = WORLD_WIDTH + 10; });
  }
}

function addCrystals(s: any, value: number, x: number, y: number, setCrystals: any, setCrystalNotif: any, engine: any) {
  s.totalCrystals += value;
  engine.updatePrisms(value);
  setCrystals(s.totalCrystals);
  setCrystalNotif({ value, time: Date.now() });
}

function spawnParticles(x: number, y: number, color: string, count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 2,
    life: 25 + Math.random() * 15, color,
  }));
}

// ============= DRAW =============
function draw(s: any, ctx: CanvasRenderingContext2D, wId: string, charData: any) {
  ctx.save();
  ctx.scale(2, 2);
  const t = Date.now() * 0.001;

  // ============= BACKGROUND =============
  if (wId === 'galaxia') {
    const bg = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
    bg.addColorStop(0, '#020015'); bg.addColorStop(0.4, '#0a0a30'); bg.addColorStop(1, '#050520');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // Stars parallax
    s.stars.forEach((star: any) => {
      const sx = star.x - s.cameraX * 0.3;
      if (sx < -5 || sx > SCREEN_W + 5) return;
      const tw = 0.4 + Math.sin(t * 3 + star.x * 0.1) * 0.4;
      ctx.globalAlpha = tw;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(sx, star.y, star.s, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  } else {
    // Infierno
    const bg = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
    bg.addColorStop(0, '#1a0000'); bg.addColorStop(0.3, '#3d0000'); bg.addColorStop(0.7, '#2a0000'); bg.addColorStop(1, '#0a0000');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // Background castles
    ctx.fillStyle = '#150000';
    for (let i = 0; i < 6; i++) {
      const cx = (i * 200 - s.cameraX * 0.1) % (SCREEN_W + 200) - 50;
      ctx.fillRect(cx, 100, 40, 250);
      ctx.fillRect(cx - 10, 90, 60, 15);
      // Towers
      ctx.fillRect(cx - 5, 70, 15, 30);
      ctx.fillRect(cx + 30, 80, 15, 25);
    }

    // Fire particles in background
    for (let i = 0; i < 15; i++) {
      const fx = ((i * 97 + t * 30) % SCREEN_W);
      const fy = FLOOR - ((t * 40 + i * 37) % 200);
      ctx.globalAlpha = Math.max(0, 0.5 - (FLOOR - fy) / 400);
      ctx.fillStyle = ['#ff4400', '#ff8800', '#ffcc00'][i % 3];
      ctx.beginPath(); ctx.arc(fx, fy, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Camera translate
  ctx.translate(-s.cameraX, 0);

  // ============= FLOOR =============
  if (wId === 'galaxia') {
    // No solid floor in space - just floating platforms
  } else {
    // Infierno ground
    ctx.fillStyle = '#1a0800';
    ctx.fillRect(0, FLOOR, WORLD_WIDTH, SCREEN_H - FLOOR);
    ctx.strokeStyle = '#ff440040'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(WORLD_WIDTH, FLOOR); ctx.stroke();
  }

  // ============= LAVA POOLS =============
  s.lavaPools.forEach((lp: LavaPool) => {
    const lavaGrad = ctx.createLinearGradient(lp.x, FLOOR, lp.x, FLOOR + 30);
    lavaGrad.addColorStop(0, '#ff6600'); lavaGrad.addColorStop(0.5, '#ff3300'); lavaGrad.addColorStop(1, '#aa0000');
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(lp.x, FLOOR, lp.width, 30);
    // Bubbles
    for (let i = 0; i < 3; i++) {
      const bx = lp.x + (i + 1) * lp.width / 4 + Math.sin(t * 3 + i) * 5;
      const by = FLOOR + 5 + Math.sin(t * 4 + i * 2) * 3;
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath(); ctx.arc(bx, by, 2, 0, Math.PI * 2); ctx.fill();
    }
  });

  // ============= PLATFORMS =============
  s.platforms.forEach((p: Platform) => {
    ctx.fillStyle = wId === 'infierno' ? '#2a0800' : '#1a1a4a';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = wId === 'infierno' ? '#ff440030' : '#00ffff20';
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  });

  // ============= DARK TOWERS =============
  s.darkTowers.forEach((dt: DarkTower) => {
    if (dt.hp <= 0) return;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(dt.x, dt.y, dt.width, dt.height);
    ctx.strokeStyle = '#444'; ctx.strokeRect(dt.x, dt.y, dt.width, dt.height);
    // Cracks based on damage
    if (dt.hp < 4) {
      ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(dt.x + 5, dt.y + 10); ctx.lineTo(dt.x + dt.width - 5, dt.y + dt.height - 10); ctx.stroke();
    }
  });

  // ============= CHESTS =============
  s.chests.forEach((ch: Chest) => {
    ctx.fillStyle = ch.opened ? '#444' : '#8B6914';
    ctx.fillRect(ch.x - 12, ch.y - 10, 24, 16);
    ctx.strokeStyle = ch.opened ? '#555' : '#DAA520';
    ctx.strokeRect(ch.x - 12, ch.y - 10, 24, 16);
    if (!ch.opened) {
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(ch.x - 3, ch.y - 5, 6, 6);
    }
  });

  // ============= SECRET DOOR =============
  if (s.secretDoor && wId === 'infierno') {
    const sd = s.secretDoor;
    ctx.fillStyle = '#2a1a00';
    ctx.fillRect(sd.x - 15, sd.y, 30, 50);
    ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 2;
    ctx.strokeRect(sd.x - 15, sd.y, 30, 50);
    ctx.fillStyle = '#DAA520';
    ctx.beginPath(); ctx.arc(sd.x + 8, sd.y + 25, 3, 0, Math.PI * 2); ctx.fill();
  }

  // ============= WEAPONS ON GROUND =============
  s.weapons.forEach((w: Weapon) => {
    if (w.picked) return;
    ctx.fillStyle = w.type === 'pistola' ? '#888' : w.type === 'sable' ? '#ccc' :
      w.type === 'canon_gamma' ? '#4488ff' : w.type === 'espada_fuego' ? '#ff4400' :
      w.type === 'rafaga_fuego' ? '#ff6600' : '#ddd';
    // Simple weapon shapes
    if (w.type === 'pistola' || w.type === 'canon_gamma' || w.type === 'rafaga_fuego') {
      ctx.fillRect(w.x - 10, w.y - 3, 20, 6);
      ctx.fillRect(w.x - 2, w.y, 4, 8);
    } else {
      // Sword/saber
      ctx.fillRect(w.x - 2, w.y - 20, 4, 25);
      ctx.fillRect(w.x - 8, w.y + 2, 16, 4);
    }
    // Glow
    ctx.globalAlpha = 0.2 + Math.sin(t * 4) * 0.1;
    ctx.fillStyle = w.type.includes('fuego') ? '#ff4400' : w.type === 'canon_gamma' ? '#4488ff' : '#ffcc33';
    ctx.beginPath(); ctx.arc(w.x, w.y, 15, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });

  // ============= PICKUP PROMPT =============
  if (s.pickupPrompt) {
    ctx.fillStyle = '#ffcc33';
    ctx.font = '10px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[F] RECOGER', s.pickupPrompt.x, s.pickupPrompt.y);
  }

  // ============= ASTEROIDS =============
  s.asteroids.forEach((a: Asteroid) => {
    ctx.fillStyle = '#666';
    ctx.beginPath(); ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#888'; ctx.stroke();
    // Craters
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(a.x - a.size * 0.3, a.y - a.size * 0.2, a.size * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(a.x + a.size * 0.2, a.y + a.size * 0.3, a.size * 0.15, 0, Math.PI * 2); ctx.fill();
    // HP indicator
    if (a.hp < 4) {
      ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 1;
      for (let i = 0; i < 4 - a.hp; i++) {
        ctx.beginPath(); ctx.moveTo(a.x - a.size + i * 10, a.y); ctx.lineTo(a.x + i * 5, a.y - a.size); ctx.stroke();
      }
    }
  });

  // ============= BLACK HOLES =============
  s.blackHoles.forEach((bh: BlackHole) => {
    const bhx = bh.x;
    const grad = ctx.createRadialGradient(bhx, bh.y, 0, bhx, bh.y, bh.radius);
    grad.addColorStop(0, '#000'); grad.addColorStop(0.5, 'rgba(50,0,100,0.5)'); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(bhx, bh.y, bh.radius, 0, Math.PI * 2); ctx.fill();
    // Swirl
    ctx.strokeStyle = 'rgba(100,0,200,0.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bhx, bh.y, 20 + Math.sin(t * 3) * 5, t * 2, t * 2 + Math.PI * 1.5); ctx.stroke();
  });

  // ============= PORTALS =============
  s.portals.forEach((p: Portal) => {
    [{ x: p.x1, y: p.y1 }, { x: p.x2, y: p.y2 }].forEach(pos => {
      ctx.strokeStyle = p.color; ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.3;
      ctx.beginPath(); ctx.ellipse(pos.x, pos.y, 15, 25, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.ellipse(pos.x, pos.y, 12, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    });
  });

  // ============= PARROTS =============
  s.parrots.forEach((p: Parrot) => {
    if (!p.alive) return;
    ctx.fillStyle = '#00cc00';
    ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
    // Beak
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath(); ctx.moveTo(p.x + 8, p.y); ctx.lineTo(p.x + 14, p.y + 2); ctx.lineTo(p.x + 8, p.y + 3); ctx.fill();
    // Wing
    ctx.fillStyle = '#009900';
    ctx.beginPath(); ctx.ellipse(p.x - 3, p.y + 2, 8, 4, Math.sin(t * 10) * 0.3, 0, Math.PI * 2); ctx.fill();
  });

  // ============= SLAVES =============
  s.slaves.forEach((sl: Slave) => {
    if (sl.freed) return;
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath(); ctx.arc(sl.x, sl.y - 12, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#666';
    ctx.fillRect(sl.x - 5, sl.y - 4, 10, 15);
    // Chain
    ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sl.x - 10, sl.y + 5); ctx.lineTo(sl.x + 10, sl.y + 5); ctx.stroke();
    // ! indicator
    ctx.fillStyle = '#ffcc33'; ctx.font = 'bold 12px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('!', sl.x, sl.y - 25);
  });

  // ============= CRYSTALS =============
  s.crystals.forEach((c: Crystal) => {
    ctx.fillStyle = '#00ccff';
    ctx.globalAlpha = 0.8 + Math.sin(t * 6 + c.x) * 0.2;
    // Diamond shape
    ctx.beginPath();
    ctx.moveTo(c.x, c.y - 8); ctx.lineTo(c.x + 6, c.y); ctx.lineTo(c.x, c.y + 8); ctx.lineTo(c.x - 6, c.y);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
    ctx.globalAlpha = 1;
  });

  // ============= ENEMIES =============
  s.enemies.forEach((e: Enemy) => {
    if (wId === 'galaxia') {
      drawPirate(ctx, e, t);
    } else {
      drawDemon(ctx, e, t);
    }
    // HP bar
    if (e.hp < e.maxHp) {
      ctx.fillStyle = '#1a0000'; ctx.fillRect(e.x - e.size, e.y - e.size - 12, e.size * 2, 4);
      ctx.fillStyle = '#ff0000'; ctx.fillRect(e.x - e.size, e.y - e.size - 12, e.size * 2 * (e.hp / e.maxHp), 4);
    }
  });

  // ============= BOSS =============
  if (s.boss && s.boss.hp > 0) {
    const b = s.boss;
    if (wId === 'galaxia') {
      // Black ship
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.moveTo(b.x - b.size, b.y + 10);
      ctx.lineTo(b.x + b.size, b.y + 10);
      ctx.lineTo(b.x + b.size + 20, b.y);
      ctx.lineTo(b.x + b.size, b.y - 15);
      ctx.lineTo(b.x - b.size, b.y - 15);
      ctx.lineTo(b.x - b.size - 10, b.y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 2; ctx.stroke();
      // Mast
      ctx.fillStyle = '#333';
      ctx.fillRect(b.x - 5, b.y - 50, 10, 40);
      // Flag
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(b.x + 5, b.y - 48, 25, 15);
      // Skull on flag
      ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('☠', b.x + 17, b.y - 37);
      // Cannons
      ctx.fillStyle = '#444';
      ctx.fillRect(b.x - 60, b.y + 5, 15, 6);
      ctx.fillRect(b.x + 50, b.y + 5, 15, 6);
      // Glow
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ff0000';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.size + 20, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      // Pecado
      drawDemon(ctx, b, t);
      // Fire sword
      ctx.fillStyle = '#ff4400';
      ctx.fillRect(b.x + b.facing * 15, b.y - 30, 4, 35);
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath(); ctx.moveTo(b.x + b.facing * 15, b.y - 32);
      ctx.lineTo(b.x + b.facing * 15 + 8, b.y - 40);
      ctx.lineTo(b.x + b.facing * 15 - 4, b.y - 38); ctx.fill();
    }

    // Boss beam
    if (s.bossBeamActive) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(s.bossBeamAngle);
      const beamGrad = ctx.createLinearGradient(0, 0, 500, 0);
      beamGrad.addColorStop(0, 'rgba(0,150,255,0.9)');
      beamGrad.addColorStop(0.5, 'rgba(0,200,255,0.6)');
      beamGrad.addColorStop(1, 'rgba(0,100,255,0.1)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, -12, 500, 24);
      // Core
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(0, -4, 500, 8);
      ctx.restore();
    }
  }

  // ============= PLAYER =============
  drawPlayer(ctx, s, charData, t);

  // ============= PROJECTILES =============
  s.projectiles.forEach((p: Projectile) => {
    ctx.fillStyle = p.color;
    const size = p.type === 'gamma' ? 10 : p.type === 'torpedo' ? 8 : p.type === 'ultra' ? 7 : p.type === 'super' ? 6 : 4;
    ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fill();
    if (p.type === 'gamma' || p.type === 'ultra' || p.type === 'super') {
      ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.arc(p.x, p.y, size + 5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // Trail
    ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.arc(p.x - p.vx, p.y - p.vy, size * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });

  // ============= PARTICLES =============
  s.particles.forEach((p: Particle) => {
    ctx.globalAlpha = p.life / 30;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
  });
  ctx.globalAlpha = 1;

  // ============= COMBO DISPLAY =============
  if (s.comboHits > 1) {
    ctx.fillStyle = '#ffcc33'; ctx.font = 'bold 14px Orbitron, monospace'; ctx.textAlign = 'center';
    ctx.fillText(`${s.comboHits} COMBO!`, s.playerX, s.playerY - 40);
  }

  ctx.restore();
}

function drawPirate(ctx: CanvasRenderingContext2D, e: Enemy, t: number) {
  if (e.type === 'barco_pirata') {
    // Ship
    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath();
    ctx.moveTo(e.x - e.size, e.y + 5); ctx.lineTo(e.x + e.size, e.y + 5);
    ctx.lineTo(e.x + e.size - 5, e.y + 15); ctx.lineTo(e.x - e.size + 5, e.y + 15);
    ctx.closePath(); ctx.fill();
    // Mast
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(e.x - 2, e.y - 20, 4, 25);
    ctx.fillStyle = '#fff'; ctx.fillRect(e.x + 2, e.y - 18, 15, 10);
    // Cannon
    ctx.fillStyle = '#333'; ctx.fillRect(e.x - e.size, e.y + 8, 10, 4);
    return;
  }

  // Pirate body
  const f = e.facing || 1;
  // Head (skin)
  ctx.fillStyle = '#f5c6a0';
  ctx.beginPath(); ctx.arc(e.x, e.y - e.size * 0.3, e.size * 0.45, 0, Math.PI * 2); ctx.fill();
  // Hat
  ctx.fillStyle = e.hatColor || '#3a2a1a';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y - e.size * 0.55, e.size * 0.6, e.size * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(e.x - e.size * 0.3, e.y - e.size * 0.75, e.size * 0.6, e.size * 0.25);
  // Eyes
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(e.x + f * e.size * 0.12, e.y - e.size * 0.35, 2, 0, Math.PI * 2); ctx.fill();
  // Clothes
  ctx.fillStyle = e.clothesColor || '#8B4513';
  ctx.fillRect(e.x - e.size * 0.35, e.y - e.size * 0.1, e.size * 0.7, e.size * 0.45);
  // Pants
  ctx.fillStyle = e.pantsColor || '#222';
  ctx.fillRect(e.x - e.size * 0.3, e.y + e.size * 0.35, e.size * 0.25, e.size * 0.35);
  ctx.fillRect(e.x + e.size * 0.05, e.y + e.size * 0.35, e.size * 0.25, e.size * 0.35);
  // Hands
  ctx.fillStyle = '#f5c6a0';
  ctx.beginPath(); ctx.arc(e.x - e.size * 0.5, e.y + e.size * 0.1 + Math.sin(t * 3 + e.x) * 3, e.size * 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(e.x + e.size * 0.5, e.y + e.size * 0.1 + Math.sin(t * 3 + e.x + 1) * 3, e.size * 0.15, 0, Math.PI * 2); ctx.fill();
}

function drawDemon(ctx: CanvasRenderingContext2D, e: Enemy, t: number) {
  const f = e.facing || 1;
  // Body (red skin)
  ctx.fillStyle = '#cc2200';
  ctx.beginPath(); ctx.arc(e.x, e.y - e.size * 0.3, e.size * 0.45, 0, Math.PI * 2); ctx.fill();
  // Horns
  ctx.fillStyle = '#330000';
  ctx.beginPath(); ctx.moveTo(e.x - e.size * 0.3, e.y - e.size * 0.6);
  ctx.lineTo(e.x - e.size * 0.15, e.y - e.size * 0.9); ctx.lineTo(e.x - e.size * 0.1, e.y - e.size * 0.5); ctx.fill();
  ctx.beginPath(); ctx.moveTo(e.x + e.size * 0.3, e.y - e.size * 0.6);
  ctx.lineTo(e.x + e.size * 0.15, e.y - e.size * 0.9); ctx.lineTo(e.x + e.size * 0.1, e.y - e.size * 0.5); ctx.fill();
  // Eyes
  ctx.fillStyle = '#ffff00';
  ctx.beginPath(); ctx.arc(e.x + f * e.size * 0.12, e.y - e.size * 0.35, 2.5, 0, Math.PI * 2); ctx.fill();
  // Armor (black)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(e.x - e.size * 0.35, e.y - e.size * 0.1, e.size * 0.7, e.size * 0.5);
  // Pants (black)
  ctx.fillStyle = '#111';
  ctx.fillRect(e.x - e.size * 0.3, e.y + e.size * 0.4, e.size * 0.25, e.size * 0.35);
  ctx.fillRect(e.x + e.size * 0.05, e.y + e.size * 0.4, e.size * 0.25, e.size * 0.35);
  // Tail
  ctx.strokeStyle = '#cc2200'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(e.x - f * e.size * 0.3, e.y + e.size * 0.3);
  ctx.quadraticCurveTo(e.x - f * e.size * 0.8, e.y + Math.sin(t * 3 + e.x) * 10, e.x - f * e.size * 0.6, e.y - e.size * 0.1);
  ctx.stroke();
  // Arrow tip on tail
  ctx.fillStyle = '#cc2200';
  ctx.beginPath();
  const tx = e.x - f * e.size * 0.6;
  const ty = e.y - e.size * 0.1;
  ctx.moveTo(tx, ty - 5); ctx.lineTo(tx + f * -8, ty); ctx.lineTo(tx, ty + 5); ctx.fill();
}

function drawPlayer(ctx: CanvasRenderingContext2D, s: any, charData: any, t: number) {
  const px = s.playerX;
  const py = s.playerY;
  const f = s.facing;

  // Head
  ctx.fillStyle = charData.skinColor;
  ctx.beginPath(); ctx.arc(px, py - 12, 12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#00000040'; ctx.lineWidth = 1; ctx.stroke();

  // Hair
  ctx.fillStyle = charData.hairColor;
  ctx.save(); ctx.translate(px, py - 16); ctx.scale(1, 0.6);
  ctx.beginPath(); ctx.arc(0, 0, 12, Math.PI, 0); ctx.fill();
  ctx.restore();

  // Eyes
  ctx.fillStyle = charData.eyes;
  ctx.beginPath(); ctx.arc(px + f * 3, py - 14, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(px + f * 8, py - 14, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(px + f * 3 + f, py - 14, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(px + f * 8 + f, py - 14, 1, 0, Math.PI * 2); ctx.fill();

  // Clothes (torso)
  ctx.fillStyle = charData.color;
  ctx.fillRect(px - 9, py - 2, 18, 16);

  // Pants
  ctx.fillStyle = charData.pantsColor;
  ctx.fillRect(px - 8, py + 14, 7, 10);
  ctx.fillRect(px + 1, py + 14, 7, 10);

  // Hands
  const handBob = Math.sin(t * 8) * 3;
  ctx.fillStyle = charData.handsColor;
  ctx.beginPath(); ctx.arc(px - 14, py + 4 + handBob, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(px + 14, py + 4 - handBob, 5, 0, Math.PI * 2); ctx.fill();

  // Weapon in hand
  if (s.weapon) {
    ctx.fillStyle = s.weapon.type.includes('fuego') ? '#ff4400' : s.weapon.type === 'hacha_huesos' ? '#ddd' : '#888';
    ctx.save();
    ctx.translate(px + f * 14, py + 4);
    ctx.rotate(f > 0 ? -0.3 : 0.3);
    ctx.fillRect(-2, -18, 4, 20);
    ctx.restore();
  }

  // Attack flash
  if (s.attackTimer > 8) {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(px + f * 25, py, 15, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export default AdventurePlay;
