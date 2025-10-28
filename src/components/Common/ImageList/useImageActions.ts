import { useCallback } from 'react';
import { format } from 'date-fns';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { log } from '@/logger/logger';
import { downloadAllToZip, downloadFile } from '@/components/Nodes/Utils';
import { copyImage } from '@/utils/files';
import { isMediaAsset } from './utils';
import type { UploadedAsset } from '@/types/api/assets';

export interface ImageActions {
  handleDownload: (index: number) => Promise<void>;
  handleDownloadAll: () => Promise<void>;
  handleCopyImage: (index: number) => Promise<void>;
}

interface ImageActionsOptions {
  handleContextMenuClose: () => void;
  images: UploadedAsset[];
  nodeName: string;
}

const logger = log.getLogger('ImageActions');

export const useImageActions = ({ handleContextMenuClose, images, nodeName }: ImageActionsOptions): ImageActions => {
  const { track } = useAnalytics();
  const handleDownload = useCallback(
    async (index: number) => {
      track('node_image_download_clicked', {}, TrackTypeEnum.BI);
      const file = images[index];
      if (index !== null && isMediaAsset(file)) {
        const now = new Date();
        const timestamp = format(now, "yyyy-MM-dd 'at' HH.mm.ss");
        await downloadFile(file.url, `weavy-${nodeName || ''}-${timestamp}.${file.url.split('.').pop()}`, file.type);
      }
      handleContextMenuClose();
    },
    [handleContextMenuClose, images, nodeName, track],
  );

  const handleDownloadAll = useCallback(async () => {
    track('node_image_download_all_clicked', {}, TrackTypeEnum.BI);
    await downloadAllToZip(images.filter(isMediaAsset), nodeName);
    handleContextMenuClose();
  }, [handleContextMenuClose, images, nodeName, track]);

  const handleCopyImage = useCallback(
    async (index: number) => {
      track('node_image_copy_clicked', {}, TrackTypeEnum.BI);
      try {
        const file = images[index];
        if (index !== null && file?.type === 'image' && 'url' in file) {
          await copyImage(file);
        }
      } catch (error) {
        logger.error('Failed to copy image:', error as Error);
      }
      handleContextMenuClose();
    },
    [handleContextMenuClose, images, track],
  );

  return {
    handleDownload,
    handleDownloadAll,
    handleCopyImage,
  };
};
