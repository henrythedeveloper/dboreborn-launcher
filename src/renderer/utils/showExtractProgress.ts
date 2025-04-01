import { Game, ExtractionProgress } from "../../types";
import { showText } from "./showText";

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