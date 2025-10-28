import { Box, CircularProgress } from '@mui/material';
import { color } from '@/colors';
import { FlexCenHorVer, FlexColCenHorVer } from '@/UI/styles';
import { TextIcon } from '@/UI/Icons/TextIcon';
import { AudioIcon } from '@/UI/Icons/AudioIcon';
import { ThreeDIcon } from '@/UI/Icons/ThreeDIcon';
import { ImageIcon } from '@/UI/Icons/ImageIcon';
import type { RenderingAsset, MediaAsset, AssetType, TextAsset } from '@/types/api/assets';

type NoPreviewType = Extract<AssetType, 'text' | 'audio' | '3D'>;

const StyledImage = ({
  selected,
  index,
  src,
  alt,
  borderRadius,
}: {
  selected: number;
  index: number;
  src: string;
  alt: string;
  borderRadius: number;
}) => {
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{
        display: 'block',
        height: '100%',
        width: '100%',
        objectFit: 'cover',
        filter: selected !== index ? 'grayscale(100%) brightness(60%)' : 'none',
        cursor: 'pointer',
        borderRadius,
        '&:hover': {
          filter: selected !== index ? 'grayscale(100%) brightness(80%)' : 'none',
        },
      }}
    />
  );
};

const ThumbnailIcon: Record<NoPreviewType, React.ReactNode> = {
  text: <TextIcon width={32} height={32} />,
  audio: <AudioIcon width={32} height={32} />,
  '3D': <ThreeDIcon width={32} height={32} />,
};

const Thumbnail = ({ isSelected, type }: { isSelected: boolean; type: NoPreviewType }) => {
  return (
    <FlexCenHorVer
      sx={{
        bgcolor: isSelected ? color.Black64 : color.Black92,
        border: `1px solid ${color.White04_T}`,
        '&:hover': {
          bgcolor: color.Black84,
        },
        height: '100%',
        width: '100%',
        cursor: 'pointer',
        borderRadius: 1,
      }}
    >
      {ThumbnailIcon[type] || <ImageIcon width={32} height={32} />}
    </FlexCenHorVer>
  );
};

interface GalleryThumbnailViewerProps {
  file: MediaAsset | TextAsset | RenderingAsset;
  globalIndex: number;
  selected: number;
}

export const GalleryThumbnailViewer = ({ file, globalIndex, selected }: GalleryThumbnailViewerProps) => {
  if ((file.type === 'image' || file.type === 'video') && file.thumbnailUrl) {
    return (
      <StyledImage
        src={file.thumbnailUrl}
        alt={`Image ${globalIndex}`}
        selected={selected}
        index={globalIndex}
        borderRadius={1}
      />
    );
  }

  if (file.type === 'audio') {
    return <Thumbnail isSelected={selected === globalIndex} type="audio" />;
  }

  if (file.type === 'rendering') {
    return (
      <FlexColCenHorVer
        sx={{
          height: '100%',
          borderRadius: 1,
          border: `1px solid ${color.White64_T}`,
          backgroundColor: color.Black100,
        }}
      >
        <CircularProgress size={20} sx={{ color: color.White64_T }} />
      </FlexColCenHorVer>
    );
  }

  return <Thumbnail isSelected={selected === globalIndex} type={file.type as NoPreviewType} />;
};
