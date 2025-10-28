import { getBezierPath, type EdgeProps } from 'reactflow';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { FF_SWIPE_TO_DELETE_EDGE } from '@/consts/featureFlags';
import { getHandleColor, getHandleName } from '../Nodes/DynamicNode/HandlesUtils';
import { useFlowView } from './FlowContext';

interface CustomEdgeProps extends EdgeProps {
  getDragState?: () => { isDragging: boolean; isModifierPressed: boolean };
}

export const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  selected,
  markerEnd,
  getDragState,
}: CustomEdgeProps) => {
  const flowView = useFlowView();
  const isFFSwipeToDeleteEdgeEnabled = useFeatureFlagEnabled(FF_SWIPE_TO_DELETE_EDGE);
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const gradientId = `gradient-${id}`;

  const role = useUserWorkflowRole();
  const pointerEvents = role === 'guest' ? 'none' : 'auto';
  const cursor = role === 'guest' ? 'default' : 'pointer';

  // Handle edge deletion on mouse enter when dragging with modifier keys
  const handleMouseEnter = (_event: React.MouseEvent) => {
    if (!isFFSwipeToDeleteEdgeEnabled) return;
    if (role === 'guest') return;
    if (!getDragState) return;

    // Get current drag state
    const { isDragging, isModifierPressed } = getDragState();

    // Only delete if we're actively dragging with modifier keys pressed
    if (isDragging && isModifierPressed) {
      flowView.deleteEdges([id]);
    }
  };

  const clickStyle: React.CSSProperties = {
    strokeWidth: 40,
    stroke: 'transparent',
    cursor: role === 'guest' ? 'default' : 'pointer', // Disable pointer for guests
    pointerEvents: role === 'guest' ? 'none' : 'auto',
  };

  const edge = flowView.getEdgeNullable(id);
  const sourceHandleType = edge ? flowView.nodeOutputType(edge.source, getHandleName(edge.sourceHandle)) : undefined;
  const targetHandleType = edge ? flowView.nodeInputType(edge.target, getHandleName(edge.targetHandle)) : undefined;
  return (
    <>
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={sourceX}
          y1={sourceY}
          x2={targetX}
          y2={targetY}
        >
          <stop offset="0%" stopColor={getHandleColor(sourceHandleType)} />
          <stop offset="100%" stopColor={getHandleColor(targetHandleType)} />
        </linearGradient>
      </defs>
      <path d={edgePath} style={clickStyle} fill="none" onMouseEnter={handleMouseEnter} />

      <path
        id={id}
        style={{ ...style, strokeWidth: selected ? 3 : 2, cursor, pointerEvents }}
        d={edgePath}
        markerEnd={markerEnd}
        stroke={`url(#${gradientId})`}
        fill="none"
        onMouseEnter={handleMouseEnter}
      />
    </>
  );
};
