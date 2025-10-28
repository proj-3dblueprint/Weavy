import { useSearchParams, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { generateCloudinaryUrl, renderMediaElement } from '@/components/Nodes/Utils';
import { color } from '@/colors';

export function FileViewer() {
  // Get the full path after /view/
  const location = useLocation();
  const pathAfterView = location.pathname.replace('/view/', '');
  const publicId = pathAfterView || '';

  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const extension = searchParams.get('extension');

  let cloudinaryType = 'image';
  if (type === 'video' || type === 'audio') {
    cloudinaryType = 'video';
  }
  if (type === '3D') {
    cloudinaryType = 'image';
  }
  const decodedUrl = generateCloudinaryUrl(publicId, extension, cloudinaryType);

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <Box
          sx={{
            height: '80%',
            width: '80%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 'auto',
          }}
        >
          {renderMediaElement(decodedUrl, type, { w: 600, h: 600 })}
          {/* <img src={ decodedUrl } width="100%" height="100%" style={{ display: 'block', objectFit: 'contain' }} alt={ type } /> */}
        </Box>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: 30,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '12px',
          color: color.White100,
        }}
      >
        Powered by <b>Weavy</b>
      </Box>
    </>
  );
}
