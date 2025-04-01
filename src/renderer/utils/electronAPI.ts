import type { ElectronAPI, IpcResult, FileExistsResult, FileResult } from '../../types/window';

// Type assertion for window.electronAPI
const electronAPI = window.electronAPI as ElectronAPI;

const api = {
  // File operations
  checkFileExists: async (path: string): Promise<FileExistsResult> => {
    return electronAPI.checkFileExists({ path });
  },
  
  deleteFile: async (path: string): Promise<IpcResult> => {
    return electronAPI.deleteFile({ path });
  },
  
  writeFile: async (path: string, content: string): Promise<IpcResult> => {
    return electronAPI.writeFile({ path, content });
  },
  
  readFile: async (path: string, encoding: BufferEncoding = 'utf8'): Promise<FileResult> => {
    return electronAPI.readFile({ path, encoding });
  },

  createDirectory: async (path: string): Promise<IpcResult> => {
    return electronAPI.createDirectory({ path });
  },

  // Process operations
  spawnProcess: async (command: string, options: any): Promise<IpcResult> => {
    return electronAPI.spawnProcess({ command, options });
  },

  startGame: async (command: string, cwd: string): Promise<IpcResult> => {
    return electronAPI.startGame({ command, cwd });
  },

  // Pass-through methods
  sendMessage: electronAPI.sendMessage,
  sendSync: electronAPI.sendSync,
  receive: electronAPI.receive,
  removeListener: electronAPI.removeListener,

  // 7zip operations
  extract7z: electronAPI.extract7z,
  onExtractionProgress: electronAPI.onExtractionProgress,
  removeExtractionListener: electronAPI.removeExtractionListener
};

export default api;

// Also export the types for use in other files
export type { IpcResult, FileExistsResult, FileResult };