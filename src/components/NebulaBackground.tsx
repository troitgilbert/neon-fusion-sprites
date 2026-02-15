import React, { useEffect, useMemo, useRef, useState } from 'react';

const NebulaBackground: React.FC = () => {
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = starsRef.current;
    if (!container) return;
    const starColors = ['#ffffff', '#ff4d4d', '#ffd84d', '#4dff4d', '#b44dff'];
    for (let i = 0; i < 120; i++) {
      const s = document.createElement('div');
      s.style.position = 'absolute';
      s.style.borderRadius = '50%';
      s.style.opacity = '0.85';
      s.style.background = starColors[Math.floor(Math.random() * starColors.length)];
      const size = Math.random() * 3 + 1;
      s.style.width = size + 'px'; s.style.height = size + 'px';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      container.appendChild(s);
      const dx = (Math.random() * 2 - 1) * 100;
      const dy = (Math.random() * 2 - 1) * 100;
      s.animate([
        { transform: 'translate(0,0)' },
        { transform: `translate(${dx}px,${dy}px)` }
      ], { duration: 20000 + Math.random() * 20000, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
    }
  }, []);

  return (
    <>
      {/* Nebula */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(120,0,255,0.25), transparent 60%),
            radial-gradient(circle at 80% 70%, rgba(0,120,255,0.25), transparent 65%),
            radial-gradient(circle at 50% 50%, rgba(255,0,120,0.18), transparent 70%)
          `,
        }}
      />

      {/* Top light */}
      <div
        className="fixed top-0 left-0 right-0 pointer-events-none z-0"
        style={{
          height: '40%',
          background: 'linear-gradient(to bottom, rgba(255,255,220,0.12), transparent)'
        }}
      />

      {/* Smoke */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(circle, rgba(20,20,20,.5), transparent 70%)',
        }}
      />

      {/* Fog */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(circle, rgba(10,10,10,.7), transparent 70%)',
        }}
      />

      {/* Stars */}
      <div ref={starsRef} className="fixed inset-0 pointer-events-none z-[2]" />
    </>
  );
};

export default NebulaBackground;
