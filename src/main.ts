import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { download } from 'electron-dl';
import started from 'electron-squirrel-startup';

// Import node-7z without 7zip-bin dependency
const Seven = require('node-7z');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

// Function to get the 7zip binary path
const getSevenZipBinPath = (): string => {
  try {
    const sevenZipBin = require('7zip-bin');
    let binPath;
    
    if (app.isPackaged) {
      // In production, use packaged binaries
      binPath = path.join(
        process.resourcesPath, 
        process.platform === 'win32' ? '7za.exe' : '7za'
      );
    } else {
      // In development, use node_modules binaries
      binPath = sevenZipBin.path7za;
    }
    
    console.log('7zip binary path:', binPath);
    
    // Check if the binary exists
    if (fs.existsSync(binPath)) {
      console.log('7zip binary found at:', binPath);
      return binPath;
    } else {
      console.error('7zip binary not found at:', binPath);
      throw new Error('7zip binary not found');
    }
  } catch (error) {
    console.error('Error resolving 7zip path:', error);
    throw error;
  }
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 540,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: true,
    fullscreenable: false,
    maximizable: false,
    resizable: false,
    title: "Launcher",
    backgroundColor: "#222",
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
  
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAlwaysOnTop(true);
  mainWindow.setAlwaysOnTop(false);
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.on("close-app", () => app.quit());

ipcMain.on("get-file-path", (event) => {
  if (process.env.NODE_ENV === 'development') {
    event.returnValue = path.resolve(app.getAppPath(), "..");
  } else {
    event.returnValue = process.env.PORTABLE_EXECUTABLE_DIR;
  }
});

ipcMain.on("show-error", (event, error) => {
  dialog.showMessageBox({
    type: "error",
    title: "Application Error",
    message: error.toString(),
    buttons: ["OK"],
  }).then((result) => {
    if (result.response === 0) {
      app.quit();
    }
  });
});

ipcMain.on("show-warn", (event, error) => {
  dialog.showMessageBox({
    type: "warning",
    title: "Application Warning",
    message: error.toString(),
    buttons: ["OK"],
  });
});

// Download functionality
ipcMain.on("download", (event, data) => {
  if (!mainWindow) return;
  
  data.options.onProgress = (status: any) => {
    mainWindow?.webContents.send("download progress", status);
  };
  
  download(mainWindow, data.url, data.options)
    .then(() => {
      const event = `download ${data.options.step} complete`;
      mainWindow?.webContents.send(event);
    })
    .catch(() => {
      mainWindow?.webContents.send("download error");
    });
});

// 7zip extraction handler
ipcMain.handle('extract-7z', async (event, { archivePath, outputDir }) => {
  return new Promise((resolve, reject) => {
    try {
      const pathTo7zip = getSevenZipBinPath();
      console.log('Using 7zip from:', pathTo7zip);
      
      const extractionStream = Seven.extractFull(archivePath, outputDir, {
        $bin: pathTo7zip,
        $progress: true
      });
      
      extractionStream.on("progress", (progress) => {
        if (mainWindow) {
          mainWindow.webContents.send('extraction-progress', progress);
        }
      });
      
      extractionStream.on("end", () => resolve({ success: true }));
      
      extractionStream.on("error", (err) => {
        console.error('7zip extraction error:', err);
        reject({ success: false, error: err.message });
      });
    } catch (error) {
      console.error('Error setting up extraction:', error);
      reject({ success: false, error: error.message });
    }
  });
});

// File operation handlers
ipcMain.handle('check-file-exists', async (event, args: { path: string }) => {
  try {
    await fs.promises.access(args.path);
    return { exists: true };
  } catch {
    return { exists: false };
  }
});

ipcMain.handle('delete-file', async (event, args: { path: string }) => {
  try {
    await fs.promises.unlink(args.path);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('create-directory', async (event, args: { path: string }) => {
  try {
    await fs.promises.mkdir(args.path, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('read-file', async (event, args: { path: string; encoding: BufferEncoding }) => {
  try {
    const content = await fs.promises.readFile(args.path, args.encoding);
    return { success: true, content };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('write-file', async (event, args: { path: string; content: string }) => {
  try {
    await fs.promises.writeFile(args.path, args.content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('spawn-process', async (event, args: { command: string; options: any }) => {
  try {
    const childProcess = spawn(args.command, [], {
      detached: true,
      shell: true,
      ...args.options
    });
    childProcess.unref();
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});
