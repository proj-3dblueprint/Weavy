import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';
import { useModelBaseView } from '@/components/Recipe/FlowContext';
import { ImageList } from '@/components/Common/ImageList/ImageList';
import { NodeViewMode } from '@/enums/node-view-mode.enum';
import { renderEmptyState } from '../ModelNodesUtils';
import { useShowGallery } from './useShowGallery';
import type { HandleType } from '@/enums/handle-type.enum';
import type { ThreeDProps } from '@/components/Common/ImageList/types';
import type { ModelBaseNodeData } from '@/types/nodes/model';

interface ModelResultsProps {
  shouldUseLegacyFileViewer: boolean;
  coverImage?: string;
  data: ModelBaseNodeData;
  id: string;
  isProcessing?: boolean;
  noEmptyState?: boolean;
  nodeOutputType?: HandleType;
  onTextChange?: (index: number, newValue: string) => void;
  selected: number;
  setSelected: React.Dispatch<React.SetStateAction<number>>;
  threeDProps?: ThreeDProps;
  viewMode?: NodeViewMode;
}

export const ModelResults = ({
  shouldUseLegacyFileViewer,
  coverImage,
  data,
  id,
  isProcessing = false,
  noEmptyState = false,
  nodeOutputType,
  onTextChange,
  selected,
  setSelected,
  threeDProps,
  viewMode = NodeViewMode.Single,
}: ModelResultsProps) => {
  const { t } = useTranslation();
  const { isHovered, handleOpenGallery, ...elementProps } = useShowGallery(id);
  const imageLoadFailed = useRef(false);
  const modelBaseView = useModelBaseView(id);
  const generations = modelBaseView.getGenerations();

  if (generations.length === 0) {
    if (coverImage && !imageLoadFailed.current) {
      return (
        <Box sx={{ width: '100%' }}>
          <img src={coverImage} width="100%" alt="model cover image" onError={() => (imageLoadFailed.current = true)} />
        </Box>
      );
    } else if (noEmptyState) {
      return null;
    } else {
      return renderEmptyState(nodeOutputType, isProcessing, t);
    }
  }

  return (
    <Box
      className={viewMode === NodeViewMode.Single ? 'media-container-dark' : ''}
      sx={{
        position: 'relative',
      }}
      {...elementProps}
    >
      <ImageList
        isHovered={isHovered}
        onOpenGalleryClick={handleOpenGallery}
        nodeName={data.name}
        images={generations}
        onTextChange={onTextChange}
        selected={selected}
        setSelected={setSelected}
        container="node"
        disabled={data.isLocked}
        threeDProps={generations.some((generation) => generation.type?.includes('3D')) ? threeDProps : undefined}
        viewMode={viewMode}
        nodeId={id}
        shouldUseLegacyFileViewer={shouldUseLegacyFileViewer}
      />
    </Box>
  );
};
