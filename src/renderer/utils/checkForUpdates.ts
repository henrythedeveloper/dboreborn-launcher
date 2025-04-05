// src/renderer/utils/checkForUpdates.ts
import { LocalConfig, RemoteConfig, Game } from "../../types";
import { getConfigFileRemote } from "./getConfigFileRemote";
import { showWarn } from "./showWarn";
import { showError } from "./showError";
import { initialSetup } from "./initialSetup";
import { gamesSetup } from "./gamesSetup";
import { gamesPatch } from "./gamesPatch";
import { log } from "./debug";
import { dispatchGlobalStatus } from "./launcherEvents";

/**
 * Check for updates specifically for a single-game launcher
 */
export const checkForUpdates = async (
  configLocal: LocalConfig,
  setIsUpdating: (isUpdating: boolean) => void,
  setGameInfo: (gameInfo: Game | null) => void,
  setConfigRemote: (configRemote: RemoteConfig | null) => void
): Promise<boolean> => {
  // Show checking message using our utility function
  dispatchGlobalStatus("Checking for updates...");
  
  try {
    // Fetch remote config
    const remoteConfig = await getConfigFileRemote(configLocal.updaterUrl);
    
    if (!remoteConfig) {
      showWarn("Could not connect to update server. Please try again later.");
      return false;
    }
    
    // Update the remote config in state
    setConfigRemote(remoteConfig);
    log("Remote config loaded during update check", remoteConfig);
    
    // Check launcher version
    if (remoteConfig.launcherVer > configLocal.launcherVer) {
      // Use our utility function to update the status
      dispatchGlobalStatus("Launcher update available!");
      
      // Trigger launcher update process
      const setupSuccessful = await initialSetup(configLocal, remoteConfig);
      if (!setupSuccessful) {
        showError("Failed to update launcher");
        return false;
      }
      
      return true;
    }
    
    // For a single-game launcher, we always use the first game in the config
    if (remoteConfig.games && remoteConfig.games.length > 0) {
      const game = remoteConfig.games[0]; // The game
      
      // Update game info in state
      setGameInfo(game);
      
      // Find corresponding local game
      const localGame = configLocal.games.find(g => g.name === game.name);
      
      if (!localGame) {
        // Game doesn't exist locally, set it up
        await gamesSetup(game);
        showWarn(`Game installation needed. The launcher will now download the game.`);
        return true;
      }
      
      // Check if client version is different
      const clientUpdateNeeded = game.clientVer > localGame.clientVer;
      
      // Check if patches are available
      const patchesAvailable = 
        game.patchUrls && 
        localGame.patchVer < game.patchUrls.length;
      
      if (clientUpdateNeeded) {
        showWarn(`Client update available!`);
        await gamesPatch(game, setIsUpdating);
        return true;
      } else if (patchesAvailable) {
        showWarn(`Patches available!`);
        await gamesPatch(game, setIsUpdating);
        return true;
      } else {
        showWarn("Your launcher and game are up to date!");
        return false;
      }
    } else {
      showWarn("No game found in the update configuration");
      return false;
    }
  } catch (error) {
    showError(`Error checking for updates: ${(error as Error).message}`);
    log("Error checking for updates", error);
    return false;
  }
};