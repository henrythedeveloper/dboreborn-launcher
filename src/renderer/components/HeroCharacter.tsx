import React, { useState, useEffect } from 'react';
import { Game } from '../../types';
import hero from '../assets/hero.svg';

interface HeroCharacterProps {
  game: Game;
  // Optional character name if you want to display a specific character
  characterName?: string;
  // Optional position override (right, left, center)
  position?: 'right' | 'left' | 'center';
  // Optional callback for when character is clicked
  onCharacterClick?: () => void;
}

/**
 * HeroCharacter component displays a character image from the game
 * It can be positioned on different sides of the screen and includes
 * animation effects for a dynamic appearance
 */
const HeroCharacter: React.FC<HeroCharacterProps> = ({ 
  game, 
  position = 'right',
  onCharacterClick
}) => {
  // State to track if character has loaded
  const [isLoaded, setIsLoaded] = useState(false);
  // State to track if character is hovered
  const [isHovered, setIsHovered] = useState(false);
  
  // Handle image load completion
  const handleImageLoad = () => {
    setIsLoaded(true);
  };
  
  // Create class string based on position and state
  const characterClasses = [
    'hero-character',
    `hero-character--${position}`,
    isLoaded ? 'hero-character--loaded' : '',
    isHovered ? 'hero-character--hovered' : ''
  ].filter(Boolean).join(' ');
  
  return (
    <div 
      className={characterClasses}
      onClick={onCharacterClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="hero-character__image-container">
        <img
          src={hero}
          className="hero-character__image"
          onLoad={handleImageLoad}
        />
        
        {/* Optional glow effect */}
        <div className="hero-character__glow"></div>
        
      </div>
    </div>
  );
};

export default HeroCharacter;