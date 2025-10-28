import { Typography, TypographyProps } from '@mui/material';
import { color as _color } from '@/colors';
import type { ReactNode } from 'react';

interface ButtonTextPlainProps {
  children: ReactNode;
  variant?: TypographyProps['variant'];
  disabled?: boolean;
  color?: string;
  onClick: () => void;
}

export const ButtonTextPlain = ({
  children,
  onClick,
  variant = 'body-std-rg',
  color = _color.White100,
  disabled,
}: ButtonTextPlainProps) => {
  return (
    <Typography
      variant={variant}
      color={color}
      sx={{
        textDecoration: 'underline',
        cursor: 'pointer',
        '&:hover': {
          textDecoration: 'none',
        },
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
      onClick={onClick}
    >
      {children}
    </Typography>
  );
};
