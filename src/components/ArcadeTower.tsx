import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGame } from '../game/GameContext';
import type { ArcadeStage } from '../game/types';

const ARCADE_STAGES: ArcadeStage[] = [
  { type: 'fight', label: 'COMBATE', description: 'Un oponente aleatorio' },
  { type: 'army', label: 'EJÉRCITO', description: '20 versiones con vida reducida' },
  { type: 'fight', label: 'COMBATE II', description: 'Rival más fuerte' },
  { type: 'minigame', label: 'MINIJUEGO', description: 'Desafío especial' },
  { type: '2v2', label: 'DOS VS DOS', description: 'Pelea en equipo' },
  { type: '3vGiant', label: '3 VS GIGANTE', description: 'Contra un coloso' },
  { type: 'minigame', label: 'MINIJUEGO II', description: 'Desafío avanzado' },
  { type: 'fight', label: 'COMBATE III', description: 'Rival experto' },
  { type: 'miniboss', label: 'MINI BOSS', description: 'Primordiales' },
  { type: 'boss', label: 'BIG BANG', description: 'El jefe final' },
];

const stageColors: Record<string, string> = {
  fight: '#00ffff',
  army: '#ff8c00',
  minigame: '#00ff66',
  '2v2': '#ffff00',
  '3vGiant': '#ff00ff',
  miniboss: '#ff4444',
  boss: '#ffffff',
};

const stageIcons: Record<string, string> = {
  fight: '⚔',
  army: '👥',
  minigame: '🎯',
  '2v2': '🤝',
  '3vGiant': '🗿',
  miniboss: '💀',
  boss: '💥',
};

// Background canvas with map-style visuals
const MapBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let time = 0;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.scale(dpr, dpr);
      time++;

      // Dark space background with warm tones
      const bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
      bg.addColorStop(0, '#08060a');
      bg.addColorStop(0.3, '#0c0810');
      bg.addColorStop(0.7, '#0a0608');
      bg.addColorStop(1, '#060408');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Subtle nebula clouds
      const nebulae = [
        { x: 0.2, y: 0.3, r: 0.4, c: [60, 30, 15], a: 0.08 },
        { x: 0.7, y: 0.6, r: 0.35, c: [40, 20, 50], a: 0.06 },
        { x: 0.5, y: 0.15, r: 0.3, c: [50, 40, 10], a: 0.05 },
      ];
      for (const n of nebulae) {
        const cx = (n.x + Math.sin(time * 0.0003) * 0.02) * W;
        const cy = (n.y + Math.cos(time * 0.0004) * 0.02) * H;
        const r = n.r * Math.max(W, H);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `rgba(${n.c[0]},${n.c[1]},${n.c[2]},${n.a})`);
        grad.addColorStop(0.5, `rgba(${n.c[0]},${n.c[1]},${n.c[2]},${n.a * 0.3})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      // Stars
      ctx.globalAlpha = 1;
      for (let i = 0; i < 120; i++) {
        const sx = ((i * 137.5 + 50) % W);
        const sy = ((i * 97.3 + 30) % H);
        const twinkle = (Math.sin(time * 0.02 + i * 2.1) + 1) * 0.5;
        const sz = 0.5 + twinkle * 1.2;
        ctx.globalAlpha = 0.2 + twinkle * 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, sz, 0, Math.PI * 2);
        ctx.fillStyle = i % 5 === 0 ? '#ffddaa' : '#ccddff';
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Vignette
      const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.7);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />;
};

// Path canvas connecting stage nodes
const PathCanvas: React.FC<{
  nodePositions: { x: number; y: number }[];
  currentStage: number;
}> = ({ nodePositions, currentStage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.parentElement?.clientWidth || 800;
    const H = canvas.parentElement?.clientHeight || 600;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    if (nodePositions.length < 2) { animRef.current = requestAnimationFrame(draw); return; }

    // Draw path lines between nodes
    for (let i = 0; i < nodePositions.length - 1; i++) {
      const from = nodePositions[i];
      const to = nodePositions[i + 1];
      const isCompleted = i < currentStage;
      const isCurrent = i === currentStage;

      // Line glow
      ctx.save();
      ctx.globalAlpha = isCompleted ? 0.4 : isCurrent ? 0.25 : 0.06;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      // Curved path
      const mx = (from.x + to.x) / 2 + (i % 2 === 0 ? 30 : -30);
      const my = (from.y + to.y) / 2;
      ctx.quadraticCurveTo(mx, my, to.x, to.y);
      ctx.strokeStyle = isCompleted ? '#ffcc33' : isCurrent ? '#ffcc33' : '#333';
      ctx.lineWidth = isCompleted ? 4 : 3;
      ctx.shadowColor = isCompleted ? '#ffcc33' : 'transparent';
      ctx.shadowBlur = isCompleted ? 12 : 0;
      ctx.stroke();
      ctx.restore();

      // Dotted overlay for locked paths
      if (!isCompleted && !isCurrent) {
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(mx, my, to.x, to.y);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }

    animRef.current = requestAnimationFrame(draw);
  }, [nodePositions, currentStage]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />;
};

const ArcadeTower: React.FC = () => {
  const { engine, setGameState } = useGame();
  const currentStage = engine.arcadeStage || 0;
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodePositions, setNodePositions] = useState<{ x: number; y: number }[]>([]);

  // Calculate node positions for path drawing
  useEffect(() => {
    const updatePositions = () => {
      if (!containerRef.current) return;
      const nodes = containerRef.current.querySelectorAll('[data-stage-node]');
      const containerRect = containerRef.current.getBoundingClientRect();
      const positions: { x: number; y: number }[] = [];
      nodes.forEach((node) => {
        const rect = node.getBoundingClientRect();
        positions.push({
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        });
      });
      setNodePositions(positions);
    };
    const timer = setTimeout(updatePositions, 100);
    window.addEventListener('resize', updatePositions);
    return () => { clearTimeout(timer); window.removeEventListener('resize', updatePositions); };
  }, []);

  const handleStart = () => {
    engine.startArcadeStage(currentStage);
  };

  const activeStage = hoveredStage !== null ? hoveredStage : currentStage;
  const activeData = ARCADE_STAGES[activeStage];
  const activeColor = stageColors[activeData?.type] || '#fff';

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ overflow: 'hidden' }}>
      <MapBackground />

      {/* Top bar */}
      <div style={{
        position: 'relative', zIndex: 10, padding: '12px 30px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 70%, transparent 100%)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(20px, 3.5vw, 36px)', fontWeight: 900,
            letterSpacing: 8,
            background: 'linear-gradient(180deg, #fff8e0 0%, #ffcc33 40%, #ff8800 70%, #cc6600 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8)) drop-shadow(0 0 15px rgba(255,150,0,0.3))',
          }}>TORRE ARCADE</h1>
          <div style={{
            fontFamily: "'Orbitron', monospace", fontSize: 'clamp(8px, 1vw, 11px)',
            letterSpacing: 4, color: 'rgba(255,204,51,0.5)', marginTop: 2,
          }}>STAGE {activeStage + 1} / {ARCADE_STAGES.length}</div>
        </div>

        <button onClick={() => setGameState('MENU')} style={{
          padding: '8px 24px', background: 'rgba(255,204,51,0.08)',
          border: '2px solid rgba(255,204,51,0.35)', color: '#ffcc33',
          cursor: 'pointer', fontFamily: "'Orbitron', monospace",
          fontSize: 11, letterSpacing: 3, fontWeight: 700,
          transition: 'all 0.3s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#ffcc33'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255,204,51,0.2)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,204,51,0.35)'; e.currentTarget.style.boxShadow = 'none'; }}
        >VOLVER</button>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', zIndex: 2, minHeight: 0 }}>

        {/* LEFT: Stage map with path */}
        <div ref={containerRef} style={{
          flex: 1, position: 'relative', padding: '20px 40px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <PathCanvas nodePositions={nodePositions} currentStage={currentStage} />

          {/* Stage nodes - zigzag layout from bottom to top */}
          <div style={{
            position: 'relative', zIndex: 2,
            display: 'flex', flexDirection: 'column-reverse',
            gap: 'clamp(4px, 1.2vh, 10px)',
            alignItems: 'center',
            maxHeight: '85vh',
          }}>
            {ARCADE_STAGES.map((stage, i) => {
              const color = stageColors[stage.type] || '#fff';
              const isCurrent = i === currentStage;
              const isCompleted = i < currentStage;
              const isLocked = i > currentStage;
              const isHovered = hoveredStage === i;
              const icon = stageIcons[stage.type] || '?';

              // Zigzag offset
              const offsetX = i % 2 === 0 ? -80 : 80;

              return (
                <div
                  key={i}
                  data-stage-node
                  onClick={() => { if (!isLocked) setHoveredStage(i); }}
                  onMouseEnter={() => setHoveredStage(i)}
                  onMouseLeave={() => setHoveredStage(null)}
                  style={{
                    position: 'relative',
                    transform: `translateX(${offsetX}px) scale(${isCurrent || isHovered ? 1.12 : 1})`,
                    transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
                    cursor: isLocked ? 'default' : 'pointer',
                    zIndex: isCurrent || isHovered ? 10 : 1,
                    opacity: isLocked ? 0.3 : 1,
                    display: 'flex', alignItems: 'center', gap: 12,
                    flexDirection: i % 2 === 0 ? 'row' : 'row-reverse',
                  }}
                >
                  {/* Node circle */}
                  <div style={{
                    width: 'clamp(44px, 5vw, 60px)', height: 'clamp(44px, 5vw, 60px)',
                    borderRadius: '50%',
                    background: isCompleted
                      ? `radial-gradient(circle at 35% 35%, ${color}, ${color}88)`
                      : isCurrent
                        ? `radial-gradient(circle at 35% 35%, rgba(40,40,60,0.95), rgba(20,20,30,0.95))`
                        : 'radial-gradient(circle at 35% 35%, rgba(20,20,30,0.9), rgba(10,10,15,0.9))',
                    border: `3px solid ${isCurrent ? color : isCompleted ? color + '80' : '#222'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isCurrent
                      ? `0 0 20px ${color}60, 0 0 40px ${color}20, inset 0 0 15px ${color}15`
                      : isCompleted
                        ? `0 0 10px ${color}30`
                        : 'none',
                    fontSize: 'clamp(18px, 2.5vw, 26px)',
                    flexShrink: 0,
                    animation: isCurrent ? 'nodePulse 2s ease-in-out infinite' : 'none',
                  }}>
                    {isCompleted ? (
                      <span style={{ fontSize: 'clamp(16px, 2vw, 22px)', filter: 'brightness(0) invert(0)' }}>✓</span>
                    ) : (
                      <span style={{ filter: isLocked ? 'grayscale(1) brightness(0.3)' : 'none' }}>{icon}</span>
                    )}
                  </div>

                  {/* Label */}
                  <div style={{
                    textAlign: i % 2 === 0 ? 'left' : 'right',
                  }}>
                    <div style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: 'clamp(8px, 1vw, 12px)',
                      letterSpacing: 3, fontWeight: 900,
                      color: isCurrent ? color : isCompleted ? '#aaa' : '#444',
                      textShadow: isCurrent ? `0 0 10px ${color}60` : 'none',
                      whiteSpace: 'nowrap',
                    }}>
                      <span style={{
                        color: isCurrent ? '#ffcc33' : isCompleted ? '#888' : '#333',
                        marginRight: i % 2 === 0 ? 6 : 0,
                        marginLeft: i % 2 !== 0 ? 6 : 0,
                      }}>
                        {i + 1}.
                      </span>
                      {stage.label}
                    </div>
                    <div style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: 'clamp(6px, 0.7vw, 9px)',
                      color: isLocked ? '#222' : '#555',
                      letterSpacing: 1, marginTop: 1,
                    }}>{stage.description}</div>
                  </div>

                  {/* Current stage arrow indicator */}
                  {isCurrent && (
                    <div style={{
                      position: 'absolute',
                      [i % 2 === 0 ? 'left' : 'right']: -28,
                      color: '#ffcc33',
                      fontSize: 18, fontWeight: 900,
                      animation: 'arrowBounce 1s ease-in-out infinite',
                      textShadow: '0 0 10px #ffcc33',
                    }}>
                      {i % 2 === 0 ? '▶' : '◀'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Stage preview panel (like Smash Bros VS screen) */}
        <div style={{
          width: 'clamp(280px, 30vw, 400px)', position: 'relative', zIndex: 5,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '30px 20px',
          background: 'linear-gradient(270deg, rgba(0,0,0,0.85), rgba(0,0,0,0.4) 80%, transparent)',
          borderLeft: '1px solid rgba(255,204,51,0.1)',
        }}>
          {/* Stage type icon large */}
          <div style={{
            fontSize: 'clamp(50px, 8vw, 80px)',
            marginBottom: 16,
            filter: `drop-shadow(0 0 20px ${activeColor}60)`,
            animation: 'floatIcon 3s ease-in-out infinite',
          }}>
            {stageIcons[activeData?.type] || '?'}
          </div>

          {/* Stage number */}
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(9px, 1.2vw, 13px)',
            letterSpacing: 6, color: 'rgba(255,204,51,0.6)',
            marginBottom: 4,
          }}>STAGE {activeStage + 1}</div>

          {/* Stage name */}
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(18px, 3vw, 30px)', fontWeight: 900,
            letterSpacing: 4,
            color: activeColor,
            textShadow: `0 0 20px ${activeColor}50, 0 0 40px ${activeColor}20`,
            textAlign: 'center',
            marginBottom: 8,
          }}>{activeData?.label}</div>

          {/* Stage description */}
          <p style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(9px, 1.1vw, 13px)',
            color: '#8899aa', letterSpacing: 2,
            textAlign: 'center', lineHeight: 1.8,
            maxWidth: 260,
            marginBottom: 30,
          }}>{activeData?.description}</p>

          {/* Type badge */}
          <div style={{
            padding: '4px 16px',
            border: `1px solid ${activeColor}40`,
            background: `${activeColor}08`,
            fontFamily: "'Orbitron', monospace",
            fontSize: 9, letterSpacing: 3,
            color: activeColor, marginBottom: 30,
            textTransform: 'uppercase',
          }}>{activeData?.type === '2v2' ? 'EQUIPO' : activeData?.type === '3vGiant' ? 'GIGANTE' : activeData?.type.toUpperCase()}</div>

          {/* Fight button */}
          {currentStage < ARCADE_STAGES.length && (
            <button onClick={handleStart} style={{
              padding: '12px 40px',
              background: `linear-gradient(180deg, ${activeColor}20, ${activeColor}08)`,
              border: `2px solid ${activeColor}80`,
              color: activeColor,
              cursor: 'pointer', fontFamily: "'Orbitron', monospace",
              fontSize: 'clamp(12px, 1.5vw, 16px)', letterSpacing: 6, fontWeight: 900,
              transition: 'all 0.3s',
              textShadow: `0 0 12px ${activeColor}60`,
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = activeColor;
              e.currentTarget.style.boxShadow = `0 0 30px ${activeColor}40, inset 0 0 20px ${activeColor}10`;
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = `${activeColor}80`;
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            >▶ ¡LUCHAR!</button>
          )}

          {/* Progress bar */}
          <div style={{ marginTop: 30, width: '80%' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: "'Orbitron', monospace", fontSize: 8, letterSpacing: 2,
              color: '#555', marginBottom: 4,
            }}>
              <span>PROGRESO</span>
              <span>{currentStage}/{ARCADE_STAGES.length}</span>
            </div>
            <div style={{
              height: 4, background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(currentStage / ARCADE_STAGES.length) * 100}%`,
                background: 'linear-gradient(90deg, #ffcc33, #ff8800)',
                boxShadow: '0 0 8px rgba(255,150,0,0.4)',
                transition: 'width 0.5s ease-out',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom golden border */}
      <div style={{
        position: 'relative', zIndex: 10, height: 3,
        background: 'linear-gradient(90deg, transparent 5%, #ffcc33 20%, #ff8800 50%, #ffcc33 80%, transparent 95%)',
        boxShadow: '0 -2px 15px rgba(255,150,0,0.2)',
      }} />

      <style>{`
        @keyframes nodePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes arrowBounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(6px); }
        }
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

export default ArcadeTower;
