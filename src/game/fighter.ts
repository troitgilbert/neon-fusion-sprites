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
  _agarreActive: boolean;
  _agarreVx: number;
  _agarreVy: number;
  _agarreBounces: number;
  _pendingCohete: boolean;
  // Animation states
  introAnim: number; // 0 = done, >0 = frames remaining
  resultAnim: number; // 0 = none, >0 = frames
  resultType: 'win' | 'lose' | 'draw' | null;
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
    this._agarreActive = false;
    this._agarreVx = 0;
    this._agarreVy = 0;
    this._agarreBounces = 0;
    this._pendingCohete = false;
    this.introAnim = 90; // 1.5 seconds at 60fps
    this.resultAnim = 0;
    this.resultType = null;
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
    this._invocationActive = false; this._pendingImpactoCristalico = false;
    this._agarreActive = false; this._agarreVx = 0; this._agarreVy = 0; this._agarreBounces = 0;
    this.introAnim = 90;
    this.resultAnim = 0;
    this.resultType = null;
    this._pendingCohete = false;
  }

  isKaitoAsesino() { return this.charIdx === 1 && this.skinId === 'demonioBlanco2'; }
  isKaitoDemonio() { return this.charIdx === 1 && this.skinId === 'demonioBlanco'; }

  update(opp: Fighter, game: any, keys: Record<string, boolean>, justPressed: Record<string, boolean>, tapTracker: Record<string, any>) {
    if (this.stun > 0) { this.stun--; return; }
    if (game.timeStopped && game.timeStopper !== this) return;

    // Skin speed buffs
    if (this.isKaitoAsesino() || this.isKaitoDemonio()) this.data.speed = 10.5;

    // Invuln tick (for Kaito Demonio skin or dev chars with intangibility)
    if (this.invulnTimer > 0) {
      this.invulnTimer--;
      if (this.invulnTimer === 0) this.isIntangible = false;
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

    // Agarre bouncing movement
    if (this._agarreActive) {
      this.vx = this._agarreVx;
      this.vy = this._agarreVy;
      game.spawnParticles(this.x, this.y, '#ff4400', 2, 2);
      // Bounce off walls
      if (this.x < 40 || this.x > CANVAS_W - 40) {
        this._agarreVx *= -1;
        this._agarreBounces++;
        game.spawnParticles(this.x, this.y, '#ff0000', 10, 3);
      }
      // Bounce off top and ground
      if (this.y < 60 || this.y > GROUND_Y - 20) {
        this._agarreVy *= -1;
        this._agarreBounces++;
        game.spawnParticles(this.x, this.y, '#ff0000', 10, 3);
      }
      // Check collision with opponent
      const agDist = Math.hypot(this.x - opp.x, this.y - opp.y);
      if (agDist < 60) {
        // Grab success!
        this._agarreActive = false;
        game.texts.push(new FloatingText(this.x, this.y - 60, 'AGARRE', '#ff0000'));
        const dmg = 10 * this.damageBoost;
        opp.takeDamage(dmg, true);
        game.trackStat('totalDamage', dmg);
        opp.stun = 40;
        opp.vx = this.side * 20;
        opp.vy = -15;
        game.flashScreen();
        game.shake = 30;
        game.hitStop = 15;
        game.spawnExplosion(opp.x, opp.y, '#ff0000');
        game.spawnShockwave(opp.x, opp.y, '#ff0000');
        game.spawnParticles(opp.x, opp.y, '#ff4400', 40, 4);
        playHitSound();
        this.comboHits++;
        game.trackStat('comboMax', this.comboHits);
      }
      // Stop after 5 bounces
      if (this._agarreBounces >= 5) {
        this._agarreActive = false;
        this.vx = 0;
        this.vy = 0;
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
    const _devAtk = (this.customData as any)?._devAttacks;
    if (justPressed[c.hit]) {
      const fwdKey = this.side === 1 ? c.right : c.left;
      if (_devAtk) {
        // Dev character: route based on configured attacks
        if (!this.isGrounded && keys[c.down]) this.attack(_devAtk.airDownHit, game);
        else if (!this.isGrounded && keys[fwdKey]) this.attack(_devAtk.airForwardHit, game);
        else if (!this.isGrounded) this.attack('hit', game);
        else if (keys[c.down]) this.attack(_devAtk.downHit, game);
        else if (keys[c.up]) this.attack(_devAtk.upHit, game);
        else if (keys[fwdKey]) this.attack(_devAtk.forwardHit, game);
        else this.attack('hit', game);
      } else if (!this.customData && !this.isGrounded && keys[c.down]) {
        this.attack('temblor', game);
      } else if (!this.customData && !this.isGrounded) {
        if (keys[fwdKey]) this.attack('air_hook_down', game);
        else this.attack('hit', game);
      } else if (!this.customData && keys[c.down]) {
        this.attack('hook_down', game);
      } else if (!this.customData && keys[c.up]) {
        this.attack('uppercut', game);
      } else if (!this.customData) {
        if (keys[fwdKey]) {
          this.attack('hook_forward', game);
        } else {
          const now = this.animTimer;
          if (this._lastHitFrame && (now - this._lastHitFrame) < 18) {
            this.attack('hit', game); this._lastHitFrame = 0;
          } else {
            this.attack('hit', game); this._lastHitFrame = now;
          }
        }
      } else {
        this.attack('hit', game);
      }
    }
    if (justPressed[c.spec]) {
      const fwdKey = this.side === 1 ? c.right : c.left;
      if (_devAtk) {
        if (!this.isGrounded && keys[c.down]) this.attack(_devAtk.airDownSpecial, game);
        else if (!this.isGrounded && keys[fwdKey]) this.attack(_devAtk.airForwardSpecial, game);
        else if (keys[fwdKey]) this.attack(_devAtk.forwardSpecial, game);
        else if (keys[c.down]) this.attack(_devAtk.downSpecial, game);
        else if (keys[c.up]) this.attack(_devAtk.upSpecial, game);
        else this.attack(_devAtk.basicSpecial, game);
      } else if (!this.customData && this.charIdx === 0) {
        if (!this.isGrounded && keys[c.down]) this.attack('crystal_descend', game);
        else if (!this.isGrounded && keys[fwdKey]) this.attack('crystal_impact', game);
        else if (keys[fwdKey]) this.attack('crystal_invocation', game);
        else if (keys[c.down]) this.attack('crystal_bounce_shot', game);
        else if (keys[c.up]) this.attack('crystal_curve_shot', game);
        else this.attack('special', game);
      } else {
        this.attack('special', game);
      }
    }
    if (justPressed[c.super]) {
      const fwdKey = this.side === 1 ? c.right : c.left;
      if (_devAtk) {
        if (!this.isGrounded && keys[c.down]) this.attack(_devAtk.airDownSuper, game);
        else if (!this.isGrounded && keys[fwdKey]) this.attack(_devAtk.airForwardSuper, game);
        else if (keys[c.down]) this.attack(_devAtk.downSuper, game);
        else if (keys[c.up]) this.attack(_devAtk.upSuper, game);
        else if (keys[fwdKey]) this.attack(_devAtk.forwardSuper, game);
        else this.attack(_devAtk.basicSuper, game);
      } else if (!this.customData && this.charIdx === 0) {
        if (!this.isGrounded && keys[c.down]) this.attack('super_presion', game);
        else if (!this.isGrounded && keys[fwdKey]) this.attack('super_agarre', game);
        else if (keys[c.down]) this.attack('super_impulso', game);
        else if (keys[c.up]) this.attack('super_cohete', game);
        else if (keys[fwdKey]) this.attack('super_atraccion', game);
        else this.attack('super', game);
      } else {
        this.attack('super', game);
      }
    }
    if (justPressed[c.ultra]) {
      if (_devAtk) this.attack(_devAtk.ultra, game);
      else this.attack('ultra', game);
    }

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

    // === DEV CHARACTER ATTACKS (configured movesets) ===
    const devAttacks = (this.customData as any)?._devAttacks;
    if (devAttacks && type !== 'hit') {
      const ec = this.customData!.effectColor || '#ffffff';

      // --- HIT VARIANTS ---
      if (type === 'embestida') {
        this.handMode = 'punch_left'; this.handTimer = 16;
        this.vx = this.side * 28; this.specialTrail = 20;
        if (dist < 100) { const dmg = 1.5 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vx = this.side * 16; opp.vy = -6; opp.stun = 10; game.texts.push(new FloatingText(opp.x, opp.y - 30, 'EMBESTIDA', ec)); game.spawnParticles(opp.x, opp.y, ec, 20, 3); game.particles.push(new PunchCircle(opp.x, opp.y, ec)); game.hitStop = 8; game.shake = 12; playHitSound(); this.comboHits++; game.trackStat('comboMax', this.comboHits); }
        this.damageBoost = 1; return;
      }
      if (type === 'rush_combo') {
        this.handMode = this.handOrder > 0 ? 'punch_left' : 'punch_right'; this.handTimer = 10; this.handOrder *= -1;
        this.vx = this.side * 20;
        if (dist < 90) { const dmg = 1.0 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vx = this.side * 10; opp.stun = 6; game.texts.push(new FloatingText(opp.x, opp.y - 30, 'RÁFAGA', ec)); game.spawnParticles(opp.x, opp.y, ec, 15, 2); game.hitStop = 4; game.shake = 8; playHitSound(); this.comboHits++; game.trackStat('comboMax', this.comboHits); }
        this.damageBoost = 1; return;
      }
      if (type === 'palm_strike') {
        this.handMode = 'slam'; this.handTimer = 18;
        this.vx = this.side * 12;
        if (dist < 80) { const dmg = 1.2 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vx = this.side * 25; opp.stun = 14; game.texts.push(new FloatingText(opp.x, opp.y - 30, 'PALMAZO', ec)); game.spawnParticles(opp.x, opp.y, ec, 25, 4); game.spawnShockwave(opp.x, opp.y, ec); game.hitStop = 10; game.shake = 16; playHitSound(); this.comboHits++; game.trackStat('comboMax', this.comboHits); }
        this.damageBoost = 1; return;
      }
      if (type === 'rising_kick') {
        this.handMode = 'uppercut_up'; this.handTimer = 18;
        if (dist < 85) { const dmg = 1.4 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vy = -14; opp.vx = this.side * 4; opp.isGrounded = false; opp.stun = 12; game.texts.push(new FloatingText(opp.x, opp.y - 40, 'PATADA LUNAR', ec)); game.spawnParticles(opp.x, opp.y, ec, 20, 3); game.hitStop = 7; game.shake = 10; playHitSound(); this.comboHits++; game.trackStat('comboMax', this.comboHits); }
        this.damageBoost = 1; return;
      }
      if (type === 'sky_punch') {
        this.handMode = 'uppercut_up'; this.handTimer = 20;
        const gf = new GiantFist(this.x + this.side * 15, this.y - 20, this.side, -1, ec, 10, this);
        game.particles.push(gf);
        if (dist < 85) { const dmg = 1.6 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vy = -16; opp.vx = this.side * 6; opp.isGrounded = false; opp.stun = 12; game.texts.push(new FloatingText(opp.x, opp.y - 40, 'PUÑO CELESTE', ec)); game.spawnParticles(opp.x, opp.y, ec, 22, 3); game.hitStop = 8; game.shake = 14; playSuperSound(); this.comboHits++; game.trackStat('comboMax', this.comboHits); }
        this.damageBoost = 1; return;
      }
      if (type === 'sweep') {
        this.handMode = 'punch_left'; this.handTimer = 14;
        this.vx = this.side * 8;
        if (dist < 100 && opp.isGrounded) { const dmg = 1.2 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vy = -6; opp.vx = this.side * 8; opp.isGrounded = false; opp.stun = 18; game.texts.push(new FloatingText(opp.x, opp.y - 30, 'BARRIDA', ec)); game.spawnParticles(opp.x, GROUND_Y, ec, 20, 3); game.hitStop = 8; game.shake = 10; playHitSound(); this.comboHits++; game.trackStat('comboMax', this.comboHits); }
        this.damageBoost = 1; return;
      }
      if (type === 'ground_pound') {
        this.handMode = 'slam'; this.handTimer = 18;
        game.spawnShockwave(this.x, GROUND_Y, ec);
        game.spawnParticles(this.x, GROUND_Y, ec, 15, 3);
        if (dist < 120 && opp.isGrounded) { const dmg = 1.5 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vy = -10; opp.stun = 14; game.texts.push(new FloatingText(opp.x, opp.y - 30, 'IMPACTO BAJO', ec)); game.hitStop = 8; game.shake = 14; playHitSound(); this.comboHits++; game.trackStat('comboMax', this.comboHits); }
        this.damageBoost = 1; return;
      }
      if (type === 'patada_meteoro') {
        this.vy = 24; this.vx = this.side * 8;
        this.handMode = 'slam'; this.handTimer = 16;
        if (dist < 80) { const dmg = 2.0 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vy = 12; opp.stun = 14; game.texts.push(new FloatingText(opp.x, opp.y - 30, 'PATADA METEORO', ec)); game.spawnParticles(opp.x, opp.y, ec, 20, 3); game.hitStop = 8; game.shake = 14; playHitSound(); this.comboHits++; game.trackStat('comboMax', this.comboHits); }
        this.damageBoost = 1; return;
      }
      if (type === 'dive_bomb') {
        this.vy = 30; this.handMode = 'slam'; this.handTimer = 20;
        this._pendingTemblor = true;
        this.damageBoost = 1.5;
        return;
      }
      if (type === 'stomp') {
        this.vy = 26; this.handMode = 'slam'; this.handTimer = 18;
        this._pendingTemblor = true;
        return;
      }
      if (type === 'flying_kick') {
        this.vx = this.side * 22; this.handMode = 'punch_right'; this.handTimer = 16;
        if (dist < 100) { const dmg = 1.6 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vx = this.side * 14; opp.vy = -4; opp.stun = 10; game.texts.push(new FloatingText(opp.x, opp.y - 30, 'PATADA VOLADORA', ec)); game.spawnParticles(opp.x, opp.y, ec, 18, 3); game.hitStop = 7; game.shake = 10; playHitSound(); this.comboHits++; game.trackStat('comboMax', this.comboHits); }
        this.damageBoost = 1; return;
      }
      if (type === 'air_dash') {
        this.vx = this.side * 30; this.specialTrail = 15;
        if (dist < 80) { const dmg = 1.4 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vx = this.side * 18; opp.stun = 8; game.texts.push(new FloatingText(opp.x, opp.y - 30, 'EMBESTIDA AÉREA', ec)); game.spawnParticles(opp.x, opp.y, ec, 15, 3); game.hitStop = 6; game.shake = 8; playHitSound(); this.comboHits++; game.trackStat('comboMax', this.comboHits); }
        this.damageBoost = 1; return;
      }

      // --- SPECIAL VARIANTS ---
      if (type === 'wave_shot' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'ONDA CORTANTE', ec));
        game.spawnProjectile(this.x, this.y, this.side * 14, 0, ec, this, 'rhombus');
        game.spawnShockwave(this.x, this.y, ec); game.shake = 10;
        game.trackStat('totalSpecials'); return;
      }
      if (type === 'charge_rush' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        this.vx = this.side * 35; this.specialTrail = 40;
        game.texts.push(new FloatingText(this.x, this.y - 50, 'CARGA ESPECIAL', ec));
        game.spawnParticles(this.x, this.y, ec, 25, 3);
        if (dist < 100) { opp.takeDamage(4, true); opp.vx = this.side * 20; opp.vy = -8; game.spawnExplosion(opp.x, opp.y, ec); game.hitStop = 8; game.shake = 16; game.trackStat('totalDamage', 4); }
        game.trackStat('totalSpecials'); return;
      }
      if (type === 'estela_asesina' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        this.vx = this.side * 45; this.specialTrail = 60;
        game.texts.push(new FloatingText(this.x, this.y - 50, 'ESTELA ASESINA', ec));
        if (dist < 120) { opp.takeDamage(4, true); game.trackStat('totalDamage', 4); }
        game.trackStat('totalSpecials'); return;
      }
      if (type === 'intangibilidad' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        this.invulnTimer = 120; this.isIntangible = true;
        game.texts.push(new FloatingText(this.x, this.y - 50, 'INTANGIBILIDAD', ec));
        game.spawnParticles(this.x, this.y, ec, 20, 3);
        game.trackStat('totalSpecials'); return;
      }
      if (type === 'mine_drop' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'MINA', ec));
        game.spawnProjectile(this.x, GROUND_Y, 0, 0, ec, this, 'mine');
        game.trackStat('totalSpecials'); return;
      }
      if (type === 'counter' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        this.isBlocking = true; this.blockTime = 0; this.handMode = 'block'; this.handTimer = 60;
        this.damageBoost = 2.5;
        game.texts.push(new FloatingText(this.x, this.y - 50, 'CONTRAATAQUE', ec));
        game.spawnParticles(this.x, this.y, ec, 15, 3);
        game.trackStat('totalSpecials'); return;
      }
      if (type === 'estela_dorada' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        this.vx = this.side * 32; this.specialTrail = 45;
        game.texts.push(new FloatingText(this.x, this.y - 50, 'ESTELA DORADA', ec));
        game.spawnParticles(this.x, this.y, ec, 35, 3);
        if (dist < 65) { opp.takeDamage(4, true); opp.vx = this.side * 18; opp.vy = -10; game.spawnExplosion(opp.x, opp.y, ec); game.hitStop = 8; game.shake = 18; game.trackStat('totalDamage', 4); }
        game.trackStat('totalSpecials'); return;
      }
      if (type === 'rising_beam' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'RAYO ASCENDENTE', ec));
        game.spawnProjectile(this.x, this.y, 0, -14, ec, this, 'crystal_rise');
        game.spawnShockwave(this.x, this.y, ec); game.shake = 10;
        game.trackStat('totalSpecials'); return;
      }
      if (type === 'tornado' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        this.vy = -14; this.isGrounded = false;
        game.texts.push(new FloatingText(this.x, this.y - 50, 'TORNADO', ec));
        for (let i = 0; i < 12; i++) { const a = (Math.PI * 2 / 12) * i; game.spawnParticles(this.x + Math.cos(a) * 30, this.y + Math.sin(a) * 30, ec, 3, 3); }
        game.spawnShockwave(this.x, this.y, ec);
        if (dist < 100) { opp.takeDamage(3, true); opp.vy = -12; opp.stun = 15; game.trackStat('totalDamage', 3); }
        game.trackStat('totalSpecials'); return;
      }
      if (type === 'rain_shot' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'LLUVIA DE ENERGÍA', ec));
        for (let i = 0; i < 5; i++) game.spawnProjectile(this.x + (i - 2) * 20, this.y, 0, 8 + i, ec, this, 'crystal_descend');
        game.shake = 8; game.trackStat('totalSpecials'); return;
      }
      if (type === 'gravity_drop' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        this.vy = 25;
        game.texts.push(new FloatingText(this.x, this.y - 50, 'CAÍDA GRAVITACIONAL', ec));
        game.spawnShockwave(this.x, this.y, ec);
        this._pendingTemblor = true; this.damageBoost = 1.8;
        game.trackStat('totalSpecials'); return;
      }
      if (type === 'spike_ball' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'ESFERA DESCENDENTE', ec));
        game.spawnProjectile(this.x, this.y, 0, 10, ec, this, 'crystal_descend');
        game.shake = 6; game.trackStat('totalSpecials'); return;
      }
      if (type === 'air_rush' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        this.vx = this.side * 35; this.specialTrail = 30;
        game.texts.push(new FloatingText(this.x, this.y - 50, 'RUSH AÉREO', ec));
        game.spawnParticles(this.x, this.y, ec, 20, 3);
        if (dist < 100) { opp.takeDamage(4, true); opp.vx = this.side * 16; game.spawnExplosion(opp.x, opp.y, ec); game.hitStop = 7; game.shake = 12; game.trackStat('totalDamage', 4); }
        game.trackStat('totalSpecials'); return;
      }
      if (type === 'energy_lance' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'LANZA DE ENERGÍA', ec));
        game.spawnProjectile(this.x, this.y, this.side * 16, 0, ec, this, 'rhombus');
        game.shake = 8; game.trackStat('totalSpecials'); return;
      }
      if (type === 'comet' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        this.vx = this.side * 18; this.vy = 14; this.specialTrail = 25;
        game.texts.push(new FloatingText(this.x, this.y - 50, 'COMETA', ec));
        this._pendingImpactoCristalico = true;
        game.trackStat('totalSpecials'); return;
      }
      if (type === 'cristal' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'CRISTAL', ec));
        game.spawnProjectile(this.x, this.y, this.side * 12, 0, ec, this, 'rhombus');
        game.spawnShockwave(this.x, this.y, ec); game.shake = 14; game.hitStop = 6;
        game.trackStat('totalSpecials'); return;
      }
      if (type === 'estela_dorada_basic' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        this.vx = this.side * 32; this.specialTrail = 45;
        game.texts.push(new FloatingText(this.x, this.y - 50, 'ESTELA DORADA', ec));
        game.spawnParticles(this.x, this.y, ec, 35, 3);
        if (dist < 65) { opp.takeDamage(4, true); opp.vx = this.side * 18; opp.vy = -10; game.spawnExplosion(opp.x, opp.y, ec); game.hitStop = 8; game.shake = 18; game.trackStat('totalDamage', 4); }
        game.trackStat('totalSpecials'); return;
      }
      if (type === 'energy_ball' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'ESFERA DE ENERGÍA', ec));
        game.spawnProjectile(this.x, this.y, this.side * 10, 0, ec, this, 'rhombus');
        game.spawnShockwave(this.x, this.y, ec); game.shake = 10;
        game.trackStat('totalSpecials'); return;
      }
      if (type === 'shockwave_basic' && this.energy >= 49.5) {
        this.energy -= 49.5; playSpecialSound();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'ONDA DE CHOQUE', ec));
        game.spawnShockwave(this.x, this.y, ec); game.spawnShockwave(this.x, this.y, ec);
        game.spawnParticles(this.x, this.y, ec, 30, 4); game.shake = 16;
        if (dist < 130) { opp.takeDamage(3, true); opp.vx = (opp.x > this.x ? 1 : -1) * 14; opp.stun = 12; game.trackStat('totalDamage', 3); }
        game.trackStat('totalSpecials'); return;
      }

      // --- SUPER VARIANTS ---
      if (type === 'teletransporte_oscuro' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        this.x = opp.x - this.side * 40; opp.stun = 120;
        game.texts.push(new FloatingText(this.x, this.y - 50, 'TELETRANSPORTE OSCURO', ec));
        game.spawnParticles(opp.x, opp.y, ec, 45, 3); game.spawnShockwave(opp.x, opp.y, ec);
        game.trackStat('totalSupers'); return;
      }
      if (type === 'teletransporte_rojo' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        this.x = opp.x - this.side * 40; opp.stun = 80;
        const dmg = 6 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg);
        game.texts.push(new FloatingText(this.x, this.y - 50, 'TELETRANSPORTE ROJO', '#ff0000'));
        game.spawnParticles(opp.x, opp.y, '#ff0000', 40, 3); game.spawnShockwave(opp.x, opp.y, '#ff0000');
        game.shake = 20; game.hitStop = 10;
        game.trackStat('totalSupers'); return;
      }
      if (type === 'pillar_eruption' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'ERUPCIÓN', ec));
        for (let i = 0; i < 4; i++) { const px = this.x + this.side * (40 + i * 50); game.spawnProjectile(px, GROUND_Y, 0, 0, ec, this, 'crystal_pillar'); game.spawnParticles(px, GROUND_Y, ec, 10, 3); }
        game.shake = 22; game.hitStop = 10;
        game.trackStat('totalSupers'); return;
      }
      if (type === 'super_slam' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        this.handMode = 'slam'; this.handTimer = 25;
        game.texts.push(new FloatingText(this.x, this.y - 50, 'SÚPER IMPACTO', ec));
        game.spawnShockwave(this.x, GROUND_Y, ec); game.spawnShockwave(this.x, GROUND_Y, ec);
        game.spawnParticles(this.x, GROUND_Y, ec, 35, 4); game.shake = 28;
        if (dist < 150) { const dmg = 8 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vy = -18; opp.vx = (opp.x > this.x ? 1 : -1) * 12; opp.stun = 20; game.spawnExplosion(opp.x, opp.y, ec); game.hitStop = 14; }
        game.trackStat('totalSupers'); this.damageBoost = 1; return;
      }
      if (type === 'rising_dragon' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        this.vy = -22; this.isGrounded = false; this.handMode = 'uppercut_up'; this.handTimer = 25;
        game.texts.push(new FloatingText(this.x, this.y - 50, 'DRAGÓN ASCENDENTE', ec));
        for (let i = 0; i < 10; i++) game.spawnParticles(this.x + (Math.random() - 0.5) * 30, this.y + i * 8, ec, 3, 3);
        game.spawnShockwave(this.x, this.y, ec); game.shake = 18;
        if (dist < 90) { const dmg = 9 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vy = -20; opp.isGrounded = false; opp.stun = 20; game.spawnExplosion(opp.x, opp.y, ec); game.hitStop = 12; }
        game.trackStat('totalSupers'); this.damageBoost = 1; return;
      }
      if (type === 'sky_beam' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'RAYO CELESTIAL', ec));
        game.spawnProjectile(this.x, this.y, 0, -18, ec, this, 'crystal_rise');
        game.spawnProjectile(this.x, this.y, this.side * 2, -16, ec, this, 'crystal_rise');
        game.spawnShockwave(this.x, this.y, ec); game.shake = 20;
        game.trackStat('totalSupers'); return;
      }
      if (type === 'meteor_rise' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        this.vy = -25; this.isGrounded = false;
        game.texts.push(new FloatingText(this.x, this.y - 50, 'METEORO INVERSO', ec));
        for (let i = 0; i < 12; i++) game.spawnParticles(this.x + (Math.random() - 0.5) * 20, this.y + i * 6, ec, 4, 4);
        game.spawnExplosion(this.x, this.y, ec); game.shake = 22;
        if (dist < 100) { const dmg = 10 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vy = -22; opp.isGrounded = false; opp.stun = 22; game.hitStop = 14; }
        game.trackStat('totalSupers'); this.damageBoost = 1; return;
      }
      if (type === 'mega_rush' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        this.vx = this.side * 45; this.specialTrail = 50;
        game.texts.push(new FloatingText(this.x, this.y - 50, 'MEGA RUSH', ec));
        game.spawnParticles(this.x, this.y, ec, 30, 4); game.shake = 16;
        if (dist < 140) { const dmg = 8 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vx = this.side * 22; opp.vy = -10; opp.stun = 18; game.spawnExplosion(opp.x, opp.y, ec); game.hitStop = 12; }
        game.trackStat('totalSupers'); this.damageBoost = 1; return;
      }
      if (type === 'beam_cannon' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'CAÑÓN DE ENERGÍA', ec));
        for (let i = 0; i < 3; i++) game.spawnProjectile(this.x, this.y, this.side * (14 + i * 2), (i - 1) * 2, ec, this, 'rhombus');
        game.spawnShockwave(this.x, this.y, ec); game.shake = 20;
        game.trackStat('totalSupers'); return;
      }
      if (type === 'meteor_strike' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        this.vy = 28; this.handMode = 'slam'; this.handTimer = 22;
        game.texts.push(new FloatingText(this.x, this.y - 50, 'GOLPE METEORO', ec));
        game.spawnParticles(this.x, this.y, ec, 25, 4);
        this._pendingTemblor = true; this.damageBoost = 3;
        game.trackStat('totalSupers'); return;
      }
      if (type === 'gravity_crush' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'APLASTE GRAVITACIONAL', ec));
        game.spawnShockwave(this.x, this.y, ec); game.spawnShockwave(this.x, this.y, ec);
        if (dist < 160) { const dmg = 7 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vy = 20; opp.stun = 25; game.shake = 22; game.hitStop = 12; game.spawnExplosion(opp.x, opp.y, ec); }
        game.trackStat('totalSupers'); this.damageBoost = 1; return;
      }
      if (type === 'diving_fist' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        this.handMode = 'slam'; this.handTimer = 22;
        const gf = new GiantFist(this.x, this.y + 20, this.side, 1, ec, 25, this);
        game.particles.push(gf);
        game.texts.push(new FloatingText(this.x, this.y - 50, 'PUÑO DESCENDENTE', ec));
        game.spawnParticles(this.x, this.y, ec, 20, 4); game.shake = 18;
        if (dist < 120 && opp.y > this.y - 30) { const dmg = 9 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vy = 18; opp.stun = 18; game.spawnExplosion(opp.x, opp.y, ec); game.hitStop = 12; }
        game.trackStat('totalSupers'); this.damageBoost = 1; return;
      }
      if (type === 'homing_rush' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'RUSH PERSECUTOR', ec));
        const dx2 = opp.x - this.x; const dy2 = opp.y - this.y; const d2 = Math.hypot(dx2, dy2) || 1;
        this.vx = (dx2 / d2) * 30; this.vy = (dy2 / d2) * 30; this.specialTrail = 40;
        if (dist < 120) { const dmg = 8 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vx = this.side * 18; opp.vy = -12; opp.stun = 20; game.spawnExplosion(opp.x, opp.y, ec); game.hitStop = 10; game.shake = 18; }
        game.trackStat('totalSupers'); this.damageBoost = 1; return;
      }
      if (type === 'barrage' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'BARRERA', ec));
        this.handMode = 'punch_left'; this.handTimer = 30;
        if (dist < 100) { for (let i = 0; i < 6; i++) { setTimeout(() => { const dmg = 1.5; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); game.spawnParticles(opp.x + (Math.random()-0.5)*20, opp.y + (Math.random()-0.5)*20, ec, 5, 2); game.shake = 6; playHitSound(); }, i * 80); } }
        game.trackStat('totalSupers'); this.damageBoost = 1; return;
      }
      if (type === 'suplex_air' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'SUPLEX AÉREO', ec));
        if (dist < 80) { opp.vx = 0; opp.vy = 30; opp.stun = 30; const dmg = 10 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); game.spawnExplosion(opp.x, opp.y, ec); game.shake = 25; game.hitStop = 15; }
        game.trackStat('totalSupers'); this.damageBoost = 1; return;
      }
      if (type === 'impacto_rojo' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'IMPACTO ROJO', '#ff0000'));
        if (dist < 110) { opp.takeDamage(8, true); game.shake = 28; game.hitStop = 14; game.spawnExplosion(opp.x, opp.y, '#ff0000'); game.trackStat('totalDamage', 8); }
        game.trackStat('totalSupers'); return;
      }
      if (type === 'esfera_rebotante' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'ESFERA REBOTANTE', ec));
        game.spawnProjectile(this.x, this.y, 6, 6, ec, this, 'bounce');
        game.trackStat('totalSupers'); return;
      }
      if (type === 'mega_blast' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'MEGA EXPLOSIÓN', ec));
        game.spawnExplosion(this.x + this.side * 50, this.y, ec);
        game.spawnShockwave(this.x, this.y, ec); game.spawnShockwave(this.x, this.y, ec);
        game.spawnParticles(this.x, this.y, ec, 50, 5); game.shake = 30;
        if (dist < 140) { const dmg = 10 * this.damageBoost; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.vx = (opp.x > this.x ? 1 : -1) * 20; opp.vy = -14; opp.stun = 20; game.hitStop = 14; }
        game.trackStat('totalSupers'); this.damageBoost = 1; return;
      }
      if (type === 'chain_lightning' && this.energy >= 100) {
        this.energy -= 100; playSuperSound(); game.flashScreen();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'RELÁMPAGO ENCADENADO', ec));
        for (let i = 0; i < 5; i++) { const lx = 80 + i * 120; game.spawnProjectile(lx, 50, 0, 12, ec, this, 'crystal_descend'); }
        game.shake = 18; game.trackStat('totalSupers'); return;
      }

      // --- ULTRA VARIANTS ---
      if (type === 'persecucion_blanca' && this.energy >= 300) {
        this.energy -= 300; playSuperSound(); game.flashScreen();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'PERSECUCIÓN BLANCA', '#ffffff'));
        game.spawnProjectile(this.x, this.y, 0, 0, '#ffffff', this, 'homing');
        game.shake = 30; game.trackStat('totalUltras'); return;
      }
      if (type === 'detencion_temporal' && this.energy >= 300) {
        this.energy -= 300; playSuperSound(); game.flashScreen();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'DETENCIÓN TEMPORAL', ec));
        game.startTimeStop(this);
        game.shake = 30; game.trackStat('totalUltras'); return;
      }
      if (type === 'eclipse_negro' && this.energy >= 300) {
        this.energy -= 300; playSuperSound(); game.flashScreen();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'ECLIPSE NEGRO', '#000000'));
        game.shake = 40; game.hitStop = 20;
        for (let i = 0; i < 8; i++) { setTimeout(() => { game.spawnExplosion(opp.x + (Math.random()-0.5)*80, opp.y + (Math.random()-0.5)*60, '#000000'); game.shake = 15; }, i * 120); }
        if (dist < 200) { const dmg = 25; opp.takeDamage(dmg, true); game.trackStat('totalDamage', dmg); opp.stun = 60; opp.vx = this.side * 20; opp.vy = -15; }
        game.trackStat('totalUltras'); return;
      }
      if (type === 'juicio_final' && this.energy >= 300) {
        this.energy -= 300; playSuperSound(); game.flashScreen();
        game.texts.push(new FloatingText(this.x, this.y - 50, 'JUICIO FINAL', '#ff0000'));
        game.shake = 40;
        for (let i = 0; i < 10; i++) { setTimeout(() => { const ex = this.x + this.side * (30 + i * 40); game.spawnExplosion(ex, this.y - 10 + (Math.random()-0.5)*40, '#ff4400'); game.shake = 12; if (Math.abs(ex - opp.x) < 60 && Math.abs(this.y - opp.y) < 80) { opp.takeDamage(3, true); game.trackStat('totalDamage', 3); opp.stun = 10; } }, i * 100); }
        game.trackStat('totalUltras'); return;
      }

      // Fallback: if the attack ID matches an existing handler (Edowado/Kaito attacks), let it fall through
      // Otherwise use generic custom char behavior below
    }

    // === CUSTOM CHARACTER ATTACKS (non-dev) ===
    if (this.customData && !devAttacks && type !== 'hit') {
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

    // === EDOWADO DIRECTIONAL SPECIALS ===

    // Forward + Special: Invocación Cristal
    if (type === 'crystal_invocation' && this.energy >= 49.5) {
      this.energy -= 49.5;
      playSpecialSound();
      this._invocationActive = true;
      this._invocationX = this.x;
      this._invocationTimer = 0;
      this.vx = 0;
      game.trackStat('totalSpecials');
      return;
    }

    // Down + Special: Rebote Cristal (bouncing diagonal crystal 5s)
    if (type === 'crystal_bounce_shot' && this.energy >= 49.5) {
      this.energy -= 49.5;
      playSpecialSound();
      game.texts.push(new FloatingText(this.x, this.y - 50, 'REBOTE CRISTAL', '#00ffff'));
      game.spawnProjectile(this.x, this.y, this.side * 6, 5, '#00ddff', this, 'crystal_bounce');
      game.spawnShockwave(this.x, this.y, '#00ffff');
      game.shake = 10;
      game.trackStat('totalSpecials');
      return;
    }

    // Up + Special: Curved crystal toward enemy
    if (type === 'crystal_curve_shot' && this.energy >= 49.5) {
      this.energy -= 49.5;
      playSpecialSound();
      const dx = opp.x - this.x;
      const vxCurve = dx * 0.04;
      game.texts.push(new FloatingText(this.x, this.y - 50, 'CRISTAL CURVA', '#66bbff'));
      game.spawnProjectile(this.x, this.y, vxCurve, -12, '#66bbff', this, 'crystal_curve');
      game.spawnShockwave(this.x, this.y, '#66bbff');
      game.shake = 10;
      game.trackStat('totalSpecials');
      return;
    }

    // Air + Down + Special: Descenso Cristálico (2 diagonal downward crystals)
    if (type === 'crystal_descend' && this.energy >= 49.5) {
      this.energy -= 49.5;
      playSpecialSound();
      game.texts.push(new FloatingText(this.x, this.y - 50, 'DESCENSO CRISTÁLICO', '#00ccff'));
      game.spawnProjectile(this.x, this.y, -4, 8, '#00ccff', this, 'crystal_descend');
      game.spawnProjectile(this.x, this.y, 4, 8, '#00ccff', this, 'crystal_descend');
      game.spawnParticles(this.x, this.y, '#00ccff', 15, 3);
      game.shake = 8;
      game.trackStat('totalSpecials');
      return;
    }

    // Air + Forward + Special: Impacto Cristálico (slam + crystal pillar)
    if (type === 'crystal_impact' && this.energy >= 49.5) {
      this.energy -= 49.5;
      playSpecialSound();
      this.vy = 30; // slam down
      this._pendingImpactoCristalico = true;
      game.trackStat('totalSpecials');
      return;
    }

    // === EDOWADO DIRECTIONAL SUPERS ===

    // Down + Super: Impulso (ground hit, launches grounded enemies up)
    if (type === 'super_impulso' && this.energy >= 100) {
      this.energy -= 100;
      playSuperSound();
      game.flashScreen();
      game.shake = 20;
      game.texts.push(new FloatingText(this.x, this.y - 50, 'IMPULSO', '#ff4400'));
      this.handMode = 'slam'; this.handTimer = 20;
      game.spawnShockwave(this.x, GROUND_Y, '#ff4400');
      game.spawnParticles(this.x, GROUND_Y, '#ff6600', 25, 3);
      // Hits grounded enemy
      if (dist < 140 && opp.isGrounded) {
        const dmg = 7 * this.damageBoost;
        opp.takeDamage(dmg, true);
        game.trackStat('totalDamage', dmg);
        opp.vy = -22; // Launch up high
        opp.vx = (opp.x > this.x ? 1 : -1) * 5;
        opp.isGrounded = false;
        opp.stun = 20;
        game.spawnExplosion(opp.x, opp.y, '#ff4400');
        game.hitStop = 12;
        this.comboHits++;
        game.trackStat('comboMax', this.comboHits);
        playHitSound();
      }
      game.trackStat('totalSupers');
      this.damageBoost = 1;
      return;
    }

    // Up + Super: Cohete (red fire effects, upward punch, critical)
    if (type === 'super_cohete' && this.energy >= 100) {
      this.energy -= 100;
      playSuperSound();
      game.flashScreen();
      game.texts.push(new FloatingText(this.x, this.y - 50, 'COHETE', '#ff0000'));
      this.handMode = 'uppercut_up'; this.handTimer = 25;
      this.vy = -20; // Launch self up
      this.isGrounded = false;
      // Red fire trail
      for (let i = 0; i < 8; i++) {
        game.spawnParticles(this.x + (Math.random() - 0.5) * 30, this.y + i * 10, '#ff4400', 3, 3);
        game.spawnParticles(this.x + (Math.random() - 0.5) * 20, this.y + i * 8, '#ff0000', 2, 2);
      }
      game.spawnShockwave(this.x, this.y, '#ff0000');
      game.shake = 18;
      // Critical upward punch
      if (dist < 90 && opp.y <= this.y + 30) {
        const dmg = 10 * this.damageBoost; // Critical damage
        opp.takeDamage(dmg, true);
        game.trackStat('totalDamage', dmg);
        opp.vy = -25;
        opp.vx = this.side * 8;
        opp.isGrounded = false;
        opp.stun = 25;
        game.spawnExplosion(opp.x, opp.y, '#ff0000');
        game.texts.push(new FloatingText(opp.x, opp.y - 30, 'CRÍTICO!', '#ffff00'));
        game.hitStop = 15;
        game.shake = 25;
        this.comboHits++;
        game.trackStat('comboMax', this.comboHits);
        playHitSound();
      }
      game.trackStat('totalSupers');
      this.damageBoost = 1;
      return;
    }

    // Forward + Super: Atracción (blue aura, pulls enemy)
    if (type === 'super_atraccion' && this.energy >= 100) {
      this.energy -= 100;
      playSuperSound();
      game.flashScreen();
      game.texts.push(new FloatingText(this.x, this.y - 50, 'ATRACCIÓN', '#4488ff'));
      this.handMode = 'block'; this.handTimer = 30;
      // Blue aura around enemy
      game.spawnShockwave(opp.x, opp.y, '#4488ff');
      game.spawnShockwave(opp.x, opp.y, '#00aaff');
      game.spawnParticles(opp.x, opp.y, '#66bbff', 30, 3);
      game.shake = 12;
      // Pull enemy toward self
      opp.vx = (this.x - opp.x) * 0.3;
      opp.vy = (this.y - opp.y) * 0.2;
      opp.stun = 25;
      game.trackStat('totalSupers');
      this.damageBoost = 1;
      return;
    }

    // Air + Down + Super: Presión (big red energy fist downward)
    if (type === 'super_presion' && this.energy >= 100) {
      this.energy -= 100;
      playSuperSound();
      game.flashScreen();
      game.texts.push(new FloatingText(this.x, this.y - 50, 'PRESIÓN', '#ff0000'));
      this.handMode = 'slam'; this.handTimer = 20;
      // Spawn giant red fist going down
      const giantFist = new GiantFist(this.x, this.y + 20, this.side, 1, '#ff0000', 25, this);
      game.particles.push(giantFist);
      game.spawnParticles(this.x, this.y, '#ff4400', 20, 4);
      game.shake = 15;
      // Check hit below
      if (dist < 120 && opp.y > this.y - 30) {
        const dmg = 9 * this.damageBoost;
        opp.takeDamage(dmg, true);
        game.trackStat('totalDamage', dmg);
        opp.vy = 18; // Slam down
        opp.vx = this.side * 6;
        opp.stun = 18;
        game.spawnExplosion(opp.x, opp.y, '#ff0000');
        game.hitStop = 12;
        game.shake = 22;
        this.comboHits++;
        game.trackStat('comboMax', this.comboHits);
        playHitSound();
      }
      game.trackStat('totalSupers');
      this.damageBoost = 1;
      return;
    }

    // Air + Forward + Super: Agarre (bouncing self, grab on hit)
    if (type === 'super_agarre' && this.energy >= 100) {
      this.energy -= 100;
      playSuperSound();
      this._agarreActive = true;
      this._agarreVx = this.side * 18;
      this._agarreVy = 12;
      this._agarreBounces = 0;
      game.spawnParticles(this.x, this.y, '#ff4400', 20, 3);
      game.shake = 10;
      game.trackStat('totalSupers');
      // Note: "AGARRE" text only appears on hit
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
        game.texts.push(new FloatingText(this.x, this.y - 50, 'CRISTAL', '#00ffff'));
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
    // Handle intro animation for Edowado
    if (this.introAnim > 0 && this.charIdx === 0 && !this.customData) {
      this._drawIntroAnimation(ctx, game);
      this.introAnim--;
      return;
    }

    // Handle result animations
    if (this.resultAnim > 0 && this.charIdx === 0 && !this.customData) {
      this._drawResultAnimation(ctx, game);
      this.resultAnim--;
      return;
    }

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

  _drawIntroAnimation(ctx: CanvasRenderingContext2D, game: any) {
    const progress = 1 - (this.introAnim / 90); // 0 to 1
    ctx.save();

    // Edowado intro: Falls from above with golden aura, lands with impact pose
    const startY = -100;
    const endY = this.y;
    const fallProgress = Math.min(1, progress * 1.8); // Fast fall
    const currentY = startY + (endY - startY) * this._easeOutBounce(fallProgress);
    
    // Golden energy trail during fall
    if (progress < 0.6) {
      ctx.globalAlpha = 0.4 * (1 - progress);
      for (let i = 0; i < 5; i++) {
        const trailY = currentY - i * 20 - 10;
        if (trailY > startY) {
          const glow = ctx.createRadialGradient(this.x, trailY, 0, this.x, trailY, 25 - i * 4);
          glow.addColorStop(0, '#ffd700');
          glow.addColorStop(0.5, '#ff8800');
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.fillRect(this.x - 30, trailY - 30, 60, 60);
        }
      }
    }

    // Landing impact effects
    if (progress > 0.5 && progress < 0.7) {
      const impactProgress = (progress - 0.5) / 0.2;
      ctx.globalAlpha = 1 - impactProgress;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, endY + 15, 30 + impactProgress * 50, 0, Math.PI * 2);
      ctx.stroke();
      // Ground crack lines
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI - Math.PI / 2;
        const len = 20 + impactProgress * 40;
        ctx.beginPath();
        ctx.moveTo(this.x, endY + 15);
        ctx.lineTo(this.x + Math.cos(angle) * len, endY + 15 + Math.sin(angle) * len * 0.3);
        ctx.stroke();
      }
    }

    // Draw character
    ctx.globalAlpha = 1;
    ctx.translate(this.x, currentY);
    ctx.scale(this.side * 0.7, 0.7);
    
    // Squash on landing
    if (progress > 0.5 && progress < 0.65) {
      ctx.scale(1.3, 0.7);
    } else if (progress > 0.65 && progress < 0.8) {
      ctx.scale(0.9, 1.1);
    }

    ctx.translate(-this.x, -currentY);

    // Draw body
    this._drawEdowadoIntroBody(ctx, currentY, progress);

    ctx.restore();
  }

  _drawEdowadoIntroBody(ctx: CanvasRenderingContext2D, y: number, progress: number) {
    // Golden aura effect
    ctx.save();
    ctx.globalAlpha = 0.3 + Math.sin(this.animTimer * 0.15) * 0.15;
    const aura = ctx.createRadialGradient(this.x, y, 0, this.x, y, 45);
    aura.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
    aura.addColorStop(0.5, 'rgba(176, 0, 0, 0.2)');
    aura.addColorStop(1, 'transparent');
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(this.x, y, 45, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // PIEL
    ctx.beginPath(); ctx.arc(this.x, y, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#f5deb3'; ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();

    // ROPA
    ctx.beginPath(); (ctx as any).roundRect(this.x - 25, y, 50, 11, 0);
    ctx.fillStyle = '#b00000'; ctx.fill(); ctx.stroke();

    // PANTALONES
    ctx.save(); ctx.translate(this.x, y + 11); ctx.scale(1, 0.6);
    ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI);
    ctx.fillStyle = '#000'; ctx.fill(); ctx.stroke(); ctx.restore();

    // PELO
    ctx.save(); ctx.translate(this.x, y - 10); ctx.scale(1, 0.7);
    ctx.beginPath(); ctx.arc(0, 0, 22, Math.PI, 0);
    ctx.fillStyle = '#5a3a1a'; ctx.fill(); ctx.stroke(); ctx.restore();

    // OJOS - cyan glow during intro
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 10; ctx.shadowColor = '#00ffff';
    ctx.beginPath(); ctx.arc(this.x + 2, y - 6, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.x + 10, y - 6, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // MANOS - golden
    const handColor = '#d4af37';
    ctx.fillStyle = handColor;
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    
    if (progress < 0.5) {
      // Falling - both fists up
      ctx.beginPath(); ctx.arc(this.x - 20, y - 25, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(this.x + 20, y - 25, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else {
      // Landing - one fist down, one raised
      ctx.beginPath(); ctx.arc(this.x - 25, y + 10, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(this.x + 30, y - 20, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }

  _drawResultAnimation(ctx: CanvasRenderingContext2D, game: any) {
    const progress = 1 - (this.resultAnim / 120); // 0 to 1
    ctx.save();

    if (this.resultType === 'win') {
      this._drawWinAnimation(ctx, progress);
    } else if (this.resultType === 'lose') {
      this._drawLoseAnimation(ctx, progress);
    } else if (this.resultType === 'draw') {
      this._drawDrawAnimation(ctx, progress);
    }

    ctx.restore();
  }

  _drawWinAnimation(ctx: CanvasRenderingContext2D, progress: number) {
    // Victory pose: Edowado raises both fists, cyan energy around him
    const bounce = Math.sin(progress * Math.PI * 4) * 5 * (1 - progress);
    const y = this.y - bounce;

    // Expanding cyan/red rings
    for (let i = 0; i < 3; i++) {
      const ringProgress = (progress + i * 0.2) % 1;
      ctx.globalAlpha = 0.5 * (1 - ringProgress);
      ctx.strokeStyle = i % 2 === 0 ? '#00ffff' : '#b00000';
      ctx.lineWidth = 4 - ringProgress * 3;
      ctx.beginPath();
      ctx.arc(this.x, y, 30 + ringProgress * 80, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Sparkles
    ctx.globalAlpha = 1;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + progress * 3;
      const dist = 40 + Math.sin(progress * 8 + i) * 20;
      const sx = this.x + Math.cos(angle) * dist;
      const sy = y + Math.sin(angle) * dist * 0.6;
      ctx.fillStyle = i % 2 === 0 ? '#00ffff' : '#ffffff';
      ctx.beginPath(); ctx.arc(sx, sy, 2 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
    }

    // Body with victory stretch
    ctx.translate(this.x, y);
    ctx.scale(this.side * 0.7, 0.7 * (1 + Math.sin(progress * Math.PI) * 0.1));
    ctx.translate(-this.x, -y);

    // PIEL
    ctx.beginPath(); ctx.arc(this.x, y, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#f5deb3'; ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();

    // ROPA & PANTALONES
    ctx.beginPath(); (ctx as any).roundRect(this.x - 25, y, 50, 11, 0);
    ctx.fillStyle = '#b00000'; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(this.x, y + 11); ctx.scale(1, 0.6);
    ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI);
    ctx.fillStyle = '#000'; ctx.fill(); ctx.stroke(); ctx.restore();

    // PELO
    ctx.save(); ctx.translate(this.x, y - 10); ctx.scale(1, 0.7);
    ctx.beginPath(); ctx.arc(0, 0, 22, Math.PI, 0);
    ctx.fillStyle = '#5a3a1a'; ctx.fill(); ctx.stroke(); ctx.restore();

    // Happy eyes - closed in smile, cyan
    ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(this.x + 2, y - 6, 4, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(this.x + 10, y - 6, 4, Math.PI, 0); ctx.stroke();

    // Both fists raised high - golden
    ctx.fillStyle = '#d4af37';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    const fistY = y - 35 - Math.sin(progress * Math.PI * 6) * 5;
    ctx.beginPath(); ctx.arc(this.x - 25, fistY, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(this.x + 25, fistY, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  _drawLoseAnimation(ctx: CanvasRenderingContext2D, progress: number) {
    const fallProgress = Math.min(1, progress * 2);
    const kneelY = this.y + this._easeOutQuad(fallProgress) * 15;

    // Dark aura fading
    ctx.globalAlpha = 0.3 * (1 - progress);
    const darkAura = ctx.createRadialGradient(this.x, kneelY, 0, this.x, kneelY, 50);
    darkAura.addColorStop(0, 'rgba(50, 0, 0, 0.5)');
    darkAura.addColorStop(1, 'transparent');
    ctx.fillStyle = darkAura;
    ctx.fillRect(this.x - 60, kneelY - 60, 120, 120);

    ctx.globalAlpha = 1;
    ctx.translate(this.x, kneelY);
    ctx.scale(this.side * 0.7, 0.7 * (1 - fallProgress * 0.2));
    ctx.translate(-this.x, -kneelY);

    // PIEL - exact same
    ctx.beginPath(); ctx.arc(this.x, kneelY, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#f5deb3'; ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();

    // ROPA - exact same
    ctx.beginPath(); (ctx as any).roundRect(this.x - 25, kneelY, 50, 11, 0);
    ctx.fillStyle = '#b00000'; ctx.fill(); ctx.stroke();

    // PANTALONES
    ctx.save(); ctx.translate(this.x, kneelY + 11); ctx.scale(1.2, 0.4);
    ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI);
    ctx.fillStyle = '#000'; ctx.fill(); ctx.stroke(); ctx.restore();

    // PELO
    ctx.save(); ctx.translate(this.x, kneelY - 5); ctx.scale(1, 0.9);
    ctx.beginPath(); ctx.arc(0, 0, 22, Math.PI, 0);
    ctx.fillStyle = '#5a3a1a'; ctx.fill(); ctx.stroke(); ctx.restore();

    // OJOS closed/sad - exact cyan
    ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(this.x + 2, kneelY - 4, 3, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(this.x + 10, kneelY - 4, 3, 0, Math.PI); ctx.stroke();

    // MANOS - exact golden
    ctx.fillStyle = '#d4af37';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(this.x - 30, kneelY + 20, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(this.x + 30, kneelY + 20, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  _drawDrawAnimation(ctx: CanvasRenderingContext2D, progress: number) {
    const pulse = Math.sin(progress * Math.PI * 4) * 0.1;

    // Gray pulsing aura
    ctx.globalAlpha = 0.2 + pulse;
    const grayAura = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 50);
    grayAura.addColorStop(0, 'rgba(150, 150, 150, 0.4)');
    grayAura.addColorStop(1, 'transparent');
    ctx.fillStyle = grayAura;
    ctx.fillRect(this.x - 60, this.y - 60, 120, 120);

    ctx.globalAlpha = 1;
    ctx.translate(this.x, this.y);
    ctx.scale(this.side * 0.7, 0.7);
    ctx.translate(-this.x, -this.y);

    // PIEL - exact same
    ctx.beginPath(); ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#f5deb3'; ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();

    // ROPA - exact same
    ctx.beginPath(); (ctx as any).roundRect(this.x - 25, this.y, 50, 11, 0);
    ctx.fillStyle = '#b00000'; ctx.fill(); ctx.stroke();

    // PANTALONES
    ctx.save(); ctx.translate(this.x, this.y + 11); ctx.scale(1, 0.6);
    ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI);
    ctx.fillStyle = '#000'; ctx.fill(); ctx.stroke(); ctx.restore();

    // PELO
    ctx.save(); ctx.translate(this.x, this.y - 10); ctx.scale(1, 0.7);
    ctx.beginPath(); ctx.arc(0, 0, 22, Math.PI, 0);
    ctx.fillStyle = '#5a3a1a'; ctx.fill(); ctx.stroke(); ctx.restore();

    // OJOS half-closed - exact cyan
    ctx.fillStyle = '#00ffff';
    const eyeX = this.x + 6;
    ctx.beginPath(); ctx.arc(eyeX - 4, this.y - 6, 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeX + 4, this.y - 6, 3, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
    // Eyelids half-closed
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(eyeX - 7, this.y - 10, 6, 4);
    ctx.fillRect(eyeX + 1, this.y - 10, 6, 4);

    // Arms crossed - exact golden
    ctx.fillStyle = '#d4af37';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(this.x - 8, this.y + 5, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(this.x + 8, this.y + 5, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  // Easing functions
  _easeOutBounce(t: number): number {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  }

  _easeOutQuad(t: number): number {
    return t * (2 - t);
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

    // Dev stage lighting
    if (game.devStageData) {
      const ds = game.devStageData;
      tintColor = ds.ambientColor || '#4488ff';
      tintAlpha = (ds.lightIntensity || 0.3) * 0.3;
      lightY = -1;
      rimColor = ds.lightColor || '#ffffff';
      rimAlpha = (ds.lightIntensity || 0.3) * 0.4;
    } else if (stage === 'infierno') {
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
