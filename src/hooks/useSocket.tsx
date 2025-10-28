import { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import noop from 'lodash/noop';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { AuthContext } from '@/contexts/AuthContext';
import { useAuthConfig } from '@/hooks/useAuthConfig';
import { BASE_SERVER_URL } from '@/globals';
import { ClientToServerEvents, ServerToClientEvents } from '@/types/api/socket';
import { HelloEventData } from '@/types/api/socket/hello-example-event';
import { log } from '@/logger/logger.ts';
import { useUserWorkflowRole, useWorkflowStore } from '@/state/workflow.state';
import { FF_LOG_SOCKET_EVENTS, FF_SOCKET_RECONNECTION_ISSUE } from '@/consts/featureFlags';

const logger = log.getLogger('SocketContext');

const WORKFLOW_NAMESPACE = '/workflow';

const SocketContext = createContext<{
  sendHello: (event: HelloEventData) => void;
  addListener: <T extends keyof ListenerMap>(event: T, listener: ListenerMap[T][number]) => void;
  getIsConnected: () => boolean;
  reconnect: () => void;
  recreateSocket: () => void;
}>({
  sendHello: noop,
  addListener: noop,
  getIsConnected: () => false,
  reconnect: noop,
  recreateSocket: noop,
});

type ListenerMap = {
  [key in keyof ServerToClientEvents]: ServerToClientEvents[key][];
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [recreateTrigger, setRecreateTrigger] = useState(0);
  const listeners = useRef<ListenerMap>({
    batch_run_status: [],
  });
  const { currentUser } = useContext(AuthContext);
  const { provider } = useAuthConfig();
  const role = useUserWorkflowRole();
  const recipeId = useWorkflowStore((state) => state.recipe?.id);
  const FF_isSocketReconnectionIssue = useFeatureFlagEnabled(FF_SOCKET_RECONNECTION_ISSUE);
  const FF_isLogSocketEvents = useFeatureFlagEnabled(FF_LOG_SOCKET_EVENTS);

  const addListener = useCallback(<T extends keyof ListenerMap>(event: T, listener: ListenerMap[T][number]) => {
    const currentListeners = listeners.current[event];
    listeners.current[event] = [...currentListeners, listener] as ListenerMap[T];
    return () => {
      const newListeners = listeners.current[event].filter((l) => l !== listener);
      listeners.current[event] = newListeners as ListenerMap[T];
    };
  }, []);

  const initListeners = useCallback(
    (socket: Socket<ServerToClientEvents, ClientToServerEvents>) => {
      socket.on('connect', () => {
        if (FF_isLogSocketEvents || FF_isSocketReconnectionIssue) {
          // TODO: when removing FF_isSocketReconnectionIssue, keep the log flag for debug
          logger.info('Socket: connect', `recovered: ${socket.recovered}`);
        }
      });
      socket.on('connect_error', (error) => {
        if (FF_isLogSocketEvents || FF_isSocketReconnectionIssue) {
          logger.info('Socket: connect_error', { error });
        }
      });
      socket.on('disconnect', (reason, description) => {
        if (FF_isLogSocketEvents || FF_isSocketReconnectionIssue) {
          logger.info(`Socket: disconnected. Reason: ${reason}`, { description });
        }
        // if (reason === 'io server disconnect') {
        //   if (isLoggingSocketEvents) {
        //     logger.info('Socket: reconnecting on io server disconnect');
        //   }
        //   try {
        //     socket.connect();
        //   } catch (error) {
        //     logger.error('Error connecting socket after disconnect', error);
        //   }
        // }
      });
      socket.on('batch_run_status', (data) => {
        if (FF_isLogSocketEvents || FF_isSocketReconnectionIssue) {
          logger.info('Socket: batch_run_status', data);
        }
        listeners.current.batch_run_status.forEach((listener) => listener(data));
      });
    },
    [FF_isLogSocketEvents, FF_isSocketReconnectionIssue],
  );

  const destroyListeners = useCallback((socket: Socket<ServerToClientEvents, ClientToServerEvents>) => {
    socket.off('connect');
    socket.off('connect_error');
    socket.off('disconnect');
    socket.off('batch_run_status');
  }, []);

  useEffect(() => {
    if (!currentUser?.accessToken || role === 'guest' || !recipeId) {
      return;
    }

    const workflowSocket = io(BASE_SERVER_URL + WORKFLOW_NAMESPACE, {
      withCredentials: true,
      auth: {
        token: currentUser?.accessToken,
        provider: provider,
      },
      query: { recipeId },
      transports: ['websocket'],
    });
    initListeners(workflowSocket);
    setSocket(workflowSocket);

    return () => {
      destroyListeners(workflowSocket);
      workflowSocket.disconnect();
      setSocket(null);
    };
  }, [currentUser?.accessToken, initListeners, destroyListeners, role, recipeId, provider, recreateTrigger]);

  // Example
  const sendHello = useCallback((data: HelloEventData) => socket?.emit('hello', data), [socket]);

  const getIsConnected = useCallback(() => {
    return socket?.connected ?? false;
  }, [socket]);

  const reconnect = useCallback(() => {
    if (socket && !socket.connected) {
      try {
        socket.connect();
      } catch (error) {
        logger.error('Error reconnecting socket', error);
      }
    }
  }, [socket]);

  const recreateSocket = useCallback(() => {
    logger.info('Recreating socket completely');
    setRecreateTrigger((prev) => prev + 1);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        sendHello,
        addListener,
        getIsConnected,
        reconnect,
        recreateSocket,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
