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
      canvas.width = window.innerWidth * 2;
      canvas.height = window.innerHeight * 2;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    };
    resize();
    window.addEventListener('resize', resize);

    // Stars
    interface Star { x: number; y: number; size: number; brightness: number; speed: number; color: [number, number, number]; twinkleSpeed: number; twinkleOffset: number; }
    const stars: Star[] = [];
    const starColors: [number, number, number][] = [
      [255, 255, 255], [200, 220, 255], [255, 200, 180], [180, 200, 255],
      [255, 240, 200], [200, 255, 255], [255, 180, 220], [220, 255, 180],
    ];
    for (let i = 0; i < 500; i++) {
      stars.push({
        x: Math.random() * 2, y: Math.random() * 2,
        size: Math.random() * 2 + 0.3,
        brightness: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.00002 + 0.000005,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    // Deep stars (background layer)
    interface DeepStar { x: number; y: number; size: number; alpha: number; }
    const deepStars: DeepStar[] = [];
    for (let i = 0; i < 800; i++) {
      deepStars.push({
        x: Math.random(), y: Math.random(),
        size: Math.random() * 1 + 0.2,
        alpha: Math.random() * 0.3 + 0.05,
      });
    }

    // Particles (embers/dust)
    interface Particle { x: number; y: number; vx: number; vy: number; size: number; life: number; maxLife: number; color: [number, number, number]; }
    const particles: Particle[] = [];
    const particleColors: [number, number, number][] = [
      [255, 140, 0], [0, 200, 255], [168, 85, 247], [255, 50, 100], [255, 200, 50], [0, 255, 150],
    ];

    // Shooting stars
    interface ShootingStar { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; trail: {x: number; y: number}[]; }
    const shootingStars: ShootingStar[] = [];

    const spawnShootingStar = () => {
      const angle = Math.PI * 0.15 + Math.random() * Math.PI * 0.2;
      const speed = 8 + Math.random() * 12;
      shootingStars.push({
        x: Math.random() * canvas.width * 0.8,
        y: Math.random() * canvas.height * 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0, maxLife: 40 + Math.random() * 30,
        trail: [],
      });
    };

    const drawNebula = (t: number) => {
      const w = canvas.width, h = canvas.height;

      // Nebula clouds via radial gradients (animated)
      const nebulae = [
        { cx: 0.15 + Math.sin(t * 0.0003) * 0.05, cy: 0.2 + Math.cos(t * 0.0004) * 0.04, r: 0.45, color: [100, 0, 200], alpha: 0.12 },
        { cx: 0.8 + Math.cos(t * 0.0002) * 0.04, cy: 0.7 + Math.sin(t * 0.0003) * 0.05, r: 0.5, color: [0, 80, 220], alpha: 0.1 },
        { cx: 0.5 + Math.sin(t * 0.00025) * 0.06, cy: 0.1, r: 0.35, color: [200, 40, 0], alpha: 0.07 },
        { cx: 0.7 + Math.cos(t * 0.00035) * 0.03, cy: 0.35 + Math.sin(t * 0.0005) * 0.04, r: 0.3, color: [200, 0, 100], alpha: 0.06 },
        { cx: 0.3, cy: 0.75 + Math.cos(t * 0.0004) * 0.03, r: 0.4, color: [0, 160, 120], alpha: 0.05 },
        { cx: 0.55 + Math.sin(t * 0.0002) * 0.05, cy: 0.55, r: 0.55, color: [80, 0, 180], alpha: 0.04 },
      ];

      for (const n of nebulae) {
        const grad = ctx.createRadialGradient(n.cx * w, n.cy * h, 0, n.cx * w, n.cy * h, n.r * Math.max(w, h));
        grad.addColorStop(0, `rgba(${n.color[0]},${n.color[1]},${n.color[2]},${n.alpha})`);
        grad.addColorStop(0.4, `rgba(${n.color[0]},${n.color[1]},${n.color[2]},${n.alpha * 0.5})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Cosmic dust band (diagonal)
      ctx.save();
      ctx.globalAlpha = 0.03 + Math.sin(t * 0.0005) * 0.01;
      ctx.translate(w * 0.5, h * 0.5);
      ctx.rotate(0.4 + Math.sin(t * 0.0001) * 0.05);
      const dustGrad = ctx.createLinearGradient(-w, -h * 0.1, w, h * 0.1);
      dustGrad.addColorStop(0, 'transparent');
      dustGrad.addColorStop(0.3, 'rgba(180,140,255,1)');
      dustGrad.addColorStop(0.5, 'rgba(255,180,100,1)');
      dustGrad.addColorStop(0.7, 'rgba(100,180,255,1)');
      dustGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = dustGrad;
      ctx.fillRect(-w, -h * 0.15, w * 2, h * 0.3);
      ctx.restore();
    };

    const loop = () => {
      time++;
      const w = canvas.width, h = canvas.height;

      // Deep space background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#010008');
      bgGrad.addColorStop(0.3, '#050018');
      bgGrad.addColorStop(0.6, '#0a0025');
      bgGrad.addColorStop(1, '#020010');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Nebula
      drawNebula(time);

      // Deep stars (static, faint)
      for (const s of deepStars) {
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,255,${s.alpha})`;
        ctx.fill();
      }

      // Main stars with twinkle and glow
      for (const s of stars) {
        const twinkle = (Math.sin(time * s.twinkleSpeed + s.twinkleOffset) + 1) * 0.5;
        const alpha = s.brightness * (0.4 + twinkle * 0.6);
        const glowSize = s.size * (2 + twinkle * 3);

        // Glow
        const glow = ctx.createRadialGradient(s.x * w, s.y * h, 0, s.x * w, s.y * h, glowSize);
        glow.addColorStop(0, `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${alpha * 0.4})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(s.x * w - glowSize, s.y * h - glowSize, glowSize * 2, glowSize * 2);

        // Core
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.size * (0.8 + twinkle * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${alpha})`;
        ctx.fill();

        // Cross flare on bright stars
        if (s.size > 1.5 && twinkle > 0.7) {
          ctx.strokeStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${alpha * 0.3})`;
          ctx.lineWidth = 0.5;
          const flareLen = s.size * 6 * twinkle;
          ctx.beginPath();
          ctx.moveTo(s.x * w - flareLen, s.y * h);
          ctx.lineTo(s.x * w + flareLen, s.y * h);
          ctx.moveTo(s.x * w, s.y * h - flareLen);
          ctx.lineTo(s.x * w, s.y * h + flareLen);
          ctx.stroke();
        }
      }

      // Particles
      if (Math.random() < 0.15) {
        const col = particleColors[Math.floor(Math.random() * particleColors.length)];
        particles.push({
          x: Math.random() * w, y: h + 5,
          vx: (Math.random() - 0.5) * 1.5, vy: -Math.random() * 2 - 0.5,
          size: Math.random() * 3 + 0.8,
          life: 0, maxLife: 200 + Math.random() * 300,
          color: col,
        });
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx + Math.sin(time * 0.02 + p.y * 0.01) * 0.3;
        p.y += p.vy;
        p.vx *= 0.999;
        const progress = p.life / p.maxLife;
        const alpha = progress < 0.1 ? progress * 10 : progress > 0.6 ? (1 - progress) / 0.4 : 1;

        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        glow.addColorStop(0, `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${alpha * 0.3})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - p.size * 4, p.y - p.size * 4, p.size * 8, p.size * 8);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + alpha * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${alpha * 0.8})`;
        ctx.fill();

        if (p.life >= p.maxLife) particles.splice(i, 1);
      }

      // Shooting stars
      if (Math.random() < 0.008) spawnShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;
        ss.trail.push({ x: ss.x, y: ss.y });
        if (ss.trail.length > 25) ss.trail.shift();
        ss.x += ss.vx;
        ss.y += ss.vy;
        const fade = 1 - ss.life / ss.maxLife;

        // Trail
        for (let j = 0; j < ss.trail.length; j++) {
          const t2 = ss.trail[j];
          const trailAlpha = (j / ss.trail.length) * fade * 0.7;
          const trailSize = (j / ss.trail.length) * 2.5;
          ctx.beginPath();
          ctx.arc(t2.x, t2.y, trailSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${trailAlpha})`;
          ctx.fill();
        }

        // Head
        const headGlow = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 12);
        headGlow.addColorStop(0, `rgba(255,255,255,${fade * 0.9})`);
        headGlow.addColorStop(0.3, `rgba(150,200,255,${fade * 0.4})`);
        headGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = headGlow;
        ctx.fillRect(ss.x - 12, ss.y - 12, 24, 24);

        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${fade})`;
        ctx.fill();

        if (ss.life >= ss.maxLife) shootingStars.splice(i, 1);
      }

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.7);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      // Subtle lens flare at top-left
      const lensAlpha = 0.03 + Math.sin(time * 0.008) * 0.015;
      const lens = ctx.createRadialGradient(w * 0.12, h * 0.15, 0, w * 0.12, h * 0.15, w * 0.3);
      lens.addColorStop(0, `rgba(255,200,100,${lensAlpha})`);
      lens.addColorStop(0.5, `rgba(255,100,50,${lensAlpha * 0.3})`);
      lens.addColorStop(1, 'transparent');
      ctx.fillStyle = lens;
      ctx.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(loop);
    };

    loop();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

export default NebulaBackground;
