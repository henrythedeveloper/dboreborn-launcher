import React, { createContext, useContext } from 'react';
import { Game, LocalConfig, RemoteConfig } from '../../types';


export interface NewsItem {
    id: number;
    title: string;
    date: string; 
    content: string;
    gameId: string;
    type: 'news' | 'patch';
    imageUrl?: string;
}

interface AppContextType {
  configLocal: LocalConfig | null;
  configRemote: RemoteConfig | null;
  gameInfo: Game | null;
  isUpdating: boolean;
  setIsUpdating: (isUpdating: boolean) => void;
  setGameInfo: (gameInfo: Game | null) => void;
  setConfigRemote: (configRemote: RemoteConfig | null) => void;
  newsItems?: NewsItem[];
  setNewsItems?: (news: NewsItem[]) => void;
}

// Default values
const defaultContext: AppContextType = {
  configLocal: null,
  configRemote: null,
  gameInfo: null,
  isUpdating: false,
  setIsUpdating: () => {},
  setGameInfo: () => {},
  setConfigRemote: () => {},
  newsItems: [],
  setNewsItems: () => {}
};

// Create the context
export const AppContext = createContext<AppContextType>(defaultContext);

// Context provider component
interface AppContextProviderProps {
  children: React.ReactNode;
  value: Partial<AppContextType>;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ 
  children, 
  value 
}) => {
  // Merge provided values with defaults
  const contextValue = {
    ...defaultContext,
    ...value
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the context
export const useAppContext = () => useContext(AppContext);