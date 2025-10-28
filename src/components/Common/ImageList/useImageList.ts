import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { useNodeActions } from '@/components/Nodes/useNodeActions';
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import type { ImageListContainerType, ThreeDProps } from './types';
import type { UploadedAsset } from '@/types/api/assets';

export interface ImageListState {
  contextMenu: {
    mouseX: number;
    mouseY: number;
  } | null;
  handleBack: () => void;
  handleContextMenu: (event: React.MouseEvent, index: number) => void;
  handleContextMenuClose: () => void;
  handleImageLoad: () => void;
  handleNext: () => void;
  handleSetAsCover: () => void;
  imagesPerRow: number;
  imgRef: React.RefObject<HTMLDivElement>;
  isHovered?: boolean;
  isSelectedFileText: boolean;
  maxSteps: number;
  onClose?: () => void;
  resetTransformRef: React.RefObject<ReactZoomPanPinchRef>;
  rightClickedIndex: number | null;
  selectedFile: UploadedAsset;
  setScale: (scale: number) => void;
  threeDProps?: ThreeDProps;
  transformKey: number;
  videoRefs: React.RefObject<HTMLVideoElement>[];
  zoomPercentage: number;
}

interface ImageListOptions {
  container: ImageListContainerType;
  disabled?: boolean;
  images: UploadedAsset[];
  selected: number;
  setSelected: React.Dispatch<React.SetStateAction<number>>;
}

const MAX_IMAGES_PER_ROW = 20;

export const useImageList = ({ container, disabled, images, selected, setSelected }: ImageListOptions) => {
  const { setCoverImage } = useNodeActions();
  const { track } = useAnalytics();
  const maxSteps = images.length;
  const [zoomPercentage, setZoomPercentage] = useState(100);
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLDivElement>(null);
  const resetTransformRef = useRef<ReactZoomPanPinchRef>(null);
  const [transformKey, setTransformKey] = useState(0);
  const videoRefs = useRef<React.RefObject<HTMLVideoElement>[]>([]);

  // Manage refs array in useEffect to avoid side effects during render
  useEffect(() => {
    if (videoRefs.current.length !== images.length) {
      videoRefs.current = images.map(() => React.createRef<HTMLVideoElement>());
    }
  }, [images.length]);
  const [prevSelected, setPrevSelected] = useState(selected);

  if (prevSelected !== selected) {
    setPrevSelected(selected);
    // Pause all video elements when selection changes
    videoRefs.current.forEach((videoRef) => {
      if (videoRef?.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    });
  }

  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [rightClickedIndex, setRightClickedIndex] = useState<number | null>(null);

  const imagesPerRow = Math.min(images.length, MAX_IMAGES_PER_ROW);

  const isDesignApp = container === 'design-app';

  const resetZoom = () => {
    if (resetTransformRef.current) {
      resetTransformRef.current.resetTransform();
      setScale(1);
    }
  };

  useEffect(() => {
    if (selected >= images.length && images.length > 0) {
      setSelected(images.length - 1);
    }
  }, [images, selected, setSelected]);

  // Handle context menu open
  const handleContextMenu = (event: React.MouseEvent, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    setRightClickedIndex(index);
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
  };

  // Handle context menu close
  const handleContextMenuClose = () => {
    setContextMenu(null);
    setRightClickedIndex(null);
  };

  // Handle set as cover action
  const handleSetAsCover = () => {
    track('node_image_set_as_cover_clicked', {}, TrackTypeEnum.BI);
    if (rightClickedIndex !== null && setCoverImage && images[rightClickedIndex]?.type === 'image') {
      void setCoverImage(images[rightClickedIndex]?.url);
    }
    handleContextMenuClose();
  };

  const selectedFile = images[selected];
  const isSelectedFileImage = selectedFile?.type === 'image';
  const isSelectedFileText = selectedFile?.type === 'text';

  useEffect(() => {
    if (imgRef.current && images.length > 0 && isSelectedFileImage) {
      const renderedWidth = imgRef.current.offsetWidth;
      const initialZoom = selectedFile.width ? (renderedWidth / selectedFile.width) * 100 : 100;
      setZoomPercentage(Math.round(initialZoom));
    }
  }, []);

  const calculateZoomPercentage = useCallback(
    (newScale: number) => {
      if (imgRef.current && images.length > 0 && isSelectedFileImage) {
        const renderedWidth = imgRef.current.offsetWidth * newScale;
        const zoomPercent = selectedFile.width ? (renderedWidth / selectedFile.width) * 100 : 100;
        setZoomPercentage(Math.round(zoomPercent));
      }
    },
    [images.length, isSelectedFileImage, selectedFile],
  );

  const handleNext = useCallback(() => {
    if (disabled) return;
    if (isDesignApp) {
      resetZoom();
    }
    setTransformKey((prev) => prev + 1);
    setSelected((prevActiveStep) => {
      const currentLength = images.length;
      const validPrevStep = Math.min(prevActiveStep, currentLength - 1);
      return (validPrevStep + 1) % currentLength;
    });
  }, [disabled, isDesignApp, setSelected, images.length]);

  const handleBack = useCallback(() => {
    if (disabled) return;
    if (isDesignApp) resetZoom();
    setTransformKey((prev) => prev + 1);
    setSelected((prevActiveStep) => {
      const currentLength = images.length;
      const validPrevStep = Math.min(prevActiveStep, currentLength - 1);

      return (validPrevStep - 1 + currentLength) % currentLength;
    });
  }, [disabled, isDesignApp, setSelected, images.length]);

  // TODO: arrow nav - can remove after new redesign is rolled out. This is used in the gallery only
  const handleArrowUp = useCallback(() => {
    if (isDesignApp) {
      resetZoom();
    }
    setTransformKey((prev) => prev + 1);
    setSelected((prevActiveStep) => {
      const currentLength = images.length;
      const validPrevStep = Math.min(prevActiveStep, currentLength - 1);

      return validPrevStep - imagesPerRow >= 0 ? validPrevStep - imagesPerRow : validPrevStep;
    });
  }, [isDesignApp, setSelected, images.length, imagesPerRow]);

  const handleArrowDown = useCallback(() => {
    if (isDesignApp) {
      resetZoom();
    }
    setTransformKey((prev) => prev + 1);
    setSelected((prevActiveStep) => {
      const currentLength = images.length;
      const validPrevStep = Math.min(prevActiveStep, currentLength - 1);

      return validPrevStep + imagesPerRow < currentLength ? validPrevStep + imagesPerRow : validPrevStep;
    });
  }, [isDesignApp, setSelected, images.length, imagesPerRow]);

  const handleImageLoad = () => {
    // Calculate the zoom percentage when the image is fully loaded
    if (imgRef.current && images.length > 0 && isSelectedFileImage) {
      const initialZoom = selectedFile.width ? (imgRef.current.offsetWidth / selectedFile.width) * 100 : 100;
      setZoomPercentage(Math.round(initialZoom));
    }
  };

  useEffect(() => {
    // calculate the zoom percentage on zoom change
    if (scale) {
      calculateZoomPercentage(scale);
    }
  }, [scale, calculateZoomPercentage]);

  useEffect(() => {
    // Reset the zoom scale when the selected image changes
    if (resetTransformRef.current) {
      resetTransformRef.current.resetTransform();
      setScale(1);
    }
  }, [selected]);

  useEffect(() => {
    const handleByKey = new Map([
      ['ArrowRight', handleNext],
      ['ArrowLeft', handleBack],
      ['ArrowUp', handleArrowUp],
      ['ArrowDown', handleArrowDown],
    ]);
    const handleKeydown = (event: KeyboardEvent) => {
      if (
        event.target &&
        'tagName' in event.target &&
        (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')
      ) {
        return; // Exit early if user is typing in an input
      }

      if (handleByKey.has(event.key)) {
        event.stopPropagation();
        if (isDesignApp) {
          // Non-null assertion is safe because we checked has(event.key)
          handleByKey.get(event.key)!();
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [isDesignApp, handleNext, handleBack, handleArrowUp, handleArrowDown]);

  return {
    contextMenu,
    handleBack,
    handleContextMenu,
    handleContextMenuClose,
    handleImageLoad,
    handleNext,
    handleSetAsCover,
    imagesPerRow,
    imgRef,
    isSelectedFileText,
    maxSteps,
    resetTransformRef,
    rightClickedIndex,
    selectedFile,
    setScale,
    transformKey,
    videoRefs: videoRefs.current,
    zoomPercentage,
  };
};
