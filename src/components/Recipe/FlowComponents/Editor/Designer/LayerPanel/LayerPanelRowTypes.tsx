import { Typography, type SxProps } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenVer } from '@/UI/styles';
import { ImageIcon } from '@/UI/Icons/ImageIcon';
import { ImageSlashIcon } from '@/UI/Icons/ImageSlashIcon';
import { VideoIcon } from '@/UI/Icons/VideoIcon';
import { VideoSlashIcon } from '@/UI/Icons/VideoSlashIcon';
import { TextIcon } from '@/UI/Icons/TextIcon';
import { TextSlashIcon } from '@/UI/Icons/TextSlashIcon';
import { useCompositorView, useFlowView } from '@/components/Recipe/FlowContext';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { LockOpenIcon } from '@/UI/Icons/LockOpenIcon';
import { LockClosedIcon } from '@/UI/Icons/LockClosedIcon';
import { useIsHovered } from '@/hooks/useIsHovered';
import type { LayerId, NodeId } from 'web';
import type { UILayer } from '@/types/nodes/compositor';
import type { HTMLAttributes } from 'react';

const BaseLayerRow = ({
  children,
  sx,
  ...props
}: { children?: React.ReactNode; sx?: SxProps } & HTMLAttributes<HTMLDivElement>) => {
  return (
    <FlexCenVer
      sx={{
        color: color.White80_T,
        flexGrow: 1,
        gap: 1,
        justifyContent: 'space-between',
        p: 0.5,
        width: '100%',
        ...(sx || {}),
      }}
      {...props}
    >
      {children}
    </FlexCenVer>
  );
};

const LayerIconAndName = ({ children }: { children?: React.ReactNode }) => {
  return <FlexCenVer sx={{ gap: 1, flexGrow: 1 }}>{children}</FlexCenVer>;
};

export const CanvasLayerRow = () => {
  const { t } = useTranslation();
  return (
    <BaseLayerRow>
      <LayerIconAndName>
        <img src="/icons/canvas.svg" style={{ width: 16, height: 16 }} />

        <Typography color={color.White80_T} variant="body-sm-rg">
          {t(I18N_KEYS.COMPOSITOR.LAYER_PANEL_ROW.CANVAS_LAYER_NAME)}
        </Typography>
      </LayerIconAndName>
    </BaseLayerRow>
  );
};

export const LayerRow = ({ layer, layerId, nodeId }: { layer: UILayer; layerId: LayerId; nodeId: NodeId }) => {
  const { isHovered, ...divProps } = useIsHovered();
  const flowView = useFlowView();

  const hasInput = flowView.nodeInputType(nodeId, layer.kind.inputId) !== undefined;

  return (
    <BaseLayerRow {...divProps}>
      <LayerIconAndName>
        {hasInput ? (
          layer.kind.type === 'image' ? (
            <ImageIcon style={{ width: 16, height: 16 }} />
          ) : layer.kind.type === 'video' ? (
            <VideoIcon style={{ width: 16, height: 16 }} />
          ) : (
            <TextIcon style={{ width: 16, height: 16 }} />
          )
        ) : layer.kind.type === 'image' ? (
          <ImageSlashIcon style={{ width: 16, height: 16, color: color.White16_T }} />
        ) : layer.kind.type === 'video' ? (
          <VideoSlashIcon style={{ width: 16, height: 16, color: color.White16_T }} />
        ) : (
          <TextSlashIcon style={{ width: 16, height: 16, color: color.White16_T }} />
        )}
        {/* Replace to editable name when input name will change with it */}
        <Typography variant="body-sm-rg" color={hasInput ? color.White80_T : color.White16_T}>
          {layer.name}
        </Typography>
      </LayerIconAndName>
      <LayerLock layer={layer} layerId={layerId} nodeId={nodeId} isHovered={isHovered} />
    </BaseLayerRow>
  );
};

const LayerLock = ({
  isHovered = false,
  layer,
  layerId,
  nodeId,
}: {
  isHovered?: boolean;
  layer: UILayer;
  layerId: LayerId;
  nodeId: NodeId;
}) => {
  const compositorView = useCompositorView(nodeId);

  const isLocked = layer.locked;

  const toggleLock = () => {
    compositorView.setIsLayerLocked(layerId, !isLocked);
  };

  return (
    <motion.div
      initial={{ opacity: isLocked ? 1 : 0 }}
      animate={{ opacity: isHovered || isLocked ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppIconButton width={16} height={16} mode="on-dark" onClick={toggleLock}>
        {isLocked ? (
          <LockClosedIcon style={{ width: 12, height: 12 }} />
        ) : (
          <LockOpenIcon style={{ width: 12, height: 12 }} />
        )}
      </AppIconButton>
    </motion.div>
  );
};
