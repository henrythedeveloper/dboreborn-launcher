import { LocalConfig } from '../../types';
import api from './electronAPI';

const filePath = api.sendSync("get-file-path", "");
const isDevelopment = process.env.NODE_ENV !== "production";

const defaultConfig: LocalConfig = {
  updaterUrl: process.env.NODE_ENV === 'development' 
    ? "http://localhost:8002/config.json" // Your test server
    : "https://your-production-server.com/config.json", // For production
  launcherVer: 1,
  lastSelectedGame: "",
  games: [],
};

export const getConfigFileLocal = async (): Promise<LocalConfig> => {
  let configFileLocal: LocalConfig;
  const configPath = isDevelopment
    ? "launcher-config.json"
    : `${filePath}/launcher-config.json`;

  try {
    const readResult = await api.readFile(configPath, 'utf8');
    if (!readResult.success || !readResult.content) {
      throw new Error(readResult.error || 'Failed to read config file');
    }

    configFileLocal = JSON.parse(readResult.content);
    const missingFields: string[] = [];

    if (!configFileLocal.updaterUrl) {
      missingFields.push("updaterUrl");
    }
    if (!configFileLocal.launcherVer) {
      missingFields.push("launcherVer");
    }
    if (!configFileLocal.lastSelectedGame) {
      missingFields.push("lastSelectedGame");
    }
    if (!configFileLocal.games) {
      missingFields.push("games");
    }

    if (missingFields.length > 0) {
      const existsResult = await api.checkFileExists(configPath);
      if (existsResult.exists) {
        await api.deleteFile(configPath);
      }
      
      const writeResult = await api.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
      if (!writeResult.success) {
        throw new Error(writeResult.error || 'Failed to write config file');
      }
      
      configFileLocal = defaultConfig;
    }
  } catch (error) {
    const writeResult = await api.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
    if (!writeResult.success) {
      throw new Error(writeResult.error || 'Failed to write default config file');
    }
    configFileLocal = defaultConfig;
  }

  return configFileLocal;
};