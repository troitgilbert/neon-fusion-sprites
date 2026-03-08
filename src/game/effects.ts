// Visual effects classes for the fighting game

export class PunchCircle {
  x: number; y: number; r: number; life: number; color: string;
  constructor(x: number, y: number, color: string) {
    this.x = x; this.y = y; this.r = 4; this.life = 12; this.color = color;
  }
  update() { this.r += 3; this.life--; }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.life / 12;
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export class FloatingText {
  x: number; y: number; text: string; color: string; life: number; vy: number;
  constructor(x: number, y: number, text: string, color: string) {
    this.x = x; this.y = y; this.text = text; this.color = color;
    this.life = 60; this.vy = -2;
  }
  update() { this.x += (Math.random() - 0.5); this.y += this.vy; this.vy *= 0.95; this.life--; }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.life / 60;
    ctx.fillStyle = this.color;
    ctx.font = "bold 24px 'Orbitron', monospace";
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

export class Shockwave {
  x: number; y: number; r: number; color: string; life: number; maxLife: number;
  constructor(x: number, y: number, color: string) {
    this.x = x; this.y = y; this.r = 10; this.color = color;
    this.life = 20; this.maxLife = 20;
  }
  update() { this.r += 8; this.life--; }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.lineWidth = 4; ctx.strokeStyle = this.color;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
  }
}

export class Particle {
  x: number; y: number; color: string; vx: number; vy: number;
  life: number; maxLife: number; size: number; gravity: number;
  constructor(x: number, y: number, color: string, speed: number, size?: number) {
    this.x = x; this.y = y; this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * speed;
    this.vx = Math.cos(angle) * spd; this.vy = Math.sin(angle) * spd;
    this.life = 40 + Math.random() * 20; this.maxLife = this.life;
    this.size = size || (2 + Math.random() * 3); this.gravity = 0.2;
  }
  update() {
    this.x += this.vx; this.y += this.vy; this.vy += this.gravity;
    this.life--; this.size *= 0.95;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

export class EnergyTrail {
  x: number; y: number; life: number; maxLife: number;
  particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[];
  color: string; reversed: boolean;
  constructor(x: number, y: number, color: string, reversed = false) {
    this.x = x; this.y = y; this.color = color; this.reversed = reversed;
    this.life = 30; this.maxLife = 30;
    this.particles = [];
    for (let i = 0; i < 18; i++) {
      const angle = reversed
        ? (Math.PI * 0.5 + (Math.random() - 0.5) * 1.2)   // downward fan
        : (-Math.PI * 0.5 + (Math.random() - 0.5) * 1.2);  // upward fan
      const spd = 3 + Math.random() * 6;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * spd + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 5,
        alpha: 0.7 + Math.random() * 0.3,
      });
    }
  }
  update() {
    this.life--;
    for (const p of this.particles) {
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.96; p.vy *= 0.96;
      p.size *= 0.97; p.alpha *= 0.95;
    }
  }
  draw(ctx: CanvasRenderingContext2D) {
    const t = this.life / this.maxLife;
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha * t;
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      // Glow
      ctx.globalAlpha = p.alpha * t * 0.3;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export class GiantFist {
  x: number; y: number; targetX: number; targetY: number;
  life: number; maxLife: number; color: string;
  side: number; diagonal: number; // 1 = down-diagonal, -1 = up-diagonal
  size: number; hit: boolean; owner: any;
  constructor(x: number, y: number, side: number, diagonal: number, color: string, size: number, owner: any) {
    this.x = x + side * 20; this.y = y;
    this.targetX = x + side * 80; this.targetY = y + diagonal * 40;
    this.side = side; this.diagonal = diagonal;
    this.color = color; this.size = size;
    this.life = 20; this.maxLife = 20;
    this.hit = false; this.owner = owner;
  }
  update() {
    const t = 1 - (this.life / this.maxLife);
    this.x += (this.targetX - this.x) * 0.3;
    this.y += (this.targetY - this.y) * 0.3;
    this.life--;
  }
  draw(ctx: CanvasRenderingContext2D) {
    const t = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = t;
    ctx.translate(this.x, this.y);
    // Rotate based on diagonal direction
    const angle = this.diagonal > 0
      ? (this.side > 0 ? Math.PI * 0.2 : Math.PI * 0.8)
      : (this.side > 0 ? -Math.PI * 0.2 : -Math.PI * 0.8);
    ctx.rotate(angle);
    // Fist body
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke();
    // Knuckle lines
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * this.size * 0.35, -this.size * 0.5);
      ctx.lineTo(i * this.size * 0.35, -this.size * 0.2);
      ctx.stroke();
    }
    // Energy glow
    ctx.globalAlpha = t * 0.4;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, this.size * 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

export type Effect = PunchCircle | FloatingText | Shockwave | Particle | EnergyTrail | GiantFist;
