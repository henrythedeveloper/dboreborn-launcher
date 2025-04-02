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
import GamePatcher from "./GamePatcher"; // Updated component
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
  const [didFinishGamesSetup, setDidFinishGamesSetup] = useState<boolean>(false);
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

        // Update the server status URL if provided in the config
        if (remoteConfig.serverStatusUrl) {
          setServerUrl(remoteConfig.serverStatusUrl);
        }

        // Always use the first game
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
      // Only setup the first game 
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
      setIsInitializing(false);
    } catch (e) {
      showError((e as Error).message);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (didFinishGamesSetup) {
      patchGames();
    }
  }, [didFinishGamesSetup]);

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Shared app context values
  const contextValues = {
    configLocal,
    configRemote,
    gameInfo,
    isUpdating,
    setIsUpdating
  };

  return (
    <AppContextProvider value={contextValues}>
      <div className="container">
        <DebugModeHandler />
        
        {isInitializing && (
          <InitialSetupScreen />
        )}

        {/* Server Status Indicator */}
        {!isInitializing && (
          <ServerStatus serverUrl={serverUrl} pollingInterval={30000} />
        )}
        
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
        
        {/* Additional scrollable content below the fold */}
        {!isInitializing && gameInfo && (
          <div className="additional-content">
            <h2>Additional Content</h2>
            <p>Scroll down to see more launcher content and features.</p>
            
            {/* Placeholder for future components */}
            <div className="placeholder-section">
                <h3>Coming Soon: Server Status</h3>
                <p>This area will show real-time information about game servers, including player counts, server health, and maintenance schedules.</p>
            </div>
              
            <div className="placeholder-section">
              <h3>Coming Soon: Community Hub</h3>
              <p>Connect with other players, join guilds, see community activity, and stay updated with the latest tournaments and events.</p>
            </div>

            <div className="content-grid">
              <div className="placeholder-section">
                <h3>Player Achievements</h3>
                <p>View your recent achievements and track your progress toward completing in-game challenges.</p>
              </div>
              
              <div className="placeholder-section">
                <h3>Media Gallery</h3>
                <p>Explore screenshots, videos, concept art, and other media from the game universe.</p>
              </div>
            </div>

            <div className="placeholder-section">
              <h3>Coming Soon: Character Profiles</h3>
              <p>Manage your characters, customize their appearance, and review your stats all from the launcher.</p>
            </div>
          </div>
        )}
        
        {/* Back to top button */}
        <BackToTop />
      </div>
    </AppContextProvider>
  );
};

export default MainWindow;