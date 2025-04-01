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
import { enableDebugMode, log } from "../utils/debug";

const isDevelopment = process.env.NODE_ENV !== "production";

const MainWindow: React.FC = () => {
  const [configLocal, setConfigLocal] = useState<LocalConfig | null>(null);
  const [configRemote, setConfigRemote] = useState<RemoteConfig | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameInfo, setGameInfo] = useState<Game | null>(null);
  const [didFinishInitialSetup, setDidFinishInitialSetup] = useState<boolean>(false);
  const [didFinishGamesSetup, setDidFinishGamesSetup] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

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
            setSelectedGame(fallbackConfig.games[0].name);
          }
          
          setDidFinishInitialSetup(true);
          return;
        }
  
        setConfigRemote(remoteConfig);
        log("Remote config loaded", remoteConfig);

        const currentDir = window.electronAPI.sendSync("get-file-path", "");
        const configLocalPath = isDevelopment
          ? "launcher-config.json"
          : `${currentDir}\\launcher-config.json`;
        
        // Set the first game as default if available
        if (remoteConfig?.games?.length > 0) {
          const game = remoteConfig.games[0];
          setGameInfo(game);

          if (configLocal?.lastSelectedGame?.length > 0) {
            setSelectedGame(configLocal.lastSelectedGame);
          } else {
            setSelectedGame(game.name);
            updateConfigJson("lastSelectedGame", game.name, configLocalPath);
          }
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
          setSelectedGame(fallbackConfig.games[0].name);
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
      for (const game of configRemote.games || []) {
        await gamesSetup(game);
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
    if (!configRemote) return;
    
    try {
      for (const game of configRemote.games || []) {
        await gamesPatch(game, setIsUpdating);
      }
    } catch (e) {
      showError((e as Error).message);
    }
  };

  const handleGameClick = async (game: Game): Promise<void> => {
    if (isUpdating) {
      showWarn("An update is currently in progress. Please wait.");
      return;
    }

    const currentDir = window.electronAPI.sendSync("get-file-path", "");
    const configLocalPath = isDevelopment
      ? "launcher-config.json"
      : `${currentDir}\\launcher-config.json`;

    try {
      setSelectedGame(game.name);
      await updateConfigJson("lastSelectedGame", game.name, configLocalPath);
    } catch (error) {
      showError(`Error updating selected game: ${(error as Error).message}`);
    }
  };

  useEffect(() => {
    if (didFinishGamesSetup) {
      patchGames();
    }
  }, [didFinishGamesSetup]);


  return (
    <div className="container">
      <div className="initial-setup">
        <span className="initial-setup-text">Initializing...</span>
      </div>
      <div className="side-menu">
        {configRemote?.games?.map((game) => (
          <div
            key={game.name}
            className={`game-icon ${game.name.toLowerCase()} ${
              selectedGame === game.name ? "selected" : ""
            }`}
            onClick={() => handleGameClick(game)}
          ></div>
        ))}
      </div>
      <div className="patcher">
        {configRemote?.games?.map((game) => (
          <div
            key={game.name}
            id={`game-container-${game.name}`}
            className={`game-patcher ${game.name.toLowerCase()} ${
              selectedGame === game.name ? "active" : ""
            }`}
          >
            <div className={`total-progress ${game.name}`}>
              <div className={`total-mid ${game.name}`}>
                <div className={`total-bar ${game.name}`} />
              </div>
            </div>
            <span className={`txt-status ${game.name} text`}></span>
            <span className={`txt-progress ${game.name} text`}></span>
            <span className={`txt-download-speed ${game.name} text`}></span>
            <span className={`txt-time-remaining ${game.name} text`}></span>
            <button className={`btn-start ${game.name}`}>Play</button>
            <button
              className={`btn-start disabled ${game.name}`}
              style={{ display: "none" }}
            ></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainWindow;