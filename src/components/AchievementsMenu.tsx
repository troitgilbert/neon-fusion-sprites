import React, { useState, useEffect } from 'react';
import { useGame } from '../game/GameContext';
import { ACHIEVEMENTS, loadUnlocked, loadClaimed, saveClaimed, getDifficultyColor, getDifficultyLabel } from '../game/achievements';

const AchievementsMenu: React.FC = () => {
  const { setGameState, engine } = useGame();
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'logros' | 'personajes'>('logros');

  useEffect(() => {
    setUnlocked(loadUnlocked());
    setClaimed(loadClaimed());
  }, []);

  const handleClaim = (id: string, reward: number) => {
    const newClaimed = new Set(claimed);
    newClaimed.add(id);
    setClaimed(newClaimed);
    saveClaimed(newClaimed);
    engine.updatePrisms(reward);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)' }}>
      <div style={{ padding: '18px 30px', borderBottom: '2px solid rgba(255,140,0,0.4)', background: 'rgba(0,0,0,0.5)', textAlign: 'center' }}>
        <h2 style={{ color: '#ffcc66', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(20px, 4vw, 34px)', letterSpacing: 4, textShadow: '0 0 20px #ff8c00' }}>
          LOGROS Y RECOMPENSAS
        </h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 0, borderBottom: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
        <button
          onClick={() => setActiveTab('logros')}
          style={{
            padding: '12px 40px', border: 'none', cursor: 'pointer',
            background: activeTab === 'logros' ? 'rgba(255,140,0,0.2)' : 'transparent',
            borderBottom: activeTab === 'logros' ? '3px solid #ff8c00' : '3px solid transparent',
            color: activeTab === 'logros' ? '#ffcc66' : '#555',
            fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
            transition: 'all 0.3s',
          }}
        >LOGROS</button>
        <button
          onClick={() => setActiveTab('personajes')}
          style={{
            padding: '12px 40px', border: 'none', cursor: 'pointer',
            background: activeTab === 'personajes' ? 'rgba(0,255,255,0.2)' : 'transparent',
            borderBottom: activeTab === 'personajes' ? '3px solid #00ffff' : '3px solid transparent',
            color: activeTab === 'personajes' ? '#00ffff' : '#555',
            fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
            transition: 'all 0.3s',
          }}
        >OBTENCIÓN DE PERSONAJES</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '15px 30px' }}>
        {activeTab === 'logros' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, maxWidth: 900, margin: '0 auto' }}>
            {ACHIEVEMENTS.map(a => {
              const isUnlocked = unlocked.has(a.id);
              const isClaimed = claimed.has(a.id);
              const diffColor = getDifficultyColor(a.difficulty);

              return (
                <div key={a.id} style={{
                  padding: '14px 16px', background: isUnlocked ? 'rgba(10,10,30,0.9)' : 'rgba(5,5,15,0.95)',
                  border: `2px solid ${isUnlocked ? diffColor + '60' : 'rgba(255,255,255,0.06)'}`,
                  opacity: isUnlocked ? 1 : 0.5,
                  boxShadow: isUnlocked && !isClaimed ? `0 0 15px ${diffColor}30` : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ color: isUnlocked ? '#eafcff' : '#555', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2, fontWeight: 900 }}>
                      {isUnlocked ? a.name : '???'}
                    </span>
                    <span style={{ color: diffColor, fontFamily: "'Orbitron', monospace", fontSize: 8, letterSpacing: 1 }}>
                      {getDifficultyLabel(a.difficulty)}
                    </span>
                  </div>
                  <div style={{ color: isUnlocked ? '#87ceeb' : '#444', fontSize: 11, marginBottom: 8 }}>
                    {a.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", fontSize: 11 }}>
                      🔷 +{a.reward}
                    </span>
                    {isUnlocked && !isClaimed && (
                      <button
                        onClick={() => handleClaim(a.id, a.reward)}
                        style={{
                          padding: '4px 14px', background: `${diffColor}20`, border: `1px solid ${diffColor}`,
                          color: diffColor, cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 2,
                        }}
                      >
                        CANJEAR
                      </button>
                    )}
                    {isClaimed && (
                      <span style={{ color: '#00ff66', fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 2 }}>✓ CANJEADO</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'personajes' && (
          <div style={{ maxWidth: 700, margin: '60px auto', textAlign: 'center' }}>
            <div style={{ 
              width: 120, height: 120, borderRadius: '50%', margin: '0 auto 30px',
              background: 'rgba(255,255,255,0.03)', border: '3px dashed rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 40, opacity: 0.3 }}>🔒</span>
            </div>
            <p style={{ color: '#555', fontFamily: "'Orbitron', monospace", fontSize: 16, letterSpacing: 3 }}>
              PRÓXIMAMENTE
            </p>
            <p style={{ color: '#333', fontSize: 12, marginTop: 10 }}>
              Desbloquea nuevos personajes completando desafíos especiales
            </p>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 30px', borderTop: '2px solid rgba(255,140,0,0.4)', background: 'rgba(0,0,0,0.5)', textAlign: 'center' }}>
        <button onClick={() => setGameState('MENU')} style={{
          padding: '8px 35px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
          cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 3,
        }}>VOLVER</button>
      </div>
    </div>
  );
};

export default AchievementsMenu;
