import { useCallback, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { HandleType } from '@/enums/handle-type.enum';
import { FlexCenHorVer, FlexColCenVer } from '@/UI/styles';
import GalleryGradientOverlay from '@/components/Common/GalleryGradientOverlay';
import { useIsHovered } from '@/hooks/useIsHovered';
import { AssetOverlay, type AssetOverlayProps } from '@/components/Common/AssetOverlay/AssetOverlay';
import { CompactMediaPlayerControls } from '@/components/MediaPlayerControls/MediaPlayerControls';
import { useFlowState, useFlowView, useNodeRenderTarget, useVideoView } from '../../Recipe/FlowContext';
import type { MouseEvent } from 'react';
import type { Input, NodeId } from 'web';
import type { UploadedAsset } from '@/types/api/assets';

export function VideoViewer({
  id,
  handleContextMenu,
  onVideoPause,
  onVideoScrub,
  disabled,
  overlay,
  index,
}: {
  id: NodeId;
  handleContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
  onVideoPause?: (time: number) => void;
  onVideoScrub?: (time: number, ongoing: boolean) => void;
  disabled?: boolean;
  overlay?: React.ReactNode;
  index?: number;
}) {
  const canvasRef = useNodeRenderTarget(id, index ?? 0);
  const videoView = useVideoView(id);
  const { paused, currentTime, duration, muted, hasAudio, fps } = useFlowState((s) => s.video[id]) ?? {
    paused: true,
    currentTime: 0,
    duration: 1,
    muted: true,
    hasAudio: false,
    fps: 30,
  };

  const handleTogglePlay = useCallback(() => {
    if (disabled) return;
    if (!paused) {
      onVideoPause?.(currentTime);
    }
    void videoView.togglePlay();
  }, [onVideoPause, videoView, paused, currentTime, disabled]);

  const handleToggleMute = useCallback(() => {
    if (disabled) return;
    void videoView.toggleMute();
  }, [videoView, disabled]);

  const handleScrub = useCallback(
    (time: number, ongoing: boolean) => {
      if (disabled) return;
      if (!paused) {
        void videoView.togglePlay();
      }
      onVideoScrub?.(time, ongoing);
      void videoView.setTime(time, ongoing);
    },
    [onVideoScrub, videoView, paused, disabled],
  );

  return (
    <FlexColCenVer sx={{ gap: 2 }}>
      <FlexCenHorVer
        className="media-container-dark"
        onContextMenu={handleContextMenu}
        onClick={handleTogglePlay}
        sx={{ cursor: 'pointer', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}
      >
        <canvas
          ref={canvasRef}
          draggable="false"
          style={{
            width: '100%',
            position: 'relative',
          }}
        />
        {overlay}
      </FlexCenHorVer>

      <FlexColCenVer sx={{ gap: 1 }}>
        <CompactMediaPlayerControls
          currentTime={currentTime}
          duration={duration}
          fps={fps}
          isPaused={paused}
          isMuted={muted}
          hasAudio={hasAudio}
          onTogglePlay={handleTogglePlay}
          onSetTime={handleScrub}
          onToggleMute={handleToggleMute}
        />
      </FlexColCenVer>
    </FlexColCenVer>
  );
}

function ThreeDPreview({
  id,
  index,
  handleContextMenu,
  overlay,
  allowInteraction = true,
}: {
  id: NodeId;
  index?: number;
  handleContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
  overlay?: React.ReactNode;
  allowInteraction?: boolean;
}) {
  const canvasRef = useNodeRenderTarget(id, index ?? 0);

  return (
    <FlexCenHorVer
      className="media-container-dark nodrag nopan nowheel"
      onContextMenu={handleContextMenu}
      sx={{ borderRadius: 2, overflow: 'hidden', pointerEvents: allowInteraction ? 'auto' : 'none' }}
    >
      <canvas
        ref={canvasRef}
        draggable="false"
        style={{
          width: '100%',
          position: 'relative',
        }}
      />
      {overlay}
    </FlexCenHorVer>
  );
}

export function ImageViewer({
  id,
  index,
  handleContextMenu,
  overlay,
}: {
  id: NodeId;
  index?: number;
  handleContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
  overlay?: React.ReactNode;
}) {
  const canvasRef = useNodeRenderTarget(id, index ?? 0);
  return (
    <FlexCenHorVer
      className="media-container-dark"
      onContextMenu={handleContextMenu}
      sx={{ borderRadius: '8px', overflow: 'hidden' }}
    >
      <canvas
        ref={canvasRef}
        draggable="false"
        style={{
          width: '100%',
          position: 'relative',
        }}
      />
      {overlay}
    </FlexCenHorVer>
  );
}

function AudioPreview({ url, overlay }: { url: string; overlay?: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  // Play/Pause toggle
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Jump to specific time (in seconds)
  const setAudioTime = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  // Update current time as audio plays
  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current?.currentTime ?? 0);
  };

  // Set duration when metadata loads
  const handleLoadedMetadata = () => {
    setDuration(audioRef.current?.duration ?? 0);
  };

  const toggleMuted = () => {
    if (!audioRef.current) return;
    setMuted(!muted);
    audioRef.current.muted = !muted;
  };

  function handleEnded(): void {
    setIsPlaying(false);
    setAudioTime(0);
  }

  return (
    <FlexColCenVer sx={{ gap: 2 }}>
      <Box
        className="media-container-dark"
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <img src="/audio.png" alt="Audio" style={{ display: 'block', width: '100%', mixBlendMode: 'multiply' }} />
        <audio
          ref={audioRef}
          className="file-uploader-audio"
          draggable="false"
          crossOrigin="anonymous"
          src={url}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          style={{
            display: 'block',
            width: '80%',
            position: 'absolute',
            top: `calc(50% - 30px)`,
            left: `calc(50% - 40%)`,
          }}
        />
        {overlay}
      </Box>
      <CompactMediaPlayerControls
        currentTime={currentTime}
        duration={duration}
        isPaused={!isPlaying}
        isMuted={muted}
        hasAudio={true}
        onTogglePlay={togglePlayPause}
        onSetTime={setAudioTime}
        onToggleMute={toggleMuted}
      />
    </FlexColCenVer>
  );
}

export interface FileViewerProps extends AssetOverlayProps {
  id: NodeId;
  index?: number;
  handleContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
  isNodeLocked: boolean;
  hideOverlay?: boolean;
  isCameraLocked?: boolean;
  on3DLockStateChange?: (locked: boolean) => void;
  isClickable?: boolean;
  isMultiFilesViewMode?: boolean;
}

interface FileViewerOverlayProps extends AssetOverlayProps {
  isHovered: boolean;
  isNodeLocked: boolean;
  isCameraLocked?: boolean;
  on3DLockStateChange?: (locked: boolean) => void;
}

function FileViewerOverlay({
  asset,
  isHovered,
  isNodeLocked,
  isCameraLocked,
  on3DLockStateChange,
  ...overlayProps
}: FileViewerOverlayProps) {
  return useMemo(() => {
    const is3D = asset?.type === '3D';
    const overlayPropsWith3D = is3D
      ? {
          ...overlayProps,
          is3DLocked: isCameraLocked,
          setIs3DLocked: on3DLockStateChange,
        }
      : overlayProps;
    // don't display the overlay if the node is locked
    if (isNodeLocked) {
      return null;
    }
    return <Overlay {...overlayPropsWith3D} asset={asset as UploadedAsset} isHovered={isHovered} />;
  }, [overlayProps, asset, isHovered, isCameraLocked, isNodeLocked, on3DLockStateChange]);
}

export function FileViewer({
  id,
  index,
  asset,
  hideOverlay,
  handleContextMenu,
  on3DLockStateChange,
  isCameraLocked,
  isNodeLocked,
  isClickable,
  isMultiFilesViewMode,
  ...overlayProps
}: FileViewerProps) {
  const { isHovered, ...hoveredProps } = useIsHovered();
  const overlay = !hideOverlay ? (
    <FileViewerOverlay
      asset={asset}
      isHovered={isHovered}
      isNodeLocked={isNodeLocked}
      isCameraLocked={isCameraLocked}
      on3DLockStateChange={on3DLockStateChange}
      {...overlayProps}
    />
  ) : null;

  return (
    <Box
      {...hoveredProps}
      sx={{ width: '100%', height: '100%', cursor: isClickable ? 'pointer' : 'default' }}
      className="nodrag"
    >
      {asset?.type === 'video' ? (
        <VideoViewer id={id} index={index} handleContextMenu={handleContextMenu} overlay={overlay} disabled={false} />
      ) : asset?.type === 'image' ? (
        <ImageViewer id={id} index={index} handleContextMenu={handleContextMenu} overlay={overlay} />
      ) : asset?.type === '3D' ? (
        <ThreeDPreview
          id={id}
          index={index}
          handleContextMenu={handleContextMenu}
          overlay={overlay}
          allowInteraction={!isMultiFilesViewMode}
        />
      ) : asset?.type === 'audio' ? (
        <AudioPreview url={asset.url} overlay={overlay} />
      ) : (
        <Box className="media-container-dark" sx={{ width: '100%', height: '430px' }} />
      )}
    </Box>
  );
}

interface InputViewerProps extends AssetOverlayProps {
  id: NodeId;
  input?: Input;
  handleContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
  onVideoPause?: (time: number) => void;
  onVideoScrub?: (time: number, ongoing: boolean) => void;
  disabled?: boolean;
}

export function InputViewer({
  id,
  input,
  handleContextMenu,
  onVideoPause,
  onVideoScrub,
  disabled,
  ...overlayProps
}: InputViewerProps) {
  const flowView = useFlowView();
  const file = flowView.fileInput(input);
  const type = input ? flowView.nodeOutputTypeFromInput(input) : undefined;
  const { isHovered, ...hoveredProps } = useIsHovered();

  const overlay = useMemo(() => {
    return <Overlay {...overlayProps} asset={file as UploadedAsset} isHovered={isHovered} />;
  }, [overlayProps, file, isHovered]);

  return (
    <Box
      {...hoveredProps}
      sx={{ width: '100%', height: '100%', cursor: 'default', position: 'relative' }}
      className="nodrag"
    >
      {type === HandleType.Video ? (
        <VideoViewer
          id={id}
          disabled={disabled}
          overlay={overlay}
          handleContextMenu={handleContextMenu}
          onVideoPause={onVideoPause}
          onVideoScrub={onVideoScrub}
        />
      ) : type === HandleType.Image || type === HandleType.Mask ? (
        <ImageViewer id={id} handleContextMenu={handleContextMenu} overlay={overlay} />
      ) : type === HandleType.ThreeDee ? (
        <ThreeDPreview id={id} handleContextMenu={handleContextMenu} overlay={overlay} />
      ) : type === HandleType.Audio && file?.type === 'audio' ? (
        <AudioPreview url={file.url} overlay={overlay} />
      ) : (
        <Box className="media-container-dark" sx={{ width: '100%', height: '430px' }} />
      )}
    </Box>
  );
}

function Overlay(props: AssetOverlayProps) {
  return (
    <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, pointerEvents: 'none' }}>
      <GalleryGradientOverlay isSelected={props.isHovered} />
      <AssetOverlay isHovered={props.isHovered} {...props} />
    </Box>
  );
}
