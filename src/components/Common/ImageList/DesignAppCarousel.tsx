import { Box } from '@mui/material';
import { color } from '@/colors';
import { GalleryThumbnailViewer } from './GalleryThumbnailViewer';
import type { UploadedAsset } from '@/types/api/assets';
import type { ImageListState } from './useImageList';

type DesignAppCarouselProps = Pick<ImageListState, 'imagesPerRow' | 'maxSteps' | 'handleContextMenu'> & {
  images: UploadedAsset[];
  selected: number;
  setSelected: (index: number) => void;
};

export const DesignAppCarousel = ({
  handleContextMenu,
  images,
  imagesPerRow,
  maxSteps,
  selected,
  setSelected,
}: DesignAppCarouselProps) => {
  if (maxSteps < 2) {
    return null;
  }

  const rows = Math.ceil(images.length / imagesPerRow);
  const isSingleRow = images.length <= imagesPerRow;

  return (
    <Box
      sx={{
        width: '100%',
        height: '15%',

        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pb: 4,
      }}
    >
      <Box
        data-testid="design-app-carousel"
        sx={{
          width: '80%',
          height: '100%',
          margin: 'auto',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <Box
            key={rowIndex}
            sx={{
              height: `${100 / rows}%`, // Distribute height evenly among rows
              width: '100%',
              display: 'flex',
              justifyContent: isSingleRow ? 'center' : 'flex-start',
            }}
          >
            {images.slice(rowIndex * imagesPerRow, (rowIndex + 1) * imagesPerRow).map((file, index) => {
              const globalIndex = rowIndex * imagesPerRow + index;

              return (
                <Box
                  key={globalIndex}
                  sx={{
                    height: '100%',
                    width: `${100 / imagesPerRow}%`, // Distribute width evenly
                    border: selected === globalIndex ? `1px solid ${color.Yambo_Purple}` : 'none',
                  }}
                  onClick={() => setSelected(globalIndex)}
                  onContextMenu={(e) => handleContextMenu(e, globalIndex)}
                  data-testid={`design-app-carousel-item-${globalIndex}`}
                >
                  <GalleryThumbnailViewer file={file} globalIndex={globalIndex} selected={selected} />
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
