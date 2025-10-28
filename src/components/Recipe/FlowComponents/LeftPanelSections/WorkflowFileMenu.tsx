import { MouseEvent, useMemo, useState } from 'react';
import { Box, Menu } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { CaretIcon } from '@/UI/Icons/CaretIcon';
import { FlexCenHorVer } from '@/UI/styles';
import Actions, { MenuAction } from '@/components/Menu/Actions';
import { useDashboardRecipes } from '@/components/Dashboard/useDashboardRecipes';
import ParentMenuItem from '@/components/Recipe/Menu/ParentMenuItem';
import { AppMenuItem } from '@/UI/AppContextMenu/AppMenu.styles';
import { CheckMarkIcon } from '@/UI/Icons/CheckMarkIcon';
import { I18N_KEYS } from '@/language/keys';
import { useWorkflowStore } from '@/state/workflow.state';
import { useUserStore } from '@/state/user.state';
import { FF_KEY_NAVIGATION } from '@/consts/featureFlags';
import { useGlobalStore } from '@/state/global.state';
import { getOS } from '@/utils/general';

interface WorkflowFileMenuProps {
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

function WorkflowFileMenu({
  goToDashboard,
  onDuplicateRecipe,
  panOnScrollEnabled,
  onPanOnScrollChange,
  showFloatMenuOnRightClickEnabled,
  onShowFloatMenuOnRightClickChange,
  requireAltKeyForSuggestionsEnabled,
  onRequireAltKeyForSuggestionsChange,
  onShareWorkflow,
}: WorkflowFileMenuProps) {
  const [anchorElUserMenu, setAnchorElUserMenu] = useState<HTMLElement | null>(null);
  const { t } = useTranslation();
  const currentRecipeId = useWorkflowStore.getState().recipe?.id;
  const currentUser = useUserStore.getState().user;
  const { createRecipe } = useDashboardRecipes();
  const ff_isKeyNavigationEnabled = useFeatureFlagEnabled(FF_KEY_NAVIGATION);
  const setIsShortcutsPanelOpen = useGlobalStore((s) => s.setIsShortcutsPanelOpen);
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElUserMenu(event.currentTarget);

  const keyNameByOs = {
    Mac: 'Option',
    Windows: 'Alt',
    Linux: 'Option',
    Other: 'Option',
  };
  const getKeyNameByOs = () => {
    return keyNameByOs[getOS() ?? 'Other'];
  };

  const handleCloseUserMenu = () => setAnchorElUserMenu(null);

  const handleLogoClick = (event: React.MouseEvent<HTMLElement>) => {
    const isCtrlOrCmd = event.metaKey || event.ctrlKey;

    if (isCtrlOrCmd) {
      // Open dashboard in new tab
      event.preventDefault();
      event.stopPropagation();
      window.open('/', '_blank');
    } else {
      // Normal behavior - open menu
      handleOpenUserMenu(event);
    }
  };

  const menuItems: MenuAction[] = useMemo(() => {
    const items = [
      {
        name: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.MAIN_MENU.BACK_TO_DASHBOARD),
        action: (e: MouseEvent<HTMLElement>) => {
          e.stopPropagation();
          goToDashboard();
        },
      },
      {
        type: 'divider',
      },

      {
        name: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.MAIN_MENU.CREATE_NEW_FILE),
        action: (e: MouseEvent<HTMLElement>) => {
          e.stopPropagation();
          void createRecipe(true);
        },
      },
      {
        name: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.MAIN_MENU.DUPLICATE_FILE),
        action: (e: MouseEvent<HTMLElement>) => {
          e.stopPropagation();
          onDuplicateRecipe(currentRecipeId);
        },
      },
      {
        type: 'divider',
      },
      {
        name: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.MAIN_MENU.SHARE_WORKFLOW),
        action: (e: MouseEvent<HTMLElement>) => {
          e.stopPropagation();
          onShareWorkflow();
        },
      },
      {
        type: 'divider',
      },
    ];
    if (ff_isKeyNavigationEnabled) {
      items.push({
        name: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.MAIN_MENU.KEYBOARD_SHORTCUTS),
        action: (e: MouseEvent<HTMLElement>) => {
          e.stopPropagation();
          setIsShortcutsPanelOpen(true);
        },
      });
    }

    return items as MenuAction[];
  }, [
    t,
    ff_isKeyNavigationEnabled,
    goToDashboard,
    currentUser,
    createRecipe,
    onDuplicateRecipe,
    currentRecipeId,
    onShareWorkflow,
    setIsShortcutsPanelOpen,
  ]);

  const handlePanOnScrollToggle = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (onPanOnScrollChange && panOnScrollEnabled !== undefined) {
      onPanOnScrollChange(!panOnScrollEnabled);
    }
  };

  const handleShowFloatMenuOnRightClickToggle = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (onShowFloatMenuOnRightClickChange && showFloatMenuOnRightClickEnabled !== undefined) {
      onShowFloatMenuOnRightClickChange(!showFloatMenuOnRightClickEnabled);
    }
  };

  const handleRequireAltKeyForSuggestionsToggle = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (onRequireAltKeyForSuggestionsChange && requireAltKeyForSuggestionsEnabled !== undefined) {
      onRequireAltKeyForSuggestionsChange(!requireAltKeyForSuggestionsEnabled);
    }
  };
  return (
    <>
      <FlexCenHorVer
        sx={{ mb: 5, cursor: 'pointer', gap: 0.5 }}
        onClick={handleLogoClick}
        onContextMenu={(e) => {
          e.preventDefault();
          handleLogoClick(e);
        }}
      >
        <img src="/icons/logo.svg" alt="Logo" width={20} />
        <CaretIcon width={8} height={8} />
      </FlexCenHorVer>
      <Menu
        className="app-menu-v2"
        anchorEl={anchorElUserMenu}
        marginThreshold={8}
        keepMounted
        slotProps={{
          root: { sx: { '.MuiList-root': { p: 1 } } },
          paper: {
            sx: { mt: 0.5, width: '240px', borderRadius: 2 },
          },
        }}
        open={Boolean(anchorElUserMenu)}
        onClose={handleCloseUserMenu}
      >
        <Actions items={menuItems} />
        <Box sx={{ mt: 0.25 }}>
          <ParentMenuItem id="preferences" label="Preferences" onClose={handleCloseUserMenu} contextMenuWidth="260px">
            <AppMenuItem onClick={handlePanOnScrollToggle} sx={{ mb: 0.25 }} disableRipple>
              <FlexCenHorVer sx={{ justifyContent: 'space-between', width: '100%' }}>
                <span>{t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.MAIN_MENU.USE_WHEEL_TO_ZOOM)}</span>
                {!panOnScrollEnabled && <CheckMarkIcon />}
              </FlexCenHorVer>
            </AppMenuItem>
            <AppMenuItem onClick={handleShowFloatMenuOnRightClickToggle} sx={{ mb: 0.25 }} disableRipple>
              <FlexCenHorVer sx={{ justifyContent: 'space-between', width: '100%' }}>
                <span>{t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.MAIN_MENU.RIGHT_CLICK_TO_OPEN_MENU)}</span>
                {showFloatMenuOnRightClickEnabled && <CheckMarkIcon />}
              </FlexCenHorVer>
            </AppMenuItem>
            <AppMenuItem onClick={handleRequireAltKeyForSuggestionsToggle} sx={{ mb: 0.25 }} disableRipple>
              <FlexCenHorVer sx={{ justifyContent: 'space-between', width: '100%' }}>
                <span>
                  {t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.MAIN_MENU.REQUIRE_ALT_KEY_FOR_SUGGESTIONS, {
                    key: `${getKeyNameByOs()}`,
                  })}
                </span>
                {requireAltKeyForSuggestionsEnabled && <CheckMarkIcon />}
              </FlexCenHorVer>
            </AppMenuItem>
          </ParentMenuItem>
        </Box>
      </Menu>
    </>
  );
}

export default WorkflowFileMenu;
