import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useGame } from '../game/GameContext';
import { MODE_INFO } from '../game/constants';

interface MenuItem {
  label: string;
  action?: () => void;
  hasSub?: boolean;
  subItems?: { label: string; action: () => void; className?: string }[];
  isMystery?: boolean;
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
  const [titleVisible, setTitleVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);

  // Staggered entrance
  useEffect(() => {
    setTimeout(() => setTitleVisible(true), 200);
    setTimeout(() => setMenuVisible(true), 700);
    setTimeout(() => setPanelVisible(true), 1100);
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
    <div className="fixed inset-0 z-10 flex flex-col justify-center" style={{
      paddingLeft: '6%',
      background: mysteryHover ? 'rgba(0,0,0,0.95)' : 'transparent',
      transition: 'background 0.5s',
    }}>

      {/* Horizontal accent line */}
      <div style={{
        position: 'absolute', top: '12%', left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 5%, rgba(0,212,255,0.3) 30%, rgba(168,85,247,0.2) 70%, transparent 95%)',
        opacity: titleVisible ? 1 : 0, transition: 'opacity 1s',
      }} />

      {/* Title */}
      <div style={{
        opacity: titleVisible ? 1 : 0,
        transform: titleVisible ? 'translateY(0)' : 'translateY(-30px)',
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
        marginBottom: 12,
      }}>
        {/* Subtitle */}
        <div style={{
          fontSize: 11, letterSpacing: 12, color: 'rgba(0,212,255,0.7)',
          fontFamily: "'Orbitron', monospace", fontWeight: 400,
          marginBottom: 8, marginLeft: 4,
        }}>
          ── COMBATE CÓSMICO ──
        </div>

        <h1 style={{
          fontSize: 'clamp(42px, 6vw, 80px)',
          fontWeight: 900,
          letterSpacing: 6,
          color: '#ffcc33',
          fontFamily: "'Orbitron', serif",
          lineHeight: 1.1,
          animation: 'titlePulseAAA 4s ease-in-out infinite',
          textShadow: `
            0 0 10px rgba(255,102,0,0.8),
            0 0 30px rgba(255,0,0,0.4),
            0 0 60px rgba(153,0,0,0.3),
            0 2px 0 #b8860b,
            0 4px 0 #8b6914,
            0 6px 20px rgba(0,0,0,0.8)
          `,
        }}>
          RELIQUIA<br />DEL VACÍO
        </h1>

        {/* Underline accent */}
        <div style={{
          width: 200, height: 2, marginTop: 14, marginLeft: 2,
          background: 'linear-gradient(90deg, #ffcc33, #ff6600, transparent)',
          boxShadow: '0 0 15px rgba(255,102,0,0.5)',
        }} />
      </div>

      {/* Menu buttons */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        opacity: menuVisible ? 1 : 0,
        transform: menuVisible ? 'translateX(0)' : 'translateX(-40px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        maxHeight: '55vh', overflowY: 'auto',
        scrollbarWidth: 'none',
      }}>
        {menuItems.map((item, i) => (
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
                width: 340,
                padding: '11px 20px 11px 16px',
                margin: '3px 0',
                fontSize: 16,
                textAlign: 'left',
                background: isActive(i)
                  ? 'linear-gradient(90deg, rgba(255,140,0,0.2) 0%, rgba(255,80,0,0.08) 60%, transparent 100%)'
                  : 'linear-gradient(90deg, rgba(15,35,60,0.6) 0%, rgba(0,0,0,0.1) 100%)',
                color: isActive(i) ? '#fff' : 'rgba(200,230,255,0.7)',
                letterSpacing: 3,
                cursor: 'pointer',
                border: 'none',
                fontFamily: "'Orbitron', serif",
                fontWeight: isActive(i) ? 700 : 400,
                transform: isActive(i) ? 'translateX(18px) scale(1.02)' : 'translateX(0) scale(1)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden',
                borderRadius: 0,
              }}
            >
              {/* Left accent bar */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: isActive(i) ? 4 : 2,
                background: isActive(i)
                  ? 'linear-gradient(180deg, #ffcc33, #ff6600)'
                  : 'rgba(0,212,255,0.4)',
                boxShadow: isActive(i) ? '0 0 15px rgba(255,140,0,0.6), 4px 0 20px rgba(255,100,0,0.3)' : 'none',
                transition: 'all 0.25s ease',
              }} />

              {/* Scan line on active */}
              {isActive(i) && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(90deg, rgba(255,200,0,0.05) 0%, transparent 50%)',
                  animation: 'menuScanline 2s ease-in-out infinite',
                  pointerEvents: 'none',
                }} />
              )}

              {/* Content */}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, filter: isActive(i) ? 'none' : 'grayscale(0.5) opacity(0.5)' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.hasSub && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 10, opacity: 0.5,
                    color: isActive(i) ? '#ffcc33' : '#4fdcff',
                  }}>▶</span>
                )}
              </span>

              {/* Bottom border */}
              <div style={{
                position: 'absolute', bottom: 0, left: 16, right: 16, height: 1,
                background: isActive(i) ? 'rgba(255,140,0,0.2)' : 'rgba(100,180,255,0.08)',
              }} />
            </button>

            {/* Submenu */}
            {item.hasSub && openSubMenu === i && (
              <div style={{
                marginLeft: 36, marginTop: 2, marginBottom: 4,
                borderLeft: '1px solid rgba(0,212,255,0.15)',
                paddingLeft: 0,
                animation: 'subMenuSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}>
                {item.subItems!.map((sub, si) => {
                  const isSubActive = inSub && subIndex === si;
                  const isBoss = sub.className === 'boss-rush';
                  const isLogros = sub.className === 'logros';
                  const isMystery = sub.className === 'mystery';

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
                        display: 'block', width: 280, padding: '8px 14px 8px 14px', margin: '2px 0',
                        fontSize: 14,
                        background: isSubActive
                          ? 'linear-gradient(90deg, rgba(255,140,0,0.15), transparent)'
                          : 'transparent',
                        color: isBoss ? '#ff6b6b' : isLogros ? '#ffd2a1' : isMystery ? '#444' : (isSubActive ? '#fff' : 'rgba(200,230,255,0.6)'),
                        opacity: isSubActive ? 1 : 0.8,
                        letterSpacing: 2, cursor: 'pointer', border: 'none',
                        textShadow: isBoss ? '0 0 10px rgba(255,0,0,0.6)' : isLogros ? '0 0 8px rgba(255,140,0,0.4)' : 'none',
                        fontFamily: "'Orbitron', serif",
                        fontWeight: isSubActive ? 600 : 400,
                        transform: isSubActive ? 'translateX(10px)' : 'translateX(0)',
                        transition: 'all 0.2s ease',
                        borderRadius: 0,
                      }}
                    >
                      {/* Sub accent */}
                      <div style={{
                        position: 'absolute', left: 0, top: '20%', bottom: '20%', width: isSubActive ? 3 : 0,
                        background: isBoss ? '#ff0000' : isLogros ? '#ff8c00' : '#ffcc33',
                        transition: 'width 0.2s ease',
                        boxShadow: isSubActive ? `0 0 8px ${isBoss ? 'rgba(255,0,0,0.5)' : isLogros ? 'rgba(255,140,0,0.5)' : 'rgba(255,200,0,0.5)'}` : 'none',
                      }} />
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Info Panel - cinematic */}
      <div style={{
        position: 'fixed', right: '4%', top: '18%', width: 380,
        opacity: panelVisible ? 1 : 0,
        transform: panelVisible ? 'translateX(0)' : 'translateX(40px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Panel frame */}
        <div style={{
          padding: '24px 26px',
          background: 'linear-gradient(135deg, rgba(10,15,30,0.9) 0%, rgba(5,8,20,0.85) 100%)',
          backdropFilter: 'blur(12px)',
          borderLeft: '3px solid rgba(0,212,255,0.4)',
          borderTop: '1px solid rgba(0,212,255,0.1)',
          borderBottom: '1px solid rgba(0,212,255,0.05)',
          boxShadow: '0 0 40px rgba(0,100,255,0.1), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}>
          {/* Label */}
          <div style={{
            fontSize: 9, letterSpacing: 5, color: 'rgba(0,212,255,0.5)',
            fontFamily: "'Orbitron', monospace", marginBottom: 10,
          }}>
            INFORMACIÓN DEL MODO
          </div>

          {/* Mode title */}
          <h2 style={{
            fontSize: 22, letterSpacing: 3,
            color: '#ffcc33',
            fontFamily: "'Orbitron', serif",
            fontWeight: 800,
            marginBottom: 12,
            textShadow: '0 0 15px rgba(255,200,0,0.3)',
            transition: 'all 0.3s ease',
          }}>
            {currentHover || 'MODO'}
          </h2>

          {/* Separator */}
          <div style={{
            width: 60, height: 1, marginBottom: 14,
            background: 'linear-gradient(90deg, #ffcc33, transparent)',
          }} />

          {/* Description */}
          <p style={{
            fontSize: 14, lineHeight: 1.7,
            color: 'rgba(200,230,255,0.8)',
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 400,
          }}>
            {infoText}
          </p>

          {/* Decorative corner */}
          <div style={{
            position: 'absolute', top: -1, right: -1, width: 30, height: 30,
            borderTop: '1px solid rgba(0,212,255,0.3)',
            borderRight: '1px solid rgba(0,212,255,0.3)',
          }} />
          <div style={{
            position: 'absolute', bottom: -1, left: -1, width: 20, height: 20,
            borderBottom: '1px solid rgba(0,212,255,0.15)',
            borderLeft: '1px solid rgba(0,212,255,0.15)',
          }} />
        </div>

        {/* Controls hint */}
        <div style={{
          marginTop: 20, display: 'flex', gap: 16,
          fontSize: 10, letterSpacing: 2,
          color: 'rgba(200,230,255,0.3)',
          fontFamily: "'Orbitron', monospace",
        }}>
          <span>↑↓ NAVEGAR</span>
          <span>ENTER SELECCIONAR</span>
          <span>ESC VOLVER</span>
        </div>
      </div>

      {/* Bottom version/branding */}
      <div style={{
        position: 'fixed', bottom: 20, left: '6%',
        fontSize: 10, letterSpacing: 4,
        color: 'rgba(200,230,255,0.2)',
        fontFamily: "'Orbitron', monospace",
        opacity: menuVisible ? 1 : 0,
        transition: 'opacity 1s ease 1.5s',
      }}>
        v1.0 — RELIQUIA DEL VACÍO
      </div>

      {/* Bottom-right decorative */}
      <div style={{
        position: 'fixed', bottom: 20, right: '4%',
        fontSize: 10, letterSpacing: 3,
        color: 'rgba(0,212,255,0.15)',
        fontFamily: "'Orbitron', monospace",
        opacity: panelVisible ? 1 : 0,
        transition: 'opacity 1s ease 1.5s',
      }}>
        ◆ PRESS START ◆
      </div>
    </div>
  );
};

export default MainMenu;
