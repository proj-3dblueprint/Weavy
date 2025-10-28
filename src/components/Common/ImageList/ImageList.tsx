import { Box } from '@mui/material';
import noop from 'lodash/noop';
import { GridViewer } from '@/components/GridViewer/GridViewer';
import { NodeViewMode } from '@/enums/node-view-mode.enum';
import { AssetOverlay } from '../AssetOverlay/AssetOverlay';
import GalleryMenu from './GalleryMenu';
import { GalleryFileViewer } from './GalleryFileViewer';
import { useImageList, type ImageListState } from './useImageList';
import { useImageActions, type ImageActions } from './useImageActions';
import { ImageListContainer, ImageListHeader, ImageListWrapper } from './ImageListComponents';
import { DesignAppCarousel } from './DesignAppCarousel';
import type { ThreeDProps, DeleteFunctions, ImageListContainerType } from './types';
import type { UploadedAsset } from '@/types/api/assets';
import type { SxProps } from '@mui/material/styles';
import type { NodeId } from 'web';

type ImageListProps = {
  container: ImageListContainerType;
  deletionFunctions?: DeleteFunctions;
  disabled?: boolean;
  images: UploadedAsset[];
  isHovered?: boolean;
  nodeName: string;
  onClose?: () => void;
  onOpenGalleryClick?: () => void;
  onTextChange?: (index: number, newValue: string) => void;
  selected: number;
  setSelected: React.Dispatch<React.SetStateAction<number>>;
  showHeader?: boolean;
  threeDProps?: ThreeDProps;
  // grid view props
  viewMode?: NodeViewMode;
  nodeId?: NodeId;
  shouldUseLegacyFileViewer?: boolean;
  isCameraLocked?: boolean;
  on3DLockStateChange?: (locked: boolean) => void;
};

type ImageViewerWrapperProps = {
  children?: React.ReactNode;
  container: ImageListContainerType;
  disabled?: boolean;
  images: UploadedAsset[];
  isHovered?: boolean;
  onOpenGalleryClick?: () => void;
  onTextChange?: (index: number, newValue: string) => void;
  selected: number;
  setSelected: React.Dispatch<React.SetStateAction<number>>;
  sx?: SxProps;
  threeDProps?: ThreeDProps;
  // props for grid view
  viewMode?: NodeViewMode;
  nodeId?: NodeId;
  shouldUseLegacyFileViewer?: boolean;
  isCameraLocked?: boolean;
  on3DLockStateChange?: (locked: boolean) => void;
} & Pick<
  ImageListState,
  | 'contextMenu'
  | 'handleBack'
  | 'handleContextMenu'
  | 'handleContextMenuClose'
  | 'handleImageLoad'
  | 'handleNext'
  | 'handleSetAsCover'
  | 'imgRef'
  | 'maxSteps'
  | 'resetTransformRef'
  | 'rightClickedIndex'
  | 'selectedFile'
  | 'setScale'
  | 'transformKey'
  | 'videoRefs'
> &
  ImageActions;

const ImageViewerWrapper = ({
  children,
  container,
  contextMenu,
  disabled,
  handleBack,
  handleContextMenu,
  handleContextMenuClose,
  handleCopyImage,
  handleDownload,
  handleDownloadAll,
  handleImageLoad,
  handleNext,
  handleSetAsCover,
  images,
  imgRef,
  isHovered,
  maxSteps,
  onOpenGalleryClick,
  onTextChange,
  resetTransformRef,
  rightClickedIndex,
  selected,
  selectedFile,
  setSelected,
  setScale,
  sx,
  threeDProps,
  transformKey,
  videoRefs,
  // New props for grid view
  viewMode = NodeViewMode.Single,
  nodeId,
  shouldUseLegacyFileViewer = false,
}: ImageViewerWrapperProps) => {
  const {
    cameraPosition = undefined,
    setCameraPosition = noop,
    is3DLocked = false,
    setIs3DLocked = noop,
    setExported3DImage = noop,
  } = threeDProps || {};

  const showOverlay = !disabled && container !== 'design-app';
  // // ref is using for zooming purposes in the single file view mode, not relevant in grid view
  const imgContainerRef = viewMode === NodeViewMode.Grid ? undefined : imgRef;

  return (
    <Box
      data-testid="image-list-wrapper"
      ref={imgContainerRef}
      sx={{ ...sx, width: viewMode === NodeViewMode.Grid ? '100%' : sx?.['width'] }}
      onClick={(event) => event.stopPropagation()}
    >
      {viewMode === NodeViewMode.Grid ? (
        <GridViewer
          nodeId={nodeId!}
          files={images}
          selectedIndex={selected}
          onFileSelect={setSelected}
          isNodeLocked={disabled}
          shouldUseLegacyFileViewer={shouldUseLegacyFileViewer}
          // props for legacy GalleryFileViewer
          isHovered={isHovered}
          threeDProps={threeDProps}
          maxSteps={maxSteps}
          onContextMenu={handleContextMenu}
          onTextChange={onTextChange}
          videoRefs={videoRefs}
        />
      ) : (
        // single file view mode
        <>
          {images.map((file, index) => (
            <GalleryFileViewer
              cameraPosition={cameraPosition}
              container={container}
              file={file}
              handleImageLoad={handleImageLoad}
              index={index}
              is3DLocked={is3DLocked}
              isHovered={isHovered}
              key={index}
              maxSteps={maxSteps}
              onContextMenu={handleContextMenu}
              onTextChange={onTextChange}
              resetTransformRef={resetTransformRef}
              selected={selected}
              setCameraPosition={setCameraPosition}
              setExported3DImage={setExported3DImage}
              setIs3DLocked={setIs3DLocked}
              setScale={setScale}
              transformKey={transformKey}
              overlay={
                showOverlay ? (
                  <AssetOverlay
                    asset={selectedFile}
                    handleBack={handleBack}
                    handleNext={handleNext}
                    is3DLocked={is3DLocked}
                    isHovered={isHovered}
                    steps={maxSteps}
                    openGallery={onOpenGalleryClick}
                    selected={selected}
                    setIs3DLocked={setIs3DLocked}
                  />
                ) : null
              }
              nativePlayer
              videoRef={videoRefs[index]}
              // {...(container === 'design-app' ? { nativePlayer: true, videoRef } : { nativePlayer: false })}
            />
          ))}
        </>
      )}
      <GalleryMenu
        contextMenu={contextMenu}
        handleContextMenuClose={handleContextMenuClose}
        handleCopyImage={handleCopyImage}
        handleDownload={handleDownload}
        handleDownloadAll={handleDownloadAll}
        handleSetAsCover={handleSetAsCover}
        rightClickedIndex={rightClickedIndex}
        selectedFile={selectedFile}
      />
      {children}
    </Box>
  );
};

export const ImageList = (props: ImageListProps) => {
  const {
    container,
    deletionFunctions,
    disabled,
    images,
    isHovered,
    nodeName,
    onClose,
    onOpenGalleryClick,
    onTextChange,
    selected,
    showHeader,
    threeDProps,
    setSelected,
    // grid view props
    viewMode = NodeViewMode.Single,
    nodeId,
    shouldUseLegacyFileViewer = false,
  } = props;

  const {
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
    videoRefs,
    zoomPercentage,
  } = useImageList({ container, disabled, images, selected, setSelected });

  const { handleDownload, handleDownloadAll, handleCopyImage } = useImageActions({
    handleContextMenuClose,
    images,
    nodeName,
  });

  const imageListContainerWidthProperty = threeDProps ? 'auto' : '100%';
  const isDesignApp = container === 'design-app';

  if (!Array.isArray(images)) {
    return null;
  }

  return (
    <ImageListWrapper>
      <ImageListContainer fullHeight={isDesignApp ? maxSteps < 2 : true}>
        <ImageListHeader
          container={container}
          deletionFunctions={deletionFunctions}
          handleCopyImage={handleCopyImage}
          handleDownload={handleDownload}
          handleDownloadAll={handleDownloadAll}
          isSelectedFileText={isSelectedFileText}
          onClose={onClose}
          selected={selected}
          selectedFile={selectedFile}
          showHeader={showHeader}
          zoomPercentage={zoomPercentage}
        />
        <ImageViewerWrapper
          sx={{
            maxWidth: isDesignApp ? 'none' : 600,
            width: isDesignApp ? '90%' : imageListContainerWidthProperty,
            height: isDesignApp ? '85%' : 'auto',
            margin: 'auto',
            position: 'relative',
          }}
          container={container}
          contextMenu={contextMenu}
          handleBack={handleBack}
          handleContextMenu={handleContextMenu}
          handleContextMenuClose={handleContextMenuClose}
          handleCopyImage={handleCopyImage}
          handleDownload={handleDownload}
          handleDownloadAll={handleDownloadAll}
          handleNext={handleNext}
          handleImageLoad={handleImageLoad}
          handleSetAsCover={handleSetAsCover}
          images={images}
          imgRef={imgRef}
          isHovered={isHovered}
          maxSteps={maxSteps}
          onTextChange={onTextChange}
          resetTransformRef={resetTransformRef}
          rightClickedIndex={rightClickedIndex}
          selected={selected}
          selectedFile={selectedFile}
          setScale={setScale}
          threeDProps={threeDProps}
          transformKey={transformKey}
          videoRefs={videoRefs}
          onOpenGalleryClick={onOpenGalleryClick}
          disabled={disabled}
          setSelected={setSelected}
          // grid view props
          viewMode={viewMode}
          nodeId={nodeId}
          shouldUseLegacyFileViewer={shouldUseLegacyFileViewer}
        />
      </ImageListContainer>
      {isDesignApp && (
        <DesignAppCarousel
          handleContextMenu={handleContextMenu}
          images={images}
          imagesPerRow={imagesPerRow}
          maxSteps={maxSteps}
          selected={selected}
          setSelected={setSelected}
        />
      )}
    </ImageListWrapper>
  );
};
