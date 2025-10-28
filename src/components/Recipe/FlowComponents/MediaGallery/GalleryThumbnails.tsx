import { MouseEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Grid2 as Grid, Typography, useTheme } from '@mui/material';
import { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { GalleryThumbnailViewer } from '@/components/Common/ImageList/GalleryThumbnailViewer';
import { AppPaper, FlexCol } from '@/UI/styles';
import type { UploadedAsset } from '@/types/api/assets';

type Layout = 'single' | 'double' | 'triple' | 'scroll';
const ITEM_SIZE_FULL = 104;
const ITEM_SIZE_HALF = 50;
const ITEM_SIZE_THIRD = 32;
const GAP = 0.5;
const JUMP_STEP: Record<Layout, number> = {
  single: 1,
  double: 2,
  triple: 3,
  scroll: 3,
};

interface GalleryThumbnailsProps {
  assets: UploadedAsset[];
  selected: number;
  transformKey: number;
  setSelected: (index: number) => void;
  onContextMenu: (e: MouseEvent, index: number) => void;
  setTransformKey: (key: number) => void;
  resetTransformRef: RefObject<ReactZoomPanPinchRef>;
  setScale: (scale: number) => void;
}

export const GalleryThumbnails = ({
  assets,
  selected: selectedIndex,
  transformKey,
  setSelected,
  onContextMenu,
  setTransformKey,
  resetTransformRef,
  setScale,
}: GalleryThumbnailsProps) => {
  const [layout, setLayout] = useState<Layout>();

  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  useEffect(() => {
    if (selectedIndex >= assets.length && assets.length > 0) {
      setSelected(assets.length - 1);
    }
  }, [assets.length, selectedIndex, setSelected]);

  useEffect(() => {
    if (!containerRef.current) return;
    const containerHeight = containerRef.current.clientHeight;
    const itemHeight = ITEM_SIZE_FULL + parseInt(theme.spacing(1), 10) * GAP;
    const itemHeightHalf = ITEM_SIZE_HALF + parseInt(theme.spacing(1), 10) * GAP;
    const itemHeightThird = ITEM_SIZE_THIRD + parseInt(theme.spacing(1), 10) * GAP;

    if (assets.length * itemHeight <= containerHeight) {
      setLayout('single');
    } else if (Math.ceil(assets.length / 2) * itemHeightHalf <= containerHeight) {
      setLayout('double');
    } else if (Math.ceil(assets.length / 3) * itemHeightThird <= containerHeight) {
      setLayout('triple');
    } else {
      setLayout('scroll');
    }
  }, [assets.length, theme]);

  const size = useMemo(() => {
    if (layout === 'double') {
      return ITEM_SIZE_HALF;
    } else if (layout === 'triple' || layout === 'scroll') {
      return ITEM_SIZE_THIRD;
    }
    return ITEM_SIZE_FULL;
  }, [layout]);

  const resetZoom = useCallback(() => {
    if (resetTransformRef.current) {
      resetTransformRef.current.resetTransform();
      setScale(1);
    }
  }, [resetTransformRef, setScale]);

  const handleArrowUp = useCallback(() => {
    if (!layout) {
      return;
    }
    resetZoom();
    setTransformKey(transformKey + 1);

    const currentLength = assets.length;
    const validPrevStep = Math.min(selectedIndex, currentLength - 1);
    let nextStep =
      validPrevStep - JUMP_STEP[layout] >= 0
        ? validPrevStep - JUMP_STEP[layout]
        : validPrevStep + JUMP_STEP[layout] * Math.floor((currentLength - 1) / JUMP_STEP[layout]);
    if (nextStep >= currentLength) {
      nextStep -= JUMP_STEP[layout];
    }
    setSelected(nextStep);
  }, [layout, resetZoom, setTransformKey, transformKey, selectedIndex, setSelected, assets.length]);

  const handleArrowDown = useCallback(() => {
    if (!layout) {
      return;
    }
    resetZoom();
    setTransformKey(transformKey + 1);
    const currentLength = assets.length;
    const validPrevStep = Math.min(selectedIndex, currentLength - 1);

    const nextStep =
      validPrevStep + JUMP_STEP[layout] < currentLength
        ? validPrevStep + JUMP_STEP[layout]
        : validPrevStep % JUMP_STEP[layout];
    setSelected(nextStep);
  }, [layout, resetZoom, setTransformKey, transformKey, selectedIndex, setSelected, assets.length]);

  const handleNext = useCallback(() => {
    resetZoom();
    setTransformKey(transformKey + 1);

    const currentLength = assets.length;
    const validPrevStep = Math.min(selectedIndex, currentLength - 1);
    const nextStep = (validPrevStep + 1) % currentLength;
    setSelected(nextStep);
  }, [resetZoom, setTransformKey, transformKey, selectedIndex, setSelected, assets.length]);

  const handleBack = useCallback(() => {
    resetZoom();
    setTransformKey(transformKey + 1);
    const currentLength = assets.length;
    const validPrevStep = Math.min(selectedIndex, currentLength - 1);
    const nextStep = (validPrevStep - 1 + currentLength) % currentLength;
    setSelected(nextStep);
  }, [resetZoom, setTransformKey, transformKey, selectedIndex, setSelected, assets.length]);

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
        handleByKey.get(event.key)!();
      }
    };

    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [handleNext, handleBack, handleArrowUp, handleArrowDown]);

  const handleContextMenu = (e: MouseEvent, index: number) => {
    const file = assets[index];
    if (!file) {
      return;
    }
    if (file.type === 'text' || file.type === 'rendering') {
      return;
    }
    onContextMenu(e, index);
  };

  return (
    <FlexCol sx={{ height: '100%' }}>
      <AppPaper
        sx={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="body-sm-rg">{`${selectedIndex + 1} / ${assets.length}`}</Typography>
      </AppPaper>
      <Box
        ref={containerRef}
        data-testid="media-gallery-carousel"
        className="wea-no-scrollbar"
        sx={{ flex: 1, overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {layout && (
          <Grid container spacing={0.5} pt={1}>
            {assets.map((file, i) => (
              <Grid
                data-testid={`carousel-item-${i}`}
                key={file.type === 'rendering' ? `rendering-${i}` : file.id}
                sx={{ width: size, height: size }}
                onClick={() => setSelected(i)}
                onContextMenu={(e) => handleContextMenu(e, i)}
              >
                <GalleryThumbnailViewer file={file} globalIndex={i} selected={selectedIndex} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </FlexCol>
  );
};
