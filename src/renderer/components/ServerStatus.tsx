import React, { useState, useEffect } from 'react';
import { log } from '../utils/debug';

interface ServerStatusProps {
  serverUrl?: string; // Optional URL to check server status
  pollingInterval?: number; // How often to check status in milliseconds
}

const ServerStatus: React.FC<ServerStatusProps> = ({ 
  serverUrl = 'http://localhost:8002/status', // Default URL, replace with your actual API endpoint
  pollingInterval = 30000 // Check every 30 seconds by default
}) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Function to check server status
  const checkServerStatus = async () => {
    try {
      // In a real implementation, you would ping your server:
      // const response = await fetch(serverUrl, { 
      //   method: 'GET',
      //   headers: { 'Content-Type': 'application/json' },
      //   // Set short timeout to avoid long waits
      //   signal: AbortSignal.timeout(5000) 
      // });
      // setIsOnline(response.ok);
      
      // For demo purposes, let's simulate a response
      // In production, replace this with actual server checks
      const mockOnline = Math.random() > 0.3; // 70% chance server is online
      setIsOnline(mockOnline);
      setLastChecked(new Date());
      log(`Server status checked: ${mockOnline ? 'online' : 'offline'}`);
    } catch (error) {
      setIsOnline(false);
      setLastChecked(new Date());
      log('Error checking server status:', error);
    }
  };

  // Initial check and setup polling
  useEffect(() => {
    // Check status immediately on mount
    checkServerStatus();
    
    // Set up polling interval
    const intervalId = setInterval(checkServerStatus, pollingInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [pollingInterval, serverUrl]);

  // Format the last checked time
  const getLastCheckedText = () => {
    if (!lastChecked) return 'Never checked';
    
    // Format as relative time (e.g., "2 minutes ago")
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastChecked.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  };

  // Determine status label and classes
  let statusLabel = 'Checking...';
  let statusClass = 'checking';
  
  if (isOnline === true) {
    statusLabel = 'Online';
    statusClass = 'online';
  } else if (isOnline === false) {
    statusLabel = 'Offline';
    statusClass = 'offline';
  }

  return (
    <div 
      className={`server-status ${statusClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="status-indicator"></div>
      <span className="status-text">{statusLabel}</span>
      
      {/* Tooltip with additional information */}
      {isHovered && (
        <div className="status-tooltip">
          <p>Server Status: <strong>{statusLabel}</strong></p>
          <p>Last checked: {getLastCheckedText()}</p>
          <p className="tooltip-hint">Click to check now</p>
        </div>
      )}
    </div>
  );
};

export default ServerStatus;