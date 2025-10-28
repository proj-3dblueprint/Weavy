import { Box } from '@mui/material';
import { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { GalleryThumbnails } from './GalleryThumbnails';
import type { UploadedAsset } from '@/types/api/assets';

interface SidebarProps {
  images: UploadedAsset[];
  selected: number;
  transformKey: number;
  setSelected: (index: number) => void;
  onContextMenu: (e: React.MouseEvent, index: number) => void;
  setTransformKey: (key: number) => void;
  resetTransformRef: React.RefObject<ReactZoomPanPinchRef>;
  setScale: (scale: number) => void;
}
export const Sidebar = ({
  images,
  selected,
  setSelected,
  onContextMenu,
  transformKey,
  setTransformKey,
  resetTransformRef,
  setScale,
}: SidebarProps) => {
  return (
    <Box sx={{ width: '104px', height: '100%' }}>
      <GalleryThumbnails
        assets={images}
        selected={selected}
        setSelected={setSelected}
        onContextMenu={onContextMenu}
        transformKey={transformKey}
        setTransformKey={setTransformKey}
        resetTransformRef={resetTransformRef}
        setScale={setScale}
      />
    </Box>
  );
};
