import React from 'react';
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
import CharacterCreator from '../components/CharacterCreator';
import AchievementsMenu from '../components/AchievementsMenu';
import StorySelect from '../components/StorySelect';
import ArcadeTower from '../components/ArcadeTower';
import AdventureSelect from '../components/AdventureSelect';
import { getDifficultyColor } from '../game/achievements';

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 800;

const GameApp: React.FC = () => {
  const { gameState, coins, achievementPopup } = useGame();
  const inFight = gameState === 'FIGHT' || gameState === 'PAUSED' || gameState === 'ROUND_OVER';
  const showMenu = gameState === 'MENU';
  const showNebula = showMenu || gameState === 'SELECT' || gameState === 'SKIN_SELECT' || gameState === 'STAGE_SELECT' || gameState === 'VERSUS_TYPE' || gameState === 'SHOP' || gameState === 'CONFIG' || gameState === 'CREATOR' || gameState === 'ACHIEVEMENTS' || gameState === 'STORY_SELECT' || gameState === 'ARCADE_TOWER' || gameState === 'ADVENTURE_SELECT';

  return (
    <div className="w-screen h-screen overflow-hidden" style={{ background: '#000' }}>
      {showNebula && <NebulaBackground />}

      {/* Crystal counter */}
      {!inFight && gameState !== 'CREATOR' && gameState !== 'ACHIEVEMENTS' && (
        <div style={{
          position: 'fixed', top: 20, right: 20, fontSize: 20, color: '#00ffff',
          fontWeight: 'bold', textShadow: '0 0 10px #00ffff', zIndex: 100,
          background: 'rgba(0,0,0,0.6)', padding: '5px 15px', borderRadius: 20,
          border: '1px solid #87ceeb', fontFamily: "'Orbitron', monospace",
        }}>
          🔷 {coins}
        </div>
      )}

      {showMenu && <MainMenu />}

      {inFight && (
        <>
          <GameCanvas />
          <FightHUD />
          {isMobile && <TouchControls />}
        </>
      )}

      {(gameState === 'SELECT' || gameState === 'SKIN_SELECT' || gameState === 'STAGE_SELECT' || gameState === 'VERSUS_TYPE' || gameState === 'SHOP' || gameState === 'CONFIG') && <GameCanvas />}

      {gameState === 'SELECT' && <CharacterSelect />}
      {gameState === 'SKIN_SELECT' && <CharacterSelect />}
      {gameState === 'STAGE_SELECT' && <StageSelect />}
      {gameState === 'PAUSED' && <PauseMenu />}
      {gameState === 'VERSUS_TYPE' && <VersusTypeMenu />}
      {gameState === 'SHOP' && <ShopMenu />}
      {gameState === 'CONFIG' && <ConfigMenu />}
      {gameState === 'CREATOR' && <CharacterCreator />}
      {gameState === 'ACHIEVEMENTS' && <AchievementsMenu />}
      {gameState === 'STORY_SELECT' && <StorySelect />}
      {gameState === 'ARCADE_TOWER' && <ArcadeTower />}
      {gameState === 'ADVENTURE_SELECT' && <AdventureSelect />}

      {/* Achievement popup */}
      {achievementPopup && (
        <div style={{
          position: 'fixed', bottom: 30, right: 30, zIndex: 200,
          background: 'rgba(10,10,30,0.95)', border: `2px solid ${getDifficultyColor(achievementPopup.difficulty)}`,
          padding: '14px 22px', minWidth: 280,
          boxShadow: `0 0 40px ${getDifficultyColor(achievementPopup.difficulty)}50, inset 0 0 20px ${getDifficultyColor(achievementPopup.difficulty)}10`,
          animation: 'slideInRight 0.5s ease-out',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ color: getDifficultyColor(achievementPopup.difficulty), fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 3, marginBottom: 4 }}>
            ¡LOGRO DESBLOQUEADO!
          </div>
          <div style={{ color: '#eafcff', fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 2, fontWeight: 900 }}>
            {achievementPopup.name}
          </div>
          <div style={{ color: '#87ceeb', fontSize: 11, marginTop: 3 }}>
            {achievementPopup.description}
          </div>
          <div style={{ color: '#00ff66', fontFamily: "'Orbitron', monospace", fontSize: 12, marginTop: 6, fontWeight: 'bold' }}>
            🔷 +{achievementPopup.reward} CRISTALES
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const Index: React.FC = () => (
  <GameProvider>
    <GameApp />
  </GameProvider>
);

export default Index;
