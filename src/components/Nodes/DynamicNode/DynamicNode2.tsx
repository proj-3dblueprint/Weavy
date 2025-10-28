import React, { useEffect, useRef, useState, useCallback, useMemo, type PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Link, Tooltip, Fade, SxProps } from '@mui/material';
import { useShallow } from 'zustand/react/shallow';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenVer, FlexColCenHorVer } from '@/UI/styles';
import { useDebugContext } from '@/hooks/useDebugContext';
import { useEdges, useFlowView, useNodeNullable } from '@/components/Recipe/FlowContext';
import { color } from '@/colors';
import { HandleType } from '@/enums/handle-type.enum';
import { useConnectionContext } from '@/components/Recipe/FlowComponents/FlowTour/ConnectionContext';
import { useIsHovered } from '@/hooks/useIsHovered';
import { useWorkflowStore, useUserWorkflowRole } from '@/state/workflow.state';
import { FF_KEY_NAVIGATION } from '@/consts/featureFlags';
import { getHandleId } from '../Utils';
import { MenuAction } from '../../Menu/Actions';
import { NavigationKeyBadge } from '../NavigationKeyBadge';
import { DynamicNodeHandles } from './DynamicNodeHandles';
import { DynamicNodeTitle } from './DynamicNodeTitle';
import { DynamicNodeDebugWindow } from './NodeDebugWindow';
import type { BaseNodeData, HandleSide, Handle } from '@/types/node';

const TRANSITION_DURATION = '0.1s';

function useLockedTooltip({
  nodeRef,
  isLocked,
  role,
}: {
  nodeRef: React.RefObject<HTMLDivElement>;
  id: string;
  isLocked?: boolean;
  role: 'guest' | 'editor' | null;
}) {
  const [showIsLockedTooltip, setShowIsLockedTooltip] = useState(false);
  const [, setInteractionWhileLockedCount] = useState(0);
  const handleLockedInteraction = useCallback(() => {
    if (isLocked && role !== 'guest') {
      setInteractionWhileLockedCount((prev) => {
        const newCount = prev + 1;
        if (newCount === 4) {
          setShowIsLockedTooltip(true);
          return 0; // Reset counter after showing tooltip
        }
        return newCount;
      });
    }
  }, [isLocked, role]);

  const handleTooltipClose = useCallback(() => {
    setShowIsLockedTooltip(false);
  }, []);

  useEffect(() => {
    if (!isLocked) {
      setShowIsLockedTooltip(false);
    }
  }, [isLocked]);

  // Add handlers for both click and mousedown (drag attempt)
  useEffect(() => {
    const nodeElement = nodeRef.current;
    if (nodeElement) {
      nodeElement.addEventListener('mousedown', handleLockedInteraction);

      return () => {
        nodeElement.removeEventListener('mousedown', handleLockedInteraction);
      };
    }
  }, [handleLockedInteraction, nodeRef]);

  return { showIsLockedTooltip, handleTooltipClose };
}

interface DynamicNodeChildProps {
  isSelected?: boolean;
}

type DynamicNode2Props = PropsWithChildren<{
  additionalMenu?: MenuAction[];
  className?: string;
  data: BaseNodeData & { model?: { name?: string } };
  handleColor?: string;
  hideBody?: boolean;
  hideHandles?: boolean;
  hideTitle?: boolean;
  icon?: React.ReactNode;
  id: string;
  inputHandleYPos?: string;
  menuHeader?: React.ReactNode;
  outputHandleYPos?: string;
  overrideShowFullNode?: boolean;
  size?: 'small' | 'medium' | 'large';
  sx?: SxProps;
}>;

export const DynamicNode2 = ({
  additionalMenu,
  children,
  className,
  data,
  handleColor,
  hideBody,
  hideHandles = false,
  hideTitle = false,
  icon,
  id,
  inputHandleYPos,
  menuHeader,
  outputHandleYPos,
  overrideShowFullNode = false,
  size = 'large',
  sx,
}: DynamicNode2Props) => {
  const role = useUserWorkflowRole();

  const { t } = useTranslation();

  const ff_isKeyNavigationEnabled = useFeatureFlagEnabled(FF_KEY_NAVIGATION);

  // get the current node type / remove this after rollout
  const node = useNodeNullable(id);
  const currentNodeType = node?.type;

  const { isHovered, ...elementProps } = useIsHovered();

  const isSelected = node?.selected;

  const showFullNode = useMemo(() => isSelected || overrideShowFullNode, [isSelected, overrideShowFullNode]);

  const { handles, version } = data;

  // Required inputs validation
  const edges = useEdges();
  const nodeInputEdges = useMemo(() => {
    return edges.filter((edge) => edge.target === id).map((edge) => edge.id);
  }, [edges, id]);
  const prevNodeInputEdges = useRef<string[]>(nodeInputEdges);

  const missingRequiredInputs = useWorkflowStore(
    useShallow((state) => state.nodeValidation[id]?.missingRequiredInputs?.extraInfo.keys),
  );

  const emptyRequiredInputs = useWorkflowStore(
    useShallow((state) => state.nodeValidation[id]?.emptyRequiredInputs?.extraInfo.keys),
  );

  const removeNodeValidationByType = useWorkflowStore((state) => state.removeNodeValidationByType);

  useEffect(() => {
    const sortedPrevNodeInputEdges = sortBy(prevNodeInputEdges.current);
    const sortedNodeInputEdges = sortBy(nodeInputEdges);
    if (isEqual(sortedPrevNodeInputEdges, sortedNodeInputEdges)) return;
    prevNodeInputEdges.current = nodeInputEdges;
    // recheck validation on input change
    removeNodeValidationByType(id, 'missingRequiredInputs');
    removeNodeValidationByType(id, 'emptyRequiredInputs');
  }, [id, nodeInputEdges, removeNodeValidationByType]);

  // node locked indication
  const nodeRef = useRef<HTMLDivElement>(null);

  const { IS_DEBUG } = useDebugContext();

  const flowView = useFlowView();
  const selectNodeById = useCallback((nodeId: string) => (flowView.selectedNodes = [nodeId]), [flowView]);
  const handleClickOnNode = useCallback(() => selectNodeById(id), [id, selectNodeById]);
  const handleToggleLock = useCallback(() => flowView.toggleLockNode(id), [id, flowView]);

  const { showIsLockedTooltip, handleTooltipClose } = useLockedTooltip({ nodeRef, id, isLocked: data.isLocked, role });

  const copyId = useCallback(() => {
    void navigator.clipboard.writeText(id);
  }, [id]);

  // sort handles by its order
  const sortedInputHandles = useMemo(() => {
    const inputHandles = handles?.input;
    return inputHandles && !Array.isArray(inputHandles)
      ? Object.entries(inputHandles).sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
      : inputHandles || [];
  }, [handles?.input]);

  const sortedOutputHandles = useMemo(() => {
    const outputHandles = handles?.output;
    return outputHandles && !Array.isArray(outputHandles)
      ? Object.entries(outputHandles).sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
      : outputHandles || [];
  }, [handles?.output]);

  const { currentConnection } = useConnectionContext();

  /// hide irrelevant handles when dragging a new edge
  const shouldObscureHandle = useCallback(
    (handleType: HandleType, handleId: string, handleSide: HandleSide) => {
      if (currentConnection?.nodeId === id && currentConnection?.handleSide !== handleSide) return true; // obscure - same node other side
      if (currentConnection?.handleId === handleId) return false; // dont obscure from the current handle
      if (currentConnection?.handleSide === handleSide) return true; // obscure all handles that are on the same side - target cannot connect to target
      if (handleType === HandleType.Any || currentConnection?.handleType === HandleType.Any) return false; // if not type, don't obscure
      return Boolean(
        // obscure all handles that are not the same type and not the same handle
        currentConnection?.handleType &&
          currentConnection.handleType !== handleType &&
          currentConnection.handleId !== handleId,
      );
    },
    [currentConnection, id],
  );

  const shouldObscureNode = useMemo(() => {
    if (
      !currentConnection ||
      !currentConnection.handleType ||
      currentConnection.handleType === HandleType.Any ||
      currentConnection.nodeId === id
    ) {
      return false;
    }

    // Get all input and output handles
    const allInputHandles = sortedInputHandles.map((item: string | [string, Handle]) => {
      const key = typeof item === 'string' ? item : item[0];
      return {
        handleId: getHandleId(id, 'input', key),
        handleType: (handles?.input?.[key]?.type as HandleType) || HandleType.Any,
        handleSide: 'target' as HandleSide,
      };
    });

    const allOutputHandles = sortedOutputHandles.map((item: string | [string, Handle]) => {
      const key = typeof item === 'string' ? item : item[0];
      return {
        handleId: getHandleId(id, 'output', key),
        handleType: (handles?.output?.[key]?.type as HandleType) || HandleType.Any,
        handleSide: 'source' as HandleSide,
      };
    });

    // Check if all handles should be obscured
    const allHandlesObscured = [...allInputHandles, ...allOutputHandles].every(
      ({ handleId, handleType, handleSide }) =>
        handleType !== HandleType.Any && shouldObscureHandle(handleType, handleId, handleSide),
    );

    // Only set obscureNode to true if there are handles and all are obscured
    return (allInputHandles.length > 0 || allOutputHandles.length > 0) && allHandlesObscured;
  }, [currentConnection, id, shouldObscureHandle, sortedInputHandles, sortedOutputHandles, handles]);

  return (
    <Tooltip
      title={
        showIsLockedTooltip ? (
          <FlexCenVer>
            {`${t(I18N_KEYS.RECIPE_MAIN.NODES.LOCKED.THIS_NODE_IS_LOCKED)}`}&nbsp;
            <Link onClick={handleToggleLock}>{`${t(I18N_KEYS.RECIPE_MAIN.NODES.LOCKED.CLICK_TO_UNLOCK)}`}</Link>
          </FlexCenVer>
        ) : (
          ''
        )
      }
      onMouseDown={handleClickOnNode}
      placement="top"
      open={showIsLockedTooltip}
      onClose={handleTooltipClose}
      leaveDelay={500}
      slots={{ transition: Fade }}
    >
      <FlexColCenHorVer
        {...elementProps}
        ref={nodeRef}
        className={`${className || ''} node-header`}
        sx={{
          position: 'relative',
          cursor: role === 'guest' || !showFullNode ? 'default' : 'grab',
          minHeight: 50,
          width: size === 'small' ? 250 : 460,
          background: isSelected ? color.Black88 : color.Black92,
          border: `2px solid ${isSelected ? color.White04_T : 'transparent'}`,
          transition: `all ${TRANSITION_DURATION} ease-in-out`,
          p: 2,
          filter: shouldObscureNode ? 'brightness(0.4)' : 'none',
          borderRadius: size === 'small' ? 2 : 4,
          ...(sx || {}),
        }}
      >
        {ff_isKeyNavigationEnabled && <NavigationKeyBadge nodeId={id} />}
        {IS_DEBUG ? (
          <Box sx={{ cursor: 'copy', mt: 1 }} onClick={copyId}>
            ID: {id} version 2 {currentNodeType}
          </Box>
        ) : null}
        {!hideTitle && (
          <DynamicNodeTitle
            additionalMenu={additionalMenu}
            data={data}
            hideBody={hideBody}
            icon={icon}
            id={id}
            menuHeader={menuHeader}
            showFullNode={showFullNode}
          />
        )}

        {!hideBody && (
          <Box
            className="node-content"
            sx={{
              width: '100%',
              position: 'relative',
              cursor: showFullNode ? '' : 'pointer',
            }}
          >
            {React.Children.map(children, (child) => {
              if (!React.isValidElement(child)) {
                return child;
              }
              if (typeof child.type === 'function') {
                return React.cloneElement(child as React.ReactElement<DynamicNodeChildProps>, {
                  isSelected: true,
                });
              }
              return child;
            })}
          </Box>
        )}
        {!hideHandles && (
          <DynamicNodeHandles
            handleColor={handleColor}
            handles={handles}
            id={id}
            inputHandleYPos={inputHandleYPos}
            isHovered={isHovered}
            isSelected={isSelected}
            nodeType={currentNodeType}
            outputHandleYPos={outputHandleYPos}
            shouldObscureHandle={shouldObscureHandle}
            showFullNode={showFullNode}
            sortedInputHandles={sortedInputHandles as [string, Handle][]}
            sortedOutputHandles={sortedOutputHandles as [string, Handle][]}
            invalidHandles={{
              required: missingRequiredInputs,
              requiredEmpty: emptyRequiredInputs,
            }}
            version={version}
          />
        )}
        {IS_DEBUG && <DynamicNodeDebugWindow data={data} />}
      </FlexColCenHorVer>
    </Tooltip>
  );
};
