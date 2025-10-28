import { useMemo, useState } from 'react';
import { Box, Grid2, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Flex, FlexCol } from '@/UI/styles';
import { Input } from '@/UI/Input/Input';
import { I18N_KEYS } from '@/language/keys';
import { useGlobalStore } from '@/state/global.state';
import { AppContextMenu } from '@/UI/AppContextMenu/AppContextMenu';
import { CheckMarkCircleIcon } from '@/UI/Icons';
import { MenuAction } from '../Menu/Actions';
import { Loader } from './Loader';
import { ModelCard } from './ModelCard';
import { useCommunityCustomModels } from './useCommunityCustomModels';

interface ContextMenuState {
  mouseX: number | null;
  mouseY: number | null;
  isOpen: boolean;
  nodeId: string | null;
}

export const CommunityModels = () => {
  const {
    communityCustomModels,
    getCommunityCustomModelEnrichment,
    getCommunityCustomModelEnrichmentLoading,
    loadingCommunityCustomModels,
    saveCommunityCustomModelToMyModels,
  } = useCommunityCustomModels();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { t } = useTranslation();
  const { updateSnackbarData } = useGlobalStore();
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

  const saveToMyNodes = async (id: string | null) => {
    if (!id) {
      return;
    }
    await saveCommunityCustomModelToMyModels(id);
    updateSnackbarData({
      text: t(I18N_KEYS.DASHBOARD.PAGES.COMMUNITY.MODEL_SAVED),
      isOpen: true,
      icon: <CheckMarkCircleIcon width={20} height={20} />,
    });
  };

  const menuItems: MenuAction[] = [
    {
      name: t(I18N_KEYS.DASHBOARD.PAGES.COMMUNITY.CONTEXT_MENU.SAVE_TO_MY_MODELS),
      action: () => {
        void saveToMyNodes(contextMenu.nodeId);
        handleContextMenuClose();
      },
    },
  ];

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value);

  const filteredModels = useMemo(
    () =>
      communityCustomModels.filter(
        (node) =>
          node.data?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.data?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.data?.model?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [communityCustomModels, searchTerm],
  );

  if (loadingCommunityCustomModels) {
    return (
      <Flex sx={{ position: 'relative', width: '100%', height: '100vh' }}>
        <Loader />
      </Flex>
    );
  }

  return (
    <>
      <Box
        data-testid="dashboard-nodes-container"
        component="main"
        sx={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <Flex sx={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <FlexCol>
            <Typography variant="body-lg-md" sx={{ mb: 1 }}>
              {t(I18N_KEYS.DASHBOARD.PAGES.COMMUNITY.TITLE)}
            </Typography>
            <Typography sx={{ flex: 1 }} variant="body-sm-rg">
              {t(I18N_KEYS.DASHBOARD.PAGES.COMMUNITY.SUBTITLE)}
            </Typography>
          </FlexCol>
          <Input placeholder={t(I18N_KEYS.GENERAL.SEARCH)} value={searchTerm} onChange={handleSearchChange} />
        </Flex>
        <Box data-testid="my-nodes-content-container" sx={{ mt: 2 }}>
          <Grid2 container spacing={2}>
            {filteredModels &&
              filteredModels.map((model) => {
                return (
                  <Grid2
                    size={{
                      xs: 12,
                      sm: 6,
                      md: 4,
                      lg: 3,
                      xl: 2.4,
                    }}
                    key={model.id}
                    onContextMenu={(e) => handleContextMenu(e, model.id)}
                    onClick={(e) => handleContextMenu(e, model.id)}
                  >
                    <ModelCard
                      enrichment={getCommunityCustomModelEnrichment(model.id)}
                      handleMouseEnterCard={handleMouseEnterCard}
                      handleMouseLeaveCard={handleMouseLeaveCard}
                      hoveredModelId={hoveredNodeId}
                      loadingEnrichment={getCommunityCustomModelEnrichmentLoading(model.id)}
                      model={model}
                    />
                  </Grid2>
                );
              })}
          </Grid2>
        </Box>
      </Box>
      <AppContextMenu
        open={contextMenu.isOpen}
        onClose={handleContextMenuClose}
        mouseX={contextMenu.mouseX}
        mouseY={contextMenu.mouseY}
        width="160px"
        items={menuItems}
      />
    </>
  );
};
