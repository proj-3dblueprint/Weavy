import { Box } from '@mui/material';
import { ArrowIcon } from '@/UI/Icons/ArrowIcon';

const CornerArrows = ({ direction }: { direction: 'up' | 'down' }) => {
  return (
    <Box
      component="div"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Box component="div" sx={{ transform: direction === 'up' ? 'rotate(-45deg)' : 'rotate(-135deg)' }}>
        <ArrowIcon className="move-up-down" />
      </Box>
      <Box component="div" sx={{ transform: direction === 'up' ? 'rotate(45deg)' : 'rotate(135deg)' }}>
        <ArrowIcon className="move-up-down" />
      </Box>
    </Box>
  );
};

export const FlowTourZoomBox = ({ canMoveToNextStep }: { canMoveToNextStep?: boolean }) => {
  return (
    <Box
      component="div"
      className={canMoveToNextStep ? 'tour-delayed-fade-out-scale-up' : ''}
      sx={{
        position: 'fixed',
        top: 'calc(50% - 115px)',
        left: 'calc(50% - 225px)',
        justifyContent: 'center',
        alignItems: 'center',
        height: '230px',
        width: '450px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        pointerEvents: 'none',
      }}
    >
      <CornerArrows direction="up" />
      <Box component="div" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box
          id="flow-tour-zoom-box"
          sx={{
            height: '250px',
            width: '400px',
            borderRadius: '8px',
            border: '1px solid rgba(240, 240, 229, 0.3)',
            backgroundColor: 'rgba(240, 240, 229, 0.05)',
          }}
        />
      </Box>
      <CornerArrows direction="down" />
    </Box>
  );
};
