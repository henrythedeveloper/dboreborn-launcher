import { contextBridge, ipcRenderer } from 'electron';
import { IpcResult, FileExistsResult, FileResult } from './types/window';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (channel: string, data?: any) => {
    const validChannels = ['close-app', 'get-file-path', 'download', 'show-error', 'show-warn'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.send(channel, data);
    }
  },
  sendSync: (channel: string, data?: any) => {
    const validChannels = ['get-file-path'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.sendSync(channel, data);
    }
    return null;
  },
  receive: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = [
      'download progress', 
      'download launcher complete', 
      'download client complete', 
      'download patch complete', 
      'download default complete',
      'download error',
      'extraction-progress'
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  removeListener: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = [
      'download progress', 
      'download launcher complete', 
      'download client complete', 
      'download patch complete',
      'download default complete',
      'download error',
      'extraction-progress'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, func);
    }
  },
  // File operations
  checkFileExists: (args: { path: string }): Promise<FileExistsResult> =>
    ipcRenderer.invoke('check-file-exists', args),
  deleteFile: (args: { path: string }): Promise<IpcResult> =>
    ipcRenderer.invoke('delete-file', args),
  writeFile: (args: { path: string; content: string }): Promise<IpcResult> =>
    ipcRenderer.invoke('write-file', args),
  readFile: (args: { path: string; encoding: BufferEncoding }): Promise<FileResult> =>
    ipcRenderer.invoke('read-file', args),
  createDirectory: (args: { path: string }): Promise<IpcResult> =>
    ipcRenderer.invoke('create-directory', args),
  
  // Process operations
  spawnProcess: (args: { command: string; options: any }): Promise<IpcResult> =>
    ipcRenderer.invoke('spawn-process', args),
  startGame: (args: { command: string; cwd: string }): Promise<IpcResult> =>
    ipcRenderer.invoke('start-game', args),

  // 7zip operations
  extract7z: (archivePath: string, outputDir: string): Promise<IpcResult> =>
    ipcRenderer.invoke('extract-7z', { archivePath, outputDir }),
  onExtractionProgress: (callback: (progress: any) => void) =>
    ipcRenderer.on('extraction-progress', (event, progress) => callback(progress)),
  removeExtractionListener: (callback: (progress: any) => void) =>
    ipcRenderer.removeListener('extraction-progress', callback)
});