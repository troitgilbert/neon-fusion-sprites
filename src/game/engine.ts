import { Fighter } from './fighter';
import { Projectile } from './projectile';
import { Particle, Shockwave, FloatingText, PunchCircle } from './effects';
import { CHAR_DATA, CANVAS_W, CANVAS_H, CONTROLS, TRANSFORM_KEY, FLOOR_Y } from './constants';
import type { GameState, GameMode, StarData } from './types';

export class GameEngine {
  state: GameState = 'MENU';
  mode: GameMode = '';
  p1: Fighter | null = null;
  p2: Fighter | null = null;
  p1Choice: number | null = null;
  p2Choice: number | null = null;
  selectedStage = 'default';
  selectedSkins = { p1: null as string | null, p2: null as string | null };

  particles: (Particle | PunchCircle)[] = [];
  projectiles: Projectile[] = [];
  texts: FloatingText[] = [];
  shockwaves: Shockwave[] = [];
  stars: StarData[] = [];

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

  keys: Record<string, boolean> = {};
  justPressed: Record<string, boolean> = {};
  tapTracker: Record<string, any> = {};

  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  animFrameId = 0;

  // Callbacks
  onStateChange?: (state: GameState) => void;
  onCoinsChange?: (coins: number) => void;
  onAnnouncerText?: (text: string) => void;

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    // Load inventory
    try { this.inventory = JSON.parse(localStorage.getItem('inv') || '{}'); } catch { this.inventory = {}; }
    try { this.coins = parseInt(localStorage.getItem('coins') || '100'); } catch { this.coins = 100; }

    // Stars
    for (let i = 0; i < 80; i++) {
      this.stars.push({ x: Math.random() * CANVAS_W, y: Math.random() * CANVAS_H, s: Math.random() * 2, blink: Math.random() });
    }

    // Input
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

    this.loop();
  }

  destroy() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  _onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Escape') { this.togglePause(); return; }
    if (!this.keys[e.code]) this.justPressed[e.code] = true;
    this.keys[e.code] = true;

    // Double tap for flying
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

    // Transform
    if (this.state === 'FIGHT') {
      if (e.code === TRANSFORM_KEY.p1 && this.p1) this.p1.tryTransform(this);
      if (e.code === TRANSFORM_KEY.p2 && this.p2) this.p2.tryTransform(this);
    }
  };

  _onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
    if (this.tapTracker[e.code]) this.tapTracker[e.code].active = false;
  };

  setState(s: GameState, mode?: GameMode) {
    this.state = s;
    if (mode) this.mode = mode;
    this.onStateChange?.(s);
  }

  updatePrisms(amount: number) {
    this.coins += amount;
    localStorage.setItem('coins', String(this.coins));
    this.onCoinsChange?.(this.coins);
  }

  saveInv() { localStorage.setItem('inv', JSON.stringify(this.inventory)); }

  selectChar(idx: number) {
    if (this.p1Choice === null) {
      this.setState('SKIN_SELECT');
      return; // handled by UI
    } else if ((this.mode?.includes('versus') || this.mode === 'vs_cpu') && this.p2Choice === null) {
      this.setState('SKIN_SELECT');
      return;
    }
  }

  confirmSkinChoice(charIdx: number, skinId: string | null, pNum: number) {
    if (pNum === 1) {
      this.selectedSkins.p1 = skinId; this.p1Choice = charIdx;
      if (this.mode === 'survival' || this.mode === 'arcade' || this.mode === 'training') {
        this.p2Choice = (charIdx === 0) ? 1 : 0;
        if (this.mode === 'arcade') this.setState('STAGE_SELECT');
        else { this.selectedStage = 'default'; this.startMatch(charIdx, this.p2Choice!); }
      } else if (this.mode === 'versus' || this.mode === 'vs_cpu') {
        this.setState('SELECT');
      }
    } else {
      this.selectedSkins.p2 = skinId; this.p2Choice = charIdx;
      this.setState('STAGE_SELECT');
    }
  }

  selectStage(stageId: string) {
    this.selectedStage = stageId;
    this.startMatch(this.p1Choice!, this.p2Choice!);
  }

  startMatch(c1: number, c2: number) {
    this.round = 1;
    this.p1 = new Fighter(1, c1, 150, 1, CONTROLS.p1, false, this.selectedSkins.p1);
    const isAI = this.mode !== 'versus';
    if (this.mode === 'survival') { this.p1.rounds = 0; c2 = Math.random() > 0.5 ? 0 : 1; }
    this.p2 = new Fighter(2, c2, 490, -1, CONTROLS.p2, isAI, this.selectedSkins.p2);
    if (this.mode === 'training') { this.p2.hp = 9999; this.p2.energy = 0; }
    this.resetRound();
    this.setState('FIGHT');
  }

  resetRound() {
    if (!this.p1 || !this.p2) return;
    this.p1.x = 150; this.p1.y = 400; this.p1.vx = 0; this.p1.vy = 0;
    this.p2.x = 490; this.p2.y = 400; this.p2.vx = 0; this.p2.vy = 0;

    if (this.mode === 'survival') {
      if (this.round > 1) this.p1.hp = Math.min(100, this.p1.hp + 20);
      this.p2.hp = 100 + (this.round * 10);
      this.p2.charIdx = Math.random() > 0.5 ? 0 : 1;
    } else {
      this.p1.hp = 100; this.p2.hp = 100;
    }

    this.projectiles = []; this.texts = []; this.shockwaves = [];
    this.timer = 99; this.roundLocked = false;

    const roundText = this.mode === 'survival' ? `OLEADA ${this.round}` : `ROUND ${this.round}`;
    this.onAnnouncerText?.(roundText);
    setTimeout(() => { this.onAnnouncerText?.('¡LUCHEN!'); this.shake = 10; }, 1000);
    setTimeout(() => this.onAnnouncerText?.(''), 2000);
  }

  roundEnd(loser: Fighter) {
    if (this.roundLocked) return;
    this.roundLocked = true;
    const winner = (loser === this.p1) ? this.p2! : this.p1!;
    this.onAnnouncerText?.('K.O.');
    this.shake = 25;
    this.flashScreen();
    this.state = 'ROUND_OVER';

    setTimeout(() => {
      if (this.mode === 'survival') {
        if (winner === this.p1) {
          this.round++; this.updatePrisms(20); this.resetRound(); this.state = 'FIGHT';
        } else {
          this.onAnnouncerText?.('GAME OVER');
          setTimeout(() => { this.onAnnouncerText?.(''); this.setState('MENU'); }, 3000);
        }
      } else if (this.mode === 'training') {
        this.resetRound(); this.state = 'FIGHT';
      } else {
        winner.rounds++;
        if (winner.rounds === 2) {
          this.onAnnouncerText?.(`${CHAR_DATA[winner.charIdx].name} GANA!`);
          this.updatePrisms(10);
          setTimeout(() => { this.onAnnouncerText?.(''); this.setState('MENU'); }, 3000);
        } else {
          this.round = this.p1!.rounds + this.p2!.rounds + 1;
          this.resetRound(); this.state = 'FIGHT';
        }
      }
    }, 2000);
  }

  resume() { this.setState('FIGHT'); }
  restart() { if (this.p1Choice !== null && this.p2Choice !== null) this.startMatch(this.p1Choice, this.p2Choice); }
  goToMainMenu() { this.p1Choice = null; this.p2Choice = null; this.setState('MENU'); }
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
    // Demonio skin override
    if ((this.p1 && this.p1.isKaitoDemonio()) || (this.p2 && this.p2.isKaitoDemonio())) color = '#000000';
    for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y, color, 5, size));
  }
  spawnExplosion(x: number, y: number, color: string) {
    this.spawnParticles(x, y, color, 20, 4);
    this.shockwaves.push(new Shockwave(x, y, color));
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
    this.ctx.fillStyle = 'white'; this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
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

    // Check KO
    if (this.p1!.hp <= 0) this.roundEnd(this.p1!);
    if (this.p2!.hp <= 0) this.roundEnd(this.p2!);

    this.projectiles.forEach((p, i) => { p.update(p.owner.id === 1 ? this.p2! : this.p1!, this); if (!p.active) this.projectiles.splice(i, 1); });
    this.particles = this.particles.filter(p => { p.update(); return p.life > 0; });
    this.texts = this.texts.filter(t => { t.update(); return t.life > 0; });
    this.shockwaves = this.shockwaves.filter(s => { s.update(); return s.life > 0; });

    if (this.shake > 0) this.shake *= 0.9;
    if (this.shake < 0.5) this.shake = 0;
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const dx = (Math.random() - 0.5) * this.shake;
    const dy = (Math.random() - 0.5) * this.shake;

    ctx.save();
    const zoom = 1 + Math.min(this.shake / 120, 0.06);
    ctx.translate(320, 240); ctx.scale(zoom, zoom); ctx.translate(-320, -240);
    ctx.translate(dx, dy);

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    if (this.selectedStage === 'infierno') { bg.addColorStop(0, '#4b0000'); bg.addColorStop(1, '#1a0000'); }
    else if (this.selectedStage === 'cielo') { bg.addColorStop(0, '#87ceeb'); bg.addColorStop(1, '#fff9c4'); }
    else if (this.selectedStage === 'nada') { bg.addColorStop(0, '#000'); bg.addColorStop(1, '#050505'); }
    else { bg.addColorStop(0, '#0b0b2a'); bg.addColorStop(1, '#050510'); }
    ctx.fillStyle = bg; ctx.fillRect(-10, -10, 660, 500);

    // Stars
    this.stars.forEach(s => {
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.005 + s.blink) * 0.5;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(s.x, s.y, s.s, s.s);
    });
    ctx.globalAlpha = 1;

    // Floor
    ctx.shadowBlur = 20; ctx.shadowColor = 'rgba(0,255,255,0.5)';
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, FLOOR_Y); ctx.lineTo(CANVAS_W, FLOOR_Y); ctx.stroke();
    ctx.shadowBlur = 0;

    if (this.state === 'FIGHT' || this.state === 'PAUSED' || this.state === 'ROUND_OVER') {
      // Shadows
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.ellipse(this.p1!.x, FLOOR_Y, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(this.p2!.x, FLOOR_Y, 20, 5, 0, 0, Math.PI * 2); ctx.fill();

      this.p2!.draw(ctx, this);
      this.p1!.draw(ctx, this);
      this.projectiles.forEach(p => p.draw(ctx));
      this.shockwaves.forEach(s => s.draw(ctx));
      this.particles.forEach(p => p.draw(ctx));
      this.texts.forEach(t => t.draw(ctx));
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
