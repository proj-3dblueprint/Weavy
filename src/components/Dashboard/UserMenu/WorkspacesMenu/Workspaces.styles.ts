import { MenuItem, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { color } from '@/colors';

export const StyledMenuItem = styled(MenuItem)(({ theme, selected }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '40px',
  width: '100%',
  backgroundColor: selected ? `${color.Black84} !important` : 'transparent',
  borderRadius: theme.spacing(0.5),
  pointerEvents: selected ? 'none' : 'auto',
  '&:hover': {
    backgroundColor: color.Black84,
  },
}));

export const Plan = styled(Typography)(({ theme }) => ({
  padding: '2px 4px',
  color: `${color.Red2}`,
  backgroundColor: `${color.Pink}`,
  borderRadius: theme.spacing(0.5),
}));
