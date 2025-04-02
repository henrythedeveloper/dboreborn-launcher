import React from 'react';
import { Game } from '../../types';
import { useAppContext } from './AppContext';

interface GamePatcherProps {
  game: Game;
  isUpdating: boolean;
}

/**
 * Game patcher component that displays download/update progress and play button
 */
const GamePatcher: React.FC<GamePatcherProps> = ({ game, isUpdating }) => {
  return (
    <div className="game-container">
      <div
        id={`game-container-${game.name}`}
        className={`game-patcher ${game.name.toLowerCase()} active`}
      >
        {/* Progress bar */}
        <div className={`total-progress ${game.name}`}>
          <div className={`total-mid ${game.name}`}>
            <div className={`total-bar ${game.name}`} />
          </div>
        </div>
        
        {/* Status text elements */}
        <span className={`txt-status ${game.name} text`}></span>
        <span className={`txt-progress ${game.name} text`}></span>
        <span className={`txt-download-speed ${game.name} text`}></span>
        <span className={`txt-time-remaining ${game.name} text`}></span>
        
        {/* Play/update buttons */}
        <button className={`btn-start ${game.name}`}>Play</button>
        <button
          className={`btn-start disabled ${game.name}`}
          style={{ display: "none" }}
        ></button>
      </div>
    </div>
  );
};

export default GamePatcher;