// src/renderer/utils/debug.ts

let debugMode = false;
const logs: string[] = [];

export const enableDebugMode = (): void => {
  debugMode = true;
  log('Debug mode enabled');
};

export const log = (message: string, data?: any): void => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  if (data) {
    console.log(logMessage, data);
    logs.push(`${logMessage} ${JSON.stringify(data)}`);
  } else {
    console.log(logMessage);
    logs.push(logMessage);
  }
};

export const getDebugLogs = (): string[] => {
  return [...logs];
};

export const isDebugMode = (): boolean => {
  return debugMode;
};

export const saveLogsToFile = async (): Promise<boolean> => {
  try {
    const currentDir = window.electronAPI.sendSync("get-file-path", "");
    const logPath = `${currentDir}\\launcher-debug.log`;
    const logContent = logs.join('\n');
    
    const result = await window.electronAPI.writeFile({ 
      path: logPath, 
      content: logContent 
    });
    
    return result.success;
  } catch (error) {
    console.error('Failed to save logs:', error);
    return false;
  }
};