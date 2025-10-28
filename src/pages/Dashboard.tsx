import { useCallback, useEffect, useMemo, useState } from 'react';
import { Grid2 } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import NavigationDrawer from '@/components/Dashboard/NavigationDrawer';
import { DashboardMain } from '@/components/Dashboard/DashboardMain';
import { MyModels } from '@/components/Dashboard/MyModels';
import { CommunityModels } from '@/components/Dashboard/CommunityModels';
import { I18N_KEYS } from '@/language/keys';
import { DashboardHeader } from '@/components/DashboardHeader/DashboardHeader';
import { useDashboardFolders } from '@/components/Dashboard/useDashboardFolders';
import { useWorkspaceFolders } from '@/components/Dashboard/useWorkspaceFolders';
import { Loader } from '@/components/Dashboard/Loader';
import { FlexCol } from '@/UI/styles';
import { SubscriptionType } from '@/types/shared';
import { DashboardSection } from '@/components/Dashboard/enums/shared';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { ReloadAlert } from '@/UI/ReloadAlert/ReloadAlert';
import type { User } from '@/types/auth.types';

const DRAWER_WIDTH = 240;

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const { folderId } = useParams<{ folderId?: string }>();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [, setIsClosing] = useState(false);

  const {
    recipes,
    folders,
    sharedApps,
    sharedWithCurrentUser,
    showCaseRecipes,
    loaded: foldersLoaded,
    createRecipe,
    navigateToFolder,
    currentFolderId,
  } = useDashboardFolders();

  const {
    recipes: workspaceRecipes,
    folders: workspaceFolders,
    loaded: workspaceFoldersLoaded,
    navigateToFolder: navigateToWorkspaceFolder,
    currentFolderId: currentWorkspaceFolderId,
  } = useWorkspaceFolders();

  const [currentSelection, setCurrentSelection] = useState(() => {
    const storedSelection = localStorage.getItem('dashboardCurrentSelection');
    if (!storedSelection || ['myModels', 'communityModels'].includes(storedSelection)) {
      return 'recentRecipes';
    }

    return storedSelection;
  });

  useEffect(() => {
    localStorage.setItem('dashboardCurrentSelection', currentSelection);
  }, [currentSelection]);

  // Handle folder navigation from URL
  useEffect(() => {
    if (folderId) {
      // Determine which context we're in based on current selection
      if (currentSelection === DashboardSection.WorkspaceFiles) {
        // We're in workspace context
        if (folderId !== currentWorkspaceFolderId) {
          void navigateToWorkspaceFolder(folderId);
        }
      } else if (currentSelection === DashboardSection.RecentRecipes) {
        // We're in personal files context
        if (folderId !== currentFolderId) {
          void navigateToFolder(folderId);
        }
      } else {
        // For initial load, try to determine from both stores
        const isInWorkspaceFolders = workspaceFolders.some((f) => f.id === folderId);
        const isInPersonalFolders = folders.some((f) => f.id === folderId);

        if (isInWorkspaceFolders) {
          void navigateToWorkspaceFolder(folderId);
          setCurrentSelection(DashboardSection.WorkspaceFiles);
        } else if (isInPersonalFolders) {
          void navigateToFolder(folderId);
          setCurrentSelection(DashboardSection.RecentRecipes);
        }
      }
    } else {
      // No folder ID - navigate to root
      if (currentFolderId) {
        void navigateToFolder(null);
      }
      if (currentWorkspaceFolderId) {
        void navigateToWorkspaceFolder(null);
      }
    }
  }, [
    folderId,
    currentFolderId,
    currentWorkspaceFolderId,
    navigateToFolder,
    navigateToWorkspaceFolder,
    workspaceFolders,
    folders,
    currentSelection,
  ]);

  // Wrapped navigation function that updates URL
  const handleFolderNavigate = useCallback(
    (targetFolderId?: string | null) => {
      if (targetFolderId) {
        navigate(`/folders/${targetFolderId}`);
      } else {
        navigate('/');
        setCurrentSelection(DashboardSection.RecentRecipes);
      }
    },
    [navigate],
  );

  // Workspace folder navigation
  const handleWorkspaceFolderNavigate = useCallback(
    (targetFolderId?: string | null) => {
      if (targetFolderId) {
        navigate(`/folders/${targetFolderId}`);
        setCurrentSelection(DashboardSection.WorkspaceFiles);
      } else {
        // Navigate to workspace files section
        navigate('/');
        setCurrentSelection(DashboardSection.WorkspaceFiles);
      }
    },
    [navigate],
  );

  const handleCreateRecipe = useCallback(() => {
    track('created_new_flow', { source: 'dashboard' }, TrackTypeEnum.BI);
    return createRecipe();
  }, [createRecipe, track]);

  const hasTeamOrEnterpriseSubscription = useMemo(() => {
    return (
      user.activeWorkspace.subscription.type === SubscriptionType.Team ||
      user.activeWorkspace.subscription.type === SubscriptionType.Enterprise
    );
  }, [user.activeWorkspace.subscription.type]);

  const handleSectionSelectionChange = useCallback(
    (selection: string) => {
      setCurrentSelection(selection);
      // Clear the folder ID from URL when changing sections
      navigate('/');

      // Also clear the folder navigation state
      if (currentFolderId) {
        void navigateToFolder(null);
      }
      if (currentWorkspaceFolderId) {
        void navigateToWorkspaceFolder(null);
      }
    },
    [navigate, currentFolderId, currentWorkspaceFolderId, navigateToFolder, navigateToWorkspaceFolder],
  );

  const dashboardSections = useMemo(
    () => ({
      [DashboardSection.RecentRecipes]: (
        <DashboardMain
          recipes={recipes}
          folders={folders}
          title={t(I18N_KEYS.DASHBOARD.PAGES.FILES.TITLE)}
          showCase={showCaseRecipes}
          section={DashboardSection.RecentRecipes}
          showChangeNameButton={hasTeamOrEnterpriseSubscription}
          onFolderNavigate={handleFolderNavigate}
        />
      ),
      [DashboardSection.MyModels]: <MyModels />,
      [DashboardSection.CommunityModels]: <CommunityModels />,
      [DashboardSection.SharedWithMe]: (
        <DashboardMain
          recipes={sharedWithCurrentUser}
          title={t(I18N_KEYS.DASHBOARD.PAGES.SHARED_WITH_ME.TITLE)}
          showCase={showCaseRecipes}
          section={DashboardSection.SharedWithMe}
          onSectionChange={handleSectionSelectionChange}
        />
      ),
      [DashboardSection.WorkspaceFiles]: (
        <DashboardMain
          recipes={workspaceRecipes}
          folders={workspaceFolders}
          title={t(I18N_KEYS.DASHBOARD.PAGES.WORKSPACE_FILES.TITLE)}
          showCase={showCaseRecipes}
          section={DashboardSection.WorkspaceFiles}
          onSectionChange={handleSectionSelectionChange}
          onFolderNavigate={handleWorkspaceFolderNavigate}
          currentFolderId={currentWorkspaceFolderId}
        />
      ),
      [DashboardSection.SharedApps]: (
        <DashboardMain
          recipes={sharedApps}
          title={t(I18N_KEYS.DASHBOARD.PAGES.SHARED_APPS.TITLE)}
          showCase={showCaseRecipes}
          section={DashboardSection.SharedApps}
          onFolderNavigate={() => {}}
        />
      ),
    }),
    [
      recipes,
      folders,
      sharedApps,
      showCaseRecipes,
      t,
      workspaceRecipes,
      workspaceFolders,
      sharedWithCurrentUser,
      handleFolderNavigate,
      handleWorkspaceFolderNavigate,
      hasTeamOrEnterpriseSubscription,
      handleSectionSelectionChange,
    ],
  );

  return (
    <>
      <Grid2 container sx={{ position: 'relative', height: '100%' }}>
        <Grid2 size="auto">
          <NavigationDrawer
            createRecipe={handleCreateRecipe}
            hasSharedRecipes={sharedWithCurrentUser.length > 0}
            hasWorkspaceFiles={workspaceRecipes.length > 0 || workspaceFolders.length > 0}
            showWorkspaceFilesSection={hasTeamOrEnterpriseSubscription}
            drawerWidth={DRAWER_WIDTH}
            mobileOpen={mobileOpen}
            onSectionChange={handleSectionSelectionChange}
            selectedSection={currentSelection as DashboardSection}
            setIsClosing={setIsClosing}
            setMobileOpen={setMobileOpen}
            user={user}
          />
        </Grid2>

        <Grid2 size="grow">
          <FlexCol sx={{ height: '100%' }}>
            <FlexCol sx={{ pt: '32px', px: 8, gap: '32px', height: '100%' }}>
              <DashboardHeader
                createRecipe={handleCreateRecipe}
                isShowCreateRecipeButton={currentSelection === 'recentRecipes'}
              />
              {dashboardSections[currentSelection]}
            </FlexCol>
          </FlexCol>
        </Grid2>
      </Grid2>
      {foldersLoaded && (currentSelection !== DashboardSection.WorkspaceFiles || workspaceFoldersLoaded) ? null : (
        <Loader offset={DRAWER_WIDTH} />
      )}
      <ReloadAlert />
    </>
  );
}
