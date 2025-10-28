import { Box, Typography } from '@mui/material';

import { useTranslation } from 'react-i18next';
import ThreeDeeViewer from '@/components/Nodes/ThreeDeeViewer';
import { I18N_KEYS } from '@/language/keys';
import { Flex } from '@/UI/styles';
import type { ThreeDProps } from '../ImageList/types';

export const MediaElement = ({
  url,
  type,
  poster,
  maxHeight,
  threeDProps,
}: {
  url?: string;
  type?: string;
  poster?: string;
  maxHeight?: number;
  threeDProps?: ThreeDProps;
}) => {
  const { t: translate } = useTranslation();

  if (!url) return null;
  if (type === 'video') {
    let extension = url.split('.').pop();
    if (extension?.includes('?')) {
      extension = extension.split('?')[0];
    }
    if (extension === 'mov') extension = 'mp4';
    return (
      <video
        style={{ display: 'block' }}
        draggable={false}
        key={url}
        poster={poster}
        crossOrigin="anonymous"
        width="100%"
        controls
        loop
      >
        <source src={url} type={`video/${extension}`} />
      </video>
      // <Video
      //   poster={poster}
      //   src={{ src: url, type: `video/${extension}` as VideoMimeType }}
      //   key={url}
      //   draggable={false}
      // />
    );
  } else if (type === 'image') {
    return (
      <img
        draggable={false}
        src={url}
        alt="Media"
        style={{ display: 'block', height: 'auto', maxHeight, objectFit: 'contain', width: '100%' }}
      />
    );
  } else if (type === 'audio') {
    return (
      <>
        <Flex
          className="media-container-dark"
          sx={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
        >
          <img src="/audio.png" alt="Audio" style={{ display: 'block', width: '100%', mixBlendMode: 'multiply' }} />
          <audio
            className="file-uploader-audio"
            draggable="false"
            crossOrigin="anonymous"
            src={url}
            controls
            style={{
              display: 'block',
              width: '80%',
              position: 'absolute',
              top: `calc(50% - 30px)`,
              left: `calc(50% - 40%)`,
            }}
          />
        </Flex>
      </>
    );
  } else if (type === '3D') {
    return (
      <Box className="nodrag nopan" sx={{ width: '100%', height: '100%' }}>
        <ThreeDeeViewer
          objUrl={url}
          containerSize={{ w: 422, h: 422 }}
          setExportedImage={threeDProps?.setExported3DImage}
          cameraPosition={threeDProps?.cameraPosition}
          setCameraPosition={threeDProps?.setCameraPosition}
          lockOrbit={threeDProps?.is3DLocked}
        />
      </Box>
    );
  } else {
    return <Typography>{translate(I18N_KEYS.COMMON_COMPONENTS.FILE_UPLOADER.NO_PREVIEW)}</Typography>;
  }
};
