import React, { useCallback } from 'react';
import { Typography } from '@mui/material';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { FlexCenVer } from '@/UI/styles';
import { CaretIcon } from '@/UI/Icons';
import { color } from '@/colors';

interface NodeCarouselProps {
  isRelativePositioningCarouselFileTypes?: boolean;
  selected: number;
  steps: number;
  handleBack: () => void;
  handleNext: () => void;
}

export type NodeCarouselV2Props = Exclude<NodeCarouselProps, 'isRelativePositioningCarouselFileTypes'>;

export const NodeCarouselV2 = ({ selected, steps: steps, handleBack, handleNext }: NodeCarouselV2Props) => {
  const wrappedHandleBack = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      handleBack();
    },
    [handleBack],
  );

  const wrappedHandleNext = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      handleNext();
    },
    [handleNext],
  );

  if (steps < 2) {
    return null;
  }

  return (
    <FlexCenVer
      sx={{
        justifyContent: 'flex-end',
      }}
      onMouseEnter={(e) => e.stopPropagation()}
    >
      <FlexCenVer sx={{ gap: 1, pointerEvents: 'all', width: 'fit-content' }}>
        <AppIconButton onClick={wrappedHandleBack} width={32} height={32} mode="on-light">
          <CaretIcon style={{ height: '16px', width: '16px', transform: 'rotate(90deg)' }} />
        </AppIconButton>
        <Typography variant="body-std-rg" color={color.White80_T}>{`${selected + 1} / ${steps}`}</Typography>
        <AppIconButton onClick={wrappedHandleNext} width={32} height={32} mode="on-light">
          <CaretIcon style={{ height: '16px', width: '16px', transform: 'rotate(-90deg)' }} />
        </AppIconButton>
      </FlexCenVer>
    </FlexCenVer>
  );
};
