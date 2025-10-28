import { createTheme } from '@mui/material';
import { color, EL_COLORS } from '@/colors';

export const darkTheme = createTheme({
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
        sizeSmall: {
          fontSize: '0.75rem',
          fontWeight: 500,
          lineHeight: 1.5,
        },
        sizeMedium: {
          fontSize: '0.875rem',
          fontWeight: 500,
          lineHeight: 1.5,
        },
        sizeLarge: {
          fontSize: '0.875rem',
          fontWeight: 500,
          lineHeight: 1.5,
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          fontFamily: '"DM Sans", system-ui, -apple-system, Arial, "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
        },
      },
    },
    MuiCircularProgress: {
      defaultProps: {
        disableShrink: true,
      },
    },
    MuiCssBaseline: {
      styleOverrides: `
        html {
          color: ${color.White100};
          background: ${color.Black100};
          font-family: "DM Sans", system-ui, -apple-system, Arial, "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
        }
        body {
          color: ${color.White100};
        }
        .MuiButtonBase-root, .MuiButton-root {
          color: ${color.White100} ;
        }
        .MuiTypography-root {
          color: ${color.White100};
          font-family: "DM Sans", system-ui, -apple-system, Arial, "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
        }
        .MuiTabs-indicator {
          background-color: ${color.Yambo_Purple} !important;
        }
      `,
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.75rem',
          fontWeight: 500,
          lineHeight: 1.5,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: color.White100,
          textDecorationColor: color.White100,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            borderRadius: '4px',
            backgroundColor: color.Black92,
          },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 400,
          fontSize: '0.875rem',
        },
      },
    },
    MuiMenu: {
      defaultProps: {
        slotProps: {
          paper: {
            sx: {
              backgroundColor: color.Black100,
            },
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          color: color.White100,
          '&.Mui-selected': {
            backgroundColor: color.Black84,
            '&:hover': {
              backgroundColor: color.Black84,
            },
            '&:focus': {
              backgroundColor: color.Black84,
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.75rem',
          fontWeight: 500,
          lineHeight: 1.5,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          backgroundColor: color.Black100,
          borderBottom: `1px solid ${color.White16_T}`,
        },
        head: {
          fontFamily: '"DM Mono", monospace',
          fontWeight: 400,
          color: color.White80_T,
          fontSize: '0.75rem',
        },
        body: {
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 500,
          fontSize: '0.75rem',
          padding: '16px 4px',
          backgroundColor: 'transparent',
        },
      },
    },
    MuiTypography: {
      defaultProps: {
        variant: 'body-std-rg',
        variantMapping: {
          h1: 'span',
          h2: 'span',
          h3: 'span',
          'body-xxl-rg': 'span',
          'body-xl-rg': 'span',
          'body-lg-md': 'span',
          'body-lg-rg': 'span',
          'body-lg-sb': 'span',
          'body-sm-md': 'span',
          'body-sm-rg': 'span',
          'body-std-md': 'span',
          'body-std-rg': 'span',
          'body-xs-rg': 'span',
          'label-sm-rg': 'span',
          'label-xs-rg': 'span',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: color.Black84,
          color: color.White100,
          borderRadius: '4px',
          border: `1px solid ${EL_COLORS.BoxBorder}`,
          fontSize: '0.75rem',
          fontWeight: 400,
          padding: '2px 4px',
        },
      },
    },
  },
  palette: {
    mode: 'dark',
    weavy_cta: {
      main: color.Yambo_Purple,
      light: color.Yambo_Green_Stroke,
      dark: color.Yambo_Purple_Stroke,
      contrastText: color.White100,
    },
    weavy_cta_secondary: {
      main: color.Yambo_CTA_BG,
      light: color.White100,
      dark: color.Yambo_White_BG,
      contrastText: color.Yambo_Text_On_White,
    },
    weavy_cta_blue: {
      main: color.Yambo_Blue,
      light: color.Yambo_Blue_Stroke,
      dark: color.Yambo_Blue_Stroke,
      contrastText: color.White100,
    },
    weavy_green_outline: {
      main: color.Yambo_Green_Stroke,
      light: color.Yambo_Green_Stroke,
      dark: color.Yambo_Green_Stroke,
      contrastText: color.White100,
    },
    weavy_yellow_cta: {
      main: color.Yellow100,
      light: color.Yellow64,
      dark: color.Yellow_Secondary,
      contrastText: color.Black100,
    },
    success: {
      main: color.Yambo_Purple,
    },
    weavy_black: {
      main: color.Black100,
      light: color.Black92,
      contrastText: color.White100,
    },
  },
  typography: {
    fontFamily: [
      '"DM Sans"',
      'system-ui',
      '-apple-system',
      'Arial',
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'sans-serif',
    ].join(','),
    h1: { fontSize: '1.75rem', fontWeight: 700 },
    h2: { fontSize: '1.5rem', fontWeight: 500 },
    h3: { fontSize: '1.125rem', fontWeight: 500 },
    'body-xxl-rg': { fontSize: '1.5rem', fontWeight: 400 },
    'body-xl-rg': { fontSize: '1.25rem', fontWeight: 400 },
    'body-lg-sb': { fontSize: '1rem', fontWeight: 600 },
    'body-lg-md': { fontSize: '1rem', fontWeight: 500 },
    'body-lg-rg': { fontSize: '1rem', fontWeight: 400 },
    'body-std-md': { fontSize: '0.875rem', fontWeight: 500 },
    'body-std-rg': { fontSize: '0.875rem', fontWeight: 400 },
    'body-sm-md': { fontSize: '0.75rem', fontWeight: 500 },
    'body-sm-rg': { fontSize: '0.75rem', fontWeight: 400 },
    'body-xs-rg': { fontSize: '0.625rem', fontWeight: 400 },
    'label-sm-rg': { fontFamily: '"DM Mono"', fontSize: '0.75rem', fontWeight: 400 },
    'label-xs-rg': { fontFamily: '"DM Mono"', fontSize: '0.625rem', fontWeight: 400 },
    caption: undefined, // { fontWeight: 200 },
    body1: undefined, // { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.2 },
    body2: undefined, // { fontSize: '0.875rem', fontWeight: 700 },
    h4: undefined,
    h5: undefined,
    h6: undefined,
    subtitle1: undefined,
    subtitle2: undefined,
    button: undefined, // { textTransform: 'none' },
    overline: undefined,
  },
});
