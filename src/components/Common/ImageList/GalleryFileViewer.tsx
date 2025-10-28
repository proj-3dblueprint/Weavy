import { MouseEvent, ReactNode } from 'react';
import { Box, Typography, CircularProgress, LinearProgress, TextFieldProps } from '@mui/material';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { color, EL_COLORS } from '@/colors';
import { Flex, FlexCenHor, FlexCenHorVer, FlexColCenHorVer } from '@/UI/styles';
import { Video } from '@/UI/VideoAudio/Video/Video';
import { NodeTextField } from '@/UI/NodeTextField/NodeTextField';
import ThreeDeeViewer from '../../Nodes/ThreeDeeViewer';
import type { ThreeDProps } from './types';
import type { RenderingAsset, MediaAsset, TextAsset } from '@/types/api/assets';

interface BaseGalleryFileViewerProps extends Partial<ThreeDProps> {
  container: 'node' | 'gallery' | 'design-app';
  file: MediaAsset | TextAsset | RenderingAsset;
  handleImageLoad?: () => void;
  index: number;
  isHovered?: boolean;
  maxSteps?: number;
  nativePlayer?: boolean;
  onContextMenu?: (event: React.MouseEvent, index: number) => void;
  onTextChange?: (index: number, newValue: string) => void;
  overlay?: React.ReactNode;
  resetTransformRef?: React.RefObject<ReactZoomPanPinchRef>;
  selected: number;
  setScale?: (scale: number) => void;
  transformKey?: number;
  videoRef?: React.RefObject<HTMLVideoElement>;
  isMultiFilesViewMode?: boolean;
  fixedItemSize?: number;
}

interface NativePlayerGalleryFileViewerProps extends BaseGalleryFileViewerProps {
  nativePlayer: true;
  videoRef: React.RefObject<HTMLVideoElement>;
}

interface NonNativePlayerGalleryFileViewerProps extends BaseGalleryFileViewerProps {
  nativePlayer?: false;
  videoRef?: never;
}

type GalleryFileViewerProps = NativePlayerGalleryFileViewerProps | NonNativePlayerGalleryFileViewerProps;

const Container = ({
  children,
  isSelected,
  onContextMenu,
  isMultiFilesViewMode,
  minHeight,
}: {
  children: ReactNode;
  isSelected: boolean;
  onContextMenu: (event: MouseEvent) => void;
  isMultiFilesViewMode: boolean;
  minHeight?: number;
}) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: minHeight ? `${minHeight}px` : undefined,
        display: isMultiFilesViewMode || isSelected ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onContextMenu={onContextMenu}
    >
      {children}
    </Box>
  );
};

const GALLERY_SIZE = { w: 600, h: 600 };
const NODE_SIZE = { w: 422, h: 422 };

export const GalleryFileViewer: React.FC<GalleryFileViewerProps> = ({
  cameraPosition,
  container,
  file,
  handleImageLoad,
  index,
  is3DLocked,
  isHovered,
  maxSteps,
  nativePlayer = false,
  onContextMenu,
  onTextChange,
  overlay = null,
  resetTransformRef,
  selected,
  setCameraPosition,
  setExported3DImage,
  setScale,
  transformKey,
  videoRef,
  isMultiFilesViewMode = false,
  fixedItemSize,
}) => {
  const isGallery = container === 'gallery' || container === 'design-app';

  const onContextMenuClick = (event: React.MouseEvent) => {
    onContextMenu?.(event, index);
  };

  const onZoom = (ref: ReactZoomPanPinchRef) => {
    setScale?.(ref.state.scale);
  };

  const isSelected = index === selected;
  const containerSize = fixedItemSize ? { w: fixedItemSize, h: fixedItemSize } : isGallery ? GALLERY_SIZE : NODE_SIZE;

  if (file.type === 'text' && isGallery) {
    return (
      <Container isSelected={isSelected} onContextMenu={onContextMenuClick} isMultiFilesViewMode={isMultiFilesViewMode}>
        <FlexCenHorVer>
          <Box
            sx={{
              width: '480px',
              maxHeight: '500px',
              overflow: 'auto',
              bgcolor: color.Black84,
              borderRadius: 1,
              border: `1px solid ${EL_COLORS.BoxBorder}`,
              p: 4,
            }}
          >
            <Typography variant="body-std-rg">{'value' in file ? file.value : ''}</Typography>
          </Box>
        </FlexCenHorVer>
      </Container>
    );
  }

  return (
    <Container
      isSelected={isSelected}
      onContextMenu={onContextMenuClick}
      isMultiFilesViewMode={isMultiFilesViewMode}
      minHeight={fixedItemSize}
    >
      {file.type === 'image' && (
        <>
          {container === 'node' ? (
            <img
              src={file.viewUrl || file.url}
              draggable="false"
              style={{ width: '100%', height: '100%', display: 'block', position: 'relative' }}
            />
          ) : (
            <TransformWrapper
              centerZoomedOut
              limitToBounds
              minScale={1}
              pinch={{
                step: 100,
              }}
              onZoom={onZoom}
              ref={resetTransformRef}
              key={transformKey}
            >
              <TransformComponent>
                <img
                  className="media-container"
                  onLoad={handleImageLoad}
                  src={file.url}
                  draggable="false"
                  style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', margin: 'auto' }}
                />
              </TransformComponent>
            </TransformWrapper>
          )}
        </>
      )}

      {file.type === 'video' ? (
        nativePlayer ? (
          <video
            key={`video-${index}`}
            crossOrigin="anonymous"
            draggable="false"
            src={file.url}
            controls
            loop
            ref={videoRef}
            style={{ width: '100%', height: '100%', display: 'block', position: 'relative' }}
          />
        ) : (
          <Video
            key={`video-${index}`}
            crossOrigin="anonymous"
            draggable="false"
            src={file.url}
            loop
            noInteraction={!isSelected}
          />
        )
      ) : null}

      {(isMultiFilesViewMode || isSelected) && file.type === '3D' && (
        <FlexCenHor
          className={container === 'node' ? 'nowheel nodrag nopan' : ''}
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            alignItems: 'center',
          }}
        >
          <ThreeDeeViewer
            key={file.url}
            objUrl={file.url}
            containerSize={containerSize}
            setExportedImage={setExported3DImage}
            lockOrbit={is3DLocked || false}
            cameraPosition={cameraPosition || { x: -3, y: 4, z: 5 }}
            setCameraPosition={setCameraPosition}
            allowInteraction={!isMultiFilesViewMode}
            isSelected={isSelected}
            displayBackground={isMultiFilesViewMode}
          />
        </FlexCenHor>
      )}

      {file.type === 'audio' && (
        <FlexCenHorVer sx={{ height: '100%', width: '100%' }}>
          <audio crossOrigin="anonymous" draggable="false" src={file.url} controls loop />
        </FlexCenHorVer>
      )}

      {file.type === 'text' && !isGallery && (
        <Flex sx={{ bgcolor: color.Black84, width: '100%', position: 'relative' }} className="nodrag">
          <NodeTextField
            color={color.White64_T as TextFieldProps['color']}
            expandable={true}
            value={'value' in file ? file.value : ''}
            multiline
            minRows={6}
            fullWidth
            size="small"
            onChange={(e) => {
              if (onTextChange) {
                onTextChange(index, e.target.value);
              }
            }}
            sx={{
              bgcolor: color.Black84,
              borderColor: EL_COLORS.BoxBorder,
              '& .MuiOutlinedInput-root': {
                transition: 'padding 0.1s ease-in-out',
                borderRadius: 2,
                p: 3,
                pt: maxSteps && maxSteps > 1 ? 5 : 3,
                pb: 4,
                '& fieldset': {
                  borderColor: EL_COLORS.BoxBorder,
                },
                '&:hover fieldset': {
                  borderColor: EL_COLORS.BoxBorder,
                },
                '&.Mui-focused fieldset': {
                  borderColor: EL_COLORS.BoxBorder,
                },
              },
            }}
          />
        </Flex>
      )}

      {file.type === 'rendering' && (
        <FlexCenHorVer
          sx={{
            height: '100%',
            width: '100%',
            borderRadius: 2,
            border: `1px solid ${color.White64_T}`,
            backgroundColor: color.Black100,
          }}
        >
          {file.progress !== undefined ? (
            <FlexColCenHorVer sx={{ width: '80%', gap: 0.5 }}>
              <Typography
                variant="body-sm-rg"
                sx={{
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '2.75rem',
                  lineHeight: '2.8rem',
                  fontWeight: '500',
                }}
              >
                {file.progress}%
              </Typography>
              <LinearProgress sx={{ width: '100%' }} color="weavy_cta" variant="determinate" value={file.progress} />
            </FlexColCenHorVer>
          ) : (
            <CircularProgress color="weavy_cta" />
          )}
        </FlexCenHorVer>
      )}
      {overlay}
      {container === 'node' && !isMultiFilesViewMode ? (
        <Box
          data-testid="gradient-overlay-container"
          sx={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            pointerEvents: 'none',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.1s ease-in-out',
          }}
        >
          <FlexCenHor
            data-testid="bottom-gradient-overlay"
            sx={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: '80px',
              background: 'linear-gradient(to top,#343337D3, #6B6B7800)',
              pointerEvents: 'none',
              filter: 'blur(30px)',
              transform: 'scale(1.8)  translateY(30px)',
            }}
          />
          <FlexCenHor
            data-testid="top-gradient-overlay"
            sx={{
              position: 'absolute',
              top: 0,
              width: '100%',
              height: '80px',
              background: 'linear-gradient(to bottom,#343337D3, #6B6B7800)',
              pointerEvents: 'none',
              filter: 'blur(30px)',
              transform: 'scale(1.8)  translateY(-30px)',
            }}
          />
        </Box>
      ) : null}
    </Container>
  );
};
