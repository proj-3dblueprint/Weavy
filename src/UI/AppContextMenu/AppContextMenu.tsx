import { Menu } from '@mui/material';
import Actions, { MenuAction } from '@/components/Menu/Actions';
import { color } from '@/colors';
import type { MenuProps } from '@mui/material';

interface AppContextMenuProps extends Omit<MenuProps, 'onClose'> {
  header?: React.ReactNode;
  items?: MenuAction[];
  maxHeight?: string;
  mouseX?: number | null;
  mouseY?: number | null;
  noClose?: boolean;
  onClose: (e: React.MouseEvent) => void;
  width?: string;
  offset?: { top?: string; left?: string };
}

export const AppContextMenu = ({
  children,
  header,
  items,
  mouseX,
  mouseY,
  noClose = false,
  onClose,
  width,
  maxHeight,
  offset,
  ...props
}: AppContextMenuProps) => (
  <Menu
    {...props}
    anchorReference={props.anchorEl ? 'anchorEl' : 'anchorPosition'}
    open={props.open}
    onClose={(e: React.MouseEvent) => {
      e.stopPropagation();
      onClose(e);
    }}
    anchorPosition={props.open ? { top: mouseY || 0, left: mouseX || 0 } : undefined}
    slotProps={{
      paper: {
        sx: {
          [width ? 'width' : 'minWidth']: width || '240px',
          background: color.Black92,
          border: `1px solid ${color.White04_T}`,
          borderRadius: 2,
          px: 1,
          maxHeight: maxHeight,
          ...(offset && {
            mt: offset.top,
            ml: offset.left,
          }),
        },
      },
    }}
  >
    {header}
    {items ? <Actions items={items} onClose={noClose ? () => {} : onClose} /> : children}
  </Menu>
);
