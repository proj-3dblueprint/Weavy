import { MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import { color } from '@/colors';

export const AppMenuItem = styled(MenuItem)(({ theme }) => ({
  justifyContent: 'space-between',
  borderRadius: theme.spacing(0.5),
  padding: theme.spacing(1),
  fontWeight: 400,
  '&:hover': {
    backgroundColor: color.Black84,
  },
  '&:focus': {
    backgroundColor: color.Black84,
  },
}));
