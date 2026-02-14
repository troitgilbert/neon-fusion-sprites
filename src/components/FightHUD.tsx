import React from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA } from '../game/constants';

const FightHUD: React.FC = () => {
  const { engine, announcerText } = useGame();

  // We need to re-render frequently during fight — use requestAnimationFrame via a dummy state
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

  const p1Name = engine.mode === 'survival' ? CHAR_DATA[p1.charIdx]?.name : CHAR_DATA[p1.charIdx]?.name;
  const p2Name = engine.mode === 'survival' ? `ENEMIGO (Nvl ${engine.round})` : CHAR_DATA[p2.charIdx]?.name;

  return (
    <div className="absolute inset-0 pointer-events-none z-10" style={{ fontFamily: "'Orbitron', monospace" }}>
      <div className="flex justify-between p-5 w-full box-border" style={{ textShadow: '0 0 5px black' }}>
        {/* P1 Stats */}
        <div style={{ width: 240 }}>
          <div style={{ color: '#00ffff', fontSize: 18, marginBottom: 2 }}>{p1Name}</div>
          <div style={{ height: 16, background: '#222', border: '2px solid #fff', marginTop: 5, transform: 'skew(-15deg)', overflow: 'hidden', boxShadow: '0 5px 10px rgba(0,0,0,0.5)' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #ff4d4d, #ff8c00)', width: `${Math.max(0, p1.hp)}%`, transition: 'width 0.1s', boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.4)' }} />
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 8, transform: 'skew(-15deg)' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ flex: 1, height: 10, background: '#111', border: '1px solid #555', position: 'relative' }}>
                <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, p1.energy - i * 100))}%`, background: 'linear-gradient(90deg, #00ffff, #ffffff)', boxShadow: '0 0 10px #00ffff' }} />
              </div>
            ))}
          </div>
          <div style={{ color: '#aaa', marginTop: 5, fontSize: 12 }}>
            {Array(p1.rounds).fill('🔵').join(' ')}
          </div>
        </div>

        {/* Timer */}
        <div style={{ textAlign: 'center', marginTop: -10 }}>
          <div style={{ fontSize: 40, color: 'white', textShadow: '0 0 10px #00ffff' }}>{engine.timer}</div>
        </div>

        {/* P2 Stats */}
        <div style={{ width: 240, textAlign: 'right' }}>
          <div style={{ color: '#ff8c00', fontSize: 18, marginBottom: 2 }}>{p2Name}</div>
          <div style={{ height: 16, background: '#222', border: '2px solid #fff', marginTop: 5, transform: 'skew(15deg)', overflow: 'hidden', boxShadow: '0 5px 10px rgba(0,0,0,0.5)' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #ff4d4d, #ff8c00)', width: `${Math.max(0, p2Pct)}%`, transition: 'width 0.1s', float: 'right', boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.4)' }} />
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 8, transform: 'skew(15deg)', flexDirection: 'row-reverse' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ flex: 1, height: 10, background: '#111', border: '1px solid #555', position: 'relative' }}>
                <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, p2.energy - i * 100))}%`, background: 'linear-gradient(90deg, #00ffff, #ffffff)', boxShadow: '0 0 10px #00ffff', transform: 'scaleX(-1)', transformOrigin: 'center' }} />
              </div>
            ))}
          </div>
          <div style={{ color: '#aaa', marginTop: 5, fontSize: 12 }}>
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
            fontSize: 60, color: 'white', fontWeight: 900, fontStyle: 'italic',
            textShadow: '0 0 20px #00ffff, 4px 4px 0 #bd00ff',
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
