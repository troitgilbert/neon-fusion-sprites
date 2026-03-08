import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { GameEngine } from './engine';
import type { GameState, GameMode, Achievement } from './types';

interface GameContextType {
  engine: GameEngine;
  gameState: GameState;
  coins: number;
  announcerText: string;
  achievementPopup: Achievement | null;
  cheatNotification: string | null;
  setGameState: (s: GameState, mode?: GameMode) => void;
}

// Use a module-level variable to survive HMR
const GameCtx = createContext<GameContextType | null>(null);
(GameCtx as any).displayName = 'GameContext';

export const useGame = () => {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};

const CHEAT_CODE = 'DINERO';

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const engineRef = useRef<GameEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }
  const [gameState, setGameStateLocal] = useState<GameState>('MENU');
  const [coins, setCoins] = useState(100);
  const [announcerText, setAnnouncerText] = useState('');
  const [achievementPopup, setAchievementPopup] = useState<Achievement | null>(null);
  const [cheatNotification, setCheatNotification] = useState<string | null>(null);
  const cheatBufferRef = useRef('');

  useEffect(() => {
    const engine = engineRef.current!;
    engine.onStateChange = (s) => setGameStateLocal(s);
    engine.onCoinsChange = (c) => setCoins(c);
    engine.onAnnouncerText = (t) => setAnnouncerText(t);
    engine.onAchievement = (a) => {
      setAchievementPopup(a);
      setTimeout(() => setAchievementPopup(null), 4000);
    };
    setCoins(engine.coins);

    // Cheat code listener
    const handleCheatKey = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key.length === 1 && /[A-Z]/.test(key)) {
        cheatBufferRef.current += key;
        // Keep only last N chars
        if (cheatBufferRef.current.length > CHEAT_CODE.length) {
          cheatBufferRef.current = cheatBufferRef.current.slice(-CHEAT_CODE.length);
        }
        if (cheatBufferRef.current === CHEAT_CODE) {
          cheatBufferRef.current = '';
          engine.coins = 999999999;
          localStorage.setItem('coins', '999999999');
          engine.onCoinsChange?.(999999999);
          setCheatNotification('¡CÓDIGO ACTIVADO!');
          setTimeout(() => setCheatNotification(null), 3000);
        }
      }
    };
    window.addEventListener('keydown', handleCheatKey);

    return () => {
      engine.destroy();
      window.removeEventListener('keydown', handleCheatKey);
    };
  }, []);

  const setGameState = useCallback((s: GameState, mode?: GameMode) => {
    engineRef.current.setState(s, mode);
  }, []);

  return (
    <GameCtx.Provider value={{ engine: engineRef.current, gameState, coins, announcerText, achievementPopup, cheatNotification, setGameState }}>
      {children}
    </GameCtx.Provider>
  );
};
