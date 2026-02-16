import React, { useState, useEffect } from 'react';
import { useGame } from '../game/GameContext';
import type { CustomCharData } from '../game/types';
import { SPECIAL_ABILITIES, SUPER_ABILITIES, ULTRA_ABILITIES } from '../game/skills';
import { playSelectSound, playConfirmSound } from '../game/audio';

const COLORS = [
  '#ff0000','#ff4400','#ff8800','#ffbb00','#ffff00','#aaff00',
  '#00ff00','#00ff88','#00ffcc','#00ffff','#0088ff','#0044ff',
  '#0000ff','#4400ff','#8800ff','#cc00ff','#ff00ff','#ff0088',
  '#ffffff','#dddddd','#bbbbbb','#888888','#555555','#333333',
  '#000000','#5a3a1a','#8B4513','#D2691E','#f5deb3','#f5d1ad',
  '#d4af37','#ffd700','#ff4d4d','#1a1a2e','#16213e','#0f3460',
];

const SPEEDS: { label: string; value: CustomCharData['speed'] }[] = [
  { label: 'LENTO', value: 'lento' },
  { label: 'NORMAL', value: 'normal' },
  { label: 'RÁPIDO', value: 'rapido' },
  { label: 'VELOCISTA', value: 'velocista' },
];

const SIZES: { label: string; value: CustomCharData['size'] }[] = [
  { label: 'PEQUEÑO', value: 'pequeño' },
  { label: 'NORMAL', value: 'normal' },
  { label: 'GRANDE', value: 'grande' },
];

const defaultChar: CustomCharData = {
  name: '',
  hairColor: '#5a3a1a',
  skinColor: '#f5deb3',
  clothesColor: '#0088ff',
  pantsColor: '#222222',
  handsColor: '#f5d1ad',
  shoesColor: '#333333',
  eyesColor: '#00ffff',
  speed: 'normal',
  size: 'normal',
  effectColor: '#00ffff',
  specialAbility: 'Rombo Cósmico',
  superAbility: 'Impacto Rojo',
  ultraAbility: 'Persecución Blanca',
};

const ColorPicker: React.FC<{ label: string; value: string; onChange: (c: string) => void }> = ({ label, value, onChange }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ color: '#87ceeb', fontSize: 10, letterSpacing: 2, marginBottom: 3, fontFamily: "'Orbitron', monospace" }}>{label}</div>
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {COLORS.map(c => (
        <div
          key={c}
          onClick={() => { onChange(c); playSelectSound(); }}
          style={{
            width: 20, height: 20, background: c, cursor: 'pointer',
            border: value === c ? '3px solid #fff' : '1px solid #444',
            borderRadius: 2, boxShadow: value === c ? `0 0 8px ${c}` : 'none',
          }}
        />
      ))}
    </div>
  </div>
);

interface AbilityItem { name: string; source: string; }

const AbilitySelector: React.FC<{ label: string; abilities: AbilityItem[]; value: string; onChange: (s: string) => void; color: string }> = ({ label, abilities, value, onChange, color }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ color, fontSize: 11, letterSpacing: 2, marginBottom: 6, fontFamily: "'Orbitron', monospace" }}>{label}</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
      {abilities.map(a => (
        <button
          key={a.name}
          onClick={() => { onChange(a.name); playSelectSound(); }}
          style={{
            padding: '8px 4px', cursor: 'pointer',
            background: value === a.name ? `${color}25` : 'rgba(10,10,30,0.8)',
            border: `1px solid ${value === a.name ? color : '#333'}`,
            color: value === a.name ? color : '#87ceeb',
            fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 0,
            textAlign: 'left',
          }}
        >
          <div>{a.name.toUpperCase()}</div>
          <div style={{ fontSize: 7, color: '#555', marginTop: 2 }}>de {a.source}</div>
        </button>
      ))}
    </div>
  </div>
);

const CharacterCreator: React.FC = () => {
  const { setGameState } = useGame();
  const [customChars, setCustomChars] = useState<(CustomCharData | null)[]>([null, null, null, null, null, null]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [char, setChar] = useState<CustomCharData>({ ...defaultChar });
  const [activeTab, setActiveTab] = useState<'apariencia' | 'atributos' | 'habilidades'>('apariencia');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('customChars') || '[]');
      const arr: (CustomCharData | null)[] = [null, null, null, null, null, null];
      saved.forEach((ch: any, i: number) => {
        if (i < 6 && ch) arr[i] = { ...defaultChar, ...ch };
      });
      setCustomChars(arr);
    } catch { /* */ }
  }, []);

  const saveChar = () => {
    if (!char.name.trim()) { char.name = `CUSTOM ${(editingIdx ?? 0) + 1}`; }
    const updated = [...customChars];
    if (editingIdx !== null) updated[editingIdx] = { ...char };
    setCustomChars(updated);
    localStorage.setItem('customChars', JSON.stringify(updated));
    try {
      const stats = JSON.parse(localStorage.getItem('gameStats') || '{}');
      stats.customCharsCreated = updated.filter(c => c !== null).length;
      localStorage.setItem('gameStats', JSON.stringify(stats));
    } catch {}
    playConfirmSound();
    setEditingIdx(null);
  };

  const update = (key: keyof CustomCharData, val: string) => setChar(c => ({ ...c, [key]: val }));

  // List view
  if (editingIdx === null) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)' }}>
        <div style={{ padding: '20px 30px', borderBottom: '2px solid rgba(0,255,255,0.3)', background: 'rgba(0,0,0,0.5)', textAlign: 'center' }}>
          <h2 style={{ color: '#ffff00', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(20px, 4vw, 36px)', letterSpacing: 4, textShadow: '0 0 20px #ffff00' }}>
            CREADOR DE PERSONAJES
          </h2>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 600 }}>
            {customChars.map((ch, i) => (
              <div
                key={i}
                onClick={() => { setEditingIdx(i); setChar(ch ? { ...ch } : { ...defaultChar }); playSelectSound(); }}
                style={{
                  padding: 20, cursor: 'pointer', textAlign: 'center',
                  background: 'rgba(10,10,30,0.9)', border: `2px solid ${ch ? 'rgba(0,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  transition: 'all 0.3s', minHeight: 140,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ch ? (ch.eyesColor || '#00ffff') : '#ffff00'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ch ? 'rgba(0,255,255,0.4)' : 'rgba(255,255,255,0.1)'; }}
              >
                {ch ? (
                  <>
                    <div style={{
                      width: 60, height: 60, borderRadius: '50%', background: ch.skinColor,
                      border: `3px solid ${ch.eyesColor}`, boxShadow: `0 0 15px ${ch.eyesColor}40`,
                      position: 'relative', margin: '0 auto 8px',
                    }}>
                      <div style={{ position: 'absolute', top: '38%', left: '30%', width: 8, height: 8, borderRadius: '50%', background: ch.eyesColor }} />
                      <div style={{ position: 'absolute', top: '38%', right: '30%', width: 8, height: 8, borderRadius: '50%', background: ch.eyesColor }} />
                      <div style={{ position: 'absolute', top: -4, left: '10%', right: '10%', height: '40%', borderRadius: '50% 50% 0 0', background: ch.hairColor }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%', borderRadius: '0 0 50% 50%', background: ch.clothesColor }} />
                    </div>
                    <div style={{ color: '#eafcff', fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 2 }}>{ch.name}</div>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                      border: '2px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 8px',
                    }}>
                      <span style={{ color: '#555', fontSize: 28, fontWeight: 900 }}>+</span>
                    </div>
                    <div style={{ color: '#555', fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 2 }}>VACÍO</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '15px 30px', borderTop: '2px solid rgba(0,255,255,0.3)', background: 'rgba(0,0,0,0.5)', textAlign: 'center' }}>
          <button onClick={() => setGameState('MENU')} style={{
            padding: '10px 40px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
            cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
          }}>VOLVER</button>
        </div>
      </div>
    );
  }

  // Editor view
  const sizeScale = char.size === 'pequeño' ? 0.8 : char.size === 'grande' ? 1.3 : 1;

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)' }}>
      {/* Left panel */}
      <div style={{ width: '55%', overflowY: 'auto', padding: '15px 25px', borderRight: '2px solid rgba(0,255,255,0.3)', background: 'rgba(0,0,0,0.4)' }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: '#87ceeb', fontSize: 10, letterSpacing: 2, marginBottom: 3, fontFamily: "'Orbitron', monospace" }}>NOMBRE</div>
          <input value={char.name} onChange={e => update('name', e.target.value.toUpperCase().slice(0, 12))} maxLength={12} placeholder="NOMBRE..."
            style={{ width: '100%', padding: '6px 10px', background: 'rgba(10,10,30,0.9)', border: '2px solid rgba(0,255,255,0.3)', color: '#eafcff', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 2 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {(['apariencia', 'atributos', 'habilidades'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '6px 0', cursor: 'pointer',
              background: activeTab === tab ? 'rgba(0,255,255,0.15)' : 'rgba(10,10,30,0.8)',
              border: `2px solid ${activeTab === tab ? '#00ffff' : 'rgba(0,255,255,0.2)'}`,
              color: activeTab === tab ? '#00ffff' : '#87ceeb',
              fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
            }}>{tab}</button>
          ))}
        </div>

        {activeTab === 'apariencia' && (
          <>
            <ColorPicker label="CABELLO" value={char.hairColor} onChange={c => update('hairColor', c)} />
            <ColorPicker label="PIEL" value={char.skinColor} onChange={c => update('skinColor', c)} />
            <ColorPicker label="ROPA" value={char.clothesColor} onChange={c => update('clothesColor', c)} />
            <ColorPicker label="PANTALONES" value={char.pantsColor} onChange={c => update('pantsColor', c)} />
            <ColorPicker label="MANOS" value={char.handsColor} onChange={c => update('handsColor', c)} />
            <ColorPicker label="ZAPATOS" value={char.shoesColor} onChange={c => update('shoesColor', c)} />
            <ColorPicker label="OJOS" value={char.eyesColor} onChange={c => update('eyesColor', c)} />
            <ColorPicker label="COLOR DE EFECTOS" value={char.effectColor} onChange={c => update('effectColor', c)} />
          </>
        )}

        {activeTab === 'atributos' && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#87ceeb', fontSize: 10, letterSpacing: 2, marginBottom: 6, fontFamily: "'Orbitron', monospace" }}>VELOCIDAD</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {SPEEDS.map(s => (
                  <button key={s.value} onClick={() => update('speed', s.value)} style={{
                    flex: 1, padding: '8px 0', cursor: 'pointer',
                    background: char.speed === s.value ? 'rgba(0,255,255,0.2)' : 'rgba(10,10,30,0.8)',
                    border: `2px solid ${char.speed === s.value ? '#00ffff' : '#333'}`,
                    color: char.speed === s.value ? '#00ffff' : '#87ceeb',
                    fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 1,
                  }}>{s.label}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#87ceeb', fontSize: 10, letterSpacing: 2, marginBottom: 6, fontFamily: "'Orbitron', monospace" }}>TAMAÑO</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {SIZES.map(s => (
                  <button key={s.value} onClick={() => update('size', s.value)} style={{
                    flex: 1, padding: '8px 0', cursor: 'pointer',
                    background: char.size === s.value ? 'rgba(0,255,255,0.2)' : 'rgba(10,10,30,0.8)',
                    border: `2px solid ${char.size === s.value ? '#00ffff' : '#333'}`,
                    color: char.size === s.value ? '#00ffff' : '#87ceeb',
                    fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 1,
                  }}>{s.label}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'habilidades' && (
          <>
            <AbilitySelector label="ESPECIAL" abilities={SPECIAL_ABILITIES} value={char.specialAbility} onChange={s => update('specialAbility', s)} color="#00ffff" />
            <AbilitySelector label="SUPER" abilities={SUPER_ABILITIES} value={char.superAbility} onChange={s => update('superAbility', s)} color="#ffcc00" />
            <AbilitySelector label="ULTRA" abilities={ULTRA_ABILITIES} value={char.ultraAbility} onChange={s => update('ultraAbility', s)} color="#ff4400" />
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
          <button onClick={saveChar} style={{
            flex: 1, padding: '10px 0', background: 'rgba(0,255,100,0.15)', border: '2px solid #00ff66',
            color: '#00ff66', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2,
          }}>GUARDAR</button>
          <button onClick={() => setEditingIdx(null)} style={{
            flex: 1, padding: '10px 0', background: 'transparent', border: '2px solid #ff4d4d',
            color: '#ff4d4d', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2,
          }}>CANCELAR</button>
        </div>
      </div>

      {/* Right panel — preview */}
      <div style={{
        width: '45%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 60%, rgba(0,255,255,0.05), transparent 70%)',
      }}>
        <div style={{ color: '#ffcc66', fontFamily: "'Orbitron', monospace", fontSize: 16, letterSpacing: 3, marginBottom: 20, textShadow: '0 0 10px #ffcc6660' }}>
          {char.name || 'SIN NOMBRE'}
        </div>

        <div style={{
          width: 120 * sizeScale, height: 120 * sizeScale, borderRadius: '50%', background: char.skinColor,
          border: `4px solid ${char.eyesColor}`, boxShadow: `0 0 30px ${char.eyesColor}40, 0 0 60px ${char.effectColor}20`,
          position: 'relative', filter: `drop-shadow(0 0 20px ${char.effectColor}40)`,
        }}>
          <div style={{ position: 'absolute', top: -6, left: '12%', right: '12%', height: '42%', borderRadius: '50% 50% 20% 20%', background: char.hairColor }} />
          <div style={{ position: 'absolute', top: '36%', left: '25%', width: 14, height: 14, borderRadius: '50%', background: char.eyesColor, boxShadow: `0 0 8px ${char.eyesColor}` }} />
          <div style={{ position: 'absolute', top: '36%', right: '25%', width: 14, height: 14, borderRadius: '50%', background: char.eyesColor, boxShadow: `0 0 8px ${char.eyesColor}` }} />
          <div style={{ position: 'absolute', top: '40%', left: '29%', width: 6, height: 6, borderRadius: '50%', background: '#000' }} />
          <div style={{ position: 'absolute', top: '40%', right: '29%', width: 6, height: 6, borderRadius: '50%', background: '#000' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '28%', borderRadius: '0 0 100px 100px', background: char.clothesColor, borderTop: `2px solid ${char.pantsColor}` }} />
          <div style={{ position: 'absolute', top: '50%', left: -16, width: 20, height: 20, borderRadius: '50%', background: char.handsColor, border: '2px solid #00000040' }} />
          <div style={{ position: 'absolute', top: '50%', right: -16, width: 20, height: 20, borderRadius: '50%', background: char.handsColor, border: '2px solid #00000040' }} />
        </div>

        <div style={{ width: 160 * sizeScale, height: 160 * sizeScale, borderRadius: '50%', border: `2px dashed ${char.effectColor}30`, position: 'absolute', pointerEvents: 'none' }} />

        <div style={{ marginTop: 25, textAlign: 'center' }}>
          <div style={{ color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 2 }}>
            VEL: {char.speed.toUpperCase()} | TAM: {char.size.toUpperCase()}
          </div>
          <div style={{ color: char.effectColor, fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 2, marginTop: 4 }}>
            ESP: {char.specialAbility.toUpperCase()}
          </div>
          <div style={{ color: '#ffcc00', fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 2, marginTop: 2 }}>
            SUP: {char.superAbility.toUpperCase()}
          </div>
          <div style={{ color: '#ff4400', fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 2, marginTop: 2 }}>
            ULT: {char.ultraAbility.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreator;
