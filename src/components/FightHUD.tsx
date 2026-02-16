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
  const p2Max = engine.mode === 'survival' ? 100 + engine.round * 10 : engine.mode === 'training' ? 9999 : 100;
  const p2Pct = (p2.hp / p2Max) * 100;

  // Use fighter data name (works for both normal and custom characters)
  const p1Name = p1.data.name;
  const p2Name = engine.mode === 'survival' ? `ENEMIGO (Nvl ${engine.round})` : p2.data.name;

  return (
    <div className="fixed inset-0 pointer-events-none z-10" style={{ fontFamily: "'Orbitron', monospace" }}>
      <div className="flex justify-between items-start w-full box-border" style={{ padding: 'clamp(10px, 3vw, 30px)', textShadow: '0 0 5px black' }}>
        {/* P1 Stats */}
        <div style={{ width: 'clamp(150px, 25vw, 300px)' }}>
          <div style={{ color: '#00ffff', fontSize: 'clamp(14px, 2vw, 22px)', marginBottom: 2, textShadow: '0 0 10px #00ffff' }}>{p1Name}</div>
          <div style={{ height: 'clamp(12px, 2vw, 20px)', background: '#222', border: '2px solid #fff', marginTop: 5, transform: 'skew(-15deg)', overflow: 'hidden', boxShadow: '0 5px 10px rgba(0,0,0,0.5)' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #ff4d4d, #ff8c00)', width: `${Math.max(0, p1.hp)}%`, transition: 'width 0.15s ease-out', boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.4)' }} />
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6, transform: 'skew(-15deg)' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ flex: 1, height: 8, background: '#111', border: '1px solid #555' }}>
                <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, p1.energy - i * 100))}%`, background: 'linear-gradient(90deg, #00ffff, #ffffff)', boxShadow: '0 0 10px #00ffff', transition: 'width 0.1s' }} />
              </div>
            ))}
          </div>
          <div style={{ color: '#aaa', marginTop: 4, fontSize: 'clamp(10px, 1.5vw, 14px)' }}>
            {Array(p1.rounds).fill('🔵').join(' ')}
          </div>
        </div>

        {/* Timer */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(30px, 5vw, 60px)', color: 'white', textShadow: '0 0 10px #00ffff, 0 0 30px #00ffff40' }}>{engine.timer}</div>
        </div>

        {/* P2 Stats */}
        <div style={{ width: 'clamp(150px, 25vw, 300px)', textAlign: 'right' }}>
          <div style={{ color: '#ff8c00', fontSize: 'clamp(14px, 2vw, 22px)', marginBottom: 2, textShadow: '0 0 10px #ff8c00' }}>{p2Name}</div>
          <div style={{ height: 'clamp(12px, 2vw, 20px)', background: '#222', border: '2px solid #fff', marginTop: 5, transform: 'skew(15deg)', overflow: 'hidden', boxShadow: '0 5px 10px rgba(0,0,0,0.5)' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #ff4d4d, #ff8c00)', width: `${Math.max(0, p2Pct)}%`, transition: 'width 0.15s ease-out', float: 'right', boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.4)' }} />
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6, transform: 'skew(15deg)', flexDirection: 'row-reverse' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ flex: 1, height: 8, background: '#111', border: '1px solid #555' }}>
                <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, p2.energy - i * 100))}%`, background: 'linear-gradient(90deg, #00ffff, #ffffff)', boxShadow: '0 0 10px #00ffff', transition: 'width 0.1s', transform: 'scaleX(-1)', transformOrigin: 'center' }} />
              </div>
            ))}
          </div>
          <div style={{ color: '#aaa', marginTop: 4, fontSize: 'clamp(10px, 1.5vw, 14px)' }}>
            {Array(p2.rounds).fill('🔴').join(' ')}
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