import React, { useState } from 'react';
import { useGame } from '../game/GameContext';
import { CONTROLS } from '../game/constants';

const ConfigMenu: React.FC = () => {
  const { engine, setGameState } = useGame();
  const [activeTab, setActiveTab] = useState<'sonido' | 'controles'>('sonido');
  const [musicVol, setMusicVol] = useState(engine.musicVolume * 100);
  const [sfxVol, setSfxVol] = useState(engine.sfxVolume * 100);
  const [voiceVol, setVoiceVol] = useState(engine.voiceVolume * 100);

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

  const SliderRow: React.FC<{ label: string; value: number; onChange: (v: number) => void; icon: string }> = ({ label, value, onChange, icon }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2 }}>{icon} {label}</span>
        <span style={{ color: '#ffcc66', fontFamily: "'Orbitron', monospace", fontSize: 12 }}>{Math.round(value)}%</span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => { const v = Number(e.target.value); onChange(v); }}
        style={{
          width: '100%', height: 6, appearance: 'none', background: 'rgba(0,255,255,0.15)',
          outline: 'none', borderRadius: 3, cursor: 'pointer',
        }}
      />
    </div>
  );

  const handleSave = () => {
    engine.musicVolume = musicVol / 100;
    engine.sfxVolume = sfxVol / 100;
    engine.voiceVolume = voiceVol / 100;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}>
      <div style={{
        border: '2px solid rgba(0,255,255,0.5)', boxShadow: '0 0 40px rgba(0,255,255,.3), inset 0 0 30px rgba(0,255,255,.05)',
        background: 'linear-gradient(135deg, rgba(10,10,30,0.98), rgba(20,10,40,0.98))',
        padding: 'clamp(25px, 4vw, 45px)', textAlign: 'center',
        width: 'clamp(500px, 75vw, 800px)', maxHeight: '90vh', overflowY: 'auto',
        animation: 'configIn 0.3s ease-out',
      }}>
        <h2 style={{ color: '#00ffff', textShadow: '0 0 20px #00ffff', marginBottom: 20, fontFamily: "'Orbitron', monospace", fontSize: 'clamp(20px, 3.5vw, 30px)', letterSpacing: 4 }}>
          CONFIGURACIÓN
        </h2>

        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 25, borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
          {(['sonido', 'controles'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 30px', border: 'none', cursor: 'pointer',
                background: activeTab === tab ? 'rgba(0,255,255,0.15)' : 'transparent',
                borderBottom: activeTab === tab ? '3px solid #00ffff' : '3px solid transparent',
                color: activeTab === tab ? '#00ffff' : '#555',
                fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 3,
                transition: 'all 0.3s', textTransform: 'uppercase',
              }}
            >{tab}</button>
          ))}
        </div>

        {activeTab === 'sonido' && (
          <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'left' }}>
            <SliderRow label="MÚSICA" value={musicVol} onChange={v => setMusicVol(v)} icon="🎵" />
            <SliderRow label="EFECTOS" value={sfxVol} onChange={v => setSfxVol(v)} icon="💥" />
            <SliderRow label="VOZ" value={voiceVol} onChange={v => setVoiceVol(v)} icon="🗣️" />
            <button onClick={handleSave} style={{
              width: '100%', marginTop: 15, padding: '10px 0',
              background: 'rgba(0,255,100,0.1)', border: '2px solid #00ff66', color: '#00ff66',
              cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2,
            }}>APLICAR</button>
          </div>
        )}

        {activeTab === 'controles' && (
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
        )}

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
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px; height: 16px; border-radius: 50%;
          background: #00ffff; cursor: pointer;
          box-shadow: 0 0 8px #00ffff;
        }
      `}</style>
    </div>
  );
};

export default ConfigMenu;
