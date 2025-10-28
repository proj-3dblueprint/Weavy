import { useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useMediaGalleryContext } from '@/components/Recipe/FlowComponents/MediaGalleryContext';
import { useHotkeyScope } from '@/hooks/useHotkeyScope';
import { useIsHovered } from '@/hooks/useIsHovered';

export const useShowGallery = (id: string) => {
  const { openGallery } = useMediaGalleryContext();
  const { isHovered, ...hoverElementProps } = useIsHovered();

  const handleOpenGallery = useCallback(() => {
    openGallery({ nodeId: id });
  }, [id, openGallery]);

  const handleSpaceKey = useCallback(
    (event: KeyboardEvent) => {
      if (isHovered) {
        event.preventDefault();
        event.stopPropagation();
        handleOpenGallery();
      }
    },
    [isHovered, handleOpenGallery],
  );

  useHotkeyScope('model-gallery');
  useHotkeys('space', handleSpaceKey, { scopes: 'model-gallery' });

  return {
    handleOpenGallery,
    isHovered,
    ...hoverElementProps,
  };
};
