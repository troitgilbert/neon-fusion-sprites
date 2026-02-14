import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { GameEngine } from './engine';
import type { GameState, GameMode } from './types';

interface GameContextType {
  engine: GameEngine;
  gameState: GameState;
  coins: number;
  announcerText: string;
  setGameState: (s: GameState, mode?: GameMode) => void;
}

const GameCtx = createContext<GameContextType | null>(null);

export const useGame = () => {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const engineRef = useRef(new GameEngine());
  const [gameState, setGameStateLocal] = useState<GameState>('MENU');
  const [coins, setCoins] = useState(100);
  const [announcerText, setAnnouncerText] = useState('');

  useEffect(() => {
    const engine = engineRef.current;
    engine.onStateChange = (s) => setGameStateLocal(s);
    engine.onCoinsChange = (c) => setCoins(c);
    engine.onAnnouncerText = (t) => setAnnouncerText(t);
    setCoins(engine.coins);
    return () => engine.destroy();
  }, []);

  const setGameState = useCallback((s: GameState, mode?: GameMode) => {
    engineRef.current.setState(s, mode);
  }, []);

  return (
    <GameCtx.Provider value={{ engine: engineRef.current, gameState, coins, announcerText, setGameState }}>
      {children}
    </GameCtx.Provider>
  );
};
