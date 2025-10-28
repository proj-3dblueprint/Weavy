import { styled } from '@mui/material/styles';
import { ToggleButton, toggleButtonClasses } from '@mui/material';
import { color } from '@/colors';

interface PropertyToggleButtonProps {
  btnW?: string | number;
  btnH?: string | number;
}

export const PropertyToggleButton = styled(ToggleButton, {
  shouldForwardProp: (prop) => !['btnW', 'btnH'].includes(prop as string),
})<PropertyToggleButtonProps>(({ btnW, btnH }) => ({
  height: btnH || '26px',
  width: btnW || '29.333px',
  minWidth: btnW || '29.333px',
  padding: '6px',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  border: 'none !important',
  borderRadius: '3px',
  '&:hover': {
    backgroundColor: color.White04_T,
  },
  [`&.${toggleButtonClasses.selected}`]: {
    backgroundColor: color.White08_T,
    '&:hover': {
      backgroundColor: color.White08_T,
    },
  },
  [`&.${toggleButtonClasses.disabled}`]: {
    backgroundColor: color.Black04,
    color: color.Black40,
  },
  '& svg': {
    color: color.White40_T,
  },
  [`&.${toggleButtonClasses.selected} svg`]: {
    color: color.White100,
  },
  [`&.${toggleButtonClasses.disabled} svg`]: {
    color: color.White40_T,
  },
}));
