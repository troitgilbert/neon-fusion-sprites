import React, { useEffect, useRef } from 'react';

const NebulaBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let time = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    // Stars
    interface Star { x: number; y: number; z: number; size: number; color: [number,number,number]; twinkleSpeed: number; twinkleOffset: number; }
    const stars: Star[] = [];
    const starColors: [number,number,number][] = [
      [255,255,255],[200,220,255],[255,200,180],[180,200,255],[255,240,200],[200,255,255],[255,180,220],
    ];
    for (let i = 0; i < 600; i++) {
      stars.push({
        x: Math.random(), y: Math.random(),
        z: Math.random(), // depth
        size: Math.random() * 2 + 0.3,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        twinkleSpeed: Math.random() * 0.025 + 0.008,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    // Shooting stars
    interface ShootingStar { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; trail: {x:number;y:number}[]; brightness: number; }
    const shootingStars: ShootingStar[] = [];

    // Particles
    interface Particle { x: number; y: number; vx: number; vy: number; size: number; life: number; maxLife: number; color: [number,number,number]; }
    const particles: Particle[] = [];
    const pColors: [number,number,number][] = [[255,140,0],[0,200,255],[168,85,247],[255,50,100],[255,200,50],[0,255,150]];

    // Nebula cloud points for smooth animation
    const nebulae = [
      { bx: 0.12, by: 0.18, r: 0.5, color: [180,80,10], alpha: 0.15, sx: 0.0003, sy: 0.0004 },
      { bx: 0.82, by: 0.72, r: 0.55, color: [200,100,15], alpha: 0.14, sx: 0.0002, sy: 0.0003 },
      { bx: 0.48, by: 0.08, r: 0.38, color: [220,120,20], alpha: 0.12, sx: 0.00025, sy: 0.0002 },
      { bx: 0.72, by: 0.32, r: 0.32, color: [160,60,15], alpha: 0.1, sx: 0.00035, sy: 0.0005 },
      { bx: 0.28, by: 0.78, r: 0.42, color: [200,90,10], alpha: 0.1, sx: 0.0004, sy: 0.00025 },
      { bx: 0.55, by: 0.52, r: 0.6, color: [170,70,10], alpha: 0.09, sx: 0.0002, sy: 0.00015 },
      { bx: 0.35, by: 0.45, r: 0.35, color: [190,85,15], alpha: 0.08, sx: 0.00018, sy: 0.00028 },
    ] as const;

    const loop = () => {
      time++;
      const w = W(), h = H();
      ctx.save();

      // Deep background
      const bgGrad = ctx.createLinearGradient(0, 0, w * 0.3, h);
      bgGrad.addColorStop(0, '#040201');
      bgGrad.addColorStop(0.3, '#080403');
      bgGrad.addColorStop(0.7, '#0a0504');
      bgGrad.addColorStop(1, '#050201');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Nebulae
      for (const n of nebulae) {
        const cx = (n.bx + Math.sin(time * n.sx) * 0.06) * w;
        const cy = (n.by + Math.cos(time * n.sy) * 0.05) * h;
        const r = n.r * Math.max(w, h);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `rgba(${n.color[0]},${n.color[1]},${n.color[2]},${n.alpha})`);
        grad.addColorStop(0.35, `rgba(${n.color[0]},${n.color[1]},${n.color[2]},${n.alpha * 0.45})`);
        grad.addColorStop(0.7, `rgba(${n.color[0]},${n.color[1]},${n.color[2]},${n.alpha * 0.1})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Cosmic dust band
      ctx.save();
      ctx.globalAlpha = 0.015 + Math.sin(time * 0.0005) * 0.005;
      ctx.translate(w * 0.5, h * 0.5);
      ctx.rotate(0.35 + Math.sin(time * 0.0001) * 0.04);
      const dustGrad = ctx.createLinearGradient(-w, 0, w, 0);
      dustGrad.addColorStop(0, 'transparent');
      dustGrad.addColorStop(0.25, 'rgba(120,60,20,1)');
      dustGrad.addColorStop(0.5, 'rgba(100,40,10,1)');
      dustGrad.addColorStop(0.75, 'rgba(90,35,8,1)');
      dustGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = dustGrad;
      ctx.fillRect(-w, -h * 0.12, w * 2, h * 0.24);
      ctx.restore();

      // Stars with parallax depth
      for (const s of stars) {
        const depth = 0.3 + s.z * 0.7;
        const twinkle = (Math.sin(time * s.twinkleSpeed + s.twinkleOffset) + 1) * 0.5;
        const alpha = depth * (0.35 + twinkle * 0.65);
        const sz = s.size * depth;
        const sx = s.x * w, sy = s.y * h;

        // Glow
        if (sz > 0.8) {
          const glowR = sz * (3 + twinkle * 4);
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
          glow.addColorStop(0, `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${alpha * 0.35})`);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.fillRect(sx - glowR, sy - glowR, glowR * 2, glowR * 2);
        }

        // Core
        ctx.beginPath();
        ctx.arc(sx, sy, sz * (0.7 + twinkle * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${alpha})`;
        ctx.fill();

        // Cross flare
        if (sz > 1.8 && twinkle > 0.75) {
          ctx.strokeStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${alpha * 0.25})`;
          ctx.lineWidth = 0.5;
          const fl = sz * 8 * twinkle;
          ctx.beginPath();
          ctx.moveTo(sx - fl, sy); ctx.lineTo(sx + fl, sy);
          ctx.moveTo(sx, sy - fl); ctx.lineTo(sx, sy + fl);
          ctx.stroke();
        }
      }

      // Particles
      if (Math.random() < 0.12 && particles.length < 60) {
        const col = pColors[Math.floor(Math.random() * pColors.length)];
        particles.push({
          x: Math.random() * w, y: h + 5,
          vx: (Math.random() - 0.5) * 1.2, vy: -Math.random() * 1.8 - 0.4,
          size: Math.random() * 2.5 + 0.6,
          life: 0, maxLife: 250 + Math.random() * 350, color: col,
        });
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx + Math.sin(time * 0.015 + p.y * 0.008) * 0.25;
        p.y += p.vy;
        const prog = p.life / p.maxLife;
        const a = prog < 0.1 ? prog * 10 : prog > 0.6 ? (1 - prog) / 0.4 : 1;

        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
        glow.addColorStop(0, `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${a * 0.25})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - p.size * 5, p.y - p.size * 5, p.size * 10, p.size * 10);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + a * 0.6), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${a * 0.7})`;
        ctx.fill();

        if (p.life >= p.maxLife) particles.splice(i, 1);
      }

      // Shooting stars
      if (Math.random() < 0.006) {
        const angle = Math.PI * 0.12 + Math.random() * Math.PI * 0.25;
        const speed = 10 + Math.random() * 15;
        shootingStars.push({
          x: Math.random() * w * 0.7, y: Math.random() * h * 0.35,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 0, maxLife: 35 + Math.random() * 25, trail: [],
          brightness: 0.6 + Math.random() * 0.4,
        });
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;
        ss.trail.push({ x: ss.x, y: ss.y });
        if (ss.trail.length > 30) ss.trail.shift();
        ss.x += ss.vx; ss.y += ss.vy;
        const fade = (1 - ss.life / ss.maxLife) * ss.brightness;

        for (let j = 0; j < ss.trail.length; j++) {
          const tp = ss.trail[j];
          const ta = (j / ss.trail.length) * fade * 0.6;
          const ts = (j / ss.trail.length) * 2.5;
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, ts, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220,240,255,${ta})`;
          ctx.fill();
        }

        const headG = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 15);
        headG.addColorStop(0, `rgba(255,255,255,${fade * 0.9})`);
        headG.addColorStop(0.3, `rgba(150,200,255,${fade * 0.35})`);
        headG.addColorStop(1, 'transparent');
        ctx.fillStyle = headG;
        ctx.fillRect(ss.x - 15, ss.y - 15, 30, 30);

        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${fade})`;
        ctx.fill();

        if (ss.life >= ss.maxLife) shootingStars.splice(i, 1);
      }

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.75);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      // Subtle warm lens glow
      const la = 0.025 + Math.sin(time * 0.006) * 0.012;
      const lens = ctx.createRadialGradient(w * 0.1, h * 0.12, 0, w * 0.1, h * 0.12, w * 0.35);
      lens.addColorStop(0, `rgba(255,180,80,${la})`);
      lens.addColorStop(0.5, `rgba(255,80,30,${la * 0.25})`);
      lens.addColorStop(1, 'transparent');
      ctx.fillStyle = lens;
      ctx.fillRect(0, 0, w, h);

      ctx.restore();
      animId = requestAnimationFrame(loop);
    };

    loop();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

export default NebulaBackground;
