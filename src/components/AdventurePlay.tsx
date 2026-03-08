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
  hatColor?: string; clothesColor?: string; pantsColor?: string; skinColor?: string;
  burnTimer?: number; facing: number;
  attackCooldown: number; isAttacking: boolean;
  animTimer: number; handPhase: number;
}

interface Projectile {
  x: number; y: number; vx: number; vy: number; life: number;
  color: string; isPlayer: boolean; damage: number; type?: string;
}

interface Asteroid { x: number; y: number; hp: number; size: number; }
interface Crystal { x: number; y: number; value: number; life: number; }
interface Parrot { x: number; y: number; vx: number; alive: boolean; }
interface BlackHole { x: number; y: number; radius: number; strength: number; }
interface Portal { x1: number; y1: number; x2: number; y2: number; color: string; }
interface Slave { x: number; y: number; freed: boolean; reward: number; hasQuest: boolean; }
interface DarkTower { x: number; y: number; hp: number; width: number; height: number; }
interface Chest { x: number; y: number; opened: boolean; isTrap: boolean; hasKey: boolean; }
interface LavaPool { x: number; y: number; width: number; }
interface Platform { x: number; y: number; w: number; h: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; }

// ============= CONSTANTS =============
const WORLD_WIDTH = 16000;
const SCREEN_W = 640;
const SCREEN_H = 480;
const FLOOR = 400;
const GRAVITY = 0.5;
const ENERGY_MAX = 300;
const ENERGY_REGEN = 0.4;

const AdventurePlay: React.FC = () => {
  const { engine, setGameState } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldId = useRef((engine as any).adventureWorld || 'galaxia');
  const charIdx = useRef((engine as any).adventureCharIdx ?? 0);
  const [gameOver, setGameOver] = useState(false);
  const [crystalNotif, setCrystalNotif] = useState<{ value: number; time: number } | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  // LIVE HUD state - updated every frame
  const [hudHp, setHudHp] = useState(100);
  const [hudMaxHp, setHudMaxHp] = useState(100);
  const [hudEnergy, setHudEnergy] = useState(0);
  const [hudWeapon, setHudWeapon] = useState<string | null>(null);
  const [hudWeaponAmmo, setHudWeaponAmmo] = useState(0);
  const [hudBossHp, setHudBossHp] = useState(0);
  const [hudBossMaxHp, setHudBossMaxHp] = useState(0);
  const [hudBossName, setHudBossName] = useState('');
  const stateRef = useRef<any>(null);
  const keysRef = useRef<Record<string, boolean>>({});

  const getCharData = useCallback(() => {
    const idx = charIdx.current;
    if (idx >= 100) {
      try {
        const customs = JSON.parse(localStorage.getItem('customChars') || '[]');
        const c = customs[idx - 100];
        if (c) return { name: c.name, skinColor: c.skinColor || '#f5deb3', clothesColor: c.clothesColor || '#ff00ff', eyes: c.eyesColor || '#fff', pantsColor: c.pantsColor || '#333', handsColor: c.handsColor || '#f5deb3', hairColor: c.hairColor || '#333', shoesColor: c.shoesColor || '#222', isCustom: true };
      } catch {}
    }
    const base = CHAR_DATA[Math.min(idx, CHAR_DATA.length - 1)];
    if (idx === 0) return { name: base.name, skinColor: '#f5deb3', clothesColor: '#b00000', eyes: '#00ffff', pantsColor: '#000', handsColor: '#d4af37', hairColor: '#5a3a1a', shoesColor: '#222', isCustom: false };
    return { name: base.name, skinColor: '#f5d1ad', clothesColor: '#ffffff', eyes: '#ffff00', pantsColor: '#000', handsColor: '#f5d1ad', hairColor: '#ffffff', shoesColor: '#222', isCustom: false };
  }, []);

  // Fade in on mount
  useEffect(() => { setTimeout(() => setFadeIn(false), 500); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const wId = worldId.current;
    const cData = getCharData();

    // ============= INIT STATE =============
    const s: any = {
      playerX: 100, playerY: FLOOR - 20, playerVx: 0, playerVy: 0,
      playerHp: 100, playerMaxHp: 100, playerEnergy: 0,
      cameraX: 0, isFlying: wId === 'galaxia', isGrounded: true,
      facing: 1, attackTimer: 0, specialCooldown: 0,
      weapon: null as Weapon | null,
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
      boss: null as Enemy | null,
      bossBeamActive: false, bossBeamTimer: 0, bossBeamAngle: 0,
      kills: 0, totalCrystals: 0,
      stars: [] as { x: number; y: number; s: number; speed: number }[],
      pickupPrompt: null as { x: number; y: number } | null,
      comboHits: 0, comboTimer: 0,
      playerAnimTimer: 0, playerHandPhase: 0,
    };
    stateRef.current = s;

    // Stars
    if (wId === 'galaxia') {
      for (let i = 0; i < 300; i++) {
        s.stars.push({ x: Math.random() * WORLD_WIDTH, y: Math.random() * SCREEN_H, s: Math.random() * 2 + 0.5, speed: 0.1 + Math.random() * 0.4 });
      }
    }

    // Platforms
    if (wId === 'galaxia') {
      for (let i = 0; i < 80; i++) {
        s.platforms.push({ x: 200 + i * 190 + Math.random() * 60, y: 100 + Math.random() * 260, w: 50 + Math.random() * 90, h: 8 });
      }
    } else {
      for (let i = 0; i < 60; i++) {
        const baseX = 200 + i * 250 + Math.random() * 50;
        const towerH = 80 + Math.random() * 180;
        s.platforms.push({ x: baseX, y: FLOOR - towerH, w: 50 + Math.random() * 50, h: 10 });
        if (Math.random() > 0.5) s.platforms.push({ x: baseX + 15, y: FLOOR - towerH - 60, w: 40, h: 10 });
      }
    }

    // Weapons
    const wTypes = wId === 'galaxia'
      ? ['pistola', 'sable', 'canon_gamma'] as const
      : ['espada_fuego', 'rafaga_fuego', 'hacha_huesos'] as const;
    for (let i = 0; i < 18; i++) {
      const t = wTypes[Math.floor(Math.random() * wTypes.length)];
      s.weapons.push({
        x: 300 + i * 850 + Math.random() * 200, y: FLOOR - 20,
        type: t, ammo: t === 'pistola' ? 16 : t === 'canon_gamma' ? 2 : t === 'rafaga_fuego' ? 5 : 999,
        maxAmmo: t === 'pistola' ? 16 : t === 'canon_gamma' ? 2 : t === 'rafaga_fuego' ? 5 : 999, picked: false,
      });
    }

    // Enemies
    if (wId === 'galaxia') {
      const hatColors = ['#3a2a1a', '#222', '#1a1a1a'];
      const clothesColors = ['#8B4513', '#fff', '#333'];
      const pantsColors = ['#222', '#5a3a1a'];
      for (let i = 0; i < 50; i++) {
        const isTank = Math.random() > 0.8;
        const isFast = !isTank && Math.random() > 0.7;
        s.enemies.push(makeEnemy(500 + i * 300 + Math.random() * 100, 80 + Math.random() * 270,
          isTank ? 40 : 12, isTank ? 'pirata_tanque' : isFast ? 'pirata_rapido' : 'pirata',
          isTank ? 25 : 18, true, isFast ? 3 : isTank ? 0.8 : 1.5,
          { hatColor: hatColors[i % 3], clothesColor: clothesColors[i % 3], pantsColor: pantsColors[i % 2], skinColor: '#f5c6a0' }
        ));
      }
      for (let i = 0; i < 12; i++) {
        s.enemies.push(makeEnemy(800 + i * 1200, 70 + Math.random() * 80, 30, 'barco_pirata', 40, true, 1, {}));
      }
      for (let i = 0; i < 30; i++) {
        s.asteroids.push({ x: 500 + i * 500 + Math.random() * 150, y: 50 + Math.random() * 300, hp: 4, size: 18 + Math.random() * 18 });
      }
      for (let i = 0; i < 15; i++) {
        s.parrots.push({ x: 400 + i * 1000, y: 40 + Math.random() * 120, vx: 2 + Math.random() * 2.5, alive: true });
      }
      for (let i = 0; i < 6; i++) {
        s.blackHoles.push({ x: 1500 + i * 2500, y: 120 + Math.random() * 200, radius: 55, strength: 2 });
      }
      for (let i = 0; i < 5; i++) {
        s.portals.push({ x1: 800 + i * 3000, y1: 150 + Math.random() * 150, x2: 1500 + i * 2800 + Math.random() * 500, y2: 80 + Math.random() * 200, color: ['#ff00ff', '#00ffff', '#ffff00', '#00ff66', '#ff8800'][i] });
      }
      for (let i = 0; i < 8; i++) {
        s.slaves.push({ x: 700 + i * 1800, y: FLOOR - 20, freed: false, reward: 3 + Math.floor(Math.random() * 5), hasQuest: Math.random() > 0.5 });
      }
      s.boss = makeEnemy(WORLD_WIDTH - 400, 150, 200, 'barco_negro', 80, true, 1, {});
    } else {
      for (let i = 0; i < 60; i++) {
        const sz = 0.7 + Math.random() * 0.8;
        s.enemies.push(makeEnemy(400 + i * 250 + Math.random() * 80, FLOOR - 20, 15 * sz, 'demonio', 18 * sz, false, Math.random() > 0.7 ? 3.5 : 1.5, { skinColor: '#cc2200' }));
      }
      for (let i = 0; i < 20; i++) {
        s.lavaPools.push({ x: 400 + i * 750 + Math.random() * 200, y: FLOOR + 5, width: 70 + Math.random() * 70 });
      }
      for (let i = 0; i < 18; i++) {
        s.darkTowers.push({ x: 500 + i * 850 + Math.random() * 100, y: FLOOR - 60, hp: 4, width: 30, height: 60 });
      }
      for (let i = 0; i < 12; i++) {
        s.chests.push({ x: 700 + i * 1200, y: FLOOR - 15, opened: false, isTrap: Math.random() > 0.5, hasKey: false });
      }
      const keyIdx = Math.floor(Math.random() * s.chests.length);
      s.chests[keyIdx].isTrap = false;
      s.chests[keyIdx].hasKey = true;
      s.boss = makeEnemy(WORLD_WIDTH - 300, FLOOR - 30, 150, 'pecado', 30, false, 2, { skinColor: '#cc2200' });
    }

    // Key handlers
    const onKD = (e: KeyboardEvent) => { keysRef.current[e.code] = true; };
    const onKU = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);

    let animId = 0;
    const loop = () => {
      const keys = keysRef.current;
      if (!gameOverRef.current) {
        updateGame(s, keys, wId, engine, setGameOverWrapped, setCrystalNotif, setHasKey);
      }
      drawGame(s, ctx, wId, cData);
      // UPDATE REACT HUD STATE EVERY FRAME
      setHudHp(s.playerHp);
      setHudMaxHp(s.playerMaxHp);
      setHudEnergy(s.playerEnergy);
      setHudWeapon(s.weapon ? s.weapon.type : null);
      setHudWeaponAmmo(s.weapon ? s.weapon.ammo : 0);
      if (s.boss && s.boss.hp > 0) {
        setHudBossHp(s.boss.hp);
        setHudBossMaxHp(s.boss.maxHp);
        setHudBossName(s.boss.type === 'barco_negro' ? 'BARCO NEGRO GIGANTE' : 'PECADO');
      } else {
        setHudBossHp(0);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
    };
  }, [engine, getCharData]);

  // Use ref to prevent stale closure in game loop
  const gameOverRef = useRef(false);
  const setGameOverWrapped = (v: boolean) => { gameOverRef.current = v; setGameOver(v); };

  const handleRestart = () => {
    setGameOver(false);
    gameOverRef.current = false;
    setFadeIn(true);
    setGameState('ADVENTURE_CHAR_SELECT' as any);
    setTimeout(() => {
      (engine as any).adventureWorld = worldId.current;
      (engine as any).adventureCharIdx = charIdx.current;
      setGameState('ADVENTURE_PLAY' as any);
    }, 100);
  };

  const handleExit = () => {
    setFadeIn(true);
    setTimeout(() => setGameState('MENU'), 400);
  };

  const hpPercent = Math.max(0, (hudHp / hudMaxHp) * 100);
  const energyPercent = Math.max(0, (hudEnergy / ENERGY_MAX) * 100);

  return (
    <div className="fixed inset-0 z-50" style={{ background: '#000' }}>
      {/* Fade transition overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100, background: '#000',
        opacity: fadeIn ? 1 : 0, transition: 'opacity 0.5s ease-out',
        pointerEvents: 'none',
      }} />

      <canvas ref={canvasRef} width={1280} height={960} style={{ width: '100vw', height: '100vh', imageRendering: 'pixelated' }} />

      {/* LIVE HUD - uses React state updated every frame */}
      <div style={{ position: 'fixed', top: 15, left: 15, zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ color: '#ffcc33', fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 2, marginBottom: 6 }}>
          {worldId.current.toUpperCase()} | 🔷 {engine.coins}
        </div>
        {/* HP Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ color: '#ff4d4d', fontFamily: "'Orbitron', monospace", fontSize: 10, width: 20 }}>HP</span>
          <div style={{ width: 220, height: 14, background: '#1a0000', border: '1px solid #ff4d4d40', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: hpPercent > 50 ? 'linear-gradient(90deg, #cc0000, #ff4d4d)' : hpPercent > 25 ? 'linear-gradient(90deg, #cc6600, #ff8800)' : 'linear-gradient(90deg, #880000, #ff0000)',
              width: `${hpPercent}%`,
              boxShadow: `0 0 10px ${hpPercent > 25 ? '#ff000060' : '#ff000090'}`,
            }} />
            <span style={{ position: 'absolute', top: 0, left: 5, fontSize: 9, color: '#fff', fontFamily: "'Orbitron', monospace", lineHeight: '14px' }}>
              {Math.ceil(hudHp)}/{hudMaxHp}
            </span>
          </div>
        </div>
        {/* Energy Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 10, width: 20 }}>EN</span>
          <div style={{ width: 220, height: 10, background: '#001a1a', border: '1px solid #00ffff30', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: energyPercent >= 100 ? 'linear-gradient(90deg, #0088ff, #00ffff)' : 'linear-gradient(90deg, #004488, #0088cc)',
              width: `${energyPercent}%`,
              boxShadow: energyPercent >= 33 ? '0 0 8px #00ffff40' : 'none',
            }} />
            {/* Energy thresholds */}
            <div style={{ position: 'absolute', left: `${(49.5/300)*100}%`, top: 0, width: 1, height: '100%', background: '#ffffff40' }} />
            <div style={{ position: 'absolute', left: `${(100/300)*100}%`, top: 0, width: 1, height: '100%', background: '#ffffff40' }} />
          </div>
        </div>
        {hudWeapon && (
          <div style={{ color: '#ffcc66', fontFamily: "'Orbitron', monospace", fontSize: 10, marginTop: 3 }}>
            🗡️ {hudWeapon.toUpperCase().replace('_', ' ')} {hudWeaponAmmo < 999 ? `(${hudWeaponAmmo})` : ''}
          </div>
        )}
      </div>

      {/* Boss HP Bar */}
      {hudBossHp > 0 && (
        <div style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 10, textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ color: '#ff4444', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 3, marginBottom: 5, textShadow: '0 0 10px #ff0000' }}>
            {hudBossName}
          </div>
          <div style={{ width: 420, height: 16, background: '#1a0000', border: '2px solid #ff000080', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: 'linear-gradient(90deg, #660000, #ff0000, #ff4444)',
              width: `${(hudBossHp / hudBossMaxHp) * 100}%`,
              boxShadow: '0 0 15px #ff000060',
            }} />
            <span style={{ position: 'absolute', top: 0, right: 5, fontSize: 9, color: '#fff', fontFamily: "'Orbitron', monospace", lineHeight: '16px' }}>
              {Math.ceil(hudBossHp)}/{hudBossMaxHp}
            </span>
          </div>
        </div>
      )}

      {/* Crystal notification */}
      {crystalNotif && Date.now() - crystalNotif.time < 2000 && (
        <div style={{
          position: 'fixed', top: 80, right: 30, zIndex: 10,
          color: '#00ff66', fontFamily: "'Orbitron', monospace", fontSize: 20, fontWeight: 900,
          textShadow: '0 0 15px #00ff66', animation: 'slideUp 0.4s ease-out',
        }}>
          +{crystalNotif.value} 🔷
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        <div className="fixed inset-0 z-20 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0)', animation: 'fadeInBg 0.8s ease-out forwards' }}>
          <div style={{ textAlign: 'center', animation: 'scaleUp 0.5s ease-out' }}>
            <h2 style={{
              color: '#ff0000', fontFamily: "'Orbitron', monospace", fontSize: 52,
              letterSpacing: 8, textShadow: '0 0 30px #ff0000, 0 0 60px #880000', marginBottom: 30,
            }}>GAME OVER</h2>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
              <button onClick={handleRestart} style={{
                padding: '14px 40px', border: '2px solid #00ffff', color: '#00ffff',
                background: 'rgba(0,40,60,0.8)', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 15, letterSpacing: 3,
                boxShadow: '0 0 20px #00ffff30', transition: 'all 0.3s',
              }}>REINICIAR</button>
              <button onClick={handleExit} style={{
                padding: '14px 40px', border: '2px solid #ff4d4d', color: '#ff4d4d',
                background: 'rgba(60,0,0,0.8)', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 15, letterSpacing: 3,
                boxShadow: '0 0 20px #ff4d4d30', transition: 'all 0.3s',
              }}>MENÚ PRINCIPAL</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeInBg { from { background: rgba(0,0,0,0); } to { background: rgba(0,0,0,0.9); } }
        @keyframes scaleUp { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

// ============= HELPERS =============
function makeEnemy(x: number, y: number, hp: number, type: string, size: number, isFlying: boolean, speed: number, extra: any): Enemy {
  return {
    x, y, hp, maxHp: hp, type, vx: 0, vy: 0, size, isFlying,
    shootTimer: 50 + Math.random() * 60, speed, facing: -1,
    attackCooldown: 0, isAttacking: false,
    animTimer: Math.random() * 100, handPhase: Math.random() * Math.PI * 2,
    ...extra,
  };
}

function spawnP(x: number, y: number, color: string, count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 2,
    life: 25 + Math.random() * 15, color,
  }));
}

function addCrystals(s: any, val: number, x: number, y: number, engine: any, notif: any) {
  s.totalCrystals += val;
  engine.updatePrisms(val);
  notif({ value: val, time: Date.now() });
}

// ============= UPDATE =============
function updateGame(s: any, keys: Record<string, boolean>, wId: string, engine: any,
  setGO: (v: boolean) => void, notif: any, setKey: any) {

  if (s.playerHp <= 0) return;
  const speed = 5;
  s.playerAnimTimer++;
  s.playerHandPhase += 0.15;

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
  if (s.playerEnergy < ENERGY_MAX) s.playerEnergy = Math.min(ENERGY_MAX, s.playerEnergy + ENERGY_REGEN);

  // Attack
  if (s.attackTimer > 0) s.attackTimer--;
  if (keys['KeyF'] && s.attackTimer <= 0) {
    s.attackTimer = 12;
    const range = s.weapon ? 60 : 45;
    const dmg = s.weapon?.type === 'hacha_huesos' ? 6 : s.weapon?.type === 'sable' || s.weapon?.type === 'espada_fuego' ? 4 : 3;

    const targets = [...s.enemies];
    if (s.boss && s.boss.hp > 0) targets.push(s.boss);
    targets.forEach((e: Enemy) => {
      if (e.hp <= 0) return;
      const dist = Math.hypot(e.x - s.playerX, e.y - s.playerY);
      if (dist < range && Math.sign(e.x - s.playerX) === s.facing) {
        e.hp -= dmg; e.vx = s.facing * 5;
        if (s.weapon?.type === 'espada_fuego') e.burnTimer = 180;
        s.comboHits++; s.comboTimer = 60;
        s.particles.push(...spawnP(e.x, e.y, '#ffaa00', 5));
        playHitSound();
      }
    });

    s.asteroids.forEach((a: Asteroid) => {
      if (Math.hypot(a.x - s.playerX, a.y - s.playerY) < range) {
        a.hp--; s.particles.push(...spawnP(a.x, a.y, '#888', 3));
      }
    });

    s.darkTowers.forEach((t: DarkTower) => {
      if (t.hp <= 0) return;
      if (s.playerX > t.x - 30 && s.playerX < t.x + t.width + 30 && Math.abs(s.playerY - t.y) < t.height) {
        t.hp--; s.particles.push(...spawnP(t.x + t.width / 2, t.y, '#555', 4));
      }
    });

    if (s.weapon?.type === 'pistola') {
      s.projectiles.push({ x: s.playerX + s.facing * 20, y: s.playerY - 5, vx: s.facing * 12, vy: 0, life: 40, color: '#ffff00', isPlayer: true, damage: 5, type: 'bullet' });
      s.weapon.ammo--;
      if (s.weapon.ammo <= 0) s.weapon = null;
    }
  }

  // Ranged weapons
  if (keys['KeyG'] && s.weapon?.type === 'canon_gamma' && s.weapon.ammo > 0 && s.attackTimer <= 0) {
    s.projectiles.push({ x: s.playerX + s.facing * 25, y: s.playerY, vx: s.facing * 8, vy: 0, life: 80, color: '#4488ff', isPlayer: true, damage: 25, type: 'gamma' });
    s.weapon.ammo--; if (s.weapon.ammo <= 0) s.weapon = null;
    s.attackTimer = 20; playSuperSound();
  }
  if (keys['KeyG'] && s.weapon?.type === 'rafaga_fuego' && s.weapon.ammo > 0 && s.attackTimer <= 0) {
    s.projectiles.push({ x: s.playerX + s.facing * 20, y: s.playerY, vx: s.facing * 7, vy: 0, life: 60, color: '#ff4400', isPlayer: true, damage: 8, type: 'fireball' });
    s.weapon.ammo--; if (s.weapon.ammo <= 0) s.weapon = null;
    s.attackTimer = 15;
  }

  // Special/Super/Ultra (no weapon)
  if (keys['KeyG'] && !s.weapon && s.playerEnergy >= 49.5 && s.specialCooldown <= 0) {
    s.playerEnergy -= 49.5; s.specialCooldown = 30;
    s.projectiles.push({ x: s.playerX + s.facing * 25, y: s.playerY, vx: s.facing * 10, vy: 0, life: 50, color: '#00ffff', isPlayer: true, damage: 10, type: 'special' });
    playSpecialSound();
  }
  if (keys['KeyH'] && s.playerEnergy >= 100 && s.specialCooldown <= 0) {
    s.playerEnergy -= 100; s.specialCooldown = 45;
    for (let i = -2; i <= 2; i++) s.projectiles.push({ x: s.playerX, y: s.playerY, vx: s.facing * 8, vy: i * 2, life: 60, color: '#ffcc33', isPlayer: true, damage: 15, type: 'super' });
    playSuperSound();
  }
  if (keys['KeyE'] && s.playerEnergy >= 300 && s.specialCooldown <= 0) {
    s.playerEnergy -= 300; s.specialCooldown = 60;
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 / 12) * i;
      s.projectiles.push({ x: s.playerX, y: s.playerY, vx: Math.cos(a) * 8, vy: Math.sin(a) * 8, life: 80, color: '#ff00ff', isPlayer: true, damage: 20, type: 'ultra' });
    }
    playSuperSound();
  }

  if (s.specialCooldown > 0) s.specialCooldown--;
  if (s.comboTimer > 0) s.comboTimer--; else s.comboHits = 0;

  // Position
  s.playerX += s.playerVx;
  s.playerY += s.playerVy;

  if (!s.isFlying && s.playerY >= FLOOR - 20) { s.playerY = FLOOR - 20; s.playerVy = 0; s.isGrounded = true; }
  if (!s.isFlying) {
    s.platforms.forEach((p: Platform) => {
      if (s.playerX > p.x - 10 && s.playerX < p.x + p.w + 10 && s.playerY + 20 >= p.y && s.playerY + 20 <= p.y + 12 && s.playerVy > 0) {
        s.playerY = p.y - 20; s.playerVy = 0; s.isGrounded = true;
      }
    });
  }

  s.playerX = Math.max(20, Math.min(WORLD_WIDTH - 20, s.playerX));
  if (!s.isFlying) s.playerY = Math.min(FLOOR - 20, s.playerY);
  else s.playerY = Math.max(20, Math.min(FLOOR - 20, s.playerY));
  s.cameraX = Math.max(0, Math.min(WORLD_WIDTH - 640, s.playerX - 320));

  // Weapon pickup
  s.pickupPrompt = null;
  s.weapons.forEach((w: Weapon) => {
    if (!w.picked && Math.hypot(w.x - s.playerX, w.y - s.playerY) < 40) {
      s.pickupPrompt = { x: w.x, y: w.y - 30 };
      if (keys['KeyR']) { w.picked = true; s.weapon = { ...w }; }
    }
  });

  // Lava damage
  s.lavaPools.forEach((lp: LavaPool) => {
    if (s.playerX > lp.x && s.playerX < lp.x + lp.width && s.playerY >= FLOOR - 25) {
      s.playerHp -= 0.5;
      if (Math.random() > 0.7) s.particles.push(...spawnP(s.playerX, s.playerY, '#ff4400', 1));
    }
  });

  // Black holes
  s.blackHoles.forEach((bh: BlackHole) => {
    const dx = bh.x - s.playerX, dy = bh.y - s.playerY, dist = Math.hypot(dx, dy);
    if (dist < 200) { const f = bh.strength * (1 - dist / 200); s.playerVx += (dx / dist) * f; s.playerVy += (dy / dist) * f; }
    if (dist < 25) s.playerHp -= 1;
  });

  // Portals
  s.portals.forEach((p: Portal) => {
    if (Math.hypot(p.x1 - s.playerX, p.y1 - s.playerY) < 25) { s.playerX = p.x2; s.playerY = p.y2; }
    else if (Math.hypot(p.x2 - s.playerX, p.y2 - s.playerY) < 25) { s.playerX = p.x1; s.playerY = p.y1; }
  });

  // Asteroids
  s.asteroids = s.asteroids.filter((a: Asteroid) => {
    if (a.hp <= 0) { s.crystals.push({ x: a.x, y: a.y, value: 1, life: 300 }); s.particles.push(...spawnP(a.x, a.y, '#888', 10)); return false; }
    return true;
  });

  // Dark towers
  s.darkTowers = s.darkTowers.filter((t: DarkTower) => {
    if (t.hp <= 0) {
      s.crystals.push({ x: t.x, y: t.y - 10, value: 2, life: 300 }, { x: t.x + 20, y: t.y - 10, value: 2, life: 300 });
      s.particles.push(...spawnP(t.x + t.width / 2, t.y, '#555', 15));
      return false;
    }
    return true;
  });

  // Chests
  s.chests.forEach((ch: Chest) => {
    if (!ch.opened && Math.hypot(ch.x - s.playerX, ch.y - s.playerY) < 30 && keys['KeyR']) {
      ch.opened = true;
      if (ch.isTrap) { s.playerHp -= 20; s.particles.push(...spawnP(ch.x, ch.y, '#ff0000', 20)); }
      else if (ch.hasKey) { setKey(true); notif({ value: 0, time: Date.now() }); }
      else { s.crystals.push({ x: ch.x, y: ch.y - 10, value: 3, life: 300 }); }
    }
  });

  // Parrots
  s.parrots.forEach((p: Parrot) => {
    if (!p.alive) return;
    p.x += p.vx;
    if (p.x > WORLD_WIDTH + 50) { p.alive = false; return; }
    if (Math.hypot(p.x - s.playerX, p.y - s.playerY) < 20 && keys['KeyF']) {
      p.alive = false;
      addCrystals(s, 3, p.x, p.y, engine, notif);
    }
  });

  // Slaves
  s.slaves.forEach((sl: Slave) => {
    if (!sl.freed && Math.hypot(sl.x - s.playerX, sl.y - s.playerY) < 40) {
      const near = s.enemies.filter((e: Enemy) => Math.hypot(e.x - sl.x, e.y - sl.y) < 150 && e.hp > 0);
      if (near.length === 0) { sl.freed = true; addCrystals(s, sl.reward, sl.x, sl.y, engine, notif); }
    }
  });

  // Crystals
  s.crystals = s.crystals.filter((c: Crystal) => {
    c.life--;
    if (Math.hypot(c.x - s.playerX, c.y - s.playerY) < 30) {
      addCrystals(s, c.value, c.x, c.y, engine, notif);
      return false;
    }
    return c.life > 0;
  });

  // Enemies
  s.enemies = s.enemies.filter((e: Enemy) => {
    if (e.hp <= 0) {
      s.kills++;
      s.particles.push(...spawnP(e.x, e.y, e.type.includes('demonio') ? '#ff0000' : '#ffaa00', 12));
      if (Math.random() > 0.7) s.crystals.push({ x: e.x, y: e.y, value: 1, life: 300 });
      return false;
    }
    if (e.burnTimer && e.burnTimer > 0) { e.burnTimer--; if (e.burnTimer % 20 === 0) { e.hp -= 1; s.particles.push(...spawnP(e.x, e.y, '#ff4400', 2)); } }
    e.animTimer++; e.handPhase += 0.12;

    const dx = s.playerX - e.x, dist = Math.hypot(dx, s.playerY - e.y);
    e.facing = Math.sign(dx) || 1;
    if (dist < 500) { e.vx = Math.sign(dx) * e.speed; if (e.isFlying) e.vy = Math.sign(s.playerY - e.y) * e.speed * 0.5; }
    else e.vx *= 0.95;
    e.x += e.vx;
    if (!e.isFlying) { e.vy = (e.vy || 0) + GRAVITY; e.y += e.vy; if (e.y >= FLOOR - e.size) { e.y = FLOOR - e.size; e.vy = 0; } }
    else { e.y += (e.vy || 0); e.y = Math.max(30, Math.min(FLOOR - e.size, e.y)); }
    if (dist < e.size + 15) s.playerHp -= 0.4;
    if (e.type === 'barco_pirata') {
      e.shootTimer--;
      if (e.shootTimer <= 0) {
        e.shootTimer = 80;
        const a = Math.atan2(s.playerY - e.y, s.playerX - e.x);
        s.projectiles.push({ x: e.x, y: e.y, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, life: 200, color: '#ff8800', isPlayer: false, damage: 8, type: 'torpedo' });
      }
    }
    return true;
  });

  // Boss
  if (s.boss && s.boss.hp > 0) {
    const b = s.boss;
    const dx = s.playerX - b.x, dy = s.playerY - b.y;
    b.animTimer++; b.handPhase += 0.1;
    if (wId === 'galaxia') {
      b.vx = Math.sign(dx) * 0.5; b.x += b.vx;
      b.y += Math.sin(Date.now() * 0.002) * 0.5;
      b.shootTimer--;
      if (b.shootTimer <= 0) {
        b.shootTimer = 90;
        for (let i = 0; i < 3; i++) {
          s.projectiles.push({ x: b.x, y: b.y + 20, vx: Math.sign(dx) * 3, vy: (i - 1) * 1.5, life: 200, color: '#ff0000', isPlayer: false, damage: 12, type: 'torpedo' });
        }
      }
      if (!s.bossBeamActive && b.shootTimer === 45) { s.bossBeamActive = true; s.bossBeamTimer = 600; s.bossBeamAngle = Math.atan2(dy, dx); }
    } else {
      b.vx = Math.sign(dx) * b.speed; b.x += b.vx;
      b.vy = (b.vy || 0) + GRAVITY; b.y += b.vy;
      if (b.y >= FLOOR - b.size) { b.y = FLOOR - b.size; b.vy = 0; }
      if (Math.hypot(dx, dy) < 50) s.playerHp -= 0.6;
      b.shootTimer--;
      if (b.shootTimer <= 0) {
        b.shootTimer = 120;
        for (let i = 0; i < 3; i++) {
          s.projectiles.push({ x: b.x, y: b.y, vx: Math.sign(dx) * 4, vy: (i - 1) * 2, life: 300, color: '#ff4400', isPlayer: false, damage: 10, type: 'torpedo' });
        }
      }
    }
    if (b.hp <= 0) {
      const reward = wId === 'galaxia' ? 30 : 20;
      addCrystals(s, reward, b.x, b.y, engine, notif);
      s.particles.push(...spawnP(b.x, b.y, '#ffff00', 30));
    }
  }

  // Boss beam
  if (s.bossBeamActive && s.boss && s.boss.hp > 0) {
    s.bossBeamTimer--;
    const ta = Math.atan2(s.playerY - s.boss.y, s.playerX - s.boss.x);
    s.bossBeamAngle += (ta - s.bossBeamAngle) * 0.02;
    const bl = 500;
    const bx = Math.cos(s.bossBeamAngle) * bl, by = Math.sin(s.bossBeamAngle) * bl;
    const px = s.playerX - s.boss.x, py = s.playerY - s.boss.y;
    const t = Math.max(0, Math.min(1, (px * bx + py * by) / (bx * bx + by * by)));
    if (Math.hypot(s.playerX - (s.boss.x + t * bx), s.playerY - (s.boss.y + t * by)) < 20) s.playerHp -= 0.8;
    if (s.bossBeamTimer <= 0) s.bossBeamActive = false;
  }

  // Projectiles
  s.projectiles = s.projectiles.filter((p: Projectile) => {
    if (p.type === 'torpedo') {
      const dx = s.playerX - p.x, dy = s.playerY - p.y, d = Math.hypot(dx, dy);
      if (d > 5) { p.vx += (dx / d) * 0.15; p.vy += (dy / d) * 0.15; const sp = Math.hypot(p.vx, p.vy); if (sp > 5) { p.vx = (p.vx / sp) * 5; p.vy = (p.vy / sp) * 5; } }
    }
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.isPlayer) {
      const targets = [...s.enemies]; if (s.boss && s.boss.hp > 0) targets.push(s.boss);
      targets.forEach((e: Enemy) => { if (e.hp <= 0) return; if (Math.hypot(p.x - e.x, p.y - e.y) < e.size + 8) { e.hp -= p.damage; p.life = 0; s.particles.push(...spawnP(e.x, e.y, p.color, 5)); } });
    } else {
      if (Math.hypot(p.x - s.playerX, p.y - s.playerY) < 18) { s.playerHp -= p.damage; p.life = 0; s.particles.push(...spawnP(s.playerX, s.playerY, '#ff0000', 5)); }
    }
    return p.life > 0;
  });

  // Particles
  s.particles = s.particles.filter((p: Particle) => { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life--; return p.life > 0; });

  // Stars
  if (wId === 'galaxia') s.stars.forEach((st: any) => { st.x -= st.speed; if (st.x < -10) st.x = WORLD_WIDTH + 10; });

  // Death
  if (s.playerHp <= 0) { s.playerHp = 0; setGO(true); }
}

// ============= DRAW =============
function drawGame(s: any, ctx: CanvasRenderingContext2D, wId: string, cData: any) {
  ctx.save();
  ctx.scale(2, 2);
  const t = Date.now() * 0.001;

  // Background
  if (wId === 'galaxia') {
    const bg = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
    bg.addColorStop(0, '#020015'); bg.addColorStop(0.4, '#0a0a30'); bg.addColorStop(1, '#050520');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    // Nebula clouds
    for (let i = 0; i < 5; i++) {
      const nx = (150 + i * 200 - s.cameraX * 0.05) % (SCREEN_W + 200) - 50;
      const ny = 80 + i * 60;
      const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, 100);
      const cols = ['rgba(100,0,200,0.06)', 'rgba(0,100,200,0.04)', 'rgba(200,0,100,0.04)', 'rgba(0,200,150,0.03)', 'rgba(100,50,200,0.05)'];
      ng.addColorStop(0, cols[i]); ng.addColorStop(1, 'transparent');
      ctx.fillStyle = ng; ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
    // Stars
    s.stars.forEach((star: any) => {
      const sx = star.x - s.cameraX * 0.3;
      if (sx < -5 || sx > SCREEN_W + 5) return;
      ctx.globalAlpha = 0.3 + Math.sin(t * 3 + star.x * 0.05) * 0.4;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(sx, star.y, star.s, 0, Math.PI * 2); ctx.fill();
      if (star.s > 1.3) { ctx.globalAlpha *= 0.3; ctx.beginPath(); ctx.arc(sx, star.y, star.s * 3, 0, Math.PI * 2); ctx.fill(); }
    });
    ctx.globalAlpha = 1;
  } else {
    const bg = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
    bg.addColorStop(0, '#1a0000'); bg.addColorStop(0.3, '#3d0000'); bg.addColorStop(0.7, '#2a0000'); bg.addColorStop(1, '#0a0000');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    // Background castles
    ctx.fillStyle = '#150000';
    for (let i = 0; i < 8; i++) {
      const cx = (i * 160 - s.cameraX * 0.08) % (SCREEN_W + 200) - 50;
      ctx.fillRect(cx, 80, 35, 280); ctx.fillRect(cx - 8, 70, 51, 12);
      ctx.fillRect(cx - 4, 55, 12, 20); ctx.fillRect(cx + 28, 60, 12, 18);
    }
    // Fire particles
    for (let i = 0; i < 20; i++) {
      const fx = ((i * 97 + t * 25) % SCREEN_W);
      const fy = FLOOR - ((t * 35 + i * 37) % 250);
      ctx.globalAlpha = Math.max(0, 0.5 - (FLOOR - fy) / 400);
      ctx.fillStyle = ['#ff4400', '#ff8800', '#ffcc00'][i % 3];
      ctx.beginPath(); ctx.arc(fx, fy, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.translate(-s.cameraX, 0);

  // Floor
  if (wId !== 'galaxia') {
    ctx.fillStyle = '#1a0800'; ctx.fillRect(0, FLOOR, WORLD_WIDTH, SCREEN_H - FLOOR);
    ctx.strokeStyle = '#ff440040'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(WORLD_WIDTH, FLOOR); ctx.stroke();
  }

  // Lava
  s.lavaPools.forEach((lp: LavaPool) => {
    const lg = ctx.createLinearGradient(lp.x, FLOOR, lp.x, FLOOR + 30);
    lg.addColorStop(0, '#ff6600'); lg.addColorStop(0.5, '#ff3300'); lg.addColorStop(1, '#aa0000');
    ctx.fillStyle = lg; ctx.fillRect(lp.x, FLOOR, lp.width, 30);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath(); ctx.arc(lp.x + (i + 1) * lp.width / 4 + Math.sin(t * 3 + i) * 5, FLOOR + 5 + Math.sin(t * 4 + i * 2) * 3, 2, 0, Math.PI * 2); ctx.fill();
    }
  });

  // Platforms
  s.platforms.forEach((p: Platform) => {
    ctx.fillStyle = wId === 'infierno' ? '#2a0800' : '#1a1a4a';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = wId === 'infierno' ? '#ff440020' : '#00ffff15';
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  });

  // Dark towers
  s.darkTowers.forEach((dt: DarkTower) => {
    if (dt.hp <= 0) return;
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(dt.x, dt.y, dt.width, dt.height);
    ctx.strokeStyle = '#444'; ctx.strokeRect(dt.x, dt.y, dt.width, dt.height);
    if (dt.hp < 4) { ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(dt.x + 5, dt.y + 10); ctx.lineTo(dt.x + dt.width - 5, dt.y + dt.height - 10); ctx.stroke(); }
  });

  // Chests
  s.chests.forEach((ch: Chest) => {
    ctx.fillStyle = ch.opened ? '#444' : '#8B6914'; ctx.fillRect(ch.x - 12, ch.y - 10, 24, 16);
    ctx.strokeStyle = ch.opened ? '#555' : '#DAA520'; ctx.strokeRect(ch.x - 12, ch.y - 10, 24, 16);
    if (!ch.opened) { ctx.fillStyle = '#DAA520'; ctx.fillRect(ch.x - 3, ch.y - 5, 6, 6); }
  });

  // Weapons
  s.weapons.forEach((w: Weapon) => {
    if (w.picked) return;
    ctx.fillStyle = w.type === 'pistola' ? '#888' : w.type === 'sable' ? '#ccc' : w.type === 'canon_gamma' ? '#4488ff' : w.type === 'espada_fuego' ? '#ff4400' : w.type === 'rafaga_fuego' ? '#ff6600' : '#ddd';
    if (w.type === 'pistola' || w.type === 'canon_gamma' || w.type === 'rafaga_fuego') { ctx.fillRect(w.x - 10, w.y - 3, 20, 6); ctx.fillRect(w.x - 2, w.y, 4, 8); }
    else { ctx.fillRect(w.x - 2, w.y - 20, 4, 25); ctx.fillRect(w.x - 8, w.y + 2, 16, 4); }
    ctx.globalAlpha = 0.15 + Math.sin(t * 4) * 0.1;
    ctx.fillStyle = w.type.includes('fuego') ? '#ff4400' : w.type === 'canon_gamma' ? '#4488ff' : '#ffcc33';
    ctx.beginPath(); ctx.arc(w.x, w.y, 15, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });

  // Pickup prompt
  if (s.pickupPrompt) {
    ctx.fillStyle = '#ffcc33'; ctx.font = '10px Orbitron, monospace'; ctx.textAlign = 'center';
    ctx.fillText('[R] RECOGER', s.pickupPrompt.x, s.pickupPrompt.y);
  }

  // Asteroids
  s.asteroids.forEach((a: Asteroid) => {
    ctx.fillStyle = '#666'; ctx.beginPath(); ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#888'; ctx.stroke();
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(a.x - a.size * 0.3, a.y - a.size * 0.2, a.size * 0.2, 0, Math.PI * 2); ctx.fill();
    if (a.hp < 4) { ctx.strokeStyle = '#ff444480'; ctx.lineWidth = 1; for (let i = 0; i < 4 - a.hp; i++) { ctx.beginPath(); ctx.moveTo(a.x - a.size + i * 10, a.y); ctx.lineTo(a.x + i * 5, a.y - a.size); ctx.stroke(); } }
  });

  // Black holes
  s.blackHoles.forEach((bh: BlackHole) => {
    const g = ctx.createRadialGradient(bh.x, bh.y, 0, bh.x, bh.y, bh.radius);
    g.addColorStop(0, '#000'); g.addColorStop(0.5, 'rgba(50,0,100,0.5)'); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bh.x, bh.y, bh.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(100,0,200,0.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bh.x, bh.y, 20 + Math.sin(t * 3) * 5, t * 2, t * 2 + Math.PI * 1.5); ctx.stroke();
  });

  // Portals
  s.portals.forEach((p: Portal) => {
    [{ x: p.x1, y: p.y1 }, { x: p.x2, y: p.y2 }].forEach(pos => {
      ctx.strokeStyle = p.color; ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5 + Math.sin(t * 4) * 0.3;
      ctx.beginPath(); ctx.ellipse(pos.x, pos.y, 15, 25, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.08; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.ellipse(pos.x, pos.y, 12, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    });
  });

  // Parrots
  s.parrots.forEach((p: Parrot) => {
    if (!p.alive) return;
    ctx.fillStyle = '#00cc00'; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.moveTo(p.x + 8, p.y); ctx.lineTo(p.x + 14, p.y + 2); ctx.lineTo(p.x + 8, p.y + 3); ctx.fill();
    ctx.fillStyle = '#009900'; ctx.beginPath(); ctx.ellipse(p.x - 3, p.y + 2, 8, 4, Math.sin(t * 10) * 0.3, 0, Math.PI * 2); ctx.fill();
  });

  // Slaves
  s.slaves.forEach((sl: Slave) => {
    if (sl.freed) return;
    drawCharBody(ctx, sl.x, sl.y - 8, 1, '#f5deb3', '#666', '#333', '#3a2a1a', '#fff', 0.7, t, 0);
    ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sl.x - 10, sl.y + 10); ctx.lineTo(sl.x + 10, sl.y + 10); ctx.stroke();
    ctx.fillStyle = '#ffcc33'; ctx.font = 'bold 12px Orbitron'; ctx.textAlign = 'center'; ctx.fillText('!', sl.x, sl.y - 30);
  });

  // Crystals
  s.crystals.forEach((c: Crystal) => {
    ctx.globalAlpha = 0.8 + Math.sin(t * 6 + c.x) * 0.2;
    ctx.fillStyle = '#00ccff';
    ctx.beginPath(); ctx.moveTo(c.x, c.y - 8); ctx.lineTo(c.x + 6, c.y); ctx.lineTo(c.x, c.y + 8); ctx.lineTo(c.x - 6, c.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
    ctx.globalAlpha = 1;
  });

  // Enemies - VERSUS STYLE BODIES
  s.enemies.forEach((e: Enemy) => {
    if (wId === 'galaxia') drawPirateVersusStyle(ctx, e, t);
    else drawDemonVersusStyle(ctx, e, t);
    // HP bar
    if (e.hp < e.maxHp) {
      ctx.fillStyle = '#1a0000'; ctx.fillRect(e.x - e.size, e.y - e.size - 14, e.size * 2, 4);
      ctx.fillStyle = '#ff0000'; ctx.fillRect(e.x - e.size, e.y - e.size - 14, e.size * 2 * (e.hp / e.maxHp), 4);
    }
  });

  // Boss
  if (s.boss && s.boss.hp > 0) {
    const b = s.boss;
    if (wId === 'galaxia') {
      // Black ship - big detailed
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.moveTo(b.x - b.size, b.y + 15); ctx.lineTo(b.x + b.size, b.y + 15);
      ctx.lineTo(b.x + b.size + 25, b.y); ctx.lineTo(b.x + b.size, b.y - 20);
      ctx.lineTo(b.x - b.size, b.y - 20); ctx.lineTo(b.x - b.size - 15, b.y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#333'; ctx.fillRect(b.x - 5, b.y - 55, 10, 40);
      ctx.fillStyle = '#ff0000'; ctx.fillRect(b.x + 5, b.y - 53, 30, 18);
      ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('☠', b.x + 20, b.y - 38);
      ctx.fillStyle = '#444';
      ctx.fillRect(b.x - 65, b.y + 8, 18, 6); ctx.fillRect(b.x + 52, b.y + 8, 18, 6);
      ctx.globalAlpha = 0.12; ctx.fillStyle = '#ff0000';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.size + 25, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      drawDemonVersusStyle(ctx, b, t);
      // Fire sword
      ctx.fillStyle = '#ff4400'; ctx.fillRect(b.x + b.facing * 18, b.y - 35, 4, 40);
      ctx.fillStyle = '#ffcc00'; ctx.beginPath();
      ctx.moveTo(b.x + b.facing * 18, b.y - 37); ctx.lineTo(b.x + b.facing * 18 + 10, b.y - 48); ctx.lineTo(b.x + b.facing * 18 - 5, b.y - 44); ctx.fill();
    }
    // Beam
    if (s.bossBeamActive) {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(s.bossBeamAngle);
      const bg = ctx.createLinearGradient(0, 0, 500, 0);
      bg.addColorStop(0, 'rgba(0,150,255,0.9)'); bg.addColorStop(0.5, 'rgba(0,200,255,0.6)'); bg.addColorStop(1, 'rgba(0,100,255,0.1)');
      ctx.fillStyle = bg; ctx.fillRect(0, -14, 500, 28);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(0, -5, 500, 10);
      ctx.restore();
    }
  }

  // PLAYER - VERSUS STYLE
  drawPlayerVersusStyle(ctx, s, cData, t);

  // Projectiles
  s.projectiles.forEach((p: Projectile) => {
    const sz = p.type === 'gamma' ? 10 : p.type === 'torpedo' ? 8 : p.type === 'ultra' ? 7 : p.type === 'super' ? 6 : 4;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, Math.PI * 2); ctx.fill();
    if (p.type === 'gamma' || p.type === 'ultra' || p.type === 'super' || p.type === 'special') {
      ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(p.x, p.y, sz + 6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(p.x - p.vx, p.y - p.vy, sz * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  });

  // Particles
  s.particles.forEach((p: Particle) => {
    ctx.globalAlpha = p.life / 30; ctx.fillStyle = p.color; ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
  });
  ctx.globalAlpha = 1;

  // Combo
  if (s.comboHits > 1) {
    ctx.fillStyle = '#ffff00'; ctx.font = 'bold 14px Orbitron, monospace'; ctx.textAlign = 'center';
    ctx.globalAlpha = Math.min(1, s.comboTimer / 20);
    ctx.fillText(`${s.comboHits} COMBO!`, s.playerX, s.playerY - 45);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ============= CHARACTER DRAWING FUNCTIONS (VERSUS STYLE) =============

/** Draws a character body in the same style as Fighter._drawBody */
function drawCharBody(ctx: CanvasRenderingContext2D, x: number, y: number, facing: number,
  skinColor: string, clothesColor: string, pantsColor: string, hairColor: string, eyeColor: string,
  scale: number, t: number, handPhase: number, handsColor?: string) {

  const r = 25 * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.translate(-x, -y);

  // Head
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = skinColor; ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();

  // Clothes
  ctx.beginPath();
  if ((ctx as any).roundRect) (ctx as any).roundRect(x - r, y, r * 2, r * 0.44, 0);
  else ctx.fillRect(x - r, y, r * 2, r * 0.44);
  ctx.fillStyle = clothesColor; ctx.fill(); ctx.stroke();

  // Pants
  ctx.save(); ctx.translate(x, y + r * 0.44); ctx.scale(1, 0.6);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, Math.PI);
  ctx.fillStyle = pantsColor; ctx.fill(); ctx.stroke(); ctx.restore();

  // Hair
  ctx.save(); ctx.translate(x, y - 10 * scale); ctx.scale(1, 0.7);
  ctx.beginPath(); ctx.arc(0, 0, 22 * scale, Math.PI, 0);
  ctx.fillStyle = hairColor; ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();

  // Eyes
  ctx.fillStyle = eyeColor;
  const ex = x + 6 * scale;
  ctx.beginPath(); ctx.arc(ex - 4 * scale, y - 6 * scale, 3 * scale, 0, Math.PI * 2);
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fill();
  ctx.beginPath(); ctx.arc(ex + 4 * scale, y - 6 * scale, 3 * scale, 0, Math.PI * 2); ctx.stroke(); ctx.fill();

  // Hands
  const hc = handsColor || skinColor;
  const swing = Math.sin(handPhase) * 6 * scale;
  ctx.fillStyle = hc;
  ctx.beginPath(); ctx.arc(x + 18 * scale + swing, y + 8 * scale, 6 * scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + 30 * scale - swing, y + 8 * scale, 6 * scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.restore();
}

function drawPlayerVersusStyle(ctx: CanvasRenderingContext2D, s: any, cData: any, t: number) {
  drawCharBody(ctx, s.playerX, s.playerY, s.facing,
    cData.skinColor, cData.clothesColor, cData.pantsColor, cData.hairColor, cData.eyes,
    1, t, s.playerHandPhase, cData.handsColor);

  // Weapon in hand
  if (s.weapon) {
    ctx.fillStyle = s.weapon.type.includes('fuego') ? '#ff4400' : s.weapon.type === 'hacha_huesos' ? '#ddd' : '#888';
    ctx.save(); ctx.translate(s.playerX + s.facing * 30, s.playerY + 8); ctx.rotate(s.facing > 0 ? -0.3 : 0.3);
    ctx.fillRect(-2, -18, 4, 20); ctx.restore();
  }

  // Attack flash
  if (s.attackTimer > 8) {
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s.playerX + s.facing * 35, s.playerY, 18, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawPirateVersusStyle(ctx: CanvasRenderingContext2D, e: Enemy, t: number) {
  if (e.type === 'barco_pirata') {
    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath(); ctx.moveTo(e.x - e.size, e.y + 5); ctx.lineTo(e.x + e.size, e.y + 5);
    ctx.lineTo(e.x + e.size - 5, e.y + 15); ctx.lineTo(e.x - e.size + 5, e.y + 15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(e.x - 2, e.y - 20, 4, 25);
    ctx.fillStyle = '#fff'; ctx.fillRect(e.x + 2, e.y - 18, 15, 10);
    ctx.fillStyle = '#333'; ctx.fillRect(e.x - e.size, e.y + 8, 10, 4);
    return;
  }

  const sc = e.size / 18;
  // Draw pirate using versus body style
  drawCharBody(ctx, e.x, e.y, e.facing,
    e.skinColor || '#f5c6a0', e.clothesColor || '#8B4513', e.pantsColor || '#222', e.hatColor || '#3a2a1a', '#000',
    sc, t, e.handPhase, '#f5c6a0');

  // Hat on top (pirate-specific)
  ctx.fillStyle = e.hatColor || '#3a2a1a';
  const r = 25 * sc;
  ctx.beginPath(); ctx.ellipse(e.x, e.y - r * 0.7, r * 0.7, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(e.x - r * 0.35, e.y - r * 1.0, r * 0.7, r * 0.35);
}

function drawDemonVersusStyle(ctx: CanvasRenderingContext2D, e: Enemy, t: number) {
  const sc = e.size / 18;
  // Demon body - red skin, black armor, black pants
  drawCharBody(ctx, e.x, e.y, e.facing,
    '#cc2200', '#1a1a1a', '#111', '#330000', '#ffff00',
    sc, t, e.handPhase, '#cc2200');

  const r = 25 * sc;
  // Horns
  ctx.fillStyle = '#330000';
  ctx.beginPath(); ctx.moveTo(e.x - r * 0.35, e.y - r * 0.7);
  ctx.lineTo(e.x - r * 0.18, e.y - r * 1.2); ctx.lineTo(e.x - r * 0.1, e.y - r * 0.6); ctx.fill();
  ctx.beginPath(); ctx.moveTo(e.x + r * 0.35, e.y - r * 0.7);
  ctx.lineTo(e.x + r * 0.18, e.y - r * 1.2); ctx.lineTo(e.x + r * 0.1, e.y - r * 0.6); ctx.fill();

  // Tail
  ctx.strokeStyle = '#cc2200'; ctx.lineWidth = 3 * sc;
  ctx.beginPath();
  ctx.moveTo(e.x - e.facing * r * 0.4, e.y + r * 0.3);
  ctx.quadraticCurveTo(e.x - e.facing * r * 1.0, e.y + Math.sin(t * 3 + e.x) * 10, e.x - e.facing * r * 0.7, e.y - r * 0.15);
  ctx.stroke();
  // Arrow tip
  ctx.fillStyle = '#cc2200';
  const tx = e.x - e.facing * r * 0.7, ty = e.y - r * 0.15;
  ctx.beginPath(); ctx.moveTo(tx, ty - 4 * sc); ctx.lineTo(tx + e.facing * -8 * sc, ty); ctx.lineTo(tx, ty + 4 * sc); ctx.fill();
}

export default AdventurePlay;
