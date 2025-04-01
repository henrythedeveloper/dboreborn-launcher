import api from "./electronAPI";
import { Game } from "../../types";
import { updateConfigJson } from "./updateConfigJson";

const isDevelopment = process.env.NODE_ENV !== "production";

export const gamesSetup = async (game: Game): Promise<void> => {
  const currentDir = window.electronAPI.sendSync("get-file-path", "");
  const configLocalPath = isDevelopment
    ? "launcher-config.json"
    : `${currentDir}\\launcher-config.json`;

  const init = async (): Promise<void> => {
    // Re-read the configLocal file each time before making changes
    const result = await api.readFile(configLocalPath, "utf8");
    if (!result.success || !result.content) {
      throw new Error(result.error || 'Failed to read config file');
    }
    
    const configData = result.content;
    const updatedConfigLocal = JSON.parse(configData); // Parse the latest version of the file

    const games = updatedConfigLocal?.games || [];
    const gameIsInConfig = games.some((g: any) => g?.name === game.name);
    const gameLocal = games.find((g: any) => g.name === game.name);

    if (
      !gameIsInConfig ||
      (gameIsInConfig && (gameLocal?.clientVer == null || gameLocal?.patchVer == null))
    ) {
      await updateConfigJson(
        "games",
        { name: game.name, clientVer: 0, patchVer: 0 },
        configLocalPath
      );
    }
  };

  await init();
};