import React, { useRef, useEffect, useState } from 'react';
import { useGame } from '../game/GameContext';
import { CANVAS_W, CANVAS_H, RENDER_SCALE } from '../game/constants';

const GameCanvas: React.FC = () => {
  const { engine } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const scaleX = window.innerWidth / CANVAS_W;
      const scaleY = window.innerHeight / CANVAS_H;
      setScale(Math.min(scaleX, scaleY));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      engine.init(canvasRef.current);
    }
    return () => engine.destroy();
  }, [engine]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: '#000' }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W * RENDER_SCALE}
          height={CANVAS_H * RENDER_SCALE}
          style={{ display: 'block', width: CANVAS_W, height: CANVAS_H }}
        />

        {/* Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            background: `
              linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%),
              linear-gradient(90deg, rgba(255,0,0,0.06), rgba(0,255,0,0.02), rgba(0,0,255,0.06))
            `,
            backgroundSize: '100% 2px, 3px 100%',
          }}
        />
      </div>
    </div>
  );
};

export default GameCanvas;
