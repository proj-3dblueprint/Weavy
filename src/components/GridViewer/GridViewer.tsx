import { useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { color } from '@/colors';
import { FlexCol, FlexRow } from '@/UI/styles';
import { UploadedAsset } from '@/types/api/assets';
import { ThreeDProps } from '../Common/ImageList/types';
import { GridItem } from './GridItem';
import type { FileKind, NodeId } from 'web';

const NODE_WIDTH = 422;

export interface GridViewerProps {
  nodeId: NodeId;
  files: FileKind[] | UploadedAsset[];
  selectedIndex: number;
  onFileSelect: (index: number) => void;
  isNodeLocked?: boolean;
  on3DLockStateChange?: (locked: boolean) => void;
  className?: string;
  shouldUseLegacyFileViewer?: boolean;
  // props for legacy GalleryFileViewer
  isHovered?: boolean;
  threeDProps?: ThreeDProps;
  maxSteps?: number;
  onContextMenu?: (event: React.MouseEvent, index: number) => void;
  onTextChange?: (index: number, newValue: string) => void;
  videoRefs?: React.RefObject<HTMLVideoElement>[];
}

export const GridViewer = ({
  nodeId,
  files,
  selectedIndex,
  onFileSelect,
  isNodeLocked = false,
  on3DLockStateChange,
  className,
  shouldUseLegacyFileViewer = false,
  // props for legacy GalleryFileViewer
  isHovered = false,
  threeDProps,
  maxSteps,
  onContextMenu,
  onTextChange,
  videoRefs,
}: GridViewerProps) => {
  const distributeFilesIntoCloumns = useCallback(() => {
    const fileCount = files.length;
    const columns = fileCount <= 4 ? 2 : 3;
    const cols: Array<{ file: FileKind; globalIndex: number }[]> = Array.from({ length: columns }, () => []);
    files.forEach((file, index) => {
      const columnIndex = index % columns;
      cols[columnIndex].push({ file, globalIndex: index });
    });

    return { gridColumns: cols };
  }, [files]);

  const getItemSquareSize = useCallback((columnCount, isImageType) => {
    const columnWidth = NODE_WIDTH / columnCount;
    return !isImageType ? columnWidth : undefined;
  }, []);

  const isImageType = files && files[0]?.type === 'image';
  const { gridColumns } = useMemo(distributeFilesIntoCloumns, [files]);
  const fixedItemSquareSize = useMemo(
    () => getItemSquareSize(gridColumns.length, isImageType),
    [gridColumns.length, isImageType],
  );

  return (
    <FlexCol className={className} sx={{ width: '100%' }}>
      <Box
        sx={{
          height: '430px',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: color.Black88,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: color.Black40,
            '&:hover': {
              backgroundColor: color.Black64,
            },
          },
        }}
      >
        <FlexRow sx={{ gap: 0.5, mr: 0.5 }}>
          {gridColumns.map((columnFiles, columnIndex) => (
            <FlexCol key={`column-${columnIndex}`} sx={{ flex: 1, minWidth: 0 }}>
              {columnFiles.map(({ file, globalIndex }) => (
                <GridItem
                  shouldUseLegacyFileViewer={shouldUseLegacyFileViewer}
                  key={`file-${globalIndex}`}
                  nodeId={nodeId}
                  file={file}
                  index={globalIndex}
                  isSelected={globalIndex === selectedIndex}
                  onFileClick={onFileSelect}
                  isNodeLocked={isNodeLocked}
                  on3DLockStateChange={on3DLockStateChange}
                  totalFiles={files.length}
                  selected={selectedIndex}
                  // props for legacy GalleryFileViewer
                  isHovered={isHovered}
                  threeDProps={threeDProps}
                  maxSteps={maxSteps}
                  onContextMenu={onContextMenu}
                  onTextChange={onTextChange}
                  videoRef={videoRefs?.[globalIndex]}
                  fixedItemSize={fixedItemSquareSize}
                />
              ))}
            </FlexCol>
          ))}
        </FlexRow>
      </Box>
    </FlexCol>
  );
};
