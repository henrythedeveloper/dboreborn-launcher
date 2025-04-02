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
        
        {/* Settings Panel */}
        <SettingsPanel 
          isOpen={showSettings} 
          onClose={toggleSettings} 
          configRemote={configRemote}
          gameInfo={gameInfo}
        />
        
        {/* Main Game Container */}
        {gameInfo && (
          <GamePatcher 
            game={gameInfo}
            isUpdating={isUpdating}
          />
        )}
      </div>
    </AppContextProvider>
  );
};

export default MainWindow;