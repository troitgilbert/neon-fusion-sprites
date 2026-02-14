import React from 'react';
import { useGame } from '../game/GameContext';
import { CONTROLS } from '../game/constants';

const ConfigMenu: React.FC = () => {
  const { engine, setGameState } = useGame();
  const mapKey = (k: string) => k.replace('Key', '').replace('Arrow', 'Flecha ');

  const btnStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.1), transparent)',
    border: '1px solid #87ceeb', color: '#87ceeb', padding: 12, margin: 6, width: '100%',
    cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 2,
    fontFamily: "'Orbitron', monospace",
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
      <div style={{
        border: '2px solid #87ceeb', boxShadow: '0 0 20px rgba(0,255,255,.4)',
        background: 'rgba(10,10,20,0.95)', padding: 25, textAlign: 'center', transform: 'skew(-2deg)'
      }}>
        <h3 style={{ color: '#00ffff', marginBottom: 15 }}>CONTROLES</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, textAlign: 'left', fontSize: 12 }}>
          <div>
            <h4 style={{ color: '#00ffff' }}>P1</h4>
            {Object.entries(CONTROLS.p1).map(([k, v]) => (
              <div key={k} style={{ color: '#e6f6ff' }}>{k.toUpperCase()}: {mapKey(v)}</div>
            ))}
          </div>
          <div>
            <h4 style={{ color: '#ff8c00' }}>P2</h4>
            {Object.entries(CONTROLS.p2).map(([k, v]) => (
              <div key={k} style={{ color: '#e6f6ff' }}>{k.toUpperCase()}: {mapKey(v)}</div>
            ))}
          </div>
        </div>
        <button onClick={() => setGameState(engine.state === 'PAUSED' ? 'PAUSED' : 'MENU')} style={btnStyle}>GUARDAR</button>
      </div>
    </div>
  );
};

export default ConfigMenu;
