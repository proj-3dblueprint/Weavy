import { Box, IconButton, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { color } from '@/colors';
import { getOS } from '@/utils/general';

const ZOOM_STEP = 1.1;

export default function CompNavigationPanel({ handleResetZoom, handleZoom, zoom }) {
  const [formattedZoom, setFormattedZoom] = useState(0);
  const [anchorElZoom, setAnchorElZoom] = useState(null);
  const os = getOS();

  const zoomOptions = [
    { name: 'Zoom In', value: 'in', keyboardShortcut: os === 'Mac' ? 'Cmd +' : 'Ctrl +' },
    { name: 'Zoom Out', value: 'out', keyboardShortcut: os === 'Mac' ? 'Cmd -' : 'Ctrl -' },
    { name: 'Zoom to 100%', value: '100', keyboardShortcut: os === 'Mac' ? 'Cmd 0' : 'Ctrl 0' },
    { name: 'Zoom to Fit', value: 'fit', keyboardShortcut: os === 'Mac' ? 'Cmd 1' : 'Ctrl 1' },
  ];
  useEffect(() => {
    setFormattedZoom(Math.round(zoom.toFixed(2) * 100));
  }, [zoom]);

  const handleZoomOptionClick = (option) => {
    switch (option) {
      case 'in':
        handleZoom(zoom * ZOOM_STEP);
        break;
      case 'out':
        handleZoom(zoom / ZOOM_STEP);
        break;
      case '100':
        handleZoom(1);
        break;
      case 'fit':
        handleResetZoom();
        break;
      default:
        break;
    }
    handleCloseZoomMenu();
  };

  const handleOpenZoomMenu = (event) => {
    setAnchorElZoom(event.currentTarget);
  };

  const handleCloseZoomMenu = () => {
    setAnchorElZoom(null);
  };

  const zoomMenu = (
    <Menu
      sx={{ mt: 4 }}
      id="zoom-menu"
      anchorEl={anchorElZoom}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={Boolean(anchorElZoom)}
      onClose={() => setAnchorElZoom(null)}
    >
      {zoomOptions.map((menuItem, index) => {
        return (
          <MenuItem
            sx={{ width: '220px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            key={index}
            onClick={() => handleZoomOptionClick(menuItem.value)}
          >
            <Typography variant="body-sm-rg">{menuItem.name}</Typography>
            <Typography
              variant="body-sm-rg"
              sx={{ ml: 1, opacity: 0.5, background: color.Black92, borderRadius: 1, px: 1 }}
            >
              {menuItem.keyboardShortcut}
            </Typography>
          </MenuItem>
        );
      })}
    </Menu>
  );

  return (
    <Box id="compositor-navigation-container" className="compositor-panel">
      <Box
        id="compositor-navigation-panel"
        sx={{
          background: color.Black92,
          position: 'absolute',
          top: 30,
          right: '50%', //calc(50% - 70px)',
          borderRadius: 1,
          // width: '70px',
        }}
      >
        <Box id="compositor-navigation-panel-layers-container">
          <IconButton
            onClick={handleOpenZoomMenu}
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              '&:hover': {
                outline: `1px solid ${color.Yambo_Idle_Icon}`,
              },
            }}
            size="small"
          >
            <Typography variant="body-sm-rg" sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
              {formattedZoom}%
            </Typography>
            <i className="fa-solid fa-caret-down" style={{ fontSize: '12px', color: color.Yambo_Idle_Icon }}></i>
          </IconButton>
          {zoomMenu}
        </Box>
      </Box>
    </Box>
  );
}
