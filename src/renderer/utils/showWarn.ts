export const showWarn = (warning: string | Error): void => {
    window.electronAPI.sendMessage('show-warn', warning);
};