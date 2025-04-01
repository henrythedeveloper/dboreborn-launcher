import { ExtractionProgress } from "../../types";

export const extract7zFile = async (
  archivePath: string, 
  outputDir: string, 
  progressCallback: (progress: ExtractionProgress) => void
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    // Register progress callback
    const progressHandler = (progress: ExtractionProgress) => {
      progressCallback(progress);
    };
    
    // Add listener for extraction progress
    window.electronAPI.onExtractionProgress(progressHandler);
    
    // Start extraction
    window.electronAPI.extract7z(archivePath, outputDir)
      .then(() => {
        // Cleanup and resolve
        window.electronAPI.removeExtractionListener(progressHandler);
        resolve();
      })
      .catch((error) => {
        // Cleanup and reject
        window.electronAPI.removeExtractionListener(progressHandler);
        console.error('Extraction error:', error);
        reject(error);
      });
  });
};