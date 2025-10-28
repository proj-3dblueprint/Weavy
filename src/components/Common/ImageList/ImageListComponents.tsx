import { IconButton, InputBase, styled } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import { color } from '@/colors';
import { FlexColCenHorVer, FlexCol, Flex } from '@/UI/styles';
import { useWorkflowStore } from '@/state/workflow.state';
import { generateViewingUrl } from '@/components/Nodes/Utils';
import DotsMenu from './DotsMenu';
import DownloadMenu from './DownloadMenu';
import CopyBtnV2 from './CopyBtnV2';
import { isMediaAsset, isRenderingAsset } from './utils';
import { GalleryInfoContainer } from './GalleryInfoContainer';
import type { ImageActions } from './useImageActions';
import type { DeleteFunctions, ImageListContainerType } from './types';
import type { ImageListState } from './useImageList';

export const NonEditableTextarea = styled(InputBase)({
  userSelect: 'text',
  cursor: 'text',
  border: `1px solid ${color.Yambo_Purple_Stroke}`,
  borderRadius: '4px',
  padding: '8px',
});

export const ImageListWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <FlexCol
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {children}
    </FlexCol>
  );
};

export const ImageListContainer = ({
  children,
  fullHeight = false,
}: {
  children: React.ReactNode;
  fullHeight: boolean;
}) => {
  return (
    <FlexColCenHorVer
      data-testid="image-list-container"
      sx={{
        height: fullHeight ? '100%' : '85%',
        width: '100%',
      }}
    >
      {children}
    </FlexColCenHorVer>
  );
};

type ImageListHeaderProps = Pick<ImageListState, 'isSelectedFileText' | 'selectedFile'> &
  ImageActions & {
    onClose?: () => void;
    showHeader?: boolean;
    container: ImageListContainerType;
    deletionFunctions?: DeleteFunctions;
    selected: number;
    zoomPercentage?: number;
  };

export const ImageListHeader = ({
  container,
  deletionFunctions,
  handleCopyImage,
  handleDownload,
  handleDownloadAll,
  isSelectedFileText,
  onClose,
  selected,
  selectedFile,
  showHeader = false,
  zoomPercentage,
}: ImageListHeaderProps) => {
  const [downloadMenuAnchorEl, setDownloadMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [deleteMenuAnchorEl, setDeleteMenuAnchorEl] = useState<HTMLElement | null>(null);

  const { workflowRole, isLatestVersion } = useWorkflowStore();

  if (!showHeader) return null;
  return (
    <Flex
      sx={{
        flexDirection: 'row-reverse',
        height: '60px',
        width: '100%',
        alignItems: 'center',
        px: 1,
      }}
    >
      {container === 'design-app' && (
        <GalleryInfoContainer selectedFile={selectedFile} zoomPercentage={zoomPercentage} />
      )}
      {onClose && (
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      )}
      {isLatestVersion &&
      (workflowRole === 'editor' || container === 'design-app') &&
      selectedFile &&
      deletionFunctions ? (
        <DotsMenu
          disabled={isRenderingAsset(selectedFile)}
          setDeleteMenuAnchorEl={setDeleteMenuAnchorEl}
          deleteMenuAnchorEl={deleteMenuAnchorEl}
          deletionFunctions={deletionFunctions}
        />
      ) : null}
      {isSelectedFileText ? null : (
        <DownloadMenu
          selected={selected}
          setDownloadMenuAnchorEl={setDownloadMenuAnchorEl}
          downloadMenuAnchorEl={downloadMenuAnchorEl}
          handleDownload={handleDownload}
          handleDownloadAll={handleDownloadAll}
          handleCopyImage={handleCopyImage}
          disabled={isRenderingAsset(selectedFile)}
          isAddCopyBtn={selectedFile?.type === 'image'}
        />
      )}
      <CopyBtnV2
        disabled={!isMediaAsset(selectedFile)}
        eventTracking={{ name: 'node_image_copy_link_clicked', payload: {} }}
        text={isMediaAsset(selectedFile) ? generateViewingUrl(selectedFile) : ''}
      />
    </Flex>
  );
};
