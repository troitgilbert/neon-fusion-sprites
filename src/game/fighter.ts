import { CHAR_DATA, GROUND_Y, CANVAS_W } from './constants';
import { FloatingText, PunchCircle, EnergyTrail, GiantFist } from './effects';
import { playHitSound, playSpecialSound, playBlockSound, playSuperSound } from './audio';
import type { Controls, CustomCharData } from './types';

const SPEED_MAP: Record<string, number> = { lento: 3.5, normal: 5, rapido: 7, velocista: 9.5 };
const SIZE_MAP: Record<string, number> = { 'pequeño': 0.75, normal: 1, grande: 1.3 };

export class Fighter {
  id: number; charIdx: number; data: typeof CHAR_DATA[0]; skinId: string | null;
  customData: CustomCharData | null;
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
  sizeScale: number;
  isBigBang: boolean;
  isCrouching: boolean;
  emoteTimer: number; emoteType: number;
  _lastHitFrame: number;
  _hookCombo: number;
  _pendingTemblor: boolean;
  _invocationActive: boolean;
  _invocationX: number;
  _invocationTimer: number;
  _pendingImpactoCristalico: boolean;
  constructor(id: number, charIdx: number, x: number, side: number, controls: Controls, isAI = false, skinId: string | null = null, customData: CustomCharData | null = null) {
    this.id = id; this.charIdx = charIdx;
    this.customData = customData;
    this.sizeScale = customData ? (SIZE_MAP[customData.size] || 1) : 1;
    if (customData) {
      this.data = { name: customData.name, color: customData.clothesColor, eyes: customData.eyesColor, speed: SPEED_MAP[customData.speed] || 5, weight: 1 };
    } else {
      this.data = { ...CHAR_DATA[Math.min(charIdx, CHAR_DATA.length - 1)] };
    }
    this.skinId = skinId;
    this.x = x; this.y = 0; this.vx = 0; this.vy = 0;
    this.isBlocking = false; this.blockCooldown = 0;
    this.isDodging = false; this.dodgeCooldown = 0;
    this.side = side; this.controls = controls; this.isAI = isAI;
    this.hp = 70; this.energy = 0; this.rounds = 0;
    this.isFlying = false; this.isGrounded = true;
    this.stun = 0; this.isDashing = false; this.comboTimer = 0;
    this.squashX = 1; this.squashY = 1; this.lean = 0; this.animTimer = 0;
    this.hitFlash = 0; this.comboHits = 0; this.blockTime = 0; this.extremeCombo = 12;
    this.handPhase = Math.random() * Math.PI * 2; this.handOrder = 1;
    this.handMode = 'normal'; this.handTimer = 0; this.specialTrail = 0;
    this.isTransformed = false; this.transformTimer = 0; this.baseName = '';
    this.invulnTimer = 0; this.isIntangible = false; this.damageBoost = 1;
    this.isBigBang = false;
    this.isCrouching = false;
    this.emoteTimer = 0; this.emoteType = 0;
    this._lastHitFrame = 0;
    this._hookCombo = 0;
    this._pendingTemblor = false;
    this._invocationActive = false;
    this._invocationX = 0;
    this._invocationTimer = 0;
    this._pendingImpactoCristalico = false;
  }

  reset(x: number, side: number) {
    this.x = x; this.y = 0; this.vx = 0; this.vy = 0;
    this.side = side; this.hp = 70;
    this.isFlying = false; this.stun = 0; this.isDashing = false;
    this.comboTimer = 0; this.squashX = 1; this.squashY = 1;
    this.hitFlash = 0; this.comboHits = 0; this.blockTime = 0;
    this.handPhase = Math.random() * Math.PI * 2; this.handOrder = 1;
    this.handMode = 'normal'; this.handTimer = 0; this.specialTrail = 0;
    this.isCrouching = false; this.emoteTimer = 0;
  }

  isKaitoAsesino() { return this.charIdx === 1 && this.skinId === 'demonioBlanco2'; }
  isKaitoDemonio() { return this.charIdx === 1 && this.skinId === 'demonioBlanco'; }

  update(opp: Fighter, game: any, keys: Record<string, boolean>, justPressed: Record<string, boolean>, tapTracker: Record<string, any>) {
    if (this.stun > 0) { this.stun--; return; }
    if (game.timeStopped && game.timeStopper !== this) return;

    // Skin speed buffs
    if (this.isKaitoAsesino() || this.isKaitoDemonio()) this.data.speed = 10.5;

    // Invuln tick
    if (this.isKaitoDemonio()) {
      if (this.invulnTimer > 0) {
        this.invulnTimer--;
        if (this.invulnTimer === 0) this.isIntangible = false;
      }
    }

    // Energy regen
    if (game.mode === 'training' && game.trainingEnergy === 'infinite') this.energy = 300;
    else if (game.mode === 'training' && game.trainingEnergy === 'none') this.energy = 0;
    else if (this.isBigBang) this.energy = 300; // Big Bang infinite energy
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
      const trailColor = this.customData ? this.customData.effectColor : '#ffff00';
      game.spawnParticles(this.x - this.side * 20, this.y, trailColor, 2, 2);
      this.specialTrail--;
    }

    // Invocación Cristal: ! marker moving forward
    if (this._invocationActive) {
      this._invocationTimer++;
      this._invocationX += this.side * 4;
      // Draw ! effect as particles
      game.spawnParticles(this._invocationX, this.y - 20, '#00ffff', 1, 2);
      // Check if reached edge
      if (this._invocationX < 20 || this._invocationX > CANVAS_W - 20) {
        // Release: spawn crystal upward from ! position
        game.spawnProjectile(this._invocationX, this.y, 0, -10, '#00ffff', this, 'crystal_rise');
        game.texts.push(new FloatingText(this._invocationX, this.y - 50, 'INVOCACIÓN CRISTAL', '#00ffff'));
        game.spawnParticles(this._invocationX, this.y, '#00ffff', 15, 3);
        this._invocationActive = false;
      }
      // Check if forward key released
      const fwdKey = this.id === 1
        ? (this.side === 1 ? 'KeyD' : 'KeyA')
        : (this.side === 1 ? 'ArrowRight' : 'ArrowLeft');
      if (!keys[fwdKey]) {
        // Release: spawn crystal upward from ! position
        game.spawnProjectile(this._invocationX, this.y, 0, -10, '#00ffff', this, 'crystal_rise');
        game.texts.push(new FloatingText(this._invocationX, this.y - 50, 'INVOCACIÓN CRISTAL', '#00ffff'));
        game.spawnParticles(this._invocationX, this.y, '#00ffff', 15, 3);
        this._invocationActive = false;
      }
    }

    // Physics
    if (!this.isFlying) {
      this.vy += 0.6; this.vx *= this.isDashing ? 0.95 : 0.8;
      if (this.y >= GROUND_Y) {
         if (!this.isGrounded) {
           this.squashX = 1.3; this.squashY = 0.7;
           game.spawnParticles(this.x, 425, '#888', 5, 2);
           // Temblor landing effect
            if (this._pendingTemblor) {
              this._pendingTemblor = false;
              const opp2 = (this.id === 1) ? game.p2 : game.p1;
              game.shake = 25;
              game.hitStop = 10;
              game.spawnShockwave(this.x, GROUND_Y, '#4488ff');
              game.spawnShockwave(this.x, GROUND_Y, '#00aaff');
              game.spawnParticles(this.x, GROUND_Y, '#4488ff', 30, 4);
              game.texts.push(new FloatingText(this.x, this.y - 50, 'TEMBLOR', '#4488ff'));
              playHitSound();
              const distToOpp = Math.abs(this.x - opp2.x);
              if (distToOpp < 160) {
                const dmg = 2.5 * this.damageBoost;
                opp2.takeDamage(dmg, true);
                game.trackStat('totalDamage', dmg);
                opp2.vy = -10;
                opp2.vx = (opp2.x > this.x ? 1 : -1) * 12;
                opp2.stun = 15;
                this.comboHits++;
                game.trackStat('comboMax', this.comboHits);
              }
              this.damageBoost = 1;
            }
            // Impacto Cristálico landing effect
            if (this._pendingImpactoCristalico) {
              this._pendingImpactoCristalico = false;
              game.shake = 30;
              game.hitStop = 12;
              game.texts.push(new FloatingText(this.x, this.y - 60, 'IMPACTO CRISTÁLICO', '#66bbff'));
              game.spawnProjectile(this.x, GROUND_Y, 0, 0, '#66bbff', this, 'crystal_pillar');
              game.spawnShockwave(this.x, GROUND_Y, '#66bbff');
              game.spawnParticles(this.x, GROUND_Y, '#88ccff', 40, 4);
              playSpecialSound();
            }
         }
         this.y = GROUND_Y; this.vy = 0; this.isGrounded = true;
      }
    } else {
      this.vx *= 0.92; this.vy *= 0.92;
      if (this.charIdx === 1) game.spawnParticles(this.x, this.y + 20, '#ffff00', 1, 2);
    }

    // Big Bang always flies
    if (this.isBigBang) {
      this.isFlying = true;
      this.y = Math.max(100, Math.min(350, this.y));
    }

    this.squashX += (1 - this.squashX) * 0.15;
    this.squashY += (1 - this.squashY) * 0.15;
    if (this.hitFlash > 0) this.hitFlash--;
    this.x = Math.max(30, Math.min(CANVAS_W - 30, this.x));
    this.y = Math.max(30, Math.min(450, this.y));
  }

  handleInput(keys: Record<string, boolean>, justPressed: Record<string, boolean>, tapTracker: Record<string, any>, game: any) {
    const c = this.controls;
    this.isBlocking = keys[c.block] && this.energy > 0 && this.blockCooldown === 0;
    if (this.isBlocking) { this.handMode = 'block'; this.handTimer = 5; }

    if (justPressed[c.dodge] && this.dodgeCooldown === 0) {
      this.isDodging = true; this.dodgeCooldown = 40; this.vx = this.side * 20;
    }

    // Emote
    if (justPressed[c.emote] && this.emoteTimer === 0) {
      this.emoteTimer = 90;
      this.emoteType = Math.floor(Math.random() * 4);
    }
    if (this.emoteTimer > 0) this.emoteTimer--;

    this.isDashing = (keys[c.left] && tapTracker[c.left]?.active) || (keys[c.right] && tapTracker[c.right]?.active);
    const currentSpeed = this.isDashing ? this.data.speed * 2.2 : this.data.speed;

    // Block movement during invocation
    if (!this._invocationActive) {
      if (keys[c.left]) { this.vx = -currentSpeed; this.side = -1; }
      if (keys[c.right]) { this.vx = currentSpeed; this.side = 1; }
    }

    // Crouch
    this.isCrouching = keys[c.down] && this.isGrounded && !this.isFlying && this.handTimer === 0;

    if (this.isFlying) {
      if (keys[c.up]) this.vy = -currentSpeed;
      if (keys[c.down]) this.vy = currentSpeed;
    } else if (justPressed[c.up] && this.isGrounded) {
      // Super jump if crouching
      const jumpForce = this.isCrouching ? -22 : -14;
      this.vy = jumpForce;
      this.isGrounded = false;
      this.isCrouching = false;
      this.squashX = 0.7; this.squashY = 1.3;
      if (jumpForce === -22) {
        game.spawnParticles(this.x, GROUND_Y, '#ffff00', 12, 3);
        game.texts.push(new FloatingText(this.x, this.y - 30, 'SUPER SALTO', '#ffff00'));
      }
    }

    // Directional hits for all characters
    if (justPressed[c.hit]) {
      if (!this.customData && !this.isGrounded && keys[c.down]) {
        // Air + Down + Hit = Temblor
        this.attack('temblor', game);
      } else if (!this.customData && !this.isGrounded) {
        const fwdKey = this.side === 1 ? c.right : c.left;
        if (keys[fwdKey]) {
          // Air + Forward + Hit = Gancho hacia abajo
          this.attack('air_hook_down', game);
        } else {
          this.attack('hit', game);
        }
      } else if (!this.customData && keys[c.down]) {
        this.attack('hook_down', game);
      } else if (!this.customData && keys[c.up]) {
        this.attack('uppercut', game);
      } else if (!this.customData) {
        const fwdKey = this.side === 1 ? c.right : c.left;
        if (keys[fwdKey]) {
          this.attack('hook_forward', game);
        } else {
          // Double tap hit detection - if hit again within 18 frames, throw other fist
          const now = this.animTimer;
          if (this._lastHitFrame && (now - this._lastHitFrame) < 18) {
            this.attack('hit', game);
            this._lastHitFrame = 0;
          } else {
            this.attack('hit', game);
            this._lastHitFrame = now;
          }
        }
      } else {
        this.attack('hit', game);
      }
    }
    if (justPressed[c.spec]) {
      if (!this.customData && this.charIdx === 0) {
        const fwdKey = this.side === 1 ? c.right : c.left;
        if (!this.isGrounded && keys[c.down]) {
          this.attack('crystal_descend', game);
        } else if (!this.isGrounded && keys[fwdKey]) {
          this.attack('crystal_impact', game);
        } else if (keys[fwdKey]) {
          this.attack('crystal_invocation', game);
        } else if (keys[c.down]) {
          this.attack('crystal_bounce_shot', game);
        } else if (keys[c.up]) {
          this.attack('crystal_curve_shot', game);
        } else {
          this.attack('special', game);
        }
      } else {
        this.attack('special', game);
      }
    }
    if (justPressed[c.super]) this.attack('super', game);
    if (justPressed[c.ultra]) this.attack('ultra', game);

    if (this.dodgeCooldown > 0) this.dodgeCooldown--;
    if (this.isDodging && this.dodgeCooldown < 30) this.isDodging = false;
  }

  handleAI(opp: Fighter, game: any) {
    if (opp.comboHits >= 3 && this.energy > 10 && Math.random() < 0.7) this.isBlocking = true;
    else this.isBlocking = false;

    if (game.mode === 'training' && game.trainingAI === 'dummy') return;
    
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
    if (this.energy >= 300 && Math.random() < 0.008 + aggression) this.attack('ultra', game);

    // Big Bang special AI
    if (this.isBigBang) {
      // Move vertically too
      if (Math.random() < 0.05) this.vy = (Math.random() - 0.5) * 8;
      // More frequent attacks
      if (this.energy >= 100 && Math.random() < 0.04) this.attack('special', game);
      if (this.energy >= 100 && Math.random() < 0.025) this.attack('super', game);
      if (this.energy >= 300 && Math.random() < 0.015) this.attack('ultra', game);
    }
  }

  // Removed Rage Edowado transform
  tryTransform(_game: any) {
    // Transformation system removed
  }

  attack(type: string, game: any) {
    const opp = (this.id === 1) ? game.p2 : game.p1;
    const dist = Math.hypot(this.x - opp.x, this.y - opp.y);
    this.squashX = 1.1; this.squashY = 0.9;

    // === BIG BANG ATTACKS ===
    if (this.isBigBang) {
      if (type === 'special' && this.energy >= 49.5) {
        this.energy -= 49.5;
        playSpecialSound();
        game.shake = 20;
        // 4 lightning rays from above with gaps between them
        game.texts.push(new FloatingText(this.x, this.y - 50, 'RAYOS DIVINOS', '#ffffff'));
        for (let i = 0; i < 4; i++) {
          const rx = 80 + i * 150;
          game.spawnBigBangLightning(rx);
        }
        game.trackStat('totalSpecials');
        return;
      }
      if (type === 'super' && this.energy >= 100) {
        this.energy -= 100;
        playSuperSound();
        game.flashScreen();
        game.shake = 25;
        // 20 bouncing white spheres
        game.texts.push(new FloatingText(this.x, this.y - 50, 'ESFERAS CAÓTICAS', '#ffffff'));
        for (let i = 0; i < 20; i++) {
          const angle = (Math.PI * 2 / 20) * i;
          const speed = 4 + Math.random() * 3;
          game.spawnProjectile(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed, '#ffffff', this, 'bigbang_bounce');
        }
        game.trackStat('totalSupers');
        return;
      }
      if (type === 'ultra' && this.energy >= 300) {
        this.energy -= 300;
        playSuperSound();
        game.flashScreen();
        game.shake = 40;
        // Attractor star in center - instant kill on contact
        game.texts.push(new FloatingText(320, 200, 'ESTRELLA ATRACTORA', '#ffff00'));
        game.spawnAttractorStar();
        game.trackStat('totalUltras');
        return;
      }
      // Big Bang basic hit - still deals damage
      if (type === 'hit' && dist < 80) {
        opp.takeDamage(2, true);
        opp.vx = this.side * 12;
        opp.vy = -8;
        game.spawnParticles(opp.x, opp.y, '#fff', 15, 3);
        game.spawnShockwave(opp.x, opp.y, '#ffffff');
        game.shake = 10;
        return;
      }
      return;
    }

    // Skin overrides for Kaito skins
    if ((this.isKaitoAsesino() || this.isKaitoDemonio()) && type === 'super' && this.energy >= 100) {
      this.energy -= 100;
      this.x = opp.x - this.side * 40;
      opp.stun = 120;
      const fxColor = this.isKaitoDemonio() ? '#000000' : '#ff0000';
      game.spawnParticles(opp.x, opp.y, fxColor, 45, 3);
      game.spawnShockwave(opp.x, opp.y, fxColor);
      game.trackStat('totalSupers');
      return;
    }
    if (this.isKaitoDemonio() && type === 'special' && this.energy >= 49.5) {
      this.energy -= 49.5; this.invulnTimer = 120; this.isIntangible = true;
      game.trackStat('totalSpecials');
      return;
    }
    if (this.isKaitoAsesino() && type === 'special') {
      this.energy -= 49.5; this.vx = this.side * 45; this.specialTrail = 60;
      if (dist < 120) { opp.takeDamage(4, true); game.trackStat('totalDamage', 4); }
      game.trackStat('totalSpecials');
      return;
    }

    // === CUSTOM CHARACTER ATTACKS ===
    if (this.customData && type !== 'hit') {
      const effectColor = this.customData.effectColor;
      const ability = type === 'special' ? this.customData.specialAbility : type === 'super' ? this.customData.superAbility : this.customData.ultraAbility;

      if (type === 'special' && this.energy >= 49.5) {
        this.energy -= 49.5;
        playSpecialSound();
        game.spawnShockwave(this.x, this.y, effectColor);
        game.shake = 14; game.hitStop = 6;
        game.texts.push(new FloatingText(this.x, this.y - 50, ability.toUpperCase(), effectColor));
        game.spawnProjectile(this.x, this.y, this.side * 11, 0, effectColor, this, 'rhombus');
        game.spawnParticles(this.x, this.y, effectColor, 25, 3);
        game.trackStat('totalSpecials');
        game.trackStat('totalDamage', 4);
        return;
      }

      if (type === 'super' && this.energy >= 100) {
        this.energy -= 100;
        playSuperSound();
        game.flashScreen();
        game.shake = 25; game.hitStop = 12;
        game.texts.push(new FloatingText(this.x, this.y - 50, ability.toUpperCase(), '#ffcc00'));
        if (dist < 120) {
          opp.takeDamage(8, true);
          opp.vx = this.side * 15; opp.vy = -12;
          game.trackStat('totalDamage', 8);
        }
        game.spawnExplosion(this.x + this.side * 40, this.y, effectColor);
        game.spawnParticles(this.x, this.y, effectColor, 40, 4);
        for (let i = 0; i < 3; i++) {
          game.spawnProjectile(this.x, this.y, this.side * (8 + i * 3), -3 + i * 3, effectColor, this, 'rhombus');
        }
        game.trackStat('totalSupers');
        return;
      }

      if (type === 'ultra' && this.energy >= 300) {
        this.energy -= 300;
        playSuperSound();
        game.flashScreen();
        game.shake = 40; game.hitStop = 18;
        game.texts.push(new FloatingText(this.x, this.y - 60, ability.toUpperCase(), '#ff4400'));
        if (dist < 150) {
          opp.takeDamage(20, true);
          opp.vx = this.side * 25; opp.vy = -18;
          game.trackStat('totalDamage', 20);
        }
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            game.spawnExplosion(this.x + this.side * (20 + i * 30), this.y - 10 + i * 5, effectColor);
          }, i * 80);
        }
        game.spawnParticles(this.x, this.y, effectColor, 60, 5);
        game.spawnProjectile(this.x, this.y, this.side * 6, 0, effectColor, this, 'homing');
        game.trackStat('totalUltras');
        return;
      }
    }

    // === DIRECTIONAL ATTACKS (all non-custom characters) ===

    // Air + Down + Hit = Temblor (ground slam, blue shockwave, screen shake, AoE)
    if (type === 'temblor') {
      this.vy = 28; // slam down fast
      this.handMode = 'slam'; this.handTimer = 20;
      // We set a flag so on landing we trigger the effect
      this._pendingTemblor = true;
      return;
    }

    // Air + Forward + Hit = Gancho hacia abajo (fist down, opponent sent down, blue energy)
    if (type === 'air_hook_down') {
      this.handMode = 'slam'; this.handTimer = 16;
      this.vx = this.side * 14;
      const giantFist = new GiantFist(this.x, this.y, this.side, 1, '#4488ff', 10, this);
      game.particles.push(giantFist);
      game.particles.push(new EnergyTrail(this.x + this.side * 10, this.y, '#4488ff', true));
      if (dist < 100 && Math.abs(this.y - opp.y) < 70) {
        const dmg = 1.8 * this.damageBoost;
        opp.takeDamage(dmg, true);
        game.trackStat('totalDamage', dmg);
        opp.vx = this.side * 4; opp.vy = 14; // sent downward
        opp.stun = 12;
        opp.isGrounded = false;
        if (this.charIdx === 1) {
          game.texts.push(new FloatingText(opp.x, opp.y - 30, 'CAÍDA MORTAL', '#4488ff'));
        } else {
          game.texts.push(new FloatingText(opp.x, opp.y - 30, 'GANCHO HACIA ABAJO', '#4488ff'));
        }
        game.spawnParticles(opp.x, opp.y, '#4488ff', 20, 3);
        game.particles.push(new PunchCircle(opp.x, opp.y, '#4488ff'));
        game.hitStop = 8; game.shake = 10;
        playHitSound();
        this.comboHits++;
        game.trackStat('comboMax', this.comboHits);
      }
      this.damageBoost = 1;
      return;
    }

    // Down + Hit = Daño Vital (paralyzes enemy 1 second, costs energy, NO crouch)
    if (type === 'hook_down') {
      if (this.energy < 40) return;
      this.energy -= 40;
      this.handMode = 'punch_left'; this.handTimer = 16;
      this.vx = this.side * 6;
      if (dist < 100 && Math.abs(this.y - opp.y) < 60) {
        const dmg = 0.8 * this.damageBoost;
        opp.takeDamage(dmg, true);
        game.trackStat('totalDamage', dmg);
        opp.vx = 0; opp.vy = 0;
        opp.stun = 60;
        if (this.charIdx === 1) {
          game.texts.push(new FloatingText(opp.x, opp.y - 30, 'PUNTO VITAL', '#ff00ff'));
          game.spawnParticles(opp.x, opp.y, '#ff00ff', 22, 3);
          game.particles.push(new PunchCircle(opp.x, opp.y, '#ff00ff'));
        } else {
          game.texts.push(new FloatingText(opp.x, opp.y - 30, 'DAÑO VITAL', '#00ff44'));
          game.spawnParticles(opp.x, opp.y, '#00ff44', 18, 3);
          game.particles.push(new PunchCircle(opp.x, opp.y, '#00ff44'));
        }
        game.hitStop = 10; game.shake = 8;
        playHitSound();
        this.comboHits++;
        game.trackStat('comboMax', this.comboHits);
      }
      this.damageBoost = 1;
      return;
    }

    // Forward + Hit = Gancho (alternating diagonal up/down fists, scaling knockback)
    if (type === 'hook_forward') {
      this._hookCombo++;
      const goUp = this._hookCombo % 2 === 1; // odd = up, even = down
      const diagonal = goUp ? -1 : 1;
      this.handMode = this.handOrder > 0 ? 'punch_left' : 'punch_right'; this.handTimer = 14;
      this.handOrder *= -1;
      this.vx = this.side * 16;
      const giantFist = new GiantFist(this.x, this.y, this.side, diagonal, '#d4af37', 10, this);
      game.particles.push(giantFist);
      if (dist < 130 && Math.abs(this.y - opp.y) < 60) {
        const dmg = 1.3 * this.damageBoost;
        opp.takeDamage(dmg, true);
        game.trackStat('totalDamage', dmg);
        const knockScale = Math.min(this._hookCombo * 0.5, 4); // more hits = more knockback
        opp.vx = this.side * (14 + knockScale * 3);
        opp.vy = goUp ? -(4 + knockScale * 2) : (2 + knockScale);
        opp.stun = 9;
        if (this.charIdx === 1) {
          game.texts.push(new FloatingText(opp.x, opp.y - 30, 'EMBESTIDA', '#ffaa00'));
          game.spawnParticles(opp.x, opp.y, '#ffaa00', 18, 3);
        } else {
          game.texts.push(new FloatingText(opp.x, opp.y - 30, 'GANCHO', '#ff4400'));
          game.spawnParticles(opp.x, opp.y, '#ff4400', 18, 3);
        }
        game.particles.push(new PunchCircle(opp.x, opp.y, this.data.eyes));
        game.hitStop = 6; game.shake = 10 + knockScale * 2;
        playHitSound();
        this.comboHits++;
        game.trackStat('comboMax', this.comboHits);
      } else {
        // Reset hook combo if miss
        this._hookCombo = 0;
      }
      this.damageBoost = 1;
      return;
    }

    // Up + Hit = Uppercut (stays on ground, fist goes up)
    if (type === 'uppercut') {
      this.handMode = 'uppercut_up'; this.handTimer = 20;
      this.vx = this.side * 4;
      // Attacker does NOT go up
      const giantFist = new GiantFist(this.x + this.side * 15, this.y - 20, this.side, -1, '#d4af37', 10, this);
      game.particles.push(giantFist);
      game.particles.push(new EnergyTrail(this.x + this.side * 10, this.y, '#4488ff', false));
      if (dist < 85 && Math.abs(this.y - opp.y) < 55) {
        const dmg = 1.5 * this.damageBoost;
        opp.takeDamage(dmg, true);
        game.trackStat('totalDamage', dmg);
        opp.vx = this.side * 5; opp.vy = -12;
        opp.stun = 10;
        opp.isGrounded = false;
        if (this.charIdx === 1) {
          game.texts.push(new FloatingText(opp.x, opp.y - 40, 'DESTELLO ASCENDENTE', '#ffffff'));
          game.spawnParticles(opp.x, opp.y - 10, '#ffffff', 20, 3);
          game.particles.push(new PunchCircle(opp.x, opp.y, '#ffffff'));
        } else {
          game.texts.push(new FloatingText(opp.x, opp.y - 40, 'UPPERCUT', '#ffff00'));
          game.spawnParticles(opp.x, opp.y - 10, '#4488ff', 18, 3);
          game.particles.push(new PunchCircle(opp.x, opp.y, '#4488ff'));
        }
        game.particles.push(new EnergyTrail(opp.x, opp.y, '#66aaff', false));
        game.hitStop = 7; game.shake = 12;
        playSuperSound();
        this.comboHits++;
        game.trackStat('comboMax', this.comboHits);
      }
      this.damageBoost = 1;
      return;
    }

    if (type === 'hit') {
      // Alternating hands for all characters
      this.handMode = this.handOrder > 0 ? 'punch_left' : 'punch_right';
      this.handTimer = 12;
      const comboScale = Math.max(0.35, 1 - (this.comboHits * 0.08));
      const push = 8 + this.comboHits * 2.2;
      this.vx = this.side * 18;
      if (dist < 70 * comboScale && Math.abs(this.y - opp.y) < 50 * comboScale) {
        const dmg = 0.8 * this.damageBoost;
        opp.takeDamage(dmg, true);
        game.trackStat('totalDamage', dmg);
        this.handOrder *= -1;
        opp.vx = this.side * push; opp.vy -= (3 + this.comboHits * 0.6);
        this.comboHits++;
        game.trackStat('comboMax', this.comboHits);
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
      playSpecialSound();
      game.spawnShockwave(this.x, this.y, this.charIdx === 1 ? '#ffff00' : '#00ffff');
      game.shake = 14; game.hitStop = 6;
      game.trackStat('totalSpecials');
      if (this.charIdx === 0) {
        game.texts.push(new FloatingText(this.x, this.y - 50, 'ROMBO CÓSMICO', '#00ffff'));
        game.spawnProjectile(this.x, this.y, this.side * 12, 0, '#00ffff', this, 'rhombus');
      } else {
        game.texts.push(new FloatingText(this.x, this.y - 50, 'ESTELA DORADA', '#ffff00'));
        this.vx = this.side * 32; this.specialTrail = 45;
        game.spawnParticles(this.x, this.y, '#ffff00', 35, 3);
        if (dist < 65) {
          opp.takeDamage(4, true); opp.vx = this.side * 18; opp.vy = -10;
          game.spawnExplosion(opp.x, opp.y, '#ffff00');
          game.hitStop = 8; game.shake = 18;
          game.trackStat('totalDamage', 4);
        }
      }
    } else if (type === 'super' && this.energy >= 100) {
      this.energy -= 100; game.flashScreen();
      game.trackStat('totalSupers');
      if (this.charIdx === 0) {
        game.texts.push(new FloatingText(this.x, this.y - 50, 'IMPACTO ROJO', '#ff0000'));
        if (dist < 110) { opp.takeDamage(8, true); game.shake = 28; game.hitStop = 14; game.spawnExplosion(opp.x, opp.y, '#ff0000'); game.trackStat('totalDamage', 8); }
      } else {
        game.texts.push(new FloatingText(this.x, this.y - 50, 'ESFERA REBOTANTE', '#ffff00'));
        this.handMode = 'slam'; this.handTimer = 20;
        game.spawnProjectile(this.x, this.y, 6, 6, '#ffff00', this, 'bounce');
      }
    } else if (type === 'ultra' && this.energy >= 300) {
      this.energy -= 300; game.flashScreen();
      game.trackStat('totalUltras');
      if (this.charIdx === 0) {
        game.texts.push(new FloatingText(this.x, this.y - 50, 'PERSECUCIÓN BLANCA', '#ffffff'));
        game.spawnProjectile(this.x, this.y, 0, 0, '#ffffff', this, 'homing');
      } else {
        game.texts.push(new FloatingText(this.x, this.y - 50, 'DETENCIÓN TEMPORAL', '#ffff00'));
        game.startTimeStop(this);
      }
    }
  }

  takeDamage(dmg: number, canStun = true) {
    if (this.isDodging) return;
    if (this.isKaitoDemonio() && this.isIntangible) return;
    if (this.isBlocking) { dmg *= 0.5; canStun = false; playBlockSound(); }
    else { playHitSound(); }
    this.comboHits = 0; this.blockTime = 0;
    this.hp -= dmg; this.hp = Math.max(0, this.hp);
    if (canStun) { this.stun = 12; this.vx = -this.side * 6; this.vy = -3; }
    this.hitFlash = 6;
  }

  draw(ctx: CanvasRenderingContext2D, game: any) {
    ctx.save();

    // Block shield (scaled to match smaller character)
    if (this.isBlocking) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.x, this.y, 22, 0, Math.PI * 2); ctx.stroke();
    }
    if (this.isDodging) ctx.globalAlpha = 0.5;
    if (this.isKaitoDemonio() && this.isIntangible) ctx.globalAlpha = 0.55;

    ctx.translate(this.x, this.y);
    ctx.scale(this.side * this.squashX, this.squashY);
    ctx.rotate(this.lean * this.side);

    // Breathing
    if (Math.abs(this.vx) < 1 && Math.abs(this.vy) < 1) {
      const breath = Math.sin(this.animTimer * 0.1) * 0.03;
      ctx.scale(1, 1 + breath);
    }

    // Crouching visual - squash down
    if (this.isCrouching) {
      ctx.scale(1.2, 0.65);
      ctx.translate(0, 12);
    }

    if (this.hitFlash > 0) { ctx.shadowBlur = 20; ctx.shadowColor = '#ffffff'; }
    if (game.timeStopped && game.timeStopper !== this) ctx.filter = 'grayscale(100%)';

    // Scale characters 30% smaller around their center
    ctx.translate(-this.x, -this.y);
    ctx.translate(this.x, this.y);
    ctx.scale(0.7, 0.7);
    ctx.translate(-this.x, -this.y);

    // Draw character
    this._drawBody(ctx);
    this._drawHands(ctx, game);

    ctx.restore();

    // Stage lighting overlay
    this._drawStageLighting(ctx, game);

    // Emote display
    if (this.emoteTimer > 0) {
      this._drawEmote(ctx);
    }
  }

  _drawStageLighting(ctx: CanvasRenderingContext2D, game: any) {
    const stage = game.selectedStage || 'default';
    ctx.save();

    // Stage temperature tint on character
    let tintColor = '';
    let tintAlpha = 0;
    let lightX = 0; // -1 left, 0 center, 1 right
    let lightY = -1; // -1 top, 1 bottom
    let rimColor = '';
    let rimAlpha = 0;

    if (stage === 'infierno') {
      tintColor = '#ff3300'; tintAlpha = 0.12;
      lightY = 1; // light from below (lava)
      rimColor = '#ff6600'; rimAlpha = 0.25;
    } else if (stage === 'cielo') {
      tintColor = '#ffeedd'; tintAlpha = 0.08;
      lightY = -1; // light from above (sun)
      rimColor = '#ffd700'; rimAlpha = 0.15;
    } else if (stage === 'nada') {
      tintColor = '#220033'; tintAlpha = 0.15;
      lightY = 0;
      rimColor = '#6633aa'; rimAlpha = 0.08;
    } else {
      // Galaxia
      tintColor = '#0044ff'; tintAlpha = 0.06;
      lightY = -1;
      rimColor = '#00ccff'; rimAlpha = 0.1;
    }

    // Ambient tint overlay
    ctx.globalAlpha = tintAlpha;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = tintColor;
    ctx.beginPath(); ctx.arc(this.x, this.y, 28, 0, Math.PI * 2); ctx.fill();

    // Directional light highlight
    ctx.globalCompositeOperation = 'screen';
    const hlY = this.y + lightY * -12;
    const hlGrad = ctx.createRadialGradient(this.x, hlY, 0, this.x, this.y, 30);
    hlGrad.addColorStop(0, rimColor);
    hlGrad.addColorStop(1, 'transparent');
    ctx.globalAlpha = rimAlpha * (0.8 + Math.sin(this.animTimer * 0.05) * 0.2);
    ctx.fillStyle = hlGrad;
    ctx.beginPath(); ctx.arc(this.x, this.y, 30, 0, Math.PI * 2); ctx.fill();

    // Rim light (edge glow)
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = rimAlpha * 0.5;
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.5;
    const rimAngle = lightY < 0 ? Math.PI * 0.8 : Math.PI * 1.8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 20, rimAngle - 0.8, rimAngle + 0.8);
    ctx.stroke();

    // Shadow on opposite side of light
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.08;
    const shadowGrad = ctx.createRadialGradient(this.x, this.y + lightY * 15, 5, this.x, this.y, 28);
    shadowGrad.addColorStop(0, '#000000');
    shadowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath(); ctx.arc(this.x, this.y, 28, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  _drawEmote(ctx: CanvasRenderingContext2D) {
    const isEdowado = this.charIdx === 0 && !this.customData;

    // Edowado raises his hand - no speech bubble, just a golden glow on raised fist
    if (isEdowado) {
      ctx.save();
      const fadeIn = Math.min(1, (90 - this.emoteTimer) / 10);
      const fadeOut = Math.min(1, this.emoteTimer / 10);
      ctx.globalAlpha = fadeIn * fadeOut * 0.6;
      // Golden sparkles around raised hand
      for (let i = 0; i < 3; i++) {
        const sx = this.x + 22 + (Math.random() - 0.5) * 16;
        const sy = this.y - 32 + (Math.random() - 0.5) * 16;
        ctx.fillStyle = '#ffe066';
        ctx.beginPath(); ctx.arc(sx, sy, 1.5 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      return;
    }

    ctx.save();
    const fadeIn = Math.min(1, (90 - this.emoteTimer) / 15);
    const fadeOut = Math.min(1, this.emoteTimer / 15);
    ctx.globalAlpha = fadeIn * fadeOut;

    const ex = this.x;
    const ey = this.y - 45 - Math.sin((90 - this.emoteTimer) * 0.1) * 5;

    // Bubble
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(ex, ey, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Triangle pointer
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(ex - 4, ey + 13);
    ctx.lineTo(ex + 2, ey + 13);
    ctx.lineTo(ex, ey + 20);
    ctx.fill();

    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const emotes = ['😤', '💪', '🔥', '⭐'];
    ctx.fillStyle = '#000';
    ctx.fillText(emotes[this.emoteType] || emotes[0], ex, ey);

    ctx.restore();
  }

  _drawBody(ctx: CanvasRenderingContext2D) {
    const demonio = this.skinId === 'demonioBlanco';
    const demonio2 = this.skinId === 'demonioBlanco2';

    // Big Bang - all white flying character
    if (this.isBigBang) {
      // Glow aura
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(this.animTimer * 0.08) * 0.15;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(this.x, this.y, 40, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Body
      ctx.beginPath(); ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2; ctx.stroke();
      // White clothes
      ctx.beginPath(); (ctx as any).roundRect(this.x - 25, this.y, 50, 11, 0);
      ctx.fillStyle = '#eeeeee'; ctx.fill(); ctx.stroke();
      // Pants
      ctx.save(); ctx.translate(this.x, this.y + 11); ctx.scale(1, 0.6);
      ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI);
      ctx.fillStyle = '#dddddd'; ctx.fill(); ctx.stroke(); ctx.restore();
      // Hair - white
      ctx.save(); ctx.translate(this.x, this.y - 10); ctx.scale(1, 0.7);
      ctx.beginPath(); ctx.arc(0, 0, 22, Math.PI, 0);
      ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke(); ctx.restore();
      // Eyes - bright white with glow
      ctx.fillStyle = '#ffff00'; const eyeX = this.x + 6;
      ctx.beginPath(); ctx.arc(eyeX - 4, this.y - 6, 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeX + 4, this.y - 6, 3, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
      // Flight particles
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 3; i++) {
        const px = this.x + (Math.random() - 0.5) * 40;
        const py = this.y + 20 + Math.random() * 10;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(px, py, 1 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      return;
    }

    // Custom character
    if (this.customData) {
      const s = this.sizeScale;
      const r = 25 * s;
      // Body ball
      ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fillStyle = this.customData.skinColor; ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
      // Clothes
      ctx.beginPath(); (ctx as any).roundRect(this.x - r, this.y, r * 2, r * 0.44, 0);
      ctx.fillStyle = this.customData.clothesColor; ctx.fill(); ctx.stroke();
      // Pants
      ctx.save(); ctx.translate(this.x, this.y + r * 0.44); ctx.scale(1, 0.6);
      ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI);
      ctx.fillStyle = this.customData.pantsColor; ctx.fill(); ctx.stroke(); ctx.restore();
      // Shoes
      ctx.fillStyle = this.customData.shoesColor;
      ctx.beginPath(); ctx.arc(this.x - r * 0.4, this.y + r * 0.85, r * 0.22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(this.x + r * 0.4, this.y + r * 0.85, r * 0.22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Hair - matching HTML reference style (at y-10, scale 0.7)
      ctx.save(); ctx.translate(this.x, this.y - 10 * s); ctx.scale(1, 0.7);
      ctx.beginPath(); ctx.arc(0, 0, 22 * s, Math.PI, 0);
      ctx.fillStyle = this.customData.hairColor; ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
      // Eyes
      ctx.fillStyle = this.customData.eyesColor;
      const eyeX = this.x + 6 * s;
      ctx.beginPath(); ctx.arc(eyeX - 4 * s, this.y - 6 * s, 3 * s, 0, Math.PI * 2);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeX + 4 * s, this.y - 6 * s, 3 * s, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
      // Effect aura
      if (this.specialTrail > 0) {
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = this.customData.effectColor; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(this.x, this.y, r * 1.6, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      return;
    }

    // === EXACT HTML REFERENCE STYLE ===
    if (this.charIdx === 0) { // EDOWADO
      // PIEL
      ctx.beginPath(); ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
      ctx.fillStyle = '#f5deb3'; ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
      // ROPA
      ctx.beginPath(); (ctx as any).roundRect(this.x - 25, this.y, 50, 11, 0);
      ctx.fillStyle = '#b00000'; ctx.fill(); ctx.stroke();
      // PANTALONES
      ctx.save(); ctx.translate(this.x, this.y + 11); ctx.scale(1, 0.6);
      ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI);
      ctx.fillStyle = '#000'; ctx.fill(); ctx.stroke(); ctx.restore();
      // PELO (exact HTML: translate y-10, scale 0.7, arc semicircle)
      ctx.save(); ctx.translate(this.x, this.y - 10); ctx.scale(1, 0.7);
      ctx.beginPath(); ctx.arc(0, 0, 22, Math.PI, 0);
      ctx.fillStyle = '#5a3a1a'; ctx.fill(); ctx.stroke(); ctx.restore();
      // OJOS
      ctx.fillStyle = '#00ffff'; const eyeX = this.x + 6;
      ctx.beginPath(); ctx.arc(eyeX - 4, this.y - 6, 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeX + 4, this.y - 6, 3, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
    } else if (this.charIdx === 1) { // KAITO
      // PIEL
      ctx.beginPath(); ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
      ctx.fillStyle = demonio ? '#000000' : '#f5d1ad'; ctx.fill();
      ctx.strokeStyle = demonio ? '#222' : '#000'; ctx.lineWidth = 2; ctx.stroke();
      // ROPA
      ctx.beginPath(); (ctx as any).roundRect(this.x - 25, this.y, 50, 11, 0);
      ctx.fillStyle = (demonio || demonio2) ? '#1a1a1a' : '#ffffff'; ctx.fill();
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 2; ctx.stroke();
      // PANTALONES
      ctx.save(); ctx.translate(this.x, this.y + 11); ctx.scale(1, 0.6);
      ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI);
      ctx.fillStyle = '#000'; ctx.fill(); ctx.stroke(); ctx.restore();
      // PELO (exact HTML: translate y-10, scale 0.7)
      ctx.save(); ctx.translate(this.x, this.y - 10); ctx.scale(1, 0.7);
      ctx.beginPath(); ctx.arc(0, 0, 22, Math.PI, 0);
      ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke(); ctx.restore();
      // OJOS
      ctx.fillStyle = '#ffff00'; const eyeX2 = this.x + 6;
      ctx.beginPath(); ctx.arc(eyeX2 - 4, this.y - 6, 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeX2 + 4, this.y - 6, 3, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
    }
  }

  _drawHands(ctx: CanvasRenderingContext2D, game: any) {
    let lx = this.x + 18, rx = this.x + 30;
    let ly = this.y + 8, ry = this.y + 8;
    const isEdowado = this.charIdx === 0 && !this.customData;
    const isKaito = this.charIdx === 1 && !this.customData;
    const moving = Math.abs(this.vx) >= 2;
    const running = this.isDashing;

    if (this.handMode === 'normal') {
      if (isEdowado) {
        // Boxer stance - hands up near face, slight bob and weave
        if (this.emoteTimer > 0) {
          // Emote: raise right hand up high
          lx = this.x + 16; ly = this.y - 4;
          rx = this.x + 22; ry = this.y - 32 - Math.sin(this.emoteTimer * 0.15) * 4;
        } else if (this.isFlying) {
          const bob = Math.sin(this.handPhase * 0.6) * 3;
          lx = this.x + 16; ly = this.y - 10 + bob;
          rx = this.x + 28; ry = this.y - 8 - bob * 0.7;
        } else if (running) {
          // Boxer sprint - alternating pumps
          const pump = Math.sin(this.handPhase * 2.2) * 10;
          lx = this.x + 18 + pump; ly = this.y - 10;
          rx = this.x + 22 - pump; ry = this.y - 6;
        } else if (moving) {
          // Boxer walk - guard up, slight weave
          const weave = Math.sin(this.handPhase * 1.4) * 3;
          const bob = Math.sin(this.handPhase * 1.8) * 2;
          lx = this.x + 16 + weave; ly = this.y - 12 + bob;
          rx = this.x + 26 - weave; ry = this.y - 8 - bob;
        } else {
          // Boxer idle - guard up, rhythmic bob
          const bob = Math.sin(this.handPhase * 0.9) * 2.5;
          const sway = Math.sin(this.handPhase * 0.45) * 1.5;
          lx = this.x + 15 + sway; ly = this.y - 12 + bob;
          rx = this.x + 27 - sway; ry = this.y - 9 - bob;
        }
      } else if (isKaito) {
        // Kaito: relaxed ninja stance
        if (this.isFlying) {
          const bob = Math.sin(this.handPhase * 0.5) * 4;
          lx = this.x + 12; ly = this.y + 4 + bob;
          rx = this.x + 32; ry = this.y + 4 - bob;
        } else if (running) {
          // Ninja run - arms trailing behind
          const pump = Math.sin(this.handPhase * 2.5) * 8;
          lx = this.x + 10 - Math.abs(pump); ly = this.y + 6;
          rx = this.x + 10 + Math.abs(pump); ry = this.y + 2;
        } else if (moving) {
          const swing = Math.sin(this.handPhase * 1.5) * 5;
          lx = this.x + 16 + swing; ly = this.y + 6;
          rx = this.x + 28 - swing; ry = this.y + 4;
        } else {
          const idle = Math.sin(this.handPhase * 0.6) * 2;
          lx = this.x + 14; ly = this.y + 6 + idle;
          rx = this.x + 30; ry = this.y + 4 - idle;
        }
      } else {
        const swing = Math.sin(this.handPhase) * 6;
        lx += swing; rx -= swing;
        ly += Math.cos(this.handPhase * 1.3) * 3;
        ry += Math.sin(this.handPhase * 1.1) * 3;
      }
    } else if (this.handMode === 'punch_left') {
      // Left hand punches forward, right stays back
      lx = this.x + 36; ly = this.y - 2;
      rx = this.x + 18; ry = this.y - 4;
    } else if (this.handMode === 'punch_right') {
      // Right hand punches forward, left stays back
      lx = this.x + 14; ly = this.y - 4;
      rx = this.x + 38; ry = this.y;
    } else if (this.handMode === 'together') {
      lx = this.x + 22; rx = this.x + 28; ly = this.y + 2; ry = this.y + 10;
    } else if (this.handMode === 'strike') {
      // Uppercut animation - fist sweeps UP with arc
      const t = this.handTimer / 18;
      const arcAngle = (1 - t) * Math.PI * 0.7; // sweeps from front to up
      rx = this.x + 20 + Math.cos(arcAngle) * 18;
      ry = this.y + 2 - Math.sin(arcAngle) * 24;
      lx = this.x + 16; ly = this.y - 4;
    } else if (this.handMode === 'slam') {
      // Hook down animation - fist slams DOWN
      rx = this.x + 28; ry = this.y + 18;
      lx = this.x + 16; ly = this.y - 4;
    } else if (this.handMode === 'slam_arc') {
      // Crescent arc: up → forward → down (media luna)
      const t = this.handTimer / 20; // 1 at start, 0 at end
      const arcAngle = t * Math.PI; // PI (up) → 0 (down)
      rx = this.x + 22 + Math.cos(arcAngle) * 6;
      ry = this.y - Math.sin(arcAngle) * 28;
      lx = this.x + 16; ly = this.y - 4;
    } else if (this.handMode === 'uppercut_up') {
      // Uppercut: fist goes straight up from body
      const t = this.handTimer / 20;
      rx = this.x + 22;
      ry = this.y - 10 - (1 - t) * 30; // fist rises upward
      lx = this.x + 16; ly = this.y - 4;
    } else if (this.handMode === 'block') {
      lx = this.x + 34; rx = this.x + 40; ly = this.y - 4; ry = this.y + 8;
    }

    let handColor = '#f5d1ad';
    if (this.customData) handColor = this.customData.handsColor;
    else if (this.charIdx === 0) handColor = '#d4af37';
    else if (this.isBigBang) handColor = '#ffffff';
    if (this.skinId === 'demonioBlanco') handColor = '#000000';
    if (this.skinId === 'demonioBlanco2') handColor = '#444444';
    ctx.fillStyle = handColor;
    ctx.beginPath(); ctx.arc(lx, ly, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(rx, ry, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Hand hitbox
    const hx = this.x + 36, hy = this.y + 8, hr = 14;
    if (game.state === 'FIGHT') {
      const opp = (this.id === 1) ? game.p2 : game.p1;
      if (Math.hypot(hx - opp.x, hy - opp.y) < hr + 22 && (this.handMode === 'slam_arc' || this.handMode === 'uppercut_up')) {
        opp.takeDamage(1, true);
        opp.vx = this.side * 6;
        game.spawnParticles(opp.x, opp.y, '#fff', 6, 2);
      }
    }
  }
}
