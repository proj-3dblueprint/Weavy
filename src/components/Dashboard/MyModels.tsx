import { useState } from 'react';
import { Box, Grid2, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import { AppContextMenu } from '@/UI/AppContextMenu/AppContextMenu';
import { Flex, FlexCol } from '@/UI/styles';
import { SparkleSlashIcon } from '@/UI/Icons/SparkleSlashIcon';
import { EXTERNAL_LINKS } from '@/consts/externalLinks.consts';
import { MenuAction } from '../Menu/Actions';
import ConfirmationDialogV2 from '../Common/ConfirmationDialogV2';
import { EmptyState } from '../Common/EmptyState/EmptyState';
import EditModelDialog from './EditModelDialog';
import { ModelCard } from './ModelCard';
import { Loader } from './Loader';
import { useUserCustomModels } from './useUserCustomModels';
import type { CustomModel } from '@/state/customModels.state';

interface DialogState {
  show: boolean;
  id: string | null;
}

interface ContextMenuState {
  mouseX: number | null;
  mouseY: number | null;
  isOpen: boolean;
  nodeId: string | null;
}

export const MyModels = () => {
  const {
    deleteUserCustomModel,
    editUserCustomModel,
    getUserCustomModelEnrichment,
    getUserCustomModelEnrichmentLoading,
    loadingUserCustomModels,
    userCustomModels,
  } = useUserCustomModels();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [deleteDialogState, setDeleteDialogState] = useState<DialogState>({
    show: false,
    id: null,
  });
  const [editDialogState, setEditDialogState] = useState<DialogState>({
    show: false,
    id: null,
  });
  const [selectedNode, setSelectedNode] = useState<CustomModel | null>(null);

  const { t } = useTranslation();
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    mouseX: null,
    mouseY: null,
    isOpen: false,
    nodeId: null,
  });

  const handleMouseEnterCard = (id: string) => setHoveredNodeId(id);

  const handleMouseLeaveCard = () => setHoveredNodeId(null);

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>, id: string) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      isOpen: true,
      nodeId: id,
    });
  };

  const handleContextMenuClose = () => setContextMenu({ ...contextMenu, isOpen: false });

  const menuItems: MenuAction[] = [
    {
      name: t(I18N_KEYS.MAIN_DASHBOARD.CONTEXT_MENU.EDIT),
      action: () => {
        const nodeToEdit = userCustomModels.find((node) => node.id === contextMenu.nodeId);
        if (nodeToEdit) {
          setSelectedNode(nodeToEdit);
          setEditDialogState({ show: true, id: contextMenu.nodeId });
        }
        handleContextMenuClose();
      },
    },
    {
      name: t(I18N_KEYS.MAIN_DASHBOARD.CONTEXT_MENU.DELETE),
      action: () => setDeleteDialogState({ show: true, id: contextMenu.nodeId }),
    },
  ];

  const handleDeleteDialogClose = () => setDeleteDialogState({ show: false, id: null });

  const handleConfirmDeleteNode = () => {
    if (!deleteDialogState.id) {
      return;
    }

    void deleteUserCustomModel(deleteDialogState.id);
    handleDeleteDialogClose();
  };

  const handleEditDialogClose = () => setEditDialogState({ show: false, id: null });

  const handleSaveEdit = (nodeId: string, nodeName: string, nodeDescription: string, nodeVisibility: string) =>
    void editUserCustomModel(nodeId, { name: nodeName, description: nodeDescription, visibility: nodeVisibility });

  if (loadingUserCustomModels) {
    return (
      <Flex sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <Loader />
      </Flex>
    );
  }

  return (
    <>
      <Box
        component="main"
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
        data-testid="dashboard-nodes-container"
      >
        {userCustomModels.length > 0 ? (
          <>
            <FlexCol sx={{ gap: 1 }}>
              <Typography variant="body-lg-md">{t(I18N_KEYS.DASHBOARD.PAGES.MY_MODELS.TITLE)}</Typography>
              <Typography variant="body-sm-rg">{t(I18N_KEYS.DASHBOARD.PAGES.MY_MODELS.SUBTITLE)}</Typography>
            </FlexCol>
            <Box data-testid="my-nodes-content-container" sx={{ mt: 2, height: '100%' }}>
              <Grid2 container spacing={2}>
                {userCustomModels.map((model) => (
                  <Grid2
                    size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2.4 }}
                    key={model.id}
                    onContextMenu={(e) => handleContextMenu(e, model.id)}
                  >
                    <ModelCard
                      enrichment={getUserCustomModelEnrichment(model.id)}
                      handleMouseEnterCard={handleMouseEnterCard}
                      handleMouseLeaveCard={handleMouseLeaveCard}
                      hoveredModelId={hoveredNodeId}
                      loadingEnrichment={getUserCustomModelEnrichmentLoading(model.id)}
                      model={model}
                    />
                  </Grid2>
                ))}
              </Grid2>
            </Box>
          </>
        ) : (
          <EmptyState
            icon={<SparkleSlashIcon />}
            title={t(I18N_KEYS.DASHBOARD.PAGES.MY_MODELS.EMPTY_STATE.TITLE)}
            description={t(I18N_KEYS.DASHBOARD.PAGES.MY_MODELS.EMPTY_STATE.DESCRIPTION)}
            actions={[
              {
                label: t(I18N_KEYS.DASHBOARD.PAGES.MY_MODELS.EMPTY_STATE.ACTION),
                href: EXTERNAL_LINKS.importModelTutorial,
                target: '_blank',
              },
            ]}
            sx={{ paddingTop: 'max(15%, 144px)', alignItems: 'flex-start' }}
          />
        )}
      </Box>
      <AppContextMenu
        mouseX={contextMenu.mouseX}
        mouseY={contextMenu.mouseY}
        open={contextMenu.isOpen}
        onClose={handleContextMenuClose}
        items={menuItems}
        width="160px"
      />
      <ConfirmationDialogV2
        title={t(I18N_KEYS.DASHBOARD.PAGES.MY_MODELS.DELETE_DIALOG_TITLE)}
        open={deleteDialogState.show}
        onClose={handleDeleteDialogClose}
        onConfirm={handleConfirmDeleteNode}
      />
      <EditModelDialog
        node={selectedNode}
        isOpen={editDialogState.show}
        onClose={handleEditDialogClose}
        onSave={handleSaveEdit}
      />
    </>
  );
};
