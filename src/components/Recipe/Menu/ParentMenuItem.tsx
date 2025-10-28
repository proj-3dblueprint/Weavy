import { useRef, useState, useCallback, useId, ReactNode, KeyboardEvent } from 'react';
import { AppMenuItem } from '@/UI/AppContextMenu/AppMenu.styles';
import { AppContextMenu } from '@/UI/AppContextMenu/AppContextMenu';
import { CaretIcon } from '@/UI/Icons/CaretIcon';
import { color } from '@/colors';

interface ParentMenuItemProps {
  label: string;
  children: ReactNode;
  id?: string;
  onClose?: () => void;
  contextMenuWidth?: string;
  offset?: { top?: string; left?: string };
}

const ParentMenuItem = ({ label, children, id, onClose, contextMenuWidth, offset }: ParentMenuItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const menuItemRef = useRef<HTMLLIElement>(null);
  const menuItemId = useId();
  const normMenuItemId = id ?? menuItemId;

  const handleItemKeyDown = (e: KeyboardEvent) => {
    if ((e.key !== 'ArrowRight' && e.key !== 'Enter') || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleMenuKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation();
    if ((e.key !== 'ArrowLeft' && e.key !== 'Escape') || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
      return;
    }

    e.preventDefault();
    setIsOpen(false);
  };

  const onMenuClose = () => {
    close();
    onClose?.();
  };

  return (
    <AppMenuItem
      onKeyDown={handleItemKeyDown}
      ref={menuItemRef}
      sx={{
        mb: 0.25,
        '&.Mui-focusVisible': {
          background: color.Black84,
        },
      }}
      onMouseEnter={open}
      onMouseLeave={close}
      id={normMenuItemId}
      disableRipple
    >
      {label}
      <CaretIcon width={12} height={12} style={{ transform: 'rotate(-90deg)' }} />
      <AppContextMenu
        TransitionProps={{
          // TODO: fix arrow key navigation
          onEntered: (node) => {
            if (node) {
              const firstMenuItem = node.querySelector('li');
              firstMenuItem?.focus();
            }
          },
          onExited: () => menuItemRef.current?.focus(),
        }}
        disableRestoreFocus
        onKeyDown={handleMenuKeyDown}
        sx={{
          pointerEvents: 'none',
          '& .MuiList-root': {
            pointerEvents: 'auto',
          },
        }}
        MenuListProps={{ 'aria-labelledby': normMenuItemId }}
        anchorEl={menuItemRef.current}
        open={isOpen}
        onClose={onMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        width={contextMenuWidth}
        offset={offset}
      >
        {children}
      </AppContextMenu>
    </AppMenuItem>
  );
};

export default ParentMenuItem;
