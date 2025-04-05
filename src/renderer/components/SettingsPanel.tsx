import React, { useState } from 'react';
import { Game, RemoteConfig } from '../../types';
import gearIcon from '../assets/icons/gear-icon.png';
import { saveLogsToFile, isDebugMode } from '../utils/debug';
import { showWarn } from '../utils/showWarn';
import { showError } from '../utils/showError';
import { checkForUpdates } from '../utils/checkForUpdates';
import { useAppContext } from './AppContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  configRemote: RemoteConfig | null;
  gameInfo: Game | null;
}

/**
 * Settings panel component
 */
const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  configRemote,
  gameInfo
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isChecking, setIsChecking] = useState(false);
  
  // Get required context values
  const { 
    configLocal, 
    setGameInfo, 
    setConfigRemote, 
    isUpdating, 
    setIsUpdating 
  } = useAppContext();
  
  // Export logs handler
  const handleExportLogs = async () => {
    const success = await saveLogsToFile();
    if (success) {
      showWarn("Debug logs have been saved to launcher-debug.log");
    } else {
      showError("Failed to save debug logs");
    }
  };
  
  // Open game directory
  const handleOpenGameDirectory = () => {
    if (!gameInfo) return;
    
    const currentDir = window.electronAPI.sendSync("get-file-path", "");
    if (currentDir) {
      window.electronAPI.spawnProcess({ 
        command: `explorer "${currentDir}\\${gameInfo.name}"`, 
        options: {} 
      });
    }
  };
  
  // Get current app directory
  const handleOpenAppDirectory = () => {
    const currentDir = window.electronAPI.sendSync("get-file-path", "");
    if (currentDir) {
      window.electronAPI.spawnProcess({ 
        command: `explorer "${currentDir}"`, 
        options: {} 
      });
    }
  };
  
  // Handler for checking for updates manually
  const handleCheckForUpdates = async () => {
    if (!configLocal) {
      showError("Local configuration not available");
      return;
    }
    
    if (isChecking || isUpdating) {
      showWarn("Update process already in progress");
      return;
    }
    
    setIsChecking(true);
    
    try {
      const updateResult = await checkForUpdates(
        configLocal,
        setIsUpdating,
        setGameInfo,
        setConfigRemote
      );
      
      if (!updateResult) {
        // No updates found or needed
        showWarn("Your game client is up to date!");
      }
    } catch (error) {
      showError(`Error during update check: ${(error as Error).message}`);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      {/* Settings button */}
      <div className="settings-icon" onClick={onClose}>
        <img src={gearIcon} alt="Settings" className="gear-image" />
      </div>
      
      {/* Settings panel */}
      {isOpen && (
        <div className="settings-panel">
          <div className="settings-header">
            <h2>Settings</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          
          {/* Tab navigation */}
          <div className="settings-tabs">
            <button 
              className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button 
              className={`settings-tab ${activeTab === 'game' ? 'active' : ''}`}
              onClick={() => setActiveTab('game')}
            >
              Game
            </button>
            <button 
              className={`settings-tab ${activeTab === 'advanced' ? 'active' : ''}`}
              onClick={() => setActiveTab('advanced')}
            >
              Advanced
            </button>
          </div>
          
          <div className="settings-content">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="settings-tab-content">
                <div className="settings-section">
                  <h3>Launcher</h3>
                  <button 
                    className={`settings-button ${isChecking || isUpdating ? 'is-loading' : ''}`}
                    onClick={handleCheckForUpdates}
                    disabled={isChecking || isUpdating}
                  >
                    {isChecking ? 'Checking...' : 'Check for Updates'}
                  </button>
                  <div className="toggle-option">
                    <span>Close Launcher on Game Start</span>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked={true} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="toggle-option">
                    <span>Auto-start Game After Update</span>
                    <label className="toggle-switch">
                      <input type="checkbox" />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                
                <div className="version-info">
                  <p>Launcher Version: <span>{configLocal?.launcherVer || configRemote?.launcherVer || "Unknown"}</span></p>
                  <p>Client Version: <span>{gameInfo?.clientVer || "Unknown"}</span></p>
                </div>
              </div>
            )}
            
            {/* Game Tab */}
            {activeTab === 'game' && (
              <div className="settings-tab-content">
                <div className="settings-section">
                  <h3>Game Settings</h3>
                  <button 
                    className="settings-button" 
                    onClick={handleOpenGameDirectory}
                    disabled={!gameInfo}
                  >
                    Open Game Directory
                  </button>
                </div>
                
                <div className="settings-section">
                  <h3>Launch Options</h3>
                  <div className="form-group">
                    <label>Command Line Arguments:</label>
                    <input 
                      type="text" 
                      className="settings-input" 
                      placeholder="e.g. -windowed -console" 
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="settings-tab-content">
                <div className="settings-section">
                  <h3>Advanced Options</h3>
                  <button className="settings-button" onClick={handleOpenAppDirectory}>
                    Open Launcher Directory
                  </button>
                  <button 
                    className="settings-button" 
                    onClick={handleExportLogs}
                    disabled={!isDebugMode()}
                  >
                    Export Debug Logs
                  </button>
                  <div className="form-group">
                    <label>Config URL:</label>
                    <input 
                      type="text" 
                      className="settings-input" 
                      placeholder="https://example.com/config.json" 
                      value={configLocal?.updaterUrl || ""}
                      disabled 
                    />
                  </div>
                </div>
                
                <div className="settings-section">
                  <h3>Troubleshooting</h3>
                  <div className="note-box">
                    <p>Press <kbd>Ctrl</kbd>+<kbd>D</kbd> to enable debug mode</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsPanel;