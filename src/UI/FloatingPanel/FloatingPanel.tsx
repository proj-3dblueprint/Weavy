import { Box, ClickAwayListener, Popper, type PopperProps } from '@mui/material';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { color } from '@/colors';

export interface FloatingPanelProps extends Omit<PopperProps, 'children'> {
  children: React.ReactNode;
  onClose?: () => void;
  triggerRef?: React.RefObject<HTMLElement>;
  offset?: number;
}

export const FloatingPanel = ({
  children,
  onClose,
  open,
  anchorEl,
  triggerRef,
  offset = 10,
  sx,
  ...props
}: FloatingPanelProps) => {
  const handleClickAway = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!open) return;
      if (anchorEl && 'contains' in anchorEl && anchorEl.contains(event.target as Node)) return;
      if (triggerRef && triggerRef.current && triggerRef.current.contains(event.target as Node)) return;
      onClose?.();
    },
    [onClose, open, anchorEl, triggerRef],
  );

  const [isPositioned, setIsPositioned] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsPositioned(false);
    }
  }, [open]);

  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <Popper
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        modifiers={[
          { name: 'offset', options: { offset: [0, offset] } },
          {
            name: 'eventListeners',
            enabled: true,
          },
          {
            name: 'updateState',
            enabled: true,
            phase: 'write',
            fn: ({ state }) => {
              // After the position update, mark as positioned
              setIsPositioned(true);
              return state;
            },
            requires: ['computeStyles'],
          },
        ]}
        sx={{
          // Regular dialog / modal paper is 1200
          zIndex: 1400,
          visibility: isPositioned ? 'visible' : 'hidden',
        }}
        {...props}
      >
        <AnimatePresence>
          {open && anchorEl ? (
            <Box
              key="floating-panel"
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: isPositioned ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              sx={{
                alignItems: 'flex-start',
                background: color.Black92,
                border: `1px solid ${color.White08_T}`,
                borderRadius: '8px',
                display: 'inline-flex',
                flexDirection: 'column',
                gap: 0.75,
                padding: 2,
                zIndex: 1201,
                ...(sx || {}),
              }}
            >
              {children}
            </Box>
          ) : null}
        </AnimatePresence>
      </Popper>
    </ClickAwayListener>
  );
};
