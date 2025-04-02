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
  const [isHovered, setIsHovered] = useState(false);
  
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
  
  // Auto-rotate news items every 10 seconds, but only if not hovered
  useEffect(() => {
    if (news.length <= 1 || isHovered) return;
    
    const interval = setInterval(() => {
      goToNext();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [currentIndex, news.length, isHovered]);

  // Handle news item click
  const handleNewsClick = (newsItem: NewsItem) => {
    log("News item clicked:", newsItem.title);
    // You could add functionality here to open a news detail view
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
  
  const currentNews = news[currentIndex];
  
  return (
    <div 
      className="news-slider"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        
        <div 
          className={`news-item ${isHovered ? 'hovered' : ''}`} 
          onClick={() => handleNewsClick(currentNews)}
        >
          <div className="news-item-image">
            <img src={currentNews.imageUrl} alt={currentNews.title} />
            <div className="news-item-overlay">
              <span className="news-item-type">{currentNews.type === 'patch' ? 'PATCH' : 'NEWS'}</span>
              <h4 className="news-item-title">{currentNews.title}</h4>
              <span className="news-item-date">{currentNews.date}</span>
            </div>
          </div>
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