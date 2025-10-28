import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { PauseFilledIcon, PlayFilledIcon } from '@/UI/Icons';

interface PlayPauseButtonProps {
  onTogglePlay: () => void;
  paused: boolean;
  width?: number;
  height?: number;
  btnW?: number;
  btnH?: number;
}

export function PlayPauseButton({
  onTogglePlay,
  paused,
  width = 24,
  height = 24,
  btnW = 24,
  btnH = 24,
}: PlayPauseButtonProps) {
  return (
    <AppIconButton width={width} height={height} mode="on-dark" onClick={onTogglePlay}>
      {paused ? <PlayFilledIcon width={btnW} height={btnH} /> : <PauseFilledIcon width={btnW} height={btnH} />}
    </AppIconButton>
  );
}
