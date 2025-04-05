import React, { useState, useEffect, useCallback } from 'react';
import { Game } from '../../types';
import { useAppContext } from './AppContext';
import gameIcon from '../assets/icons/db-update.png';
import backgroundImage from '../assets/bg-dbo.svg';
import HeroCharacter from './HeroCharacter';
import GameLogo from './GameLogo';
import { addLauncherEventListener } from '../utils/launcherEvents';
import { log } from '../utils/debug';

interface GamePatcherProps {
  game: Game;
  isUpdating: boolean;
}

/**
 * Game patcher component for a single-game launcher
 */
const GamePatcher: React.FC<GamePatcherProps> = ({ game, isUpdating }) => {
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadSpeed, setDownloadSpeed] = useState<string>('');
  const [statusText, setStatusText] = useState<string>('');
  const [isReady, setIsReady] = useState<boolean>(false);
  const { setIsUpdating } = useAppContext();
  
  // Create callback handlers once to avoid recreating on each render
  const handleStatusUpdate = useCallback((detail: { status: string }) => {
    if (detail.status) {
      setStatusText(detail.status);
      log(`Status updated: ${detail.status}`);
    }
  }, []);
  
  const handleGameReady = useCallback((detail: { status: string }) => {
    setIsReady(true);
    setStatusText(detail.status);
    log('Game is ready to play');
  }, []);
  
  // Listen for download progress updates
  useEffect(() => {
    const handleDownloadProgress = (status: any) => {
      const progress = Math.floor(status.percent * 100);
      setDownloadProgress(progress);
      
      // Calculate download speed
      const transferredMB = (status.transferredBytes / (1024 * 1024)).toFixed(2);
      const totalMB = (status.totalBytes / (1024 * 1024)).toFixed(2);
      setDownloadSpeed(`${transferredMB}MB/${totalMB}MB`);
    };
    
    const handleExtractionProgress = (progress: any) => {
      setDownloadProgress(Math.floor(progress.percent));
    };
    
    // Set up event listeners using our utility
    window.electronAPI.receive('download progress', handleDownloadProgress);
    window.electronAPI.onExtractionProgress(handleExtractionProgress);
    
    // Use the new utility functions for custom events
    const removeStatusListener = addLauncherEventListener('launcher-status-update', handleStatusUpdate);
    const removeReadyListener = addLauncherEventListener('launcher-game-ready', handleGameReady);
    
    // Clean up function
    return () => {
      window.electronAPI.removeListener('download progress', handleDownloadProgress);
      window.electronAPI.removeExtractionListener(handleExtractionProgress);
      
      // Call the cleanup functions returned by addLauncherEventListener
      removeStatusListener();
      removeReadyListener();
    };
  }, [handleStatusUpdate, handleGameReady]);
  
  // Handle button click - main action handler
  const handleButtonClick = () => {
    if (isReady && !isUpdating) {
      // Launch the game
      const currentDir = window.electronAPI.sendSync("get-file-path", "");
      window.electronAPI.spawnProcess({
        command: game.startCmd,
        options: { cwd: `${currentDir}\\${game.name}\\` }
      }).then(() => {
        window.electronAPI.sendMessage("close-app");
      }).catch((error) => {
        console.error("Failed to start game:", error);
      });
    } else if (!isUpdating) {
      // Set updating flag to trigger gamesPatch
      setIsUpdating(true);
    }
  };
  
  // Determine button text based on state
  const getButtonText = () => {
    if (isUpdating) {
      return `Downloading... ${downloadProgress}%`;
    } else if (isReady) {
      return 'Play';
    } else {
      return 'Download';
    }
  };
  
  return (
    <div 
    className="game-container"
    style={{ 
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}
    
    >
      <div
        id="game-container"
        className="game-patcher active"
      >
        {/* Add the game logo above the patcher */}
        <GameLogo game={game} />

        {/* Add the hero character to the right side */}
        <HeroCharacter 
          game={game}
          position="right"
        />
        
        {/* Container acting as the button with icon and text directly inside */}
        <div 
          className={`btn-container ${isUpdating ? 'updating' : ''} ${isUpdating ? 'disabled' : ''}`}
          onClick={handleButtonClick}
          role="button"
          tabIndex={0}
          aria-disabled={isUpdating}
        >
          {/* Icon without its own background */}
          <div className={`update-icon ${isUpdating ? 'updating' : ''}`}>
            <img 
              src={gameIcon} 
              alt="Update" 
              onError={() => console.log("Image failed to load")}
            />
          </div>
          
          {/* Text content */}
          <div className="btn-text">
            {getButtonText()}
          </div>
        </div>
        
        {/* Status text elements */}
        <span className="txt-status text">{statusText}</span>
        
        {/* Optional info text that could be shown below the button */}
        {isUpdating && downloadSpeed && (
          <span className="txt-download-info text">
            {downloadSpeed}
          </span>
        )}
      </div>
    </div>
  );
};

export default GamePatcher;