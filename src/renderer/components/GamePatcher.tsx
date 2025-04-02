import React, {useState, useEffect} from 'react';
import { Game } from '../../types';
import { useAppContext } from './AppContext';

interface GamePatcherProps {
  game: Game;
  isUpdating: boolean;
}

/**
 * Game patcher with integrated button progress instead of progress bar
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
      
      // Could add time remaining calculation here if needed
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

  return (
    <div className="game-container">
      <div
        id={`game-container-${game.name}`}
        className={`game-patcher ${game.name.toLowerCase()} active`}
      >
        {/* Action button with integrated progress */}
        <button 
          className={`btn-start ${game.name} ${isUpdating ? 'updating' : ''}`}
          disabled={isUpdating}
        >
          {isUpdating ? 
            `Downloading... ${downloadProgress}%` : 
            (downloadProgress === 100 ? 'Play' : 'Download')}
        </button>
        
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