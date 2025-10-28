import { useCallback } from 'react';
import { Box } from '@mui/material';
import noop from 'lodash/noop';
import { color, EL_COLORS } from '@/colors';
import { FileViewer } from '@/components/Nodes/Shared/FileViewer';
import { UploadedAsset } from '@/types/api/assets';
import { GalleryFileViewer } from '../Common/ImageList/GalleryFileViewer';
import { ThreeDProps } from '../Common/ImageList/types';
import type { RefObject, MouseEvent } from 'react';
import type { FileKind, NodeId } from 'web';

export interface GridItemProps {
  nodeId: NodeId;
  file: FileKind | UploadedAsset;
  index: number;
  isSelected: boolean;
  onFileClick: (index: number) => void;
  isNodeLocked?: boolean;
  isCameraLocked?: boolean;
  on3DLockStateChange?: (locked: boolean) => void;
  totalFiles: number;
  shouldUseLegacyFileViewer: boolean;
  isHovered: boolean;
  threeDProps?: ThreeDProps;
  maxSteps?: number;
  handleImageLoad?: () => void;
  onContextMenu?: (event: MouseEvent, index: number) => void;
  onTextChange?: (index: number, newValue: string) => void;
  selected: number;
  videoRef?: RefObject<HTMLVideoElement>;
  fixedItemSize?: number;
}

export const GridItem = ({
  nodeId,
  file,
  index,
  isSelected,
  onFileClick,
  isNodeLocked = false,
  on3DLockStateChange,
  totalFiles,
  shouldUseLegacyFileViewer,
  isHovered,
  threeDProps,
  maxSteps,
  handleImageLoad = noop,
  onContextMenu,
  onTextChange,
  selected,
  videoRef,
  fixedItemSize,
}: GridItemProps) => {
  const handleFileClick = useCallback(() => {
    onFileClick(index);
  }, [onFileClick, index]);

  return (
    <Box
      onClick={handleFileClick}
      sx={{
        borderRadius: 2,
        border: isSelected ? `2px solid ${color.Yellow40}` : `1px solid ${EL_COLORS.BoxBorder}`,
        filter: isSelected ? 'none' : 'brightness(0.5)',
        transition: 'all 0.2s ease-in-out',
        marginBottom: 0.5,
        '&:hover': {
          filter: isSelected ? 'none' : 'brightness(0.7)',
        },
        overflow: 'hidden',
        height: fixedItemSize ? `${fixedItemSize}px` : 'auto',
      }}
      className="nodrag"
    >
      {shouldUseLegacyFileViewer ? (
        <GalleryFileViewer
          cameraPosition={threeDProps?.cameraPosition} // TODO every file should get its own camera position
          container="node"
          index={index}
          file={file as UploadedAsset}
          handleImageLoad={handleImageLoad}
          is3DLocked={threeDProps?.is3DLocked}
          isHovered={isHovered}
          maxSteps={maxSteps}
          nativePlayer={true}
          onContextMenu={onContextMenu}
          onTextChange={onTextChange}
          overlay={null}
          resetTransformRef={undefined} // this is used when in app or in app gallery mode, not relevant in node view
          selected={selected}
          setCameraPosition={noop}
          setExported3DImage={threeDProps?.setExported3DImage}
          setScale={noop} // this is used when in app or in app gallery mode, not relevant in node view
          transformKey={0} // this is used when in app or in app gallery mode, not relevant in node view
          videoRef={videoRef!} // we currently dont support video behavior in import and media iterator nodes, once we do we'll pass videoRef consistently
          isMultiFilesViewMode={true}
          fixedItemSize={fixedItemSize}
        />
      ) : (
        <FileViewer
          isMultiFilesViewMode={true}
          id={nodeId}
          index={index}
          asset={file}
          hideOverlay={true}
          isNodeLocked={isNodeLocked}
          isCameraLocked={true}
          isClickable={true}
          on3DLockStateChange={on3DLockStateChange}
          selected={selected}
          steps={totalFiles}
        />
      )}
    </Box>
  );
};
