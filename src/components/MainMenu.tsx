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
  const [hoveredMode, setHoveredMode] = useState('');
  const [mysteryHover, setMysteryHover] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
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
        { label: 'CREADOR', action: () => setGameState('CREATOR') },
        { label: 'NIVELES', action: () => {} },
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
      {/* ═══════════ LEFT COLUMN: Title + Menu ═══════════ */}
      <div style={{
        position: 'absolute', left: '5%', top: 0, bottom: 0, width: '42%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        {/* Title */}
        <div style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(-30px)',
          transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 6, height: 6, border: '1px solid rgba(0,212,255,0.4)', transform: 'rotate(45deg)' }} />
            <div style={{ width: 80, height: 1, background: 'linear-gradient(90deg, rgba(0,212,255,0.5), transparent)' }} />
            <span style={{ fontSize: 8, letterSpacing: 7, color: 'rgba(0,212,255,0.4)', fontFamily: "'Orbitron', monospace" }}>
              COMBATE CÓSMICO
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 5.5vw, 72px)', fontWeight: 900, letterSpacing: 6,
            fontFamily: "'Orbitron', serif", lineHeight: 0.95,
            background: 'linear-gradient(180deg, #ffe066 0%, #ffcc33 30%, #ff8800 70%, #cc5500 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 15px rgba(255,120,0,0.5)) drop-shadow(0 0 40px rgba(255,60,0,0.25)) drop-shadow(0 3px 0 rgba(0,0,0,0.7))',
            animation: 'titleGlow 4s ease-in-out infinite',
          }}>
            RELIQUIA
          </h1>
          <h1 style={{
            fontSize: 'clamp(36px, 5.5vw, 72px)', fontWeight: 900, letterSpacing: 6,
            fontFamily: "'Orbitron', serif", lineHeight: 0.95, marginTop: -2,
            background: 'linear-gradient(180deg, #ffe066 0%, #ffcc33 30%, #ff8800 70%, #cc5500 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 15px rgba(255,120,0,0.5)) drop-shadow(0 0 40px rgba(255,60,0,0.25)) drop-shadow(0 3px 0 rgba(0,0,0,0.7))',
            animation: 'titleGlow 4s ease-in-out infinite 0.4s',
          }}>
            DEL VACÍO
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <div style={{ width: 140, height: 2, background: 'linear-gradient(90deg, #ffcc33, #ff6600, transparent)', boxShadow: '0 0 15px rgba(255,102,0,0.35)' }} />
            <div style={{ width: 5, height: 5, background: '#ffcc33', transform: 'rotate(45deg)', boxShadow: '0 0 8px rgba(255,200,0,0.5)' }} />
          </div>
        </div>

        {/* Menu */}
        <div style={{
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateX(0)' : 'translateX(-40px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight: '52vh', overflowY: 'auto', scrollbarWidth: 'none',
        }}>
          {menuItems.map((item, i) => {
            const active = isActive(i);
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
                    position: 'relative', width: '100%', maxWidth: 340,
                    padding: '10px 18px 10px 16px', margin: '2px 0',
                    fontSize: 'clamp(12px, 1.4vw, 16px)', textAlign: 'left',
                    background: active
                      ? 'linear-gradient(90deg, rgba(255,150,0,0.18), rgba(255,80,0,0.05) 60%, transparent)'
                      : 'linear-gradient(90deg, rgba(20,40,70,0.25), transparent)',
                    color: active ? '#fff' : 'rgba(180,210,240,0.55)',
                    letterSpacing: active ? 4 : 3, cursor: 'pointer', border: 'none',
                    fontFamily: "'Orbitron', serif", fontWeight: active ? 700 : 400,
                    transform: active ? 'translateX(16px)' : 'translateX(0)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden', borderRadius: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: active ? 3 : 1,
                    background: active ? 'linear-gradient(180deg, #ffcc33, #ff6600, #ffcc33)' : 'rgba(0,212,255,0.2)',
                    boxShadow: active ? '0 0 10px rgba(255,140,0,0.5), 3px 0 20px rgba(255,100,0,0.15)' : 'none',
                    transition: 'all 0.25s ease',
                  }} />
                  {active && <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,200,50,0.03), transparent)',
                    animation: 'sweepRight 3s ease-in-out infinite', pointerEvents: 'none',
                  }} />}
                  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, filter: active ? 'drop-shadow(0 0 4px rgba(255,200,0,0.4))' : 'grayscale(0.6) opacity(0.35)', transition: 'all 0.3s', width: 20, textAlign: 'center' }}>
                      {item.icon}
                    </span>
                    <span style={{ textShadow: active ? '0 0 15px rgba(255,200,100,0.25)' : 'none' }}>{item.label}</span>
                    {item.hasSub && <span style={{ marginLeft: 'auto', fontSize: 8, opacity: 0.35, color: active ? '#ffcc33' : '#4fdcff', transform: openSubMenu === i ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }}>▶</span>}
                  </span>
                  <div style={{ position: 'absolute', bottom: 0, left: 16, right: 16, height: 1, background: active ? 'rgba(255,140,0,0.12)' : 'rgba(100,180,255,0.03)' }} />
                </button>

                {item.hasSub && openSubMenu === i && (
                  <div style={{ marginLeft: 40, marginTop: 3, marginBottom: 5, borderLeft: '1px solid rgba(0,212,255,0.1)', animation: 'subMenuSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    {item.subItems!.map((sub, si) => {
                      const sa = inSub && subIndex === si;
                      const isBoss = sub.className === 'boss-rush';
                      const isLogros = sub.className === 'logros';
                      const isMystery = sub.className === 'mystery';
                      let accent = '#ffcc33';
                      if (isBoss) accent = '#ff2222';
                      if (isLogros) accent = '#ff8c00';

                      return (
                        <button key={sub.label}
                          onClick={() => sub.action()}
                          onMouseEnter={() => { setSubIndex(si); setHoveredMode(sub.label); if (isMystery) setMysteryHover(true); }}
                          onMouseLeave={() => { setHoveredMode(''); if (isMystery) setMysteryHover(false); }}
                          style={{
                            position: 'relative', display: 'block', width: '100%', maxWidth: 280,
                            padding: '7px 14px', margin: '1px 0', fontSize: 'clamp(11px, 1.2vw, 14px)',
                            background: sa ? `linear-gradient(90deg, ${isBoss ? 'rgba(255,0,0,0.1)' : isLogros ? 'rgba(255,140,0,0.1)' : 'rgba(255,150,0,0.1)'}, transparent)` : 'transparent',
                            color: isBoss ? '#ff6b6b' : isLogros ? '#ffd2a1' : isMystery ? '#333' : (sa ? '#e8f0ff' : 'rgba(180,210,240,0.45)'),
                            letterSpacing: 2, cursor: 'pointer', border: 'none',
                            textShadow: (isBoss && sa) ? '0 0 12px rgba(255,0,0,0.4)' : (isLogros && sa) ? '0 0 10px rgba(255,140,0,0.3)' : 'none',
                            fontFamily: "'Orbitron', serif", fontWeight: sa ? 600 : 400,
                            transform: sa ? 'translateX(10px)' : 'none', transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ position: 'absolute', left: 0, top: '25%', bottom: '25%', width: sa ? 2 : 0, background: accent, boxShadow: sa ? `0 0 6px ${accent}80` : 'none', transition: 'all 0.2s' }} />
                          {isMystery ? <span style={{ animation: 'mysteryFlicker 2s infinite' }}>{sub.label}</span> : sub.label}
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

      {/* ═══════════ RIGHT COLUMN: Info panel ═══════════ */}
      <div style={{
        position: 'absolute', right: '3%', bottom: '6%', width: 'clamp(280px, 30vw, 420px)',
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{
          position: 'relative', padding: 'clamp(18px, 2vw, 28px)',
          background: 'linear-gradient(135deg, rgba(8,12,25,0.93), rgba(3,6,15,0.9))',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(0,212,255,0.06)',
          boxShadow: '0 0 50px rgba(0,50,100,0.08), inset 0 1px 0 rgba(255,255,255,0.015)',
        }}>
          {/* Corner brackets */}
          {[['-1','-1','top','left','top','left'],['−1','-1','top','right','top','right'],['-1','-1','bottom','left','bottom','left'],['-1','-1','bottom','right','bottom','right']].map((c, idx) => (
            <div key={idx} style={{
              position: 'absolute',
              [['top','bottom','bottom','top'][idx] as string]: -1,
              [['left','right','left','right'][idx] as string]: -1,
              width: idx < 2 ? 18 : 14, height: idx < 2 ? 18 : 14,
              [`border${['Top','Top','Bottom','Bottom'][idx]}` as string]: `${idx < 2 ? 2 : 1}px solid rgba(0,212,255,${idx < 2 ? 0.35 : 0.12})`,
              [`border${['Left','Right','Left','Right'][idx]}` as string]: `${idx < 2 ? 2 : 1}px solid rgba(0,212,255,${idx < 2 ? 0.35 : 0.12})`,
            }} />
          ))}

          {/* Scanlines */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,180,255,0.008) 3px, rgba(0,180,255,0.008) 4px)',
            pointerEvents: 'none',
          }} />

          {/* Status dot + label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 5, height: 5, background: '#00d4ff', boxShadow: '0 0 6px #00d4ff', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 8, letterSpacing: 5, color: 'rgba(0,212,255,0.5)', fontFamily: "'Orbitron', monospace" }}>
              MODO SELECCIONADO
            </span>
          </div>

          {/* Mode name */}
          <h2 style={{
            fontSize: 'clamp(18px, 2vw, 24px)', letterSpacing: 3,
            fontFamily: "'Orbitron', serif", fontWeight: 900, marginBottom: 12,
            background: 'linear-gradient(180deg, #ffe066, #ffcc33, #ff8800)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 8px rgba(255,180,0,0.25))',
            transition: 'all 0.3s',
          }}>
            {currentHover || 'MODO'}
          </h2>

          {/* Separator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
            <div style={{ width: 35, height: 2, background: 'linear-gradient(90deg, #ffcc33, transparent)' }} />
            <div style={{ width: 3, height: 3, border: '1px solid rgba(255,200,0,0.35)', transform: 'rotate(45deg)' }} />
            <div style={{ flex: 1, height: 1, background: 'rgba(0,212,255,0.08)' }} />
          </div>

          {/* Description */}
          <p style={{
            fontSize: 'clamp(11px, 1.2vw, 14px)', lineHeight: 1.8,
            color: 'rgba(200,220,240,0.7)', fontFamily: "'Orbitron', sans-serif", fontWeight: 400,
          }}>
            {infoText}
          </p>
        </div>

        {/* Controls */}
        <div style={{ marginTop: 16, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{ key: '↑↓', label: 'NAVEGAR' }, { key: '↵', label: 'SELECCIONAR' }, { key: 'ESC', label: 'VOLVER' }].map(c => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ padding: '2px 7px', background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.12)', fontSize: 9, color: 'rgba(0,212,255,0.4)', fontFamily: "'Orbitron', monospace" }}>{c.key}</span>
              <span style={{ fontSize: 7, letterSpacing: 2, color: 'rgba(200,220,240,0.2)', fontFamily: "'Orbitron', monospace" }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 5%, rgba(0,212,255,0.1) 30%, rgba(255,200,0,0.05) 70%, transparent 95%)', opacity: phase >= 3 ? 1 : 0, transition: 'opacity 2s' }} />

      {/* Version */}
      <div style={{ position: 'fixed', bottom: 18, left: '5%', display: 'flex', alignItems: 'center', gap: 10, opacity: phase >= 3 ? 1 : 0, transition: 'opacity 1.5s ease 0.5s' }}>
        <div style={{ width: 25, height: 1, background: 'rgba(0,212,255,0.15)' }} />
        <span style={{ fontSize: 8, letterSpacing: 4, color: 'rgba(200,230,255,0.12)', fontFamily: "'Orbitron', monospace" }}>v1.0 · RELIQUIA DEL VACÍO</span>
      </div>

      {/* Press start */}
      <div style={{ position: 'fixed', bottom: 18, right: '3%', opacity: phase >= 3 ? 1 : 0, transition: 'opacity 1.5s ease 0.5s', animation: 'pulse 3s ease-in-out infinite' }}>
        <span style={{ fontSize: 9, letterSpacing: 4, color: 'rgba(0,212,255,0.18)', fontFamily: "'Orbitron', monospace" }}>◆ PRESS START ◆</span>
      </div>
    </div>
  );
};

export default MainMenu;
