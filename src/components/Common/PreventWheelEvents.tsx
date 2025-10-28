import { Box, type SxProps } from '@mui/material';
import React, { useEffect, useRef } from 'react';

const PreventWheelEvents = ({ children, sx }: { children: React.ReactNode; sx?: SxProps }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (event) => {
      event.stopPropagation();

      // Prevent mousepad zooming
      if (event.ctrlKey) {
        event.preventDefault();
        return;
      }

      // Prevent mousepad over-scrolling
      const max = container.scrollWidth - container.offsetWidth;
      if (container.scrollLeft + event.deltaX < 0 || container.scrollLeft + event.deltaX > max) {
        event.preventDefault();
        container.scrollLeft = Math.max(0, Math.min(max, container.scrollLeft + event.deltaX));
      }
    };
    container.addEventListener('wheel', handleWheel);
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <Box component="div" sx={sx} ref={containerRef}>
      {children}
    </Box>
  );
};

export default PreventWheelEvents;
