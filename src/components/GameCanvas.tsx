import React, { useRef, useEffect } from 'react';
import { useGame } from '../game/GameContext';
import { CANVAS_W, CANVAS_H } from '../game/constants';

const GameCanvas: React.FC = () => {
  const { engine } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      engine.init(canvasRef.current);
    }
    return () => engine.destroy();
  }, [engine]);

  return (
    <div className="relative" style={{ boxShadow: '0 0 50px rgba(0,255,255,0.2)' }}>
      <div
        className="relative overflow-hidden"
        style={{
          width: CANVAS_W, height: CANVAS_H,
          background: 'linear-gradient(180deg, #1a1a3a, #0b0b1f)',
          border: '4px solid #87ceeb',
          boxShadow: '0 0 25px rgba(0,255,255,.3), inset 0 0 50px rgba(0,0,0,0.8)',
          imageRendering: 'pixelated',
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block', imageRendering: 'pixelated' }}
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
