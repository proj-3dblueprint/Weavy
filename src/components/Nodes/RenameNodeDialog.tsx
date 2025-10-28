import { ChangeEvent, FormEvent, useState } from 'react';
import { Dialog, Typography, Box, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenVer } from '@/UI/styles';
import { Input } from '@/UI/Input/Input';
import { color } from '@/colors';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import type { DialogData } from '@/state/global.state';

interface RenameNodeDialogProps {
  dialogData: DialogData;
  updateNodeData: (id: string, data: { name: string }) => void;
  closeOverlayDialog: () => void;
}

function RenameNodeDialog({ dialogData, updateNodeData, closeOverlayDialog }: RenameNodeDialogProps) {
  const { t } = useTranslation();

  const { id, initialName } = dialogData;
  const [nodeName, setNodeName] = useState(initialName || '');

  const handleNodeNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNodeName(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateNodeData(id, {
      name: nodeName,
    });
    closeOverlayDialog(); // Close the dialog
  };

  return (
    <Dialog
      onClose={closeOverlayDialog}
      open={true}
      sx={{
        '& .MuiDialog-paper': {
          backgroundImage: 'none',
          borderRadius: '8px',
          border: `1px solid ${color.White08_T}`,
        },
      }}
    >
      <Box
        onSubmit={handleSubmit}
        component="form"
        id="custom-node-edit-details-dialog-content"
        sx={{
          width: { xs: '90%', sm: '420px' },
          display: 'flex',
          flexDirection: 'column',
          p: 3,
          pt: 5,
          backgroundColor: color.Black92,
        }}
      >
        <Typography variant="body-lg-sb" sx={{ mb: 3 }}>
          {t(I18N_KEYS.RECIPE_MAIN.NODES.RENAME_NODE_DIALOG.TITLE)}
        </Typography>
        <Input value={nodeName} onChange={handleNodeNameChange} required sx={{ mb: 4 }} />
        <FlexCenVer sx={{ justifyContent: 'flex-end', gap: 1 }}>
          <ButtonContained size="small" mode="text" onClick={closeOverlayDialog} sx={{ px: 1 }}>
            {t(I18N_KEYS.RECIPE_MAIN.NODES.RENAME_NODE_DIALOG.CTA_CANCEL)}
          </ButtonContained>
          <ButtonContained size="small" type="submit" mode="filled-light">
            {t(I18N_KEYS.RECIPE_MAIN.NODES.RENAME_NODE_DIALOG.CTA_SAVE)}
          </ButtonContained>
        </FlexCenVer>
      </Box>
      <IconButton sx={{ position: 'absolute', top: 8, right: 8 }} onClick={closeOverlayDialog} size="small">
        <CloseIcon />
      </IconButton>
    </Dialog>
  );
}

export default RenameNodeDialog;
