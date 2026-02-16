import React, { useState } from 'react';
import { useGame } from '../game/GameContext';
import { CHAR_DATA, INTELLIGENCE_GRADES, CHAR_INTELLIGENCE } from '../game/constants';
import { playSelectSound, playConfirmSound } from '../game/audio';

type RPS = 'piedra' | 'papel' | 'tijeras';
const RPS_OPTIONS: { id: RPS; emoji: string }[] = [
  { id: 'piedra', emoji: '🪨' },
  { id: 'papel', emoji: '📄' },
  { id: 'tijeras', emoji: '✂️' },
];

const MindGamesMenu: React.FC = () => {
  const { engine, setGameState } = useGame();
  const [phase, setPhase] = useState<'select_game' | 'select_opponent' | 'playing' | 'result'>('select_game');
  const [selectedOpponent, setSelectedOpponent] = useState<number | null>(null);
  const [playerChoice, setPlayerChoice] = useState<RPS | null>(null);
  const [cpuChoice, setCpuChoice] = useState<RPS | null>(null);
  const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [isCustomPlayer, setIsCustomPlayer] = useState(false);

  const getGrade = (charName: string) => {
    return CHAR_INTELLIGENCE[charName] || 'normal';
  };

  const getGradeInfo = (gradeId: string) => INTELLIGENCE_GRADES.find(g => g.id === gradeId) || INTELLIGENCE_GRADES[1];

  const play = (choice: RPS) => {
    if (!selectedOpponent && selectedOpponent !== 0) return;
    setPlayerChoice(choice);
    playConfirmSound();

    const charName = CHAR_DATA[selectedOpponent]?.name || 'CUSTOM';
    const grade = getGrade(charName);
    const gradeInfo = getGradeInfo(grade);

    // CPU choice based on intelligence (smarter = more likely to counter)
    let cpu: RPS;
    const counter: Record<RPS, RPS> = { piedra: 'papel', papel: 'tijeras', tijeras: 'piedra' };
    if (Math.random() < (1 - gradeInfo.winChance)) {
      cpu = counter[choice]; // CPU counters
    } else {
      const opts: RPS[] = ['piedra', 'papel', 'tijeras'];
      cpu = opts[Math.floor(Math.random() * 3)];
    }
    setCpuChoice(cpu);

    // Determine result
    let r: 'win' | 'lose' | 'draw';
    if (choice === cpu) r = 'draw';
    else if (counter[cpu] === choice) r = 'lose';
    else r = 'win';
    setResult(r);

    if (r === 'win') {
      let reward = gradeInfo.reward;
      if (isCustomPlayer) reward = Math.floor(reward / 2);
      engine.updatePrisms(reward);
    }

    setPhase('result');
  };

  if (phase === 'select_game') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a2e, #1a1a3e)' }}>
        <h1 style={{ color: '#ffcc33', fontFamily: "'Orbitron', monospace", fontSize: 32, letterSpacing: 4, marginBottom: 40, textShadow: '0 0 15px #ff6600' }}>
          JUEGOS MENTALES
        </h1>
        <div onClick={() => { setPhase('select_opponent'); playConfirmSound(); }} style={{
          padding: '30px 50px', cursor: 'pointer', textAlign: 'center',
          background: 'rgba(10,10,30,0.9)', border: '2px solid #00ffff',
          boxShadow: '0 0 20px rgba(0,255,255,0.3)',
          transition: 'all 0.3s',
        }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✊✋✌️</div>
          <div style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 18, letterSpacing: 3 }}>
            PIEDRA PAPEL O TIJERAS
          </div>
        </div>
        <button onClick={() => setGameState('MENU')} style={{
          marginTop: 40, padding: '10px 35px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
          cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 3,
        }}>VOLVER</button>
      </div>
    );
  }

  if (phase === 'select_opponent') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a2e, #1a1a3e)' }}>
        <h2 style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 24, letterSpacing: 4, marginBottom: 30, textShadow: '0 0 15px #00ffff' }}>
          ELIGE A TU OPONENTE
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 220px)', gap: 15 }}>
          {CHAR_DATA.map((ch, i) => {
            const grade = getGrade(ch.name);
            const gradeInfo = getGradeInfo(grade);
            return (
              <div key={ch.name} onClick={() => { setSelectedOpponent(i); setIsCustomPlayer(false); setPhase('playing'); playConfirmSound(); }}
                style={{
                  padding: 20, cursor: 'pointer', textAlign: 'center',
                  background: 'rgba(10,10,30,0.9)', border: `2px solid ${ch.eyes}30`,
                  transition: 'all 0.3s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ch.eyes; playSelectSound(); }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${ch.eyes}30`; }}
              >
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: ch.color, border: `2px solid ${ch.eyes}`, margin: '0 auto 10px' }} />
                <div style={{ color: '#eafcff', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 2 }}>{ch.name}</div>
                <div style={{ color: gradeInfo.color, fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 1, marginTop: 5 }}>
                  {gradeInfo.label}
                </div>
                <div style={{ color: '#00ff66', fontSize: 10, marginTop: 3 }}>🔷 +{gradeInfo.reward}</div>
              </div>
            );
          })}
        </div>
        <button onClick={() => setPhase('select_game')} style={{
          marginTop: 30, padding: '8px 30px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
          cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 3,
        }}>VOLVER</button>
      </div>
    );
  }

  if (phase === 'playing') {
    const opp = CHAR_DATA[selectedOpponent || 0];
    const grade = getGrade(opp.name);
    const gradeInfo = getGradeInfo(grade);
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a2e, #1a1a3e)' }}>
        <div style={{ color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2, marginBottom: 10 }}>
          VS {opp.name} ({gradeInfo.label})
        </div>
        <h2 style={{ color: '#ffff00', fontFamily: "'Orbitron', monospace", fontSize: 28, letterSpacing: 4, marginBottom: 40, textShadow: '0 0 15px #ffff00' }}>
          ¡ELIGE!
        </h2>
        <div style={{ display: 'flex', gap: 25 }}>
          {RPS_OPTIONS.map(opt => (
            <div key={opt.id} onClick={() => play(opt.id)}
              style={{
                width: 120, height: 120, cursor: 'pointer', textAlign: 'center',
                background: 'rgba(10,10,30,0.9)', border: '2px solid rgba(0,255,255,0.3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s', borderRadius: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,255,255,0.3)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span style={{ fontSize: 40 }}>{opt.emoji}</span>
              <span style={{ color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 2, marginTop: 8 }}>{opt.id.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Result phase
  const opp = CHAR_DATA[selectedOpponent || 0];
  const grade = getGrade(opp.name);
  const gradeInfo = getGradeInfo(grade);
  const rpsEmoji: Record<string, string> = { piedra: '🪨', papel: '📄', tijeras: '✂️' };
  const resultColor = result === 'win' ? '#00ff66' : result === 'lose' ? '#ff4444' : '#ffff00';
  const resultText = result === 'win' ? '¡GANASTE!' : result === 'lose' ? 'PERDISTE' : 'EMPATE';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a2e, #1a1a3e)' }}>
      <div style={{ display: 'flex', gap: 60, alignItems: 'center', marginBottom: 30 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 60 }}>{rpsEmoji[playerChoice || '']}</div>
          <div style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 12, marginTop: 10 }}>TÚ</div>
        </div>
        <div style={{ color: resultColor, fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3 }}>VS</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 60 }}>{rpsEmoji[cpuChoice || '']}</div>
          <div style={{ color: '#ff8c00', fontFamily: "'Orbitron', monospace", fontSize: 12, marginTop: 10 }}>{opp.name}</div>
        </div>
      </div>
      <div style={{ color: resultColor, fontFamily: "'Orbitron', monospace", fontSize: 36, letterSpacing: 6, textShadow: `0 0 20px ${resultColor}`, marginBottom: 15 }}>
        {resultText}
      </div>
      {result === 'win' && (
        <div style={{ color: '#00ff66', fontFamily: "'Orbitron', monospace", fontSize: 16 }}>
          🔷 +{isCustomPlayer ? Math.floor(gradeInfo.reward / 2) : gradeInfo.reward} CRISTALES
        </div>
      )}
      <div style={{ display: 'flex', gap: 15, marginTop: 30 }}>
        <button onClick={() => { setPhase('playing'); setPlayerChoice(null); setCpuChoice(null); setResult(null); }} style={{
          padding: '10px 30px', background: 'rgba(0,255,255,0.1)', border: '2px solid #00ffff', color: '#00ffff',
          cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 2,
        }}>OTRA VEZ</button>
        <button onClick={() => setGameState('MENU')} style={{
          padding: '10px 30px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
          cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 2,
        }}>SALIR</button>
      </div>
    </div>
  );
};

export default MindGamesMenu;
