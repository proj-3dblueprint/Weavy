import { createContext, useContext, useState } from 'react';
import { HandleType } from '@/enums/handle-type.enum';

export interface Connection {
  nodeId: string | null;
  handleId: string | null;
  handleSide: 'source' | 'target' | null;
  handleType: HandleType | null;
}

const ConnectionContext = createContext<{
  currentConnection?: Connection;
  setCurrentConnection: (connection?: Connection) => void;
}>({ currentConnection: undefined, setCurrentConnection: () => {} });

// Create a hook to use the media context
export const useConnectionContext = () => useContext(ConnectionContext);

export const ConnectionProvider = ({ children }) => {
  const [current, setCurrent] = useState<Connection | undefined>(undefined);

  return (
    <ConnectionContext.Provider
      value={{
        currentConnection: current,
        setCurrentConnection: setCurrent,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};
