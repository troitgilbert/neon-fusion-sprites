import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../game/GameContext';
import { useGame } from '../game/GameContext';
import { MODE_INFO } from '../game/constants';
import titleLogo from '../assets/title-logo-hd.png';

interface MenuItem {
  label: string;
  action?: () => void;
  hasSub?: boolean;
  subItems?: { label: string; action: () => void; className?: string }[];
}

const MainMenu: React.FC = () => {
  const { setGameState, gilbertUnlocked } = useGame();
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
    ...(gilbertUnlocked ? [
      {
        label: 'MODO DESARROLLADOR', hasSub: true,
        subItems: [
          { label: 'CREADOR DE PERSONAJES', action: () => setGameState('DEV_CREATOR'), className: 'dev-mode' },
          { label: 'CREADOR DE ESCENARIOS', action: () => setGameState('DEV_STAGE_CREATOR'), className: 'dev-mode' },
        ]
      } as MenuItem
    ] : []),
  ], [setGameState, gilbertUnlocked]);

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
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ══════ MK9 Dark overlays ══════ */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20%', background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%', background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)', pointerEvents: 'none' }} />

      {/* Ember particles */}
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

      {/* Red ambient glow */}
      <div style={{
        position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '12%',
        background: 'radial-gradient(ellipse at center bottom, rgba(180,30,0,0.15) 0%, transparent 70%)',
        pointerEvents: 'none', animation: 'mk9FireGlow 3s ease-in-out infinite',
      }} />

      {/* ══════ ROW 1: TITLE (fixed height) ══════ */}
      <div style={{
        flexShrink: 0,
        height: 'clamp(90px, 18vh, 160px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0) scale(1)' : 'translateY(-30px) scale(0.9)',
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative', zIndex: 2,
      }}>
        {/* Dragon line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 'clamp(30px, 8vw, 80px)', height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,50,0,0.6), rgba(255,180,50,0.4))' }} />
          <span style={{ fontSize: 'clamp(12px, 1.8vw, 20px)', filter: 'drop-shadow(0 0 6px rgba(255,80,0,0.5))' }}>🐉</span>
          <div style={{ width: 'clamp(30px, 8vw, 80px)', height: 1, background: 'linear-gradient(270deg, transparent, rgba(200,50,0,0.6), rgba(255,180,50,0.4))' }} />
        </div>

        {/* Title logo image */}
        <img
          src={titleLogo}
          alt="Jinsei No Sakoru"
          style={{
            height: 'clamp(170px, 34vw, 400px)',
            width: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 20px rgba(255,120,0,0.5)) drop-shadow(0 0 50px rgba(255,60,0,0.3)) drop-shadow(0 4px 2px rgba(0,0,0,0.9))',
            animation: 'titleGlow 4s ease-in-out infinite',
          }}
        />

      </div>

      {/* ══════ ROW 2: MENU (fills remaining space, left-aligned) ══════ */}
      <div style={{
        flex: 1, minHeight: 0,
        display: 'flex', flexDirection: 'row',
        position: 'relative', zIndex: 2,
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 0.8s ease 0.2s',
        padding: '0 clamp(16px, 4vw, 60px)',
      }}>
        {/* LEFT: Menu buttons - MUGEN capsule style */}
        <div style={{
          width: 'clamp(280px, 36vw, 440px)',
          overflowY: 'auto', scrollbarWidth: 'none',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          paddingRight: 20,
          gap: 3,
        }}>
          {menuItems.map((item, i) => {
            const active = isActive(i);
            const num = String(i + 1).padStart(2, '0');
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
                    width: '100%',
                    padding: 0,
                    cursor: 'pointer',
                    border: 'none',
                    background: 'transparent',
                    display: 'flex', alignItems: 'center',
                    gap: 0,
                    transform: active ? 'translateX(6px) scale(1.03)' : 'translateX(0) scale(1)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    animation: `mk9ItemIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${0.06 * i}s both`,
                    filter: active ? 'brightness(1.2)' : 'brightness(0.7)',
                  }}
                >
                  {/* Number badge */}
                  <div style={{
                    width: 'clamp(32px, 3.5vw, 48px)',
                    height: 'clamp(28px, 3vw, 40px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active
                      ? 'linear-gradient(135deg, #ffcc33 0%, #ff8800 50%, #cc5500 100%)'
                      : 'linear-gradient(135deg, #8a7a60 0%, #6b5b45 50%, #4a3a28 100%)',
                    borderRadius: 'clamp(14px, 1.5vw, 20px) 0 0 clamp(14px, 1.5vw, 20px)',
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 'clamp(11px, 1.2vw, 16px)',
                    fontWeight: 900,
                    color: active ? '#1a0800' : '#2a2015',
                    textShadow: active ? '0 1px 0 rgba(255,255,200,0.4)' : 'none',
                    flexShrink: 0,
                    boxShadow: active
                      ? '0 0 15px rgba(255,140,0,0.4), inset 0 1px 0 rgba(255,255,200,0.3), inset 0 -1px 0 rgba(0,0,0,0.3)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)',
                    transition: 'all 0.2s',
                  }}>
                    {num}
                  </div>

                  {/* Label capsule */}
                  <div style={{
                    flex: 1,
                    height: 'clamp(28px, 3vw, 40px)',
                    display: 'flex', alignItems: 'center',
                    padding: '0 clamp(12px, 1.5vw, 20px)',
                    background: active
                      ? 'linear-gradient(180deg, rgba(80,60,30,0.9) 0%, rgba(50,35,15,0.95) 40%, rgba(30,20,8,0.95) 100%)'
                      : 'linear-gradient(180deg, rgba(45,40,32,0.8) 0%, rgba(30,25,18,0.85) 40%, rgba(20,16,10,0.9) 100%)',
                    borderRadius: '0 clamp(14px, 1.5vw, 20px) clamp(14px, 1.5vw, 20px) 0',
                    border: active
                      ? '1px solid rgba(255,180,50,0.4)'
                      : '1px solid rgba(120,100,70,0.2)',
                    borderLeft: 'none',
                    boxShadow: active
                      ? '0 0 20px rgba(255,140,0,0.15), inset 0 1px 0 rgba(255,200,100,0.1), inset 0 -1px 0 rgba(0,0,0,0.4)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                  }}>
                    {/* Metallic sheen overlay */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: active
                        ? 'linear-gradient(180deg, rgba(255,220,150,0.12) 0%, transparent 30%, transparent 70%, rgba(255,180,80,0.05) 100%)'
                        : 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.01) 100%)',
                      pointerEvents: 'none',
                    }} />

                    {/* Dot pattern decoration */}
                    <div style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      display: 'flex', gap: 3, opacity: active ? 0.5 : 0.15,
                      transition: 'opacity 0.2s',
                    }}>
                      {Array.from({ length: 6 }).map((_, di) => (
                        <div key={di} style={{
                          width: 4, height: 4, borderRadius: '50%',
                          background: active
                            ? 'radial-gradient(circle, rgba(255,200,100,0.8), rgba(200,140,50,0.4))'
                            : 'radial-gradient(circle, rgba(150,130,100,0.4), rgba(80,60,40,0.2))',
                          boxShadow: active ? '0 0 3px rgba(255,180,50,0.3)' : 'none',
                        }} />
                      ))}
                    </div>

                    {/* Sweep animation on active */}
                    {active && <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(90deg, transparent 20%, rgba(255,220,150,0.08) 45%, transparent 80%)',
                      animation: 'sweepRight 2s ease-in-out infinite',
                      pointerEvents: 'none',
                    }} />}

                    {/* Label text */}
                    <span style={{
                      position: 'relative', zIndex: 1,
                      fontFamily: "'Orbitron', serif",
                      fontSize: 'clamp(11px, 1.2vw, 15px)',
                      fontWeight: active ? 800 : 600,
                      letterSpacing: active ? 3 : 1.5,
                      color: active ? '#ffe0a0' : 'rgba(180,160,130,0.5)',
                      textShadow: active
                        ? '0 0 12px rgba(255,180,50,0.5), 0 1px 2px rgba(0,0,0,0.8)'
                        : '0 1px 2px rgba(0,0,0,0.5)',
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      {item.label}
                      {item.hasSub && (
                        <span style={{
                          fontSize: 8, opacity: active ? 0.7 : 0.3,
                          color: active ? '#ffaa33' : '#8b7355',
                          transform: openSubMenu === i ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.3s',
                        }}>▶</span>
                      )}
                    </span>
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* RIGHT: Description panel */}
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
          paddingBottom: 'clamp(10px, 2vh, 30px)',
        }}>
          <div style={{
            width: 'clamp(200px, 22vw, 320px)',
            opacity: phase >= 3 ? 0.95 : 0,
            transform: phase >= 3 ? 'translateY(0)' : 'translateY(15px)',
            transition: 'all 0.8s ease',
          }}>
            <div style={{
              padding: 'clamp(12px, 1.2vw, 18px)',
              background: 'linear-gradient(180deg, rgba(15,5,0,0.85), rgba(5,0,0,0.9))',
              border: '1px solid rgba(180,60,0,0.12)',
              borderTop: '2px solid rgba(200,80,0,0.25)',
              boxShadow: '0 0 25px rgba(0,0,0,0.4), inset 0 0 15px rgba(100,20,0,0.04)',
            }}>
              <span style={{
                fontSize: 'clamp(6px, 0.6vw, 8px)', letterSpacing: 4,
                color: 'rgba(200,100,30,0.45)', fontFamily: "'Orbitron', monospace",
                display: 'block', marginBottom: 6,
              }}>▸ MODO</span>

              <h3 style={{
                fontSize: 'clamp(12px, 1.4vw, 18px)',
                fontFamily: "'Orbitron', serif", fontWeight: 800,
                letterSpacing: 3, color: '#d4a037',
                textShadow: '0 0 8px rgba(255,100,0,0.25), 0 1px 0 #6b4f10',
                marginBottom: 8, transition: 'all 0.3s',
              }}>
                {currentHover || 'MODO'}
              </h3>

              <div style={{ width: '100%', height: 1, marginBottom: 8, background: 'linear-gradient(90deg, rgba(200,80,0,0.35), transparent)' }} />

              <p style={{
                fontSize: 'clamp(8px, 0.9vw, 11px)', lineHeight: 1.7,
                color: 'rgba(200,180,150,0.55)', fontFamily: "'Orbitron', sans-serif", fontWeight: 400,
              }}>
                {infoText}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ SUBMENU OVERLAY ══════ */}
      {openSubMenu !== null && inSub && (() => {
        const parentItem = menuItems[openSubMenu];
        const subs = parentItem?.subItems || [];
        return (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 20,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            animation: 'mk9OverlayIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}>
            {/* Dark backdrop - blue galaxy */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at center 60%, rgba(0,40,120,0.2) 0%, rgba(0,10,40,0.95) 50%, rgba(0,0,10,0.98) 100%)',
              backdropFilter: 'blur(12px)',
              animation: 'mk9BgFade 0.4s ease-out forwards',
            }} />
            <div style={{ position: 'absolute', top: '20%', left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,100,255,0.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', bottom: '25%', right: '25%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(80,0,200,0.06) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(30px)' }} />

            <div style={{ position: 'absolute', left: 'clamp(30px, 8vw, 100px)', top: '10%', bottom: '10%', width: 1, background: 'linear-gradient(180deg, transparent, rgba(0,120,255,0.15), transparent)' }} />
            <div style={{ position: 'absolute', right: 'clamp(30px, 8vw, 100px)', top: '10%', bottom: '10%', width: 1, background: 'linear-gradient(180deg, transparent, rgba(0,120,255,0.15), transparent)' }} />
            <div style={{ position: 'absolute', top: 'clamp(40px, 8vh, 80px)', left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,120,255,0.2), transparent)' }} />
            <div style={{ position: 'absolute', bottom: 'clamp(40px, 8vh, 80px)', left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,120,255,0.2), transparent)' }} />

            {/* Title */}
            <div style={{ position: 'relative', zIndex: 1, marginBottom: 'clamp(20px, 4vh, 40px)', textAlign: 'center', animation: 'mk9TitleSlide 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', marginBottom: 10 }}>
                <div style={{ width: 'clamp(30px, 6vw, 60px)', height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,180,255,0.5))' }} />
                <div style={{ width: 6, height: 6, border: '1px solid rgba(0,180,255,0.3)', transform: 'rotate(45deg)' }} />
                <span style={{ fontSize: 'clamp(7px, 0.8vw, 9px)', letterSpacing: 6, color: 'rgba(0,180,255,0.5)', fontFamily: "'Orbitron', monospace" }}>SELECCIONA</span>
                <div style={{ width: 6, height: 6, border: '1px solid rgba(0,180,255,0.3)', transform: 'rotate(45deg)' }} />
                <div style={{ width: 'clamp(30px, 6vw, 60px)', height: 1, background: 'linear-gradient(270deg, transparent, rgba(0,180,255,0.5))' }} />
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 44px)', fontWeight: 900, fontFamily: "'Orbitron', serif", letterSpacing: 'clamp(4px, 0.8vw, 10px)', color: '#a0d4ff', textShadow: '0 0 20px rgba(0,120,255,0.6), 0 0 50px rgba(0,60,200,0.25), 0 2px 0 #1a4a8b, 0 4px 6px rgba(0,0,0,0.7)' }}>
                {parentItem.label}
              </h2>
              <div style={{ width: 'clamp(80px, 14vw, 160px)', height: 2, margin: '10px auto 0', background: 'linear-gradient(90deg, transparent, #3388dd 30%, #00bbff 50%, #3388dd 70%, transparent)', boxShadow: '0 0 10px rgba(0,140,255,0.2)' }} />
            </div>

            {/* Capsule items */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '48vh', overflowY: 'auto', scrollbarWidth: 'none', width: 'clamp(320px, 40vw, 500px)', padding: '8px 0', gap: 3 }}>
              {subs.map((sub, si) => {
                const sa = subIndex === si;
                const isBoss = sub.className === 'boss-rush';
                const isMystery = sub.className === 'mystery';
                const num = String(si + 1).padStart(2, '0');
                const badgeActive = isBoss ? 'linear-gradient(135deg, #ff4444, #cc2222, #991111)' : 'linear-gradient(135deg, #33aaff, #0077dd, #004499)';
                return (
                  <button key={sub.label}
                    onClick={() => sub.action()}
                    onMouseEnter={() => { setSubIndex(si); setHoveredMode(sub.label); if (isMystery) setMysteryHover(true); }}
                    onMouseLeave={() => { setHoveredMode(''); if (isMystery) setMysteryHover(false); }}
                    style={{
                      position: 'relative', width: '100%', padding: 0, cursor: 'pointer', border: 'none', background: 'transparent',
                      display: 'flex', alignItems: 'center', gap: 0,
                      transform: sa ? 'translateX(6px) scale(1.03)' : 'scale(1)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      animation: `mk9ItemIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${0.12 + si * 0.04}s both`,
                      filter: sa ? 'brightness(1.2)' : 'brightness(0.65)',
                    }}
                  >
                    <div style={{
                      width: 'clamp(30px, 3.2vw, 44px)', height: 'clamp(26px, 2.8vw, 36px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: sa ? badgeActive : 'linear-gradient(135deg, #4a5568, #2d3748, #1a202c)',
                      borderRadius: 'clamp(13px, 1.4vw, 18px) 0 0 clamp(13px, 1.4vw, 18px)',
                      fontFamily: "'Orbitron', monospace", fontSize: 'clamp(10px, 1.1vw, 14px)', fontWeight: 900,
                      color: sa ? '#fff' : '#667', flexShrink: 0,
                      boxShadow: sa ? (isBoss ? '0 0 15px rgba(255,50,50,0.4)' : '0 0 15px rgba(0,120,255,0.4)') : 'none',
                      transition: 'all 0.2s',
                    }}>{num}</div>
                    <div style={{
                      flex: 1, height: 'clamp(26px, 2.8vw, 36px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 clamp(14px, 1.8vw, 24px)',
                      background: sa ? 'linear-gradient(180deg, rgba(0,50,100,0.85), rgba(0,15,40,0.95))' : 'linear-gradient(180deg, rgba(30,35,45,0.8), rgba(10,12,18,0.9))',
                      borderRadius: '0 clamp(13px, 1.4vw, 18px) clamp(13px, 1.4vw, 18px) 0',
                      border: sa ? (isBoss ? '1px solid rgba(255,80,80,0.4)' : '1px solid rgba(0,150,255,0.35)') : '1px solid rgba(80,90,110,0.15)',
                      borderLeft: 'none', position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
                    }}>
                      <div style={{ position: 'absolute', inset: 0, background: sa ? 'linear-gradient(180deg, rgba(100,200,255,0.1), transparent 30%)' : 'none', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 3, opacity: sa ? 0.5 : 0.12 }}>
                        {Array.from({ length: 5 }).map((_, di) => (
                          <div key={di} style={{ width: 3, height: 3, borderRadius: '50%', background: sa ? (isBoss ? 'rgba(255,100,100,0.6)' : 'rgba(100,200,255,0.6)') : 'rgba(100,110,130,0.25)' }} />
                        ))}
                      </div>
                      {sa && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 20%, rgba(100,200,255,0.06) 45%, transparent 80%)', animation: 'sweepRight 2s ease-in-out infinite', pointerEvents: 'none' }} />}
                      <span style={{
                        position: 'relative', zIndex: 1, fontFamily: "'Orbitron', serif",
                        fontSize: 'clamp(10px, 1.1vw, 14px)', fontWeight: sa ? 800 : 600, letterSpacing: sa ? 3 : 1.5,
                        color: isBoss ? (sa ? '#ff8888' : 'rgba(180,80,80,0.4)') : isMystery ? (sa ? '#556' : '#111') : (sa ? '#b0e0ff' : 'rgba(140,160,180,0.4)'),
                        textShadow: sa ? (isBoss ? '0 0 12px rgba(255,80,80,0.5)' : '0 0 12px rgba(0,150,255,0.5)') : 'none',
                        transition: 'all 0.2s',
                      }}>
                        {isMystery ? <span style={{ animation: 'mysteryFlicker 2s infinite' }}>{sub.label}</span> : sub.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Description in submenu */}
            <div style={{
              position: 'relative', zIndex: 1,
              marginTop: 'clamp(12px, 2vh, 24px)',
              width: 'clamp(240px, 30vw, 380px)',
              textAlign: 'center',
              animation: 'mk9ItemIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both',
            }}>
              <div style={{ width: '60%', height: 1, margin: '0 auto 10px', background: 'linear-gradient(90deg, transparent, rgba(0,120,255,0.2), transparent)' }} />
              <p style={{
                fontSize: 'clamp(8px, 0.85vw, 11px)', lineHeight: 1.7,
                color: 'rgba(140,180,220,0.45)', fontFamily: "'Orbitron', sans-serif", fontWeight: 400,
                transition: 'all 0.3s',
              }}>
                {infoText}
              </p>
            </div>

            {/* Back button */}
            <div style={{
              position: 'relative', zIndex: 1,
              marginTop: 'clamp(14px, 2.5vh, 28px)',
              animation: 'mk9ItemIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both',
            }}>
              <button
                onClick={() => { setInSub(false); setOpenSubMenu(null); }}
                style={{
                  padding: '10px 32px',
                  fontSize: 'clamp(10px, 1.1vw, 13px)',
                  fontFamily: "'Orbitron', serif",
                  fontWeight: 700, letterSpacing: 4,
                  color: 'rgba(100,170,230,0.5)',
                  background: 'linear-gradient(180deg, rgba(0,40,100,0.1), rgba(0,20,60,0.15))',
                  border: '1px solid rgba(0,100,200,0.2)',
                  borderBottom: '2px solid rgba(0,120,255,0.25)',
                  cursor: 'pointer', borderRadius: 20,
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#a0d4ff';
                  e.currentTarget.style.borderColor = 'rgba(0,150,255,0.4)';
                  e.currentTarget.style.background = 'linear-gradient(180deg, rgba(0,60,140,0.15), rgba(0,30,80,0.2))';
                  e.currentTarget.style.textShadow = '0 0 10px rgba(0,150,255,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'rgba(100,170,230,0.5)';
                  e.currentTarget.style.borderColor = 'rgba(0,100,200,0.2)';
                  e.currentTarget.style.background = 'linear-gradient(180deg, rgba(0,40,100,0.1), rgba(0,20,60,0.15))';
                  e.currentTarget.style.textShadow = 'none';
                }}
              >
                ◀ VOLVER
              </button>
            </div>
          </div>
        );
      })()}


      <div style={{
        flexShrink: 0, height: 'clamp(30px, 4vh, 44px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 2,
        opacity: phase >= 3 ? 1 : 0, transition: 'opacity 1s ease 0.5s',
      }}>
        {/* Top line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent 5%, rgba(180,50,0,0.25) 30%, rgba(255,120,0,0.12) 50%, rgba(180,50,0,0.25) 70%, transparent 95%)',
          boxShadow: '0 0 15px rgba(200,50,0,0.1)',
        }} />

        {/* Controls */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {[{ key: '↑↓', label: 'NAVEGAR' }, { key: '↵', label: 'SELECCIONAR' }, { key: 'ESC', label: 'VOLVER' }].map(c => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                padding: '2px 6px',
                background: 'rgba(180,60,0,0.08)',
                border: '1px solid rgba(180,60,0,0.15)',
                fontSize: 'clamp(7px, 0.7vw, 9px)',
                color: 'rgba(200,150,80,0.4)',
                fontFamily: "'Orbitron', monospace",
              }}>{c.key}</span>
              <span style={{
                fontSize: 'clamp(5px, 0.6vw, 7px)', letterSpacing: 2,
                color: 'rgba(180,140,100,0.2)',
                fontFamily: "'Orbitron', monospace",
              }}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Version */}
        <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}>
          <span style={{ fontSize: 'clamp(5px, 0.5vw, 7px)', letterSpacing: 3, color: 'rgba(160,120,80,0.12)', fontFamily: "'Orbitron', monospace" }}>
            v1.0 · RELIQUIA DEL VACÍO
          </span>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
