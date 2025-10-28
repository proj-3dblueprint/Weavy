import { useCallback, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'motion/react';
import { roundToDecimalIfNotWhole } from '@/utils/numbers';
import { Flex } from '@/UI/styles';
import { AssetOverlay } from '../AssetOverlay/AssetOverlay';
import { MediaElement } from './MediaElement';
import { UploadProgressOverlay } from './UploadProgressOverlay';
import { UploadAnotherOverlay } from './UploadAnotherOverlay';
import type { UploadedAsset, MediaAsset } from '@/types/api/assets';
import type { ThreeDProps } from '../ImageList/types';

type FileDisplayProps = {
  isHovered: boolean;
  maxHeight?: number;
  openFileUploader: (e: React.MouseEvent<HTMLDivElement>) => void;
  previewImage?: string;
  isInProgress?: boolean;
  uploadedFileType?: string;
  value?: Partial<MediaAsset> | null;
  showMediaWhileLoading: boolean;
  threeDProps?: ThreeDProps;
};

export const FileDisplay = ({
  previewImage,
  uploadedFileType,
  value,
  openFileUploader,
  isInProgress = false,
  isHovered,
  maxHeight,
  showMediaWhileLoading = true,
  threeDProps,
}: FileDisplayProps) => {
  const isImage = uploadedFileType === 'image';

  const uploadFile = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isImage && !isInProgress) {
        openFileUploader(e);
      } else {
        e.stopPropagation();
      }
    },
    [isInProgress, isImage, openFileUploader],
  );

  const minHeight = useMemo(() => {
    if (isInProgress && !(showMediaWhileLoading && (value?.url || previewImage))) {
      return '430px';
    }
    return undefined;
  }, [isInProgress, showMediaWhileLoading, value?.url, previewImage]);

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight,
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <Box
        className={uploadedFileType !== 'audio' ? 'media-container-dark' : ''}
        sx={{ width: '100%', height: '100%', cursor: !isInProgress ? 'pointer' : 'default' }}
        onClick={uploadFile}
      >
        {showMediaWhileLoading &&
          (value?.url || previewImage ? (
            <MediaElement
              url={value?.url || previewImage}
              type={uploadedFileType}
              poster={previewImage}
              maxHeight={maxHeight}
              threeDProps={threeDProps}
            />
          ) : (
            <Flex sx={{ width: '100%', height: '430px', justifyContent: 'center', alignItems: 'center' }} />
          ))}
        <AnimatePresence>
          {value?.width && value?.height && isHovered ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1, ease: 'easeInOut' }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '80px',
                  background: 'linear-gradient(to bottom, #343337D3, #6B6B7800)',
                  pointerEvents: 'none',
                  filter: 'blur(30px)',
                  transform: 'scale(1.8)  translateY(-30px)',
                }}
              />
              {renderFileMetadata(value)}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Box>
      {isInProgress ? <UploadProgressOverlay /> : null}
      {isImage && !isInProgress && <UploadAnotherOverlay show={isHovered} clickToReplace={openFileUploader} />}
      {value?.type === '3D' && (
        <AssetOverlay
          asset={value as UploadedAsset}
          steps={1}
          handleBack={() => {}}
          handleNext={() => {}}
          selected={0}
          is3DLocked={threeDProps?.is3DLocked}
          isHovered={isHovered}
          setIs3DLocked={threeDProps?.setIs3DLocked}
        />
      )}
    </Box>
  );
};

const formatVideoMetadata = (file: Partial<MediaAsset>) => {
  const parts = [
    `${file.width}x${file.height}`,
    file.duration ? `${file.duration.toFixed(2)}s` : undefined,
    file.fps ? `${roundToDecimalIfNotWhole(file.fps)} fps` : undefined,
  ].filter(Boolean);

  return parts.join(' | ');
};

const renderFileMetadata = (file: Partial<MediaAsset>) => {
  if (!['image', 'video'].includes(file.type || '')) return null;

  return (
    <Typography variant="label-sm-rg" sx={{ position: 'absolute', top: 12, left: 12 }}>
      {formatVideoMetadata(file)}
    </Typography>
  );
};
