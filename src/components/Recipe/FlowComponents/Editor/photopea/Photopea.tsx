import { useEffect, useState, useRef, useCallback } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { log } from '@/logger/logger.ts';
import { color } from '@/colors';
import { getAxiosInstance } from '@/services/axiosConfig';
import {
  CONVERT_TO_SMART_OBJECT_SCRIPT,
  CONVERT_BACKGROUND_TO_SMART_OBJECT_SCRIPT,
  COPY_AND_PASTE_INTO_SMART_OBJECT_SCRIPT,
  LAYER_COUNT_SCRIPT,
  SAVE_AS_PSD_SCRIPT,
  config,
} from './photopea.consts';

const logger = log.getLogger('Photopea');
const axiosInstance = getAxiosInstance();

const getIframeContentWindow = () => {
  const iframe = document.getElementById('pp-editor');
  if (!iframe || !(iframe instanceof HTMLIFrameElement) || !iframe.contentWindow) {
    logger.log('Iframe not found');
    return null;
  }
  return iframe.contentWindow;
};

const openSmartObjectLayer = () => {
  getIframeContentWindow()?.postMessage(CONVERT_TO_SMART_OBJECT_SCRIPT, '*');
};

const convertBackgroundToSmartObject = () => {
  getIframeContentWindow()?.postMessage(CONVERT_BACKGROUND_TO_SMART_OBJECT_SCRIPT, '*');
};

const loadImage = (imageUrl: string) => {
  // opens a new doc
  const script = `
      app.open("${imageUrl}");
      `;
  getIframeContentWindow()?.postMessage(script, '*');
};

const copyAndPasteIntoSO = () => {
  getIframeContentWindow()?.postMessage(COPY_AND_PASTE_INTO_SMART_OBJECT_SCRIPT, '*');
};

const countLayers = () => {
  getIframeContentWindow()?.postMessage(LAYER_COUNT_SCRIPT, '*');
};

export function Photopea({
  src,
  psdSrc,
  setCleanup,
  updateResult,
}: {
  src: string;
  psdSrc: string;
  setCleanup: (cleanup: () => Promise<void>) => void;
  updateResult: (data: unknown) => void;
}) {
  const onCloseRef = useRef<(() => void) | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string>();
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const photopeaReady = useRef(false);
  const stage = useRef(0);

  const uploadFileToServer = useCallback(
    async (blob: Blob) => {
      const formData = new FormData();
      formData.append('file', blob, 'image.psd');

      try {
        const response = await axiosInstance.post(`/v1/assets/upload`, formData);
        updateResult(response.data);
        onCloseRef.current?.();
      } catch (uploadError) {
        logger.error('Failed uploading file', uploadError); // Handle any errors
        setError(!!uploadError);
      } finally {
        setIsLoading(false);
      }
    },
    [updateResult],
  );

  useEffect(() => {
    setCleanup(() => {
      return new Promise<void>((resolve) => {
        setError(false);
        setIsLoading(true);
        const contentWindow = getIframeContentWindow();
        if (contentWindow) {
          contentWindow.postMessage(SAVE_AS_PSD_SCRIPT, '*');
        }
        onCloseRef.current = resolve;
      });
    });
  }, [setCleanup]);

  useEffect(() => {
    const configCopy = { ...config };
    configCopy['files'] = psdSrc ? [psdSrc] : [src];
    const encodedConfig = encodeURIComponent(JSON.stringify(configCopy));
    const fullUrl = `https://www.photopea.com/#${encodedConfig}`;
    setIframeUrl(fullUrl);
  }, [src, psdSrc]);

  useEffect(() => {
    let documentCheckInterval: NodeJS.Timeout | null = null;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.photopea.com') return;
      if (event.data instanceof ArrayBuffer) {
        const blob = new Blob([event.data], { type: 'application/octet-stream' });
        void uploadFileToServer(blob);
      } else if (event.data === 'done') {
        if (!photopeaReady.current) {
          photopeaReady.current = true;
          documentCheckInterval = setInterval(countLayers, 1000);
        }
      } else if (typeof event.data === 'string' && event.data.startsWith('layerCount=')) {
        const layerCount = parseInt(event.data.split('=')[1]);
        if (psdSrc) {
          if (stage.current === 0 && layerCount > 0) {
            // psdSrc loaded.
            stage.current++;
            // open the smart layer
            openSmartObjectLayer();
          } else if (stage.current === 1 && layerCount > 0) {
            // Smart object layer opened as new file
            stage.current++;
            // open the src file
            loadImage(src);
          } else if (stage.current === 2 && layerCount > 0) {
            // Src file is opened in a new doc
            stage.current++;
            // copy the layer from src and paste back into smart layer doc.
            copyAndPasteIntoSO();
          } else if (stage.current === 3 && layerCount > 0) {
            if (documentCheckInterval) {
              clearInterval(documentCheckInterval);
            }
          }
        } else {
          if (stage.current === 0 && layerCount > 0) {
            stage.current++;
            convertBackgroundToSmartObject();
          } else {
            if (documentCheckInterval) {
              clearInterval(documentCheckInterval);
            }
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (documentCheckInterval) {
        clearInterval(documentCheckInterval);
      }
    };
  }, [psdSrc, setCleanup, src, uploadFileToServer]);

  return (
    <Box id="photopea-container" sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {iframeUrl && (
        <>
          <iframe
            id="pp-editor"
            src={iframeUrl}
            width="100%"
            height="100%"
            style={{ borderColor: 'transparent' }}
          ></iframe>
          {isLoading ? (
            <Box
              sx={{
                position: 'absolute',
                background: color.Black40_T,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress color="inherit" />
            </Box>
          ) : null}
          <Box
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 'calc(100% - 300px)',
              background: '#474747',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              p: 0.5,
            }}
          >
            {error && (
              <Box sx={{ color: color.Yambo_Orange_Stroke }}>
                ❗ Could not save your file. Please decrease the image size and try again... ❗
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
