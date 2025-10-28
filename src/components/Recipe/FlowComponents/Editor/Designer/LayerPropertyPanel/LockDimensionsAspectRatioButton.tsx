import { motion } from 'motion/react';
import { useCompositorView } from '@/components/Recipe/FlowContext';
import { LockAspectRatioButton } from '@/components/Common/LockAspectRatioButton';
import type { NodeId, LayerId } from '@/designer/designer';

export const DimensionsLockAspectRatioButton = ({
  layerId,
  nodeId,
  isHovering = false,
}: {
  layerId: LayerId;
  nodeId: NodeId;
  isHovering?: boolean;
}) => {
  const compositorView = useCompositorView(nodeId);
  const isLocked = compositorView.aspectRatioLocked(layerId);
  const toggleLockAspectRatio = (newValue: boolean) => {
    compositorView.updateLayerLockedAspectRatio(layerId, newValue);
  };

  const showButton = isHovering || isLocked;

  return (
    <motion.div initial={{ opacity: showButton ? 1 : 0 }} animate={{ opacity: showButton ? 1 : 0 }}>
      <LockAspectRatioButton isLocked={isLocked} onChange={toggleLockAspectRatio} />
    </motion.div>
  );
};
