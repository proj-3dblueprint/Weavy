import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { SpeakerHighIcon, SpeakerXIcon } from '@/UI/Icons';

interface SoundButtonProps {
  onToggleMute: () => void;
  hasAudio: boolean;
  muted: boolean;
  width?: number;
  height?: number;
  btnW?: number;
  btnH?: number;
}

export function SoundButton({
  onToggleMute,
  hasAudio,
  muted,
  btnW = 24,
  btnH = 24,
  width = 24,
  height = 24,
}: SoundButtonProps) {
  return (
    <AppIconButton width={width} height={height} mode="on-dark" onClick={onToggleMute} disabled={!hasAudio}>
      {muted || !hasAudio ? (
        <SpeakerXIcon width={btnW} height={btnH} />
      ) : (
        <SpeakerHighIcon width={btnW} height={btnH} />
      )}
    </AppIconButton>
  );
}
