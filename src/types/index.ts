// src/types/index.ts
export interface Game {
    name: string;
    startCmd: string;
    clientVer: number;
    clientUrl: string;
    patchUrls: string[];
  }
  
  export interface RemoteConfig {
    launcherVer: number;
    launcherUrl: string;
    games: Game[];
  }
  
  export interface LocalConfig {
    updaterUrl: string;
    launcherVer: number;
    lastSelectedGame: string;
    games: LocalGame[];
  }
  
  export interface LocalGame {
    name: string;
    clientVer: number;
    patchVer: number;
  }
  
  export interface DownloadStatus {
    percent: number;
    transferredBytes: number;
    totalBytes: number;
  }
  
  export interface ExtractionProgress {
    percent: number;
    fileCount?: number;
    file?: string;
  }