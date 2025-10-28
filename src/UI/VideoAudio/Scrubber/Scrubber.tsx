import { useCallback, useEffect, useRef, useState, MouseEvent as ReactMouseEvent } from 'react';
import { Box } from '@mui/material';
import { color } from '@/colors';
import { FlexCenHorVer, FlexColCenVer } from '@/UI/styles';
import { clampValue } from '@/utils/numbers';
import { useIsHovered } from '@/hooks/useIsHovered';

function calculateTimeFromClick(clientX: number, rect: DOMRect, duration: number): number {
  const clickX = clientX - rect.left;
  const progress = clampValue(clickX / rect.width, 0, 1);
  const newTime = progress * duration;
  return newTime;
}

export const Scrubber = ({
  time,
  duration,
  setTime,
}: {
  time: number;
  duration: number;
  setTime: (time: number, ongoing: boolean) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progress = (time / duration) * 100;
  containerRef.current?.style.setProperty('--progress', `${progress}%`);

  // scrubbing
  const [dragging, setDragging] = useState<DOMRect>();
  const handleScrubStart = useCallback(
    (evt: ReactMouseEvent) => {
      const rect = evt.currentTarget.getBoundingClientRect();
      setDragging(rect);

      const newTime = calculateTimeFromClick(evt.clientX, rect, duration);
      setTime(newTime, true);
    },
    [setTime, duration],
  );
  useEffect(() => {
    function handleScrub(evt: MouseEvent) {
      if (!dragging) return;
      const newTime = calculateTimeFromClick(evt.clientX, dragging, duration);
      setTime(newTime, true);
    }

    function handleScrubEnd(evt: MouseEvent) {
      if (!dragging) return;
      const newTime = calculateTimeFromClick(evt.clientX, dragging, duration);
      setTime(newTime, false);
      setDragging(undefined);
    }

    document.addEventListener('mousemove', handleScrub);
    document.addEventListener('mouseup', handleScrubEnd);

    return () => {
      document.removeEventListener('mousemove', handleScrub);
      document.removeEventListener('mouseup', handleScrubEnd);
    };
  }, [dragging, setTime, duration]);

  const { isHovered, onMouseEnter, onMouseLeave } = useIsHovered();

  return (
    <FlexCenHorVer ref={containerRef} sx={{ width: '100%' }} className="nodrag ">
      <FlexColCenVer
        sx={{
          width: '100%',
          marginLeft: 0.5,
          marginRight: 0.5,
          height: 16,
          position: 'relative',
          cursor: 'pointer',
        }}
        onMouseDown={handleScrubStart}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* progress bar */}
        <Box
          sx={{
            borderRadius: 2,
            height: 4,
            background: `linear-gradient(90deg, 
               ${color.White100} 0%, ${color.White100} var(--progress, 0%), 
               ${color.White40_T} var(--progress, 0%), ${color.White40_T} 100%)`,
          }}
        />
        {/* scrubber handle */}
        <Box
          sx={{
            width: 2,
            height: 16,
            borderRadius: 2,
            background: color.White100,

            position: 'absolute',
            transform: 'translate(-50%, -50%)',
            top: '50%',
            left: `var(--progress, 0%)`,
          }}
        />
        {/* scrubber handle hover */}
        {(isHovered || dragging) && (
          <Box
            sx={{
              width: 12,
              height: 28,
              borderRadius: 6,
              background: dragging ? color.White40_T : color.White08_T,

              position: 'absolute',
              transform: 'translate(-50%, -50%)',
              top: '50%',
              left: `var(--progress, 0%)`,
            }}
          />
        )}
      </FlexColCenVer>
    </FlexCenHorVer>
  );
};
