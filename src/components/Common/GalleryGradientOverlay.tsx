import { Box } from '@mui/material';
import { Flex } from '@/UI/styles';

function GalleryGradientOverlay({ isSelected = false }: { isSelected?: boolean }) {
  return (
    <Box
      data-testid="gradient-overlay-container"
      sx={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: isSelected ? 1 : 0,
        transition: 'opacity 0.1s ease-in-out',
      }}
    >
      <Flex
        data-testid="bottom-gradient-overlay"
        sx={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: '80px',
          background: 'linear-gradient(to top, #343337D3, #6B6B7800)',
          pointerEvents: 'none',
          filter: 'blur(30px)',
          transform: 'scale(1.8)  translateY(30px)',
        }}
      />
      <Flex
        data-testid="bottom-gradient-overlay"
        sx={{
          position: 'absolute',
          top: 0,
          width: '100%',
          height: '80px',
          background: 'linear-gradient(to bottom, #343337D3, #6B6B7800)',
          pointerEvents: 'none',
          filter: 'blur(30px)',
          transform: 'scale(1.8)  translateY(-30px)',
        }}
      />
    </Box>
  );
}

export default GalleryGradientOverlay;
