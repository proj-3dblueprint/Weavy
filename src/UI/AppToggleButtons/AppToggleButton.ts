import { styled } from '@mui/material/styles';
import { ToggleButton, toggleButtonClasses } from '@mui/material';
import { color } from '@/colors';

export type AppToggleButtonMode = 'dark' | 'light' | 'contained';

interface AppToggleButtonProps {
  mode?: AppToggleButtonMode;
  btnW?: string | number;
  btnH?: string | number;
  isIcon?: boolean;
}

export const AppToggleButton = styled(ToggleButton, {
  shouldForwardProp: (prop) => !['mode', 'btnW', 'btnH', 'isIcon'].includes(prop as string),
})<AppToggleButtonProps>(({ theme, mode = 'dark', btnW, btnH, isIcon }) => {
  if (mode === 'contained') {
    return {
      flex: '1 1 auto',
      height: '100%',
      cursor: 'pointer',
      fontSize: '0.75rem',
      backgroundColor: color.Black88,
      color: color.White40_T,
      margin: 0,
      marginLeft: 0,
      padding: 0,
      border: 'none !important',
      '&:hover': {
        backgroundColor: color.Black84,
      },
      [`&.${toggleButtonClasses.selected}`]: {
        backgroundColor: color.Black84,
        color: color.White100,
        '&:hover': {
          backgroundColor: color.Black84,
        },
      },
      [`&.${toggleButtonClasses.disabled}`]: {
        backgroundColor: color.Black08,
        color: color.Black40,
      },
    };
  }
  if (mode === 'light') {
    return {
      height: btnH || '20px',
      width: btnW || 'auto',
      padding: isIcon ? theme.spacing(0.25) : `${theme.spacing(0.25)} ${theme.spacing(1)}`,
      cursor: 'pointer',
      fontSize: '0.75rem',
      color: color.White64_T,
      minWidth: btnW || 'auto',
      [`&.${toggleButtonClasses.root}`]: {
        margin: '0 1px',
      },
      '&:hover': {
        backgroundColor: color.Black84,
        color: color.White64_T,
        '& svg': {
          color: color.White80_T,
        },
      },
      [`&.${toggleButtonClasses.selected}`]: {
        color: color.Black92,
        backgroundColor: color.Yellow100,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: color.Yellow64,
        },
        '& svg': {
          color: color.Black92,
        },
      },
      '& svg': {
        width: '20px',
        height: '20px',
        color: color.White80_T,
      },
      [`&.${toggleButtonClasses.disabled} svg`]: {
        color: color.White40_T,
      },
    };
  }
  // default to dark
  return {
    height: btnH || '20px',
    width: btnW || 'auto',
    padding: isIcon ? theme.spacing(0.25) : `${theme.spacing(0.25)} ${theme.spacing(1)}`,
    cursor: 'pointer',
    fontSize: '0.75rem',
    color: color.White64_T,
    minWidth: btnW || 'auto',
    [`&.${toggleButtonClasses.root}`]: {
      margin: '0 1px',
    },
    '&:hover': {
      backgroundColor: color.Black84,
      color: color.White64_T,
      '& svg': {
        color: color.White100,
      },
    },
    [`&.${toggleButtonClasses.selected}`]: {
      color: color.White100,
      backgroundColor: color.Black84,
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: color.Black84,
      },
      '& svg': {
        color: color.White100,
      },
    },
    '& svg': {
      width: '20px',
      height: '20px',
      color: color.White80_T,
    },
    [`&.${toggleButtonClasses.disabled} svg`]: {
      color: color.White40_T,
    },
  };
});
