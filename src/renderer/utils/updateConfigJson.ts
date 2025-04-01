import { LocalGame } from '../../types';
import api from './electronAPI';

interface GameUpdate extends Partial<LocalGame> {
  name: string;
}

/**
 * Update a field in the launcher-config.json file or update an existing game.
 *
 * @param {string} field - The field to update or 'games' to push a new game.
 * @param {any} value - The new value for the field or the game object to update.
 * @param {string} path - The launcher-config.json path.
 * @returns {Promise<void>}
 */
export async function updateConfigJson(
  field: string, 
  value: string | number | GameUpdate, 
  path: string
): Promise<void> {
  try {
    // Always read the latest config file before making changes
    const readResult = await api.readFile(path, "utf8");
    if (!readResult.success || !readResult.content) {
      throw new Error(readResult.error || 'Failed to read config file');
    }

    const updateJson = JSON.parse(readResult.content);

    if (field === "games" && typeof value === 'object') {
      const gameUpdate = value as GameUpdate;
      
      if (!Array.isArray(updateJson.games)) {
        updateJson.games = [];
      }

      const existingGameIndex = updateJson.games.findIndex(
        (game: LocalGame) => game.name === gameUpdate.name
      );

      if (existingGameIndex !== -1) {
        // Update the existing game's versions
        if (gameUpdate.clientVer != null) {
          updateJson.games[existingGameIndex].clientVer = gameUpdate.clientVer;
        }
        if (gameUpdate.patchVer != null) {
          updateJson.games[existingGameIndex].patchVer = gameUpdate.patchVer;
        }
      } else {
        // Add the new game to the array
        updateJson.games.push(gameUpdate);
      }      
    } else if (field in updateJson) {
      // Update the field if it exists
      updateJson[field] = value;
    }

    // Write the updated config back to the file
    const writeResult = await api.writeFile(
      path,
      JSON.stringify(updateJson, null, 4)
    );

    if (!writeResult.success) {
      throw new Error(writeResult.error || 'Failed to write config file');
    }
  } catch (error) {
    console.error("Error updating launcher-config.json:", error);
    throw error;
  }
}