import { useCallback, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Box } from '@mui/material';
import { ActionsBar } from '@/components/ActionsBar/ActionsBar';
import { useCompositorView, useFlowState, useFlowView, useVideoView } from '@/components/Recipe/FlowContext';
import { getPercentageInt } from '@/utils/numbers';
import { TOOLBAR_WIDTH_V2 } from '@/components/Recipe/consts/ui';
import { FullMediaPlayerControls } from '@/components/MediaPlayerControls/MediaPlayerControls';
import { VideoView } from '@/components/Recipe/Views/VideoView';
import type { NodeId, VideoState } from 'web';

const ZOOM_STEP = 1.1;

export const DesignerEditorActionsBar = ({ nodeId }: { nodeId: NodeId }) => {
  const compositorView = useCompositorView(nodeId);
  const zoomLevel = useFlowState((state) => state.compositor[nodeId]?.zoomLevel) ?? 1;
  const [isSelectionModeWhenSpacePressed, setIsSelectionModeWhenSpacePressed] = useState<boolean>(false);

  const setZoomLevel = useCallback(
    (zoom: number) => {
      compositorView.setZoomLevel(zoom);
    },
    [compositorView],
  );

  const zoomIn = useCallback(() => {
    compositorView.setZoomLevel(compositorView.zoomLevel() * ZOOM_STEP);
  }, [compositorView]);

  const zoomOut = useCallback(() => {
    compositorView.setZoomLevel(compositorView.zoomLevel() / ZOOM_STEP);
  }, [compositorView]);

  const zoomToFit = useCallback(() => {
    compositorView.zoomToFit();
  }, [compositorView]);

  const setSelectOnDrag = useCallback(
    (selectOnDrag: boolean) => {
      compositorView.setToolMode(selectOnDrag ? 'selection' : 'pan');
    },
    [compositorView],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle space key if a text input or textarea is focused
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === ' ' && compositorView.toolMode() === 'selection' && !isSelectionModeWhenSpacePressed) {
        setIsSelectionModeWhenSpacePressed(true);
        compositorView.setToolMode('pan');
      }
    },
    [compositorView, isSelectionModeWhenSpacePressed],
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle space key if a text input or textarea is focused
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === ' ' && isSelectionModeWhenSpacePressed) {
        setIsSelectionModeWhenSpacePressed(false);
        compositorView.setToolMode('selection');
      }
    },
    [compositorView, isSelectionModeWhenSpacePressed],
  );

  const flowView = useFlowView();
  const handleUndoRedo = useCallback(
    (undoRedo: 'undo' | 'redo') => {
      if (undoRedo === 'undo') {
        flowView.undo();
      } else {
        flowView.redo();
      }
    },
    [flowView],
  );

  useHotkeys('Space', handleKeyDown, { scopes: 'editor', keydown: true, keyup: false });
  useHotkeys('Space', handleKeyUp, { scopes: 'editor', keydown: false, keyup: true });

  const videoView = useVideoView(nodeId);
  const videoState = useFlowState((s) => s.video[nodeId]);
  const shouldShowVideoControls = videoState !== undefined;

  const positiongStyle = shouldShowVideoControls
    ? {}
    : ({
        position: 'absolute',
        bottom: '16px',
        left: `calc(50% - ${TOOLBAR_WIDTH_V2 / 2}px)`,
        transform: 'translateX(-50%)',
      } as const);
  return (
    <Box sx={positiongStyle}>
      <ActionsBar
        zoomPercentage={getPercentageInt(zoomLevel)}
        zoomLimitsPercentage={{ min: 1, max: 10000 }}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomToHundred={() => setZoomLevel(1)}
        onZoomToFit={zoomToFit}
        onUndoRedo={handleUndoRedo}
        canUndo={flowView.hasUndo()}
        canRedo={flowView.hasRedo()}
        setSelectOnDrag={setSelectOnDrag}
        isEditMode
        isFullMode={shouldShowVideoControls}
      >
        {shouldShowVideoControls && (
          <Box sx={{ flex: 1, paddingRight: '64px' }}>
            <VideoControlsWrapper videoState={videoState} videoView={videoView} />
          </Box>
        )}
      </ActionsBar>
    </Box>
  );
};

function VideoControlsWrapper({ videoState, videoView }: { videoState: VideoState; videoView: VideoView }) {
  return (
    <FullMediaPlayerControls
      currentTime={videoState.currentTime}
      duration={videoState.duration}
      fps={videoState.fps}
      isPaused={videoState.paused}
      isMuted={videoState.muted}
      hasAudio={videoState.hasAudio}
      onTogglePlay={useCallback(() => {
        void videoView?.togglePlay();
      }, [videoView])}
      onSetTime={useCallback(
        (time: number, ongoing: boolean) => {
          void videoView?.setTime(time, ongoing);
        },
        [videoView],
      )}
      onToggleMute={useCallback(() => {
        void videoView?.toggleMute();
      }, [videoView])}
    />
  );
}
