import { Box, Tooltip } from '@mui/material';
import { memo, ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';
import { openIntercom } from '@/providers/intercom';
import { EXTERNAL_LINKS } from '@/consts/externalLinks.consts';
import { FlexColCenHor } from '@/UI/styles';
import { ToolboxIcon } from '@/UI/Icons/ToolboxIcon';
import { ImageModelsIcon } from '@/UI/Icons/ImageModelsIcon';
import { VideoModelsIcon } from '@/UI/Icons/VideoModelsIcon';
import { ThreeDModelsIcon } from '@/UI/Icons/ThreeDModelsIcon';
import { MediaIcon } from '@/UI/Icons/MediaIcon';
import { SparkleIcon } from '@/UI/Icons/SparkleIcon';
import { AppToggleButtons } from '@/UI/AppToggleButtons/AppToggleButtons';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { DiscordLogo } from '@/UI/Icons/DiscordLogo';
import { QuestionMarkIcon } from '@/UI/Icons/QuestionMarkIcon';
import { AppToggleButton } from '@/UI/AppToggleButtons/AppToggleButton';
import { SearchIcon } from '@/UI/Icons/SearchIcon';
import { useNodeFiltersStore } from '@/state/nodes/nodes.state';
import { RecentIcon } from '@/UI/Icons/RecentIcon';
import { useSubscriptionPermissions } from '@/hooks/useSubscriptionPermissions';
import WorkflowFileMenu from './LeftPanelSections/WorkflowFileMenu';

const _MENU_TO_SHOW = ['search', 'recent', 'toolbox', 'image', 'video', 'threedee', 'models', 'files'] as const;
export type MenuSection = (typeof _MENU_TO_SHOW)[number];

type MenuItem = { value: MenuSection; label: ReactNode; tooltipText: string };
interface LeftToolMenuProps {
  selectedItem: MenuSection | null;
  setSelectedItem: (item: MenuSection | null) => void;
  setSelectedItemUser?: (item: MenuSection | null) => void;
  goToDashboard: () => void;
  onDuplicateRecipe: (recipeId: string) => void;
  panOnScrollEnabled?: boolean;
  onPanOnScrollChange?: (enabled: boolean) => void;
  showFloatMenuOnRightClickEnabled?: boolean;
  onShowFloatMenuOnRightClickChange?: (enabled: boolean) => void;
  requireAltKeyForSuggestionsEnabled?: boolean;
  onRequireAltKeyForSuggestionsChange?: (enabled: boolean) => void;
  onShareWorkflow: () => void;
}

const LeftToolMenuV2 = memo(function LeftToolMenuV2({
  selectedItem,
  setSelectedItem,
  setSelectedItemUser,
  goToDashboard,
  onDuplicateRecipe,
  panOnScrollEnabled,
  onPanOnScrollChange,
  showFloatMenuOnRightClickEnabled,
  onShowFloatMenuOnRightClickChange,
  requireAltKeyForSuggestionsEnabled,
  onRequireAltKeyForSuggestionsChange,
  onShareWorkflow,
}: LeftToolMenuProps) {
  const { t } = useTranslation();
  const { resetFilters, menu } = useNodeFiltersStore();
  const { modelBlockingPermissions } = useSubscriptionPermissions();

  const handleMenuItemClick = (value: MenuSection | null) => {
    if (selectedItem) {
      resetFilters();
    }
    if (setSelectedItemUser) {
      setSelectedItemUser(value);
    } else {
      setSelectedItem(value);
    }
  };

  const handleMediaClick = () => {
    if (selectedItem) {
      resetFilters();
    }
    if (setSelectedItemUser) {
      setSelectedItemUser(selectedItem === 'files' ? null : 'files');
    } else {
      setSelectedItem(selectedItem === 'files' ? null : 'files');
    }
  };

  const handleDiscordClick = () => window.open(EXTERNAL_LINKS.discordInvite);

  const menuItems: MenuItem[] = useMemo(
    () =>
      [
        {
          value: 'search',
          label: <SearchIcon />,
          tooltipText: t(I18N_KEYS.GENERAL.SEARCH),
        },
        menu.recent.children?.length > 0
          ? {
              value: 'recent',
              label: <RecentIcon />,
              tooltipText: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.TITLE.RECENT),
            }
          : null,
        {
          value: 'toolbox',
          label: <ToolboxIcon />,
          tooltipText: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.TITLE.TOOLBOX),
        },
        {
          value: 'image',
          label: <ImageModelsIcon />,
          tooltipText: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.TITLE.IMAGE),
        },
        {
          value: 'video',
          label: <VideoModelsIcon />,
          tooltipText: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.TITLE.VIDEO),
        },
        {
          value: 'threedee',
          label: <ThreeDModelsIcon />,
          tooltipText: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.TITLE.THREEDEE),
        },
        !modelBlockingPermissions.view && {
          value: 'models',
          label: <SparkleIcon />,
          tooltipText: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.TITLE.MY_MODELS),
        },
      ].filter(Boolean) as MenuItem[],
    [menu.recent.children?.length, modelBlockingPermissions.view, t],
  );

  return (
    <FlexColCenHor
      id="main-toolbar-container"
      sx={{
        py: 3,
        width: '100%',
        height: '100%',
        background: color.Black92,
        border: '1px solid',
        borderColor: color.Dark_Grey,
        borderRadius: 0,
      }}
    >
      <WorkflowFileMenu
        goToDashboard={goToDashboard}
        onDuplicateRecipe={onDuplicateRecipe}
        panOnScrollEnabled={panOnScrollEnabled}
        onPanOnScrollChange={onPanOnScrollChange}
        showFloatMenuOnRightClickEnabled={showFloatMenuOnRightClickEnabled}
        onShowFloatMenuOnRightClickChange={onShowFloatMenuOnRightClickChange}
        requireAltKeyForSuggestionsEnabled={requireAltKeyForSuggestionsEnabled}
        onRequireAltKeyForSuggestionsChange={onRequireAltKeyForSuggestionsChange}
        onShareWorkflow={onShareWorkflow}
      />
      <Box id="toolbar-container" sx={{ flexGrow: 1 }}>
        <AppToggleButtons
          mode="light"
          orientation="vertical"
          value={selectedItem}
          options={menuItems.map((item) => ({
            ...item,
            id: `toolbar-menu-item-${item.value}`,
          }))}
          onChange={handleMenuItemClick}
          btnW={36}
          btnH={36}
          gap={1.5}
          isIcons
          allowDeselect
        />
      </Box>
      <FlexColCenHor data-testid="toolbar-extras-container" sx={{ gap: 3 }}>
        <Tooltip
          title={t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.TITLE.MEDIA)}
          placement="right"
          enterDelay={800}
          enterNextDelay={100}
        >
          <AppToggleButton
            mode="light"
            selected={selectedItem === 'files'}
            value={selectedItem === 'files'}
            onClick={handleMediaClick}
            isIcon
            sx={{ border: 'none' }}
            btnW={36}
            btnH={36}
          >
            <MediaIcon height={20} width={20} />
          </AppToggleButton>
        </Tooltip>
        <AppIconButton id="intercom-weavy-button" onClick={openIntercom} width={36} height={36}>
          <QuestionMarkIcon height={20} width={20} />
        </AppIconButton>
        <Tooltip
          title={t(I18N_KEYS.NAVIGATION_DRAWER.DISCORD_TITLE)}
          placement="right"
          enterDelay={800}
          enterNextDelay={100}
        >
          <AppIconButton onClick={handleDiscordClick} width={36} height={36}>
            <DiscordLogo height={20} width={20} />
          </AppIconButton>
        </Tooltip>
      </FlexColCenHor>
    </FlexColCenHor>
  );
});

export default LeftToolMenuV2;
