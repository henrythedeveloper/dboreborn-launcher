import React, { useState, useEffect } from 'react';
import { log } from '../utils/debug';

interface ServerStatusProps {
  serverUrl?: string;
  pollingInterval?: number;
}

// Sample server data structure
interface ServerData {
  status: 'online' | 'offline' | 'maintenance';
  message?: string;
}

const ServerStatus: React.FC<ServerStatusProps> = ({ 
  serverUrl = 'http://localhost:8002/status',
  pollingInterval = 30000
}) => {
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Function to check server status
  const checkServerStatus = async () => {
    try {
      // In a real implementation, you would fetch from your server:
      // const response = await fetch(serverUrl);
      // const data = await response.json();
      // setServerData(data);
      
      // For demo purposes, let's simulate server data
      // In production, replace this with actual server checks
      const mockStatus = Math.random() > 0.2 
        ? 'online' 
        : (Math.random() > 0.5 ? 'offline' : 'maintenance');
        
      const mockData: ServerData = {
        status: mockStatus as 'online' | 'offline' | 'maintenance',
        message: mockStatus === 'maintenance' 
          ? 'Scheduled maintenance in progress. The server will be back soon!'
          : (mockStatus === 'offline' ? 'The server is currently experiencing technical difficulties.' : undefined)
      };
      
      setServerData(mockData);
      setLastChecked(new Date());
      log(`Server status checked: ${mockStatus}`);
    } catch (error) {
      setServerData({
        status: 'offline',
        message: 'Could not connect to the server status service.'
      });
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
  
  if (serverData) {
    statusLabel = serverData.status === 'online' ? 'Online' : 
                 (serverData.status === 'maintenance' ? 'Maintenance' : 'Offline');
    statusClass = serverData.status;
  }

  return (
    <div 
      className={`server-status ${statusClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={checkServerStatus}
    >
      <div className="status-indicator"></div>
      <span className="status-text">{statusLabel}</span>
      
      {/* Tooltip with additional information */}
      {isHovered && (
        <div className="status-tooltip">
          <p>Server Status: <strong>{statusLabel}</strong></p>
          {serverData?.message && <p>{serverData.message}</p>}
          <p>Last checked: {getLastCheckedText()}</p>
          <p className="tooltip-hint">Click to check now</p>
        </div>
      )}
    </div>
  );
};

export default ServerStatus;