import React, { useState, useEffect } from 'react';
import { useGame } from '../game/GameContext';
import type { CustomCharData } from '../game/types';

const COLORS = ['#ff0000','#ff8800','#ffff00','#00ff00','#00ffff','#0088ff','#8800ff','#ff00ff','#ffffff','#000000','#888888','#5a3a1a','#f5deb3','#f5d1ad','#d4af37','#ff4d4d'];

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

const SPECIALS = ['Proyectil', 'Teletransporte', 'Escudo', 'Ráfaga', 'Explosión', 'Drenaje'];

const defaultChar: CustomCharData = {
  name: 'CUSTOM',
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
  specialAbility: 'Proyectil',
};

const ColorPicker: React.FC<{ label: string; value: string; onChange: (c: string) => void }> = ({ label, value, onChange }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ color: '#87ceeb', fontSize: 11, letterSpacing: 2, marginBottom: 4, fontFamily: "'Orbitron', monospace" }}>{label}</div>
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {COLORS.map(c => (
        <div
          key={c}
          onClick={() => onChange(c)}
          style={{
            width: 24, height: 24, background: c, cursor: 'pointer',
            border: value === c ? '3px solid #fff' : '2px solid #333',
            borderRadius: 3, boxShadow: value === c ? `0 0 8px ${c}` : 'none',
          }}
        />
      ))}
    </div>
  </div>
);

const CharacterCreator: React.FC = () => {
  const { setGameState, engine } = useGame();
  const [customChars, setCustomChars] = useState<CustomCharData[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [char, setChar] = useState<CustomCharData>({ ...defaultChar });
  const [activeTab, setActiveTab] = useState<'apariencia' | 'atributos' | 'habilidades'>('apariencia');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('customChars') || '[]');
      if (saved.length > 0) setCustomChars(saved);
      else {
        // Pre-create 6 default custom characters
        const defaults: CustomCharData[] = [
          { ...defaultChar, name: 'GUERRERO', clothesColor: '#ff0000', eyesColor: '#ffff00', speed: 'normal', specialAbility: 'Explosión' },
          { ...defaultChar, name: 'NINJA', clothesColor: '#000000', eyesColor: '#ff0000', speed: 'velocista', specialAbility: 'Teletransporte' },
          { ...defaultChar, name: 'MAGO', clothesColor: '#8800ff', eyesColor: '#ff00ff', speed: 'lento', size: 'pequeño', specialAbility: 'Proyectil' },
          { ...defaultChar, name: 'TITÁN', clothesColor: '#888888', skinColor: '#d4af37', speed: 'lento', size: 'grande', specialAbility: 'Escudo' },
          { ...defaultChar, name: 'SOMBRA', clothesColor: '#222222', hairColor: '#000000', eyesColor: '#ff4d4d', speed: 'rapido', specialAbility: 'Drenaje' },
          { ...defaultChar, name: 'ÁNGEL', clothesColor: '#ffffff', hairColor: '#ffff00', eyesColor: '#00ffff', speed: 'rapido', specialAbility: 'Ráfaga' },
        ];
        setCustomChars(defaults);
        localStorage.setItem('customChars', JSON.stringify(defaults));
      }
    } catch { /* */ }
  }, []);

  const saveChar = () => {
    const updated = [...customChars];
    if (editingIdx !== null) {
      updated[editingIdx] = char;
    }
    setCustomChars(updated);
    localStorage.setItem('customChars', JSON.stringify(updated));
    setEditingIdx(null);
  };

  const update = (key: keyof CustomCharData, val: string) => setChar(c => ({ ...c, [key]: val }));

  // List view (selecting which custom char to edit)
  if (editingIdx === null) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)' }}>
        <div style={{
          padding: '20px 30px', borderBottom: '2px solid rgba(0,255,255,0.3)',
          background: 'rgba(0,0,0,0.5)', textAlign: 'center',
        }}>
          <h2 style={{ color: '#ffff00', fontFamily: "'Orbitron', monospace", fontSize: 'clamp(20px, 4vw, 36px)', letterSpacing: 4, textShadow: '0 0 20px #ffff00' }}>
            CREADOR DE PERSONAJES
          </h2>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 700 }}>
            {customChars.map((ch, i) => (
              <div
                key={i}
                onClick={() => { setEditingIdx(i); setChar({ ...ch }); }}
                style={{
                  padding: 20, cursor: 'pointer', textAlign: 'center',
                  background: 'rgba(10,10,30,0.9)', border: '2px solid rgba(0,255,255,0.3)',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ch.eyesColor; e.currentTarget.style.boxShadow = `0 0 25px ${ch.eyesColor}40`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,255,255,0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Mini preview */}
                <svg width="80" height="100" viewBox="0 0 80 100" style={{ margin: '0 auto 10px' }}>
                  {/* Head */}
                  <circle cx="40" cy="25" r="18" fill={ch.skinColor} stroke="#000" strokeWidth="2" />
                  {/* Hair */}
                  <ellipse cx="40" cy="15" rx="16" ry="10" fill={ch.hairColor} stroke="#000" strokeWidth="1" />
                  {/* Eyes */}
                  <circle cx="35" cy="23" r="3" fill={ch.eyesColor} />
                  <circle cx="45" cy="23" r="3" fill={ch.eyesColor} />
                  {/* Body/clothes */}
                  <rect x="25" y="43" width="30" height="25" rx="4" fill={ch.clothesColor} stroke="#000" strokeWidth="1.5" />
                  {/* Pants */}
                  <rect x="27" y="68" width="11" height="18" rx="3" fill={ch.pantsColor} stroke="#000" strokeWidth="1" />
                  <rect x="42" y="68" width="11" height="18" rx="3" fill={ch.pantsColor} stroke="#000" strokeWidth="1" />
                  {/* Hands */}
                  <circle cx="20" cy="55" r="6" fill={ch.handsColor} stroke="#000" strokeWidth="1" />
                  <circle cx="60" cy="55" r="6" fill={ch.handsColor} stroke="#000" strokeWidth="1" />
                  {/* Shoes */}
                  <ellipse cx="33" cy="90" rx="8" ry="5" fill={ch.shoesColor} stroke="#000" strokeWidth="1" />
                  <ellipse cx="48" cy="90" rx="8" ry="5" fill={ch.shoesColor} stroke="#000" strokeWidth="1" />
                </svg>
                <div style={{ color: '#eafcff', fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 2 }}>{ch.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '15px 30px', borderTop: '2px solid rgba(0,255,255,0.3)', background: 'rgba(0,0,0,0.5)', textAlign: 'center' }}>
          <button onClick={() => setGameState('MENU')} style={{
            padding: '10px 40px', background: 'transparent', border: '2px solid #ff4d4d', color: '#ff4d4d',
            cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3,
          }}>
            VOLVER
          </button>
        </div>
      </div>
    );
  }

  // Editor view (Xenoverse style)
  const sizeScale = char.size === 'pequeño' ? 0.7 : char.size === 'grande' ? 1.4 : 1;

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)' }}>
      {/* Left panel — options */}
      <div style={{
        width: '55%', overflowY: 'auto', padding: '20px 30px',
        borderRight: '2px solid rgba(0,255,255,0.3)',
        background: 'rgba(0,0,0,0.4)',
      }}>
        {/* Name */}
        <div style={{ marginBottom: 15 }}>
          <div style={{ color: '#87ceeb', fontSize: 11, letterSpacing: 2, marginBottom: 4, fontFamily: "'Orbitron', monospace" }}>NOMBRE</div>
          <input
            value={char.name}
            onChange={e => update('name', e.target.value.toUpperCase().slice(0, 12))}
            maxLength={12}
            style={{
              width: '100%', padding: '8px 12px', background: 'rgba(10,10,30,0.9)',
              border: '2px solid rgba(0,255,255,0.3)', color: '#eafcff',
              fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 2,
            }}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 15 }}>
          {(['apariencia', 'atributos', 'habilidades'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '8px 0', cursor: 'pointer',
                background: activeTab === tab ? 'rgba(0,255,255,0.15)' : 'rgba(10,10,30,0.8)',
                border: `2px solid ${activeTab === tab ? '#00ffff' : 'rgba(0,255,255,0.2)'}`,
                color: activeTab === tab ? '#00ffff' : '#87ceeb',
                fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
              }}
            >
              {tab}
            </button>
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
          </>
        )}

        {activeTab === 'atributos' && (
          <>
            <div style={{ marginBottom: 15 }}>
              <div style={{ color: '#87ceeb', fontSize: 11, letterSpacing: 2, marginBottom: 8, fontFamily: "'Orbitron', monospace" }}>VELOCIDAD</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {SPEEDS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => update('speed', s.value)}
                    style={{
                      flex: 1, padding: '10px 0', cursor: 'pointer',
                      background: char.speed === s.value ? 'rgba(0,255,255,0.2)' : 'rgba(10,10,30,0.8)',
                      border: `2px solid ${char.speed === s.value ? '#00ffff' : '#333'}`,
                      color: char.speed === s.value ? '#00ffff' : '#87ceeb',
                      fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 1,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 15 }}>
              <div style={{ color: '#87ceeb', fontSize: 11, letterSpacing: 2, marginBottom: 8, fontFamily: "'Orbitron', monospace" }}>TAMAÑO</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {SIZES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => update('size', s.value)}
                    style={{
                      flex: 1, padding: '10px 0', cursor: 'pointer',
                      background: char.size === s.value ? 'rgba(0,255,255,0.2)' : 'rgba(10,10,30,0.8)',
                      border: `2px solid ${char.size === s.value ? '#00ffff' : '#333'}`,
                      color: char.size === s.value ? '#00ffff' : '#87ceeb',
                      fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 1,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'habilidades' && (
          <>
            <ColorPicker label="COLOR DE EFECTOS" value={char.effectColor} onChange={c => update('effectColor', c)} />
            <div style={{ marginBottom: 15 }}>
              <div style={{ color: '#87ceeb', fontSize: 11, letterSpacing: 2, marginBottom: 8, fontFamily: "'Orbitron', monospace" }}>ESPECIAL</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {SPECIALS.map(sp => (
                  <button
                    key={sp}
                    onClick={() => update('specialAbility', sp)}
                    style={{
                      padding: '10px 0', cursor: 'pointer',
                      background: char.specialAbility === sp ? 'rgba(255,200,0,0.2)' : 'rgba(10,10,30,0.8)',
                      border: `2px solid ${char.specialAbility === sp ? '#ffcc00' : '#333'}`,
                      color: char.specialAbility === sp ? '#ffcc00' : '#87ceeb',
                      fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 1,
                    }}
                  >
                    {sp.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={saveChar} style={{
            flex: 1, padding: '12px 0', background: 'rgba(0,255,100,0.15)', border: '2px solid #00ff66',
            color: '#00ff66', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 2,
          }}>
            GUARDAR
          </button>
          <button onClick={() => setEditingIdx(null)} style={{
            flex: 1, padding: '12px 0', background: 'transparent', border: '2px solid #ff4d4d',
            color: '#ff4d4d', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 2,
          }}>
            CANCELAR
          </button>
        </div>
      </div>

      {/* Right panel — preview */}
      <div style={{
        width: '45%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 60%, rgba(0,255,255,0.05), transparent 70%)',
      }}>
        <div style={{
          color: '#ffcc66', fontFamily: "'Orbitron', monospace", fontSize: 18,
          letterSpacing: 3, marginBottom: 20, textShadow: '0 0 10px #ffcc6660',
        }}>
          {char.name}
        </div>

        {/* Character preview SVG */}
        <svg
          width={200 * sizeScale}
          height={260 * sizeScale}
          viewBox="0 0 200 260"
          style={{ filter: `drop-shadow(0 0 20px ${char.effectColor}40)` }}
        >
          {/* Head */}
          <circle cx="100" cy="60" r="40" fill={char.skinColor} stroke="#000" strokeWidth="3" />
          {/* Hair */}
          <ellipse cx="100" cy="35" rx="35" ry="22" fill={char.hairColor} stroke="#000" strokeWidth="2" />
          {/* Eyes */}
          <circle cx="88" cy="55" r="6" fill={char.eyesColor} />
          <circle cx="112" cy="55" r="6" fill={char.eyesColor} />
          <circle cx="88" cy="55" r="2.5" fill="#000" />
          <circle cx="112" cy="55" r="2.5" fill="#000" />
          {/* Eye glow */}
          <circle cx="88" cy="55" r="8" fill="none" stroke={char.eyesColor} strokeWidth="1" opacity="0.4" />
          <circle cx="112" cy="55" r="8" fill="none" stroke={char.eyesColor} strokeWidth="1" opacity="0.4" />
          {/* Body/clothes */}
          <rect x="65" y="100" width="70" height="60" rx="8" fill={char.clothesColor} stroke="#000" strokeWidth="2.5" />
          {/* Pants */}
          <rect x="70" y="160" width="25" height="45" rx="6" fill={char.pantsColor} stroke="#000" strokeWidth="2" />
          <rect x="105" y="160" width="25" height="45" rx="6" fill={char.pantsColor} stroke="#000" strokeWidth="2" />
          {/* Hands */}
          <circle cx="50" cy="130" r="14" fill={char.handsColor} stroke="#000" strokeWidth="2" />
          <circle cx="150" cy="130" r="14" fill={char.handsColor} stroke="#000" strokeWidth="2" />
          {/* Arms */}
          <line x1="65" y1="115" x2="55" y2="125" stroke="#000" strokeWidth="3" />
          <line x1="135" y1="115" x2="145" y2="125" stroke="#000" strokeWidth="3" />
          {/* Shoes */}
          <ellipse cx="83" cy="210" rx="16" ry="10" fill={char.shoesColor} stroke="#000" strokeWidth="2" />
          <ellipse cx="118" cy="210" rx="16" ry="10" fill={char.shoesColor} stroke="#000" strokeWidth="2" />
          {/* Effect aura */}
          <circle cx="100" cy="130" r="90" fill="none" stroke={char.effectColor} strokeWidth="1.5" opacity="0.15" strokeDasharray="8 4" />
        </svg>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <div style={{ color: '#87ceeb', fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 2 }}>
            VEL: {char.speed.toUpperCase()} | TAM: {char.size.toUpperCase()}
          </div>
          <div style={{ color: char.effectColor, fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 2, marginTop: 5 }}>
            ESP: {char.specialAbility.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreator;
