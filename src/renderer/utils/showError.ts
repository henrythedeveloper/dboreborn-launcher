export const showError = (error: string | Error): void => {
    window.electronAPI.sendMessage('show-error', error);
};