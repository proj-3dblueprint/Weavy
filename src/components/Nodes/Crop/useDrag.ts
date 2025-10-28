import { useCallback } from 'react';
import type { DragEvent } from './types';

interface UseDragOpts {
  onDragStart?: () => void;
  onDrag: (dragEvent: {
    startPosition: { x: number; y: number };
    dragPosition: { x: number; y: number };
    ongoing: boolean;
  }) => void;
}

export function useDrag({ onDragStart, onDrag }: UseDragOpts) {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const startX = e.clientX;
      const startY = e.clientY;
      function dragEvent(e: MouseEvent, ongoing: boolean): DragEvent {
        return {
          startPosition: {
            x: startX,
            y: startY,
          },
          dragPosition: {
            x: e.clientX,
            y: e.clientY,
          },
          ongoing,
        };
      }

      const onMouseMove = (e: MouseEvent) => {
        onDrag(dragEvent(e, true));
      };

      const onMouseUp = (e: MouseEvent) => {
        onDrag(dragEvent(e, false));
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      onDragStart?.();
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [onDrag, onDragStart],
  );

  return { handleMouseDown };
}
