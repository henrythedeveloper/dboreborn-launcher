export const addCacheBustingSuffix = (url: string): string => {
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${randomNumber}`;
};