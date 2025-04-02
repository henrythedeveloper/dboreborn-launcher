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
      log(`Server status checked: ${mockOnline ? 'online' : 'offline'}`);
    } catch (error) {
      setIsOnline(false);
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

  // Determine status class
  let statusClass = 'checking';
  
  if (isOnline === true) {
    statusClass = 'online';
  } else if (isOnline === false) {
    statusClass = 'offline';
  }

  // This component will only enhance what's already there visually
  return (
    <div className={`server-status-indicator ${statusClass}`} title={isOnline ? 'Server Online' : 'Server Offline'}>
      <div className="status-dot"></div>
    </div>
  );
};

export default ServerStatus;