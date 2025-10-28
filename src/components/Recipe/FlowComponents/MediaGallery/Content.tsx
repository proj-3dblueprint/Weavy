import React, { MouseEvent, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { FlexCol, FlexColCenHorVer } from '@/UI/styles';
import { useWorkflowStore } from '@/state/workflow.state';
import { GalleryFileViewer } from '@/components/Common/ImageList/GalleryFileViewer';
import { Header } from './Header';
import { ParamsPanel } from './ParamsPanel';
import type { DeleteFunctions } from '@/components/Common/ImageList/types';
import type { MediaAsset, TextAsset } from '@/types/api/assets';

interface ContentProps {
  nodeName: string;
  selectedIndex: number;
  assets: (TextAsset | MediaAsset)[];
  transformKey: number;
  inputsInfo: Record<string, unknown>;
  handleDownload: (index: number) => Promise<void>;
  handleDownloadAll: () => Promise<void>;
  deletionFunctions: DeleteFunctions;
  onContextMenu: (event: MouseEvent, index: number) => void;
  onClose: () => void;
  resetTransformRef: RefObject<ReactZoomPanPinchRef>;
  scale: number;
  setScale: (scale: number) => void;
  handleCopyImage: (index: number) => Promise<void>;
}
export const Content = ({
  nodeName,
  selectedIndex,
  assets,
  transformKey,
  inputsInfo,
  handleDownload,
  handleDownloadAll,
  deletionFunctions,
  onContextMenu,
  onClose,
  resetTransformRef,
  scale,
  setScale,
  handleCopyImage,
}: ContentProps) => {
  const selectedAsset = assets[selectedIndex];
  const maxSteps = assets.length;
  const isSelectedFileImage = selectedAsset?.type === 'image';

  const [zoomPercentage, setZoomPercentage] = useState(100);
  const { isGalleryParamsOpen, setIsGalleryParamsOpen } = useWorkflowStore();
  const [isParamsPanelOpen, setIsParamsPanelOpen] = useState(isGalleryParamsOpen);
  const [prevSelected, setPrevSelected] = useState(selectedIndex);

  const theme = useTheme();

  const imgRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<React.RefObject<HTMLVideoElement>[]>([]);

  // Manage refs array in useEffect to avoid side effects during render
  useEffect(() => {
    if (videoRefs.current.length !== assets.length) {
      videoRefs.current = assets.map(() => React.createRef<HTMLVideoElement>());
    }
  }, [assets.length]);

  if (prevSelected !== selectedIndex) {
    setPrevSelected(selectedIndex);
    // Pause all video elements when selection changes
    videoRefs.current.forEach((videoRef) => {
      if (videoRef?.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    });
  }

  useEffect(() => {
    // Reset the zoom scale when the selected image changes
    if (resetTransformRef.current) {
      resetTransformRef.current.resetTransform();
      setScale(1);
    }
  }, [resetTransformRef, selectedIndex, setScale]);

  const calculateZoomPercentage = useCallback(
    (newScale) => {
      if (imgRef.current && assets.length > 0 && isSelectedFileImage) {
        const renderedWidth = imgRef.current.offsetWidth * newScale;
        const zoomPercent = selectedAsset.width ? (renderedWidth / selectedAsset.width) * 100 : 100;
        setZoomPercentage(Math.round(zoomPercent));
      }
    },
    [assets.length, isSelectedFileImage, selectedAsset],
  );

  useEffect(() => {
    // calculate the zoom percentage on zoom change
    if (scale) {
      calculateZoomPercentage(scale);
    }
  }, [scale, calculateZoomPercentage]);

  const handleImageLoad = () => {
    // Calculate the zoom percentage when the image is fully loaded
    if (imgRef.current && assets.length > 0 && isSelectedFileImage) {
      const initialZoom = selectedAsset.width ? (imgRef.current.offsetWidth / selectedAsset.width) * 100 : 100;
      setZoomPercentage(Math.round(initialZoom));
    }
  };

  return (
    <FlexCol sx={{ flex: 1, height: '100%', width: '100%', pr: 1, position: 'relative' }}>
      <FlexColCenHorVer data-testid="image-list-container" sx={{ width: '100%', height: '100%' }}>
        <Header
          nodeName={nodeName}
          zoomPercentage={zoomPercentage}
          selectedAsset={selectedAsset}
          deletionFunctions={deletionFunctions}
          handleDownload={handleDownload}
          handleDownloadAll={handleDownloadAll}
          assets={assets}
          selectedIndex={selectedIndex}
          onCloseGallery={onClose}
          onToggleParamsBlock={() => {
            setIsParamsPanelOpen(!isParamsPanelOpen);
            setIsGalleryParamsOpen(!isParamsPanelOpen);
          }}
          handleCopyImage={handleCopyImage}
        />
        <Box
          data-testid="gallery-image-list-wrapper"
          ref={imgRef}
          sx={{ width: '90%', height: '85%', margin: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {assets.map((file, index) => (
            <GalleryFileViewer
              key={`file-viewer-${file.id}`}
              file={file}
              container="gallery"
              selected={selectedIndex}
              index={index}
              transformKey={transformKey}
              resetTransformRef={resetTransformRef}
              setScale={setScale}
              handleImageLoad={handleImageLoad}
              maxSteps={maxSteps}
              onContextMenu={onContextMenu}
              nativePlayer
              videoRef={videoRefs.current[index]}
            />
          ))}
        </Box>
      </FlexColCenHorVer>
      {isParamsPanelOpen && (
        <Box sx={{ position: 'absolute', top: 42, right: theme.spacing(1), bottom: 0 }}>
          <ParamsPanel selectedFile={selectedAsset} nodeName={nodeName} inputsInfo={inputsInfo} />
        </Box>
      )}
    </FlexCol>
  );
};
