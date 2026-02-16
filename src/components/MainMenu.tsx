import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../game/GameContext';
import { MODE_INFO } from '../game/constants';

interface MenuItem {
  label: string;
  action?: () => void;
  hasSub?: boolean;
  subItems?: { label: string; action: () => void; className?: string }[];
  isMystery?: boolean;
}

const MainMenu: React.FC = () => {
  const { setGameState } = useGame();
  const [activeIndex, setActiveIndex] = useState(0);
  const [inSub, setInSub] = useState(false);
  const [subIndex, setSubIndex] = useState(0);
  const [openSubMenu, setOpenSubMenu] = useState<number | null>(null);
  const [hoveredMode, setHoveredMode] = useState<string>('');
  const [mysteryHover, setMysteryHover] = useState(false);

  const menuItems: MenuItem[] = useMemo(() => [
    { label: 'HISTORIA', action: () => setGameState('STORY_SELECT') },
    { label: 'ARCADE', action: () => setGameState('SELECT', 'arcade') },
    { label: 'AVENTURA', action: () => setGameState('ADVENTURE_SELECT', 'adventure') },
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
        { label: 'CREADOR DE PERSONAJES', action: () => setGameState('CREATOR') },
        { label: 'CREACIÓN DE NIVELES', action: () => {} },
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
    { label: 'CONFIGURACIÓN', action: () => setGameState('CONFIG') },
    { label: 'SALIR', action: () => {} },
  ], [setGameState]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setInSub(false); setOpenSubMenu(null); return;
      }

      if (!inSub) {
        if (e.key === 'ArrowDown') setActiveIndex(i => (i + 1) % menuItems.length);
        if (e.key === 'ArrowUp') setActiveIndex(i => (i - 1 + menuItems.length) % menuItems.length);
        if (e.key === 'Enter') {
          const item = menuItems[activeIndex];
          if (item.hasSub) {
            setOpenSubMenu(activeIndex); setInSub(true); setSubIndex(0);
          } else {
            item.action?.();
          }
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

  return (
    <div className="fixed inset-0 z-10 flex flex-col justify-center" style={{ 
      paddingLeft: '8%',
      background: mysteryHover ? 'rgba(0,0,0,0.95)' : 'transparent',
      transition: 'background 0.5s',
    }}>
      {/* Title */}
      <h1
        className="mb-8 text-6xl font-black tracking-[8px] md:text-7xl lg:text-[80px]"
        style={{
          color: '#ffcc33',
          animation: 'titlePulse 3s ease-in-out infinite',
          textShadow: '0 0 10px #ff6600, 0 0 25px #ff0000, 0 0 50px #990000, 4px 4px 0 #000',
          fontFamily: "'Orbitron', serif"
        }}
      >
        RELIQUIA DEL VACÍO
      </h1>

      {/* Menu buttons */}
      <div className="flex flex-col">
        {menuItems.map((item, i) => (
          <React.Fragment key={item.label}>
            <button
              className={`menu-btn-game transition-all duration-200 ${activeIndex === i && !inSub ? 'active' : ''}`}
              onClick={() => {
                setActiveIndex(i);
                if (item.hasSub) { setOpenSubMenu(i); setInSub(true); setSubIndex(0); }
                else item.action?.();
              }}
              onMouseEnter={() => { setActiveIndex(i); setHoveredMode(item.label); }}
              onMouseLeave={() => setHoveredMode('')}
              style={{
                width: 320, padding: '10px 18px', margin: '6px 0', fontSize: 18, textAlign: 'left',
                borderLeft: `6px solid ${activeIndex === i && !inSub ? '#ff9f1c' : '#4fdcff'}`,
                background: 'linear-gradient(90deg, rgba(15,35,60,.95), rgba(0,0,0,.2))',
                color: '#eafcff', letterSpacing: 3,
                boxShadow: activeIndex === i && !inSub ? '0 0 25px rgba(255,140,0,.8)' : '0 0 20px rgba(120,220,255,.25)',
                opacity: activeIndex === i && !inSub ? 1 : 0.65,
                transform: activeIndex === i && !inSub ? 'translateX(15px)' : 'none',
                cursor: 'pointer', border: 'none', fontFamily: "'Orbitron', serif",
              }}
            >
              {item.label}
            </button>

            {/* Submenu */}
            {item.hasSub && openSubMenu === i && (
              <div className="ml-8 mt-1">
                {item.subItems!.map((sub, si) => (
                  <button
                    key={sub.label}
                    className={sub.className || ''}
                    onClick={() => sub.action()}
                    onMouseEnter={() => { 
                      setSubIndex(si); setHoveredMode(sub.label);
                      if (sub.className === 'mystery') setMysteryHover(true);
                    }}
                    onMouseLeave={() => { 
                      setHoveredMode('');
                      if (sub.className === 'mystery') setMysteryHover(false);
                    }}
                    style={{
                      display: 'block', width: 260, padding: '8px 16px', margin: '5px 0', fontSize: 16,
                      borderLeft: `4px solid ${inSub && subIndex === si ? '#ff9f1c' : sub.className === 'boss-rush' ? '#ff0000' : sub.className === 'mystery' ? '#555' : '#6fe7ff'}`,
                      background: 'linear-gradient(90deg, rgba(10,30,50,.95), rgba(0,0,0,.2))',
                      color: sub.className === 'boss-rush' ? '#ffb3b3' : sub.className === 'logros' ? '#ffd2a1' : sub.className === 'mystery' ? '#555' : '#eafcff',
                      opacity: inSub && subIndex === si ? 1 : 0.7,
                      letterSpacing: 3, cursor: 'pointer', border: 'none',
                      textShadow: sub.className === 'boss-rush' ? '0 0 8px #ff0000,0 0 16px #aa0000' : sub.className === 'logros' ? '0 0 8px #ff8c00' : 'none',
                      boxShadow: sub.className === 'boss-rush' ? '0 0 25px rgba(255,0,0,.6)' : sub.className === 'logros' ? '0 0 20px rgba(255,140,0,.6)' : 'none',
                      fontFamily: "'Orbitron', serif",
                    }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Info Panel */}
      <div
        className="fixed"
        style={{
          right: '4%', top: '20%', width: 360, padding: '18px 20px',
          background: 'linear-gradient(180deg, rgba(15,20,30,.95), rgba(0,0,0,.8))',
          borderLeft: '4px solid #4fdcff',
          boxShadow: '0 0 25px rgba(120,220,255,.35)',
          zIndex: 4
        }}
      >
        <h2 style={{ fontSize: 22, letterSpacing: 3, color: '#ffcc66', marginBottom: 10, fontFamily: "'Orbitron', serif" }}>
          {currentHover || 'MODO'}
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: '#e6f6ff', opacity: 0.9 }}>
          {infoText}
        </p>
      </div>
    </div>
  );
};

export default MainMenu;
