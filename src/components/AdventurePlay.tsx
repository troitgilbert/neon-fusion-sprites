import React, { useRef, useEffect, useState } from 'react';
import { useGame } from '../game/GameContext';

interface Enemy {
  x: number; y: number; hp: number; maxHp: number; type: string;
  vx: number; vy: number; color: string; size: number; isFlying: boolean;
  shootTimer: number; isHealer?: boolean;
}

interface Platform {
  x: number; y: number; w: number; h: number;
}

const WORLD_WIDTH = 4000;
const SCREEN_H = 480;
const FLOOR = 420;
const GRAVITY = 0.5;

const AdventurePlay: React.FC = () => {
  const { engine, setGameState } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [worldId] = useState(() => (engine as any).adventureWorld || 'galaxia');
  const [paused, setPaused] = useState(false);
  const [objectives] = useState([
    { text: 'Derrota al jefe del mundo', done: false, reward: 50 },
    { text: 'Derrota 10 enemigos', done: false, reward: 10 },
    { text: 'Explora todo el mapa', done: false, reward: 5 },
  ]);

  const stateRef = useRef({
    playerX: 100, playerY: FLOOR, playerVx: 0, playerVy: 0, playerHp: 100, playerMaxHp: 100,
    cameraX: 0, isFlying: worldId === 'galaxia', isGrounded: true,
    enemies: [] as Enemy[], platforms: [] as Platform[], projectiles: [] as any[],
    keys: {} as Record<string, boolean>, kills: 0, bossAlive: true,
    particles: [] as any[],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const s = stateRef.current;

    // Generate platforms
    for (let i = 0; i < 30; i++) {
      s.platforms.push({
        x: 300 + i * 130 + Math.random() * 80,
        y: FLOOR - 60 - Math.random() * 200,
        w: 60 + Math.random() * 80,
        h: 10,
      });
    }

    // Generate enemies
    const enemyTypes: Record<string, { types: string[]; colors: string[] }> = {
      galaxia: { types: ['pirata', 'asteroide', 'nave'], colors: ['#ff4400', '#888', '#00ccff'] },
      infierno: { types: ['demonio', 'demonio_grande', 'demonio_tirador'], colors: ['#ff0000', '#aa0000', '#ff4400'] },
      cielo: { types: ['angel_corrupto', 'angel', 'bestia_angelical'], colors: ['#ffaa00', '#ffffff', '#ff00ff'] },
    };
    const et = enemyTypes[worldId] || enemyTypes.galaxia;
    for (let i = 0; i < 25; i++) {
      const typeIdx = Math.floor(Math.random() * et.types.length);
      const isHealer = et.types[typeIdx] === 'angel';
      s.enemies.push({
        x: 500 + i * 140 + Math.random() * 60,
        y: worldId === 'galaxia' ? 100 + Math.random() * 250 : FLOOR - 30,
        hp: et.types[typeIdx].includes('grande') ? 30 : 10,
        maxHp: et.types[typeIdx].includes('grande') ? 30 : 10,
        type: et.types[typeIdx], vx: (Math.random() - 0.5) * 2, vy: 0,
        color: et.colors[typeIdx], size: et.types[typeIdx].includes('grande') ? 30 : 18,
        isFlying: worldId === 'galaxia' || et.types[typeIdx].includes('angel'),
        shootTimer: Math.random() * 120,
        isHealer,
      });
    }

    // Boss at end
    const bossData: Record<string, { name: string; hp: number; color: string; size: number }> = {
      galaxia: { name: 'PERLA NEGRA', hp: 250, color: '#8B4513', size: 50 },
      infierno: { name: 'LUCIFER', hp: 150, color: '#ff0000', size: 25 },
      cielo: { name: 'DIOS ANTIGUO', hp: 180, color: '#ff0000', size: 45 },
    };
    const boss = bossData[worldId];
    s.enemies.push({
      x: WORLD_WIDTH - 200, y: worldId === 'galaxia' ? 200 : FLOOR - boss.size,
      hp: boss.hp, maxHp: boss.hp, type: 'boss', vx: 0, vy: 0,
      color: boss.color, size: boss.size,
      isFlying: worldId !== 'infierno', shootTimer: 0,
    });

    // Key listeners
    const onKey = (e: KeyboardEvent, down: boolean) => {
      s.keys[e.code] = down;
      if (e.code === 'Escape' && down) setPaused(p => !p);
    };
    window.addEventListener('keydown', e => onKey(e, true));
    window.addEventListener('keyup', e => onKey(e, false));

    let animId = 0;
    const loop = () => {
      if (!paused) updateGame(s, ctx, worldId);
      drawGame(s, ctx, worldId);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', e => onKey(e, true));
      window.removeEventListener('keyup', e => onKey(e, false));
    };
  }, [worldId, paused]);

  const handleExit = () => {
    // Reward kills
    const kills = stateRef.current.kills;
    if (kills > 0) engine.updatePrisms(Math.floor(kills * 2));
    if (!stateRef.current.bossAlive) engine.updatePrisms(50);
    setGameState('MENU');
  };

  return (
    <div className="fixed inset-0 z-50" style={{ background: '#000' }}>
      <canvas ref={canvasRef} width={1280} height={960} style={{ width: '100vw', height: '100vh', imageRendering: 'pixelated' }} />
      
      {/* HUD overlay */}
      <div style={{ position: 'fixed', top: 15, left: 15, zIndex: 10 }}>
        <div style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2 }}>
          {worldId.toUpperCase()} | 🔷 {engine.coins} | ❤️ {Math.ceil(stateRef.current.playerHp)} | 💀 {stateRef.current.kills}
        </div>
        <div style={{ height: 8, width: 200, background: '#222', border: '1px solid #555', marginTop: 4 }}>
          <div style={{ height: '100%', width: `${(stateRef.current.playerHp / stateRef.current.playerMaxHp) * 100}%`, background: 'linear-gradient(90deg, #ff4d4d, #ff8c00)', transition: 'width 0.1s' }} />
        </div>
      </div>

      {paused && (
        <div className="fixed inset-0 z-20 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 28, letterSpacing: 4, marginBottom: 20 }}>PAUSA</h2>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: '#ffcc66', fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 2, marginBottom: 10 }}>OBJETIVOS</div>
              {objectives.map((o, i) => (
                <div key={i} style={{ color: o.done ? '#00ff66' : '#87ceeb', fontSize: 11, marginBottom: 4 }}>
                  {o.done ? '✓' : '○'} {o.text} — 🔷 {o.reward}
                </div>
              ))}
            </div>
            <button onClick={() => setPaused(false)} style={{ padding: '10px 30px', border: '1px solid #87ceeb', color: '#87ceeb', background: 'transparent', cursor: 'pointer', fontFamily: "'Orbitron', monospace", margin: 5 }}>CONTINUAR</button>
            <button onClick={handleExit} style={{ padding: '10px 30px', border: '1px solid #ff4d4d', color: '#ff4d4d', background: 'transparent', cursor: 'pointer', fontFamily: "'Orbitron', monospace", margin: 5 }}>SALIR</button>
          </div>
        </div>
      )}
    </div>
  );
};

function updateGame(s: any, _ctx: any, worldId: string) {
  const speed = 5;
  if (s.keys['KeyA'] || s.keys['ArrowLeft']) s.playerVx = -speed;
  else if (s.keys['KeyD'] || s.keys['ArrowRight']) s.playerVx = speed;
  else s.playerVx *= 0.8;

  if (s.isFlying) {
    if (s.keys['KeyW'] || s.keys['ArrowUp']) s.playerVy = -speed;
    else if (s.keys['KeyS'] || s.keys['ArrowDown']) s.playerVy = speed;
    else s.playerVy *= 0.9;
  } else {
    if ((s.keys['KeyW'] || s.keys['ArrowUp']) && s.isGrounded) {
      s.playerVy = -12; s.isGrounded = false;
    }
    s.playerVy += GRAVITY;
  }

  // Attack
  if (s.keys['KeyF']) {
    s.enemies.forEach((e: Enemy) => {
      const dist = Math.hypot(e.x - s.playerX, e.y - s.playerY);
      if (dist < 50 && !e.isHealer) {
        e.hp -= 1.5;
        e.vx = Math.sign(e.x - s.playerX) * 5;
      }
    });
  }

  // Shoot projectile
  if (s.keys['KeyG'] && (!s._shootCooldown || s._shootCooldown <= 0)) {
    s.projectiles.push({
      x: s.playerX + 20, y: s.playerY, vx: 8, vy: 0, life: 60, color: '#00ffff', isPlayer: true,
    });
    s._shootCooldown = 15;
  }
  if (s._shootCooldown > 0) s._shootCooldown--;

  s.playerX += s.playerVx;
  s.playerY += s.playerVy;

  // Floor collision
  if (!s.isFlying && s.playerY >= FLOOR) {
    s.playerY = FLOOR; s.playerVy = 0; s.isGrounded = true;
  }

  // Platform collision
  if (!s.isFlying) {
    s.platforms.forEach((p: Platform) => {
      if (s.playerX > p.x - 10 && s.playerX < p.x + p.w + 10 &&
          s.playerY >= p.y - 5 && s.playerY <= p.y + 5 && s.playerVy > 0) {
        s.playerY = p.y; s.playerVy = 0; s.isGrounded = true;
      }
    });
  }

  s.playerX = Math.max(20, Math.min(WORLD_WIDTH - 20, s.playerX));
  s.playerY = Math.max(20, Math.min(FLOOR + 20, s.playerY));
  s.cameraX = Math.max(0, Math.min(WORLD_WIDTH - 640, s.playerX - 320));

  // Update enemies
  s.enemies = s.enemies.filter((e: Enemy) => {
    if (e.hp <= 0) {
      s.kills++;
      if (e.type === 'boss') s.bossAlive = false;
      s.particles.push(...Array.from({ length: 10 }, () => ({
        x: e.x, y: e.y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
        life: 30, color: e.color,
      })));
      return false;
    }

    // Simple AI
    const dx = s.playerX - e.x;
    if (Math.abs(dx) < 300) {
      e.vx = Math.sign(dx) * (e.type === 'boss' ? 1.5 : 1);
    }
    e.x += e.vx;
    if (!e.isFlying) {
      e.vy = (e.vy || 0) + GRAVITY;
      e.y += e.vy;
      if (e.y >= FLOOR - e.size / 2) { e.y = FLOOR - e.size / 2; e.vy = 0; }
    } else {
      e.y += Math.sin(Date.now() * 0.003 + e.x) * 0.5;
    }

    // Healer
    if (e.isHealer && Math.hypot(e.x - s.playerX, e.y - s.playerY) < 40) {
      s.playerHp = Math.min(s.playerMaxHp, s.playerHp + 0.5);
    }

    // Shoot
    if (e.type.includes('tirador') || e.type.includes('nave') || e.type === 'boss') {
      e.shootTimer--;
      if (e.shootTimer <= 0) {
        e.shootTimer = e.type === 'boss' ? 30 : 60;
        const angle = Math.atan2(s.playerY - e.y, s.playerX - e.x);
        s.projectiles.push({
          x: e.x, y: e.y, vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4,
          life: 120, color: e.color, isPlayer: false,
        });
      }
    }

    // Contact damage
    if (!e.isHealer && Math.hypot(e.x - s.playerX, e.y - s.playerY) < e.size + 15) {
      s.playerHp -= 0.3;
    }

    return true;
  });

  // Update projectiles
  s.projectiles = s.projectiles.filter((p: any) => {
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.isPlayer) {
      s.enemies.forEach((e: Enemy) => {
        if (!e.isHealer && Math.hypot(p.x - e.x, p.y - e.y) < e.size + 5) {
          e.hp -= 5; p.life = 0;
        }
      });
    } else {
      if (Math.hypot(p.x - s.playerX, p.y - s.playerY) < 20) {
        s.playerHp -= 5; p.life = 0;
      }
    }
    return p.life > 0;
  });

  // Particles
  s.particles = s.particles.filter((p: any) => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--;
    return p.life > 0;
  });

  // Death
  if (s.playerHp <= 0) {
    s.playerHp = s.playerMaxHp;
    s.playerX = 100; s.playerY = FLOOR;
  }
}

function drawGame(s: any, ctx: CanvasRenderingContext2D, worldId: string) {
  ctx.save();
  ctx.scale(2, 2); // Render scale

  // Background
  const bgs: Record<string, [string, string, string]> = {
    galaxia: ['#050520', '#0a1040', '#050520'],
    infierno: ['#1a0000', '#3d0000', '#000'],
    cielo: ['#4a90d9', '#87ceeb', '#fff9e0'],
  };
  const [c1, c2, c3] = bgs[worldId] || bgs.galaxia;
  const bg = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
  bg.addColorStop(0, c1); bg.addColorStop(0.5, c2); bg.addColorStop(1, c3);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 640, SCREEN_H);

  ctx.translate(-s.cameraX, 0);

  // Floor
  ctx.strokeStyle = worldId === 'infierno' ? '#ff4400' : worldId === 'cielo' ? '#ffd700' : '#00ffff';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, FLOOR + 5); ctx.lineTo(WORLD_WIDTH, FLOOR + 5); ctx.stroke();

  // Platforms
  ctx.fillStyle = worldId === 'infierno' ? '#3a0000' : worldId === 'cielo' ? '#fff' : '#1a1a3a';
  s.platforms.forEach((p: Platform) => {
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = worldId === 'infierno' ? '#ff440040' : '#00ffff20';
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  });

  // Enemies
  s.enemies.forEach((e: Enemy) => {
    if (e.type === 'boss') {
      // Boss glow
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = e.color;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.size + 10, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
    // Eyes
    ctx.fillStyle = e.isHealer ? '#00ff66' : '#fff';
    ctx.beginPath(); ctx.arc(e.x - e.size * 0.25, e.y - e.size * 0.15, e.size * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.x + e.size * 0.25, e.y - e.size * 0.15, e.size * 0.15, 0, Math.PI * 2); ctx.fill();
    // HP bar
    if (e.hp < e.maxHp) {
      ctx.fillStyle = '#222';
      ctx.fillRect(e.x - e.size, e.y - e.size - 10, e.size * 2, 4);
      ctx.fillStyle = e.type === 'boss' ? '#ff0000' : '#00ff66';
      ctx.fillRect(e.x - e.size, e.y - e.size - 10, e.size * 2 * (e.hp / e.maxHp), 4);
    }
  });

  // Player
  ctx.fillStyle = '#f5deb3';
  ctx.beginPath(); ctx.arc(s.playerX, s.playerY, 18, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
  // Hair
  ctx.save(); ctx.translate(s.playerX, s.playerY - 8); ctx.scale(1, 0.7);
  ctx.beginPath(); ctx.arc(0, 0, 16, Math.PI, 0);
  ctx.fillStyle = '#5a3a1a'; ctx.fill(); ctx.stroke(); ctx.restore();
  // Eyes
  ctx.fillStyle = '#00ffff';
  ctx.beginPath(); ctx.arc(s.playerX + 3, s.playerY - 4, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(s.playerX + 9, s.playerY - 4, 2.5, 0, Math.PI * 2); ctx.fill();

  // Projectiles
  s.projectiles.forEach((p: any) => {
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
  });

  // Particles
  s.particles.forEach((p: any) => {
    ctx.globalAlpha = p.life / 30;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
  });
  ctx.globalAlpha = 1;

  ctx.restore();
}

export default AdventurePlay;
