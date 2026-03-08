import { Fighter } from './fighter';
import { Projectile } from './projectile';
import { Particle, Shockwave, FloatingText, PunchCircle } from './effects';
import { CHAR_DATA, CANVAS_W, CANVAS_H, CONTROLS, FLOOR_Y, RENDER_SCALE } from './constants';
import type { GameState, GameMode, StarData, Achievement, CustomCharData, Difficulty } from './types';
import { DIFFICULTIES } from './types';
import { playHitSound, playSpecialSound, playSuperSound, playKOSound, playBlockSound, startAmbient, stopAmbient, startMenuMusic, stopMenuMusic } from './audio';
import { checkAchievements, loadStats, saveStats } from './achievements';

interface LightningRay {
  x: number; life: number; maxLife: number;
}

interface AttractorStar {
  x: number; y: number; life: number; maxLife: number;
}

export class GameEngine {
  state: GameState = 'MENU';
  mode: GameMode = '';
  p1: Fighter | null = null;
  p2: Fighter | null = null;
  p1Choice: number | null = null;
  p2Choice: number | null = null;
  selectedStage = 'default';
  selectedSkins = { p1: null as string | null, p2: null as string | null };
  arcadeStage = 0;
  selectedDifficulty: Difficulty = 'normal';
  selectedBoss = '';

  particles: (Particle | PunchCircle)[] = [];
  projectiles: Projectile[] = [];
  texts: FloatingText[] = [];
  shockwaves: Shockwave[] = [];
  stars: StarData[] = [];

  // Big Bang effects
  lightningRays: LightningRay[] = [];
  attractorStar: AttractorStar | null = null;

  timeStopped = false;
  timeStopper: Fighter | null = null;
  round = 1;
  roundLocked = false;
  timer = 99;
  frameCount = 0;
  shake = 0;
  hitStop = 0;

  coins = 100;
  inventory: Record<string, any> = {};
  stats = loadStats();

  keys: Record<string, boolean> = {};
  justPressed: Record<string, boolean> = {};
  tapTracker: Record<string, any> = {};

  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  animFrameId = 0;

  menuMusicStarted = false;

  // Training options
  trainingAI: 'dummy' | 'fight' = 'dummy';
  trainingEnergy: 'progressive' | 'infinite' | 'none' = 'infinite';
  trainingDifficulty: Difficulty = 'normal';

  // Audio volumes
  musicVolume = 1;
  sfxVolume = 1;
  voiceVolume = 1;

  // Callbacks
  onStateChange?: (state: GameState) => void;
  onCoinsChange?: (coins: number) => void;
  onAnnouncerText?: (text: string) => void;
  onAchievement?: (a: Achievement) => void;

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    try { this.inventory = JSON.parse(localStorage.getItem('inv') || '{}'); } catch { this.inventory = {}; }
    try { this.coins = parseInt(localStorage.getItem('coins') || '100'); } catch { this.coins = 100; }

    for (let i = 0; i < 80; i++) {
      this.stars.push({ x: Math.random() * CANVAS_W, y: Math.random() * CANVAS_H, s: Math.random() * 2, blink: Math.random() });
    }

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

    this.loop();
  }

  destroy() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    stopMenuMusic();
    stopAmbient();
  }

  _onKeyDown = (e: KeyboardEvent) => {
    if (!this.menuMusicStarted) {
      this.menuMusicStarted = true;
      if (this.state === 'MENU') startMenuMusic();
    }

    if (e.code === 'Escape') { this.togglePause(); return; }
    if (!this.keys[e.code]) this.justPressed[e.code] = true;
    this.keys[e.code] = true;

    const now = Date.now();
    if (now - (this.tapTracker[e.code]?.time || 0) < 250) {
      if (this.state === 'FIGHT') {
        if (e.code === CONTROLS.p1.up && this.p1) this.p1.isFlying = !this.p1.isFlying;
        if (e.code === CONTROLS.p2.up && this.p2) this.p2.isFlying = !this.p2.isFlying;
        this.tapTracker[e.code].active = true;
      }
    } else {
      this.tapTracker[e.code] = { time: now, active: false };
    }
  };

  _onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
    if (this.tapTracker[e.code]) this.tapTracker[e.code].active = false;
  };

  setState(s: GameState, mode?: GameMode) {
    const prevState = this.state;
    this.state = s;
    if (mode) this.mode = mode;

    if (s === 'MENU' && prevState !== 'MENU') {
      stopAmbient();
      if (this.menuMusicStarted) startMenuMusic();
    }
    if (s === 'FIGHT' && prevState !== 'FIGHT') {
      stopMenuMusic();
    }

    this.onStateChange?.(s);
  }

  updatePrisms(amount: number) {
    this.coins += amount;
    localStorage.setItem('coins', String(this.coins));
    this.onCoinsChange?.(this.coins);
  }

  saveInv() { localStorage.setItem('inv', JSON.stringify(this.inventory)); }

  trackStat(key: keyof typeof this.stats, value: number = 1) {
    if (key === 'comboMax' || key === 'roundsSurvived') {
      (this.stats as any)[key] = Math.max((this.stats as any)[key], value);
    } else {
      (this.stats as any)[key] += value;
    }
    saveStats(this.stats);
    const newAchievements = checkAchievements(this.stats);
    newAchievements.forEach(a => {
      this.updatePrisms(a.reward);
      this.onAchievement?.(a);
    });
  }

  getCustomChar(idx: number): CustomCharData | null {
    try {
      const customs = JSON.parse(localStorage.getItem('customChars') || '[]');
      return customs[idx - 100] || null;
    } catch { return null; }
  }

  selectChar(idx: number) {
    if (this.p1Choice === null) {
      this.setState('SKIN_SELECT');
      return;
    } else if ((this.mode?.includes('versus') || this.mode === 'vs_cpu') && this.p2Choice === null) {
      this.setState('SKIN_SELECT');
      return;
    }
  }

  confirmSkinChoice(charIdx: number, skinId: string | null, pNum: number) {
    if (pNum === 1) {
      this.selectedSkins.p1 = skinId; this.p1Choice = charIdx;
      // For modes that don't need P2 selection, auto-assign P2
      if (this.mode !== 'versus' && this.mode !== 'vs_cpu') {
        this.p2Choice = (charIdx === 0 || charIdx >= 100) ? 1 : 0;
      }
    } else {
      this.selectedSkins.p2 = skinId; this.p2Choice = charIdx;
    }
    // Don't navigate — just store choices. The roster handles navigation via Enter.
  }

  // Called when user presses Enter with all selections made
  proceedFromRoster() {
    if (this.p1Choice === null) return;
    if (this.mode === 'arcade') {
      this.arcadeStage = 0;
      this.setState('ARCADE_TOWER');
    } else if (this.mode === 'survival' || this.mode === 'training') {
      this.selectedStage = 'default';
      this.startMatch(this.p1Choice, this.p2Choice!);
    } else if (this.mode === 'boss_rush' || this.mode === 'boss_select') {
      this.startBossFight(this.p1Choice);
    } else {
      this.setState('STAGE_SELECT');
    }
  }

  startBossFight(playerCharIdx: number) {
    const bossId = this.selectedBoss || 'big_bang';
    this.p1Choice = playerCharIdx;
    this.p2Choice = 1; // placeholder
    this.selectedStage = bossId === 'lucifer' ? 'infierno' : bossId === 'dios_antiguo' ? 'cielo' : 'nada';
    
    this.round = 1;
    this.p1 = new Fighter(1, playerCharIdx, 150, 1, CONTROLS.p1, false, this.selectedSkins.p1, playerCharIdx >= 100 ? this.getCustomChar(playerCharIdx) : null);
    
    // Create boss fighter
    this.p2 = new Fighter(2, 1, 490, -1, CONTROLS.p2, true, null, null);
    this.p2.data = { name: bossId.toUpperCase().replace('_', ' '), color: '#ffffff', eyes: '#ffff00', speed: 7, weight: 1 };
    
    if (bossId === 'big_bang') {
      this.p2.isBigBang = true;
      this.p2.hp = 200;
      this.p2.isFlying = true;
      this.p2.data.name = 'BIG BANG';
    } else if (bossId === 'lucifer') {
      this.p2.hp = 150;
      this.p2.data = { name: 'LUCIFER', color: '#ff0000', eyes: '#ffff00', speed: 12, weight: 0.8 };
    } else if (bossId === 'dios_antiguo') {
      this.p2.hp = 180;
      this.p2.isFlying = true;
      this.p2.data = { name: 'DIOS ANTIGUO', color: '#ff0000', eyes: '#ff0000', speed: 5, weight: 1.5 };
    } else if (bossId === 'perla_negra') {
      this.p2.hp = 250;
      this.p2.data = { name: 'PERLA NEGRA', color: '#8B4513', eyes: '#ffff00', speed: 3, weight: 2 };
    }
    
    this.resetRound();
    this.setState('FIGHT');
    startAmbient(this.selectedStage);
    this.trackStat('totalFights');
  }

  startArcadeStage(stageIdx: number) {
    this.arcadeStage = stageIdx;
    const stages = ['default', 'infierno', 'cielo', 'default', 'default', 'nada', 'default', 'infierno', 'cielo', 'nada'];
    this.selectedStage = stages[stageIdx] || 'default';

    // Stage 10 is Big Bang
    if (stageIdx === 9) {
      this.startBossFight(this.p1Choice!);
      return;
    }

    const availableChars = CHAR_DATA.map((_, i) => i).filter(i => i !== this.p1Choice);
    const oppIdx = availableChars[Math.floor(Math.random() * availableChars.length)] ?? 0;
    this.p2Choice = oppIdx;

    this.startMatch(this.p1Choice!, this.p2Choice!);
  }

  selectStage(stageId: string) {
    this.selectedStage = stageId;
    this.startMatch(this.p1Choice!, this.p2Choice!);
  }

  startMatch(c1: number, c2: number) {
    this.round = 1;
    this.p1 = new Fighter(1, c1, 150, 1, CONTROLS.p1, false, this.selectedSkins.p1, c1 >= 100 ? this.getCustomChar(c1) : null);
    const isAI = this.mode !== 'versus';
    if (this.mode === 'survival') { this.p1.rounds = 0; c2 = Math.random() > 0.5 ? 0 : 1; }
    this.p2 = new Fighter(2, c2, 490, -1, CONTROLS.p2, isAI, this.selectedSkins.p2, c2 >= 100 ? this.getCustomChar(c2) : null);
    
    // Apply difficulty
    const diff = DIFFICULTIES.find(d => d.id === this.selectedDifficulty) || DIFFICULTIES[1];
    if (this.p2) {
      this.p2.hp *= diff.hpMult;
    }
    if (diff.playerHp > 0 && this.p1) {
      this.p1.hp = diff.playerHp;
    }
    // For 1hit mode, enemies also have 1hp
    if (this.selectedDifficulty === '1hit' && this.p2) {
      this.p2.hp = 1;
    }
    
    if (this.mode === 'training') { this.p2.hp = 9999; this.p2.energy = 0; }
    this.resetRound();
    this.setState('FIGHT');
    startAmbient(this.selectedStage);
    this.trackStat('totalFights');
  }

  resetRound() {
    if (!this.p1 || !this.p2) return;
    this.p1.x = 150; this.p1.y = 400; this.p1.vx = 0; this.p1.vy = 0;
    this.p2.x = 490; this.p2.y = 400; this.p2.vx = 0; this.p2.vy = 0;

    if (this.mode === 'survival') {
      if (this.round > 1) this.p1.hp = Math.min(100, this.p1.hp + 20);
      this.p2.hp = 100 + (this.round * 10);
      this.p2.charIdx = Math.random() > 0.5 ? 0 : 1;
    } else if (!this.p2.isBigBang) {
      const diff = DIFFICULTIES.find(d => d.id === this.selectedDifficulty) || DIFFICULTIES[1];
      this.p1.hp = diff.playerHp > 0 ? diff.playerHp : 100;
      this.p2.hp = this.p2.isBigBang ? 200 : (this.selectedDifficulty === '1hit' ? 1 : 100 * diff.hpMult);
    }

    this.projectiles = []; this.texts = []; this.shockwaves = [];
    this.lightningRays = []; this.attractorStar = null;
    this.timer = 99; this.roundLocked = false;

    const roundText = this.mode === 'survival' ? `OLEADA ${this.round}` : `ROUND ${this.round}`;
    this.onAnnouncerText?.(roundText);
    setTimeout(() => { this.onAnnouncerText?.('¡LUCHEN!'); this.shake = 10; }, 1000);
    setTimeout(() => this.onAnnouncerText?.(''), 2000);
  }

  // Big Bang special effects
  spawnBigBangLightning(x: number) {
    this.lightningRays.push({ x, life: 90, maxLife: 90 });
    // Damage check happens in update
  }

  spawnAttractorStar() {
    this.attractorStar = { x: CANVAS_W / 2, y: CANVAS_H / 2 - 40, life: 300, maxLife: 300 };
  }

  roundEnd(loser: Fighter) {
    if (this.roundLocked) return;
    this.roundLocked = true;
    const winner = (loser === this.p1) ? this.p2! : this.p1!;
    this.onAnnouncerText?.('K.O.');
    this.shake = 25;
    this.flashScreen();
    this.state = 'ROUND_OVER';
    playKOSound();
    this.trackStat('totalKOs');

    if (winner === this.p1 && this.p1!.hp >= 100) this.trackStat('perfectWins');
    if (this.mode === 'survival') this.trackStat('roundsSurvived', this.round);

    setTimeout(() => {
      if (this.mode === 'survival') {
        if (winner === this.p1) {
          this.round++; this.updatePrisms(20); this.resetRound(); this.state = 'FIGHT';
        } else {
          this.onAnnouncerText?.('GAME OVER');
          setTimeout(() => { this.onAnnouncerText?.(''); stopAmbient(); this.setState('MENU'); }, 3000);
        }
      } else if (this.mode === 'training') {
        this.resetRound(); this.state = 'FIGHT';
      } else if (this.mode === 'arcade') {
        if (winner === this.p1) {
          this.arcadeStage++;
          if (this.arcadeStage >= 10) {
            this.onAnnouncerText?.('¡ARCADE COMPLETADO!');
            this.updatePrisms(100);
            setTimeout(() => { this.onAnnouncerText?.(''); stopAmbient(); this.setState('MENU'); }, 3000);
          } else {
            this.updatePrisms(15);
            this.onAnnouncerText?.('');
            stopAmbient();
            this.setState('ARCADE_TOWER');
          }
        } else {
          this.onAnnouncerText?.('GAME OVER');
          setTimeout(() => { this.onAnnouncerText?.(''); stopAmbient(); this.setState('MENU'); }, 3000);
        }
      } else {
        winner.rounds++;
        if (winner.rounds === 2) {
          const winnerName = winner.data.name;
          this.onAnnouncerText?.(`${winnerName} GANA!`);
          this.updatePrisms(10);
          if (winner === this.p1) this.trackStat('totalWins');
          setTimeout(() => { this.onAnnouncerText?.(''); stopAmbient(); this.setState('MENU'); }, 3000);
        } else {
          this.round = this.p1!.rounds + this.p2!.rounds + 1;
          this.resetRound(); this.state = 'FIGHT';
        }
      }
    }, 2000);
  }

  resume() { this.setState('FIGHT'); }
  restart() { if (this.p1Choice !== null && this.p2Choice !== null) this.startMatch(this.p1Choice, this.p2Choice); }
  goToMainMenu() { this.p1Choice = null; this.p2Choice = null; stopAmbient(); this.setState('MENU'); }
  togglePause() {
    if (this.state === 'FIGHT') this.setState('PAUSED');
    else if (this.state === 'PAUSED') this.resume();
  }

  startTimeStop(stopper: Fighter) {
    this.timeStopped = true; this.timeStopper = stopper;
    this.spawnShockwave(stopper.x, stopper.y, '#fff');
    setTimeout(() => this.timeStopped = false, 4000);
  }

  spawnParticles(x: number, y: number, color: string, count: number, size?: number) {
    if ((this.p1 && this.p1.isKaitoDemonio()) || (this.p2 && this.p2.isKaitoDemonio())) color = '#000000';
    for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y, color, 5, size));
    if (count >= 10) playHitSound();
  }
  spawnExplosion(x: number, y: number, color: string) {
    this.spawnParticles(x, y, color, 20, 4);
    this.shockwaves.push(new Shockwave(x, y, color));
    playSuperSound();
  }
  spawnProjectile(x: number, y: number, vx: number, vy: number, color: string, owner: Fighter, type: string) {
    this.projectiles.push(new Projectile(x, y, vx, vy, color, owner, type));
  }
  spawnShockwave(x: number, y: number, color: string) {
    if ((this.p1 && this.p1.isKaitoDemonio()) || (this.p2 && this.p2.isKaitoDemonio())) color = '#000000';
    this.shockwaves.push(new Shockwave(x, y, color));
  }
  flashScreen() {
    if (!this.ctx) return;
    this.ctx.fillStyle = 'white'; this.ctx.fillRect(0, 0, CANVAS_W * RENDER_SCALE, CANVAS_H * RENDER_SCALE);
  }

  drawStageBackground(ctx: CanvasRenderingContext2D) {
    const t = Date.now() * 0.001;

    if (this.selectedStage === 'nada') {
      // La Nada - existential void with subtle distortion
      ctx.fillStyle = '#000000';
      ctx.fillRect(-50, -50, CANVAS_W + 100, CANVAS_H + 100);

      // Faint static noise grid
      ctx.save();
      for (let i = 0; i < 40; i++) {
        const nx = (i * 67 + Math.floor(t * 2) * 13) % CANVAS_W;
        const ny = (i * 43 + Math.floor(t * 3) * 7) % CANVAS_H;
        ctx.globalAlpha = 0.015 + Math.sin(t * 5 + i) * 0.01;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(nx, ny, 1, 1);
      }

      // Pulsing void rings
      for (let i = 0; i < 3; i++) {
        const pulse = Math.sin(t * 0.5 + i * 2.1) * 0.5 + 0.5;
        ctx.globalAlpha = 0.02 + pulse * 0.015;
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(320, 240, 80 + i * 90 + pulse * 30, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Distorted horizon line hint
      ctx.globalAlpha = 0.03;
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= CANVAS_W; x += 4) {
        const waveY = FLOOR_Y + Math.sin(x * 0.03 + t * 1.5) * 3;
        x === 0 ? ctx.moveTo(x, waveY) : ctx.lineTo(x, waveY);
      }
      ctx.stroke();

      // Faint vertical glitch lines
      for (let i = 0; i < 4; i++) {
        const gx = (Math.floor(t * 8 + i * 100) * 137) % CANVAS_W;
        ctx.globalAlpha = 0.02;
        ctx.fillStyle = '#222222';
        ctx.fillRect(gx, 0, 1, CANVAS_H);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }

    if (this.selectedStage === 'infierno') {
      // Background gradient - deep hellish tones
      const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bg.addColorStop(0, '#0a0000');
      bg.addColorStop(0.2, '#1f0000');
      bg.addColorStop(0.5, '#3d0500');
      bg.addColorStop(0.8, '#2a0200');
      bg.addColorStop(1, '#000000');
      ctx.fillStyle = bg;
      ctx.fillRect(-50, -50, CANVAS_W + 100, CANVAS_H + 100);

      // Volcanic smoke clouds
      ctx.save();
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 130 + t * (8 + i * 2)) % 900) - 100;
        const cy = 30 + i * 20 + Math.sin(t * 0.3 + i) * 15;
        ctx.globalAlpha = 0.06 + (i % 2) * 0.03;
        const smokeG = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80 + i * 15);
        smokeG.addColorStop(0, 'rgba(60,10,0,0.4)');
        smokeG.addColorStop(0.5, 'rgba(30,5,0,0.2)');
        smokeG.addColorStop(1, 'transparent');
        ctx.fillStyle = smokeG;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 100 + i * 20, 40 + i * 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Red ambient glow from below
      ctx.save();
      ctx.globalAlpha = 0.15 + Math.sin(t * 1.5) * 0.05;
      const redGlow = ctx.createRadialGradient(320, CANVAS_H, 0, 320, CANVAS_H, 400);
      redGlow.addColorStop(0, 'rgba(255,50,0,0.3)');
      redGlow.addColorStop(0.5, 'rgba(200,20,0,0.1)');
      redGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = redGlow;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();

      // 3D perspective grid
      ctx.strokeStyle = 'rgba(255,50,0,0.12)';
      ctx.lineWidth = 1;
      const vanishY = 180, vanishX = 320;
      for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 55 - 30, CANVAS_H);
        ctx.lineTo(vanishX, vanishY);
        ctx.stroke();
      }
      for (let i = 0; i < 10; i++) {
        const y = FLOOR_Y + i * 10;
        const sp = (y - vanishY) / (CANVAS_H - vanishY);
        ctx.beginPath();
        ctx.moveTo(vanishX - sp * 450, y);
        ctx.lineTo(vanishX + sp * 450, y);
        ctx.stroke();
      }

      // Distant mountain silhouettes with jagged peaks
      for (let layer = 0; layer < 3; layer++) {
        const baseY = 230 + layer * 30;
        const shade = 20 + layer * 15;
        ctx.fillStyle = `rgb(${shade + 10}, ${Math.floor(shade * 0.3)}, ${Math.floor(shade * 0.2)})`;
        ctx.beginPath();
        ctx.moveTo(-10, baseY + 50);
        for (let x = -10; x <= CANVAS_W + 10; x += 15 + layer * 5) {
          const h = Math.sin(x * 0.015 + layer * 2) * 35 + Math.sin(x * 0.04 + layer) * 18 + Math.sin(x * 0.08 + t * 0.1) * 5;
          ctx.lineTo(x, baseY - h);
        }
        ctx.lineTo(CANVAS_W + 10, baseY + 50);
        ctx.fill();
      }

      // Jagged rock pillars
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = `rgb(${35 + i * 6}, ${8 + i * 2}, ${3 + i})`;
        const rx = 70 + i * 110, ry = FLOOR_Y - 2;
        const rh = 18 + (i % 3) * 12;
        ctx.beginPath();
        ctx.moveTo(rx - 12, ry);
        ctx.lineTo(rx - 8, ry - rh * 0.6);
        ctx.lineTo(rx - 3, ry - rh);
        ctx.lineTo(rx + 4, ry - rh * 0.8);
        ctx.lineTo(rx + 10, ry - rh * 0.4);
        ctx.lineTo(rx + 14, ry);
        ctx.fill();
      }

      // Fire particles rising
      for (let i = 0; i < 30; i++) {
        const fx = ((i * 97 + t * 35) % 700) - 20;
        const fy = FLOOR_Y - ((t * 25 + i * 47) % 250);
        const life = Math.max(0, 1 - (FLOOR_Y - fy) / 250);
        ctx.globalAlpha = life * 0.7;
        const colors = ['#ff2200', '#ff5500', '#ff8800', '#ffcc00', '#ffee66'];
        ctx.fillStyle = colors[i % colors.length];
        const sz = 1.5 + Math.sin(t * 4 + i) * 1 + life * 2;
        ctx.beginPath();
        ctx.arc(fx, fy, sz, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lava pool at floor with animated waves
      ctx.globalAlpha = 0.4 + Math.sin(t * 2) * 0.1;
      const lava = ctx.createLinearGradient(0, FLOOR_Y, 0, CANVAS_H);
      lava.addColorStop(0, 'rgba(255,120,0,0.7)');
      lava.addColorStop(0.3, 'rgba(255,60,0,0.5)');
      lava.addColorStop(1, 'rgba(180,0,0,0.3)');
      ctx.fillStyle = lava;
      ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);

      // Lava surface highlights
      ctx.globalAlpha = 0.25;
      for (let x = 0; x < CANVAS_W; x += 30) {
        const wave = Math.sin(x * 0.05 + t * 3) * 2;
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(x, FLOOR_Y + wave - 1, 20, 2);
      }
      ctx.globalAlpha = 1;
      return;
    }

    if (this.selectedStage === 'cielo') {
      // Sky gradient - divine golden hour
      const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bg.addColorStop(0, '#1a3a6e');
      bg.addColorStop(0.15, '#3a6eb5');
      bg.addColorStop(0.35, '#6aacde');
      bg.addColorStop(0.55, '#9fd4f0');
      bg.addColorStop(0.75, '#d4ecfa');
      bg.addColorStop(1, '#fff5d0');
      ctx.fillStyle = bg;
      ctx.fillRect(-50, -50, CANVAS_W + 100, CANVAS_H + 100);

      // God rays from top
      ctx.save();
      ctx.globalAlpha = 0.06;
      for (let i = 0; i < 8; i++) {
        const rx = 80 + i * 75 + Math.sin(t * 0.2 + i * 0.8) * 25;
        ctx.fillStyle = '#fffde0';
        ctx.beginPath();
        ctx.moveTo(rx - 3, -10);
        ctx.lineTo(rx - 50 - i * 5, CANVAS_H + 10);
        ctx.lineTo(rx + 50 + i * 5, CANVAS_H + 10);
        ctx.lineTo(rx + 3, -10);
        ctx.fill();
      }
      ctx.restore();

      // Sun/divine light source
      ctx.save();
      ctx.globalAlpha = 0.12 + Math.sin(t * 0.8) * 0.03;
      const sunG = ctx.createRadialGradient(320, -20, 0, 320, -20, 300);
      sunG.addColorStop(0, 'rgba(255,240,180,0.5)');
      sunG.addColorStop(0.3, 'rgba(255,220,130,0.2)');
      sunG.addColorStop(1, 'transparent');
      ctx.fillStyle = sunG;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();

      // 3D perspective grid (golden)
      ctx.strokeStyle = 'rgba(255,215,0,0.08)';
      ctx.lineWidth = 1;
      const vanishY = 160, vanishX = 320;
      for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 55 - 30, CANVAS_H);
        ctx.lineTo(vanishX, vanishY);
        ctx.stroke();
      }
      for (let i = 0; i < 10; i++) {
        const y = FLOOR_Y + i * 10;
        const sp = (y - vanishY) / (CANVAS_H - vanishY);
        ctx.beginPath();
        ctx.moveTo(vanishX - sp * 450, y);
        ctx.lineTo(vanishX + sp * 450, y);
        ctx.stroke();
      }

      // Layered cloud formations
      for (let layer = 0; layer < 3; layer++) {
        const speed = 10 + layer * 5;
        const baseAlpha = 0.2 + layer * 0.1;
        for (let i = 0; i < 6; i++) {
          const cx = ((i * 140 + t * speed + layer * 200) % 900) - 100;
          const cy = 40 + layer * 40 + i * 15 + Math.sin(t * 0.4 + i * 1.5 + layer) * 12;
          const cw = 90 + (i % 3) * 40 + layer * 20;
          const ch = 18 + (i % 2) * 12 + layer * 5;
          ctx.globalAlpha = baseAlpha - layer * 0.03;
          ctx.fillStyle = layer === 0 ? '#ffffff' : layer === 1 ? '#f0f5ff' : '#e8eeff';
          ctx.beginPath();
          ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
          ctx.fill();
          // Sub-cloud puffs
          ctx.beginPath();
          ctx.ellipse(cx - cw * 0.3, cy - ch * 0.4, cw * 0.5, ch * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(cx + cw * 0.25, cy - ch * 0.3, cw * 0.4, ch * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Floating golden particles / divine dust
      for (let i = 0; i < 25; i++) {
        const px = (i * 73 + t * 12) % CANVAS_W;
        const py = 30 + ((i * 41 + t * 6) % (FLOOR_Y - 40));
        const sparkle = Math.sin(t * 5 + i * 2.3) * 0.5 + 0.5;
        ctx.globalAlpha = 0.15 + sparkle * 0.35;
        ctx.fillStyle = i % 3 === 0 ? '#ffd700' : '#ffffcc';
        ctx.beginPath();
        ctx.arc(px, py, 1 + sparkle * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant floating islands / celestial platforms
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < 3; i++) {
        const ix = 100 + i * 220 + Math.sin(t * 0.15 + i * 3) * 15;
        const iy = 200 + i * 30 + Math.sin(t * 0.25 + i) * 8;
        ctx.fillStyle = '#c8d8e8';
        ctx.beginPath();
        ctx.ellipse(ix, iy, 50 + i * 10, 10 + i * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Grass on top
        ctx.fillStyle = '#90c890';
        ctx.beginPath();
        ctx.ellipse(ix, iy - 3, 48 + i * 10, 5, 0, Math.PI, 0);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return;
    }

    // === GALAXIA (default) ===
    const bg = ctx.createLinearGradient(0, 0, CANVAS_W * 0.5, CANVAS_H);
    bg.addColorStop(0, '#020012');
    bg.addColorStop(0.3, '#06022a');
    bg.addColorStop(0.6, '#0a0435');
    bg.addColorStop(1, '#050218');
    ctx.fillStyle = bg;
    ctx.fillRect(-50, -50, CANVAS_W + 100, CANVAS_H + 100);

    // Deep space nebula clouds
    for (let i = 0; i < 6; i++) {
      const nx = 80 + i * 110 + Math.sin(t * 0.15 + i * 1.8) * 35;
      const ny = 60 + i * 55 + Math.cos(t * 0.12 + i * 1.2) * 25;
      const nr = 100 + i * 25 + Math.sin(t * 0.1 + i) * 15;
      const nebColors = [
        ['rgba(120,0,220,0.07)', 'rgba(120,0,220,0)'],
        ['rgba(0,80,220,0.06)', 'rgba(0,80,220,0)'],
        ['rgba(220,0,120,0.05)', 'rgba(220,0,120,0)'],
        ['rgba(0,180,160,0.04)', 'rgba(0,180,160,0)'],
        ['rgba(180,60,200,0.04)', 'rgba(180,60,200,0)'],
        ['rgba(40,0,180,0.05)', 'rgba(40,0,180,0)'],
      ];
      const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
      grad.addColorStop(0, nebColors[i][0]);
      grad.addColorStop(0.6, nebColors[i][1]);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // Milky way band
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.translate(320, 200);
    ctx.rotate(-0.3);
    const milky = ctx.createLinearGradient(-300, -40, 300, 40);
    milky.addColorStop(0, 'transparent');
    milky.addColorStop(0.3, 'rgba(200,180,255,0.5)');
    milky.addColorStop(0.5, 'rgba(220,200,255,0.7)');
    milky.addColorStop(0.7, 'rgba(200,180,255,0.5)');
    milky.addColorStop(1, 'transparent');
    ctx.fillStyle = milky;
    ctx.fillRect(-350, -35, 700, 70);
    ctx.restore();

    // Stars with twinkling
    this.stars.forEach((s, i) => {
      const tw = 0.3 + Math.sin(t * 3 + s.blink * 10) * 0.4 + Math.sin(t * 7 + i) * 0.2;
      ctx.globalAlpha = Math.max(0, Math.min(1, tw));
      const size = s.s * (0.8 + Math.sin(t * 2 + s.blink * 5) * 0.3);
      // Star color variation
      const starColors = ['#ffffff', '#aaccff', '#ffddaa', '#ccddff', '#ffeedd'];
      ctx.fillStyle = starColors[i % starColors.length];
      ctx.beginPath();
      ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
      ctx.fill();
      // Glow halo for bright stars
      if (size > 1.2) {
        ctx.globalAlpha *= 0.2;
        const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, size * 4);
        halo.addColorStop(0, starColors[i % starColors.length]);
        halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(s.x, s.y, size * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    // Distant planet
    ctx.save();
    ctx.globalAlpha = 0.12;
    const planetX = 520 + Math.sin(t * 0.05) * 5;
    const planetY = 100 + Math.cos(t * 0.03) * 3;
    const pG = ctx.createRadialGradient(planetX - 8, planetY - 8, 0, planetX, planetY, 30);
    pG.addColorStop(0, '#4488cc');
    pG.addColorStop(0.7, '#223366');
    pG.addColorStop(1, '#111133');
    ctx.fillStyle = pG;
    ctx.beginPath();
    ctx.arc(planetX, planetY, 28, 0, Math.PI * 2);
    ctx.fill();
    // Planet ring
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#8899bb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(planetX, planetY, 45, 8, -0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3D perspective grid (cyan)
    ctx.strokeStyle = 'rgba(0,255,255,0.06)';
    ctx.lineWidth = 1;
    const vanishY = 200, vanishX = 320;
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 50 - 10, CANVAS_H);
      ctx.lineTo(vanishX, vanishY);
      ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const y = FLOOR_Y + i * 12;
      const sp = (y - vanishY) / (CANVAS_H - vanishY);
      ctx.beginPath();
      ctx.moveTo(vanishX - sp * 450, y);
      ctx.lineTo(vanishX + sp * 450, y);
      ctx.stroke();
    }
  }

  drawStageFloor(ctx: CanvasRenderingContext2D) {
    if (this.selectedStage === 'nada') {
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, FLOOR_Y); ctx.lineTo(CANVAS_W, FLOOR_Y); ctx.stroke();
      return;
    }
    const colors: Record<string, [string, string]> = {
      infierno: ['rgba(255,80,0,0.8)', '#ff4400'],
      cielo: ['rgba(255,215,0,0.6)', '#ffd700'],
      default: ['rgba(0,255,255,0.5)', '#ffffff'],
    };
    const [shadow, stroke] = colors[this.selectedStage] || colors.default;
    ctx.shadowBlur = 20; ctx.shadowColor = shadow;
    ctx.strokeStyle = stroke; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, FLOOR_Y); ctx.lineTo(CANVAS_W, FLOOR_Y); ctx.stroke();
    ctx.shadowBlur = 0;
  }

  update() {
    if (this.state !== 'FIGHT') return;
    if (this.hitStop > 0) { this.hitStop--; return; }

    this.frameCount++;
    if (this.frameCount % 60 === 0 && this.timer > 0 && this.mode !== 'training' && this.mode !== 'survival') {
      this.timer--;
      if (this.timer === 0) {
        if (this.p1!.hp > this.p2!.hp) this.roundEnd(this.p2!);
        else this.roundEnd(this.p1!);
      }
    }

    this.p1!.update(this.p2!, this, this.keys, this.justPressed, this.tapTracker);
    this.p2!.update(this.p1!, this, this.keys, this.justPressed, this.tapTracker);

    if (this.p1!.hp <= 0) this.roundEnd(this.p1!);
    if (this.p2!.hp <= 0) this.roundEnd(this.p2!);

    this.projectiles.forEach((p, i) => { p.update(p.owner.id === 1 ? this.p2! : this.p1!, this); if (!p.active) this.projectiles.splice(i, 1); });
    this.particles = this.particles.filter(p => { p.update(); return p.life > 0; });
    this.texts = this.texts.filter(t => { t.update(); return t.life > 0; });
    this.shockwaves = this.shockwaves.filter(s => { s.update(); return s.life > 0; });

    // Big Bang lightning rays
    this.lightningRays = this.lightningRays.filter(ray => {
      ray.life--;
      // Damage player if they touch lightning
      if (this.p1 && Math.abs(this.p1.x - ray.x) < 25 && ray.life > 30) {
        const diff = DIFFICULTIES.find(d => d.id === this.selectedDifficulty) || DIFFICULTIES[1];
        this.p1.takeDamage(3 * diff.dmgMult, true);
        this.spawnParticles(this.p1.x, this.p1.y, '#ffffff', 8, 2);
      }
      return ray.life > 0;
    });

    // Attractor star
    if (this.attractorStar && this.p1) {
      this.attractorStar.life--;
      // Pull player toward star
      const dx = this.attractorStar.x - this.p1.x;
      const dy = this.attractorStar.y - this.p1.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        const force = 2.5;
        this.p1.vx += (dx / dist) * force;
        this.p1.vy += (dy / dist) * force;
      }
      // Instant kill on contact
      if (dist < 30) {
        this.p1.hp = 0;
        this.spawnExplosion(this.p1.x, this.p1.y, '#ffff00');
        this.attractorStar = null;
      }
      if (this.attractorStar && this.attractorStar.life <= 0) this.attractorStar = null;
    }

    // Apply difficulty damage multiplier
    if (this.selectedDifficulty === 'debes_morir' || this.selectedDifficulty === '1hit') {
      // These are handled in takeDamage already via the hp settings
    }

    if (this.shake > 0) this.shake *= 0.9;
    if (this.shake < 0.5) this.shake = 0;
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const dx = (Math.random() - 0.5) * this.shake;
    const dy = (Math.random() - 0.5) * this.shake;

    ctx.save();
    ctx.scale(RENDER_SCALE, RENDER_SCALE);
    const zoom = 1 + Math.min(this.shake / 120, 0.06);
    ctx.translate(320, 240); ctx.scale(zoom, zoom); ctx.translate(-320, -240);
    ctx.translate(dx, dy);

    this.drawStageBackground(ctx);
    this.drawStageFloor(ctx);

    if (this.state === 'FIGHT' || this.state === 'PAUSED' || this.state === 'ROUND_OVER') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath(); ctx.ellipse(this.p1!.x, FLOOR_Y, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(this.p2!.x, FLOOR_Y, 20, 5, 0, 0, Math.PI * 2); ctx.fill();

      this.p2!.draw(ctx, this);
      this.p1!.draw(ctx, this);
      this.projectiles.forEach(p => p.draw(ctx));
      this.shockwaves.forEach(s => s.draw(ctx));
      this.particles.forEach(p => p.draw(ctx));
      this.texts.forEach(t => t.draw(ctx));

      // Draw lightning rays
      this.lightningRays.forEach(ray => {
        const alpha = ray.life / ray.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        // Main beam
        ctx.fillRect(ray.x - 8, 0, 16, CANVAS_H);
        // Glow
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillRect(ray.x - 20, 0, 40, CANVAS_H);
        ctx.globalAlpha = 1;
        // Warning flash
        if (ray.life > ray.maxLife - 20) {
          ctx.globalAlpha = (ray.maxLife - ray.life) / 20 * 0.5;
          ctx.fillStyle = '#ffff00';
          ctx.fillRect(ray.x - 3, 0, 6, CANVAS_H);
          ctx.globalAlpha = 1;
        }
      });

      // Draw attractor star
      if (this.attractorStar) {
        const star = this.attractorStar;
        const t = Date.now() * 0.005;
        const pulse = 1 + Math.sin(t * 3) * 0.2;
        // Star glow
        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.rotate(t);
        // Outer glow
        ctx.globalAlpha = 0.3;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 60 * pulse);
        grad.addColorStop(0, '#ffff00');
        grad.addColorStop(0.5, '#ff880040');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, 60 * pulse, 0, Math.PI * 2); ctx.fill();
        // Star shape
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffff00';
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 / 8) * i;
          ctx.save();
          ctx.rotate(angle);
          ctx.fillRect(-2, 0, 4, 25 * pulse);
          ctx.restore();
        }
        // Center
        ctx.beginPath(); ctx.arc(0, 0, 10 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  loop = () => {
    this.update();
    this.draw();
    this.justPressed = {};
    this.animFrameId = requestAnimationFrame(this.loop);
  };
}
