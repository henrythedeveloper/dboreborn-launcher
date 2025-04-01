import { Game, LocalGame } from "../../types";
import { 
  addCacheBustingSuffix,
  getFileNameFromUrl, 
  extract7zFile, 
  showDownloadProgress, 
  showExtractProgress, 
  showError, 
  showText 
} from "./utilities";
import { updateConfigJson } from "./updateConfigJson";
import api from "./electronAPI";

const isDevelopment = process.env.NODE_ENV !== "production";

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
  
  // UI elements
  const startButton = document.querySelector(`.btn-start.${game?.name}`) as HTMLButtonElement | null;
  const disabledButton = document.querySelector(
    `.btn-start.disabled.${game?.name}`
  ) as HTMLButtonElement | null;

  if (!startButton || !disabledButton) {
    console.error(`UI elements for game ${game.name} not found`);
    return;
  }

  // Wait for install click
  const waitForInstallClick = async (): Promise<void> => {
    setIsUpdating(false);
    disabledButton.style.setProperty("display", "none");
    startButton.removeEventListener("click", handlePatchClick);
    startButton.addEventListener("click", handleInstallClick);
    showText(`.btn-start.${game?.name}`, "Install");
    showText(`.txt-status.${game?.name}`, "Game is not yet installed");
  };

  // Wait for client update click
  const waitForClientUpdateClick = async (): Promise<void> => {
    setIsUpdating(false);
    disabledButton.style.setProperty("display", "none");
    startButton.removeEventListener("click", handlePatchClick);
    startButton.addEventListener("click", handleInstallClick);
    showText(`.btn-start.${game?.name}`, "Download Client");
    showText(`.txt-status.${game?.name}`, "New Client available");
  };

  // Handle install click
  const handleInstallClick = async (): Promise<void> => {
    disabledButton.style.display = "block";
    showText(`.btn-start.disabled.${game?.name}`, "Install");
    showText(`.txt-status.${game?.name}`, "Downloading Client");
    await updateClient();
  };

  // Wait for patch click
  const waitForPatchClick = async (): Promise<void> => {
    setIsUpdating(false);
    disabledButton.style.setProperty("display", "none");
    startButton.removeEventListener("click", handleInstallClick);
    startButton.addEventListener("click", handlePatchClick);
    showText(`.btn-start.${game?.name}`, "Download Updates");
    showText(`.txt-status.${game?.name}`, "Updates available");
  };

  // Handle patch click
  const handlePatchClick = async (): Promise<void> => {
    disabledButton.style.display = "block";
    showText(`.btn-start.disabled.${game?.name}`, "Download Updates");
    await handlePatches();
  };

  // Initialize the game state
  const init = async (): Promise<void> => {
    if (
      gameLocal?.clientVer === 0 &&
      game?.clientVer > gameLocal?.clientVer
    ) {
      await waitForInstallClick();
    } else if (
      gameLocal?.clientVer > 0 &&
      game?.clientVer > gameLocal?.clientVer
    ) {
      await waitForClientUpdateClick();
    } else if (game?.patchUrls?.length > gameLocal?.patchVer) {
      await waitForPatchClick();
    } else {
      finish();
    }
  };

  // Update client function
  const updateClient = async (): Promise<void> => {
    setIsUpdating(true);
    try {
      const gameDirPath = `${currentDir}\\${game?.name}`;
      const { exists } = await api.checkFileExists(gameDirPath);
      if (!exists) {
        const result = await api.createDirectory(gameDirPath);
        if (!result.success) throw new Error(result.error);
      }

      const clientZipPath = `${currentDir}\\${game?.name}\\${getFileNameFromUrl(game.clientUrl)}`;
      const zipExists = await api.checkFileExists(clientZipPath);
      if (zipExists.exists) {
        await api.deleteFile(clientZipPath);
      }

      startTime = Date.now();
      api.sendMessage("download", {
        url: addCacheBustingSuffix(game?.clientUrl),
        options: {
          directory: `${currentDir}\\${game?.name}`,
          filename: getFileNameFromUrl(game?.clientUrl),
          step: "client",
        },
      });

      const handleDownloadComplete = async (): Promise<void> => {
        api.removeListener("download client complete", handleDownloadComplete);
        
        showText(`.txt-status.${game?.name}`, "Extracting client");
        
        try {
          await extract7zFile(
            clientZipPath,
            `${currentDir}\\${game?.name}`,
            (progress) => {
              showExtractProgress(game, progress);
            }
          );
          
          const zipResult = await api.deleteFile(clientZipPath);
          if (!zipResult.success) {
            console.error('Failed to delete client zip:', zipResult.error);
          }
          
          await updateConfigJson(
            "games",
            { name: game.name, clientVer: game.clientVer, patchVer: 0 },
            configLocalPath
          );
          
          if (game?.patchUrls?.length > gameLocal?.patchVer) {
            await handlePatches();
          } else {
            finish();
          }
        } catch (error) {
          showError(`Error extracting client: ${(error as Error).message}`);
          setIsUpdating(false);
        }
      };

      api.receive("download client complete", handleDownloadComplete);
    } catch (error) {
      showError(`Error during client update: ${(error as Error).message}`);
      setIsUpdating(false);
    }
  };
  
  // Handle patches function
  const handlePatches = async (): Promise<void> => {
    setIsUpdating(true);

    const patchesToDownload = game.patchUrls.slice(gameLocal.patchVer);

    const update = async (): Promise<void> => {
      if (patchesToDownload.length > 0) {
        const patchUrl = patchesToDownload[0];
        const patchIndex = gameLocal.patchVer + 1;
        const patchZipPath = `${currentDir}\\${game.name}\\${patchUrl.split("/").pop()}`;

        showText(
          `.txt-status.${game.name}`,
          `Downloading patch ${patchIndex}`
        );

        const zipExists = await api.checkFileExists(patchZipPath);
        if (zipExists.exists) {
          await api.deleteFile(patchZipPath);
        }

        startTime = Date.now();
        api.sendMessage("download", {
          url: addCacheBustingSuffix(patchUrl),
          options: {
            directory: `${currentDir}\\${game.name}`,
            filename: patchUrl.split("/").pop() || "",
            step: "patch",
          },
        });

        const handlePatchComplete = async (): Promise<void> => {
          api.removeListener("download patch complete", handlePatchComplete);
          
          showText(
            `.txt-status.${game.name}`,
            `Extracting patch ${patchIndex}`
          );

          try {
            await extract7zFile(
              patchZipPath,
              `${currentDir}\\${game.name}`,
              (progress) => {
                showExtractProgress(game, progress);
              }
            );
            
            const deleteResult = await api.deleteFile(patchZipPath);
            if (!deleteResult.success) {
              console.error('Failed to delete patch zip:', deleteResult.error);
            }
            
            showText(
              `.txt-status.${game.name}`,
              `Patch ${patchIndex} applied`
            );

            await updateConfigJson(
              "games",
              { name: game.name, patchVer: patchIndex },
              configLocalPath
            );

            patchesToDownload.shift();
            gameLocal.patchVer = patchIndex;
            update();
          } catch (error) {
            showError(`Error extracting patch: ${(error as Error).message}`);
            setIsUpdating(false);
          }
        };

        api.receive("download patch complete", handlePatchComplete);
      } else {
        await updateConfigJson(
          "games",
          { name: game.name, patchVer: game.patchUrls.length },
          configLocalPath
        );
        finish();
      }
    };

    if (patchesToDownload.length > 0) {
      update();
    } else {
      finish();
    }
  };
  
  // Finish installation/update process
  const finish = (): void => {
    setIsUpdating(false);
    disabledButton.style.setProperty("display", "none");
    showText(`.txt-status.${game?.name}`, "Game is ready to play");
    showText(`.btn-start.${game?.name}`, "Play");
    showText(`.btn-start.disabled.${game?.name}`, "Play");
    showText(`.txt-progress.${game?.name}`, "");
    
    const totalBarElement = document.querySelector(`.total-bar.${game?.name}`);
    if (totalBarElement instanceof HTMLElement) {
      totalBarElement.style.setProperty("width", "100%");
    }
    
    startButton.removeEventListener("click", handleInstallClick);
    startButton.removeEventListener("click", handlePatchClick);
    startButton.addEventListener("click", async () => {
      const result = await api.startGame(game.startCmd, currentDir + `\\${game.name}\\`);
      if (!result.success) {
        showError(`Failed to start game: ${result.error}`);
        return;
      }
      api.sendMessage("close-app");
    });
  };

  // Download progress event handler
  const handleDownloadProgress = (status: any): void => {
    showDownloadProgress(game, status, startTime);
  };
  // Download error event handler
  const handleDownloadError = (): void => {
    showError(`Error while downloading a file`);
  };

  // Set up event listeners
  api.receive("download progress", handleDownloadProgress);
  api.receive("download error", handleDownloadError);

  // Clean up event listeners when done
  const cleanup = (): void => {
    api.removeListener("download progress", handleDownloadProgress);
    api.removeListener("download error", handleDownloadError);
  };

  try {
    await init();
  } catch (error) {
    showError(`Initialization error: ${(error as Error).message}`);
  } finally {
    // We don't want to clean up immediately as some processes may still be ongoing
    // cleanup();
  }
};