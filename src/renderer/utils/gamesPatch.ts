import { Game, LocalGame } from "../../types";
import { 
  addCacheBustingSuffix,
  getFileNameFromUrl, 
  extract7zFile, 
  showError
} from "./utilities";
import { updateConfigJson } from "./updateConfigJson";
import api from "./electronAPI";
import { log } from "./debug";
import { dispatchStatusUpdate, dispatchGameReady } from "./launcherEvents";

const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * Download type - either client download or patch
 */
type DownloadType = 'client' | 'patch';

export const gamesPatch = async (
  game: Game, 
  setIsUpdating: (isUpdating: boolean) => void
): Promise<void> => {
  let startTime: number;
  const currentDir = api.sendSync("get-file-path", "");
  const configLocalPath = isDevelopment
    ? "launcher-config.json"
    : `${currentDir}\\launcher-config.json`;
  
  // Read config file
  let updatedConfigLocal;
  let gamesLocal: LocalGame[];
  let gameLocal: LocalGame | undefined;

  try {
    const result = await api.readFile(configLocalPath, 'utf8');
    if (!result.success || !result.content) {
      throw new Error(result.error || 'Failed to read config file');
    }
    
    updatedConfigLocal = JSON.parse(result.content);
    gamesLocal = updatedConfigLocal?.games || [];
    gameLocal = gamesLocal.find((g) => g.name === game.name);
  } catch (error) {
    showError(`Failed to read game configuration: ${error}`);
    return;
  }
  
  if (!gameLocal) {
    console.error(`Game ${game.name} not found in local config`);
    return;
  }
  
  /**
   * Generic download and extract function for both client and patches
   */
  const downloadAndExtract = async (
    url: string, 
    downloadType: DownloadType, 
    index: number = 0,
    onComplete: () => Promise<void>
  ): Promise<void> => {
    setIsUpdating(true);
    
    try {
      // Ensure game directory exists
      const gameDirPath = `${currentDir}\\${game?.name}`;
      const { exists } = await api.checkFileExists(gameDirPath);
      if (!exists) {
        const result = await api.createDirectory(gameDirPath);
        if (!result.success) throw new Error(result.error);
      }

      // Prepare file paths
      const fileName = getFileNameFromUrl(url);
      const filePath = `${currentDir}\\${game?.name}\\${fileName}`;
      
      // Delete existing file if it exists
      const fileExists = await api.checkFileExists(filePath);
      if (fileExists.exists) {
        await api.deleteFile(filePath);
      }

      // Set status message using the utility function
      const statusMessage = downloadType === 'client' 
        ? "Downloading Client" 
        : `Downloading patch ${index}`;
      
      // Use our utility function to dispatch the status update event
      dispatchStatusUpdate(statusMessage);
      log(`Status: ${statusMessage}`);

      // Start download
      log(`Starting ${downloadType} download: ${url}`);
      startTime = Date.now();
      api.sendMessage("download", {
        url: addCacheBustingSuffix(url),
        options: {
          directory: `${currentDir}\\${game?.name}`,
          filename: fileName,
          step: downloadType,
        },
      });

      // Handle download complete
      const handleDownloadComplete = async (): Promise<void> => {
        api.removeListener(`download ${downloadType} complete`, handleDownloadComplete);
        
        // Set extraction status using our utility function
        const extractMessage = downloadType === 'client' 
          ? "Extracting client" 
          : `Extracting patch ${index}`;
          
        // Use our utility function to dispatch the status update event
        dispatchStatusUpdate(extractMessage);
        log(`Status: ${extractMessage}`);
        
        try {
          // Extract the file
          await extract7zFile(
            filePath,
            `${currentDir}\\${game?.name}`,
            (progress) => {
              // Progress handling managed by the event listener
            }
          );
          
          // Delete the zip file
          const zipResult = await api.deleteFile(filePath);
          if (!zipResult.success) {
            console.error(`Failed to delete ${downloadType} zip:`, zipResult.error);
          }
          
          // Run completion callback
          await onComplete();
        } catch (error) {
          showError(`Error extracting ${downloadType}: ${(error as Error).message}`);
          setIsUpdating(false);
        }
      };

      // Listen for download completion
      api.receive(`download ${downloadType} complete`, handleDownloadComplete);
    } catch (error) {
      showError(`Error during ${downloadType} update: ${(error as Error).message}`);
      setIsUpdating(false);
    }
  };

  // Handle install/update client click
  const handleInstallClient = async (): Promise<void> => {
    log("Starting client installation");
    await downloadAndExtract(
      game.clientUrl, 
      'client', 
      0,
      async () => {
        // Update client version in config
        await updateConfigJson(
          "games",
          { name: game.name, clientVer: game.clientVer, patchVer: 0 },
          configLocalPath
        );
        
        // Check if patches are needed
        if (game?.patchUrls?.length > 0) {
          await handlePatches();
        } else {
          finish();
        }
      }
    );
  };

  // Handle patches function
  const handlePatches = async (): Promise<void> => {
    setIsUpdating(true);
    log("Starting patch installation");

    const patchesToDownload = game.patchUrls.slice(gameLocal.patchVer);
    
    // Recursive function to process patches one by one
    const processNextPatch = async (index: number): Promise<void> => {
      if (index >= patchesToDownload.length) {
        // All patches complete
        await updateConfigJson(
          "games",
          { name: game.name, patchVer: game.patchUrls.length },
          configLocalPath
        );
        finish();
        return;
      }
      
      const patchUrl = patchesToDownload[index];
      const patchIndex = gameLocal.patchVer + index + 1;
      
      await downloadAndExtract(
        patchUrl, 
        'patch', 
        patchIndex,
        async () => {
          // Show success message using our utility function
          dispatchStatusUpdate(`Patch ${patchIndex} applied`);
          log(`Patch ${patchIndex} applied`);

          // Update patch version in config
          await updateConfigJson(
            "games",
            { name: game.name, patchVer: patchIndex },
            configLocalPath
          );

          // Process next patch
          gameLocal.patchVer = patchIndex;
          await processNextPatch(index + 1);
        }
      );
    };

    // Start processing patches from the beginning
    if (patchesToDownload.length > 0) {
      await processNextPatch(0);
    } else {
      finish();
    }
  };
  
  // Finish installation/update process
  const finish = (): void => {
    setIsUpdating(false);
    
    // Use our utility function to dispatch the game ready event
    dispatchGameReady();
    log(`Game ${game.name} is ready to play`);
  };

  // Download error event handler
  const handleDownloadError = (): void => {
    showError(`Error while downloading a file`);
    setIsUpdating(false);
  };

  // Set up event listeners
  api.receive("download error", handleDownloadError);

  // Initialize the game state
  const init = async (): Promise<void> => {
    // Determine what actions are needed based on versions
    if (gameLocal?.clientVer === 0 && game?.clientVer > gameLocal?.clientVer) {
      // Client needs installation
      log("Client needs installation");
      await handleInstallClient();
    } else if (gameLocal?.clientVer > 0 && game?.clientVer > gameLocal?.clientVer) {
      // Client needs updating
      log("Client needs updating");
      await handleInstallClient();
    } else if (game?.patchUrls?.length > gameLocal?.patchVer) {
      // Patches needed
      log("Patches needed");
      await handlePatches();
    } else {
      // Everything is up to date
      log("Game is up to date");
      finish();
    }
  };

  try {
    await init();
  } catch (error) {
    showError(`Initialization error: ${(error as Error).message}`);
    setIsUpdating(false);
  }
};