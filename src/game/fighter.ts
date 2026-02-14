import { CHAR_DATA, GROUND_Y } from './constants';
import { FloatingText, PunchCircle } from './effects';
import type { Controls } from './types';

export class Fighter {
  id: number; charIdx: number; data: typeof CHAR_DATA[0]; skinId: string | null;
  x: number; y: number; vx: number; vy: number;
  isBlocking: boolean; blockCooldown: number; isDodging: boolean; dodgeCooldown: number;
  side: number; controls: Controls; isAI: boolean;
  hp: number; energy: number; rounds: number;
  isFlying: boolean; isGrounded: boolean;
  stun: number; isDashing: boolean; comboTimer: number;
  squashX: number; squashY: number; lean: number; animTimer: number;
  hitFlash: number; comboHits: number; blockTime: number; extremeCombo: number;
  handPhase: number; handOrder: number; handMode: string; handTimer: number;
  specialTrail: number;
  isTransformed: boolean; transformTimer: number; baseName: string;
  invulnTimer: number; isIntangible: boolean;
  damageBoost: number;

  constructor(id: number, charIdx: number, x: number, side: number, controls: Controls, isAI = false, skinId: string | null = null) {
    this.id = id; this.charIdx = charIdx;
    this.data = { ...CHAR_DATA[charIdx] }; this.skinId = skinId;
    this.x = x; this.y = 0; this.vx = 0; this.vy = 0;
    this.isBlocking = false; this.blockCooldown = 0;
    this.isDodging = false; this.dodgeCooldown = 0;
    this.side = side; this.controls = controls; this.isAI = isAI;
    this.hp = 100; this.energy = 0; this.rounds = 0;
    this.isFlying = false; this.isGrounded = true;
    this.stun = 0; this.isDashing = false; this.comboTimer = 0;
    this.squashX = 1; this.squashY = 1; this.lean = 0; this.animTimer = 0;
    this.hitFlash = 0; this.comboHits = 0; this.blockTime = 0; this.extremeCombo = 12;
    this.handPhase = Math.random() * Math.PI * 2; this.handOrder = 1;
    this.handMode = 'normal'; this.handTimer = 0; this.specialTrail = 0;
    this.isTransformed = false; this.transformTimer = 0; this.baseName = '';
    this.invulnTimer = 0; this.isIntangible = false; this.damageBoost = 1;
  }

  reset(x: number, side: number) {
    this.x = x; this.y = 0; this.vx = 0; this.vy = 0;
    this.side = side; this.hp = 100;
    this.isFlying = false; this.stun = 0; this.isDashing = false;
    this.comboTimer = 0; this.squashX = 1; this.squashY = 1;
    this.hitFlash = 0; this.comboHits = 0; this.blockTime = 0;
    this.handPhase = Math.random() * Math.PI * 2; this.handOrder = 1;
    this.handMode = 'normal'; this.handTimer = 0; this.specialTrail = 0;
  }

  isKaitoAsesino() { return this.charIdx === 1 && this.skinId === 'demonioBlanco2'; }
  isKaitoDemonio() { return this.charIdx === 1 && this.skinId === 'demonioBlanco'; }

  update(opp: Fighter, game: any, keys: Record<string, boolean>, justPressed: Record<string, boolean>, tapTracker: Record<string, any>) {
    if (this.stun > 0) { this.stun--; return; }
    if (game.timeStopped && game.timeStopper !== this) return;

    // Skin speed buffs
    if (this.isKaitoAsesino() || this.isKaitoDemonio()) this.data.speed = 10.5;

    // Transform tick
    if (this.isTransformed) {
      this.transformTimer--;
      if (this.transformTimer <= 0) {
        this.isTransformed = false;
        this.data.name = this.baseName;
      }
    }

    // Invuln tick
    if (this.isKaitoDemonio()) {
      if (this.invulnTimer > 0) {
        this.invulnTimer--;
        if (this.invulnTimer === 0) this.isIntangible = false;
      }
    }

    // Energy regen
    if (game.mode === 'training') this.energy = 300;
    else if (this.energy < 300 && !this.isBlocking) this.energy += 0.6;

    if (this.isBlocking) {
      this.energy -= 0.4; this.blockTime++;
      if (this.energy <= 0 || this.blockTime > 180) {
        this.isBlocking = false; this.blockCooldown = 60; this.blockTime = 0;
      }
    } else { this.blockTime = 0; }

    if (this.blockCooldown > 0) this.blockCooldown--;
    if (this.isAI) this.handleAI(opp, game); else this.handleInput(keys, justPressed, tapTracker, game);

    // Movement
    if (this.comboTimer > 0) { this.comboTimer--; this.vx = this.side * Math.max(6, this.data.speed * 1.2); }
    this.x += this.vx; this.y += this.vy;
    this.lean = (this.vx / 15) * 0.3;
    this.animTimer++;
    this.handPhase += 0.15;
    if (this.handTimer > 0) this.handTimer--; else this.handMode = 'normal';

    if (this.specialTrail > 0) {
      game.spawnParticles(this.x - this.side * 20, this.y, '#ffff00', 2, 2);
      this.specialTrail--;
    }

    // Physics
    if (!this.isFlying) {
      this.vy += 0.6; this.vx *= this.isDashing ? 0.95 : 0.8;
      if (this.y >= GROUND_Y) {
        if (!this.isGrounded) {
          this.squashX = 1.3; this.squashY = 0.7;
          game.spawnParticles(this.x, 425, '#888', 5, 2);
        }
        this.y = GROUND_Y; this.vy = 0; this.isGrounded = true;
      }
    } else {
      this.vx *= 0.92; this.vy *= 0.92;
      if (this.charIdx === 1) game.spawnParticles(this.x, this.y + 20, '#ffff00', 1, 2);
    }

    this.squashX += (1 - this.squashX) * 0.15;
    this.squashY += (1 - this.squashY) * 0.15;
    if (this.hitFlash > 0) this.hitFlash--;
    this.x = Math.max(30, Math.min(610, this.x));
    this.y = Math.max(30, Math.min(450, this.y));
  }

  handleInput(keys: Record<string, boolean>, justPressed: Record<string, boolean>, tapTracker: Record<string, any>, game: any) {
    const c = this.controls;
    this.isBlocking = keys[c.block] && this.energy > 0 && this.blockCooldown === 0;
    if (this.isBlocking) { this.handMode = 'block'; this.handTimer = 5; }

    if (justPressed[c.dodge] && this.dodgeCooldown === 0) {
      this.isDodging = true; this.dodgeCooldown = 40; this.vx = this.side * 20;
    }

    this.isDashing = (keys[c.left] && tapTracker[c.left]?.active) || (keys[c.right] && tapTracker[c.right]?.active);
    const currentSpeed = this.isDashing ? this.data.speed * 2.2 : this.data.speed;

    if (keys[c.left]) { this.vx = -currentSpeed; this.side = -1; }
    if (keys[c.right]) { this.vx = currentSpeed; this.side = 1; }

    if (this.isFlying) {
      if (keys[c.up]) this.vy = -currentSpeed;
      if (keys[c.down]) this.vy = currentSpeed;
    } else if (justPressed[c.up] && this.isGrounded) {
      this.vy = -14; this.isGrounded = false; this.squashX = 0.7; this.squashY = 1.3;
    }

    if (justPressed[c.hit]) this.attack('hit', game);
    if (justPressed[c.spec]) this.attack('special', game);
    if (justPressed[c.super]) this.attack('super', game);
    if (justPressed[c.ultra]) this.attack('ultra', game);

    if (this.dodgeCooldown > 0) this.dodgeCooldown--;
    if (this.isDodging && this.dodgeCooldown < 30) this.isDodging = false;
  }

  handleAI(opp: Fighter, game: any) {
    if (opp.comboHits >= 3 && this.energy > 10 && Math.random() < 0.7) this.isBlocking = true;
    else this.isBlocking = false;

    if (game.mode === 'training') return;
    const aggression = game.mode === 'survival' ? 0.05 * game.round : 0;
    const dx = opp.x - this.x; const dist = Math.hypot(dx, opp.y - this.y);
    if (Math.abs(dx) > 70) {
      this.side = Math.sign(dx);
      const dashProb = (dist > 250) ? 0.15 : 0.05;
      if (Math.random() < dashProb + aggression) this.vx = this.side * this.data.speed * 2.5;
      else this.vx = this.side * this.data.speed;
    }
    if (dist < 150 && Math.random() < 0.02) { this.vy = -12; this.isGrounded = false; }
    if (dist < 80 && Math.random() < 0.2 + aggression) this.attack('hit', game);
    if (dist > 100 && dist < 300 && Math.random() < 0.05 + aggression) this.attack('special', game);
    if (this.energy >= 100 && Math.random() < 0.02 + aggression) this.attack('super', game);
  }

  tryTransform(game: any) {
    if (this.charIdx !== 0 || this.energy < 300 || this.isTransformed) return;
    this.energy -= 300; this.isTransformed = true; this.transformTimer = 60 * 20;
    this.baseName = this.data.name; this.data.name = 'RAGE EDOWADO';
  }

  attack(type: string, game: any) {
    const opp = (this.id === 1) ? game.p2 : game.p1;
    const dist = Math.hypot(this.x - opp.x, this.y - opp.y);
    this.squashX = 1.1; this.squashY = 0.9;

    // Skin overrides
    if ((this.isKaitoAsesino() || this.isKaitoDemonio()) && type === 'super' && this.energy >= 100) {
      this.energy -= 100;
      this.x = opp.x - this.side * 40;
      opp.stun = 120;
      const fxColor = this.isKaitoDemonio() ? '#000000' : '#ff0000';
      game.spawnParticles(opp.x, opp.y, fxColor, 45, 3);
      game.spawnShockwave(opp.x, opp.y, fxColor);
      return;
    }
    if (this.isKaitoDemonio() && type === 'special' && this.energy >= 49.5) {
      this.energy -= 49.5; this.invulnTimer = 120; this.isIntangible = true; return;
    }
    if (this.isKaitoAsesino() && type === 'special') {
      this.energy -= 49.5; this.vx = this.side * 45; this.specialTrail = 60;
      if (dist < 120) { opp.takeDamage(4, true); }
      return;
    }

    // Transform overrides
    if (this.isTransformed && this.charIdx === 0) {
      if (type === 'hit') this.damageBoost = 1.6;
      if (type === 'special') {
        for (let i = 0; i < 3; i++) game.spawnProjectile(this.x, this.y - 10 + i * 10, this.side * 12, 0, '#ff0000', this, 'rhombus');
        return;
      }
      if (type === 'super') {
        this.x = opp.x - this.side * 40;
        for (let i = 0; i < 5; i++) { opp.takeDamage(2, true); game.spawnExplosion(opp.x, opp.y, '#ff0000'); }
        return;
      }
    }

    if (type === 'hit') {
      this.handMode = 'together'; this.handTimer = 12;
      const comboScale = Math.max(0.35, 1 - (this.comboHits * 0.08));
      const push = 8 + this.comboHits * 2.2;
      this.vx = this.side * 18;
      if (dist < 70 * comboScale && Math.abs(this.y - opp.y) < 50 * comboScale) {
        opp.takeDamage(0.8 * this.damageBoost, true);
        this.handOrder *= -1;
        opp.vx = this.side * push; opp.vy -= (3 + this.comboHits * 0.6);
        this.comboHits++;
        let label: string | null = null;
        if (this.comboHits >= 20) label = "EXTREME COMBO!";
        else if (this.comboHits >= 15) label = "ULTRA COMBO!";
        else if (this.comboHits >= 10) label = "HYPER COMBO!";
        else if (this.comboHits >= 8) label = "SUPER COMBO!";
        else if (this.comboHits >= 3) label = "COMBO!";
        if (label) game.texts.push(new FloatingText(this.x, this.y - 40, `${label} (${this.comboHits} HITS)`, '#ffff00'));
        game.hitStop = Math.min(6 + this.comboHits * 0.5, 14);
        game.shake = Math.min(8 + this.comboHits * 1.2, 45);
        this.handMode = 'normal';
        game.spawnParticles(opp.x, opp.y, '#fff', 22, 3);
        game.spawnShockwave(opp.x, opp.y, this.data.eyes);
        game.particles.push(new PunchCircle(opp.x, opp.y, this.data.eyes));
      }
      this.damageBoost = 1;
    } else if (type === 'special' && this.energy >= 49.5) {
      this.energy -= 49.5;
      game.spawnShockwave(this.x, this.y, this.charIdx === 1 ? '#ffff00' : '#00ffff');
      game.shake = 14; game.hitStop = 6;
      if (this.charIdx === 0) {
        game.spawnProjectile(this.x, this.y, this.side * 12, 0, '#00ffff', this, 'rhombus');
      } else {
        this.vx = this.side * 32; this.specialTrail = 45;
        game.spawnParticles(this.x, this.y, '#ffff00', 35, 3);
        if (dist < 65) {
          opp.takeDamage(4, true); opp.vx = this.side * 18; opp.vy = -10;
          game.spawnExplosion(opp.x, opp.y, '#ffff00');
          game.hitStop = 8; game.shake = 18;
        }
      }
    } else if (type === 'super' && this.energy >= 100) {
      this.energy -= 100; game.flashScreen();
      if (this.charIdx === 0) {
        if (dist < 110) { opp.takeDamage(8, true); game.shake = 28; game.hitStop = 14; game.spawnExplosion(opp.x, opp.y, '#ff0000'); }
      } else {
        this.handMode = 'slam'; this.handTimer = 20;
        game.spawnProjectile(this.x, this.y, 6, 6, '#ffff00', this, 'bounce');
      }
    } else if (type === 'ultra' && this.energy >= 300) {
      this.energy -= 300; game.flashScreen();
      if (this.charIdx === 0) game.spawnProjectile(this.x, this.y, 0, 0, '#ffffff', this, 'homing');
      else game.startTimeStop(this);
    }
  }

  takeDamage(dmg: number, canStun = true) {
    if (this.isDodging) return;
    if (this.isKaitoDemonio() && this.isIntangible) return;
    if (this.isBlocking) { dmg *= 0.5; canStun = false; }
    this.comboHits = 0; this.blockTime = 0;
    this.hp -= dmg; this.hp = Math.max(0, this.hp);
    if (canStun) { this.stun = 12; this.vx = -this.side * 6; this.vy = -3; }
    this.hitFlash = 6;
  }

  draw(ctx: CanvasRenderingContext2D, game: any) {
    ctx.save();

    // Block shield
    if (this.isBlocking) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.x, this.y, 32, 0, Math.PI * 2); ctx.stroke();
    }
    if (this.isDodging) ctx.globalAlpha = 0.5;
    if (this.isKaitoDemonio() && this.isIntangible) ctx.globalAlpha = 0.55;

    // Transform glow
    if (this.isTransformed && this.charIdx === 0) {
      ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 20;
    }

    ctx.translate(this.x, this.y);
    ctx.scale(this.side * this.squashX, this.squashY);
    ctx.rotate(this.lean * this.side);

    // Breathing
    if (Math.abs(this.vx) < 1 && Math.abs(this.vy) < 1) {
      const breath = Math.sin(this.animTimer * 0.1) * 0.03;
      ctx.scale(1, 1 + breath);
    }

    if (this.hitFlash > 0) { ctx.shadowBlur = 20; ctx.shadowColor = '#ffffff'; }
    if (game.timeStopped && game.timeStopper !== this) ctx.filter = 'grayscale(100%)';

    ctx.translate(-this.x, -this.y);

    // Draw character
    this._drawBody(ctx);
    this._drawHands(ctx, game);

    ctx.restore();
  }

  _drawBody(ctx: CanvasRenderingContext2D) {
    const demonio = this.skinId === 'demonioBlanco';
    const demonio2 = this.skinId === 'demonioBlanco2';

    if (this.charIdx === 0) { // EDOWADO
      ctx.beginPath(); ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
      ctx.fillStyle = '#f5deb3'; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); (ctx as any).roundRect(this.x - 25, this.y, 50, 11, 0);
      ctx.fillStyle = '#b00000'; ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(this.x, this.y + 11); ctx.scale(1, 0.6);
      ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI);
      ctx.fillStyle = '#000'; ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(this.x, this.y - 10); ctx.scale(1, 0.7);
      ctx.beginPath(); ctx.arc(0, 0, 22, Math.PI, 0);
      ctx.fillStyle = '#5a3a1a'; ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#00ffff'; const eyeX = this.x + 6;
      ctx.beginPath(); ctx.arc(eyeX - 4, this.y - 6, 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeX + 4, this.y - 6, 3, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
    } else if (this.charIdx === 1) { // KAITO
      ctx.beginPath(); ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
      ctx.fillStyle = demonio ? '#000000' : '#f5d1ad'; ctx.fill();
      ctx.strokeStyle = demonio ? '#222' : '#000'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); (ctx as any).roundRect(this.x - 25, this.y, 50, 11, 0);
      ctx.fillStyle = (demonio || demonio2) ? '#1a1a1a' : '#ffffff'; ctx.fill();
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.translate(this.x, this.y + 11); ctx.scale(1, 0.6);
      ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI);
      ctx.fillStyle = '#000'; ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(this.x, this.y - 10); ctx.scale(1, 0.7);
      ctx.beginPath(); ctx.arc(0, 0, 22, Math.PI, 0);
      ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#ffff00'; const eyeX = this.x + 6;
      ctx.beginPath(); ctx.arc(eyeX - 4, this.y - 6, 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeX + 4, this.y - 6, 3, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
    }
  }

  _drawHands(ctx: CanvasRenderingContext2D, game: any) {
    let lx = this.x + 18, rx = this.x + 30;
    let ly = this.y + 8, ry = this.y + 8;

    if (this.handMode === 'normal') {
      const swing = Math.sin(this.handPhase) * 6;
      lx += swing; rx -= swing;
      ly += Math.cos(this.handPhase * 1.3) * 3;
      ry += Math.sin(this.handPhase * 1.1) * 3;
    } else if (this.handMode === 'together') {
      lx = this.x + 22; rx = this.x + 28; ly = this.y + 2; ry = this.y + 10;
    } else if (this.handMode === 'strike') {
      rx += this.side * 18; ry += 6;
    } else if (this.handMode === 'slam') {
      ly = ry = this.y + 30;
    } else if (this.handMode === 'block') {
      lx = this.x + 34; rx = this.x + 40; ly = this.y - 4; ry = this.y + 8;
    }

    let handColor = '#f5d1ad';
    if (this.charIdx === 0) handColor = '#d4af37';
    if (this.skinId === 'demonioBlanco') handColor = '#000000';
    if (this.skinId === 'demonioBlanco2') handColor = '#444444';
    ctx.fillStyle = handColor;
    ctx.beginPath(); ctx.arc(lx, ly, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(rx, ry, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Hand hitbox
    const hx = this.x + 36, hy = this.y + 8, hr = 14;
    if (game.state === 'FIGHT') {
      const opp = (this.id === 1) ? game.p2 : game.p1;
      if (Math.hypot(hx - opp.x, hy - opp.y) < hr + 22 && this.handMode === 'strike') {
        opp.takeDamage(1, true);
        opp.vx = this.side * 6;
        game.spawnParticles(opp.x, opp.y, '#fff', 6, 2);
      }
    }
  }
}
