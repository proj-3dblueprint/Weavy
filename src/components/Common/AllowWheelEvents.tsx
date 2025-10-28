import { Box, type SxProps } from '@mui/material';
import { useEffect, useRef } from 'react';

export const AllowWheelEvents = ({
  children,
  sx,
  targetElementId,
}: {
  children: React.ReactNode;
  sx?: SxProps;
  targetElementId?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      // Create a new wheel event
      const wheelEvent = new WheelEvent('wheel', {
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        deltaZ: event.deltaZ,
        deltaMode: event.deltaMode,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        bubbles: true,
        cancelable: true,
        composed: true,
      });

      // Find the element under the modal at the event's coordinates

      const getElementsBelow = () => {
        return document
          .elementsFromPoint(event.clientX, event.clientY)
          .filter((elem) => elem !== container && !container.contains(elem));
      };
      const targetElement = targetElementId ? document.getElementById(targetElementId) : null;
      const elementBelow = targetElement ? [targetElement] : getElementsBelow();

      if (elementBelow && elementBelow.length > 0) {
        // Stop the original event
        event.preventDefault();
        event.stopPropagation();

        // Dispatch the new wheel event to the element below
        elementBelow.forEach((element: Element | HTMLElement) => {
          element.dispatchEvent(wheelEvent);
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [targetElementId]);

  return (
    <Box component="div" sx={sx} ref={containerRef}>
      {children}
    </Box>
  );
};
