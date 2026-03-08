import React from 'react';
import { useGame } from '../game/GameContext';

const PauseMenu: React.FC = () => {
  const { engine, setGameState } = useGame();
  const isTraining = engine.mode === 'training';

  const btnStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.1), transparent)',
    border: '1px solid #87ceeb', color: '#87ceeb', padding: 12, margin: 6, width: 280,
    cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 2,
    fontFamily: "'Orbitron', monospace", display: 'block',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  const selectStyle: React.CSSProperties = {
    background: 'rgba(10,10,30,0.9)', border: '1px solid #87ceeb', color: '#87ceeb',
    padding: '6px 12px', fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 1,
    cursor: 'pointer', width: '100%',
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center anim-screen-fade scanline-overlay" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
      <div className="anim-screen-zoom anim-neon-flash" style={{
        border: '2px solid #87ceeb', boxShadow: '0 0 20px rgba(0,255,255,.4)',
        background: 'rgba(10,10,20,0.95)', padding: 25, textAlign: 'center', transform: 'skew(-2deg)',
        minWidth: 320,
      }}>
        <h2 className="anim-title-slam" style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff', marginBottom: 15 }}>PAUSA</h2>
        <button onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(6px) scale(1.04)'; e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,255,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#87ceeb'; e.currentTarget.style.boxShadow = ''; }} onClick={() => engine.resume()} style={{...btnStyle, animation: 'itemCascade 0.4s cubic-bezier(0.16,1,0.3,1) 0.1s both'}}>Continuar</button>
        <button onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(6px) scale(1.04)'; e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,255,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#87ceeb'; e.currentTarget.style.boxShadow = ''; }} onClick={() => setGameState('CONFIG')} style={{...btnStyle, animation: 'itemCascade 0.4s cubic-bezier(0.16,1,0.3,1) 0.2s both'}}>Configuración</button>
        <button onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(6px) scale(1.04)'; e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,255,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#87ceeb'; e.currentTarget.style.boxShadow = ''; }} onClick={() => engine.restart()} style={{...btnStyle, animation: 'itemCascade 0.4s cubic-bezier(0.16,1,0.3,1) 0.3s both'}}>Reiniciar</button>
        <button onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(6px) scale(1.04)'; e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,255,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#87ceeb'; e.currentTarget.style.boxShadow = ''; }} onClick={() => engine.goToMainMenu()} style={{...btnStyle, animation: 'itemCascade 0.4s cubic-bezier(0.16,1,0.3,1) 0.4s both'}}>Menú Principal</button>

        {isTraining && (
          <div style={{ marginTop: 20, borderTop: '1px solid rgba(0,255,255,0.2)', paddingTop: 15 }}>
            <div style={{ color: '#ffcc66', fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 3, marginBottom: 12 }}>
              OPCIONES DE ENTRENAMIENTO
            </div>
            
            {/* AI behavior */}
            <div style={{ marginBottom: 10, textAlign: 'left' }}>
              <div style={{ color: '#87ceeb', fontSize: 10, letterSpacing: 2, marginBottom: 4, fontFamily: "'Orbitron', monospace" }}>OPONENTE</div>
              <select
                value={engine.trainingAI}
                onChange={e => { engine.trainingAI = e.target.value as any; }}
                style={selectStyle}
              >
                <option value="dummy">MANIQUÍ (no pelea)</option>
                <option value="fight">PELEA</option>
              </select>
            </div>

            {/* Energy mode */}
            <div style={{ marginBottom: 10, textAlign: 'left' }}>
              <div style={{ color: '#87ceeb', fontSize: 10, letterSpacing: 2, marginBottom: 4, fontFamily: "'Orbitron', monospace" }}>ENERGÍA</div>
              <select
                value={engine.trainingEnergy}
                onChange={e => { engine.trainingEnergy = e.target.value as any; }}
                style={selectStyle}
              >
                <option value="infinite">INFINITA</option>
                <option value="progressive">PROGRESIVA</option>
                <option value="none">SIN ENERGÍA</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PauseMenu;
