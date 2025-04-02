import React, { useEffect } from 'react';
import { enableDebugMode, log } from '../utils/debug';
import { showWarn } from '../utils/showWarn';

/**
 * Component that handles debug mode activation via keyboard shortcuts
 */
const DebugModeHandler: React.FC = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enable debug mode with Ctrl+D
      if (e.ctrlKey && e.key === 'd') {
        enableDebugMode();
        showWarn("Debug mode enabled. Logs will be collected.");
        log("Debug mode activated by user");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // This component doesn't render anything
  return null;
};

export default DebugModeHandler;