import { RemoteConfig } from '../../types';
import { addCacheBustingSuffix } from './addCacheBustingSuffix';

export const getConfigFileRemote = async (url: string): Promise<RemoteConfig | null> => {
    try {
        const urlWithCacheBusting = addCacheBustingSuffix(url);
        const response = await fetch(urlWithCacheBusting);
        if (!response.ok) {
            throw new Error('Failed to fetch JSON');
        }
        const data: RemoteConfig = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching JSON:', (error as Error).message);
        return null;
    }
};