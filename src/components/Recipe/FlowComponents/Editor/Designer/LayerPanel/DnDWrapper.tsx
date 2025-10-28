import { useRef, useEffect, type PropsWithChildren, useState } from 'react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { Box } from '@mui/material';
import { color } from '@/colors';

type DnDWrapperProps = PropsWithChildren<{
  dragKey: number;
  index: number;
}>;

export function DnDWrapper({ dragKey, index, children }: DnDWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<'top' | 'bottom'>();

  useEffect(() => {
    if (!ref.current) return;

    // Create draggable
    const draggableCleanup = draggable({
      element: ref.current,
      getInitialData: () => ({
        dragKey,
        index,
      }),
    });

    // Create drop target
    const dropTargetCleanup = dropTargetForElements({
      element: ref.current,
      getData: () => ({ dragKey, index }),
      canDrop: ({ source }) => source.data.dragKey !== dragKey,
      onDragEnter: ({ source }) => {
        setTarget(Number(source.data.index) < index ? 'top' : 'bottom');
      },
      onDragLeave: () => setTarget(undefined),
      onDrop: () => setTarget(undefined),
    });

    // Return cleanup function
    return () => {
      draggableCleanup();
      dropTargetCleanup();
    };
  }, [dragKey, index]);

  return (
    <Box
      ref={ref}
      id={`comp-layer-draggable-wrapper-${dragKey}`}
      component="div"
      key={dragKey}
      sx={{
        borderTop: target === 'top' ? `2px solid ${color.Yellow100}` : 'none',
        borderBottom: target === 'bottom' ? `2px solid ${color.Yellow100}` : 'none',
        position: 'relative',
      }}
    >
      {children}
    </Box>
  );
}
