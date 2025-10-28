import { useMemo } from 'react';
import { Box, Grid2 } from '@mui/material';
import { ArrowIcon } from '@/UI/Icons/ArrowIcon';

const CrosshairItem = ({
  direction,
  fullRow = false,
}: {
  direction: 'up' | 'down' | 'left' | 'right';
  fullRow?: boolean;
}) => {
  const transform = useMemo(() => {
    const directionMap = {
      up: 'rotate(0deg)',
      down: 'rotate(180deg)',
      left: 'rotate(-90deg)',
      right: 'rotate(90deg)',
    };
    return directionMap[direction];
  }, [direction]);

  return (
    <Grid2
      size={fullRow ? 12 : 2}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform,
      }}
    >
      <ArrowIcon className="move-up-down" />
    </Grid2>
  );
};

export const FlowTourCrosshair = ({ canMoveToNextStep }: { canMoveToNextStep?: boolean }) => {
  return (
    <Grid2
      container
      component="div"
      spacing={1}
      sx={{
        position: 'fixed',
        top: 'calc(50% - 96px)',
        left: 'calc(50% - 96px)',
        justifyContent: 'center',
        alignItems: 'center',
        height: '192px',
        width: '192px',
        pointerEvents: 'none',
      }}
      className={canMoveToNextStep ? 'tour-delayed-fade-out-scale-up' : ''}
    >
      <CrosshairItem fullRow direction="up" />
      <CrosshairItem direction="left" />
      <Grid2 size={8} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box
          id="flow-tour-crosshair"
          sx={{
            height: '128px',
            width: '128px',
            borderRadius: '50%',
            border: '1px solid rgba(240, 240, 229, 0.3)',
            backgroundColor: 'rgba(240, 240, 229, 0.05)',
          }}
        />
      </Grid2>
      <CrosshairItem direction="right" />
      <CrosshairItem fullRow direction="down" />
    </Grid2>
  );
};
