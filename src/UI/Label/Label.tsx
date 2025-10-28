import { Typography, TypographyProps } from '@mui/material';
import { color } from '@/colors';

export const Label = ({ children, ...props }: TypographyProps) => {
  return (
    <Typography variant="label-sm-rg" {...props} color={color.White80_T}>
      {children}
    </Typography>
  );
};
