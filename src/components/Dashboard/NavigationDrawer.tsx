import { useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Avatar, ButtonBase, Menu } from '@mui/material';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '@/contexts/AuthContext';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { SubscriptionType } from '@/types/shared';
import { FlexCenHorVer, FlexCenVer, FlexCol } from '@/UI/styles';
import { SettingsPageSections } from '@/enums/settings-page-sections.enum';
import { CaretIcon } from '@/UI/Icons/CaretIcon';
import { DiscordLogo } from '@/UI/Icons/DiscordLogo';
import { EXTERNAL_LINKS } from '@/consts/externalLinks.consts';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { PlusIcon } from '@/UI/Icons/PlusIcon';
import { FolderEmptyIcon } from '@/UI/Icons/FolderEmptyIcon';
import { TeamIcon } from '@/UI/Icons/TeamIcon';
import { DashboardSection } from '@/components/Dashboard/enums/shared';
import { UsersIcon } from '@/UI/Icons/UsersIcon';
import { useSubscriptionPermissions } from '@/hooks/useSubscriptionPermissions';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { FileIcon } from '@/UI/Icons/FileIcon';
import { FolderScope } from '@/enums/folder-scope.enum';
import Actions, { MenuAction } from '../Menu/Actions';
import { UserMenu } from './UserMenu/UserMenu';
import { useDashboardFolders } from './useDashboardFolders';
import { CreateFolderModal } from './CreateFolderModal';
import type { User } from '@/types/auth.types';

interface NavigationItem {
  label: string;
  icon: React.ReactElement;
  section: DashboardSection;
  disable?: boolean;
  endIcon?: React.ReactElement;
}

interface NavigationDrawerProps {
  createRecipe: () => Promise<void>;
  drawerWidth: number;
  hasSharedRecipes?: boolean;
  hasWorkspaceFiles?: boolean;
  showWorkspaceFilesSection?: boolean;
  mobileOpen: boolean;
  onSectionChange: (section: string) => void;
  selectedSection: DashboardSection;
  setIsClosing: (isClosing: boolean) => void;
  setMobileOpen: (mobileOpen: boolean) => void;
  user: User;
}

function NavigationDrawer({
  createRecipe,
  drawerWidth,
  hasSharedRecipes = false,
  hasWorkspaceFiles = false,
  showWorkspaceFilesSection = false,
  mobileOpen,
  onSectionChange,
  selectedSection,
  setIsClosing,
  setMobileOpen,
  user,
}: NavigationDrawerProps) {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const nav = useNavigate();
  const [isShowingCreateFolderDialog, setIsShowingCreateFolderDialog] = useState(false);
  const { isActionAllowed } = useSubscriptionPermissions();

  const { currentFolderId, createFolder } = useDashboardFolders();

  const foldersList = useMemo((): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      {
        label: t(I18N_KEYS.NAVIGATION_DRAWER.MY_FILES),
        icon: <img src="/icons/files.svg" alt="files" style={{ width: '20px', height: '20px' }} />,
        section: DashboardSection.RecentRecipes,
        endIcon: <PlusIcon width={12} height={12} />,
      },
      {
        label: t(I18N_KEYS.NAVIGATION_DRAWER.SHARED_WITH_ME),
        icon: <UsersIcon width={20} height={20} />,
        section: DashboardSection.SharedWithMe,
        disable: !hasSharedRecipes,
      },
    ];

    const workspaceItem: NavigationItem | null = showWorkspaceFilesSection
      ? {
          label: t(I18N_KEYS.NAVIGATION_DRAWER.WORKSPACE_FILES),
          icon: <TeamIcon width={20} height={20} />,
          section: DashboardSection.WorkspaceFiles,
          disable: false,
        }
      : null;

    const appsItem: NavigationItem = {
      label: t(I18N_KEYS.NAVIGATION_DRAWER.APPS),
      icon: <img src="/icons/apps.svg" alt="shared-apps" style={{ width: '20px', height: '20px' }} />,
      section: DashboardSection.SharedApps,
    };

    return [...baseItems, ...(workspaceItem ? [workspaceItem] : []), appsItem];
  }, [t, hasSharedRecipes, showWorkspaceFilesSection, hasWorkspaceFiles]);

  const { signOut } = useContext(AuthContext);
  const [anchorElUserMenu, setAnchorElUserMenu] = useState<HTMLElement | null>(null);
  const [anchorElCreateMenu, setAnchorElCreateMenu] = useState<HTMLElement | null>(null);

  const handleListItemClick = (section: string) => onSectionChange(section);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => setIsClosing(false);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorElUserMenu(event.currentTarget);

  const handleCloseUserMenu = () => setAnchorElUserMenu(null);

  const handleOpenCreateMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElCreateMenu(event.currentTarget);

  const handleCloseCreateMenu = () => setAnchorElCreateMenu(null);

  const handleCreateFile = useCallback(() => {
    handleCloseCreateMenu();
    track('created_new_flow', { source: 'dashboard_navigation_drawer' }, TrackTypeEnum.BI);
    void createRecipe();
  }, [createRecipe, handleCloseCreateMenu, track]);

  const handleCreateFolder = useCallback(
    async (folderName: string) => {
      handleCloseCreateMenu();
      track('create_folder_clicked', { source: 'dashboard_navigation_drawer' }, TrackTypeEnum.BI);
      await createFolder(folderName, currentFolderId, FolderScope.PERSONAL);
    },
    [handleCloseCreateMenu, track, createFolder, currentFolderId],
  );

  const signOutUser = useCallback(() => {
    void signOut();
  }, [signOut]);

  const menuItems = useMemo(() => {
    let res: MenuAction[] = [
      {
        type: 'divider' as const,
      },
    ];

    res.push({
      name: t(I18N_KEYS.MAIN_DASHBOARD.USERMENU.MENU_ITEM_SETTINGS),
      icon: <img src="/icons/settings.svg" alt="settings" className="wea-menu-icon" />,
      action: () => nav(`/settings?section=${SettingsPageSections.WORKSPACE_SETTINGS}`),
    });

    if (isActionAllowed([SubscriptionType.Team, SubscriptionType.Enterprise])) {
      res.push({
        name: t(I18N_KEYS.SETTINGS.MENU.MEMBERS),
        icon: <img src="/icons/members.svg" alt="members" className="wea-menu-icon" />,
        action: () => nav(`/settings?section=${SettingsPageSections.TEAM}`),
      });
      res.push({
        type: 'divider' as const,
      });
    }

    res = [
      ...res,
      {
        name: t(I18N_KEYS.SETTINGS.MENU.SIGNOUT),
        icon: <img src="/icons/signout.svg" alt="signout" className="wea-menu-icon" />,
        action: signOutUser,
      },
    ];
    return res;
  }, [nav, signOutUser, t, isActionAllowed]);

  const handleDiscordClick = () => window.open(EXTERNAL_LINKS.discordInvite);

  const folderMenuItems = useMemo(() => {
    return [
      {
        name: t(I18N_KEYS.NAVIGATION_DRAWER.NEW_FILE),
        action: handleCreateFile,
        icon: <FileIcon width={16} height={16} />,
      },
      {
        name: t(I18N_KEYS.NAVIGATION_DRAWER.NEW_FOLDER),
        action: () => setIsShowingCreateFolderDialog(true),
        icon: <FolderEmptyIcon width={16} height={16} />,
      },
    ];
  }, [t, handleCreateFile, setIsShowingCreateFolderDialog]);

  const drawer = (
    <FlexCol sx={{ justifyContent: 'space-between', height: '100%' }}>
      <Box data-testid="dashboard-drawer-upper-container">
        <FlexCenVer data-testid="dashboard-drawer-user" sx={{ height: '56px', px: 1 }}>
          <ButtonBase
            sx={{
              display: 'flex',
              gap: 1,
              py: 1,
              px: 1,
              borderRadius: 1,
              backgroundColor: anchorElUserMenu ? color.Black92 : 'none',
              opacity: !user?.activeWorkspace ? 0.5 : 1,
              cursor: !user?.activeWorkspace ? 'not-allowed' : 'pointer',
            }}
            onClick={handleOpenUserMenu}
            disabled={!user?.activeWorkspace}
          >
            {user.photoURL ? (
              <Avatar alt="user.displayName" src={user.photoURL} sx={{ width: '24px', height: '24px' }} />
            ) : (
              <i className="fa-sharp fa-solid fa-circle-user" style={{ fontSize: '24px' }}></i>
            )}
            <Typography
              variant="body-std-md"
              maxWidth="120px"
              textOverflow="ellipsis"
              overflow="hidden"
              noWrap
              title={user?.displayName ?? ''}
            >
              {user.displayName}
            </Typography>
            <CaretIcon title="caret" />
          </ButtonBase>
        </FlexCenVer>
        <FlexCenHorVer sx={{ width: '100%', p: 1, my: 1, pb: 0 }}>
          <ButtonContained
            fullWidth
            onClick={() => {
              track('created_new_flow', { source: 'dashboard_navigation_drawer' }, TrackTypeEnum.BI);
              void createRecipe();
            }}
            startIcon={<PlusIcon width={16} height={16} />}
          >
            {t(I18N_KEYS.NAVIGATION_DRAWER.CREATE_NEW_FILE)}
          </ButtonContained>
        </FlexCenHorVer>
        <Box sx={{ p: 1 }}>
          <List sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {foldersList.map((item) => (
              <ListItem
                key={item.label}
                disablePadding
                sx={{ background: item.section === selectedSection ? color.Black92 : '' }}
              >
                <ListItemButton
                  sx={{ height: '40px' }}
                  onClick={() => handleListItemClick(item.section)}
                  disabled={item.disable}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontWeight: item.section === selectedSection ? 500 : 400,
                      },
                    }}
                  />
                  {item.endIcon && (
                    <Box
                      onClick={(event: React.MouseEvent<HTMLElement>) => handleOpenCreateMenu(event)}
                      sx={{
                        p: 1,
                        pr: 0,
                      }}
                    >
                      {item.endIcon}
                    </Box>
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {/* TODO: Uncomment when we want to return the community models */}
          {/*<Typography component="div" variant="label-sm-rg" sx={{ pt: 3, pb: 0.5, px: 2, opacity: 0.64 }}>*/}
          {/*  {t(I18N_KEYS.NAVIGATION_DRAWER.MODELS_SECTION)}*/}
          {/*</Typography>*/}
          {/*<List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>*/}
          {/*  {modelsList.map((item) => (*/}
          {/*    <ListItem*/}
          {/*      key={item.label}*/}
          {/*      disablePadding*/}
          {/*      sx={{ background: item.section === selectedSection ? color.Black92 : '' }}*/}
          {/*    >*/}
          {/*      <ListItemButton sx={{ height: '40px' }} onClick={() => handleListItemClick(item.section)}>*/}
          {/*        <ListItemIcon>{item.icon}</ListItemIcon>*/}
          {/*        <ListItemText*/}
          {/*          primary={item.label}*/}
          {/*          sx={{*/}
          {/*            '& .MuiListItemText-primary': {*/}
          {/*              fontWeight: item.section === selectedSection ? 500 : 400,*/}
          {/*            },*/}
          {/*          }}*/}
          {/*        />*/}
          {/*      </ListItemButton>*/}
          {/*    </ListItem>*/}
          {/*  ))}*/}
          {/*</List>*/}
        </Box>
      </Box>
      <Box data-testid="dashboard-drawer-bottom-container" sx={{ p: 1 }}>
        <List>
          <ListItem sx={{ p: 0 }} data-testid="discord-link-container">
            <ListItemButton onClick={handleDiscordClick}>
              <ListItemIcon>
                <DiscordLogo width={20} height={20} title="discord" />
              </ListItemIcon>
              <ListItemText primary={t(I18N_KEYS.NAVIGATION_DRAWER.DISCORD_CTA)} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </FlexCol>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="dashboard navigation"
      id="dashboard-drawer-wrapper"
    >
      {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onTransitionEnd={handleDrawerTransitionEnd}
        onClose={handleDrawerClose}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, mt: '64px' },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
      <UserMenu anchorEl={anchorElUserMenu} onClose={handleCloseUserMenu} settings={menuItems} />
      <Menu
        anchorEl={anchorElCreateMenu}
        open={Boolean(anchorElCreateMenu)}
        onClose={handleCloseCreateMenu}
        anchorReference="anchorPosition"
        anchorPosition={{
          top: anchorElCreateMenu ? anchorElCreateMenu.getBoundingClientRect().bottom - 10 : 0,
          left: anchorElCreateMenu ? anchorElCreateMenu.getBoundingClientRect().right - 30 : 0,
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            sx: {
              width: '200px',
              background: color.Black92,
              border: `1px solid ${color.White04_T}`,
              borderRadius: 2,
              px: 1,
            },
          },
        }}
      >
        <Actions items={folderMenuItems} setAnchorEl={handleCloseCreateMenu} />
      </Menu>

      <CreateFolderModal
        open={isShowingCreateFolderDialog}
        onClose={() => setIsShowingCreateFolderDialog(false)}
        onConfirm={handleCreateFolder}
      />
    </Box>
  );
}

export default NavigationDrawer;
