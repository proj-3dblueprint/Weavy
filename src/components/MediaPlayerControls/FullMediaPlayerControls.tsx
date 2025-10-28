import { useState } from 'react';
import { t } from 'i18next';
import { FlexCenVer, FlexColCenVer } from '@/UI/styles';
import { I18N_KEYS } from '@/language/keys';
import { Scrubber } from '@/UI/VideoAudio/Scrubber/Scrubber';
import { getTimeCode } from '@/utils/mediaPlaying';
import { PlayPauseButton } from './PlayPauseButton';
import { SoundButton } from './SoundButton';
import { TimeDisplay } from './TimeDisplay';
import type { MediaPlayerControlsProps } from './types';

const fullBarButtonsHeight = 24;
const fullBarControlsHeight = 28;

export function FullMediaPlayerControls({
  currentTime,
  duration,
  fps,
  isPaused: paused,
  isMuted: muted,
  hasAudio,
  onTogglePlay,
  onSetTime,
  onToggleMute,
}: MediaPlayerControlsProps) {
  const [showFrames, setShowFrames] = useState(false);

  const timeDisplay =
    showFrames && fps !== undefined
      ? `${Math.round(currentTime * fps)} / ${Math.round(duration * fps)} ${t(I18N_KEYS.VIDEO_PREVIEW.FRAMES)}`
      : `${getTimeCode(currentTime)} / ${getTimeCode(duration)}`;

  return (
    <FlexCenVer sx={{ justifyContent: 'space-between', height: `${fullBarButtonsHeight}px` }}>
      <PlayPauseButton
        onTogglePlay={onTogglePlay}
        paused={paused}
        btnW={fullBarButtonsHeight}
        btnH={fullBarButtonsHeight}
      />
      <TimeDisplay
        showFrames={showFrames}
        setShowFrames={setShowFrames}
        timeDisplay={timeDisplay}
        height={fullBarControlsHeight}
      />

      <FlexColCenVer sx={{ flex: 1, height: `${fullBarControlsHeight}px`, alignItems: 'center' }}>
        <Scrubber duration={duration} setTime={onSetTime} time={currentTime} />
      </FlexColCenVer>

      <SoundButton
        onToggleMute={onToggleMute}
        hasAudio={hasAudio}
        muted={muted}
        btnW={fullBarButtonsHeight}
        btnH={fullBarButtonsHeight}
      />
    </FlexCenVer>
  );
}
