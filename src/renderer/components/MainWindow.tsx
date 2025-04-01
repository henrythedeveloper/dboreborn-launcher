import React, { useEffect, useState } from "react";
import { Game, LocalConfig, RemoteConfig } from "../../types";
import "../../styles.scss";
import { getConfigFileLocal } from "../utils/getConfigFileLocal";
import { showError } from "../utils/showError";
import { showWarn } from "../utils/showWarn";
import { getConfigFileRemote } from "../utils/getConfigFileRemote";
import { getSevenZipBinPath } from "../utils/getSevenZipBinPath";
import { initialSetup } from "../utils/initialSetup";
import { gamesSetup } from "../utils/gamesSetup";
import { gamesPatch } from "../utils/gamesPatch";
import { updateConfigJson } from "../utils/updateConfigJson";
import { enableDebugMode, log, saveLogsToFile } from "../utils/debug";

const isDevelopment = process.env.NODE_ENV !== "production";

const MainWindow: React.FC = () => {
  const [configLocal, setConfigLocal] = useState<LocalConfig | null>(null);
  const [configRemote, setConfigRemote] = useState<RemoteConfig | null>(null);
  const [gameInfo, setGameInfo] = useState<Game | null>(null);
  const [didFinishInitialSetup, setDidFinishInitialSetup] = useState<boolean>(false);
  const [didFinishGamesSetup, setDidFinishGamesSetup] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Debug Mode
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


  // Load initial configuration
  useEffect(() => {
    const initializeConfig = async () => {
      const sevenZipBinPath = getSevenZipBinPath();
      if (!sevenZipBinPath) {
        showError("Unable to find 7za.exe");
        return;
      }

      try {
        const localConfig = await getConfigFileLocal();
        setConfigLocal(localConfig);
        log("Local config loaded", localConfig);
      } catch (error) {
        showError(`Error loading local config: ${(error as Error).message}`);
        log("Error loading local config", error);
      }
    };

    initializeConfig();
  }, []);

  // Fetch remote configuration once local config is loaded
  useEffect(() => {
    const validateAndFetchConfig = async () => {
      if (!configLocal) return;
      
      try {
        const remoteConfig = await getConfigFileRemote(configLocal.updaterUrl);
        if (!remoteConfig || Object.keys(remoteConfig).length === 0) {
          // Fallback config
          console.warn("Using fallback config because remote config couldn't be loaded");
          const fallbackConfig: RemoteConfig = {
            launcherVer: 1,
            launcherUrl: "http://localhost:8002/launcher.exe",
            games: [
              {
                name: "dbo",
                startCmd: "Client.exe",
                clientVer: 1,
                clientUrl: "http://localhost:8002/client.zip",
                patchUrls: []
              }
            ]
          };
          setConfigRemote(fallbackConfig);
          
          if (fallbackConfig.games.length > 0) {
            const game = fallbackConfig.games[0];
            setGameInfo(game);
          }
          
          setDidFinishInitialSetup(true);
          return;
        }
  
        setConfigRemote(remoteConfig);
        log("Remote config loaded", remoteConfig);

        // Always use the first game since we're only handling one game
        if (remoteConfig?.games?.length > 0) {
          const game = remoteConfig.games[0];
          setGameInfo(game);
        }
  
        const setupSuccessful = await initialSetup(configLocal, remoteConfig);
        if (setupSuccessful) {
          setDidFinishInitialSetup(true);
        }
      } catch (error) {
        // Same fallback if an error occurs
        console.warn("Using fallback config due to error:", error);
        const fallbackConfig: RemoteConfig = {
          launcherVer: 1,
          launcherUrl: "http://localhost:8002/launcher.exe",
          games: [
            {
              name: "dbo",
              startCmd: "Client.exe",
              clientVer: 1,
              clientUrl: "http://localhost:8002/client.zip",
              patchUrls: []
            }
          ]
        };
        setConfigRemote(fallbackConfig);
        
        if (fallbackConfig.games.length > 0) {
          const game = fallbackConfig.games[0];
          setGameInfo(game);
        }
        
        setDidFinishInitialSetup(true);
      }
    };

    if (configLocal) {
      validateAndFetchConfig();
    }
  }, [configLocal]);

  // Set up games after initial setup
  const setupGames = async (): Promise<void> => {
    if (!configRemote) return;
    
    try {
      // Only setup the first game (since we're only handling one)
      if (configRemote.games && configRemote.games.length > 0) {
        await gamesSetup(configRemote.games[0]);
      }
      setDidFinishGamesSetup(true);
    } catch (e) {
      showError((e as Error).message);
    }
  };

  useEffect(() => {
    if (didFinishInitialSetup && configLocal && configRemote) {
      setupGames();
    }
  }, [didFinishInitialSetup, configLocal, configRemote]);

  // Patch games after setup
  const patchGames = async (): Promise<void> => {
    if (!configRemote || !gameInfo) return;
    
    try {
      await gamesPatch(gameInfo, setIsUpdating);
    } catch (e) {
      showError((e as Error).message);
    }
  };

  useEffect(() => {
    if (didFinishGamesSetup) {
      patchGames();
    }
  }, [didFinishGamesSetup]);

  // Toggle settings panel
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Export logs for settings
  const handleExportLogs = async () => {
    const success = await saveLogsToFile();
    if (success) {
      showWarn("Debug logs have been saved to launcher-debug.log");
    } else {
      showError("Failed to save debug logs");
    }
  };

  return (
    <div className="container">
      <div className="initial-setup">
        <span className="initial-setup-text">Initializing...</span>
      </div>
      
      {/* Settings button in top right */}
      <div className="settings-icon" onClick={toggleSettings}>
        <div className="gear-icon"></div>
      </div>
      
      {/* Settings panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <h2>Settings</h2>
            <button className="close-button" onClick={toggleSettings}>×</button>
          </div>
          <div className="settings-content">
            <button className="settings-button" onClick={handleExportLogs}>
              Export Debug Logs
            </button>
            <div className="version-info">
              <p>Launcher Version: {configRemote?.launcherVer || "Unknown"}</p>
              <p>Client Version: {gameInfo?.clientVer || "Unknown"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main game panel */}
      <div className="game-container">
        {gameInfo && (
          <div
            id={`game-container-${gameInfo.name}`}
            className={`game-patcher ${gameInfo.name.toLowerCase()} active`}
          >
            <div className={`total-progress ${gameInfo.name}`}>
              <div className={`total-mid ${gameInfo.name}`}>
                <div className={`total-bar ${gameInfo.name}`} />
              </div>
            </div>
            <span className={`txt-status ${gameInfo.name} text`}></span>
            <span className={`txt-progress ${gameInfo.name} text`}></span>
            <span className={`txt-download-speed ${gameInfo.name} text`}></span>
            <span className={`txt-time-remaining ${gameInfo.name} text`}></span>
            <button className={`btn-start ${gameInfo.name}`}>Play</button>
            <button
              className={`btn-start disabled ${gameInfo.name}`}
              style={{ display: "none" }}
            ></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainWindow;