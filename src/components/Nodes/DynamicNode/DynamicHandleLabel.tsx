import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { Handle, Position, useStore } from 'reactflow';
import { useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { useConnectionContext } from '@/components/Recipe/FlowComponents/FlowTour/ConnectionContext';
import { HandleType } from '@/enums/handle-type.enum';
import { HandleSide } from '@/types/node';
import { useEdges, useFlowView } from '@/components/Recipe/FlowContext';
import { I18N_KEYS } from '@/language/keys';
import { useWorkflowStore, useUserWorkflowRole } from '@/state/workflow.state';
import { useTour } from '../../ProductTours/TourContext';
import { StepKeys, TourKeys } from '../../ProductTours/tour-keys';
import RequiredHandle from './RequiredHandle';
import { getHandleColor, getHandleName } from './HandlesUtils';

const HANDLE_Z_INDEX = 10;

const TRANSITION_DURATION = 0.2;
const TRANSITION_DELAY = 0.05;

const Circle = ({ radius, fill, style }: { radius: number; fill: string; style: React.CSSProperties }) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', pointerEvents: 'none', ...style }}
    >
      <circle cx="8" cy="8" r={radius} fill={fill} />
    </svg>
  );
};

const HandleLabelText = ({ children, color }: PropsWithChildren<{ color: string }>) => {
  return (
    <span
      style={{
        textTransform: 'capitalize',
        fontSize: '14px',
        fontFamily: 'DM Mono',
        whiteSpace: 'nowrap',
        fontWeight: 500,
        color,
      }}
    >
      {children}
    </span>
  );
};

const useNavigationTourGlow = (index: number, handleId: string, handleSide: HandleSide) => {
  const edges = useEdges();
  const { activeTour, getCurrentStepConfig, canMoveToNextStep } = useTour();
  const { currentConnection } = useConnectionContext();
  const showGlow = useMemo(() => {
    if (
      index !== 0 ||
      !activeTour ||
      activeTour !== TourKeys.NavigationTour ||
      getCurrentStepConfig()?.stepId !== StepKeys.NAVIGATION_TOUR.CONNECT_NODES ||
      canMoveToNextStep
    ) {
      return false;
    }
    const nodeId = handleId.split('-').slice(0, -2).join('-');
    const hasEdge = edges.some((edge) => edge.source === nodeId);
    if (hasEdge) {
      return false;
    }
    return (
      handleId.includes('prompt') &&
      ((currentConnection === undefined && handleSide === 'source') ||
        (currentConnection !== undefined && handleSide === 'target'))
    );
  }, [activeTour, canMoveToNextStep, currentConnection, edges, getCurrentStepConfig, handleId, handleSide, index]);
  return showGlow;
};

const formatLabel = (label: string): string => {
  return label.replaceAll('_', ' ');
};

const getHandleStyle = ({
  hasError,
  handleTop,
  index,
  handleSpace,
  handleBackgroundColor,
  handleBorderColor,
  role,
  obscureHandle,
  handlePosition,
  transitionStyle,
}: {
  hasError?: boolean;
  handleTop: string;
  index: number;
  handleSpace: number;
  handleBackgroundColor: string;
  handleBorderColor: string;
  role: 'editor' | 'guest' | null;
  obscureHandle: boolean;
  handlePosition: Position;
  transitionStyle: React.CSSProperties;
}): React.CSSProperties => {
  return {
    top: `calc(${handleTop} + ${index * handleSpace}px)`,
    backgroundColor: handleBackgroundColor,
    border: '8px solid',
    borderColor: hasError ? color.Weavy_Error : handleBorderColor,
    cursor: role === 'guest' ? 'default' : '', // Disable pointer for guests
    pointerEvents: role === 'guest' ? 'none' : 'auto',
    filter: obscureHandle ? 'brightness(0.4)' : 'none',
    left: handlePosition === Position.Left ? -16 : undefined,
    right: handlePosition === Position.Right ? -16 : undefined,
    width: '32px',
    height: '32px',
    zIndex: HANDLE_Z_INDEX,
    ...transitionStyle,
  };
};

const ENTER_DELAY = 300;
const LEAVE_DELAY = 1000;

interface DynamicHandleLabelProps {
  description?: string;
  format?: string;
  handleColor?: string;
  handleId: string;
  handlePosition: Position;
  handleSpace: number;
  handleTop: string;
  handleSide: 'source' | 'target';
  handleType?: HandleType;
  index: number;
  label: string;
  required?: boolean;
  validationErrors?: {
    required?: boolean;
    requiredEmpty?: boolean;
  };
  isSelectedNode?: boolean;
  nodeId: string;
  shouldObscureHandle?: (handleType: HandleType, handleId: string, handleSide: HandleSide) => boolean;
  shouldShowHandleLabel?: (handleType: HandleType, handleId: string, nodeId: string, handleSide: HandleSide) => boolean;
}

const DynamicHandleLabel = ({
  description,
  handleSide,
  handleId,
  handlePosition,
  handleSpace,
  handleTop,
  handleType,
  index,
  label,
  required = false,
  validationErrors,
  isSelectedNode = false,
  nodeId,
  shouldObscureHandle,
  shouldShowHandleLabel,
}: DynamicHandleLabelProps) => {
  const { t } = useTranslation();
  const textRef = useRef<HTMLElement>(null);
  const [labelLeft, setLabelLeft] = useState(-40);
  const edges = useEdges();
  const flowView = useFlowView();

  const connectionNodeId = useStore((state) => state.connectionNodeId);
  const connectionHandleId = useStore((state) => state.connectionHandleId);
  const connectionHandleType = useStore((state) => state.connectionHandleType);

  const hasTempConnection = useMemo(() => {
    if (!connectionNodeId) return false;

    // If this is the source of the temp connection (the handle we're dragging from)
    if (connectionHandleId === handleId && connectionHandleType === handleSide) {
      return true;
    }

    return false;
  }, [connectionNodeId, connectionHandleId, connectionHandleType, handleId, handleSide]);

  const hasConnection = useMemo(() => {
    const isConnected = edges.some((edge) => edge.sourceHandle === handleId || edge.targetHandle === handleId);
    return isConnected;
  }, [edges, handleId]);

  // Check if there's a connection between different handle types
  const illegalTypeConnection = useMemo(() => {
    if (handleSide === 'source') {
      return false;
    }
    const inputId = getHandleName(handleId);
    return !flowView.isInputValid(nodeId, inputId, handleType);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- edges is a dependency because we want to invalidate the memo when edges change
  }, [edges, handleId, handleSide, handleType, flowView, nodeId]);

  const role = useUserWorkflowRole();

  useEffect(() => {
    if (textRef.current) {
      const width = textRef.current.offsetWidth + 16;
      setLabelLeft(-width);
    }
  }, [label]); // Recalculate if label changes

  // navigation tour related
  const showGlow = useNavigationTourGlow(index, handleId, handleSide);

  // hide irrelevant handles when dragging a new edge
  const obscureHandle = useMemo(() => {
    if (!shouldObscureHandle) return false;
    return shouldObscureHandle(handleType || HandleType.Any, handleId, handleSide);
  }, [handleType, handleId, handleSide, shouldObscureHandle]);

  // highlight relevant handles when dragging a new edge
  const showLabel = useMemo(() => {
    if (!shouldShowHandleLabel) return false;
    return shouldShowHandleLabel(handleType || HandleType.Any, handleId, nodeId || '', handleSide);
  }, [handleType, handleId, nodeId, handleSide, shouldShowHandleLabel]);

  const { handleBackgroundColor, handleBorderColor, transitionStyle, showLabelStyle } = useMemo(() => {
    const handleBackgroundColor = getHandleColor(handleType || HandleType.Any);
    const handleBorderColor = isSelectedNode ? color.Black88 : color.Black92;

    const transitionStyle = {
      transition: `all ${TRANSITION_DURATION}s ease-in-out`,
      transitionDelay: `${index * TRANSITION_DELAY}s`,
    };
    const showLabelStyle = {
      opacity: showLabel ? 1 : 0,
      pointerEvents: showLabel ? 'auto' : 'none',
      cursor: showLabel ? 'auto' : 'default',
    };

    return { handleBackgroundColor, handleBorderColor, transitionStyle, showLabelStyle };
  }, [handleType, showLabel, index, isSelectedNode]);

  const setInvalidConnection = useWorkflowStore((state) => state.setInvalidConnection);
  const cyclicInvalidConnection = useWorkflowStore(
    (state) => state.invalidConnection?.errorId === 'cyclic' && state.invalidConnection.targetHandle === handleId,
  );

  const outerTooltip = useMemo(() => {
    if (cyclicInvalidConnection) {
      return (
        <Typography variant="body-sm-rg">{t(I18N_KEYS.RECIPE_MAIN.NODES.NODE_HANDLES.CYCLIC_CONNECTION)}</Typography>
      );
    }

    const messages: string[] = [];
    if (validationErrors?.required) {
      messages.push(t(I18N_KEYS.RECIPE_MAIN.NODES.NODE_HANDLES.REQUIRED_VALIDATION_ERROR));
    }
    if (validationErrors?.requiredEmpty) {
      messages.push(t(I18N_KEYS.RECIPE_MAIN.NODES.NODE_HANDLES.EMPTY_REQUIRED_VALIDATION_ERROR));
    }
    if (illegalTypeConnection) {
      messages.push(t(I18N_KEYS.RECIPE_MAIN.NODES.NODE_HANDLES.ILLEGAL_TYPE_CONNECTION));
    }

    if (messages.length === 0) {
      return undefined;
    }
    return (
      <Typography variant="body-sm-rg" sx={{ whiteSpace: 'pre-line' }}>
        {messages.join('\n')}
      </Typography>
    );
  }, [cyclicInvalidConnection, illegalTypeConnection, t, validationErrors?.required, validationErrors?.requiredEmpty]);

  return (
    <Tooltip
      title={outerTooltip}
      placement="top"
      enterDelay={ENTER_DELAY}
      onClose={cyclicInvalidConnection ? () => setInvalidConnection(null) : undefined}
      leaveDelay={cyclicInvalidConnection ? LEAVE_DELAY : undefined}
    >
      <Handle
        type={handleSide}
        position={handlePosition}
        style={getHandleStyle({
          hasError: validationErrors?.required || validationErrors?.requiredEmpty || illegalTypeConnection,
          handleTop,
          index,
          handleSpace,
          handleBackgroundColor,
          handleBorderColor,
          role,
          obscureHandle,
          handlePosition,
          transitionStyle,
        })}
        id={handleId}
        className={showGlow ? 'source-handle-glow' : ''}
      >
        {required && !hasConnection ? (
          <RequiredHandle
            size={12}
            color={validationErrors?.required ? color.Weavy_Error : handleBorderColor}
            style={{
              position: 'absolute',
              zIndex: 2,
              pointerEvents: 'none',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ) : (
          <Circle radius={5} fill={handleBorderColor} style={{ zIndex: 2 }} />
        )}
        {(hasConnection || hasTempConnection) && (
          <Circle radius={3} fill={handleBackgroundColor} style={{ zIndex: 3 }} />
        )}
        {handlePosition === Position.Left ? (
          <Tooltip title={outerTooltip ? undefined : description} placement="right-start" enterDelay={800}>
            <Box
              sx={{
                position: 'relative',
                left: labelLeft,
                top: -20,
                width: 'fit-content',
                ...showLabelStyle,
                ...transitionStyle,
              }}
              ref={textRef}
            >
              <HandleLabelText
                color={
                  validationErrors?.required || validationErrors?.requiredEmpty || illegalTypeConnection
                    ? color.Weavy_Error
                    : handleBackgroundColor
                }
              >
                {formatLabel(label)}
                {required ? <sup style={{ color: 'inherit' }}>*</sup> : null}
              </HandleLabelText>
            </Box>
          </Tooltip>
        ) : (
          <Box
            sx={{
              position: 'relative',
              left: 30,
              top: -20,
              width: 'fit-content',
              ...showLabelStyle,
              ...transitionStyle,
            }}
            ref={textRef}
          >
            <HandleLabelText color={handleBackgroundColor}>{formatLabel(label)}</HandleLabelText>
          </Box>
        )}
      </Handle>
    </Tooltip>
  );
};

export default DynamicHandleLabel;
