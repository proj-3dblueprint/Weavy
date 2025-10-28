import { useCallback, useEffect } from 'react';
import { useModelBaseView, useNodeData } from '@/components/Recipe/FlowContext';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { useNodeActions } from '@/components/Nodes/useNodeActions';
import { copyImage } from '@/utils/files';
import { log } from '@/logger/logger';
import { useSaveRecipe } from '@/hooks/useSaveRecipe';
import { useMediaGalleryContext } from './MediaGalleryContext';
import { MediaGallery } from './MediaGallery';
import type { BaseNodeData } from '@/types/node';

const logger = log.getLogger('MediaGalleryWrapper');

function ModelMediaGallery() {
  const { id, closeGallery } = useMediaGalleryContext();

  const saveRecipe = useSaveRecipe();

  const { setCoverImage } = useNodeActions();
  const { track } = useAnalytics();
  const nodeData = useNodeData<BaseNodeData>(id || '');
  const { name } = nodeData;
  const inputsInfo = nodeData.handles.input;

  const modelBaseView = useModelBaseView(id || '');

  const generations = modelBaseView.getGenerations();
  const selectedGeneration = generations[modelBaseView.getSelectedIndex()];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Space') {
        e.preventDefault();
        closeGallery();
      }
    },
    [closeGallery],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleDeleteAll = useCallback(() => {
    modelBaseView.deleteAllResults();
    closeGallery();
    void saveRecipe();
  }, [modelBaseView, closeGallery, saveRecipe]);

  const handleDelete = useCallback(
    (id: string) => {
      const index = generations.findIndex((asset) => asset.type !== 'rendering' && asset.id === id);
      if (index !== -1) {
        modelBaseView.deleteResult(index);
      }
      if (generations.length === 1) {
        closeGallery();
      }
      void saveRecipe();
    },
    [generations, saveRecipe, modelBaseView, closeGallery],
  );

  const handleDeleteOthers = useCallback(
    (index: number) => {
      modelBaseView.deleteAllOtherResults(index);
      void saveRecipe();
    },
    [saveRecipe, modelBaseView],
  );

  const handleSetAsCover = () => {
    track('gallery_set_as_cover_clicked', {}, TrackTypeEnum.BI);
    if (selectedGeneration !== null && setCoverImage && selectedGeneration.type === 'image') {
      void setCoverImage(selectedGeneration.url);
    }
  };

  const handleCopyImage = async (id: string) => {
    track('media_gallery_copy_clicked', {}, TrackTypeEnum.BI);
    try {
      const file = generations.find((asset) => asset.type !== 'rendering' && asset.id === id);
      if (file?.type === 'image' && 'url' in file) {
        await copyImage(file);
      }
    } catch (err) {
      logger.error('Failed to copy image:', err as Error);
    }
  };

  if (!id || !selectedGeneration || selectedGeneration.type === 'rendering') {
    return null;
  }

  return (
    <MediaGallery
      title={name}
      assets={generations.filter((asset) => asset.type !== 'rendering')}
      inputsInfo={inputsInfo}
      initialSelectedId={selectedGeneration.id}
      onDelete={handleDelete}
      onDeleteOthers={handleDeleteOthers}
      onDeleteAll={handleDeleteAll}
      onSetAsCover={handleSetAsCover}
      onCopyImage={handleCopyImage}
      onClose={closeGallery}
    />
  );
}

export default ModelMediaGallery;
