// @refresh reset
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
import AdventureCharSelect from '../components/AdventureCharSelect';
import MissionsMenu from '../components/MissionsMenu';
import EventsMenu from '../components/EventsMenu';
import BossRushMenu from '../components/BossRushMenu';
import BossSelectMenu from '../components/BossSelectMenu';
import MindGamesMenu from '../components/MindGamesMenu';
import DatingMenu from '../components/DatingMenu';
import DocumentsMenu from '../components/DocumentsMenu';
import MinigamesMenu from '../components/MinigamesMenu';
import DifficultySelect from '../components/DifficultySelect';
import AdventurePlay from '../components/AdventurePlay';
import OnlineMenu from '../components/OnlineMenu';
import { getDifficultyColor } from '../game/achievements';
import crystalIcon from '../assets/crystal-icon.png';

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 800;

const GameApp: React.FC = () => {
  const { gameState, coins, achievementPopup, cheatNotification, engine, setGameState } = useGame();
  const inFight = gameState === 'FIGHT' || gameState === 'PAUSED' || gameState === 'ROUND_OVER';
  const showMenu = gameState === 'MENU';
  const showNebula = showMenu || gameState === 'SELECT' || gameState === 'SKIN_SELECT' || gameState === 'STAGE_SELECT' || gameState === 'VERSUS_TYPE' || gameState === 'SHOP' || gameState === 'CONFIG' || gameState === 'CREATOR' || gameState === 'ACHIEVEMENTS' || gameState === 'STORY_SELECT' || gameState === 'ARCADE_TOWER' || gameState === 'ADVENTURE_SELECT' || gameState === 'ADVENTURE_CHAR_SELECT' || gameState === 'MISSIONS' || gameState === 'EVENTS' || gameState === 'BOSS_RUSH' || gameState === 'BOSS_SELECT' || gameState === 'MIND_GAMES' || gameState === 'DATING' || gameState === 'DOCUMENTS' || gameState === 'MINIGAMES' || gameState === 'DIFFICULTY_SELECT' || gameState === 'ONLINE';

  return (
    <div className="w-screen h-screen overflow-hidden" style={{ background: '#000' }}>
      {showNebula && <NebulaBackground />}

      {/* Crystal counter */}
      {!inFight && gameState !== 'CREATOR' && gameState !== 'ACHIEVEMENTS' && gameState !== 'ADVENTURE_PLAY' && gameState !== 'SELECT' && gameState !== 'ARCADE_TOWER' && (
        <div style={{
          position: 'fixed', top: 14, right: 18, zIndex: 100,
          display: 'flex', alignItems: 'center', gap: 0,
          fontFamily: "'Orbitron', monospace",
        }}>
          {/* Crystal icon container */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,60,120,0.9), rgba(0,30,80,0.95))',
            border: '1.5px solid rgba(0,180,255,0.5)',
            borderRight: 'none',
            borderRadius: '6px 0 0 6px',
            padding: '6px 8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0,150,255,0.3), inset 0 0 10px rgba(0,100,200,0.2)',
          }}>
            <img src={crystalIcon} alt="crystal" style={{
              height: 'clamp(22px, 2.2vw, 34px)',
              filter: 'drop-shadow(0 0 8px #00bfff) drop-shadow(0 0 3px #0066ff)',
              animation: 'crystalPulse 2s ease-in-out infinite',
            }} />
          </div>
          {/* Value container */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,20,50,0.92), rgba(0,10,30,0.96))',
            border: '1.5px solid rgba(0,180,255,0.4)',
            borderLeft: '1px solid rgba(0,120,200,0.3)',
            borderRadius: '0 6px 6px 0',
            padding: '6px 14px 6px 10px',
            display: 'flex', alignItems: 'center',
            boxShadow: '0 0 15px rgba(0,150,255,0.2), inset 0 0 15px rgba(0,50,100,0.15)',
          }}>
            <span style={{
              color: '#7fefff',
              fontSize: 'clamp(13px, 1.3vw, 19px)',
              fontWeight: 900,
              letterSpacing: 2,
              textShadow: '0 0 10px rgba(0,200,255,0.6), 0 0 20px rgba(0,150,255,0.3)',
              background: 'linear-gradient(180deg, #b0f0ff 0%, #00d4ff 50%, #0088cc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {coins.toLocaleString()}
            </span>
          </div>
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
      {gameState === 'ADVENTURE_CHAR_SELECT' && <AdventureCharSelect />}
      {gameState === 'MISSIONS' && <MissionsMenu />}
      {gameState === 'EVENTS' && <EventsMenu />}
      {gameState === 'BOSS_RUSH' && <BossRushMenu />}
      {gameState === 'BOSS_SELECT' && <BossSelectMenu />}
      {gameState === 'MIND_GAMES' && <MindGamesMenu />}
      {gameState === 'DATING' && <DatingMenu />}
      {gameState === 'DOCUMENTS' && <DocumentsMenu />}
      {gameState === 'MINIGAMES' && <MinigamesMenu />}
      {gameState === 'DIFFICULTY_SELECT' && (
        <DifficultySelect 
          onSelect={(d) => { engine.selectedDifficulty = d as any; setGameState('SELECT', 'vs_cpu'); }} 
          onBack={() => setGameState('MENU')} 
        />
      )}
      {gameState === 'ADVENTURE_PLAY' && <AdventurePlay />}
      {gameState === 'ONLINE' && <OnlineMenu />}

      {/* Cheat code notification */}
      {cheatNotification && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 300, padding: '20px 50px',
          background: 'rgba(0,0,0,0.95)', border: '3px solid #ffcc33',
          boxShadow: '0 0 60px rgba(255,204,51,0.5), inset 0 0 30px rgba(255,204,51,0.1)',
          animation: 'slideInRight 0.3s ease-out',
        }}>
          <div style={{
            color: '#ffcc33', fontFamily: "'Orbitron', monospace", fontSize: 24,
            letterSpacing: 5, fontWeight: 900, textShadow: '0 0 20px #ff6600',
          }}>
            {cheatNotification}
          </div>
          <div style={{ color: '#00ff66', fontFamily: "'Orbitron', monospace", fontSize: 14, marginTop: 8, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <img src={crystalIcon} alt="crystal" style={{ height: 18, filter: 'drop-shadow(0 0 4px #00bfff)' }} /> 999,999,999 CRISTALES
          </div>
        </div>
      )}

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
          <div style={{ color: '#00ff66', fontFamily: "'Orbitron', monospace", fontSize: 12, marginTop: 6, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 }}>
            <img src={crystalIcon} alt="crystal" style={{ height: 16, filter: 'drop-shadow(0 0 4px #00bfff)' }} /> +{achievementPopup.reward} CRISTALES
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes crystalPulse {
          0%, 100% { filter: drop-shadow(0 0 8px #00bfff) drop-shadow(0 0 3px #0066ff); transform: scale(1); }
          50% { filter: drop-shadow(0 0 14px #00dfff) drop-shadow(0 0 6px #0088ff); transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <GameProvider>
      <GameApp />
    </GameProvider>
  );
};

export default Index;
