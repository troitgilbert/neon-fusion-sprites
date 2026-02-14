import React, { useMemo } from 'react';
import { GameProvider, useGame } from '../game/GameContext';
import NebulaBackground from '../components/NebulaBackground';
import MainMenu from '../components/MainMenu';
import GameCanvas from '../components/GameCanvas';
import FightHUD from '../components/FightHUD';
import CharacterSelect from '../components/CharacterSelect';
import StageSelect from '../components/StageSelect';
import PauseMenu from '../components/PauseMenu';
import VersusTypeMenu from '../components/VersusTypeMenu';
import ShopMenu from '../components/ShopMenu';
import ConfigMenu from '../components/ConfigMenu';
import TouchControls from '../components/TouchControls';

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 800;

const GameApp: React.FC = () => {
  const { gameState, coins } = useGame();
  const inFight = gameState === 'FIGHT' || gameState === 'PAUSED' || gameState === 'ROUND_OVER';
  const showMenu = gameState === 'MENU';

  return (
    <div className="w-screen h-screen overflow-hidden" style={{ background: '#000' }}>
      {/* Nebula background (always visible behind menu) */}
      {showMenu && <NebulaBackground />}

      {/* Crystal counter */}
      <div
        style={{
          position: 'fixed', top: 20, right: 20, fontSize: 20, color: '#00ffff',
          fontWeight: 'bold', textShadow: '0 0 10px #00ffff', zIndex: 100,
          background: 'rgba(0,0,0,0.6)', padding: '5px 15px', borderRadius: 20,
          border: '1px solid #87ceeb', fontFamily: "'Orbitron', monospace",
        }}
      >
        🔷 {coins}
      </div>

      {/* Menu state */}
      {showMenu && <MainMenu />}

      {/* Fight state */}
      {(inFight || gameState === 'SELECT' || gameState === 'SKIN_SELECT' || gameState === 'STAGE_SELECT' || gameState === 'VERSUS_TYPE' || gameState === 'SHOP' || gameState === 'CONFIG') && (
        <div className="flex items-center justify-center w-full h-full">
          <div className="relative" style={{
            transform: isMobile ? 'scale(0.75)' : 'none',
            transformOrigin: 'top center',
          }}>
            <GameCanvas />
            {inFight && <FightHUD />}
            {inFight && isMobile && <TouchControls />}
          </div>
        </div>
      )}

      {/* Overlay menus */}
      {gameState === 'SELECT' && <CharacterSelect />}
      {gameState === 'SKIN_SELECT' && <CharacterSelect />}
      {gameState === 'STAGE_SELECT' && <StageSelect />}
      {gameState === 'PAUSED' && <PauseMenu />}
      {gameState === 'VERSUS_TYPE' && <VersusTypeMenu />}
      {gameState === 'SHOP' && <ShopMenu />}
      {gameState === 'CONFIG' && <ConfigMenu />}
    </div>
  );
};

const Index: React.FC = () => (
  <GameProvider>
    <GameApp />
  </GameProvider>
);

export default Index;
