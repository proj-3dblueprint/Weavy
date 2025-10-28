import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface DebugContextType {
  IS_DEBUG: boolean;
  DEBUG_TOGGLE: () => void;
}

const KEY = 'WEAVY_DEBUG';

// Default context value (will be overridden by the provider)
const DebugContext = createContext<DebugContextType | undefined>(undefined);

// Provider component that will wrap your application
export const DebugProvider = ({ children }: { children: ReactNode }) => {
  const [IS_DEBUG, setIsDebug] = useState<boolean>(() => localStorage.getItem(KEY) === 'true');

  const DEBUG_TOGGLE = () => {
    localStorage.setItem(KEY, String(!IS_DEBUG));
    setIsDebug(!IS_DEBUG);
  };

  // Update state if localStorage changes (in case it's modified elsewhere)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === KEY) {
        setIsDebug(String(event.newValue) === 'true');
      }
    };

    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Clean up event listener
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Value to be provided to consuming components
  const contextValue: DebugContextType = {
    IS_DEBUG,
    DEBUG_TOGGLE,
  };

  return <DebugContext.Provider value={contextValue}>{children}</DebugContext.Provider>;
};

// Custom hook to use the debug context
export const useDebugContext = (): DebugContextType => {
  const context = useContext(DebugContext);

  if (context === undefined) {
    throw new Error('useDebugContext must be used within a DebugProvider');
  }

  return context;
};
