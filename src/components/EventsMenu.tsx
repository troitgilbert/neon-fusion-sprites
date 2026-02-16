import React, { useState } from 'react';
import { useGame } from '../game/GameContext';
import { playConfirmSound } from '../game/audio';

const EventsMenu: React.FC = () => {
  const { engine, setGameState } = useGame();
  const [hovered, setHovered] = useState(false);
  const hasSkin = engine.inventory?.kaito?.demonioBlanco === true;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0000 50%, #0a0a2e 100%)' }}>
      <h1 style={{ color: '#ff4444', fontFamily: "'Orbitron', monospace", fontSize: 36, letterSpacing: 6, marginBottom: 50, textShadow: '0 0 30px #ff0000' }}>
        EVENTOS
      </h1>

      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          playConfirmSound();
          engine.mode = 'events';
          setGameState('SELECT');
        }}
        style={{
          width: 400, padding: '30px 25px', cursor: 'pointer', textAlign: 'center',
          background: hovered ? 'rgba(30,0,0,0.95)' : 'rgba(10,0,0,0.9)',
          border: `2px solid ${hovered ? '#ff0000' : 'rgba(255,0,0,0.2)'}`,
          boxShadow: hovered ? '0 0 50px rgba(255,0,0,0.4), inset 0 0 30px rgba(255,0,0,0.1)' : 'none',
          transition: 'all 0.4s',
          transform: hovered ? 'scale(1.03)' : 'scale(1)',
        }}
      >
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
          background: '#000', border: '3px solid #ff0000',
          boxShadow: '0 0 25px rgba(255,0,0,0.5)',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: '38%', left: '25%', width: 12, height: 12, borderRadius: '50%', background: '#ff0000', boxShadow: '0 0 8px #ff0000' }} />
          <div style={{ position: 'absolute', top: '38%', right: '25%', width: 12, height: 12, borderRadius: '50%', background: '#ff0000', boxShadow: '0 0 8px #ff0000' }} />
        </div>

        <div style={{ color: '#ff4444', fontFamily: "'Orbitron', monospace", fontSize: 20, letterSpacing: 3, fontWeight: 900, marginBottom: 10 }}>
          HUYE DEL DEMONIO BLANCO
        </div>

        {hovered && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <p style={{ color: '#ffaaaa', fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
              Sobrevive 30 segundos huyendo del Demonio Blanco. Es más rápido que tú y te mata de un golpe.
              El escenario es Galaxia y es más largo de lo normal. ¡No dejes que te alcance!
            </p>
            <div style={{ color: '#00ff66', fontFamily: "'Orbitron', monospace", fontSize: 13 }}>
              🏆 {hasSkin ? '🔷 +40 CRISTALES' : 'SKIN: DEMONIO BLANCO'}
            </div>
          </div>
        )}
      </div>

      <button onClick={() => setGameState('MENU')} style={{
        marginTop: 40, padding: '10px 35px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
        cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
      }}>VOLVER</button>

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default EventsMenu;
