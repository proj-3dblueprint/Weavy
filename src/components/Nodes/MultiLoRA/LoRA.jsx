import { Box, Typography, Link, Tooltip, ButtonBase } from '@mui/material';
import { useState } from 'react';
import { AppContextMenu } from '@/UI/AppContextMenu/AppContextMenu';
import { color } from '../../../colors';
import LoRAModal from './LoRAModal';

function LoRA({ lora, updateLora, deleteLora, setSelectedLora, container }) {
  const editable = container === 'drawer';
  const [open, setOpen] = useState(false);
  const [imageHover, setImageHover] = useState(false);
  const [loraHover, setLoraHover] = useState(false);
  const [nameHover, setNameHover] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const extension = '.safetensors';
  const filename =
    lora.file?.indexOf(extension) > 0
      ? lora.file.substring(0, lora.file.indexOf(extension) + extension.length)
      : lora.file;
  const handleEditLora = () => {
    setOpen(true);
  };

  const handleDeleteLora = () => {
    deleteLora(lora.id);
  };

  const menu = [
    {
      name: 'Edit',
      action: handleEditLora,
    },
    {
      name: 'Delete',
      action: handleDeleteLora,
    },
  ];

  // modal related

  const handleClose = () => {
    setSelectedLora(lora);
    setOpen(false);
  };

  return (
    <>
      <Box
        id="lora-container"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          p: 0.5,
          pl: container === 'drawer' ? 0.5 : 1,
          border: container === 'drawer' ? '1px solid' : 'none',
          borderColor: color.White64_T,
          borderRadius: container === 'drawer' ? 1 : 0,

          my: 1,

          cursor: editable ? 'default' : 'pointer',
        }}
        onMouseEnter={() => setLoraHover(true)}
        onMouseLeave={() => setLoraHover(false)}
      >
        <Box
          id="lora-cover-image-container"
          sx={{
            width: container === 'drawer' ? '35px' : '40px',
            height: container === 'drawer' ? '35px' : '40px',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          {lora.coverImage ? (
            <img
              src={lora.coverImage}
              alt="LoRA Cover Image"
              width="100%"
              height="100%"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                border: '1px solid',
                borderColor: color.White64_T,
                cursor: 'pointer',
                position: 'relative',
              }}
              onMouseEnter={() => {
                if (editable) {
                  setImageHover(true);
                  setLoraHover(false);
                }
              }}
              onMouseLeave={() => {
                if (editable) {
                  setImageHover(false);
                  setLoraHover(true);
                }
              }}
              onClick={() => setOpen(true)}
            >
              <i
                className="fa-light fa-upload"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  opacity: imageHover ? 1 : 0,
                  transition: 'opacity 0.1s ease-in-out',
                }}
              ></i>
              <i
                className="fa-light fa-image"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  opacity: imageHover ? 0 : 1,
                  transition: 'opacity 0.1s ease-in-out',
                }}
              ></i>
            </Box>
          )}
        </Box>
        <Box
          id="lora-name-url-container"
          sx={{
            ml: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            gap: 0.5,
          }}
        >
          <Box
            id="lora-name-container"
            onMouseEnter={() => {
              if (editable) {
                setNameHover(true);
                setLoraHover(false);
              }
            }}
            onMouseLeave={() => {
              if (editable) {
                setNameHover(false);
                setLoraHover(true);
              }
            }}
          >
            <Typography variant="body-sm-rg" fontWeight="bold" sx={{ lineHeight: 1 }}>
              {lora.name}
            </Typography>
            <i
              className="fa-light fa-pen-to-square"
              style={{
                transform: 'translateY(-1px)',
                fontSize: '10px',
                cursor: 'pointer',
                opacity: nameHover ? 1 : 0,
                transition: 'opacity 0.1s ease-in-out',
                marginLeft: 4,
              }}
              onClick={() => setOpen(true)}
            ></i>
          </Box>
          <Tooltip title={lora.url} placement="top" enterDelay={300}>
            <Typography variant="body-std-rg" color={color.White64_T} sx={{ fontSize: '10px', fontStyle: 'italic' }}>
              {lora.file ? (
                filename.length > 30 ? (
                  filename.substring(0, 27) + '...'
                ) : (
                  filename
                )
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>No File</span>
                  {editable && (
                    <Link
                      sx={{
                        fontSize: '10px',
                        cursor: 'pointer',
                        opacity: loraHover ? 1 : 0,
                        transition: 'opacity 0.1s ease-in-out',
                      }}
                      onClick={() => setOpen(true)}
                    >
                      Upload
                    </Link>
                  )}
                </Box>
              )}
            </Typography>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          {editable && (
            <>
              <ButtonBase size="small" sx={{ px: 1, py: 1 }} onClick={(e) => setAnchorEl(e.currentTarget)}>
                <img src="/icons/ellipsis-vertical.svg" width="12px" style={{ opacity: 0.6 }} />
              </ButtonBase>
              <AppContextMenu
                items={menu}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                width="120px"
              />
            </>
          )}
        </Box>
      </Box>
      <LoRAModal open={open} onClose={handleClose} lora={lora} updateLora={updateLora} />
    </>
  );
}

export default LoRA;
