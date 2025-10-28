import React, { useState, useEffect } from 'react';
import { Box, Typography, Dialog, TextField, Checkbox, FormGroup, FormControlLabel } from '@mui/material';
import { ButtonContained } from '@/UI/Buttons/AppButton';

function EditModelDialog({ node, isOpen, onClose, onSave }) {
  const [nodeName, setNodeName] = useState(node?.data.menu.DisplayName || '');
  const [nodeDescription, setNodeDescription] = useState(node?.data.description || '');
  const [isPublic, setIsPublic] = useState(node?.visibility === 'private' ? false : true);

  const checkboxLabel = 'Share this model with the community';

  useEffect(() => {
    if (node) {
      setNodeName(node.data.menu.displayName);
      setNodeDescription(node.data.description);
      setIsPublic(node?.visibility === 'private' ? false : true);
    }
  }, [node]);

  const handleNodeNameChange = (e) => {
    setNodeName(e.target.value);
  };

  const handleNodeDescriptionChange = (e) => {
    setNodeDescription(e.target.value);
  };

  const handleIsPublicChange = (e) => {
    setIsPublic(e.target.checked);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(node.id, nodeName, nodeDescription, isPublic ? 'public' : 'private');
    onClose(); // Close the dialog
  };

  return (
    <Dialog onClose={onClose} open={isOpen}>
      <Box
        onSubmit={handleSubmit}
        component="form"
        id="custom-node-edit-details-dialog-content"
        sx={{ width: { xs: '90%', sm: '400px' }, display: 'flex', flexDirection: 'column', p: 2 }}
      >
        <Typography variant="h3">Edit your saved model name, description or share with the community</Typography>
        <TextField
          value={nodeName}
          onChange={handleNodeNameChange}
          required
          label="Meaningful Name"
          sx={{ mt: 2 }}
          size="small"
        />
        <TextField
          value={nodeDescription}
          onChange={handleNodeDescriptionChange}
          required
          multiline
          rows={3}
          label="Clear Description"
          sx={{ mt: 2 }}
          size="small"
        />
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={isPublic} onChange={handleIsPublicChange} />}
            label={checkboxLabel}
          />
        </FormGroup>
        <ButtonContained type="submit" fullWidth sx={{ mt: 2 }}>
          Save Your Custom Model
        </ButtonContained>
      </Box>
    </Dialog>
  );
}

export default EditModelDialog;
