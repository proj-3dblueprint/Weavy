import { useCallback } from 'react';
import { useGlobalStore } from '@/state/global.state';
import { useWorkflowStore } from '@/state/workflow.state';
import { useReactFlowCenterPosition } from '@/hooks/useReactFlowCenterPosition';
import { useFlowView } from '../Recipe/FlowContext';
import type { NodeId } from 'web';
import type { DialogData } from '@/state/global.state';

interface NodeActions {
  deleteNode: (nodeId: NodeId) => void;
  duplicateNode: (nodeId: NodeId) => void;
  toggleLockNode: (nodeId: NodeId) => void;
  openOverlayDialog: (dialogData: DialogData) => void;
  closeOverlayDialog: () => void;
  setCoverImage: (poster: string) => Promise<void>;
}

export function useNodeActions(): NodeActions {
  const flowView = useFlowView();
  const { getCenterPosition } = useReactFlowCenterPosition();

  const deleteNode = useCallback((id: NodeId) => flowView.deleteNodes([id]), [flowView]);
  const duplicateNode = useCallback(
    // FIXME need flowRef to get reactflow center position
    (id: NodeId) => flowView.duplicateNodes([id], getCenterPosition()),
    [flowView, getCenterPosition],
  );
  const toggleLockNode = useCallback((id: NodeId) => flowView.toggleLockNode(id), [flowView]);
  const openOverlayDialog = useGlobalStore((s) => s.openDialog);
  const closeOverlayDialog = useGlobalStore((s) => s.closeDialog);
  const setCoverImage = useWorkflowStore((s) => s.setRecipePoster);

  return {
    deleteNode,
    duplicateNode,
    toggleLockNode,
    openOverlayDialog,
    closeOverlayDialog,
    setCoverImage,
  };
}
