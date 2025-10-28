import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { DotLottie, DotLottieReact } from '@lottiefiles/dotlottie-react';

type LottieAnimationProps = {
  autoplay?: boolean;
  fallback?: string;
  height?: number;
  loop?: boolean;
  onComplete?: () => void;
  onLoad?: () => void;
  src: string;
  width?: number;
};
export const LottieAnimation = ({
  autoplay = true,
  fallback,
  height,
  loop = true,
  onComplete,
  onLoad,
  src,
  width,
}: LottieAnimationProps) => {
  const [lottieInstance, setLottieInstance] = useState<DotLottie | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const handleLoad = () => {
      onLoad?.();
    };
    const handleComplete = () => {
      onComplete?.();
    };
    const onLoadFailed = () => {
      setLoadFailed(true);
    };

    if (lottieInstance) {
      lottieInstance.addEventListener('load', handleLoad);
      lottieInstance.addEventListener('complete', handleComplete);
      lottieInstance.addEventListener('loadError', onLoadFailed);
    }

    return () => {
      if (lottieInstance) {
        lottieInstance.removeEventListener('load', handleLoad);
        lottieInstance.removeEventListener('complete', handleComplete);
        lottieInstance.removeEventListener('loadError', onLoadFailed);
      }
    };
  }, [lottieInstance, onLoad, onComplete]);

  const isAutoResize = typeof width === 'number' && typeof height === 'number';

  if (!src) return null;

  return (
    <Box component="div" className="lottie-animation" sx={{ width, height }}>
      {loadFailed ? (
        <img src={fallback} alt="Lottie fallback" />
      ) : (
        <DotLottieReact
          src={src}
          loop={loop}
          autoplay={autoplay}
          dotLottieRefCallback={setLottieInstance}
          renderConfig={{
            autoResize: isAutoResize,
          }}
        />
      )}
    </Box>
  );
};
