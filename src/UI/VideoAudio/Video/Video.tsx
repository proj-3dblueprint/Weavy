import {
  MediaPlayer,
  MediaPlayerProps,
  MediaProvider,
  Poster,
  type MediaPlayerInstance,
  type PlayerSrc,
} from '@vidstack/react';
import { useMemo, useRef, useState } from 'react';
import './video.css';
import { urlCanParse } from '@/utils/urls';
import { VideoLayout } from './VideoLayout';

interface VideoProps extends Omit<MediaPlayerProps, 'children'> {
  poster?: string;
  noInteraction?: boolean;
}

const SUPPORTED_VIDEO_FORMATS_EXTENSIONS = ['mp4', 'webm', 'ogg', 'ogv', 'mov', 'm4v'];

export const Video = ({ poster, loop = true, noInteraction = false, ...props }: VideoProps) => {
  const player = useRef<MediaPlayerInstance>(null);
  const [isUserPaused, setIsUserPaused] = useState(!props.autoPlay);

  const src = useMemo<PlayerSrc | undefined>(() => {
    if (typeof props.src !== 'string') {
      return props.src;
    }
    if (urlCanParse(props.src)) {
      const url = new URL(props.src);
      const extension = url.pathname.split('.').pop()?.toLocaleLowerCase();
      if (extension && SUPPORTED_VIDEO_FORMATS_EXTENSIONS.includes(extension)) {
        return props.src;
      }
    } else {
      const extension = props.src.split('.').pop()?.toLocaleLowerCase();
      if (extension && SUPPORTED_VIDEO_FORMATS_EXTENSIONS.includes(extension)) {
        return props.src;
      }
    }
    return {
      src: props.src,
      type: 'video/mp4',
    };
  }, [props.src]);

  return (
    <MediaPlayer
      {...props}
      loop={loop}
      style={{ width: '100%', display: 'block' }}
      crossOrigin={props.crossOrigin || 'anonymous'}
      ref={player}
      src={src}
      onMediaPauseRequest={() => {
        setIsUserPaused(true);
      }}
      onMediaPlayRequest={() => {
        setIsUserPaused(false);
      }}
    >
      <MediaProvider mediaProps={{ className: 'video__video-element' }}>
        {poster ? <Poster className="video__poster" src={poster} alt={props.title} /> : null}
      </MediaProvider>
      <VideoLayout isUserPaused={isUserPaused} disabled={noInteraction} />
    </MediaPlayer>
  );
};
