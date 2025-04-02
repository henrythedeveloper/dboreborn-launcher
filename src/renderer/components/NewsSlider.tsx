import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { Game } from '../../types';
import leftArrowIcon from '../assets/icons/left-arrow.png';
import rightArrowIcon from '../assets/icons/right-arrow.png';
import { log } from '../utils/debug';

// Type for news/patch notes
interface NewsItem {
  id: number;
  title: string;
  date: string; 
  content: string;
  gameId: string;
  type: 'news' | 'patch';
  imageUrl: string; // Image URL for the card
}

interface NewsSliderProps {
  game: Game | null;
}

const NewsSlider: React.FC<NewsSliderProps> = ({ game }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track whether auto-rotation should be paused
  const [isPaused, setIsPaused] = useState(false);
  // Track the ID of the hovered item
  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null);
  
  // Fetch news from a remote source or fallback to local examples
  useEffect(() => {
    const fetchNews = async () => {
      if (!game) {
        setIsLoading(false);
        return;
      }
      
      try {
        // In a real implementation, you would fetch from your API
        // const response = await fetch(`http://your-api.com/news?gameId=${game.name}`);
        // const data = await response.json();
        // setNews(data);
        
        // For testing purposes, use fallback news items
        const fallbackNews = getFallbackNews(game.name);
        setNews(fallbackNews);
        setIsLoading(false);
        log("News loaded for game", game.name);
      } catch (err) {
        setError("Failed to load news");
        setIsLoading(false);
        log("Error loading news", err);
      }
    };
    
    fetchNews();
  }, [game]);
  
  // Navigate to previous news item
  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? news.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };
  
  // Navigate to next news item
  const goToNext = () => {
    const newIndex = currentIndex === news.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };
  
  // Auto-rotate news items every 10 seconds, but only if not paused
  useEffect(() => {
    if (news.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      goToNext();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [currentIndex, news.length, isPaused]);

  // Handle news item click
  const handleNewsClick = (newsItem: NewsItem) => {
    log("News item clicked:", newsItem.title);
    // You could add functionality here to open a news detail view
  };
  
  // Mouse enter/leave handlers for individual news items
  const handleItemMouseEnter = (id: number) => {
    setHoveredItemId(id);
  };
  
  const handleItemMouseLeave = () => {
    setHoveredItemId(null);
  };
  
  // Mouse enter/leave handlers for the entire slider
  const handleSliderMouseEnter = () => {
    setIsPaused(true);
  };
  
  const handleSliderMouseLeave = () => {
    setIsPaused(false);
    setHoveredItemId(null);
  };
  
  // If there's no game, loading, or no news, show appropriate message
  if (!game || isLoading) {
    return (
      <div className="news-slider loading">
        <div className="news-loading-indicator">
          <span>Loading updates...</span>
        </div>
      </div>
    );
  }
  
  if (error || news.length === 0) {
    return (
      <div className="news-slider empty">
        <div className="news-empty-state">
          <span>No news available</span>
        </div>
      </div>
    );
  }
  
  const itemsToShow = [
    news[currentIndex],
    news[(currentIndex + 1) % news.length],
    news[(currentIndex + 2) % news.length]
  ];
  
  return (
    <div 
      className="news-slider"
      onMouseEnter={handleSliderMouseEnter}
      onMouseLeave={handleSliderMouseLeave}
    >
      <div className="news-header">
        <h3>Latest Updates</h3>
        <div className="news-pagination">
          <span>{currentIndex + 1} / {news.length}</span>
        </div>
      </div>
      
      <div className="news-content">
        <div className="news-navigation prev" onClick={goToPrevious}>
          <img src={leftArrowIcon} alt="Previous" />
        </div>
        
        <div className="news-items-container">
          {itemsToShow.map((item) => (
            <div
              key={item.id}
              className={`news-item ${hoveredItemId === item.id ? 'hovered' : ''}`} 
              onClick={() => handleNewsClick(item)}
              onMouseEnter={() => handleItemMouseEnter(item.id)}
              onMouseLeave={handleItemMouseLeave}
            >
              <div className="news-item-image">
                <img src={item.imageUrl} alt={item.title} />
                <div className="news-item-overlay">
                  <span className="news-item-type">{item.type === 'patch' ? 'PATCH' : 'NEWS'}</span>
                  <h4 className="news-item-title">{item.title}</h4>
                  <span className="news-item-date">{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="news-navigation next" onClick={goToNext}>
          <img src={rightArrowIcon} alt="Next" />
        </div>
      </div>
      
      <div className="news-indicators">
        {news.map((_, index) => (
          <div 
            key={index} 
            className={`news-indicator ${currentIndex === index ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

// Fallback news data for testing
function getFallbackNews(gameId: string): NewsItem[] {
  return [
    {
      id: 1,
      title: "New Server Update v1.2.5",
      date: "2025-03-15",
      content: "We've updated our servers to improve stability and reduce lag during peak hours.",
      gameId,
      type: 'patch',
      imageUrl: '/api/placeholder/400/250' // In a real app, use actual URLs to your images
    },
    {
      id: 2,
      title: "Spring Event Coming Soon!",
      date: "2025-03-10",
      content: "Get ready for our annual Spring Event starting March 20th!",
      gameId,
      type: 'news',
      imageUrl: '/api/placeholder/400/250'
    },
    {
      id: 3,
      title: "Combat System Rebalance",
      date: "2025-02-28",
      content: "We've rebalanced the combat system to ensure all character classes remain viable.",
      gameId,
      type: 'patch',
      imageUrl: '/api/placeholder/400/250'
    },
    {
      id: 4,
      title: "New Expansion Teaser",
      date: "2025-02-15",
      content: "Stay tuned for our upcoming expansion! More details coming soon.",
      gameId,
      type: 'news',
      imageUrl: '/api/placeholder/400/250'
    }
  ];
}

export default NewsSlider;