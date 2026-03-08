import React, { useState } from 'react';
import { useGame } from '../game/GameContext';
import { playSelectSound, playConfirmSound } from '../game/audio';

const OnlineMenu: React.FC = () => {
  const { setGameState } = useGame();
  const [mode, setMode] = useState<'main' | 'create' | 'join'>('main');
  const [roomCode, setRoomCode] = useState('');
  const [generatedCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());

  const btnStyle: React.CSSProperties = {
    width: 300, padding: '14px 20px', margin: '8px 0', cursor: 'pointer', textAlign: 'center',
    background: 'linear-gradient(90deg, rgba(15,35,60,.95), rgba(0,0,0,.2))',
    border: '2px solid #00ffff', color: '#eafcff', letterSpacing: 3,
    fontFamily: "'Orbitron', monospace", fontSize: 16, transition: 'all 0.3s',
    boxShadow: '0 0 20px rgba(0,255,255,.25)',
  };

  if (mode === 'create') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center anim-screen-zoom" style={{
        background: 'linear-gradient(135deg, #0a0a2e 0%, #001a3a 50%, #0a0a2e 100%)',
      }}>
        <h2 style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 28, letterSpacing: 5, marginBottom: 30 }}>
          CREAR SALA
        </h2>
        <div style={{
          padding: '30px 50px', background: 'rgba(0,20,40,0.9)', border: '2px solid #00ffff',
          boxShadow: '0 0 40px rgba(0,255,255,.3)', textAlign: 'center',
        }}>
          <p style={{ color: '#87ceeb', fontSize: 13, marginBottom: 15, fontFamily: "'Orbitron', monospace" }}>
            COMPARTE ESTE CÓDIGO CON TU OPONENTE:
          </p>
          <div style={{
            fontSize: 48, color: '#ffcc33', fontFamily: "'Orbitron', monospace", fontWeight: 900,
            letterSpacing: 12, textShadow: '0 0 20px #ff6600',
            padding: '15px 30px', border: '3px solid #ffcc33', background: 'rgba(255,204,51,0.05)',
          }}>
            {generatedCode}
          </div>
          <p style={{ color: '#555', fontSize: 11, marginTop: 20, fontFamily: "'Orbitron', monospace" }}>
            ESPERANDO OPONENTE...
          </p>
          <div style={{ marginTop: 10 }}>
            <div style={{
              width: 200, height: 4, background: '#111', margin: '0 auto', borderRadius: 2, overflow: 'hidden',
            }}>
              <div style={{
                width: '30%', height: '100%', background: '#00ffff',
                animation: 'searchPulse 1.5s ease-in-out infinite',
              }} />
            </div>
          </div>
        </div>
        <button onClick={() => setMode('main')} style={{ ...btnStyle, width: 200, marginTop: 30, border: '2px solid #ff4d4d', color: '#ff4d4d' }}>
          CANCELAR
        </button>
        <style>{`@keyframes searchPulse { 0%, 100% { transform: translateX(-100%); } 50% { transform: translateX(400%); } }`}</style>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0a0a2e 0%, #001a3a 50%, #0a0a2e 100%)',
      }}>
        <h2 style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 28, letterSpacing: 5, marginBottom: 30 }}>
          UNIRSE A SALA
        </h2>
        <div style={{
          padding: '30px 50px', background: 'rgba(0,20,40,0.9)', border: '2px solid #00ffff',
          boxShadow: '0 0 40px rgba(0,255,255,.3)', textAlign: 'center',
        }}>
          <p style={{ color: '#87ceeb', fontSize: 13, marginBottom: 15, fontFamily: "'Orbitron', monospace" }}>
            INGRESA EL CÓDIGO DE LA SALA:
          </p>
          <input
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
            maxLength={6}
            placeholder="CÓDIGO"
            style={{
              fontSize: 36, color: '#ffcc33', fontFamily: "'Orbitron', monospace", fontWeight: 900,
              letterSpacing: 10, textAlign: 'center', width: 280,
              padding: '10px 20px', border: '3px solid #ffcc33', background: 'rgba(255,204,51,0.05)',
              outline: 'none',
            }}
          />
          <br />
          <button
            onClick={() => { playConfirmSound(); }}
            disabled={roomCode.length < 6}
            style={{
              ...btnStyle, width: 200, marginTop: 20,
              opacity: roomCode.length < 6 ? 0.4 : 1,
              border: '2px solid #00ff66', color: '#00ff66',
            }}
          >
            CONECTAR
          </button>
        </div>
        <button onClick={() => setMode('main')} style={{ ...btnStyle, width: 200, marginTop: 20, border: '2px solid #ff4d4d', color: '#ff4d4d' }}>
          VOLVER
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{
      background: 'linear-gradient(135deg, #0a0a2e 0%, #001a3a 50%, #0a0a2e 100%)',
    }}>
      <h1 style={{
        color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(28px, 5vw, 48px)',
        letterSpacing: 6, textShadow: '0 0 20px #00ffff, 0 0 40px #00888850',
        marginBottom: 15, fontWeight: 900,
      }}>
        MODO ONLINE
      </h1>
      <p style={{ color: '#87ceeb', fontSize: 13, marginBottom: 40, fontFamily: "'Orbitron', monospace", letterSpacing: 2 }}>
        VERSUS EN LÍNEA — CONECTA CON OTRO JUGADOR
      </p>

      <button
        onClick={() => { playConfirmSound(); setMode('create'); }}
        onMouseEnter={() => playSelectSound()}
        style={btnStyle}
      >
        🌐 CREAR SALA
      </button>
      <button
        onClick={() => { playConfirmSound(); setMode('join'); }}
        onMouseEnter={() => playSelectSound()}
        style={btnStyle}
      >
        🔗 UNIRSE A SALA
      </button>

      <button
        onClick={() => setGameState('MENU')}
        style={{ ...btnStyle, width: 200, marginTop: 30, border: '2px solid #ff4d4d', color: '#ff4d4d' }}
      >
        VOLVER
      </button>
    </div>
  );
};

export default OnlineMenu;
