/**
 * Utility functions for working with launcher custom events
 */

// Event types
export type LauncherEventType = 'launcher-status-update' | 'launcher-game-ready' | 'launcher-global-status';

/**
 * Dispatches a launcher status update event
 * @param status The status message to display
 */
export const dispatchStatusUpdate = (status: string): void => {
  const event = new CustomEvent('launcher-status-update', { 
    detail: { status }
  });
  window.dispatchEvent(event);
};

/**
 * Dispatches a global status update event (for initial setup screen)
 * @param status The status message to display
 */
export const dispatchGlobalStatus = (status: string): void => {
  const event = new CustomEvent('launcher-global-status', { 
    detail: { status }
  });
  window.dispatchEvent(event);
};

/**
 * Dispatches a game ready event
 */
export const dispatchGameReady = (): void => {
  const event = new CustomEvent('launcher-game-ready');
  window.dispatchEvent(event);
};

/**
 * Adds an event listener for launcher events
 * @param eventType The event type to listen for
 * @param callback The callback function to execute
 */
export const addLauncherEventListener = (
  eventType: LauncherEventType, 
  callback: (detail: any) => void
): () => void => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail);
  };
  
  window.addEventListener(eventType, handler);
  
  // Return a cleanup function
  return () => {
    window.removeEventListener(eventType, handler);
  };
};

/**
 * Helper to create a type-safe event listener hook in components
 * @param eventType The event type to listen for
 * @param callback The callback function to execute
 */
export const createLauncherEventListener = (
  eventType: LauncherEventType,
  callback: (detail: any) => void
): (() => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail);
  };
  
  window.addEventListener(eventType, handler);
  
  // Return a cleanup function
  return () => {
    window.removeEventListener(eventType, handler);
  };
};