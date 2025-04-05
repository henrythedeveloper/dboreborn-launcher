import { LocalConfig, RemoteConfig } from '../../types';
import {
  addCacheBustingSuffix,
  getFileNameFromUrl,
  showError
} from './utilities';
import { updateConfigJson } from './updateConfigJson';
import api from './electronAPI';
import { log } from './debug';
import { dispatchGlobalStatus } from './launcherEvents';

const isDevelopment = process.env.NODE_ENV !== "production";

export const initialSetup = async (
  configLocal: LocalConfig, 
  configRemote: RemoteConfig
): Promise<boolean> => {
  const currentDir = api.sendSync("get-file-path", "");
  const configLocalPath = isDevelopment
    ? "launcher-config.json"
    : `${currentDir}\\launcher-config.json`;

  const launcherNew = `${getFileNameFromUrl(configRemote?.launcherUrl)}.new`;
  const launcherNewPath = `${currentDir}\\${launcherNew}`;
  const replaceScriptPath = `${currentDir}\\launcher-update.bat`;

  const updateLauncher = async (): Promise<boolean> => {
    try {
      if (
        configRemote?.launcherVer > configLocal?.launcherVer &&
        !isDevelopment
      ) {
        // Use our utility function to update the status
        dispatchGlobalStatus("Downloading new launcher...");

        const { exists } = await api.checkFileExists(launcherNewPath);
        if (exists) {
          const result = await api.deleteFile(launcherNewPath);
          if (!result.success) throw new Error(result.error);
        }

        return new Promise<boolean>((resolve, reject) => {
          api.sendMessage("download", {
            url: addCacheBustingSuffix(configRemote?.launcherUrl),
            options: {
              directory: currentDir,
              filename: `${launcherNew}`,
              step: "launcher",
            },
          });

          const downloadCompleteHandler = async () => {
            try {
              api.removeListener('download launcher complete', downloadCompleteHandler);
              api.removeListener('download error', downloadErrorHandler);
              
              updateConfigJson(
                "launcherVer",
                configRemote.launcherVer,
                configLocalPath
              );
              await replaceExecutable();
              resolve(true);
            } catch (error) {
              reject(error);
            }
          };

          const downloadErrorHandler = () => {
            api.removeListener('download launcher complete', downloadCompleteHandler);
            api.removeListener('download error', downloadErrorHandler);
            reject("Error while downloading new launcher");
          };

          api.receive("download launcher complete", downloadCompleteHandler);
          api.receive("download error", downloadErrorHandler);
        });
      }

      // Use our utility function to update the status
      dispatchGlobalStatus("Launcher already updated");
      const setupElement = document.querySelector(".initial-setup");
      if (setupElement instanceof HTMLElement) {
        setupElement.style.setProperty("display", "none");
      }
      return true;
    } catch (error) {
      showError(error as string);
      return false;
    }
  };

  const replaceExecutable = async (): Promise<void> => {
    const replaceScriptContent = `
    @echo off
    setlocal
    set currentDir=%~dp0
    set launcherExe=%currentDir%launcher.exe
    set newLauncher=%currentDir%${launcherNew}
  
    :: Kill the running launcher
    taskkill /IM launcher.exe /F >nul 2>&1
  
    :: Wait for the launcher to close
    :waitLoop
    tasklist /FI "IMAGENAME eq launcher.exe" 2>NUL | find /I "launcher.exe" >NUL
    if not errorlevel 1 (
        timeout /T 1 /NOBREAK >NUL
        goto waitLoop
    )
  
    :: Delete the old launcher executable
    del /F /Q "%launcherExe%" >nul 2>&1
  
    :: Rename the new launcher to launcher.exe
    ren "%newLauncher%" "launcher.exe"
  
    :: Start the new launcher
    start "" "%launcherExe%" >nul 2>&1
  
    :: Clean up the batch file
    del /F "%~f0" >nul 2>&1
    exit /b
    `;

    const { exists } = await api.checkFileExists(replaceScriptPath);
    if (exists) {
      const result = await api.deleteFile(replaceScriptPath);
      if (!result.success) throw new Error(result.error);
    }

    const writeResult = await api.writeFile(replaceScriptPath, replaceScriptContent);
    if (!writeResult.success) throw new Error(writeResult.error);

    const spawnResult = await api.spawnProcess(
      `start /min cmd.exe /C "${replaceScriptPath}"`,
      { detached: true, shell: true }
    );
    if (!spawnResult.success) throw new Error(spawnResult.error);

    api.sendMessage("close-app");
  };

  try {
    return await updateLauncher();
  } catch (e) {
    showError(e as string);
    return false;
  }
};