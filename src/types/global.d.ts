// global.d.ts
/// <reference types="electron" />

// Constants for Vite
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string | undefined;

// Interface definitions
interface IpcResult {
  success: boolean;
  error?: string;
}

interface FileExistsResult {
  exists: boolean;
  error?: string;
}

interface FileResult extends IpcResult {
  content?: string;
}

interface ElectronAPI {
  // Basic IPC operations
  sendMessage: (channel: string, data?: any) => void;
  sendSync: (channel: string, data?: any) => any;
  receive: (channel: string, func: (...args: any[]) => void) => void;
  removeListener: (channel: string, func: (...args: any[]) => void) => void;

  // 7zip operations
  extract7z: (archivePath: string, outputDir: string) => Promise<IpcResult>;
  onExtractionProgress: (callback: (progress: any) => void) => void;
  removeExtractionListener: (callback: (progress: any) => void) => void;

  // File operations
  checkFileExists: (args: { path: string }) => Promise<FileExistsResult>;
  deleteFile: (args: { path: string }) => Promise<IpcResult>;
  writeFile: (args: { path: string; content: string }) => Promise<IpcResult>;
  readFile: (args: { path: string; encoding: BufferEncoding }) => Promise<FileResult>;
  createDirectory: (args: { path: string }) => Promise<IpcResult>;

  // Process operations
  spawnProcess: (args: { command: string; options: any }) => Promise<IpcResult>;
  startGame: (args: { command: string; cwd: string }) => Promise<IpcResult>;
}

// Game-related interfaces
interface Game {
  name: string;
  startCmd: string;
  clientVer: number;
  clientUrl: string;
  patchUrls: string[];
}

interface RemoteConfig {
  launcherVer: number;
  launcherUrl: string;
  games: Game[];
}

interface LocalConfig {
  updaterUrl: string;
  launcherVer: number;
  lastSelectedGame: string;
  games: LocalGame[];
}

interface LocalGame {
  name: string;
  clientVer: number;
  patchVer: number;
}

interface DownloadStatus {
  percent: number;
  transferredBytes: number;
  totalBytes: number;
}

interface ExtractionProgress {
  percent: number;
  fileCount?: number;
  file?: string;
}

// Process resources path
interface Process {
  resourcesPath?: string;
}

// Add electron API to window object
interface Window {
  electronAPI: ElectronAPI;
}

// Custom interface for the Seven library
interface ExtractionStream {
  on(event: 'progress' | 'end' | 'error', listener: Function): this;
}

// Node.js environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    ELECTRON_WEBPACK_WDS_PORT: string;
    PORTABLE_EXECUTABLE_DIR?: string;
  }
}