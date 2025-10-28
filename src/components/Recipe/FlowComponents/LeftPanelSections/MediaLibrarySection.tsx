import { Box, Grid2 as Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';
import { FlexColCenHorVer } from '@/UI/styles';
import { getMediaArray } from '@/components/Nodes/Utils';
import { useNodes } from '../../FlowContext';
import type { MediaAsset } from '@/types/api/assets';

interface MediaLibrarySectionProps {
  onDragFileStart: (event: React.DragEvent<HTMLDivElement>, item: MediaAsset) => void;
  onDragEnd: (event: React.DragEvent<HTMLDivElement>) => void;
}

type MediaType = 'image' | 'video' | 'audio';

const MEDIA_TYPE_ICONS: Record<MediaType, string> = {
  image: 'fa-regular fa-image',
  video: 'fa-solid fa-video',
  audio: 'fa-solid fa-volume-high',
} as const;

interface MediaIconProps {
  type: MediaType;
}

const MediaIcon = ({ type }: MediaIconProps) => (
  <i className={MEDIA_TYPE_ICONS[type]} style={{ position: 'absolute', top: '4px', left: '4px', opacity: '.75' }} />
);

interface MediaDimensionsProps {
  width?: number;
  height?: number;
}

const MediaDimensions = ({ width, height }: MediaDimensionsProps) => {
  if (!width || !height) return null;

  return (
    <Typography variant="body-sm-rg" sx={{ fontSize: '8px', position: 'absolute', bottom: '2px', left: '6px' }}>
      {width} <i className="fa-solid fa-x fa-xs"></i> {height}
    </Typography>
  );
};

const isMediaType = (type: string): type is MediaType => {
  return type in MEDIA_TYPE_ICONS;
};

export const MediaLibrarySection = ({ onDragFileStart, onDragEnd }: MediaLibrarySectionProps) => {
  const { t } = useTranslation();
  const nodes = useNodes();
  //// POPULATE MEDIA ARRAY (TO USE IN THE MEDIA TAB) - SHOULD BE HANDLED IN THE SERVER SIDE IN THE FUTURE.
  const mediaArray = useMemo(() => getMediaArray(nodes), [nodes]);

  if (!mediaArray || !mediaArray.length) {
    return (
      <FlexColCenHorVer sx={{ width: '100%', height: '100%' }}>
        <Typography variant="body-sm-rg" sx={{ textAlign: 'center', mt: 1 }} color={color.White64_T}>
          {t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.MEDIA_LIBRARY.NO_MEDIA)}
        </Typography>
      </FlexColCenHorVer>
    );
  }

  return (
    <Grid container spacing={1} sx={{ mt: 0, mb: 1 }}>
      {mediaArray.map((item, index) => (
        <Grid key={index} size={6}>
          <Box
            onDragStart={(event) => onDragFileStart(event, item)}
            onDragEnd={(event) => onDragEnd(event)}
            draggable
            className="media-item"
          >
            <Box sx={{ position: 'relative' }}>
              <img
                src={item.type !== 'audio' ? item.thumbnailUrl : '/audio.png'}
                width="100%"
                height="80px"
                style={{ objectFit: 'cover', display: 'block' }}
              />
              {isMediaType(item.type) ? <MediaIcon type={item.type} /> : null}
              {item.type !== 'audio' ? <MediaDimensions width={item.width} height={item.height} /> : null}
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};
