import { createContext, RefObject, useCallback, useContext, useState } from 'react';
import { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';

// Create a context for media
const MediaGalleryContext = createContext<{
  isGalleryOpen: boolean;
  openGallery: (opts: { nodeId: string }) => void;
  closeGallery: () => void;
  id?: string;
  resetTransformRef?: RefObject<ReactZoomPanPinchRef>;
} | null>(null);

// Create a hook to use the media context
export const useMediaGalleryContext = () => {
  const ctx = useContext(MediaGalleryContext);
  if (!ctx) {
    throw new Error('useMediaGalleryContext must be used within a MediaGalleryProvider');
  }
  return ctx;
};

export const MediaGalleryProvider = ({ children }) => {
  const [id, setId] = useState<string>();
  const { track } = useAnalytics();
  const closeGallery = useCallback(() => {
    track('media_gallery_closed', {}, TrackTypeEnum.Product);
    setId(undefined);
  }, [track]);

  const openGallery = useCallback(
    ({ nodeId }: { nodeId: string }) => {
      track('media_gallery_opened', {}, TrackTypeEnum.Product);
      setId(nodeId);
    },
    [track],
  );

  return (
    <MediaGalleryContext.Provider value={{ id, isGalleryOpen: !!id, closeGallery, openGallery }}>
      {children}
    </MediaGalleryContext.Provider>
  );
};
