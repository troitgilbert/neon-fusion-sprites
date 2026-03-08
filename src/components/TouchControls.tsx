import React from 'react';
import { useGame } from '../game/GameContext';
import { CONTROLS } from '../game/constants';

const TouchControls: React.FC = () => {
  const { engine } = useGame();

  const bind = (key: string) => ({
    onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); engine.keys[key] = true; engine.justPressed[key] = true; },
    onTouchEnd: (e: React.TouchEvent) => { e.preventDefault(); engine.keys[key] = false; },
  });

  const btnStyle: React.CSSProperties = {
    position: 'absolute', width: 48, height: 48,
    background: 'rgba(0,255,255,0.18)', border: '2px solid #00ffff',
    color: 'white', fontWeight: 'bold', textAlign: 'center', lineHeight: '48px',
    userSelect: 'none', boxShadow: '0 0 8px rgba(0,255,255,0.4)', fontSize: 12,
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-[200]">
      {/* D-Pad */}
      <div {...bind(CONTROLS.p1.up)} style={{ ...btnStyle, left: 60, bottom: 120, pointerEvents: 'auto' }}>↑</div>
      <div {...bind(CONTROLS.p1.down)} style={{ ...btnStyle, left: 60, bottom: 40, pointerEvents: 'auto' }}>↓</div>
      <div {...bind(CONTROLS.p1.left)} style={{ ...btnStyle, left: 20, bottom: 80, pointerEvents: 'auto' }}>←</div>
      <div {...bind(CONTROLS.p1.right)} style={{ ...btnStyle, left: 100, bottom: 80, pointerEvents: 'auto' }}>→</div>

      {/* Actions */}
      <div {...bind(CONTROLS.p1.hit)} style={{ ...btnStyle, right: 120, bottom: 100, pointerEvents: 'auto' }}>Golpe</div>
      <div {...bind(CONTROLS.p1.spec)} style={{ ...btnStyle, right: 60, bottom: 100, pointerEvents: 'auto' }}>Esp</div>
      <div {...bind(CONTROLS.p1.super)} style={{ ...btnStyle, right: 0, bottom: 100, pointerEvents: 'auto' }}>Super</div>
      <div {...bind(CONTROLS.p1.ultra)} style={{ ...btnStyle, right: 120, bottom: 40, pointerEvents: 'auto' }}>Ultra</div>
      <div {...bind(CONTROLS.p1.dodge)} style={{ ...btnStyle, right: 60, bottom: 40, pointerEvents: 'auto' }}>Esq</div>
      <div {...bind(CONTROLS.p1.block)} style={{ ...btnStyle, right: 0, bottom: 40, pointerEvents: 'auto' }}>Esc</div>
      <div {...bind(CONTROLS.p1.emote)} style={{ ...btnStyle, right: 180, bottom: 70, pointerEvents: 'auto', background: 'rgba(255,200,0,0.18)', border: '2px solid #ffcc00' }}>😤</div>

      {/* Pause */}
      <div
        onTouchStart={(e) => { e.preventDefault(); engine.togglePause(); }}
        style={{ ...btnStyle, top: 10, right: 10, pointerEvents: 'auto' }}
      >⏸</div>
    </div>
  );
};

export default TouchControls;
