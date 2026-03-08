import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useGame } from '../game/GameContext';
import { MODE_INFO } from '../game/constants';

interface MenuItem {
  label: string;
  action?: () => void;
  hasSub?: boolean;
  subItems?: { label: string; action: () => void; className?: string }[];
  icon?: string;
}

const MainMenu: React.FC = () => {
  const { setGameState } = useGame();
  const [activeIndex, setActiveIndex] = useState(0);
  const [inSub, setInSub] = useState(false);
  const [subIndex, setSubIndex] = useState(0);
  const [openSubMenu, setOpenSubMenu] = useState<number | null>(null);
  const [hoveredMode, setHoveredMode] = useState<string>('');
  const [mysteryHover, setMysteryHover] = useState(false);
  const [phase, setPhase] = useState(0); // 0=hidden, 1=title, 2=menu, 3=panel
  const glowCanvasRef = useRef<HTMLCanvasElement>(null);

  // Staggered cinematic entrance
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Animated glow line canvas behind menu
  useEffect(() => {
    const canvas = glowCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let t = 0;
    const resize = () => { canvas.width = 500; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      t++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Vertical energy line
      const lineX = 6;
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.2, 'rgba(0,200,255,0.08)');
      grad.addColorStop(0.5, `rgba(0,200,255,${0.15 + Math.sin(t * 0.02) * 0.05})`);
      grad.addColorStop(0.8, 'rgba(0,200,255,0.08)');
      grad.addColorStop(1, 'transparent');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lineX, 0);
      ctx.lineTo(lineX, canvas.height);
      ctx.stroke();

      // Traveling pulse
      const pulseY = ((t * 2) % (canvas.height + 200)) - 100;
      const pulseGrad = ctx.createRadialGradient(lineX, pulseY, 0, lineX, pulseY, 60);
      pulseGrad.addColorStop(0, 'rgba(0,220,255,0.4)');
      pulseGrad.addColorStop(0.5, 'rgba(0,180,255,0.1)');
      pulseGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = pulseGrad;
      ctx.fillRect(0, pulseY - 60, 120, 120);

      // Horizontal scan lines (subtle)
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillStyle = `rgba(0,200,255,${0.008 + Math.sin(y * 0.1 + t * 0.05) * 0.004})`;
        ctx.fillRect(0, y, canvas.width, 1);
      }

      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  const menuItems: MenuItem[] = useMemo(() => [
    { label: 'HISTORIA', icon: '⚔️', action: () => setGameState('STORY_SELECT') },
    { label: 'ARCADE', icon: '🏛️', action: () => setGameState('SELECT', 'arcade') },
    { label: 'AVENTURA', icon: '🌍', action: () => setGameState('ADVENTURE_CHAR_SELECT' as any, 'adventure') },
    {
      label: 'VERSUS', icon: '👊', hasSub: true,
      subItems: [
        { label: 'VERSUS', action: () => setGameState('SELECT', 'versus') },
        { label: 'BATALLA LIBRE', action: () => setGameState('DIFFICULTY_SELECT') },
      ]
    },
    {
      label: 'MODOS DE JUEGO', icon: '🎮', hasSub: true,
      subItems: [
        { label: 'MISIONES', action: () => setGameState('MISSIONS') },
        { label: 'EVENTOS', action: () => setGameState('EVENTS') },
        { label: 'SUPERVIVENCIA', action: () => setGameState('SELECT', 'survival') },
        { label: 'BOSS RUSH', action: () => setGameState('BOSS_RUSH'), className: 'boss-rush' },
        { label: 'SELECCIÓN DE JEFES', action: () => setGameState('BOSS_SELECT') },
        { label: 'ENTRENAMIENTO', action: () => setGameState('SELECT', 'training') },
        { label: 'JUEGOS MENTALES', action: () => setGameState('MIND_GAMES') },
        { label: 'CITAS', action: () => setGameState('DATING') },
        { label: 'CREADOR DE PERSONAJES', action: () => setGameState('CREATOR') },
        { label: 'CREACIÓN DE NIVELES', action: () => {} },
        { label: 'MINIJUEGOS', action: () => setGameState('MINIGAMES') },
        { label: '???', action: () => {}, className: 'mystery' },
      ]
    },
    { label: 'TIENDA', icon: '💎', action: () => setGameState('SHOP') },
    {
      label: 'EXTRAS', icon: '📜', hasSub: true,
      subItems: [
        { label: 'DOCUMENTOS', action: () => setGameState('DOCUMENTS') },
        { label: 'LOGROS', action: () => setGameState('ACHIEVEMENTS'), className: 'logros' },
      ]
    },
    { label: 'ONLINE', icon: '🌐', action: () => setGameState('ONLINE') },
    { label: 'CONFIGURACIÓN', icon: '⚙️', action: () => setGameState('CONFIG') },
    { label: 'SALIR', icon: '🚪', action: () => {} },
  ], [setGameState]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Shift') { setInSub(false); setOpenSubMenu(null); return; }
      if (!inSub) {
        if (e.key === 'ArrowDown') setActiveIndex(i => (i + 1) % menuItems.length);
        if (e.key === 'ArrowUp') setActiveIndex(i => (i - 1 + menuItems.length) % menuItems.length);
        if (e.key === 'Enter') {
          const item = menuItems[activeIndex];
          if (item.hasSub) { setOpenSubMenu(activeIndex); setInSub(true); setSubIndex(0); }
          else item.action?.();
        }
      } else {
        const subs = menuItems[openSubMenu!]?.subItems || [];
        if (e.key === 'ArrowDown') setSubIndex(i => (i + 1) % subs.length);
        if (e.key === 'ArrowUp') setSubIndex(i => (i - 1 + subs.length) % subs.length);
        if (e.key === 'Enter') subs[subIndex]?.action();
        if (e.key === 'Escape' || e.key === 'ArrowLeft') { setInSub(false); setOpenSubMenu(null); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeIndex, inSub, subIndex, openSubMenu, menuItems]);

  const currentHover = hoveredMode || menuItems[activeIndex]?.label || '';
  const infoText = MODE_INFO[currentHover] || 'Selecciona un modo para ver su descripción.';
  const isActive = (i: number) => activeIndex === i && !inSub;

  return (
    <div className="fixed inset-0 z-10" style={{
      background: mysteryHover ? 'rgba(0,0,0,0.95)' : 'transparent',
      transition: 'background 0.5s',
    }}>
      {/* Energy line canvas */}
      <canvas ref={glowCanvasRef} style={{
        position: 'absolute', left: '5%', top: 0, pointerEvents: 'none',
        opacity: phase >= 2 ? 0.6 : 0, transition: 'opacity 1.5s',
      }} />

      {/* Main layout */}
      <div style={{
        position: 'absolute', left: '6%', top: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        {/* Title block */}
        <div style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0) scale(1)' : 'translateY(-40px) scale(0.95)',
          transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
          marginBottom: 24,
        }}>
          {/* Top decorative line */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, marginLeft: 2,
          }}>
            <div style={{
              width: 8, height: 8, border: '1px solid rgba(0,212,255,0.5)',
              transform: 'rotate(45deg)',
            }} />
            <div style={{
              width: 120, height: 1,
              background: 'linear-gradient(90deg, rgba(0,212,255,0.6), transparent)',
            }} />
            <span style={{
              fontSize: 9, letterSpacing: 8, color: 'rgba(0,212,255,0.5)',
              fontFamily: "'Orbitron', monospace",
            }}>
              COMBATE CÓSMICO
            </span>
            <div style={{
              width: 60, height: 1,
              background: 'linear-gradient(90deg, rgba(0,212,255,0.3), transparent)',
            }} />
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(48px, 7vw, 90px)',
            fontWeight: 900,
            letterSpacing: 8,
            color: 'transparent',
            fontFamily: "'Orbitron', serif",
            lineHeight: 1,
            background: 'linear-gradient(180deg, #ffe066 0%, #ffcc33 30%, #ff8800 70%, #cc5500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 0 20px rgba(255,120,0,0.5)) drop-shadow(0 0 50px rgba(255,60,0,0.3)) drop-shadow(0 4px 0 rgba(0,0,0,0.8))`,
            animation: 'titleGlow 4s ease-in-out infinite',
          }}>
            RELIQUIA
          </h1>
          <h1 style={{
            fontSize: 'clamp(48px, 7vw, 90px)',
            fontWeight: 900,
            letterSpacing: 8,
            color: 'transparent',
            fontFamily: "'Orbitron', serif",
            lineHeight: 1,
            marginTop: -8,
            background: 'linear-gradient(180deg, #ffe066 0%, #ffcc33 30%, #ff8800 70%, #cc5500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 0 20px rgba(255,120,0,0.5)) drop-shadow(0 0 50px rgba(255,60,0,0.3)) drop-shadow(0 4px 0 rgba(0,0,0,0.8))`,
            animation: 'titleGlow 4s ease-in-out infinite 0.5s',
          }}>
            DEL VACÍO
          </h1>

          {/* Bottom accent */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, marginLeft: 2 }}>
            <div style={{
              width: 180, height: 2,
              background: 'linear-gradient(90deg, #ffcc33, #ff6600, transparent)',
              boxShadow: '0 0 20px rgba(255,102,0,0.4)',
            }} />
            <div style={{
              width: 6, height: 6, background: '#ffcc33',
              transform: 'rotate(45deg)',
              boxShadow: '0 0 10px rgba(255,200,0,0.6)',
            }} />
          </div>
        </div>

        {/* Menu */}
        <div style={{
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateX(0)' : 'translateX(-50px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight: '50vh', overflowY: 'auto',
          scrollbarWidth: 'none',
          paddingLeft: 10,
        }}>
          {menuItems.map((item, i) => {
            const active = isActive(i);
            const delay = phase >= 2 ? `${i * 40}ms` : '0ms';

            return (
              <React.Fragment key={item.label}>
                <button
                  onClick={() => {
                    setActiveIndex(i);
                    if (item.hasSub) { setOpenSubMenu(i); setInSub(true); setSubIndex(0); }
                    else item.action?.();
                  }}
                  onMouseEnter={() => { setActiveIndex(i); setHoveredMode(item.label); }}
                  onMouseLeave={() => setHoveredMode('')}
                  style={{
                    position: 'relative',
                    width: 360,
                    padding: '12px 22px 12px 20px',
                    margin: '2px 0',
                    fontSize: 15,
                    textAlign: 'left',
                    background: active
                      ? 'linear-gradient(90deg, rgba(255,150,0,0.18) 0%, rgba(255,80,0,0.06) 50%, transparent 100%)'
                      : 'linear-gradient(90deg, rgba(20,40,70,0.3) 0%, transparent 100%)',
                    color: active ? '#fff' : 'rgba(180,210,240,0.6)',
                    letterSpacing: active ? 4 : 3,
                    cursor: 'pointer',
                    border: 'none',
                    fontFamily: "'Orbitron', serif",
                    fontWeight: active ? 700 : 400,
                    transform: active ? 'translateX(20px)' : 'translateX(0)',
                    transition: `all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`,
                    transitionDelay: delay,
                    overflow: 'hidden',
                    borderRadius: 0,
                  }}
                >
                  {/* Left accent bar with glow */}
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: active ? 3 : 1,
                    background: active
                      ? 'linear-gradient(180deg, #ffcc33, #ff6600, #ffcc33)'
                      : 'rgba(0,212,255,0.25)',
                    boxShadow: active
                      ? '0 0 12px rgba(255,140,0,0.6), 3px 0 25px rgba(255,100,0,0.2), 0 0 40px rgba(255,140,0,0.15)'
                      : 'none',
                    transition: 'all 0.3s ease',
                  }} />

                  {/* Active highlight sweep */}
                  {active && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255,200,50,0.04), transparent)',
                      animation: 'sweepRight 3s ease-in-out infinite',
                      pointerEvents: 'none',
                    }} />
                  )}

                  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      fontSize: 16,
                      filter: active ? 'drop-shadow(0 0 4px rgba(255,200,0,0.5))' : 'grayscale(0.6) opacity(0.4)',
                      transition: 'all 0.3s ease',
                      width: 22, textAlign: 'center',
                    }}>
                      {item.icon}
                    </span>
                    <span style={{
                      textShadow: active ? '0 0 20px rgba(255,200,100,0.3)' : 'none',
                    }}>
                      {item.label}
                    </span>
                    {item.hasSub && (
                      <span style={{
                        marginLeft: 'auto', fontSize: 8, opacity: 0.4,
                        color: active ? '#ffcc33' : '#4fdcff',
                        transform: openSubMenu === i ? 'rotate(90deg)' : 'rotate(0)',
                        transition: 'transform 0.3s ease',
                      }}>▶</span>
                    )}
                  </span>

                  {/* Bottom separator */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 20, right: 20, height: 1,
                    background: active
                      ? 'linear-gradient(90deg, rgba(255,140,0,0.15), transparent)'
                      : 'linear-gradient(90deg, rgba(100,180,255,0.04), transparent)',
                  }} />
                </button>

                {/* Submenu */}
                {item.hasSub && openSubMenu === i && (
                  <div style={{
                    marginLeft: 44, marginTop: 4, marginBottom: 6,
                    borderLeft: '1px solid rgba(0,212,255,0.12)',
                    animation: 'subMenuSlide 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}>
                    {item.subItems!.map((sub, si) => {
                      const isSubActive = inSub && subIndex === si;
                      const isBoss = sub.className === 'boss-rush';
                      const isLogros = sub.className === 'logros';
                      const isMystery = sub.className === 'mystery';

                      let accentColor = '#ffcc33';
                      if (isBoss) accentColor = '#ff2222';
                      if (isLogros) accentColor = '#ff8c00';

                      return (
                        <button
                          key={sub.label}
                          onClick={() => sub.action()}
                          onMouseEnter={() => {
                            setSubIndex(si); setHoveredMode(sub.label);
                            if (isMystery) setMysteryHover(true);
                          }}
                          onMouseLeave={() => {
                            setHoveredMode('');
                            if (isMystery) setMysteryHover(false);
                          }}
                          style={{
                            position: 'relative',
                            display: 'block', width: 300, padding: '9px 16px', margin: '1px 0',
                            fontSize: 13,
                            background: isSubActive
                              ? `linear-gradient(90deg, ${isBoss ? 'rgba(255,0,0,0.1)' : isLogros ? 'rgba(255,140,0,0.1)' : 'rgba(255,150,0,0.1)'}, transparent)`
                              : 'transparent',
                            color: isBoss ? '#ff6b6b' : isLogros ? '#ffd2a1' : isMystery ? '#333' : (isSubActive ? '#e8f0ff' : 'rgba(180,210,240,0.5)'),
                            letterSpacing: 2, cursor: 'pointer', border: 'none',
                            textShadow: isBoss && isSubActive ? '0 0 15px rgba(255,0,0,0.5)' : isLogros && isSubActive ? '0 0 12px rgba(255,140,0,0.4)' : 'none',
                            fontFamily: "'Orbitron', serif",
                            fontWeight: isSubActive ? 600 : 400,
                            transform: isSubActive ? 'translateX(12px)' : 'translateX(0)',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          }}
                        >
                          <div style={{
                            position: 'absolute', left: 0, top: '25%', bottom: '25%',
                            width: isSubActive ? 2 : 0,
                            background: accentColor,
                            boxShadow: isSubActive ? `0 0 8px ${accentColor}80` : 'none',
                            transition: 'all 0.2s ease',
                          }} />
                          {isMystery ? (
                            <span style={{ animation: 'mysteryFlicker 2s infinite' }}>{sub.label}</span>
                          ) : sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Right info panel */}
      <div style={{
        position: 'fixed', right: '4%', top: '50%', transform: 'translateY(-50%)',
        width: 400,
        opacity: phase >= 3 ? 1 : 0,
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* HUD frame */}
        <div style={{
          position: 'relative',
          padding: '28px 30px',
          background: 'linear-gradient(135deg, rgba(8,12,25,0.92), rgba(3,6,15,0.88))',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(0,212,255,0.08)',
          boxShadow: '0 0 60px rgba(0,60,120,0.08), inset 0 1px 0 rgba(255,255,255,0.02)',
        }}>
          {/* Corner decorations */}
          <div style={{ position: 'absolute', top: -1, left: -1, width: 20, height: 20, borderTop: '2px solid rgba(0,212,255,0.4)', borderLeft: '2px solid rgba(0,212,255,0.4)' }} />
          <div style={{ position: 'absolute', top: -1, right: -1, width: 20, height: 20, borderTop: '2px solid rgba(0,212,255,0.4)', borderRight: '2px solid rgba(0,212,255,0.4)' }} />
          <div style={{ position: 'absolute', bottom: -1, left: -1, width: 20, height: 20, borderBottom: '2px solid rgba(0,212,255,0.15)', borderLeft: '2px solid rgba(0,212,255,0.15)' }} />
          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 20, height: 20, borderBottom: '2px solid rgba(0,212,255,0.15)', borderRight: '2px solid rgba(0,212,255,0.15)' }} />

          {/* Scanline overlay */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,200,255,0.01) 3px, rgba(0,200,255,0.01) 4px)',
            pointerEvents: 'none',
          }} />

          {/* Label */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
          }}>
            <div style={{ width: 6, height: 6, background: '#00d4ff', boxShadow: '0 0 8px #00d4ff', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
            <span style={{
              fontSize: 9, letterSpacing: 6, color: 'rgba(0,212,255,0.6)',
              fontFamily: "'Orbitron', monospace",
            }}>
              MODO SELECCIONADO
            </span>
          </div>

          {/* Mode name */}
          <h2 style={{
            fontSize: 24, letterSpacing: 4,
            fontFamily: "'Orbitron', serif",
            fontWeight: 900,
            marginBottom: 14,
            background: 'linear-gradient(180deg, #ffe066, #ffcc33, #ff8800)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 10px rgba(255,180,0,0.3))',
            transition: 'all 0.3s ease',
          }}>
            {currentHover || 'MODO'}
          </h2>

          {/* Separator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16,
          }}>
            <div style={{ width: 40, height: 2, background: 'linear-gradient(90deg, #ffcc33, transparent)' }} />
            <div style={{ width: 4, height: 4, border: '1px solid rgba(255,200,0,0.4)', transform: 'rotate(45deg)' }} />
            <div style={{ flex: 1, height: 1, background: 'rgba(0,212,255,0.1)' }} />
          </div>

          {/* Description */}
          <p style={{
            fontSize: 13, lineHeight: 1.8,
            color: 'rgba(200,220,240,0.75)',
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 400,
            letterSpacing: 0.5,
          }}>
            {infoText}
          </p>
        </div>

        {/* Controls hint */}
        <div style={{
          marginTop: 24, display: 'flex', gap: 6, justifyContent: 'center',
        }}>
          {[
            { key: '↑↓', label: 'NAVEGAR' },
            { key: '↵', label: 'SELECCIONAR' },
            { key: 'ESC', label: 'VOLVER' },
          ].map(c => (
            <div key={c.key} style={{
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                padding: '3px 8px',
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.15)',
                fontSize: 10, color: 'rgba(0,212,255,0.5)',
                fontFamily: "'Orbitron', monospace",
              }}>{c.key}</span>
              <span style={{
                fontSize: 8, letterSpacing: 2, color: 'rgba(200,220,240,0.25)',
                fontFamily: "'Orbitron', monospace",
              }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom branding */}
      <div style={{
        position: 'fixed', bottom: 24, left: '6%',
        display: 'flex', alignItems: 'center', gap: 12,
        opacity: phase >= 3 ? 1 : 0,
        transition: 'opacity 1.5s ease 0.5s',
      }}>
        <div style={{ width: 30, height: 1, background: 'rgba(0,212,255,0.2)' }} />
        <span style={{
          fontSize: 9, letterSpacing: 5, color: 'rgba(200,230,255,0.15)',
          fontFamily: "'Orbitron', monospace",
        }}>
          v1.0 · RELIQUIA DEL VACÍO
        </span>
      </div>

      {/* Bottom-right */}
      <div style={{
        position: 'fixed', bottom: 24, right: '4%',
        opacity: phase >= 3 ? 1 : 0,
        transition: 'opacity 1.5s ease 0.5s',
        animation: 'pulse 3s ease-in-out infinite',
      }}>
        <span style={{
          fontSize: 10, letterSpacing: 4, color: 'rgba(0,212,255,0.2)',
          fontFamily: "'Orbitron', monospace",
        }}>
          ◆ PRESS START ◆
        </span>
      </div>
    </div>
  );
};

export default MainMenu;
