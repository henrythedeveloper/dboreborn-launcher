import React, { useState, useEffect } from 'react';

/**
 * Component that adds a "back to top" button that appears when
 * the user scrolls down the page.
 */
const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Check scroll position and show/hide button accordingly
  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when scrolled down 300px
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    
    window.addEventListener('scroll', toggleVisibility);
    
    // Clean up event listener
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);
  
  // Function to scroll back to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  return (
    <div 
      className={`back-to-top ${isVisible ? 'visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      title="Back to top"
    >
      ↑
    </div>
  );
};

export default BackToTop;