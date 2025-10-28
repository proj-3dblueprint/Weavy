import { useState, useRef, MouseEvent } from 'react';
import { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { format } from 'date-fns';
import { Flex } from '@/UI/styles';
import GalleryMenu from '@/components/Common/ImageList/GalleryMenu';
import { downloadAllToZip, downloadFile } from '@/components/Nodes/Utils';
import { isMediaAsset } from '@/components/Common/ImageList/utils';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { Content } from './MediaGallery/Content';
import { Sidebar } from './MediaGallery/Sidebar';
import type { MediaAsset, TextAsset } from '@/types/api/assets';

interface MediaGalleryProps {
  title: string;
  assets: (TextAsset | MediaAsset)[];
  inputsInfo: Record<string, any>;
  initialSelectedId: string;
  onDelete: (id: string) => void;
  onDeleteOthers: (index: number) => void;
  onDeleteAll: () => void;
  onSetAsCover: () => void;
  onCopyImage?: (id: string) => Promise<void>;
  onClose: () => void;
}

function MediaGallery({
  title,
  assets,
  inputsInfo,
  initialSelectedId,
  onDelete,
  onDeleteOthers,
  onDeleteAll,
  onSetAsCover,
  onCopyImage,
  onClose,
}: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(() => assets.findIndex((asset) => asset.id === initialSelectedId));
  const [transformKey, setTransformKey] = useState(0);
  const [scale, setScale] = useState(1);
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [rightClickedIndex, setRightClickedIndex] = useState<number | null>(null);
  const resetTransformRef = useRef<ReactZoomPanPinchRef>(null);
  const { track } = useAnalytics();

  const selectedAsset = assets[selectedIndex];

  const handleSetSelected = (index: number) => setSelectedIndex(index);

  const handleDownload = async (index: number): Promise<void> => {
    track('gallery_download_clicked', {}, TrackTypeEnum.BI);
    const file = assets[index];
    if (file && isMediaAsset(file)) {
      let suffix = file.url?.split('.').pop();
      if (suffix) {
        suffix = `.${suffix}`;
      }
      const now = new Date();
      const timestamp = format(now, "yyyy-MM-dd 'at' HH.mm.ss");
      await downloadFile(file.url, `weavy-${title || ''}-${timestamp}${suffix || ''}`, file.type);
    }
  };

  const handleDownloadAll = async (): Promise<void> => {
    track('gallery_download_all_clicked', {}, TrackTypeEnum.BI);
    await downloadAllToZip(assets.filter(isMediaAsset), title);
  };

  const handleContextMenu = (e: MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setRightClickedIndex(index);
    setContextMenu({
      mouseX: e.clientX - 2,
      mouseY: e.clientY - 4,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
    setRightClickedIndex(null);
  };

  const handleCopyImage = async (index: number): Promise<void> => {
    if (onCopyImage) {
      const file = assets[index];
      if (file) {
        await onCopyImage(file.id);
      }
    }
    handleContextMenuClose();
  };

  const deleteCurrent = () => {
    if (!selectedAsset) {
      return;
    }
    if (selectedIndex === assets.length - 1 && selectedIndex !== 0) {
      setSelectedIndex(selectedIndex - 1);
    }
    onDelete(selectedAsset.id);
  };

  const deleteOthers = () => {
    setSelectedIndex(0);
    onDeleteOthers(selectedIndex);
  };

  const deletionFunctions = {
    deleteCurrentResult: deleteCurrent,
    deleteAllOtherResults: deleteOthers,
    deleteAllResults: onDeleteAll,
  };

  if (!selectedAsset || selectedIndex < 0) {
    return null;
  }

  return (
    <Flex data-testid="media-gallery-container" sx={{ width: '100%', height: '100%', p: 2 }} onClick={onClose}>
      <Content
        nodeName={title}
        assets={assets}
        inputsInfo={inputsInfo}
        selectedIndex={selectedIndex}
        handleDownload={handleDownload}
        handleDownloadAll={handleDownloadAll}
        transformKey={transformKey}
        deletionFunctions={deletionFunctions}
        onContextMenu={handleContextMenu}
        onClose={onClose}
        resetTransformRef={resetTransformRef}
        scale={scale}
        setScale={setScale}
        handleCopyImage={handleCopyImage}
      />
      <Sidebar
        setSelected={handleSetSelected}
        images={assets}
        selected={selectedIndex}
        onContextMenu={handleContextMenu}
        transformKey={transformKey}
        setTransformKey={setTransformKey}
        resetTransformRef={resetTransformRef}
        setScale={setScale}
      />
      <GalleryMenu
        contextMenu={contextMenu}
        handleContextMenuClose={handleContextMenuClose}
        handleDownload={handleDownload}
        handleDownloadAll={handleDownloadAll}
        handleSetAsCover={onSetAsCover}
        selectedFile={selectedAsset}
        rightClickedIndex={rightClickedIndex}
        handleCopyImage={handleCopyImage}
      />
    </Flex>
  );
}

export { MediaGallery };
