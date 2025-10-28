import { useCallback } from 'react';
import { useReactFlow, XYPosition } from 'reactflow';
import { useWorkflowStore } from '@/state/workflow.state';

export function getCenterScreenPosition(
  flowContainerRect: DOMRect,
  screenToFlowPosition: (p: XYPosition) => XYPosition,
) {
  return screenToFlowPosition({
    x: (flowContainerRect.right - flowContainerRect.left - 240) / 2,
    y: (flowContainerRect.bottom - flowContainerRect.top - 120) / 2,
  });
}

export function useReactFlowCenterPosition() {
  const { screenToFlowPosition } = useReactFlow();
  const getReactFlowContainerRect = useWorkflowStore((s) => s.getReactFlowContainerRect);
  const getCenterPosition = useCallback(() => {
    const rect = getReactFlowContainerRect();
    return rect ? getCenterScreenPosition(rect, screenToFlowPosition) : { x: 0, y: 0 };
  }, [getReactFlowContainerRect, screenToFlowPosition]);

  return { getCenterPosition };
}
