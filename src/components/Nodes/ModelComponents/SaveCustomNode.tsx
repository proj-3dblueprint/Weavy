import { Box, Typography } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { log } from '@/logger/logger.ts';
import { AuthContext } from '@/contexts/AuthContext';
import { getAxiosInstance } from '@/services/axiosConfig';
import { SaveIcon } from '@/UI/Icons/SaveIcon';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';
import { Input } from '@/UI/Input/Input';
import { Flex } from '@/UI/styles';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { XIcon } from '@/UI/Icons/XIcon';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { useWorkflowStore } from '@/state/workflow.state';
import { ModelType } from '@/enums/model-type.enum';
import type { ModelBaseNodeData } from '@/types/nodes/model';
import type { NodeDefinition } from '@/types/api/nodeDefinition';

const logger = log.getLogger('SaveCustomNode');
const axiosInstance = getAxiosInstance();

interface SaveCustomNodeProps {
  data: ModelBaseNodeData;
}

export const SaveCustomNode = ({ data }: SaveCustomNodeProps) => {
  const { t } = useTranslation();
  const { currentUser } = useContext(AuthContext);
  const [nodeName, setNodeName] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const addNodeType = useWorkflowStore((state) => state.addNodeType);

  const handleSaveCustomNode = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleSaveCustomNodeSuccess = useCallback(
    (savedCustomNodeData: NodeDefinition) => {
      addNodeType(savedCustomNodeData);
      setDialogOpen(false);
    },
    [addNodeType],
  );

  const submitCustomNode = useCallback(async () => {
    if (!data.model) return;
    const requestBody = {
      data: {
        color: 'Red',
        handles: data.handles,
        name: nodeName,
        description: nodeDescription,
        model: {
          name: data.model.name,
          version: data.model.version,
          label: data.model.label,
          service: data.model.service,
        },
        menu: {
          displayName: nodeName,
          icon: 'EmojiObjectsIcon',
          isModel: true,
        },
        schema: data.schema,
        params: data.params,
        version: 2,
      },
      icon: getIconByModelType(data.model.service as ModelType),
      type: 'custommodelV2',
      isModel: true,
      owner: currentUser?.uid,
      dragHandle: '.node-header',
      visibility: 'private',
    };

    try {
      // Sending POST request to the server
      const response = await axiosInstance.post<{ data: NodeDefinition }>(`/v1/user/node-definitions`, requestBody);
      handleSaveCustomNodeSuccess(response.data.data);
    } catch (error) {
      logger.error('Error submitting form:', error);
      // Handle error here (e.g., set an error message)
    }
  }, [data, nodeName, nodeDescription, currentUser?.uid, handleSaveCustomNodeSuccess]);

  const handleDetailsSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void submitCustomNode();
    },
    [submitCustomNode],
  );

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleNodeNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setNodeName(event.target.value);
  }, []);

  const handleNodDescriptionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setNodeDescription(event.target.value);
  }, []);

  const getIconByModelType = useCallback((modelType: ModelType) => {
    switch (modelType) {
      case ModelType.FalImported:
        return 'fal';
      case ModelType.Replicate:
        return 'replicate';
      case ModelType.Civit:
        return 'civit';
      default:
        return 'weavy';
    }
  }, []);

  return (
    <>
      <ButtonContained
        mode="text"
        size="small"
        onClick={handleSaveCustomNode}
        startIcon={<SaveIcon />}
        sx={{ width: 'fit-content' }}
      >
        {t(I18N_KEYS.RECIPE_MAIN.NODES.WILDCARD.SAVE_TO_MY_LIBRARY_CTA)}
      </ButtonContained>
      <Dialog onClose={handleDialogClose} open={dialogOpen} sx={{ '& .MuiDialog-paper': { borderRadius: 2 } }}>
        <Box
          onSubmit={handleDetailsSubmit}
          component="form"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: { xs: '90%', sm: '420px' },
            border: `1px solid ${color.White08_T}`,
            borderRadius: 2,
            bgcolor: color.Black92,
            p: 3,
            pt: 6,
            gap: 2,
          }}
        >
          <Typography variant="body-lg-sb">
            {t(I18N_KEYS.RECIPE_MAIN.NODES.WILDCARD.SAVE_TO_MY_LIBRARY_DIALOG.TITLE)}
          </Typography>
          <Input
            value={nodeName}
            onChange={handleNodeNameChange}
            required
            label={t(I18N_KEYS.RECIPE_MAIN.NODES.WILDCARD.SAVE_TO_MY_LIBRARY_DIALOG.NAME_LABEL)}
            placeholder={t(I18N_KEYS.RECIPE_MAIN.NODES.WILDCARD.SAVE_TO_MY_LIBRARY_DIALOG.NAME_PLACEHOLDER)}
            sx={{ mt: 2 }}
            size="large"
          />
          <Input
            value={nodeDescription}
            onChange={handleNodDescriptionChange}
            required
            multiline
            rows={3}
            label={t(I18N_KEYS.RECIPE_MAIN.NODES.WILDCARD.SAVE_TO_MY_LIBRARY_DIALOG.DESCRIPTION_LABEL)}
            placeholder={t(I18N_KEYS.RECIPE_MAIN.NODES.WILDCARD.SAVE_TO_MY_LIBRARY_DIALOG.DESCRIPTION_PLACEHOLDER)}
            sx={{ mt: 2 }}
            size="large"
          />
          <Flex
            sx={{
              mt: 2,
              justifyContent: 'flex-end',
              gap: 1,
              width: '100%',
            }}
          >
            <ButtonContained size="small" sx={{ px: 2 }} mode="text" onClick={handleDialogClose}>
              {t(I18N_KEYS.RECIPE_MAIN.NODES.WILDCARD.SAVE_TO_MY_LIBRARY_DIALOG.CTA_CANCEL)}
            </ButtonContained>
            <ButtonContained size="small" type="submit" sx={{ px: 2 }}>
              {t(I18N_KEYS.RECIPE_MAIN.NODES.WILDCARD.SAVE_TO_MY_LIBRARY_DIALOG.CTA_SAVE)}
            </ButtonContained>
          </Flex>
        </Box>
        <AppIconButton onClick={handleDialogClose} sx={{ position: 'absolute', top: 16, right: 16 }}>
          <XIcon />
        </AppIconButton>
      </Dialog>
    </>
  );
};
