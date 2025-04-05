import React, { useEffect, useState } from "react";
import { Game, LocalConfig, RemoteConfig } from "../../types";
import "../../styles.scss";
import { getConfigFileLocal } from "../utils/getConfigFileLocal";
import { showError } from "../utils/showError";
import { getConfigFileRemote } from "../utils/getConfigFileRemote";
import { getSevenZipBinPath } from "../utils/getSevenZipBinPath";
import { initialSetup } from "../utils/initialSetup";
import { gamesSetup } from "../utils/gamesSetup";
import { gamesPatch } from "../utils/gamesPatch";
import { log } from "../utils/debug";

// Import modularized components
import InitialSetupScreen from "./InitialSetupScreen";
import GamePatcher from "./GamePatcher"; 
import SettingsPanel from "./SettingsPanel";
import NewsSlider from "./NewsSlider";
import BackToTop from "./BackToTop";
import ServerStatus from "./ServerStatus";
import DebugModeHandler from "./DebugModeHandler";
import { AppContextProvider } from "./AppContext";

const isDevelopment = process.env.NODE_ENV !== "production";

const MainWindow: React.FC = () => {
  const [configLocal, setConfigLocal] = useState<LocalConfig | null>(null);
  const [configRemote, setConfigRemote] = useState<RemoteConfig | null>(null);
  const [gameInfo, setGameInfo] = useState<Game | null>(null);
  const [didFinishInitialSetup, setDidFinishInitialSetup] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [serverUrl, setServerUrl] = useState<string>("http://localhost:8002/status");

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
        // Show status update
        const statusEvent = new CustomEvent('launcher-global-status', { 
          detail: { status: "Checking for updates..." } 
        });
        window.dispatchEvent(statusEvent);
        
        const remoteConfig = await getConfigFileRemote(configLocal.updaterUrl);
        if (!remoteConfig || Object.keys(remoteConfig).length === 0) {
          // Fallback config 
          console.warn("Using fallback config because remote config couldn't be loaded");
          const fallbackConfig: RemoteConfig = {
            launcherVer: 1,
            launcherUrl: "http://localhost:8002/launcher.exe",
            serverStatusUrl: "http://localhost:8002/status",
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
          
          // Always set the first (and only) game as the active game
          setGameInfo(fallbackConfig.games[0]);
          
          setDidFinishInitialSetup(true);
          return;
        }
  
        setConfigRemote(remoteConfig);
        log("Remote config loaded", remoteConfig);

        // Update the server status URL if provided in the config
        if (remoteConfig.serverStatusUrl) {
          setServerUrl(remoteConfig.serverStatusUrl);
        }

        // For a single-game launcher, we only have one game, so just use the first one
        if (remoteConfig.games && remoteConfig.games.length > 0) {
          setGameInfo(remoteConfig.games[0]);
        }
  
        // Check for launcher updates
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
        
        // Always use the first game
        setGameInfo(fallbackConfig.games[0]);
        
        setDidFinishInitialSetup(true);
      }
    };

    if (configLocal) {
      validateAndFetchConfig();
    }
  }, [configLocal]);

  // Set up and patch game after initial setup
  useEffect(() => {
    const setupAndPatchGame = async () => {
      if (!didFinishInitialSetup || !configRemote || !gameInfo || !configLocal) return;
      
      try {
        // For single-game launcher, we only need to set up the one game
        await gamesSetup(gameInfo);
        
        // Check if the game needs updates
        await gamesPatch(gameInfo, setIsUpdating);
        
        // We're done initializing
        setIsInitializing(false);
      } catch (error) {
        showError(`Error setting up game: ${(error as Error).message}`);
        log("Game setup error", error);
        setIsInitializing(false);
      }
    };

    setupAndPatchGame();
  }, [didFinishInitialSetup, configRemote, gameInfo, configLocal]);

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Shared app context values
  const contextValues = {
    configLocal,
    configRemote,
    gameInfo,
    isUpdating,
    setIsUpdating,
    setGameInfo,
    setConfigRemote
  };

  return (
    <AppContextProvider value={contextValues}>
      <div className="container">
        <DebugModeHandler />
        
        {isInitializing && (
          <InitialSetupScreen />
        )}

        {/* Server Status Indicator - always visible */}
        <ServerStatus serverUrl={serverUrl} pollingInterval={30000} />
        
        {/* Settings Panel */}
        <SettingsPanel 
          isOpen={showSettings} 
          onClose={toggleSettings} 
          configRemote={configRemote}
          gameInfo={gameInfo}
        />
        
        {/* Main Game Container */}
        {gameInfo && (
          <div className="game-container">
            {/* Updated GamePatcher with integrated button progress */}
            <GamePatcher 
              game={gameInfo}
              isUpdating={isUpdating}
            />

            {/* News Slider Component */}
            {!isInitializing && (
              <NewsSlider game={gameInfo} />
            )}
          </div>
        )}
        
        {/* Additional content 
        {!isInitializing && gameInfo && (
          <div className="additional-content">
            <h2>Additional Content</h2>
            <p>Scroll down to see more launcher content and features.</p>
            
            {/* Placeholder sections 
            <div className="placeholder-section">
                <h3>Server Status</h3>
                <p>This area will show real-time information about game servers, including player counts, server health, and maintenance schedules.</p>
            </div>
              
            <div className="placeholder-section">
              <h3>Latest Events</h3>
              <p>Special weekend event coming soon - check back for more details!</p>
            </div>

            <div className="content-grid">
              <div className="placeholder-section">
                <h3>Patch Notes</h3>
                <p>Version updates and fixes - stay informed about the latest changes.</p>
              </div>
              
              <div className="placeholder-section">
                <h3>Community</h3>
                <p>Connect with other players and join our community!</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Back to top button 
        <BackToTop /> */}
      </div>
    </AppContextProvider>
  );
};

export default MainWindow;