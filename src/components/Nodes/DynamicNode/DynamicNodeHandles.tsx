import { Position } from 'reactflow';
import { useCallback, useMemo } from 'react';
import { InputId, OutputId } from 'web';
import { HandleType } from '@/enums/handle-type.enum';
import { useFlowView } from '@/components/Recipe/FlowContext';
import { useConnectionContext } from '@/components/Recipe/FlowComponents/FlowTour/ConnectionContext';
import { NodeType } from '@/components/Recipe/FlowGraph';
import { getHandleId } from '../Utils';
import DynamicHandleLabel from './DynamicHandleLabel';
import { getInputHandleUI, getOutputHandleUI, NodeParameterUI } from './nodeUI';
import type { BaseNodeData, Handle, HandleSide } from '@/types/node';

const HANDLE_TOP = '90px';
const HANDLE_SPACING = 55;

function getInputHandle(nodeType: NodeType | undefined, key: InputId): NodeParameterUI | undefined {
  return nodeType ? getInputHandleUI(nodeType, key) : undefined;
}
function getOutputHandle(nodeType: NodeType | undefined, key: OutputId): NodeParameterUI | undefined {
  return nodeType ? getOutputHandleUI(nodeType, key) : undefined;
}

interface DynamicNodeHandlesProps {
  handleColor?: string;
  handles: BaseNodeData['handles'];
  id: string;
  inputHandleYPos?: string;
  isHovered: boolean;
  isSelected?: boolean;
  nodeType?: string;
  outputHandleYPos?: string;
  shouldObscureHandle?: (handleType: HandleType, handleId: string, handleSide: HandleSide) => boolean;
  showFullNode: boolean;
  sortedInputHandles: [string, Handle][];
  sortedOutputHandles: [string, Handle][];
  invalidHandles?: {
    required?: string[];
    requiredEmpty?: string[];
  };
  version?: number;
}

export const DynamicNodeHandles = ({
  handleColor,
  handles,
  id,
  inputHandleYPos,
  isHovered,
  isSelected,
  nodeType,
  outputHandleYPos,
  shouldObscureHandle,
  showFullNode,
  sortedInputHandles,
  sortedOutputHandles,
  invalidHandles,
  version,
}: DynamicNodeHandlesProps) => {
  const flowView = useFlowView();
  const { currentConnection } = useConnectionContext();

  /// highlight relevant handles when dragging a new edge
  const shouldShowHandleLabel = useCallback(
    (handleType: HandleType, handleId: string, nodeId: string, handleSide: HandleSide) => {
      // while connecting, if opposite side, show handle
      if (currentConnection && currentConnection.handleSide !== handleSide) {
        return true;
      }
      // if selected / hovered or itself the handle, show handle
      return isSelected || currentConnection?.handleId === handleId || isHovered;
    },
    [currentConnection, isHovered, isSelected],
  );

  const commonHandleProps = useMemo(
    () => ({
      isSelectedNode: showFullNode,
      nodeId: id,
      shouldObscureHandle,
      shouldShowHandleLabel,
      handleColor,
      handleSpace: HANDLE_SPACING,
    }),
    [showFullNode, id, shouldObscureHandle, shouldShowHandleLabel, handleColor],
  );

  return (
    <>
      {version === 2 || version === 3
        ? sortedInputHandles.map(([key, inputHandle], index) => (
            <DynamicHandleLabel
              key={index}
              description={getInputHandle(nodeType as NodeType, key)?.description ?? inputHandle.description}
              format={inputHandle.format}
              handleId={getHandleId(id, 'input', key)} //{`${id}-input-${key}`}
              handlePosition={Position.Left}
              handleSide="target"
              handleTop={inputHandleYPos || HANDLE_TOP}
              handleType={
                flowView.nodeInputType(id, key) ??
                (flowView.nodeValidInputTypes(id, key).length > 1
                  ? HandleType.Any
                  : flowView.nodeValidInputTypes(id, key)[0]) ??
                inputHandle.type
              }
              index={index}
              label={getInputHandle(nodeType as NodeType, key)?.label ?? inputHandle.label ?? key}
              required={inputHandle.required}
              validationErrors={{
                required: invalidHandles?.required?.includes(key),
                requiredEmpty: invalidHandles?.requiredEmpty?.includes(key),
              }}
              {...commonHandleProps}
            />
          ))
        : (handles?.input as string[])?.map((inputHandle, index) => (
            <DynamicHandleLabel
              key={index}
              handleSide="target"
              handlePosition={Position.Left}
              handleTop={inputHandleYPos || HANDLE_TOP}
              handleId={getHandleId(id, 'input', inputHandle)} //{`${id}-input-${inputHandle}`}
              label={inputHandle}
              index={index}
              {...commonHandleProps}
            />
          ))}
      {typeof handles?.output === 'object' && !Array.isArray(handles?.output)
        ? sortedOutputHandles.map(([key, outputHandle], index) => (
            <DynamicHandleLabel
              key={index}
              handleSide="source"
              handlePosition={Position.Right}
              handleTop={outputHandleYPos || HANDLE_TOP}
              handleId={getHandleId(id, 'output', key)} //{`${id}-output-${outputHandle}`}
              label={getOutputHandle(nodeType as NodeType, key)?.label ?? outputHandle.label ?? key}
              index={index}
              description={getOutputHandle(nodeType as NodeType, key)?.description ?? outputHandle.description}
              format={outputHandle.format}
              handleType={flowView.nodeOutputType(id, key) ?? outputHandle.type}
              {...commonHandleProps}
            />
          ))
        : (handles?.output as string[] | undefined)?.map((outputHandle, index) => (
            <DynamicHandleLabel
              key={index}
              handleSide="source"
              handlePosition={Position.Right}
              handleTop={outputHandleYPos || HANDLE_TOP}
              handleId={getHandleId(id, 'output', outputHandle)} //{`${id}-output-${outputHandle}`}
              label={outputHandle}
              index={index}
              {...commonHandleProps}
            />
          ))}
    </>
  );
};
