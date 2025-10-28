import { getBezierPath, Position, type ConnectionLineComponentProps } from 'reactflow';
import { useMemo } from 'react';
import { HandleType } from '@/enums/handle-type.enum';
import { getHandleColor, getHandleName } from '../Nodes/DynamicNode/HandlesUtils';
import { useFlowView } from './FlowContext';

const CustomConnectionLine = ({ fromX, fromY, toX, toY, fromHandle, fromNode }: ConnectionLineComponentProps) => {
  const flowView = useFlowView();
  const handleColor = useMemo(() => {
    if (!fromHandle || !fromNode) return getHandleColor(HandleType.Any);
    const inputId = getHandleName(fromHandle.id);
    const isOutput = fromHandle.id?.includes('-output-');
    let handleType = isOutput
      ? flowView.nodeOutputType(fromNode.id, inputId)
      : flowView.nodeInputType(fromNode.id, inputId);
    if (!handleType && !isOutput) {
      const validInputTypes = flowView.nodeValidInputTypes(fromNode.id, inputId);
      handleType = validInputTypes.length === 1 ? validInputTypes[0] : HandleType.Any;
    }

    return getHandleColor(handleType || HandleType.Any);
  }, [fromHandle, fromNode, flowView]);

  const [sourcePosition, targetPosition] = useMemo(() => {
    let sourcePosition = Position.Bottom;
    if (fromHandle && fromHandle.position) {
      sourcePosition = fromHandle.position;
    }

    let targetPosition: Position;
    switch (sourcePosition) {
      case Position.Left:
        targetPosition = Position.Right;
        break;
      case Position.Right:
        targetPosition = Position.Left;
        break;
      case Position.Top:
        targetPosition = Position.Bottom;
        break;
      case Position.Bottom:
        targetPosition = Position.Top;
        break;
      default:
        targetPosition = Position.Left;
    }

    return [sourcePosition, targetPosition];
  }, [fromHandle]);

  // Calculate the bezier path
  const [edgePath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition,
    targetX: toX,
    targetY: toY,
    targetPosition,
  });

  // Apply your custom styling
  return (
    <g>
      <path d={edgePath} stroke={handleColor} strokeWidth={3} fill="none" style={{ pointerEvents: 'none' }} />
      <circle cx={toX} cy={toY} r={3} fill={handleColor} stroke={handleColor} strokeWidth={1} />
    </g>
  );
};

export default CustomConnectionLine;
