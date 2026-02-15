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

export type Effect = PunchCircle | FloatingText | Shockwave | Particle;
