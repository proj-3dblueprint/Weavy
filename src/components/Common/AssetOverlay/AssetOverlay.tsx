import { Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { FlexCenVer, FlexCenVerSpaceBetween, FlexCol } from '@/UI/styles';
import { roundToDecimalIfNotWhole } from '@/utils/numbers';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { MaximizeArrowsIcon } from '@/UI/Icons/MaximizeArrows';
import { I18N_KEYS } from '@/language/keys';
import { ThreeDRotateSlashIcon } from '@/UI/Icons/ThreeDRotateSlashIcon';
import { ThreeDRotateIcon } from '@/UI/Icons/ThreeDRotateIcon';
import { color } from '@/colors';
import { NodeCarouselV2, type NodeCarouselV2Props } from '../ImageList/NodeCarousel';
import { isMediaAsset, isTextAsset } from '../ImageList/utils';
import type { UploadedAsset, MediaAsset } from '@/types/api/assets';
import type { FileKind } from '@/designer/designer';

const fileCaptionStyle = () => ({
  pointerEvents: 'all',
});

const formatVideoMetadata = (file: MediaAsset) => {
  if (!file) return '';

  const parts = [
    `${file.width}x${file.height}`,
    file.duration ? `${file.duration.toFixed(2)}s` : undefined,
    file.fps ? `${roundToDecimalIfNotWhole(file.fps)} fps` : undefined,
  ].filter(Boolean);

  return parts.join(' | ');
};

const renderFileMetadata = (file: MediaAsset) => {
  if (!file) return null;

  if (!['image', 'video'].includes(file.type)) return null;

  return (
    <Typography variant="label-sm-rg" sx={fileCaptionStyle()}>
      {formatVideoMetadata(file)}
    </Typography>
  );
};

const validateNodeCarouselProps = (props: Partial<NodeCarouselV2Props>): props is NodeCarouselV2Props => {
  return (
    typeof props.steps === 'number' &&
    props.steps > 1 &&
    typeof props.selected === 'number' &&
    typeof props.handleBack === 'function' &&
    typeof props.handleNext === 'function'
  );
};

export interface AssetOverlayProps extends Partial<NodeCarouselV2Props> {
  asset?: UploadedAsset | FileKind;
  isHovered?: boolean;
  openGallery?: () => void;
  setIs3DLocked?: (is3DLocked: boolean) => void;
  is3DLocked?: boolean;
}

export const AssetOverlay = ({
  asset,
  isHovered = false,
  openGallery,
  setIs3DLocked,
  is3DLocked,
  ...nodeCarouselProps
}: AssetOverlayProps) => {
  const { t } = useTranslation();

  const toggle3DLock = () => {
    setIs3DLocked?.(!is3DLocked);
  };

  if (!isHovered || !asset) return null;

  const isMedia = isMediaAsset(asset);
  const isText = isTextAsset(asset);
  const is3D = isMedia && asset.type === '3D';

  return (
    <FlexCol
      sx={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 10,
        top: 0,
        left: 0,
        pointerEvents: 'none',
        justifyContent: 'space-between',
      }}
      data-testid="file-overlay-test"
    >
      <FlexCenVerSpaceBetween sx={{ p: 1, pointerEvents: 'none' }}>
        <FlexCenVer sx={{ pointerEvents: 'none' }}>
          {validateNodeCarouselProps(nodeCarouselProps) ? <NodeCarouselV2 {...nodeCarouselProps} /> : null}
        </FlexCenVer>
        <FlexCenVer sx={{ gap: 0.5, pointerEvents: 'none' }}>
          {isText && asset.originalValue ? (
            <Typography
              variant="label-sm-rg"
              color={color.White80_T}
              sx={{
                backgroundColor: color.White16_T,
                px: 0.5,
                borderRadius: 0.5,
                position: 'relative',
              }}
            >
              {t(I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.LLM_EDITED)}
            </Typography>
          ) : null}
          {openGallery ? (
            <AppIconButton sx={{ pointerEvents: 'all' }} onClick={openGallery} width={32} height={32} mode="on-light">
              <MaximizeArrowsIcon />
            </AppIconButton>
          ) : null}
        </FlexCenVer>
      </FlexCenVerSpaceBetween>
      <FlexCenVerSpaceBetween sx={{ p: 2, pointerEvents: 'none' }}>
        <FlexCenVer sx={{ pointerEvents: 'none' }}>
          {is3D && !!setIs3DLocked ? (
            <Tooltip
              sx={{
                pointerEvents: 'all',
              }}
              title={
                is3DLocked
                  ? t(I18N_KEYS.NODE_IMAGE_LIST.CAMERA_CONTROLS.UNLOCK)
                  : t(I18N_KEYS.NODE_IMAGE_LIST.CAMERA_CONTROLS.LOCK)
              }
            >
              <AppIconButton
                onClick={(e) => {
                  e.stopPropagation();
                  toggle3DLock();
                }}
                width={32}
                height={32}
                mode="on-light"
              >
                {is3DLocked ? <ThreeDRotateSlashIcon /> : <ThreeDRotateIcon />}
              </AppIconButton>
            </Tooltip>
          ) : isMedia ? (
            <FlexCenVer sx={{ pointerEvents: 'none' }}>{renderFileMetadata(asset)}</FlexCenVer>
          ) : null}
        </FlexCenVer>
      </FlexCenVerSpaceBetween>
    </FlexCol>
  );
};
