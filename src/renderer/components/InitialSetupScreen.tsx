import React, { useState, useEffect, useCallback } from 'react';
import { addLauncherEventListener } from '../utils/launcherEvents';

/**
 * Initial loading screen shown during launcher startup
 */
const InitialSetupScreen: React.FC = () => {
  const [statusText, setStatusText] = useState<string>("Initializing...");

  // Create callback handler once to avoid recreating on each render
  const handleGlobalStatusUpdate = useCallback((detail: { status: string }) => {
    if (detail.status) {
      setStatusText(detail.status);
    }
  }, []);

  // Listen for status updates
  useEffect(() => {
    // Use the utility function to add the event listener
    const removeStatusListener = addLauncherEventListener(
      'launcher-global-status', 
      handleGlobalStatusUpdate
    );
    
    // Return cleanup function
    return () => {
      removeStatusListener();
    };
  }, [handleGlobalStatusUpdate]);

  return (
    <div className="initial-setup">
      <span className="initial-setup-text">{statusText}</span>
    </div>
  );
};

export default InitialSetupScreen;