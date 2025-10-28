import { useCallback, useLayoutEffect, useRef } from 'react';
import { useKeyState } from '@/hooks/useKeyState';
import { useVirtualElement } from '@/hooks/useVirtualElement';
import { useConnectionContext, type Connection } from '../FlowComponents/FlowTour/ConnectionContext';
import { useFlowView, useNodes } from '../FlowContext';
import { useUserPreferences } from './useUserPreferences';
import type { OnConnect, OnConnectEnd, OnConnectStart, Edge } from 'reactflow';
import type { HandleType } from '@/enums/handle-type.enum';

interface UseSuggestionMenuProps {
  setFloatMenu: (menu: { isOpen: boolean; mouseX: number; mouseY: number; connection?: Connection }) => void;
}

export const useSuggestionMenu = ({ setFloatMenu }: UseSuggestionMenuProps) => {
  const [altModifier, setAltModifier] = useKeyState('Alt');
  const nodes = useNodes();
  const { currentConnection, setCurrentConnection } = useConnectionContext();
  const { userPrefRequireAltKeyForSuggestions } = useUserPreferences();
  const isConnectionSuccessfulRef = useRef(false);
  const wasEdgeDisconnectedRef = useRef(false);
  const flowView = useFlowView();

  const getSuggestions = useCallback(
    ({ clientX, clientY }: { clientX: number; clientY: number }, connection?: Connection) => {
      if (!connection) {
        return;
      }
      setFloatMenu({
        isOpen: true,
        mouseX: clientX,
        mouseY: clientY,
        connection: {
          handleSide: connection.handleSide,
          handleType: connection.handleType,
          nodeId: connection.nodeId,
          handleId: connection.handleId,
        },
      });
      setAltModifier(false);
    },
    [setFloatMenu, setAltModifier],
  );

  const onConnectStart: OnConnectStart = useCallback(
    (_event, params) => {
      // Reset the connection success flag when starting a new connection
      isConnectionSuccessfulRef.current = false;

      const sourceNode = nodes.find((node) => node.id === params.nodeId);
      if (!sourceNode) {
        return;
      }
      const { version, handles } = sourceNode.data;
      let handleType: HandleType | undefined;
      const handleSide = params?.handleType;
      if (version === 3) {
        if (params.handleId?.includes('-output-') && !Array.isArray(handles.output)) {
          const handleKey = params.handleId.split('-output-')[1];
          handleType = flowView.nodeOutputType(sourceNode.id, handleKey) || handles.output[handleKey].type;
        }
        if (params.handleId?.includes('-input-') && !Array.isArray(handles.input)) {
          const handleKey = params.handleId.split('-input-')[1];
          handleType = flowView.nodeInputType(sourceNode.id, handleKey) || handles.input[handleKey].type;
        }
      }
      setCurrentConnection(
        params
          ? {
              nodeId: params.nodeId,
              handleId: params.handleId,
              handleSide: handleSide,
              handleType: handleType || null,
            }
          : undefined,
      );
    },
    [nodes, setCurrentConnection],
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!(event.target instanceof Element)) {
        return;
      }
      let clientX: number;
      let clientY: number;
      if ('touches' in event && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else if ('clientX' in event && 'clientY' in event) {
        clientX = event.clientX;
        clientY = event.clientY;
      } else {
        return;
      }
      const isTargetPane = event.target.classList.contains('react-flow__pane');
      // Show suggestions if dropping on empty space (not on a handle), connection was not successful, and either alt key is pressed OR user preference doesn't require alt key
      if (
        isTargetPane &&
        !isConnectionSuccessfulRef.current &&
        !wasEdgeDisconnectedRef.current &&
        (altModifier || !userPrefRequireAltKeyForSuggestions)
      ) {
        getSuggestions({ clientX, clientY }, currentConnection);
      }
      setCurrentConnection(undefined);
      // Reset the connection success flag after checking
      isConnectionSuccessfulRef.current = false;
      wasEdgeDisconnectedRef.current = false;
    },
    [altModifier, setCurrentConnection, getSuggestions, currentConnection, userPrefRequireAltKeyForSuggestions],
  );

  const [virtualElement, setVirtualElement] = useVirtualElement();

  useLayoutEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setVirtualElement(event.clientX, event.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [setVirtualElement]);

  const onConnect: OnConnect = useCallback(() => {
    // Mark connection as successful when onConnect is called and reset the edge disconnected flag
    isConnectionSuccessfulRef.current = true;
    wasEdgeDisconnectedRef.current = false;
  }, []);

  const onEdgeUpdateStart = useCallback((_event, edge: Edge) => {
    if (edge.source && edge.target) {
      wasEdgeDisconnectedRef.current = true;
    }
  }, []);

  return {
    setAltModifier,
    anchorEl: virtualElement,
    isTooltipOpen: Boolean(altModifier && userPrefRequireAltKeyForSuggestions && currentConnection),
    onConnectStart,
    onConnectEnd,
    onConnect,
    onEdgeUpdateStart,
  };
};
