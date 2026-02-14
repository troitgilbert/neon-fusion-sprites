import type { Fighter } from './fighter';

export class Projectile {
  x: number; y: number; vx: number; vy: number;
  color: string; owner: Fighter; type: string;
  active: boolean; life: number; angle: number;

  constructor(x: number, y: number, vx: number, vy: number, color: string, owner: Fighter, type: string) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.color = color; this.owner = owner; this.type = type;
    this.active = true; this.life = 200; this.angle = 0;
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
    if (this.type === 'bounce') {
      if (this.x < 10 || this.x > 630) { this.vx *= -1; game.spawnParticles(this.x, this.y, this.color, 5); }
      if (this.y < 10 || this.y > 470) { this.vy *= -1; game.spawnParticles(this.x, this.y, this.color, 5); }
      this.angle += 0.2;
    }
    this.x += this.vx; this.y += this.vy; this.life--;
    if (this.life <= 0) this.active = false;

    if (Math.hypot(this.x - opponent.x, this.y - opponent.y) < 35) {
      const dmg = this.type === 'homing' ? 0.2 : 3;
      opponent.takeDamage(dmg * 1.2, true);
      game.spawnExplosion(this.x, this.y, this.color);
      game.spawnShockwave(this.x, this.y, this.color);
      game.hitStop = 8;
      game.shake = 18;
      if (this.type !== 'homing' && this.type !== 'bounce') this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.shadowBlur = 15; ctx.shadowColor = this.color; ctx.fillStyle = this.color;
    if (this.type === 'rhombus') {
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(18, 0);
      ctx.lineTo(0, 12); ctx.lineTo(-18, 0); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-3, -3, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}
