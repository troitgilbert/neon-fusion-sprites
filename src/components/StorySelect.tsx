import React, { useState, useEffect } from 'react';
import { useGame } from '../game/GameContext';
import { playSelectSound, playConfirmSound } from '../game/audio';

const STORIES = [
  {
    id: 'complete', name: 'HISTORIA COMPLETA', color: '#ffcc33', accent: '#ff8800',
    description: 'Vive la historia completa del universo. Todos los capítulos, todos los personajes, todos los secretos revelados en un épico viaje sin interrupciones.',
    icon: '⚔️', chapters: 24, difficulty: 'ÉPICA',
  },
  {
    id: 'edowado', name: 'EDOWADO', color: '#00ddff', accent: '#0088cc',
    description: 'La historia de un guerrero que busca proteger lo que queda del universo. Su poder interior despierta ante las amenazas del vacío.',
    icon: '🔥', chapters: 8, difficulty: 'DIFÍCIL', skinColor: '#8B4513', eyeColor: '#00ddff',
  },
  {
    id: 'kaito', name: 'KAITO', color: '#ffee44', accent: '#ccaa00',
    description: 'Un luchador veloz con un pasado oscuro. Su camino lo lleva a confrontar la verdad sobre su propia existencia.',
    icon: '⚡', chapters: 8, difficulty: 'NORMAL', skinColor: '#ffffff', eyeColor: '#ffee44',
  },
  {
    id: 'custom', name: 'PERSONALIZADO', color: '#dd44ff', accent: '#9900cc',
    description: 'Crea tu propia historia. Elige tu personaje personalizado y forja un camino único a través del universo.',
    icon: '✦', chapters: 6, difficulty: 'VARIABLE',
  },
];

const StorySelect: React.FC = () => {
  const { setGameState } = useGame();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 400);
    const t3 = setTimeout(() => setPhase(3), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setSelectedIdx(i => (i + 1) % STORIES.length);
        playSelectSound();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setSelectedIdx(i => (i - 1 + STORIES.length) % STORIES.length);
        playSelectSound();
      }
      if (e.key === 'Enter') playConfirmSound();
      if (e.key === 'Escape') setGameState('MENU');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setGameState]);

  const selected = STORIES[selectedIdx];

  return (
    <div className="fixed inset-0 z-50" style={{
      background: 'radial-gradient(ellipse at 30% 20%, rgba(40,15,0,0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(0,20,60,0.3) 0%, transparent 50%), #060208',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Ambient particles */}
      {phase >= 2 && Array.from({ length: 30 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: Math.random() * 2 + 1,
          height: Math.random() * 2 + 1,
          background: `rgba(${150 + Math.random() * 105},${100 + Math.random() * 100},${50 + Math.random() * 100},${0.2 + Math.random() * 0.4})`,
          borderRadius: '50%',
          animation: `storyFloat ${6 + Math.random() * 8}s ease-in-out ${Math.random() * 4}s infinite alternate`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Decorative top line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent 10%, ${selected.color}40 30%, ${selected.color}80 50%, ${selected.color}40 70%, transparent 90%)`,
        boxShadow: `0 0 20px ${selected.color}30`,
        transition: 'all 0.5s',
      }} />

      {/* ══════ HEADER ══════ */}
      <div style={{
        flexShrink: 0, padding: 'clamp(20px, 4vh, 40px) clamp(20px, 4vw, 60px)',
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div style={{ width: 'clamp(40px, 8vw, 80px)', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,180,50,0.4))' }} />
          <span style={{ fontSize: 'clamp(8px, 0.9vw, 11px)', letterSpacing: 6, color: 'rgba(255,180,80,0.4)', fontFamily: "'Orbitron', monospace" }}>MODO</span>
          <div style={{ width: 'clamp(40px, 8vw, 80px)', height: 1, background: 'linear-gradient(270deg, transparent, rgba(255,180,50,0.4))' }} />
        </div>
        <h1 style={{
          fontFamily: "'Orbitron', serif", fontSize: 'clamp(28px, 4.5vw, 56px)',
          fontWeight: 900, letterSpacing: 'clamp(4px, 1vw, 12px)',
          color: '#e8d5a3',
          textShadow: '0 0 25px rgba(255,120,0,0.5), 0 0 60px rgba(255,60,0,0.2), 0 2px 0 #8b6914',
        }}>
          HISTORIA
        </h1>
      </div>

      {/* ══════ MAIN CONTENT ══════ */}
      <div style={{
        flex: 1, minHeight: 0,
        display: 'flex', flexDirection: 'row',
        padding: '0 clamp(20px, 4vw, 60px)',
        gap: 'clamp(20px, 3vw, 50px)',
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 0.8s ease 0.2s',
      }}>
        {/* LEFT: Story cards (capsule style) */}
        <div style={{
          width: 'clamp(280px, 34vw, 420px)',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          gap: 6,
        }}>
          {STORIES.map((story, i) => {
            const active = selectedIdx === i;
            const num = String(i + 1).padStart(2, '0');
            return (
              <button
                key={story.id}
                onClick={() => { setSelectedIdx(i); playConfirmSound(); }}
                onMouseEnter={() => { setSelectedIdx(i); playSelectSound(); }}
                style={{
                  position: 'relative', width: '100%', padding: 0,
                  cursor: 'pointer', border: 'none', background: 'transparent',
                  display: 'flex', alignItems: 'center', gap: 0,
                  transform: active ? 'translateX(8px) scale(1.03)' : 'scale(1)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  animation: `storyCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.08 * i}s both`,
                  filter: active ? 'brightness(1.2)' : 'brightness(0.6)',
                }}
              >
                {/* Number badge */}
                <div style={{
                  width: 'clamp(36px, 3.8vw, 52px)',
                  height: 'clamp(36px, 3.8vw, 52px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active
                    ? `linear-gradient(135deg, ${story.color}, ${story.accent})`
                    : 'linear-gradient(135deg, #5a5040, #3a3028, #2a2018)',
                  borderRadius: 'clamp(18px, 1.9vw, 26px) 0 0 clamp(18px, 1.9vw, 26px)',
                  fontFamily: "'Orbitron', monospace",
                  fontSize: 'clamp(12px, 1.3vw, 18px)',
                  fontWeight: 900,
                  color: active ? '#0a0500' : '#3a3530',
                  textShadow: active ? '0 1px 0 rgba(255,255,200,0.3)' : 'none',
                  flexShrink: 0,
                  boxShadow: active
                    ? `0 0 20px ${story.color}50, inset 0 1px 0 rgba(255,255,200,0.3)`
                    : 'inset 0 1px 0 rgba(255,255,255,0.08)',
                  transition: 'all 0.25s',
                }}>
                  {num}
                </div>

                {/* Label capsule */}
                <div style={{
                  flex: 1,
                  height: 'clamp(36px, 3.8vw, 52px)',
                  display: 'flex', alignItems: 'center',
                  padding: '0 clamp(14px, 1.6vw, 22px)',
                  background: active
                    ? `linear-gradient(180deg, rgba(${hexToRgb(story.accent)},0.25), rgba(${hexToRgb(story.accent)},0.08))`
                    : 'linear-gradient(180deg, rgba(40,35,28,0.8), rgba(20,16,10,0.9))',
                  borderRadius: '0 clamp(18px, 1.9vw, 26px) clamp(18px, 1.9vw, 26px) 0',
                  border: active ? `1px solid ${story.color}50` : '1px solid rgba(100,80,50,0.15)',
                  borderLeft: 'none',
                  position: 'relative', overflow: 'hidden',
                  boxShadow: active ? `0 0 25px ${story.color}15` : 'none',
                  transition: 'all 0.25s',
                }}>
                  {/* Sheen */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: active
                      ? `linear-gradient(180deg, rgba(${hexToRgb(story.color)},0.1) 0%, transparent 30%)`
                      : 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 40%)',
                    pointerEvents: 'none',
                  }} />

                  {active && <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(90deg, transparent 20%, ${story.color}08 45%, transparent 80%)`,
                    animation: 'storySweep 2.5s ease-in-out infinite',
                    pointerEvents: 'none',
                  }} />}

                  {/* Dots */}
                  <div style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    display: 'flex', gap: 3, opacity: active ? 0.5 : 0.12,
                  }}>
                    {Array.from({ length: 5 }).map((_, di) => (
                      <div key={di} style={{
                        width: 4, height: 4, borderRadius: '50%',
                        background: active ? story.color : 'rgba(150,130,100,0.3)',
                        boxShadow: active ? `0 0 4px ${story.color}60` : 'none',
                      }} />
                    ))}
                  </div>

                  <span style={{
                    position: 'relative', zIndex: 1,
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontFamily: "'Orbitron', serif",
                    fontSize: 'clamp(12px, 1.3vw, 17px)',
                    fontWeight: active ? 800 : 600,
                    letterSpacing: active ? 3 : 1.5,
                    color: active ? story.color : 'rgba(180,160,130,0.45)',
                    textShadow: active ? `0 0 15px ${story.color}60` : 'none',
                    transition: 'all 0.25s',
                  }}>
                    <span style={{ fontSize: 'clamp(14px, 1.5vw, 20px)' }}>{story.icon}</span>
                    {story.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT: Detail panel */}
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {/* Character visual */}
          <div style={{
            width: 'clamp(120px, 14vw, 200px)',
            height: 'clamp(120px, 14vw, 200px)',
            borderRadius: '50%',
            background: selected.id === 'custom'
              ? `radial-gradient(circle at 35% 35%, ${selected.color}40, ${selected.accent}20, rgba(10,5,20,0.9))`
              : `radial-gradient(circle at 35% 35%, ${selected.color}30, rgba(10,5,20,0.95))`,
            border: `3px solid ${selected.color}60`,
            boxShadow: `0 0 40px ${selected.color}25, 0 0 80px ${selected.color}10, inset 0 0 30px ${selected.color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 'clamp(16px, 2.5vh, 30px)',
            animation: 'storyPulseGlow 3s ease-in-out infinite',
            transition: 'all 0.5s',
            position: 'relative',
          }}>
            {/* Orbital ring */}
            <div style={{
              position: 'absolute', inset: -12,
              border: `1px solid ${selected.color}20`,
              borderRadius: '50%',
              animation: 'storyOrbit 8s linear infinite',
            }}>
              <div style={{
                position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)',
                width: 6, height: 6, borderRadius: '50%',
                background: selected.color,
                boxShadow: `0 0 10px ${selected.color}`,
              }} />
            </div>

            {selected.id !== 'custom' ? (
              <>
                {/* Face */}
                <div style={{
                  width: '60%', height: '60%', borderRadius: '50%',
                  background: (selected as any).skinColor || '#ccc',
                  position: 'relative',
                  boxShadow: `inset -10px -5px 20px rgba(0,0,0,0.3), 0 0 20px ${selected.color}20`,
                }}>
                  <div style={{ position: 'absolute', top: '38%', left: '25%', width: '12%', height: '12%', borderRadius: '50%', background: selected.color, boxShadow: `0 0 8px ${selected.color}` }} />
                  <div style={{ position: 'absolute', top: '38%', right: '25%', width: '12%', height: '12%', borderRadius: '50%', background: selected.color, boxShadow: `0 0 8px ${selected.color}` }} />
                </div>
              </>
            ) : (
              <span style={{
                fontSize: 'clamp(40px, 5vw, 60px)', color: selected.color,
                fontWeight: 900, fontFamily: "'Orbitron', monospace",
                textShadow: `0 0 20px ${selected.color}`,
                animation: 'storyPulseGlow 2s ease-in-out infinite',
              }}>?</span>
            )}
          </div>

          {/* Story name */}
          <h2 style={{
            fontFamily: "'Orbitron', serif",
            fontSize: 'clamp(22px, 3vw, 38px)',
            fontWeight: 900,
            letterSpacing: 'clamp(4px, 0.8vw, 10px)',
            color: selected.color,
            textShadow: `0 0 20px ${selected.color}60, 0 0 50px ${selected.accent}30`,
            marginBottom: 8,
            transition: 'all 0.4s',
          }}>
            {selected.name}
          </h2>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: 'clamp(16px, 2vw, 30px)',
            marginBottom: 'clamp(12px, 2vh, 20px)',
          }}>
            {[
              { label: 'CAPÍTULOS', value: selected.chapters },
              { label: 'DIFICULTAD', value: selected.difficulty },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 'clamp(6px, 0.65vw, 8px)', letterSpacing: 4,
                  color: 'rgba(200,160,100,0.35)', fontFamily: "'Orbitron', monospace",
                  marginBottom: 4,
                }}>{stat.label}</div>
                <div style={{
                  fontSize: 'clamp(14px, 1.5vw, 20px)', fontWeight: 900,
                  color: selected.color, fontFamily: "'Orbitron', monospace",
                  textShadow: `0 0 8px ${selected.color}40`,
                }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Separator */}
          <div style={{
            width: 'clamp(120px, 16vw, 220px)', height: 1, marginBottom: 'clamp(12px, 2vh, 20px)',
            background: `linear-gradient(90deg, transparent, ${selected.color}40, transparent)`,
          }} />

          {/* Description */}
          <p style={{
            maxWidth: 'clamp(280px, 28vw, 400px)',
            fontSize: 'clamp(10px, 1vw, 13px)',
            lineHeight: 1.8,
            color: 'rgba(200,185,160,0.55)',
            fontFamily: "'Orbitron', sans-serif",
            textAlign: 'center',
            transition: 'all 0.4s',
          }}>
            {selected.description}
          </p>

          {/* Start button */}
          <button
            onClick={() => playConfirmSound()}
            style={{
              marginTop: 'clamp(20px, 3vh, 35px)',
              padding: 'clamp(10px, 1.2vh, 14px) clamp(30px, 4vw, 50px)',
              background: `linear-gradient(135deg, ${selected.color}20, ${selected.accent}15)`,
              border: `2px solid ${selected.color}50`,
              borderRadius: 'clamp(20px, 2vw, 30px)',
              color: selected.color,
              fontFamily: "'Orbitron', serif",
              fontSize: 'clamp(12px, 1.2vw, 16px)',
              fontWeight: 800,
              letterSpacing: 4,
              cursor: 'pointer',
              transition: 'all 0.3s',
              textShadow: `0 0 10px ${selected.color}40`,
              boxShadow: `0 0 20px ${selected.color}15`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${selected.color}35, ${selected.accent}25)`;
              e.currentTarget.style.boxShadow = `0 0 35px ${selected.color}30`;
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${selected.color}20, ${selected.accent}15)`;
              e.currentTarget.style.boxShadow = `0 0 20px ${selected.color}15`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ▶ COMENZAR
          </button>
        </div>
      </div>

      {/* ══════ FOOTER ══════ */}
      <div style={{
        flexShrink: 0, height: 'clamp(36px, 5vh, 50px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        opacity: phase >= 3 ? 1 : 0,
        transition: 'opacity 0.8s ease 0.4s',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 10%, rgba(255,120,0,0.15) 50%, transparent 90%)',
        }} />
        <div style={{ display: 'flex', gap: 20 }}>
          {[{ key: '◀▶', label: 'SELECCIONAR' }, { key: '↵', label: 'CONFIRMAR' }, { key: 'ESC', label: 'VOLVER' }].map(c => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                padding: '2px 7px', background: 'rgba(180,60,0,0.08)',
                border: '1px solid rgba(180,60,0,0.15)', borderRadius: 4,
                fontSize: 'clamp(7px, 0.7vw, 9px)', color: 'rgba(200,150,80,0.4)',
                fontFamily: "'Orbitron', monospace",
              }}>{c.key}</span>
              <span style={{
                fontSize: 'clamp(5px, 0.6vw, 7px)', letterSpacing: 2,
                color: 'rgba(180,140,100,0.2)', fontFamily: "'Orbitron', monospace",
              }}>{c.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setGameState('MENU')}
          style={{
            position: 'absolute', left: 'clamp(16px, 3vw, 40px)', top: '50%', transform: 'translateY(-50%)',
            padding: '6px 20px', background: 'rgba(200,50,0,0.06)',
            border: '1px solid rgba(200,50,0,0.15)', borderRadius: 16,
            color: 'rgba(200,120,60,0.4)', cursor: 'pointer',
            fontFamily: "'Orbitron', serif", fontSize: 'clamp(8px, 0.8vw, 11px)',
            fontWeight: 700, letterSpacing: 3,
            transition: 'all 0.25s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#e8a060'; e.currentTarget.style.borderColor = 'rgba(255,120,0,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(200,120,60,0.4)'; e.currentTarget.style.borderColor = 'rgba(200,50,0,0.15)'; }}
        >
          ◀ VOLVER
        </button>
      </div>

      <style>{`
        @keyframes storyCardIn {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes storySweep {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        @keyframes storyPulseGlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        @keyframes storyOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes storyFloat {
          from { transform: translateY(0) translateX(0); opacity: 0.3; }
          to { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default StorySelect;
