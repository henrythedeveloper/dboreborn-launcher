import React from 'react';
import { Game } from '../../types';
import logo  from '../assets/logo.svg';

interface GameLogoProps {
  game: Game;
  // Optional callback for logo click
  onLogoClick?: () => void;
}

/**
 * Game Logo
 */
const GameLogo: React.FC<GameLogoProps> = ({ game, onLogoClick }) => {
  return (
    <div 
      className="game-logo-container"
      onClick={onLogoClick}
      title={`${game.name} Logo`}
    >
      <img 
        src={logo} 
        alt={`${game.name} Logo`} 
        className="game-logo-image"
      />
    </div>
  );
};

export default GameLogo;