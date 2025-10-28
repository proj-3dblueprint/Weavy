import { styled } from '@mui/material/styles';
import { IconButton } from '@mui/material';
import { forwardRef } from 'react';
import { color } from '@/colors';
import type { IconButtonProps, Theme, SxProps } from '@mui/material';

export interface AppIconButtonProps extends Omit<IconButtonProps, 'color' | 'sx' | 'classes'> {
  width?: string | number;
  height?: string | number;
  mode?: 'on-light' | 'on-dark';
  sx?: SxProps<Theme>;
}

const getHoverBackgroundColor = (mode: AppIconButtonProps['mode']) => {
  switch (mode) {
    case 'on-light':
      return color.White16_T;
    case 'on-dark':
      return color.Black84;
  }
};

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => !['width', 'height', 'mode'].includes(prop as string),
})<AppIconButtonProps>(({ width = 28, height = 28, mode = 'on-dark' }) => ({
  minWidth: width,
  minHeight: height,
  width,
  height,
  padding: 0,
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
  color: color.White80_T,
  transition: 'all 0.2s ease',

  '&:hover': {
    backgroundColor: getHoverBackgroundColor(mode),
    color: color.White100,
  },

  '&:disabled': {
    cursor: 'not-allowed',
    color: color.White40_T,
    backgroundColor: 'transparent',
  },

  '& .MuiTouchRipple-root': {
    display: 'none',
  },
}));

export const AppIconButton = forwardRef<HTMLButtonElement, AppIconButtonProps>(
  ({ children, width, height, mode, sx, ...props }, ref) => {
    return (
      <StyledIconButton ref={ref} width={width} height={height} mode={mode} disableRipple sx={sx} {...props}>
        {children}
      </StyledIconButton>
    );
  },
);

AppIconButton.displayName = 'AppIconButton';
