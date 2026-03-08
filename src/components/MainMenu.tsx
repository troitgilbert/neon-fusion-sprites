import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../game/GameContext';
import { MODE_INFO } from '../game/constants';

interface MenuItem {
  label: string;
  action?: () => void;
  hasSub?: boolean;
  subItems?: { label: string; action: () => void; className?: string }[];
}

const MainMenu: React.FC = () => {
  const { setGameState } = useGame();
  const [activeIndex, setActiveIndex] = useState(0);
  const [inSub, setInSub] = useState(false);
  const [subIndex, setSubIndex] = useState(0);
  const [openSubMenu, setOpenSubMenu] = useState<number | null>(null);
  const [hoveredMode, setHoveredMode] = useState('');
  const [mysteryHover, setMysteryHover] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 700);
    const t3 = setTimeout(() => setPhase(3), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const menuItems: MenuItem[] = useMemo(() => [
    { label: 'HISTORIA', action: () => setGameState('STORY_SELECT') },
    { label: 'ARCADE', action: () => setGameState('SELECT', 'arcade') },
    { label: 'AVENTURA', action: () => setGameState('ADVENTURE_CHAR_SELECT' as any, 'adventure') },
    {
      label: 'VERSUS', hasSub: true,
      subItems: [
        { label: 'VERSUS', action: () => setGameState('SELECT', 'versus') },
        { label: 'BATALLA LIBRE', action: () => setGameState('DIFFICULTY_SELECT') },
      ]
    },
    {
      label: 'MODOS DE JUEGO', hasSub: true,
      subItems: [
        { label: 'MISIONES', action: () => setGameState('MISSIONS') },
        { label: 'EVENTOS', action: () => setGameState('EVENTS') },
        { label: 'SUPERVIVENCIA', action: () => setGameState('SELECT', 'survival') },
        { label: 'BOSS RUSH', action: () => setGameState('BOSS_RUSH'), className: 'boss-rush' },
        { label: 'SELECCIÓN DE JEFES', action: () => setGameState('BOSS_SELECT') },
        { label: 'ENTRENAMIENTO', action: () => setGameState('SELECT', 'training') },
        { label: 'JUEGOS MENTALES', action: () => setGameState('MIND_GAMES') },
        { label: 'CITAS', action: () => setGameState('DATING') },
        { label: 'CREADOR', action: () => setGameState('CREATOR') },
        { label: 'NIVELES', action: () => {} },
        { label: 'MINIJUEGOS', action: () => setGameState('MINIGAMES') },
        { label: '???', action: () => {}, className: 'mystery' },
      ]
    },
    { label: 'TIENDA', action: () => setGameState('SHOP') },
    {
      label: 'EXTRAS', hasSub: true,
      subItems: [
        { label: 'DOCUMENTOS', action: () => setGameState('DOCUMENTS') },
        { label: 'LOGROS', action: () => setGameState('ACHIEVEMENTS'), className: 'logros' },
      ]
    },
    { label: 'ONLINE', action: () => setGameState('ONLINE') },
    { label: 'CONFIGURACIÓN', action: () => setGameState('CONFIG') },
    { label: 'SALIR', action: () => {} },
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
      background: mysteryHover ? 'rgba(0,0,0,0.97)' : 'transparent',
      transition: 'background 0.5s',
    }}>

      {/* ══════ MK9 Dark overlays ══════ */}
      {/* Top dark gradient */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '25%',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      {/* Bottom dark gradient */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      {/* Side vignettes */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
        pointerEvents: 'none',
      }} />

      {/* ══════ Ember particles (CSS) ══════ */}
      {phase >= 2 && Array.from({ length: 20 }).map((_, i) => (
        <div key={`ember-${i}`} style={{
          position: 'absolute',
          left: `${10 + Math.random() * 80}%`,
          bottom: '-5%',
          width: Math.random() * 3 + 1,
          height: Math.random() * 3 + 1,
          background: `hsl(${15 + Math.random() * 25}, 100%, ${50 + Math.random() * 30}%)`,
          borderRadius: '50%',
          boxShadow: `0 0 ${3 + Math.random() * 4}px hsl(${15 + Math.random() * 25}, 100%, 50%)`,
          animation: `mk9Ember ${4 + Math.random() * 6}s linear ${Math.random() * 4}s infinite`,
          opacity: 0,
          pointerEvents: 'none',
        }} />
      ))}

      {/* ══════ Red ambient glow at bottom ══════ */}
      <div style={{
        position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '15%',
        background: 'radial-gradient(ellipse at center bottom, rgba(180,30,0,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'mk9FireGlow 3s ease-in-out infinite',
      }} />

      {/* ══════ TITLE ══════ */}
      <div style={{
        position: 'absolute', top: 'clamp(10px, 2vh, 30px)', left: 0, right: 0,
        textAlign: 'center',
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0) scale(1)' : 'translateY(-40px) scale(0.9)',
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Dragon emblem line */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 8,
        }}>
          <div style={{ width: 'clamp(40px, 12vw, 120px)', height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,50,0,0.6), rgba(255,180,50,0.4))' }} />
          <span style={{ fontSize: 'clamp(16px, 2.5vw, 28px)', filter: 'drop-shadow(0 0 8px rgba(255,80,0,0.5))' }}>🐉</span>
          <div style={{ width: 'clamp(40px, 12vw, 120px)', height: 1, background: 'linear-gradient(270deg, transparent, rgba(200,50,0,0.6), rgba(255,180,50,0.4))' }} />
        </div>

        <h1 style={{
          fontSize: 'clamp(24px, 4.5vw, 60px)',
          fontWeight: 900,
          fontFamily: "'Orbitron', serif",
          letterSpacing: 'clamp(4px, 1vw, 14px)',
          lineHeight: 1,
          color: '#e8d5a3',
          textShadow: `
            0 0 20px rgba(255,80,0,0.6),
            0 0 60px rgba(200,30,0,0.3),
            0 0 120px rgba(150,0,0,0.15),
            0 2px 0 #8b6914,
            0 4px 0 #6b4f10,
            0 6px 8px rgba(0,0,0,0.8)
          `,
          animation: 'mk9TitlePulse 4s ease-in-out infinite',
        }}>
          RELIQUIA
        </h1>
        <h1 style={{
          fontSize: 'clamp(18px, 3vw, 42px)',
          fontWeight: 700,
          fontFamily: "'Orbitron', serif",
          letterSpacing: 'clamp(6px, 1.5vw, 20px)',
          lineHeight: 1,
          marginTop: 4,
          color: '#c4a56a',
          textShadow: `
            0 0 15px rgba(255,60,0,0.4),
            0 0 40px rgba(180,20,0,0.2),
            0 2px 0 #6b4f10,
            0 4px 6px rgba(0,0,0,0.7)
          `,
          animation: 'mk9TitlePulse 4s ease-in-out infinite 0.5s',
        }}>
          DEL VACÍO
        </h1>

        {/* Subtitle line */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10,
        }}>
          <div style={{ width: 'clamp(30px, 8vw, 80px)', height: 2, background: 'linear-gradient(90deg, transparent, #8b3a0e, #d4a037)' }} />
          <span style={{
            fontSize: 'clamp(7px, 0.9vw, 10px)', letterSpacing: 6,
            color: 'rgba(200,160,80,0.5)', fontFamily: "'Orbitron', monospace",
          }}>
            KOMBATE KÓSMICO
          </span>
          <div style={{ width: 'clamp(30px, 8vw, 80px)', height: 2, background: 'linear-gradient(270deg, transparent, #8b3a0e, #d4a037)' }} />
        </div>
      </div>

      {/* ══════ CENTERED MENU ══════ */}
      <div style={{
        position: 'absolute', left: '50%', top: 'clamp(140px, 22vh, 220px)', bottom: 'clamp(50px, 8vh, 80px)',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'flex-start',
        overflowY: 'auto', scrollbarWidth: 'none',
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 0.8s ease 0.2s',
      }}>
        {menuItems.map((item, i) => {
          const active = isActive(i);
          const delay = i * 0.04;
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
                  width: 'clamp(260px, 30vw, 400px)',
                  padding: 'clamp(8px, 1.2vh, 14px) 20px',
                  margin: '1px 0',
                  fontSize: 'clamp(13px, 1.5vw, 18px)',
                  textAlign: 'center',
                  fontFamily: "'Orbitron', serif",
                  fontWeight: active ? 800 : 500,
                  letterSpacing: active ? 6 : 3,
                  cursor: 'pointer',
                  border: 'none',
                  borderRadius: 0,
                  overflow: 'hidden',
                  color: active ? '#fff' : 'rgba(180,160,130,0.55)',
                  background: active
                    ? 'linear-gradient(90deg, transparent, rgba(200,40,0,0.25) 20%, rgba(255,120,0,0.15) 50%, rgba(200,40,0,0.25) 80%, transparent)'
                    : 'transparent',
                  textShadow: active
                    ? '0 0 20px rgba(255,100,0,0.7), 0 0 40px rgba(200,30,0,0.3), 0 1px 2px rgba(0,0,0,0.8)'
                    : '0 1px 2px rgba(0,0,0,0.5)',
                  transform: active ? 'scale(1.08)' : 'scale(1)',
                  transition: `all 0.2s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
                  animationDelay: `${delay}s`,
                }}
              >
                {/* Active top/bottom lines */}
                {active && <>
                  <div style={{
                    position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(255,140,30,0.6), rgba(255,80,0,0.8), rgba(255,140,30,0.6), transparent)',
                    boxShadow: '0 0 8px rgba(255,80,0,0.4)',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(255,140,30,0.6), rgba(255,80,0,0.8), rgba(255,140,30,0.6), transparent)',
                    boxShadow: '0 0 8px rgba(255,80,0,0.4)',
                  }} />
                  {/* Sweep effect */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, transparent 30%, rgba(255,200,100,0.06) 50%, transparent 70%)',
                    animation: 'sweepRight 2.5s ease-in-out infinite',
                    pointerEvents: 'none',
                  }} />
                </>}

                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {item.label}
                  {item.hasSub && (
                    <span style={{
                      fontSize: 9, opacity: 0.5,
                      color: active ? '#ff8c00' : '#8b7355',
                      transform: openSubMenu === i ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.3s',
                    }}>▶</span>
                  )}
                </span>
              </button>

              {/* Sub menu */}
              {item.hasSub && openSubMenu === i && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '4px 0', margin: '2px 0',
                  borderLeft: '2px solid rgba(200,50,0,0.2)',
                  borderRight: '2px solid rgba(200,50,0,0.2)',
                  background: 'rgba(0,0,0,0.4)',
                  animation: 'mk9SubSlide 0.3s ease-out',
                  width: 'clamp(240px, 28vw, 360px)',
                }}>
                  {item.subItems!.map((sub, si) => {
                    const sa = inSub && subIndex === si;
                    const isBoss = sub.className === 'boss-rush';
                    const isMystery = sub.className === 'mystery';

                    return (
                      <button key={sub.label}
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
                          width: '100%',
                          padding: '6px 16px',
                          fontSize: 'clamp(10px, 1.1vw, 13px)',
                          textAlign: 'center',
                          fontFamily: "'Orbitron', serif",
                          fontWeight: sa ? 700 : 400,
                          letterSpacing: sa ? 4 : 2,
                          cursor: 'pointer',
                          border: 'none',
                          background: sa
                            ? 'linear-gradient(90deg, transparent, rgba(180,30,0,0.2) 30%, rgba(180,30,0,0.2) 70%, transparent)'
                            : 'transparent',
                          color: isBoss
                            ? (sa ? '#ff4444' : '#8b3030')
                            : isMystery
                              ? (sa ? '#444' : '#222')
                              : (sa ? '#e8d0a0' : 'rgba(160,140,110,0.45)'),
                          textShadow: sa
                            ? (isBoss
                              ? '0 0 15px rgba(255,0,0,0.5)'
                              : '0 0 10px rgba(255,100,0,0.3)')
                            : 'none',
                          transform: sa ? 'scale(1.05)' : 'scale(1)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isMystery
                          ? <span style={{ animation: 'mysteryFlicker 2s infinite' }}>{sub.label}</span>
                          : sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ══════ DESCRIPTION PANEL (bottom right, MK9 style) ══════ */}
      <div style={{
        position: 'absolute', right: 'clamp(16px, 3vw, 40px)', bottom: 'clamp(50px, 8vh, 80px)',
        width: 'clamp(220px, 24vw, 340px)',
        opacity: phase >= 3 ? 0.95 : 0,
        transform: phase >= 3 ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s ease',
        pointerEvents: 'none',
      }}>
        <div style={{
          padding: 'clamp(14px, 1.5vw, 22px)',
          background: 'linear-gradient(180deg, rgba(15,5,0,0.85), rgba(5,0,0,0.9))',
          border: '1px solid rgba(180,60,0,0.15)',
          borderTop: '2px solid rgba(200,80,0,0.3)',
          boxShadow: '0 0 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(100,20,0,0.05)',
        }}>
          <span style={{
            fontSize: 'clamp(7px, 0.7vw, 9px)', letterSpacing: 4,
            color: 'rgba(200,100,30,0.5)', fontFamily: "'Orbitron', monospace",
            display: 'block', marginBottom: 8,
          }}>
            ▸ MODO
          </span>
          <h3 style={{
            fontSize: 'clamp(14px, 1.6vw, 20px)',
            fontFamily: "'Orbitron', serif",
            fontWeight: 800,
            letterSpacing: 3,
            color: '#d4a037',
            textShadow: '0 0 10px rgba(255,100,0,0.3), 0 1px 0 #6b4f10',
            marginBottom: 10,
            transition: 'all 0.3s',
          }}>
            {currentHover || 'MODO'}
          </h3>
          <div style={{
            width: '100%', height: 1, marginBottom: 10,
            background: 'linear-gradient(90deg, rgba(200,80,0,0.4), transparent)',
          }} />
          <p style={{
            fontSize: 'clamp(9px, 1vw, 12px)',
            lineHeight: 1.7,
            color: 'rgba(200,180,150,0.6)',
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 400,
          }}>
            {infoText}
          </p>
        </div>
      </div>

      {/* ══════ BOTTOM BAR ══════ */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent 5%, rgba(180,50,0,0.3) 30%, rgba(255,120,0,0.15) 50%, rgba(180,50,0,0.3) 70%, transparent 95%)',
        boxShadow: '0 0 20px rgba(200,50,0,0.15)',
        opacity: phase >= 3 ? 1 : 0,
        transition: 'opacity 1.5s',
      }} />

      {/* Controls hint */}
      <div style={{
        position: 'fixed', bottom: 14, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 20, opacity: phase >= 3 ? 1 : 0,
        transition: 'opacity 1s ease 0.5s',
      }}>
        {[{ key: '↑↓', label: 'NAVEGAR' }, { key: '↵', label: 'SELECCIONAR' }, { key: 'ESC', label: 'VOLVER' }].map(c => (
          <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              padding: '3px 8px',
              background: 'rgba(180,60,0,0.1)',
              border: '1px solid rgba(180,60,0,0.2)',
              fontSize: 'clamp(8px, 0.8vw, 10px)',
              color: 'rgba(200,150,80,0.5)',
              fontFamily: "'Orbitron', monospace",
            }}>{c.key}</span>
            <span style={{
              fontSize: 'clamp(6px, 0.7vw, 8px)', letterSpacing: 2,
              color: 'rgba(180,140,100,0.25)',
              fontFamily: "'Orbitron', monospace",
            }}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* Version */}
      <div style={{
        position: 'fixed', bottom: 14, left: 20,
        opacity: phase >= 3 ? 1 : 0, transition: 'opacity 1.5s ease 0.5s',
      }}>
        <span style={{
          fontSize: 'clamp(6px, 0.6vw, 8px)', letterSpacing: 3,
          color: 'rgba(160,120,80,0.15)', fontFamily: "'Orbitron', monospace",
        }}>v1.0 · RELIQUIA DEL VACÍO</span>
      </div>
    </div>
  );
};

export default MainMenu;
