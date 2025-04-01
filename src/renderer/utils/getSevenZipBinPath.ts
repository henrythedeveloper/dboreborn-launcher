const isDevelopment = process.env.NODE_ENV !== "production";

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