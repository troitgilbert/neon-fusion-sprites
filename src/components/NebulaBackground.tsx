import React, { useEffect, useRef } from 'react';

const NebulaBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);

  // Particle canvas for dust/embers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    interface Particle { x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string; life: number; maxLife: number; }
    const particles: Particle[] = [];
    const colors = ['#ff6b35', '#00d4ff', '#a855f7', '#ff0066', '#ffcc33', '#00ff88'];

    const spawn = () => {
      if (particles.length < 80) {
        const edge = Math.random();
        particles.push({
          x: Math.random() * canvas.width,
          y: edge < 0.5 ? canvas.height + 10 : Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -Math.random() * 1.2 - 0.3,
          size: Math.random() * 2.5 + 0.5,
          alpha: 0,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 0,
          maxLife: 300 + Math.random() * 400,
        });
      }
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (Math.random() < 0.3) spawn();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        const progress = p.life / p.maxLife;
        p.alpha = progress < 0.1 ? progress * 10 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
        p.alpha *= 0.6;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        if (p.life >= p.maxLife || p.y < -20) particles.splice(i, 1);
      }
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  // DOM stars with twinkle
  useEffect(() => {
    const container = starsRef.current;
    if (!container) return;
    for (let i = 0; i < 200; i++) {
      const s = document.createElement('div');
      s.style.position = 'absolute';
      s.style.borderRadius = '50%';
      const size = Math.random() * 2.5 + 0.5;
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.background = '#fff';
      s.style.boxShadow = `0 0 ${size * 3}px rgba(255,255,255,0.8)`;
      s.style.animation = `twinkle ${2 + Math.random() * 4}s ease-in-out infinite`;
      s.style.animationDelay = `${Math.random() * 5}s`;
      container.appendChild(s);
    }
  }, []);

  return (
    <>
      {/* Deep space gradient */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: `
          radial-gradient(ellipse at 15% 20%, rgba(120,0,255,0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 85% 75%, rgba(0,100,255,0.25) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 10%, rgba(255,60,0,0.15) 0%, transparent 40%),
          radial-gradient(ellipse at 70% 40%, rgba(255,0,120,0.12) 0%, transparent 45%),
          radial-gradient(ellipse at 30% 80%, rgba(0,200,150,0.1) 0%, transparent 50%),
          linear-gradient(180deg, #020010 0%, #0a0020 30%, #050015 70%, #000008 100%)
        `,
      }} />

      {/* Animated nebula layer 1 */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: `radial-gradient(ellipse at 25% 35%, rgba(168,85,247,0.2) 0%, transparent 60%)`,
        animation: 'nebulaFloat1 25s ease-in-out infinite',
      }} />

      {/* Animated nebula layer 2 */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: `radial-gradient(ellipse at 75% 60%, rgba(0,180,255,0.18) 0%, transparent 55%)`,
        animation: 'nebulaFloat2 30s ease-in-out infinite',
      }} />

      {/* Cosmic dust band */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: `
          linear-gradient(135deg, transparent 30%, rgba(255,120,0,0.04) 45%, transparent 60%),
          linear-gradient(45deg, transparent 40%, rgba(168,85,247,0.03) 50%, transparent 65%)
        `,
        animation: 'nebulaFloat1 40s ease-in-out infinite reverse',
      }} />

      {/* Stars */}
      <div ref={starsRef} className="fixed inset-0 pointer-events-none z-[1]" />

      {/* Shooting stars */}
      <div className="fixed inset-0 pointer-events-none z-[2] overflow-hidden">
        <div className="shooting-star" style={{ top: '15%', left: '10%', animationDelay: '0s' }} />
        <div className="shooting-star" style={{ top: '35%', left: '60%', animationDelay: '4s' }} />
        <div className="shooting-star" style={{ top: '65%', left: '30%', animationDelay: '8s' }} />
        <div className="shooting-star" style={{ top: '20%', left: '80%', animationDelay: '12s' }} />
      </div>

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[3]" />

      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none z-[4]" style={{
        background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)`,
      }} />

      {/* Cinematic bars (subtle) */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none z-[4]" style={{
        height: '3%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
      }} />
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-[4]" style={{
        height: '3%', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
      }} />
    </>
  );
};

export default NebulaBackground;
