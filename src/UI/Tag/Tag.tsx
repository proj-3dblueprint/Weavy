import { Typography, type SxProps } from '@mui/material';
import { motion, type MotionProps } from 'motion/react';
import { forwardRef, type ReactNode } from 'react';

type TagProps = Pick<MotionProps, 'transition' | 'layout' | 'layoutId'> & {
  text: string;
  bgColor: string;
  textColor: string;
  minWidth?: number;
  variant?: 'small' | 'large';
  endIcon?: ReactNode;
  sx?: SxProps;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export const Tag = forwardRef<HTMLDivElement, TagProps>(function Tag(
  { text, bgColor, textColor, minWidth, variant = 'small', sx, endIcon, ...elementProps }: TagProps,
  ref,
) {
  return (
    <Typography
      variant={variant === 'large' ? 'label-sm-rg' : 'label-xs-rg'}
      textTransform="capitalize"
      color={textColor}
      ref={ref}
      component={motion.div}
      {...elementProps}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: variant === 'large' ? 16 : 'unset',
        minWidth,
        background: bgColor,
        borderRadius: 0.5,
        px: 0.5,
        width: 'fit-content',
        gap: 0.5,
        ...sx,
      }}
    >
      {text}
      {endIcon}
    </Typography>
  );
});
