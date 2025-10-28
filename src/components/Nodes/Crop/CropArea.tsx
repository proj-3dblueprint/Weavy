import { Box } from '@mui/material';
import { useCallback, useRef } from 'react';
import { useReactFlow } from 'reactflow';
import { useContentRect } from '@/hooks/useContentRect';
import { useDrag } from './useDrag';
import { CropOverlay } from './CropOverlay';
import type { CornerType, DragEvent, EdgeType } from './types';

interface CropAreaProps {
  crop: { x: number; y: number; width: number; height: number };
  originalWidth: number;
  originalHeight: number;
  showGrid?: boolean;
  onDragBox: (dx: number, dy: number, ongoing: boolean) => void;
  onDragCorner: (dx: number, dy: number, type: CornerType, ongoing: boolean) => void;
  onDragEdge: (dx: number, dy: number, type: EdgeType, ongoing: boolean) => void;
  lockAspectRatio: boolean;
}

export function CropArea({
  crop,
  originalWidth,
  originalHeight,
  onDragBox,
  onDragCorner,
  onDragEdge,
  showGrid,
}: CropAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRect = useContentRect(containerRef);
  const contentWidth = contentRect?.width || 1;
  const scaleFactor = contentWidth / originalWidth;

  const { getZoom } = useReactFlow();
  const getDelta = useCallback(
    ({ startPosition, dragPosition }: DragEvent) => {
      const zoom = getZoom();
      return {
        dx: (dragPosition.x - startPosition.x) / scaleFactor / zoom,
        dy: (dragPosition.y - startPosition.y) / scaleFactor / zoom,
      };
    },
    [getZoom, scaleFactor],
  );

  const handleMove = useCallback(
    (dragEvent: DragEvent) => {
      const { dx, dy } = getDelta(dragEvent);
      onDragBox(dx, dy, dragEvent.ongoing);
    },
    [getDelta, onDragBox],
  );

  const { handleMouseDown: handleBoxMouseDown } = useDrag({
    onDrag: handleMove,
  });

  const handleDragCorner = useCallback(
    (dragEvent: DragEvent, type: CornerType) => {
      const { dx, dy } = getDelta(dragEvent);
      onDragCorner(dx, dy, type, dragEvent.ongoing);
    },
    [getDelta, onDragCorner],
  );

  const handleDragEdge = useCallback(
    (dragEvent: DragEvent, type: EdgeType) => {
      const { dx, dy } = getDelta(dragEvent);
      onDragEdge(dx, dy, type, dragEvent.ongoing);
    },
    [getDelta, onDragEdge],
  );

  const left = scaleFactor * crop.x;
  const top = scaleFactor * crop.y;
  const width = scaleFactor * crop.width;
  const height = scaleFactor * crop.height;

  return (
    <Box ref={containerRef} sx={{ width: '100%' }} className="nodrag">
      {!contentRect ? null : (
        <>
          <Box sx={{ position: 'absolute', left, top, width, height }} onMouseDown={handleBoxMouseDown}></Box>

          <EdgeHandle type="n" onDrag={handleDragEdge} size={width} x={left + width / 2} y={top} />
          <EdgeHandle type="w" onDrag={handleDragEdge} size={height} x={left} y={top + height / 2} />
          <EdgeHandle type="s" onDrag={handleDragEdge} size={width} x={left + width / 2} y={top + height} />
          <EdgeHandle type="e" onDrag={handleDragEdge} size={height} x={left + width} y={top + height / 2} />

          <CornerHandle type="nw" onDrag={handleDragCorner} x={left} y={top} />
          <CornerHandle type="sw" onDrag={handleDragCorner} x={left} y={top + height} />
          <CornerHandle type="ne" onDrag={handleDragCorner} x={left + width} y={top} />
          <CornerHandle type="se" onDrag={handleDragCorner} x={left + width} y={top + height} />

          {/* visual overlay */}
          <CropOverlay
            x={left}
            y={top}
            aspectRatio={originalWidth / originalHeight}
            cropWidth={width}
            cropHeight={height}
            showGrid={!!showGrid}
          />
        </>
      )}
    </Box>
  );
}

interface CornerHandleProps {
  x: number;
  y: number;
  onDrag: (dragEvent: DragEvent, type: CornerType) => void;
  type: CornerType;
}
function CornerHandle({ x, y, onDrag, type }: CornerHandleProps) {
  const handleDrag = useCallback((dragEvent: DragEvent) => onDrag(dragEvent, type), [onDrag, type]);
  const { handleMouseDown } = useDrag({ onDrag: handleDrag });
  return (
    <Box
      onMouseDown={handleMouseDown}
      sx={{
        cursor: `${type}-resize`,
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        top: y,
        left: x,
        width: 20,
        height: 20,
      }}
    ></Box>
  );
}

interface EdgeHandleProps {
  x: number;
  y: number;
  size: number;
  type: EdgeType;
  onDrag: (dragEvent: DragEvent, type: EdgeType) => void;
}

export function EdgeHandle({ x, y, size, type, onDrag }: EdgeHandleProps) {
  const handleDrag = useCallback((dragEvent: DragEvent) => onDrag(dragEvent, type), [onDrag, type]);
  const { handleMouseDown } = useDrag({ onDrag: handleDrag });
  const isHorizontal = type === 'n' || type === 's';
  return (
    <Box
      onMouseDown={handleMouseDown}
      sx={{
        cursor: `${type}-resize`,
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        top: y,
        left: x,
        width: isHorizontal ? size : 20,
        height: isHorizontal ? 20 : size,
      }}
    ></Box>
  );
}
