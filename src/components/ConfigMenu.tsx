import React from 'react';
import { useGame } from '../game/GameContext';
import { CONTROLS } from '../game/constants';

const ConfigMenu: React.FC = () => {
  const { engine, setGameState } = useGame();
  const mapKey = (k: string) => k.replace('Key', '').replace('Arrow', '↑↓←→ '.includes(k.replace('Arrow','')) ? '' : 'Flecha ');

  const formatKey = (k: string) => {
    const map: Record<string, string> = {
      'KeyW': 'W', 'KeyA': 'A', 'KeyS': 'S', 'KeyD': 'D',
      'KeyF': 'F', 'KeyG': 'G', 'KeyH': 'H', 'KeyE': 'E',
      'KeyR': 'R', 'KeyT': 'T', 'KeyY': 'Y', 'KeyP': 'P',
      'ArrowUp': '↑', 'ArrowDown': '↓', 'ArrowLeft': '←', 'ArrowRight': '→',
      'BracketLeft': '[', 'BracketRight': ']', 'Backslash': '\\',
      'Enter': 'Enter', 'Quote': "'", 'Semicolon': ';',
    };
    return map[k] || k;
  };

  const actionLabels: Record<string, string> = {
    up: 'ARRIBA', down: 'ABAJO', left: 'IZQUIERDA', right: 'DERECHA',
    hit: 'GOLPE', spec: 'ESPECIAL', super: 'SUPER', ultra: 'ULTRA',
    block: 'BLOQUEO', dodge: 'ESQUIVAR',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}>
      <div style={{
        border: '2px solid rgba(0,255,255,0.5)', boxShadow: '0 0 40px rgba(0,255,255,.3), inset 0 0 30px rgba(0,255,255,.05)',
        background: 'linear-gradient(135deg, rgba(10,10,30,0.98), rgba(20,10,40,0.98))',
        padding: 'clamp(25px, 4vw, 45px)', textAlign: 'center',
        width: 'clamp(400px, 65vw, 700px)', maxHeight: '85vh',
        animation: 'configIn 0.3s ease-out',
      }}>
        <h2 style={{ color: '#00ffff', textShadow: '0 0 20px #00ffff', marginBottom: 25, fontFamily: "'Orbitron', monospace", fontSize: 'clamp(20px, 3.5vw, 30px)', letterSpacing: 4 }}>
          CONFIGURACIÓN
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, textAlign: 'left' }}>
          {/* P1 */}
          <div>
            <h3 style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 16, letterSpacing: 3, marginBottom: 12, textShadow: '0 0 10px #00ffff' }}>JUGADOR 1</h3>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: 12, border: '1px solid rgba(0,255,255,0.15)' }}>
              {Object.entries(CONTROLS.p1).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 2 }}>{actionLabels[k] || k.toUpperCase()}</span>
                  <span style={{ color: '#ffcc66', fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 'bold', background: 'rgba(255,255,255,0.05)', padding: '2px 10px', border: '1px solid rgba(255,204,102,0.2)' }}>{formatKey(v)}</span>
                </div>
              ))}
            </div>
          </div>
          {/* P2 */}
          <div>
            <h3 style={{ color: '#ff8c00', fontFamily: "'Orbitron', monospace", fontSize: 16, letterSpacing: 3, marginBottom: 12, textShadow: '0 0 10px #ff8c00' }}>JUGADOR 2</h3>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: 12, border: '1px solid rgba(255,140,0,0.15)' }}>
              {Object.entries(CONTROLS.p2).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#ffbb88', fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 2 }}>{actionLabels[k] || k.toUpperCase()}</span>
                  <span style={{ color: '#ffcc66', fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 'bold', background: 'rgba(255,255,255,0.05)', padding: '2px 10px', border: '1px solid rgba(255,204,102,0.2)' }}>{formatKey(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button onClick={() => setGameState(engine.state === 'PAUSED' ? 'PAUSED' : 'MENU')} style={{
          marginTop: 25, padding: '12px 40px', background: 'transparent', border: '2px solid #ff4d4d',
          color: '#ff4d4d', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
          transition: 'all 0.3s',
        }}>VOLVER</button>
      </div>

      <style>{`
        @keyframes configIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ConfigMenu;