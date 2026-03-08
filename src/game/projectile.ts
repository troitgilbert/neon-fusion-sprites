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
      // Crystal gem shape (horizontal, like a brilliant)
      const s = 14;
      // Main body - hexagonal crystal rotated 90 degrees (horizontal)
      const grad = ctx.createLinearGradient(-s * 1.3, 0, s * 1.3, 0);
      grad.addColorStop(0, '#6688ff');
      grad.addColorStop(0.3, '#00ddff');
      grad.addColorStop(0.5, '#aaeeff');
      grad.addColorStop(0.7, '#00ccff');
      grad.addColorStop(1, '#4466ee');
      ctx.fillStyle = grad;
      // Left point → top-left facet → top-right facet → right point → bottom-right → bottom-left
      ctx.beginPath();
      ctx.moveTo(-s * 1.3, 0);         // left tip
      ctx.lineTo(-s * 0.5, -s * 0.7);  // upper-left
      ctx.lineTo(s * 0.5, -s * 0.7);   // upper-right
      ctx.lineTo(s * 1.3, 0);          // right tip
      ctx.lineTo(s * 0.5, s * 0.7);    // lower-right
      ctx.lineTo(-s * 0.5, s * 0.7);   // lower-left
      ctx.closePath();
      ctx.fill();
      // Facet lines
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-s * 1.3, 0); ctx.lineTo(0, -s * 0.3); ctx.lineTo(s * 1.3, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 1.3, 0); ctx.lineTo(0, s * 0.3); ctx.lineTo(s * 1.3, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -s * 0.7); ctx.lineTo(0, s * 0.7); ctx.stroke();
      // Highlight
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.7); ctx.lineTo(0, -s * 0.3); ctx.lineTo(s * 0.5, -s * 0.7); ctx.closePath(); ctx.fill();
      // Outer glow
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#00ccff';
      ctx.beginPath(); ctx.arc(0, 0, s * 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-3, -3, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}
