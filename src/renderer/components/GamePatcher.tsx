import React, { useState, useEffect } from 'react';
import { Game } from '../../types';
import { useAppContext } from './AppContext';
import gameIcon from '../assets/icons/db-update.png';
import HeroCharacter from './HeroCharacter';
import GameLogo from './GameLogo';

interface GamePatcherProps {
  game: Game;
  isUpdating: boolean;
}

/**
 * Game patcher with a container that acts as the button
 */
const GamePatcher: React.FC<GamePatcherProps> = ({ game, isUpdating }) => {
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadSpeed, setDownloadSpeed] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [statusText, setStatusText] = useState<string>('');
  
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
    
    window.electronAPI.receive('download progress', handleDownloadProgress);
    window.electronAPI.onExtractionProgress(handleExtractionProgress);
    
    return () => {
      window.electronAPI.removeListener('download progress', handleDownloadProgress);
      window.electronAPI.removeExtractionListener(handleExtractionProgress);
    };
  }, []);
  
  // Update status text based on isUpdating and progress
  useEffect(() => {
    if (!isUpdating) {
      setStatusText('');
    }
  }, [isUpdating]);
  
  // Handle container click - main action handler
  const handleButtonClick = () => {
    if (!isUpdating) {
      console.log("Button clicked");
      // Add your action for when the button is clicked
      // e.g., start download or launch game
    }
  };
  
  return (
    <div className="game-container">
      <div
        id={`game-container-${game.name}`}
        className={`game-patcher ${game.name.toLowerCase()} active`}
      >
        {/* Add the game logo above the patcher */}
        <GameLogo game={game} />

         {/* Add the hero character to the right side */}
         <HeroCharacter 
          game={game}
          position="right"
          characterName={game.name === "DBO" ? "Goku" : undefined}
        />
        {/* Container acting as the button with icon and text directly inside */}
        <div 
          className={`btn-container ${game.name} ${isUpdating ? 'updating' : ''} ${isUpdating ? 'disabled' : ''}`}
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
            {isUpdating ?
              `Downloading... ${downloadProgress}%` :
              (downloadProgress === 100 ? 'Play' : 'Download')}
          </div>
        </div>
        
        {/* Status text elements */}
        <span className={`txt-status ${game.name} text`}>{statusText}</span>
        
        {/* Optional info text that could be shown below the button */}
        {isUpdating && downloadSpeed && (
          <span className={`txt-download-info ${game.name} text`}>
            {downloadSpeed}
          </span>
        )}
      </div>
    </div>
  );
};

export default GamePatcher;