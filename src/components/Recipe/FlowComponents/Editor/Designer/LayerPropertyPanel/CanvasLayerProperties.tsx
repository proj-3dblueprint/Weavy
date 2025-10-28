import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { I18N_KEYS } from '@/language/keys';
import { FlexCol } from '@/UI/styles';
import { useCompositorView, useNodeData } from '@/components/Recipe/FlowContext';
import { LockAspectRatioButton } from '@/components/Common/LockAspectRatioButton';
import { useIsHovered } from '@/hooks/useIsHovered';
import { NumberInput } from './NumberInput';
import { LayerPropertyPanelField } from './LayerPropertyPanelField';
import type { NodeId } from 'web';
import type { CompositorNodeV3 } from '@/types/nodes/compositor';

export const CanvasLayerProperties = ({ nodeId }: { nodeId: NodeId }) => {
  const { t } = useTranslation();
  const { isHovered: isHovering, ...elementProps } = useIsHovered();
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState(false);
  const { stage } = useNodeData<CompositorNodeV3>(nodeId).data;
  const compositorView = useCompositorView(nodeId);
  const handleStageWidthChange = useCallback(
    (value: number) => {
      const newValue = Math.max(value, 1);
      const newStageHeight = isAspectRatioLocked ? (newValue / stage.width) * stage.height : stage.height;
      compositorView.setStageDimensions(newValue, newStageHeight);
    },
    [isAspectRatioLocked, stage.width, stage.height, compositorView],
  );
  const handleStageHeightChange = useCallback(
    (value: number) => {
      const newValue = Math.max(value, 1);
      const newStageWidth = isAspectRatioLocked ? (newValue / stage.height) * stage.width : stage.width;
      compositorView.setStageDimensions(newStageWidth, newValue);
    },
    [isAspectRatioLocked, stage.height, stage.width, compositorView],
  );
  return (
    <FlexCol sx={{ gap: 1 }} {...elementProps}>
      <LayerPropertyPanelField key="canvas-dimensions" label={t(I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.DIMENSIONS)}>
        <NumberInput value={stage.width} onSubmit={handleStageWidthChange} disabled={false} prefix="W" decimals={0} />
        <NumberInput value={stage.height} onSubmit={handleStageHeightChange} disabled={false} prefix="H" decimals={0} />
        <motion.div animate={{ opacity: isHovering || isAspectRatioLocked ? 1 : 0 }}>
          <LockAspectRatioButton isLocked={isAspectRatioLocked} onChange={setIsAspectRatioLocked} />
        </motion.div>
      </LayerPropertyPanelField>
    </FlexCol>
  );
};
