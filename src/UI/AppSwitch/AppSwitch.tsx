import { Switch, styled } from '@mui/material';
import { color } from '@/colors';

export const AppSwitch = styled(Switch)(() => ({
  '& .MuiSwitch-switchBase': {
    color: color.White100,
  },
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: color.Yellow100,
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: color.Yellow40,
  },
}));
