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

const fullBarButtonsSize = 18;
const fullBarControlsSize = 24;

export function CompactMediaPlayerControls({
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
    <FlexColCenVer sx={{ gap: 1 }}>
      <FlexCenVer sx={{ justifyContent: 'space-between', height: '24px' }}>
        <FlexCenVer sx={{ gap: 0.5, flexShrink: 1 }}>
          <PlayPauseButton
            onTogglePlay={onTogglePlay}
            paused={paused}
            width={fullBarButtonsSize}
            height={fullBarControlsSize}
            btnW={fullBarButtonsSize}
            btnH={fullBarButtonsSize}
          />
          <TimeDisplay showFrames={showFrames} setShowFrames={setShowFrames} timeDisplay={timeDisplay} />
        </FlexCenVer>

        <SoundButton
          onToggleMute={onToggleMute}
          hasAudio={hasAudio}
          muted={muted}
          width={fullBarControlsSize}
          height={fullBarControlsSize}
          btnW={fullBarButtonsSize}
          btnH={fullBarButtonsSize}
        />
      </FlexCenVer>

      <Scrubber duration={duration} setTime={onSetTime} time={currentTime} />
    </FlexColCenVer>
  );
}
