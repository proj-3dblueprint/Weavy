import { Button, ButtonProps } from '@mui/material';
import { forwardRef } from 'react';
import { color } from '@/colors';

interface ButtonContainedProps extends Omit<ButtonProps, 'size'> {
  size?: 'xs' | 'small' | 'medium' | 'large';
  mode?: 'filled-light' | 'filled-light-secondary' | 'filled-secondary' | 'filled-dark' | 'outlined' | 'text';
}

const getBackgroundColor = (mode: ButtonContainedProps['mode']) => {
  switch (mode) {
    case 'filled-light':
      return color.Yellow100;
    case 'filled-light-secondary':
      return color.Yellow_Secondary;
    case 'filled-secondary':
      return color.Black84;
    case 'filled-dark':
      return color.Black92_T;
    case 'text':
    case 'outlined':
      return 'transparent';
    default:
      return color.Yellow100;
  }
};

const getHoverBackgroundColor = (mode: ButtonContainedProps['mode']) => {
  switch (mode) {
    case 'filled-light':
      return color.Yellow64;
    case 'filled-light-secondary':
      return color.Yellow40;
    case 'filled-secondary':
      return color.Black64;
    case 'filled-dark':
      return color.Black84_T;
    case 'text':
    case 'outlined':
      return color.White08_T;
    default:
      return color.Yellow64;
  }
};

const getDisabledBackgroundColor = (mode: ButtonContainedProps['mode']) => {
  switch (mode) {
    case 'filled-light':
    case 'filled-secondary':
    case 'filled-light-secondary':
      return color.White04_T;
    case 'filled-dark':
      return color.Black64_T;
    case 'text':
    case 'outlined':
      return 'transparent';
    default:
      return color.White04_T;
  }
};

const getTextColor = (mode: ButtonContainedProps['mode']) => {
  switch (mode) {
    case 'filled-light':
    case 'filled-light-secondary':
      return color.Black100;
    case 'text':
    case 'outlined':
      return color.White100;
    default:
      return color.White100;
  }
};

const getDisabledTextColor = (mode: ButtonContainedProps['mode']) => {
  switch (mode) {
    case 'text':
    case 'outlined':
      return color.White40_T;
    case 'filled-light':
    case 'filled-light-secondary':
      return color.White16_T;
    default:
      return color.White100;
  }
};

const getBorder = (mode: ButtonContainedProps['mode']) => {
  switch (mode) {
    case 'outlined':
      return `1px solid ${color.White40_T}`;
    default:
      return 'none';
  }
};

const getHoverBorder = (mode: ButtonContainedProps['mode']) => {
  switch (mode) {
    case 'outlined':
      return `1px solid ${color.White64_T}`;
    default:
      return 'none';
  }
};

const getDisabledBorder = (mode: ButtonContainedProps['mode']) => {
  switch (mode) {
    case 'outlined':
      return `1px solid ${color.White40_T}`;
    default:
      return 'none';
  }
};

const getH = (size: ButtonContainedProps['size']) => {
  switch (size) {
    case 'xs':
      return 24;
    case 'small':
      return 28;
    case 'medium':
      return 32;
    case 'large':
      return 42;
    default:
      return 32;
  }
};

const getFontSize = (size: ButtonContainedProps['size']) => {
  switch (size) {
    case 'xs':
    case 'small':
      return '0.75rem';
    default:
      return '0.875rem';
  }
};

export const ButtonContained = forwardRef<HTMLButtonElement, ButtonContainedProps>(function AppButton(
  { mode = 'filled-light', children, size, ...props },
  ref,
) {
  return (
    <Button
      size={size === 'xs' ? 'small' : size}
      {...props}
      ref={ref}
      variant="contained"
      sx={{
        height: getH(size),
        color: getTextColor(mode),
        bgcolor: getBackgroundColor(mode),
        '&:hover': {
          bgcolor: getHoverBackgroundColor(mode),
          border: getHoverBorder(mode),
        },
        '&.Mui-disabled': {
          bgcolor: getDisabledBackgroundColor(mode),
          color: getDisabledTextColor(mode),
          border: getDisabledBorder(mode),
        },
        '& .MuiButton-startIcon': {
          marginRight: '4px',
        },
        fontSize: getFontSize(size),
        fontWeight: 500,
        border: getBorder(mode),
        ...props.sx,
      }}
    >
      {children}
    </Button>
  );
});
