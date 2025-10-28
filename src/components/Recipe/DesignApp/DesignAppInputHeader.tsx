import { Box, TextField, Typography, Divider, Chip, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DesignAppMode } from '@/enums/design-app-modes.enum';
import { I18N_KEYS } from '@/language/keys';

type Node = {
  id: string;
  data: {
    name: string;
    description: string;
  };
};

type MenuAction = { label: React.ReactNode; onClick: () => void; disabled?: boolean; id: string };

type DesignAppInputHeaderProps = {
  inputId: string;
  updateNodeData: (id: string, data: any) => void;
  role: string;
  inputColor: string;
  nodes: Node[];
  setIsEditingInputMetadata: (isEditing: boolean) => void;
  mode: DesignAppMode;
  actions?: MenuAction[];
};

function DesignAppInputHeader({
  inputId,
  updateNodeData,
  role,
  inputColor,
  nodes,
  setIsEditingInputMetadata,
  mode,
  actions,
}: DesignAppInputHeaderProps) {
  const { t: translate } = useTranslation();

  const [editingInputId, setEditingInputId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const anchorEl = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const inEditMode = role === 'editor' && mode === DesignAppMode.Editing;

  useEffect(() => {
    if (editingInputId || editingDescription) {
      setIsEditingInputMetadata(true);
    } else {
      setIsEditingInputMetadata(false);
    }
  }, [editingInputId, editingDescription]);

  const handleInputNameChange = (newName: string) => {
    if (inEditMode) {
      updateNodeData(inputId, { name: newName });
    }
  };
  const handleInputDescriptionChange = (newDescription: string) => {
    if (inEditMode) {
      updateNodeData(inputId, { description: newDescription });
    }
  };

  const currentNode = nodes.find((node) => node.id === inputId);

  const getInputDescription = () => {
    const nodeDescription = currentNode?.data.description;
    if (inEditMode && !nodeDescription) {
      return translate(I18N_KEYS.SHARED_DESIGN_APP.INPUTS.HEADER.ADD_DESCRIPTION);
    }

    return nodeDescription;
  };

  if (!currentNode) {
    return null;
  }

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        mb: 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <Divider sx={{ ml: -2, flexGrow: 1 }} textAlign="left">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {inEditMode && (
              <Box sx={{ width: '12px', display: 'flex', alignItems: 'center' }}>
                <img src="/icons/dots.svg" width="12px" style={{ opacity: 0.8, cursor: 'grab' }} draggable={false} />
              </Box>
            )}
            {editingInputId === inputId ? (
              <TextField
                autoFocus
                fullWidth
                size="small"
                defaultValue={currentNode.data.name}
                onFocus={(e) => {
                  e.target.select();
                }}
                onBlur={(e) => {
                  handleInputNameChange(e.target.value);
                  setEditingInputId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && 'value' in e.target && typeof e.target.value === 'string') {
                    handleInputNameChange(e.target.value);
                    setEditingInputId(null);
                  }
                  if (e.key === 'Escape') {
                    setEditingInputId(null);
                  }
                }}
                sx={{
                  '& .MuiInput-root': {
                    fontSize: '0.8125rem',
                    '&:before, &:after': {
                      borderBottom: `1px solid ${inputColor}`,
                    },
                  },
                }}
                variant="standard"
              />
            ) : (
              <Chip
                size="small"
                label={currentNode.data.name}
                sx={{
                  background: inputColor,
                  cursor: inEditMode ? 'text' : 'default',
                  '&:hover': {
                    background: inEditMode ? inputColor : 'transparent',
                  },
                }}
                onClick={() => inEditMode && setEditingInputId(inputId)}
              />
            )}
          </Box>
        </Divider>
        {inEditMode ? (
          <Box>
            <IconButton size="small" ref={anchorEl} onClick={() => setOpen(true)}>
              <MoreVertIcon fontSize="inherit" />
            </IconButton>
            <Menu
              anchorEl={anchorEl.current}
              open={open}
              onClose={() => setOpen(false)}
              MenuListProps={{
                disablePadding: true,
              }}
            >
              {actions?.map((action) => (
                <MenuItem key={action.id} disabled={action.disabled} onClick={action.onClick}>
                  {action.label}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        ) : null}
      </Box>
      <Box id="design-appinput-description" sx={{ mt: 1 }}>
        {editingDescription ? (
          <TextField
            autoFocus
            multiline
            fullWidth
            size="small"
            placeholder={translate(I18N_KEYS.SHARED_DESIGN_APP.INPUTS.HEADER.DESCRIPTION_PLACEHOLDER)}
            defaultValue={currentNode.data.description}
            onBlur={(e) => {
              handleInputDescriptionChange(e.target.value);
              setEditingDescription(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && 'value' in e.target && typeof e.target.value === 'string') {
                handleInputDescriptionChange(e.target.value);
                setEditingDescription(false);
              }
              if (e.key === 'Escape') {
                setEditingDescription(false);
              }
            }}
            variant="standard"
            sx={{ '& .MuiInput-root': { fontSize: '0.75rem' } }}
          />
        ) : (
          <Typography
            variant="body-sm-rg"
            sx={{
              cursor: inEditMode ? 'text' : 'default',
              maxWidth: '100%',
            }}
            onClick={() => inEditMode && setEditingDescription(true)}
          >
            {getInputDescription()}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default DesignAppInputHeader;
