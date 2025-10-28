import { Controls, Gesture, PlayButton, useMediaState } from '@vidstack/react';
import { PlayFilledIcon } from '../../Icons/PlayFilledIcon';
import { PauseFilledIcon } from '../../Icons/PauseFilledIcon';

export const VideoLayout = ({ isUserPaused, disabled }: { isUserPaused: boolean; disabled: boolean }) => {
  const isPaused = useMediaState('paused');
  return (
    <>
      <Gesture className="video__gesture" event="pointerup" action="toggle:paused" disabled={disabled} />
      <Controls.Root className="video__controls" hideOnMouseLeave={!isPaused}>
        <Controls.Group>
          <PlayButton className="video__controls__play-button" disabled={disabled}>
            {isUserPaused && isPaused ? (
              <PlayFilledIcon style={{ height: 24, width: 24, marginLeft: '4px' }} />
            ) : (
              <PauseFilledIcon style={{ height: 24, width: 24 }} />
            )}
          </PlayButton>
        </Controls.Group>
      </Controls.Root>
    </>
  );
};
