import type { Fighter } from './fighter';
import { GROUND_Y, CANVAS_W } from './constants';

export class Projectile {
  x: number; y: number; vx: number; vy: number;
  color: string; owner: Fighter; type: string;
  active: boolean; life: number; angle: number;

  constructor(x: number, y: number, vx: number, vy: number, color: string, owner: Fighter, type: string) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.color = color; this.owner = owner; this.type = type;
    this.active = true;
    this.life = type === 'crystal_bounce' ? 300 : 200;
    this.angle = 0;
  }

  update(opponent: Fighter, game: any) {
    if (this.type === 'homing') {
      const dx = opponent.x - this.x, dy = opponent.y - this.y;
      const angle = Math.atan2(dy, dx);
      this.vx += Math.cos(angle) * 0.4; this.vy += Math.sin(angle) * 0.4;
      const speed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
      if (speed > 7) { this.vx = (this.vx / speed) * 7; this.vy = (this.vy / speed) * 7; }
      game.spawnParticles(this.x, this.y, this.color, 1, 1);
    }
    if (this.type === 'bounce' || this.type === 'crystal_bounce') {
      if (this.x < 10 || this.x > CANVAS_W - 10) { this.vx *= -1; game.spawnParticles(this.x, this.y, this.color, 5); }
      if (this.y < 10 || this.y > GROUND_Y + 20) { this.vy *= -1; game.spawnParticles(this.x, this.y, this.color, 5); }
      this.angle += 0.2;
    }
    if (this.type === 'crystal_curve') {
      // Curved arc toward target
      this.vy += 0.3; // gravity arc
      game.spawnParticles(this.x, this.y, this.color, 1, 1);
    }
    if (this.type === 'crystal_rise') {
      // Crystal rising upward then fading
      game.spawnParticles(this.x, this.y, this.color, 1, 2);
    }
    if (this.type === 'crystal_descend') {
      game.spawnParticles(this.x, this.y, this.color, 1, 1);
    }
    if (this.type === 'crystal_pillar') {
      // Stationary pillar, just fades
      this.vx = 0; this.vy = 0;
      game.spawnParticles(this.x, this.y - 20, this.color, 2, 2);
    }
    this.x += this.vx; this.y += this.vy; this.life--;
    if (this.life <= 0) this.active = false;

    if (Math.hypot(this.x - opponent.x, this.y - opponent.y) < (this.type === 'crystal_pillar' ? 50 : 35)) {
      const dmg = this.type === 'homing' ? 0.2 : this.type === 'crystal_pillar' ? 5 : 3;
      opponent.takeDamage(dmg * 1.2, true);
      game.spawnExplosion(this.x, this.y, this.color);
      game.spawnShockwave(this.x, this.y, this.color);
      game.hitStop = 8;
      game.shake = this.type === 'crystal_pillar' ? 25 : 18;
      if (this.type !== 'homing' && this.type !== 'bounce' && this.type !== 'crystal_bounce') this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.shadowBlur = 15; ctx.shadowColor = this.color; ctx.fillStyle = this.color;

    if (this.type === 'rhombus' || this.type === 'crystal_bounce' || this.type === 'crystal_curve'
        || this.type === 'crystal_rise' || this.type === 'crystal_descend') {
      this._drawCrystal(ctx, 10);
    } else if (this.type === 'crystal_pillar') {
      this._drawCrystalPillar(ctx);
    } else {
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-3, -3, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /** Draws a detailed crystal gem matching reference - horizontal orientation (90° rotated from vertical) */
  _drawCrystal(ctx: CanvasRenderingContext2D, s: number) {
    // Main body - elongated hexagonal crystal (horizontal)
    const grad = ctx.createLinearGradient(-s * 1.5, -s * 0.5, s * 1.5, s * 0.5);
    grad.addColorStop(0, '#5577cc');
    grad.addColorStop(0.15, '#7799ee');
    grad.addColorStop(0.3, '#aaccff');
    grad.addColorStop(0.45, '#88bbff');
    grad.addColorStop(0.55, '#6699ee');
    grad.addColorStop(0.7, '#99bbff');
    grad.addColorStop(0.85, '#7788dd');
    grad.addColorStop(1, '#5566bb');

    ctx.fillStyle = grad;

    // Hexagonal crystal body - left point, upper facets, right point, lower facets
    ctx.beginPath();
    ctx.moveTo(-s * 1.5, 0);           // left tip
    ctx.lineTo(-s * 0.7, -s * 0.65);   // upper-left edge
    ctx.lineTo(s * 0.7, -s * 0.65);    // upper-right edge
    ctx.lineTo(s * 1.5, 0);            // right tip
    ctx.lineTo(s * 0.7, s * 0.65);     // lower-right edge
    ctx.lineTo(-s * 0.7, s * 0.65);    // lower-left edge
    ctx.closePath();
    ctx.fill();

    // Upper facet - darker triangle (left side)
    ctx.fillStyle = 'rgba(80,100,180,0.5)';
    ctx.beginPath();
    ctx.moveTo(-s * 1.5, 0);
    ctx.lineTo(-s * 0.7, -s * 0.65);
    ctx.lineTo(-s * 0.1, -s * 0.15);
    ctx.closePath();
    ctx.fill();

    // Upper facet - lighter triangle (right side)
    ctx.fillStyle = 'rgba(150,200,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, -s * 0.65);
    ctx.lineTo(s * 0.7, -s * 0.65);
    ctx.lineTo(s * 0.2, -s * 0.1);
    ctx.lineTo(-s * 0.1, -s * 0.15);
    ctx.closePath();
    ctx.fill();

    // Lower facet - medium triangle
    ctx.fillStyle = 'rgba(60,80,160,0.45)';
    ctx.beginPath();
    ctx.moveTo(-s * 1.5, 0);
    ctx.lineTo(-s * 0.1, -s * 0.15);
    ctx.lineTo(s * 0.2, s * 0.2);
    ctx.lineTo(-s * 0.7, s * 0.65);
    ctx.closePath();
    ctx.fill();

    // Right lower facet
    ctx.fillStyle = 'rgba(100,140,220,0.4)';
    ctx.beginPath();
    ctx.moveTo(s * 0.7, -s * 0.65);
    ctx.lineTo(s * 1.5, 0);
    ctx.lineTo(s * 0.2, s * 0.2);
    ctx.lineTo(s * 0.2, -s * 0.1);
    ctx.closePath();
    ctx.fill();

    // Bottom right facet
    ctx.fillStyle = 'rgba(70,100,190,0.5)';
    ctx.beginPath();
    ctx.moveTo(s * 1.5, 0);
    ctx.lineTo(s * 0.7, s * 0.65);
    ctx.lineTo(s * 0.2, s * 0.2);
    ctx.closePath();
    ctx.fill();

    // Facet edge lines
    ctx.strokeStyle = 'rgba(200,220,255,0.5)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-s * 1.5, 0); ctx.lineTo(-s * 0.1, -s * 0.15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.15); ctx.lineTo(s * 0.2, -s * 0.1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.2, -s * 0.1); ctx.lineTo(s * 1.5, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.15); ctx.lineTo(s * 0.2, s * 0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.2, s * 0.2); ctx.lineTo(s * 1.5, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 1.5, 0); ctx.lineTo(s * 0.2, s * 0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.7, s * 0.65); ctx.lineTo(s * 0.2, s * 0.2); ctx.stroke();

    // Bright highlight spark
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.3, s * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.2, s * 0.08, 0, Math.PI * 2); ctx.fill();

    // Outer glow
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#66aaff';
    ctx.beginPath(); ctx.arc(0, 0, s * 2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  /** Draws a massive crystal pillar effect */
  _drawCrystalPillar(ctx: CanvasRenderingContext2D) {
    const s = 20;
    const h = 80;
    const t = this.life / 60; // fade over 60 frames

    // Tall vertical crystal pillar
    const grad = ctx.createLinearGradient(0, -h, 0, h);
    grad.addColorStop(0, '#aaddff');
    grad.addColorStop(0.3, '#66aaff');
    grad.addColorStop(0.5, '#4488ff');
    grad.addColorStop(0.7, '#6699ee');
    grad.addColorStop(1, '#5577cc');

    ctx.globalAlpha = Math.min(t, 1) * 0.85;
    ctx.fillStyle = grad;

    // Pillar shape (tall hexagonal)
    ctx.beginPath();
    ctx.moveTo(0, -h);              // top tip
    ctx.lineTo(-s * 0.7, -h * 0.6);
    ctx.lineTo(-s * 0.7, h * 0.6);
    ctx.lineTo(0, h);               // bottom tip
    ctx.lineTo(s * 0.7, h * 0.6);
    ctx.lineTo(s * 0.7, -h * 0.6);
    ctx.closePath();
    ctx.fill();

    // Facet lines
    ctx.strokeStyle = 'rgba(200,230,255,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(0, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.7, -h * 0.6); ctx.lineTo(s * 0.7, h * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.7, -h * 0.6); ctx.lineTo(-s * 0.7, h * 0.6); ctx.stroke();

    // Glow
    ctx.globalAlpha = Math.min(t, 1) * 0.3;
    ctx.fillStyle = '#66bbff';
    ctx.beginPath(); ctx.arc(0, 0, s * 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.globalAlpha = 1;
  }
}
