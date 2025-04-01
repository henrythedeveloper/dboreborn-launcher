import path from 'path';
import { Game, DownloadStatus, ExtractionProgress } from '../../types';

const isDevelopment = process.env.NODE_ENV !== "production";

// Add cache busting suffix to URL
export const addCacheBustingSuffix = (url: string): string => {
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${randomNumber}`;
};

// Get filename from URL
export const getFileNameFromUrl = (url: string): string => {
  const myURL = new URL(url);
  const pathname = myURL.pathname;
  return pathname.split("/").pop() || '';
};

// Get path to 7zip binary
export const getSevenZipBinPath = (): string | null => {
  let sevenZipBinPath: string;
  const currentDir = window.electronAPI.sendSync("get-file-path", "");
  
  try {
    if (isDevelopment) {
      sevenZipBinPath = "7za.exe";
    } else {
      sevenZipBinPath = `${currentDir}\\7za.exe`;
    }
    return sevenZipBinPath;
  } catch (error) {
    return null;
  }
};

// Extract 7z file
export const extract7zFile = async (
  archivePath: string, 
  outputDir: string, 
  progressCallback: (progress: ExtractionProgress) => void
): Promise<void> => {
  const progressListener = (progress: ExtractionProgress) => {
    progressCallback(progress);
  };

  try {
    window.electronAPI.onExtractionProgress(progressListener);
    await window.electronAPI.extract7z(archivePath, outputDir);
  } catch (error) {
    console.error('Error during extraction:', error);
    throw error;
  } finally {
    window.electronAPI.removeExtractionListener(progressListener);
  }
};

// Show text in element
export const showText = (element: string, msg: string): void => {
  const el = document.querySelector(element);
  if (el) {
    el.innerHTML = msg;
  }
};

// Show download progress
export const showDownloadProgress = (
  game: Game, 
  status: DownloadStatus, 
  startTime: number
): void => {
  const fileProgress = Math.floor(status.percent * 100);
  const transferredMB = (status.transferredBytes / (1024 * 1024)).toFixed(2);
  const totalMB = (status.totalBytes / (1024 * 1024)).toFixed(2);

  const gameContainer = document.getElementById(`game-container-${game?.name}`);
  if (!gameContainer) return;

  showText(
    `.txt-progress.${game?.name}`,
    `${fileProgress}% (${transferredMB}MB/${totalMB}MB)`
  );
  
  const progressBar = gameContainer.querySelector(`.total-bar.${game?.name}`);
  if (progressBar instanceof HTMLElement) {
    progressBar.style.setProperty("width", fileProgress + "%");
  }

  const elapsedSeconds = (Date.now() - startTime) / 1000;
  const downloadSpeed =
    elapsedSeconds > 0
      ? status.transferredBytes / (1024 * 1024) / elapsedSeconds
      : 0;
  const remainingBytes = status.totalBytes - status.transferredBytes;
  const timeRemaining =
    downloadSpeed > 0 ? remainingBytes / (downloadSpeed * 1024 * 1024) : 0;

  const timeRemainingStr = new Date(timeRemaining * 1000)
    .toISOString()
    .substr(11, 8);

  showText(
    `.txt-download-speed.${game?.name}`,
    `Download speed: ${downloadSpeed.toFixed(2)} MB/s`
  );
  showText(
    `.txt-time-remaining.${game?.name}`,
    `Time remaining: ${timeRemainingStr}`
  );

  if (fileProgress === 100) {
    showText(`.txt-progress.${game?.name}`, "");
    showText(`.txt-download-speed.${game?.name}`, "");
    showText(`.txt-time-remaining.${game?.name}`, "");
  }
};

// Show extraction progress
export const showExtractProgress = (
  game: Game, 
  progress: ExtractionProgress
): void => {
  // Extract progress percentage
  const fileProgress = Math.floor(progress.percent) + 1;

  // Display progress
  showText(`.txt-progress.${game?.name}`, `${fileProgress}%`);
  
  const progressBarElement = document.querySelector(`.total-bar.${game?.name}`);
  if (progressBarElement instanceof HTMLElement) {
    progressBarElement.style.setProperty("width", fileProgress + "%");
  }

  // Update time remaining
  showText(`.txt-download-speed.${game?.name}`, "");
  showText(`.txt-time-remaining.${game?.name}`, "");

  if (fileProgress === 100) {
    showText(`.txt-progress.${game?.name}`, "");
    showText(`.txt-download-speed.${game?.name}`, "");
    showText(`.txt-time-remaining.${game?.name}`, "");
  }
};

// Show error
export const showError = (error: string): void => {
  window.electronAPI.sendMessage('show-error', error);
};

// Show warning
export const showWarn = (warning: string): void => {
  window.electronAPI.sendMessage('show-warn', warning);
};