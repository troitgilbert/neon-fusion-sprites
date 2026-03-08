import React from 'react';
import { useGame } from '../game/GameContext';

const FightHUD: React.FC = () => {
  const { engine, announcerText } = useGame();

  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    let id: number;
    const tick = () => { setTick(t => t + 1); id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  if (!engine.p1 || !engine.p2) return null;

  const p1 = engine.p1;
  const p2 = engine.p2;
  const p1Max = 70;
  const p2Max = engine.mode === 'survival' ? 70 + engine.round * 10 : engine.mode === 'training' ? 9999 : 70;
  const p1Pct = Math.max(0, (p1.hp / p1Max) * 100);
  const p2Pct = Math.max(0, (p2.hp / p2Max) * 100);

  const p1Name = p1.data.name;
  const p2Name = engine.mode === 'survival' ? `ENEMIGO (Nvl ${engine.round})` : p2.data.name;

  const p1Low = p1Pct < 25;
  const p2Low = p2Pct < 25;

  return (
    <div className="fixed inset-0 pointer-events-none z-10" style={{ fontFamily: "'Orbitron', monospace" }}>
      {/* HUD CSS animations */}
      <style>{`
        @keyframes hpPulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.4); }
        }
        @keyframes energyFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes barShine {
          0% { left: -40%; }
          100% { left: 140%; }
        }
      `}</style>

      <div className="flex justify-between items-start w-full box-border" style={{ padding: 'clamp(8px, 2.5vw, 24px)' }}>
        {/* P1 Stats */}
        <div style={{ width: 'clamp(160px, 28vw, 320px)' }}>
          {/* Name with accent line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{
              width: 3, height: 16,
              background: 'linear-gradient(180deg, #00ffff, #0066ff)',
              boxShadow: '0 0 8px #00ffff80',
            }} />
            <div style={{
              color: '#00ffff',
              fontSize: 'clamp(11px, 1.6vw, 18px)',
              fontWeight: 900,
              letterSpacing: 3,
              textShadow: '0 0 10px #00ffff80, 0 0 20px #00ffff30',
            }}>{p1Name}</div>
          </div>

          {/* HP Bar */}
          <div style={{
            position: 'relative',
            height: 'clamp(14px, 2.2vw, 22px)',
            background: 'linear-gradient(180deg, #1a1a2e, #0d0d1a)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderLeft: '3px solid #00ffff',
            transform: 'skew(-12deg)',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.6), inset 0 1px 3px rgba(0,0,0,0.5)',
          }}>
            {/* HP fill */}
            <div style={{
              height: '100%',
              width: `${p1Pct}%`,
              background: p1Low
                ? 'linear-gradient(90deg, #ff1a1a, #ff4444, #ff1a1a)'
                : 'linear-gradient(90deg, #ff3333, #ff6644, #ffaa33, #ff6644)',
              transition: 'width 0.15s ease-out',
              boxShadow: p1Low ? '0 0 15px rgba(255,0,0,0.5)' : '0 0 8px rgba(255,100,0,0.3)',
              animation: p1Low ? 'hpPulse 0.8s ease-in-out infinite' : 'none',
              position: 'relative',
            }}>
              {/* Shine sweep */}
              <div style={{
                position: 'absolute', top: 0, width: '30%', height: '45%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                animation: 'barShine 3s ease-in-out infinite',
              }} />
              {/* Bottom highlight */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
                background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.3))',
              }} />
            </div>
            {/* HP text */}
            <div style={{
              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%) skew(12deg)',
              color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(7px, 1vw, 10px)',
              fontWeight: 700, letterSpacing: 1,
            }}>{Math.ceil(p1Pct)}%</div>
          </div>

          {/* Energy Bars */}
          <div style={{ display: 'flex', gap: 3, marginTop: 5, transform: 'skew(-12deg)' }}>
            {[0, 1, 2].map(i => {
              const fill = Math.max(0, Math.min(100, p1.energy - i * 100));
              const isFull = fill >= 100;
              return (
                <div key={i} style={{
                  flex: 1, height: 'clamp(6px, 1vw, 10px)',
                  background: 'linear-gradient(180deg, #0a0a1a, #050510)',
                  border: '1px solid rgba(0,255,255,0.15)',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${fill}%`,
                    background: isFull
                      ? 'linear-gradient(90deg, #00ffff, #44ffff, #00ddff, #00ffff)'
                      : 'linear-gradient(90deg, #0066aa, #0099dd, #00bbee)',
                    backgroundSize: '200% 100%',
                    animation: isFull ? 'energyFlow 1.5s linear infinite' : 'none',
                    boxShadow: isFull ? '0 0 10px rgba(0,255,255,0.5)' : '0 0 4px rgba(0,150,255,0.2)',
                    transition: 'width 0.1s',
                  }} />
                  {isFull && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.2), transparent)',
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Round indicators */}
          <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
            {[0, 1].map(i => (
              <div key={i} style={{
                width: 'clamp(8px, 1.2vw, 14px)',
                height: 'clamp(8px, 1.2vw, 14px)',
                borderRadius: '50%',
                border: `1.5px solid ${i < p1.rounds ? '#00ffff' : '#333'}`,
                background: i < p1.rounds
                  ? 'radial-gradient(circle, #00ffff, #0066aa)'
                  : 'transparent',
                boxShadow: i < p1.rounds ? '0 0 8px #00ffff60' : 'none',
              }} />
            ))}
          </div>
        </div>

        {/* Timer */}
        <div style={{ textAlign: 'center', position: 'relative' }}>
          {/* Timer frame */}
          <div style={{
            position: 'relative',
            padding: '2px 12px',
            borderBottom: '2px solid rgba(255,255,255,0.15)',
          }}>
            <div style={{
              fontSize: 'clamp(28px, 5vw, 56px)',
              color: engine.timer <= 10 ? '#ff4444' : '#ffffff',
              fontWeight: 900,
              textShadow: engine.timer <= 10
                ? '0 0 15px #ff0000, 0 0 30px #ff000060'
                : '0 0 8px rgba(255,255,255,0.3)',
              letterSpacing: 2,
              lineHeight: 1,
            }}>{engine.timer}</div>
          </div>
          {/* VS indicator */}
          <div style={{
            color: 'rgba(255,255,255,0.2)',
            fontSize: 'clamp(6px, 1vw, 9px)',
            letterSpacing: 4,
            marginTop: 3,
          }}>VS</div>
        </div>

        {/* P2 Stats */}
        <div style={{ width: 'clamp(160px, 28vw, 320px)', textAlign: 'right' }}>
          {/* Name with accent line */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 4 }}>
            <div style={{
              color: '#ff8c00',
              fontSize: 'clamp(11px, 1.6vw, 18px)',
              fontWeight: 900,
              letterSpacing: 3,
              textShadow: '0 0 10px #ff8c0080, 0 0 20px #ff8c0030',
            }}>{p2Name}</div>
            <div style={{
              width: 3, height: 16,
              background: 'linear-gradient(180deg, #ff8c00, #ff4400)',
              boxShadow: '0 0 8px #ff8c0080',
            }} />
          </div>

          {/* HP Bar */}
          <div style={{
            position: 'relative',
            height: 'clamp(14px, 2.2vw, 22px)',
            background: 'linear-gradient(180deg, #1a1a2e, #0d0d1a)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRight: '3px solid #ff8c00',
            transform: 'skew(12deg)',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.6), inset 0 1px 3px rgba(0,0,0,0.5)',
            direction: 'rtl' as any,
          }}>
            <div style={{
              height: '100%',
              width: `${p2Pct}%`,
              background: p2Low
                ? 'linear-gradient(270deg, #ff1a1a, #ff4444, #ff1a1a)'
                : 'linear-gradient(270deg, #ff3333, #ff6644, #ffaa33, #ff6644)',
              transition: 'width 0.15s ease-out',
              boxShadow: p2Low ? '0 0 15px rgba(255,0,0,0.5)' : '0 0 8px rgba(255,100,0,0.3)',
              animation: p2Low ? 'hpPulse 0.8s ease-in-out infinite' : 'none',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: 0, width: '30%', height: '45%',
                background: 'linear-gradient(270deg, transparent, rgba(255,255,255,0.25), transparent)',
                animation: 'barShine 3s ease-in-out infinite',
              }} />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
                background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.3))',
              }} />
            </div>
            <div style={{
              position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%) skew(-12deg)',
              color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(7px, 1vw, 10px)',
              fontWeight: 700, letterSpacing: 1, direction: 'ltr' as any,
            }}>{Math.ceil(p2Pct)}%</div>
          </div>

          {/* Energy Bars */}
          <div style={{ display: 'flex', gap: 3, marginTop: 5, transform: 'skew(12deg)', flexDirection: 'row-reverse' }}>
            {[0, 1, 2].map(i => {
              const fill = Math.max(0, Math.min(100, p2.energy - i * 100));
              const isFull = fill >= 100;
              return (
                <div key={i} style={{
                  flex: 1, height: 'clamp(6px, 1vw, 10px)',
                  background: 'linear-gradient(180deg, #0a0a1a, #050510)',
                  border: '1px solid rgba(255,140,0,0.15)',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${fill}%`,
                    background: isFull
                      ? 'linear-gradient(270deg, #ff8c00, #ffaa44, #ff6600, #ff8c00)'
                      : 'linear-gradient(270deg, #aa4400, #dd6600, #ee7700)',
                    backgroundSize: '200% 100%',
                    animation: isFull ? 'energyFlow 1.5s linear infinite' : 'none',
                    boxShadow: isFull ? '0 0 10px rgba(255,140,0,0.5)' : '0 0 4px rgba(255,100,0,0.2)',
                    transition: 'width 0.1s',
                    float: 'right',
                  }} />
                  {isFull && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.2), transparent)',
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Round indicators */}
          <div style={{ display: 'flex', gap: 4, marginTop: 5, justifyContent: 'flex-end' }}>
            {[0, 1].map(i => (
              <div key={i} style={{
                width: 'clamp(8px, 1.2vw, 14px)',
                height: 'clamp(8px, 1.2vw, 14px)',
                borderRadius: '50%',
                border: `1.5px solid ${i < p2.rounds ? '#ff8c00' : '#333'}`,
                background: i < p2.rounds
                  ? 'radial-gradient(circle, #ff8c00, #aa4400)'
                  : 'transparent',
                boxShadow: i < p2.rounds ? '0 0 8px #ff8c0060' : 'none',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Announcer */}
      {announcerText && (
        <div
          style={{
            position: 'absolute', top: '40%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(40px, 8vw, 80px)', color: 'white', fontWeight: 900, fontStyle: 'italic',
            textShadow: '0 0 20px #00ffff, 4px 4px 0 #bd00ff, 0 0 60px #00ffff40',
            whiteSpace: 'nowrap', zIndex: 20,
            animation: 'popIn 0.5s forwards',
          }}
        >
          {announcerText}
        </div>
      )}
    </div>
  );
};

export default FightHUD;