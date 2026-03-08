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
      // === LA NADA - Existential abyss ===
      ctx.fillStyle = '#000000';
      ctx.fillRect(-50, -50, CANVAS_W + 100, CANVAS_H + 100);

      // Deep void gradient pulses
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const pulse = Math.sin(t * 0.3 + i * 2.1) * 0.5 + 0.5;
        ctx.globalAlpha = 0.03 + pulse * 0.02;
        const vg = ctx.createRadialGradient(320, 240, 0, 320, 240, 200 + i * 100);
        vg.addColorStop(0, i === 0 ? 'rgba(30,0,50,0.4)' : i === 1 ? 'rgba(0,10,30,0.3)' : 'rgba(20,0,0,0.2)');
        vg.addColorStop(1, 'transparent');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      }
      ctx.restore();

      // Static noise field - dense
      ctx.save();
      for (let i = 0; i < 120; i++) {
        const nx = (i * 67 + Math.floor(t * 3) * 13 + Math.floor(Math.sin(i * 0.7) * 100)) % CANVAS_W;
        const ny = (i * 43 + Math.floor(t * 4) * 7 + Math.floor(Math.cos(i * 0.5) * 80)) % CANVAS_H;
        ctx.globalAlpha = 0.01 + Math.sin(t * 8 + i * 1.3) * 0.008;
        ctx.fillStyle = i % 5 === 0 ? '#332244' : i % 7 === 0 ? '#220022' : '#ffffff';
        const sz = 0.5 + Math.sin(t * 6 + i) * 0.5;
        ctx.fillRect(nx, ny, sz, sz);
      }
      ctx.restore();

      // Pulsing concentric void rings
      ctx.save();
      for (let i = 0; i < 6; i++) {
        const pulse = Math.sin(t * 0.4 + i * 1.05) * 0.5 + 0.5;
        ctx.globalAlpha = 0.015 + pulse * 0.02;
        ctx.strokeStyle = i % 2 === 0 ? '#333344' : '#221133';
        ctx.lineWidth = 0.5 + pulse * 0.5;
        ctx.beginPath();
        ctx.arc(320, 240, 40 + i * 55 + pulse * 20 + Math.sin(t * 0.6 + i) * 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Distorted horizon with interference
      ctx.save();
      ctx.globalAlpha = 0.04;
      ctx.strokeStyle = '#444455';
      ctx.lineWidth = 1;
      for (let line = 0; line < 3; line++) {
        ctx.beginPath();
        for (let x = 0; x <= CANVAS_W; x += 2) {
          const waveY = FLOOR_Y + line * 3 + Math.sin(x * 0.03 + t * 1.5 + line) * 3 + Math.sin(x * 0.09 + t * 4) * 1;
          x === 0 ? ctx.moveTo(x, waveY) : ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Vertical glitch bands
      ctx.save();
      for (let i = 0; i < 8; i++) {
        const gx = (Math.floor(t * 12 + i * 100) * 137) % CANVAS_W;
        const gh = 20 + Math.sin(t * 7 + i * 2) * 40;
        const gy = (Math.floor(t * 5 + i * 50) * 89) % CANVAS_H;
        ctx.globalAlpha = 0.015 + Math.sin(t * 10 + i) * 0.01;
        ctx.fillStyle = i % 3 === 0 ? '#110022' : '#001111';
        ctx.fillRect(gx, gy, 1 + (i % 2), gh);
      }
      ctx.restore();

      // Floating void fragments
      ctx.save();
      for (let i = 0; i < 15; i++) {
        const fx = 50 + ((i * 113 + t * 5) % (CANVAS_W - 100));
        const fy = 50 + ((i * 79 + Math.sin(t * 0.3 + i) * 30) % (CANVAS_H - 100));
        const flicker = Math.sin(t * 6 + i * 3.7) * 0.5 + 0.5;
        ctx.globalAlpha = flicker * 0.03;
        ctx.fillStyle = '#665577';
        ctx.fillRect(fx, fy, 2 + flicker * 2, 1);
      }
      ctx.restore();

      // Central eye/void focal point
      ctx.save();
      const eyePulse = Math.sin(t * 0.5) * 0.5 + 0.5;
      ctx.globalAlpha = 0.02 + eyePulse * 0.015;
      const eyeG = ctx.createRadialGradient(320, 220, 0, 320, 220, 60 + eyePulse * 20);
      eyeG.addColorStop(0, 'rgba(80,0,120,0.3)');
      eyeG.addColorStop(0.5, 'rgba(40,0,60,0.1)');
      eyeG.addColorStop(1, 'transparent');
      ctx.fillStyle = eyeG;
      ctx.fillRect(200, 150, 240, 140);
      ctx.restore();

      ctx.globalAlpha = 1;
      return;
    }

    if (this.selectedStage === 'infierno') {
      // === INFIERNO - Apocalyptic hellscape ===
      const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bg.addColorStop(0, '#050000');
      bg.addColorStop(0.1, '#120000');
      bg.addColorStop(0.25, '#2a0300');
      bg.addColorStop(0.45, '#4a0800');
      bg.addColorStop(0.65, '#3a0400');
      bg.addColorStop(0.8, '#1f0200');
      bg.addColorStop(1, '#000000');
      ctx.fillStyle = bg;
      ctx.fillRect(-50, -50, CANVAS_W + 100, CANVAS_H + 100);

      // Distant volcanic eruption glow
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const eruptX = 120 + i * 220;
        const eruptPulse = Math.sin(t * 1.2 + i * 2.5) * 0.5 + 0.5;
        ctx.globalAlpha = 0.04 + eruptPulse * 0.06;
        const eg = ctx.createRadialGradient(eruptX, 180, 0, eruptX, 180, 100 + eruptPulse * 40);
        eg.addColorStop(0, 'rgba(255,100,0,0.4)');
        eg.addColorStop(0.4, 'rgba(200,30,0,0.2)');
        eg.addColorStop(1, 'transparent');
        ctx.fillStyle = eg;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      }
      ctx.restore();

      // Massive volcanic smoke/ash clouds
      ctx.save();
      for (let i = 0; i < 10; i++) {
        const cx = ((i * 110 + t * (6 + i * 1.5)) % 1000) - 150;
        const cy = 15 + i * 18 + Math.sin(t * 0.25 + i * 0.8) * 12;
        const cw = 110 + (i % 3) * 50;
        const ch = 30 + (i % 4) * 15;
        ctx.globalAlpha = 0.04 + (i % 3) * 0.015;
        ctx.fillStyle = i % 2 === 0 ? '#1a0500' : '#0f0300';
        ctx.beginPath();
        ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx - cw * 0.3, cy - ch * 0.5, cw * 0.5, ch * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Red ambient glow from below - more intense
      ctx.save();
      const glowPulse = Math.sin(t * 1.5) * 0.08;
      ctx.globalAlpha = 0.2 + glowPulse;
      const redGlow = ctx.createRadialGradient(320, CANVAS_H + 50, 0, 320, CANVAS_H, 450);
      redGlow.addColorStop(0, 'rgba(255,60,0,0.5)');
      redGlow.addColorStop(0.3, 'rgba(220,30,0,0.25)');
      redGlow.addColorStop(0.6, 'rgba(150,10,0,0.1)');
      redGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = redGlow;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();

      // Multi-layer mountain silhouettes with jagged peaks
      for (let layer = 0; layer < 4; layer++) {
        const baseY = 200 + layer * 30;
        const r = 15 + layer * 12;
        const g = Math.floor(r * 0.2);
        const b = Math.floor(r * 0.1);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.globalAlpha = 0.8 + layer * 0.05;
        ctx.beginPath();
        ctx.moveTo(-10, baseY + 60);
        for (let x = -10; x <= CANVAS_W + 10; x += 8 + layer * 4) {
          const h = Math.sin(x * 0.012 + layer * 2.3) * 40 + Math.sin(x * 0.035 + layer * 1.1) * 22 + Math.sin(x * 0.07 + t * 0.08 + layer) * 6;
          ctx.lineTo(x, baseY - h);
        }
        ctx.lineTo(CANVAS_W + 10, baseY + 60);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Jagged rock pillars with detail
      for (let i = 0; i < 8; i++) {
        const rx = 40 + i * 85, ry = FLOOR_Y - 2;
        const rh = 22 + (i % 3) * 18 + Math.sin(i * 1.7) * 8;
        // Shadow
        ctx.fillStyle = `rgb(${20 + i * 4}, ${3 + i}, ${1 + i})`;
        ctx.beginPath();
        ctx.moveTo(rx - 14, ry);
        ctx.lineTo(rx - 10, ry - rh * 0.5);
        ctx.lineTo(rx - 5, ry - rh * 0.85);
        ctx.lineTo(rx - 2, ry - rh);
        ctx.lineTo(rx + 3, ry - rh * 0.9);
        ctx.lineTo(rx + 7, ry - rh * 0.6);
        ctx.lineTo(rx + 12, ry - rh * 0.3);
        ctx.lineTo(rx + 16, ry);
        ctx.fill();
        // Highlight edge
        ctx.strokeStyle = `rgba(255,60,0,${0.1 + Math.sin(t * 2 + i) * 0.05})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(rx - 5, ry - rh * 0.85);
        ctx.lineTo(rx - 2, ry - rh);
        ctx.lineTo(rx + 3, ry - rh * 0.9);
        ctx.stroke();
      }

      // 3D perspective grid
      ctx.strokeStyle = 'rgba(255,50,0,0.1)';
      ctx.lineWidth = 1;
      const vYi = 170, vXi = 320;
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 48 - 40, CANVAS_H);
        ctx.lineTo(vXi, vYi);
        ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const y = FLOOR_Y + i * 8;
        const sp = (y - vYi) / (CANVAS_H - vYi);
        ctx.beginPath();
        ctx.moveTo(vXi - sp * 500, y);
        ctx.lineTo(vXi + sp * 500, y);
        ctx.stroke();
      }

      // Fire particles - dense field
      for (let i = 0; i < 50; i++) {
        const fx = ((i * 97 + t * (30 + i % 5 * 5)) % 750) - 25;
        const fy = FLOOR_Y - ((t * (20 + i % 3 * 10) + i * 47) % 300);
        const life = Math.max(0, 1 - (FLOOR_Y - fy) / 300);
        ctx.globalAlpha = life * 0.65;
        const colors = ['#ff1100', '#ff3300', '#ff5500', '#ff7700', '#ff9900', '#ffbb00', '#ffdd44', '#ffee88'];
        ctx.fillStyle = colors[i % colors.length];
        const sz = Math.max(0.1, 1 + Math.sin(t * 5 + i * 0.7) * 1.2 + life * 2.5);
        ctx.beginPath();
        ctx.arc(fx + Math.sin(t * 3 + i) * 3, fy, sz, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ember sparks (small fast particles)
      for (let i = 0; i < 20; i++) {
        const ex = ((i * 53 + t * 50) % 700) - 10;
        const ey = FLOOR_Y - ((t * 60 + i * 31) % 350);
        const eLife = Math.max(0, 1 - (FLOOR_Y - ey) / 350);
        ctx.globalAlpha = eLife * 0.5;
        ctx.fillStyle = '#ffee44';
        ctx.fillRect(ex, ey, 0.8, 0.8);
      }

      // Lava pool with complex surface
      ctx.globalAlpha = 0.5 + Math.sin(t * 2) * 0.1;
      const lava = ctx.createLinearGradient(0, FLOOR_Y, 0, CANVAS_H);
      lava.addColorStop(0, 'rgba(255,130,0,0.8)');
      lava.addColorStop(0.15, 'rgba(255,80,0,0.7)');
      lava.addColorStop(0.4, 'rgba(220,40,0,0.5)');
      lava.addColorStop(1, 'rgba(150,0,0,0.3)');
      ctx.fillStyle = lava;
      ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);

      // Lava surface detail - multiple wave layers
      for (let layer = 0; layer < 3; layer++) {
        ctx.globalAlpha = 0.2 - layer * 0.05;
        ctx.fillStyle = layer === 0 ? '#ffee44' : layer === 1 ? '#ffcc00' : '#ff8800';
        for (let x = 0; x < CANVAS_W; x += 15 + layer * 10) {
          const wave = Math.sin(x * 0.04 + t * (3 + layer) + layer * 2) * 2;
          const w = 8 + layer * 6 + Math.sin(x * 0.1 + t * 2) * 3;
          ctx.fillRect(x, FLOOR_Y + wave - 1 + layer, w, 1.5);
        }
      }
      ctx.globalAlpha = 1;
      return;
    }

    if (this.selectedStage === 'cielo') {
      // === CIELO - Divine celestial realm ===
      const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bg.addColorStop(0, '#0d2247');
      bg.addColorStop(0.08, '#1a3a6e');
      bg.addColorStop(0.2, '#2d5a9e');
      bg.addColorStop(0.35, '#5a9ad5');
      bg.addColorStop(0.5, '#7dbce8');
      bg.addColorStop(0.65, '#a8d8f4');
      bg.addColorStop(0.8, '#d4ecfa');
      bg.addColorStop(0.92, '#f0e8d0');
      bg.addColorStop(1, '#fff5d0');
      ctx.fillStyle = bg;
      ctx.fillRect(-50, -50, CANVAS_W + 100, CANVAS_H + 100);

      // Sun with corona
      ctx.save();
      const sunX = 320, sunY = -30;
      // Outer corona
      for (let r = 0; r < 4; r++) {
        const coronaPulse = Math.sin(t * 0.6 + r * 1.5) * 0.02;
        ctx.globalAlpha = 0.03 + coronaPulse;
        const corona = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 250 + r * 60);
        corona.addColorStop(0, 'rgba(255,245,200,0.4)');
        corona.addColorStop(0.3, 'rgba(255,230,150,0.15)');
        corona.addColorStop(0.6, 'rgba(255,200,80,0.05)');
        corona.addColorStop(1, 'transparent');
        ctx.fillStyle = corona;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      }
      ctx.restore();

      // God rays - volumetric light shafts
      ctx.save();
      for (let i = 0; i < 12; i++) {
        const rx = 60 + i * 55 + Math.sin(t * 0.15 + i * 0.7) * 20;
        const rayAlpha = 0.03 + Math.sin(t * 0.5 + i * 1.2) * 0.015;
        ctx.globalAlpha = rayAlpha;
        ctx.fillStyle = '#fffde0';
        ctx.beginPath();
        ctx.moveTo(rx - 2, -10);
        ctx.lineTo(rx - 40 - i * 4, CANVAS_H + 10);
        ctx.lineTo(rx + 40 + i * 4, CANVAS_H + 10);
        ctx.lineTo(rx + 2, -10);
        ctx.fill();
      }
      ctx.restore();

      // Multi-layer cloud system
      ctx.save();
      for (let layer = 0; layer < 4; layer++) {
        const speed = 6 + layer * 4;
        for (let i = 0; i < 8; i++) {
          const cx = ((i * 120 + t * speed + layer * 180) % 1000) - 150;
          const cy = 25 + layer * 35 + i * 12 + Math.sin(t * 0.3 + i * 1.2 + layer * 0.7) * 10;
          const cw = 80 + (i % 3) * 45 + layer * 15;
          const ch = 15 + (i % 2) * 10 + layer * 4;
          ctx.globalAlpha = (0.25 - layer * 0.03) * (0.8 + Math.sin(t * 0.4 + i) * 0.2);
          const cloudColors = ['#ffffff', '#f5f8ff', '#edf2ff', '#e0eaff'];
          ctx.fillStyle = cloudColors[layer];
          // Main body
          ctx.beginPath();
          ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
          ctx.fill();
          // Puffs
          ctx.beginPath();
          ctx.ellipse(cx - cw * 0.35, cy - ch * 0.5, cw * 0.55, ch * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(cx + cw * 0.3, cy - ch * 0.35, cw * 0.45, ch * 0.65, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(cx + cw * 0.15, cy - ch * 0.6, cw * 0.35, ch * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 3D perspective grid (golden)
      ctx.strokeStyle = 'rgba(255,215,0,0.06)';
      ctx.lineWidth = 1;
      const vYc = 150, vXc = 320;
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 48 - 40, CANVAS_H);
        ctx.lineTo(vXc, vYc);
        ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const y = FLOOR_Y + i * 8;
        const sp = (y - vYc) / (CANVAS_H - vYc);
        ctx.beginPath();
        ctx.moveTo(vXc - sp * 500, y);
        ctx.lineTo(vXc + sp * 500, y);
        ctx.stroke();
      }

      // Floating celestial islands with more detail
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const ix = 80 + i * 170 + Math.sin(t * 0.12 + i * 2.5) * 20;
        const iy = 185 + i * 25 + Math.sin(t * 0.2 + i * 1.3) * 10;
        const iw = 40 + i * 15;
        // Shadow underneath
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = '#445566';
        ctx.beginPath();
        ctx.ellipse(ix, iy + 8, iw * 0.8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Rock body
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#b8c8d8';
        ctx.beginPath();
        ctx.ellipse(ix, iy, iw, 10 + i * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Underside rocks
        ctx.fillStyle = '#8898a8';
        ctx.beginPath();
        ctx.ellipse(ix, iy + 5, iw * 0.7, 8, 0, 0, Math.PI);
        ctx.fill();
        // Grass on top
        ctx.fillStyle = '#78b878';
        ctx.beginPath();
        ctx.ellipse(ix, iy - 3, iw - 3, 5, 0, Math.PI, 0);
        ctx.fill();
        // Tiny trees
        if (i % 2 === 0) {
          ctx.fillStyle = '#5a9a5a';
          ctx.beginPath();
          ctx.arc(ix - 8, iy - 10, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#664422';
          ctx.fillRect(ix - 9, iy - 7, 2, 5);
        }
      }
      ctx.restore();

      // Golden divine particles
      ctx.save();
      for (let i = 0; i < 40; i++) {
        const px = (i * 73 + t * (8 + i % 4 * 3)) % CANVAS_W;
        const py = 20 + ((i * 41 + t * (4 + i % 3 * 2)) % (FLOOR_Y - 30));
        const sparkle = Math.sin(t * 5 + i * 2.3) * 0.5 + 0.5;
        ctx.globalAlpha = 0.1 + sparkle * 0.4;
        ctx.fillStyle = i % 4 === 0 ? '#ffd700' : i % 4 === 1 ? '#ffffcc' : i % 4 === 2 ? '#fff8e0' : '#ffeeaa';
        const sz = 0.8 + sparkle * 1.8;
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fill();
        // Cross sparkle on bright ones
        if (sparkle > 0.7 && i % 3 === 0) {
          ctx.globalAlpha *= 0.4;
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(px - 4, py);
          ctx.lineTo(px + 4, py);
          ctx.moveTo(px, py - 4);
          ctx.lineTo(px, py + 4);
          ctx.stroke();
        }
      }
      ctx.restore();

      // Faint rainbow arc
      ctx.save();
      ctx.globalAlpha = 0.02;
      const rainbowColors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'];
      for (let c = 0; c < rainbowColors.length; c++) {
        ctx.strokeStyle = rainbowColors[c];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(320, 500, 380 + c * 4, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
      ctx.restore();

      ctx.globalAlpha = 1;
      return;
    }

    // === GALAXIA (default) - Deep space epic ===
    const bg = ctx.createLinearGradient(0, 0, CANVAS_W * 0.5, CANVAS_H);
    bg.addColorStop(0, '#010010');
    bg.addColorStop(0.15, '#030020');
    bg.addColorStop(0.35, '#06022a');
    bg.addColorStop(0.55, '#0a0438');
    bg.addColorStop(0.75, '#070228');
    bg.addColorStop(1, '#030015');
    ctx.fillStyle = bg;
    ctx.fillRect(-50, -50, CANVAS_W + 100, CANVAS_H + 100);

    // Multi-layer nebula system
    const nebulaData = [
      { x: 100, y: 80, r: 140, c1: 'rgba(120,0,220,0.08)', c2: 'rgba(120,0,220,0)', speed: 0.12 },
      { x: 400, y: 120, r: 120, c1: 'rgba(0,80,220,0.07)', c2: 'rgba(0,80,220,0)', speed: 0.15 },
      { x: 250, y: 200, r: 160, c1: 'rgba(220,0,120,0.06)', c2: 'rgba(220,0,120,0)', speed: 0.08 },
      { x: 500, y: 250, r: 130, c1: 'rgba(0,180,160,0.05)', c2: 'rgba(0,180,160,0)', speed: 0.1 },
      { x: 150, y: 300, r: 110, c1: 'rgba(180,60,200,0.05)', c2: 'rgba(180,60,200,0)', speed: 0.14 },
      { x: 350, y: 50, r: 150, c1: 'rgba(40,0,180,0.06)', c2: 'rgba(40,0,180,0)', speed: 0.09 },
      { x: 550, y: 160, r: 100, c1: 'rgba(200,100,0,0.04)', c2: 'rgba(200,100,0,0)', speed: 0.11 },
      { x: 80, y: 180, r: 130, c1: 'rgba(0,120,200,0.05)', c2: 'rgba(0,120,200,0)', speed: 0.13 },
    ];
    for (const n of nebulaData) {
      const nx = n.x + Math.sin(t * n.speed) * 30;
      const ny = n.y + Math.cos(t * n.speed * 0.8) * 20;
      const nr = n.r + Math.sin(t * 0.1) * 15;
      const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
      grad.addColorStop(0, n.c1);
      grad.addColorStop(0.6, n.c2);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // Milky way band - enhanced
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.translate(320, 200);
    ctx.rotate(-0.3);
    const milky = ctx.createLinearGradient(-350, -50, 350, 50);
    milky.addColorStop(0, 'transparent');
    milky.addColorStop(0.2, 'rgba(180,160,255,0.3)');
    milky.addColorStop(0.4, 'rgba(200,180,255,0.6)');
    milky.addColorStop(0.5, 'rgba(220,200,255,0.8)');
    milky.addColorStop(0.6, 'rgba(200,180,255,0.6)');
    milky.addColorStop(0.8, 'rgba(180,160,255,0.3)');
    milky.addColorStop(1, 'transparent');
    ctx.fillStyle = milky;
    ctx.fillRect(-400, -45, 800, 90);
    // Milky way dust
    for (let i = 0; i < 60; i++) {
      const dx = -350 + i * 12 + Math.sin(i * 0.5) * 8;
      const dy = -20 + Math.sin(i * 0.8 + t * 0.5) * 18;
      ctx.globalAlpha = 0.02 + Math.sin(t * 3 + i) * 0.01;
      ctx.fillStyle = '#ccbbff';
      ctx.fillRect(dx, dy, 1, 1);
    }
    ctx.restore();

    // Stars with twinkling - enhanced density
    this.stars.forEach((s, i) => {
      const tw = 0.3 + Math.sin(t * 3 + s.blink * 10) * 0.4 + Math.sin(t * 7 + i) * 0.2;
      ctx.globalAlpha = Math.max(0, Math.min(1, tw));
      const size = s.s * (0.8 + Math.sin(t * 2 + s.blink * 5) * 0.3);
      const starColors = ['#ffffff', '#aaccff', '#ffddaa', '#ccddff', '#ffeedd', '#ddeeff', '#ffccdd'];
      ctx.fillStyle = starColors[i % starColors.length];
      ctx.beginPath();
      ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
      ctx.fill();
      // Cross sparkle for bright stars
      if (size > 1.2) {
        ctx.globalAlpha *= 0.25;
        ctx.strokeStyle = starColors[i % starColors.length];
        ctx.lineWidth = 0.3;
        const sparkLen = size * 5;
        ctx.beginPath();
        ctx.moveTo(s.x - sparkLen, s.y);
        ctx.lineTo(s.x + sparkLen, s.y);
        ctx.moveTo(s.x, s.y - sparkLen);
        ctx.lineTo(s.x, s.y + sparkLen);
        ctx.stroke();
        // Glow halo
        ctx.globalAlpha *= 0.5;
        const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, size * 5);
        halo.addColorStop(0, starColors[i % starColors.length]);
        halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(s.x, s.y, size * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    // Distant planet with atmosphere
    ctx.save();
    const planetX = 520 + Math.sin(t * 0.05) * 5;
    const planetY = 95 + Math.cos(t * 0.03) * 3;
    const planetR = 32;
    // Atmosphere glow
    ctx.globalAlpha = 0.08;
    const atmoG = ctx.createRadialGradient(planetX, planetY, planetR, planetX, planetY, planetR + 15);
    atmoG.addColorStop(0, 'rgba(100,150,255,0.5)');
    atmoG.addColorStop(1, 'transparent');
    ctx.fillStyle = atmoG;
    ctx.beginPath();
    ctx.arc(planetX, planetY, planetR + 15, 0, Math.PI * 2);
    ctx.fill();
    // Planet body
    ctx.globalAlpha = 0.15;
    const pG = ctx.createRadialGradient(planetX - 10, planetY - 10, 0, planetX, planetY, planetR);
    pG.addColorStop(0, '#5599dd');
    pG.addColorStop(0.4, '#3366aa');
    pG.addColorStop(0.8, '#223366');
    pG.addColorStop(1, '#111133');
    ctx.fillStyle = pG;
    ctx.beginPath();
    ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
    ctx.fill();
    // Planet bands
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#6699cc';
    ctx.lineWidth = 1;
    for (let b = -2; b <= 2; b++) {
      ctx.beginPath();
      ctx.ellipse(planetX, planetY + b * 8, planetR - 3, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Planet ring
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#8899bb';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(planetX, planetY, 50, 9, -0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#aabbcc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(planetX, planetY, 55, 10, -0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Second smaller planet/moon
    ctx.save();
    ctx.globalAlpha = 0.08;
    const moonX = 120, moonY = 140;
    const mG = ctx.createRadialGradient(moonX - 3, moonY - 3, 0, moonX, moonY, 12);
    mG.addColorStop(0, '#aa7744');
    mG.addColorStop(0.8, '#664422');
    mG.addColorStop(1, '#332211');
    ctx.fillStyle = mG;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Shooting star (occasional)
    const shootPhase = (t * 0.3) % 4;
    if (shootPhase < 0.5) {
      const sp = shootPhase / 0.5;
      const sx = 50 + sp * 400;
      const sy = 30 + sp * 120;
      ctx.save();
      ctx.globalAlpha = (1 - sp) * 0.6;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - 30, sy - 10);
      ctx.stroke();
      ctx.globalAlpha *= 0.3;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(sx - 30, sy - 10);
      ctx.lineTo(sx - 60, sy - 20);
      ctx.stroke();
      ctx.restore();
    }

    // 3D perspective grid (cyan)
    ctx.strokeStyle = 'rgba(0,255,255,0.05)';
    ctx.lineWidth = 1;
    const vanishY = 190, vanishX = 320;
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 48 - 40, CANVAS_H);
      ctx.lineTo(vanishX, vanishY);
      ctx.stroke();
    }
    for (let i = 0; i < 10; i++) {
      const y = FLOOR_Y + i * 10;
      const sp = (y - vanishY) / (CANVAS_H - vanishY);
      ctx.beginPath();
      ctx.moveTo(vanishX - sp * 500, y);
      ctx.lineTo(vanishX + sp * 500, y);
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
      // Stage-colored ground shadows
      const shadowColors: Record<string, string> = {
        infierno: 'rgba(255,60,0,0.4)',
        cielo: 'rgba(255,215,0,0.3)',
        nada: 'rgba(80,0,120,0.3)',
        default: 'rgba(0,200,255,0.3)',
      };
      const sc = shadowColors[this.selectedStage] || shadowColors.default;
      ctx.fillStyle = sc;
      ctx.beginPath(); ctx.ellipse(this.p1!.x, FLOOR_Y, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(this.p2!.x, FLOOR_Y, 22, 6, 0, 0, Math.PI * 2); ctx.fill();

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
