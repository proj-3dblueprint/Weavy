import { useState, useEffect, useCallback, useMemo } from 'react';
import { IconButton, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { RecipeType } from '@/enums/recipe-type.enum';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';
import { FolderScope } from '@/enums/folder-scope.enum';
import { getAxiosInstance } from '@/services/axiosConfig';
import { log } from '@/logger/logger';
import { FlexCenVer, FlexCol, FlexColCenHorVer } from '@/UI/styles';
import { Input } from '@/UI/Input/Input';
import { AppContextMenu } from '@/UI/AppContextMenu/AppContextMenu';
import { SearchIcon } from '@/UI/Icons/SearchIcon';
import { SmileyXEyes } from '@/UI/Icons/SmileyXEyes';
import { YarnIcon } from '@/UI/Icons/YarnIcon';
import { AppWindowIcon } from '@/UI/Icons/AppWindowIcon';
import { FolderEmptyIcon } from '@/UI/Icons/FolderEmptyIcon';
import { EXTERNAL_LINKS } from '@/consts/externalLinks.consts';
import { DashboardSection } from '@/components/Dashboard/enums/shared';
import { useGlobalStore } from '@/state/global.state';
import { useFoldersStore } from '@/state/folders.state';
import { useUserStore } from '@/state/user.state';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { FileIcon } from '@/UI/Icons/FileIcon';
import { CheckMarkCircleIcon } from '@/UI/Icons';
import ConfirmationDialogV2 from '../Common/ConfirmationDialogV2';
import { MenuAction } from '../Menu/Actions';
import { ErrorDisplay } from '../Common/Error/ErrorDisplay';
import { EmptyState } from '../Common/EmptyState/EmptyState';
import DashboardListView from './DashboardListView';
import EducationGallery from './EducationGallery';
import { useDashboardRecipes } from './useDashboardRecipes';
import { DashboardCardView } from './DashboardCardView';
import ChangeOwnerModal from './ChangeOwner/ChangeOwnerModal';
import { CreateFolderModal } from './CreateFolderModal';
import { MoveModal } from './MoveModal';
import { Breadcrumbs } from './Breadcrumbs';
import type { DashboardRecipe } from '@/state/dashboardRecipes.state';
import type { FolderResponseDto } from '@/types/folder.types';

const axiosInstance = getAxiosInstance();

interface DashboardMainProps {
  recipes: DashboardRecipe[];
  folders?: FolderResponseDto[];
  title: string;
  showCase: DashboardRecipe[];
  section: DashboardSection;
  onSectionChange?: (section: DashboardSection) => void;
  onFolderNavigate?: (folderId?: string | null) => void;
  showChangeNameButton?: boolean;
  currentFolderId?: string | null;
}

export function DashboardMain({
  recipes,
  title,
  showCase,
  section,
  onSectionChange,
  onFolderNavigate,
  showChangeNameButton = false,
  currentFolderId: propCurrentFolderId,
}: DashboardMainProps) {
  const { updateSnackbarData } = useGlobalStore();
  const { track } = useAnalytics();
  const [isListView, setIsListView] = useState<boolean>(() => {
    const saved = localStorage.getItem('isListView');
    return saved !== null ? saved === 'true' : false;
  });

  const [editingRecipe, setEditingRecipe] = useState<{ id: string | null; name: string }>({ id: null, name: '' });
  const [oldRecipeName, setOldRecipeName] = useState<{ id: string | null; name: string }>({ id: null, name: '' });
  const [editingFolder, setEditingFolder] = useState<{ id: string | null; name: string }>({ id: null, name: '' });
  const [oldFolderName, setOldFolderName] = useState<{ id: string | null; name: string }>({ id: null, name: '' });
  const [isShowingDeleteDialog, setIsShowingDeleteDialog] = useState<{
    show: boolean;
    id: string | null;
    isFolder: boolean;
  }>({
    show: false,
    id: null,
    isFolder: false,
  });
  const [isShowingChangeOwnerDialog, setIsShowingChangeOwnerDialog] = useState<{ show: boolean; id: string | null }>({
    show: false,
    id: null,
  });
  const [isShowingCreateFolderDialog, setIsShowingCreateFolderDialog] = useState(false);
  const [showingMoveDialog, setShowingMoveDialog] = useState<{
    show: boolean;
    id: string | null;
    isFolder: boolean;
    name: string;
  }>({
    show: false,
    id: null,
    isFolder: false,
    name: '',
  });
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number | null;
    mouseY: number | null;
    isOpen: boolean;
    recipeId: string | null;
    isFolder: boolean;
  }>({ mouseX: null, mouseY: null, isOpen: false, recipeId: null, isFolder: false });
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  const currentUser = useUserStore((state) => state.user);
  const {
    createRecipe,
    duplicateRecipe,
    deleteRecipe,
    renameRecipe,
    cancelRenameRecipe,
    goToRecipe,
    caughtError: error,
    reload,
  } = useDashboardRecipes();
  const isSharedApps = section === DashboardSection.SharedApps;
  const isWorkspaceFiles = section === DashboardSection.WorkspaceFiles;
  const isSharedWithMe = section === DashboardSection.SharedWithMe;

  // Get store state based on section
  const personalState = useFoldersStore((state) => state.personal);
  const workspaceState = useFoldersStore((state) => state.workspace);
  const { createFolder, getFolderContents } = useFoldersStore();

  // Use appropriate state based on section
  const currentState = isWorkspaceFiles ? workspaceState : personalState;
  const currentFolderId = propCurrentFolderId !== undefined ? propCurrentFolderId : currentState.currentFolderId;
  const folderPath = currentState.folderPath;
  const foldersRecipes = currentState.recipes;
  // Get ALL folders from the store, but not for SharedWithMe or SharedApps sections
  const allFolders = isSharedWithMe || isSharedApps ? [] : currentState.folders;

  useEffect(() => {
    localStorage.setItem('isListView', isListView.toString());
  }, [isListView]);

  // Clear search term when section changes
  useEffect(() => {
    setSearchTerm('');
  }, [section]);

  // Handle drag and drop move - same as handleMove with optimistic updates
  const handleDragAndDropMove = useCallback(
    async (itemId: string, itemType: 'file' | 'folder', targetFolderId: string) => {
      const targetScope = isWorkspaceFiles ? FolderScope.WORKSPACE : FolderScope.PERSONAL;
      const scopeKey = targetScope === FolderScope.PERSONAL ? 'personal' : 'workspace';

      if (itemType === 'file') {
        // Find the recipe being moved
        const movedRecipe = recipes.find((r) => r.id === itemId);
        if (!movedRecipe) return;

        // Optimistically update the store state
        const originalRecipes = currentState.recipes;
        const originalFolders = currentState.folders;

        // Update recipes: remove from current location
        const updatedRecipes = currentState.recipes.filter((r) => r.id !== itemId);

        // If we're moving within the same scope, update the recipes to reflect the move
        // but don't trigger folder re-renders to maintain order
        if (targetScope === (isWorkspaceFiles ? FolderScope.WORKSPACE : FolderScope.PERSONAL)) {
          // Create a new recipe object with updated folderId
          const movedRecipeWithNewFolder = { ...movedRecipe, folderId: targetFolderId };

          // For the target folder's view, we need to update the global recipes state
          // to include this recipe with the new folderId
          useFoldersStore.setState((state) => {
            // Get all recipes from all folders
            const allScopeRecipes = [...state[scopeKey].recipes];

            // Remove the old recipe and add it with new folderId
            const recipesWithoutMoved = allScopeRecipes.filter((r) => r.id !== itemId);
            const recipesWithMoved = [...recipesWithoutMoved, movedRecipeWithNewFolder];

            return {
              [scopeKey]: {
                ...state[scopeKey],
                recipes: recipesWithMoved,
                // Don't update folders array to prevent re-ordering
              },
            };
          });
        } else {
          // Moving to a different scope - just remove from current scope
          useFoldersStore.setState((state) => ({
            [scopeKey]: {
              ...state[scopeKey],
              recipes: updatedRecipes,
              // Don't update folders array to prevent re-ordering
            },
          }));
        }

        try {
          // Move recipe using POST /v1/recipes/:id/move (same as menu move)
          await axiosInstance.post(`/v1/recipes/${itemId}/move`, {
            folderId: targetFolderId,
            scope: targetScope,
          });

          // If moving to a different scope, we need to refresh both scopes
          if (targetScope !== (isWorkspaceFiles ? FolderScope.WORKSPACE : FolderScope.PERSONAL)) {
            // Refresh both scopes when moving between them
            await getFolderContents(currentFolderId, FolderScope.PERSONAL);
            await getFolderContents(currentFolderId, FolderScope.WORKSPACE);
          }
        } catch (error: any) {
          // Revert optimistic update on error
          useFoldersStore.setState((state) => ({
            [scopeKey]: {
              ...state[scopeKey],
              recipes: originalRecipes,
              folders: originalFolders,
            },
          }));

          const errorMessage = error?.response?.data?.message || `Failed to move ${itemType}`;
          updateSnackbarData({
            text: `${t(I18N_KEYS.MAIN_DASHBOARD.MOVE_MODAL.ERROR_PREFIX)} ${errorMessage}`,
            isOpen: true,
            icon: null,
            severity: 'error',
          });
        }
      } else {
        // Handle folder moves with optimistic updates
        const movedFolder = allFolders?.find((f) => f.id === itemId);
        if (!movedFolder) return;

        // Don't allow moving a folder into its own descendant
        const isDescendant = (parentId: string | null | undefined, childId: string): boolean => {
          if (!parentId) return false;
          if (parentId === childId) return true;
          const parent = allFolders?.find((f) => f.id === parentId);
          return parent ? isDescendant(parent.parentId, childId) : false;
        };

        if (isDescendant(targetFolderId, itemId)) {
          updateSnackbarData({
            text: 'Cannot move a folder into its own subfolder',
            isOpen: true,
            icon: null,
          });
          return;
        }

        // Store original state for rollback
        const originalFolders = currentState.folders;

        // Optimistically update folders
        useFoldersStore.setState((state) => {
          const updatedFolders = state[scopeKey].folders.map((f) =>
            f.id === itemId ? { ...f, parentId: targetFolderId } : f,
          );

          return {
            [scopeKey]: {
              ...state[scopeKey],
              folders: updatedFolders,
            },
          };
        });

        try {
          await axiosInstance.patch(`/v1/folders/${itemId}`, {
            parentId: targetFolderId,
            scope: targetScope,
          });

          // If moving between scopes, refresh both
          if (targetScope !== (isWorkspaceFiles ? FolderScope.WORKSPACE : FolderScope.PERSONAL)) {
            await getFolderContents(currentFolderId, FolderScope.PERSONAL);
            await getFolderContents(currentFolderId, FolderScope.WORKSPACE);
          }
        } catch (error: any) {
          // Revert on error
          useFoldersStore.setState((state) => ({
            [scopeKey]: {
              ...state[scopeKey],
              folders: originalFolders,
            },
          }));

          const errorMessage = error?.response?.data?.message || `Failed to move ${itemType}`;
          updateSnackbarData({
            text: `${t(I18N_KEYS.MAIN_DASHBOARD.MOVE_MODAL.ERROR_PREFIX)} ${errorMessage}`,
            isOpen: true,
            icon: null,
            severity: 'error',
          });
        }
      }
    },
    [isWorkspaceFiles, recipes, updateSnackbarData, t, currentFolderId, getFolderContents, currentState, allFolders],
  );

  const handleSearchChange = (evt: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(evt.target.value);

  // Helper function to get all descendant folder IDs recursively
  const getAllDescendantFolderIds = (folderId: string | null, allFolders: FolderResponseDto[]): string[] => {
    const childFolders = allFolders.filter((folder) => folder.parentId === folderId);
    let descendants: string[] = [];

    for (const child of childFolders) {
      descendants.push(child.id);
      descendants = descendants.concat(getAllDescendantFolderIds(child.id, allFolders));
    }

    return descendants;
  };

  // Helper function to search in nested folders
  const searchInNestedFolders = (allFolders: FolderResponseDto[], searchTerm: string): FolderResponseDto[] => {
    if (!searchTerm) {
      // No search - only show folders directly in current directory
      return allFolders.filter((folder) => folder.parentId === currentFolderId);
    }

    // With search - get all folder IDs that are descendants of current folder (including current folder)
    const folderIdsInScope = currentFolderId
      ? [currentFolderId, ...getAllDescendantFolderIds(currentFolderId, allFolders)]
      : [null, ...getAllDescendantFolderIds(null, allFolders)];

    // Show matching folders whose parentId is in scope (i.e., they are within the current folder tree)
    return allFolders.filter(
      (folder) =>
        folderIdsInScope.includes(folder.parentId || null) &&
        folder.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  // Helper function to count files in a folder (including subfolders)
  const countFilesInFolder = (
    folderId: string,
    allFolders: FolderResponseDto[],
    allRecipes: DashboardRecipe[],
  ): number => {
    // Count direct files in this folder
    let count = allRecipes.filter((recipe) => recipe.folderId === folderId).length;

    // Count files in subfolders
    const subfolders = allFolders.filter((folder) => folder.parentId === folderId);
    for (const subfolder of subfolders) {
      count += countFilesInFolder(subfolder.id, allFolders, allRecipes);
    }

    return count;
  };

  // Filter recipes by current folder and search term
  const filteredRecipes = recipes?.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (searchTerm) {
      // When searching, include recipes from current folder AND all nested subfolders
      if (currentFolderId) {
        const descendantIds = getAllDescendantFolderIds(currentFolderId, allFolders);
        const folderIdsInScope = [currentFolderId, ...descendantIds];
        return recipe.folderId && folderIdsInScope.includes(recipe.folderId) && matchesSearch;
      } else {
        // At root with search - search in all recipes
        const allFolderIds = getAllDescendantFolderIds(null, allFolders);
        const folderIdsInScope = [null, ...allFolderIds];
        return (folderIdsInScope.includes(recipe.folderId) || !recipe.folderId) && matchesSearch;
      }
    } else {
      // No search - only show recipes directly in current folder/location
      if (currentFolderId) {
        return recipe.folderId === currentFolderId;
      } else {
        return !recipe.folderId;
      }
    }
  });
  const filteredFolders = isSharedWithMe || isSharedApps ? [] : searchInNestedFolders(allFolders || [], searchTerm);

  const handleContextMenu = (evt: React.MouseEvent<HTMLDivElement>, id: string, itemType?: 'folder' | 'recipe') => {
    evt.preventDefault();
    evt.stopPropagation();

    // Don't show context menu in Shared with Me section unless it's for a specific recipe
    if (isSharedWithMe && !id) {
      return;
    }

    // Use the provided itemType if available, otherwise check if this ID belongs to a folder
    const isFolder = itemType === 'folder' || (!itemType && (allFolders?.some((folder) => folder.id === id) || false));

    const newContextMenu = {
      mouseX: evt.clientX - 2,
      mouseY: evt.clientY - 4,
      isOpen: true,
      recipeId: id,
      isFolder,
    };

    setContextMenu(newContextMenu);
  };

  const handleGeneralContextMenu = (evt: React.MouseEvent<HTMLDivElement>) => {
    evt.preventDefault();
    setContextMenu({
      mouseX: evt.clientX - 2,
      mouseY: evt.clientY - 4,
      isOpen: true,
      recipeId: null,
      isFolder: false,
    });
  };

  const handleContextMenuClose = useCallback(() => {
    setContextMenu({ mouseX: null, mouseY: null, isOpen: false, recipeId: null, isFolder: false });
  }, []);

  const handleDuplicateRecipe = async (id: string) => {
    await duplicateRecipe(id);
    // Refresh folder contents to show the duplicated recipe
    await getFolderContents(currentFolderId, isWorkspaceFiles ? FolderScope.WORKSPACE : FolderScope.PERSONAL);
  };

  const enableRecipeNameEdit = (id: string) => {
    const recipeToRename = recipes?.filter((rcp) => rcp.id === id);
    if (recipeToRename.length) {
      setEditingRecipe({ id, name: recipeToRename[0].name || '' });
      setOldRecipeName({ id, name: recipeToRename[0].name });
    }
  };

  const enableFolderNameEdit = (id: string) => {
    const folderToRename = allFolders?.find((folder) => folder.id === id);
    if (folderToRename) {
      setEditingFolder({ id, name: folderToRename.name || '' });
      setOldFolderName({ id, name: folderToRename.name });
    }
  };

  const handleEditingRecipe = (id: string, name: string) => setEditingRecipe({ id, name });
  const handleEditingFolder = (id: string, name: string) => setEditingFolder({ id, name });

  const handleRenameRecipe = useCallback(
    async (id: string, newName: string) => {
      setEditingRecipe({ id: null, name: '' });

      // Check if the recipe is in a folder (from folders state)
      const folderRecipe = foldersRecipes?.find((r) => r.id === id);

      if (folderRecipe) {
        // Recipe is in a folder, use direct API call to preserve folderId
        try {
          await axiosInstance.put(`/v1/recipes/${id}`, { ...folderRecipe, name: newName });
          // Update the local state optimistically
          const scopeKey = isWorkspaceFiles ? 'workspace' : 'personal';
          useFoldersStore.setState((state) => ({
            [scopeKey]: {
              ...state[scopeKey],
              recipes: state[scopeKey].recipes.map((recipe) =>
                recipe.id === id ? { ...recipe, name: newName } : recipe,
              ),
            },
          }));
        } catch (error) {
          log.error('error renaming recipe in folder: ', error);
          // On error, refresh from server
          await getFolderContents(currentFolderId, isWorkspaceFiles ? FolderScope.WORKSPACE : FolderScope.PERSONAL);
        }
      } else {
        // Recipe is not in a folder, use the regular rename function
        await renameRecipe(id, newName);
      }
    },
    [renameRecipe, getFolderContents, foldersRecipes],
  );

  const handleRenameFolder = useCallback(
    async (id: string, newName: string) => {
      setEditingFolder({ id: null, name: '' });

      // Update the local state optimistically FIRST
      const scopeKey = isWorkspaceFiles ? 'workspace' : 'personal';
      useFoldersStore.setState((state) => ({
        [scopeKey]: {
          ...state[scopeKey],
          folders: state[scopeKey].folders.map((folder) => (folder.id === id ? { ...folder, name: newName } : folder)),
        },
      }));

      try {
        await axiosInstance.patch(`/v1/folders/${id}`, {
          name: newName,
        });
      } catch (error) {
        log.error('error renaming folder: ', error);
        // On error, revert the optimistic update by refreshing from server
        await getFolderContents(currentFolderId, isWorkspaceFiles ? FolderScope.WORKSPACE : FolderScope.PERSONAL);
        updateSnackbarData({
          text: t(I18N_KEYS.MAIN_DASHBOARD.RENAME_FOLDER_ERROR),
          isOpen: true,
          icon: null,
          severity: 'error',
        });
      }
    },
    [getFolderContents, updateSnackbarData, t],
  );

  const handleCancelRenameRecipe = useCallback(
    (id: string) => {
      cancelRenameRecipe(id, oldRecipeName.name);
      setEditingRecipe({ id: null, name: '' });
    },
    [cancelRenameRecipe, oldRecipeName],
  );

  const handleCancelRenameFolder = useCallback(
    (id: string) => {
      setEditingFolder({ id: null, name: '' });
      // Reset folder name in local state
      const scopeKey = isWorkspaceFiles ? 'workspace' : 'personal';
      useFoldersStore.setState((state) => ({
        [scopeKey]: {
          ...state[scopeKey],
          folders: state[scopeKey].folders.map((folder) =>
            folder.id === id ? { ...folder, name: oldFolderName.name } : folder,
          ),
        },
      }));
    },
    [oldFolderName],
  );

  const onDeleteRecipe = (id: string | null) => setIsShowingDeleteDialog({ show: true, id, isFolder: false });
  const onDeleteFolder = (id: string | null) => setIsShowingDeleteDialog({ show: true, id, isFolder: true });

  const handleDeleteDialogClose = () => setIsShowingDeleteDialog({ show: false, id: null, isFolder: false });

  const handleConfirmDelete = async () => {
    if (isShowingDeleteDialog.isFolder) {
      // Delete folder
      try {
        await axiosInstance.delete(`/v1/folders/${isShowingDeleteDialog.id}`);
        updateSnackbarData({
          text: t(I18N_KEYS.MAIN_DASHBOARD.DELETE_FOLDER_SUCCESS),
          isOpen: true,
          icon: <CheckMarkCircleIcon height={20} width={20} />,
        });
        // Refresh folder contents to reflect the deletion
        await getFolderContents(currentFolderId, isWorkspaceFiles ? FolderScope.WORKSPACE : FolderScope.PERSONAL);
      } catch (error) {
        log.error('error deleting folder: ', error);
        updateSnackbarData({
          text: t(I18N_KEYS.MAIN_DASHBOARD.DELETE_FOLDER_ERROR),
          isOpen: true,
          icon: null,
          severity: 'error',
        });
      }
    } else {
      // Delete recipe
      await deleteRecipe(isShowingDeleteDialog.id, isSharedApps ? RecipeType.DesignApp : RecipeType.File);
      // Refresh folder contents to reflect the deletion
      await getFolderContents(currentFolderId, isWorkspaceFiles ? FolderScope.WORKSPACE : FolderScope.PERSONAL);
    }
    setIsShowingDeleteDialog({ show: false, id: null, isFolder: false });
  };

  const handleCreateFolder = async (folderName: string) => {
    try {
      await createFolder(folderName, currentFolderId, isWorkspaceFiles ? FolderScope.WORKSPACE : FolderScope.PERSONAL);
      setIsShowingCreateFolderDialog(false);
      updateSnackbarData({
        text: t(I18N_KEYS.MAIN_DASHBOARD.CREATE_FOLDER_MODAL.SUCCESS),
        isOpen: true,
        icon: <CheckMarkCircleIcon height={20} width={20} />,
      });
      track('create_folder_clicked', { source: 'dashboard_main_context_menu' }, TrackTypeEnum.BI);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to create folder';
      updateSnackbarData({
        text: `${t(I18N_KEYS.MAIN_DASHBOARD.CREATE_FOLDER_MODAL.ERROR_PREFIX)} ${errorMessage}`,
        isOpen: true,
        icon: null,
        severity: 'error',
      });
    }
  };

  const handleGoToMyFiles = () => {
    onSectionChange?.(DashboardSection.RecentRecipes);
  };

  const handleMove = async (targetFolderId: string | null, targetScope: FolderScope) => {
    try {
      const sourceScope = isWorkspaceFiles ? FolderScope.WORKSPACE : FolderScope.PERSONAL;

      if (showingMoveDialog.isFolder) {
        // Move folder using PATCH /v1/folders/:id
        await axiosInstance.patch(`/v1/folders/${showingMoveDialog.id}`, {
          parentId: targetFolderId,
          scope: targetScope,
        });
        updateSnackbarData({
          text: t(I18N_KEYS.MAIN_DASHBOARD.MOVE_MODAL.SUCCESS_FOLDER),
          isOpen: true,
          icon: <CheckMarkCircleIcon height={20} width={20} />,
        });
      } else {
        // Move recipe using POST /v1/recipes/:id/move
        await axiosInstance.post(`/v1/recipes/${showingMoveDialog.id}/move`, {
          folderId: targetFolderId,
          scope: targetScope,
        });
        updateSnackbarData({
          text: t(I18N_KEYS.MAIN_DASHBOARD.MOVE_MODAL.SUCCESS_FILE),
          isOpen: true,
          icon: <CheckMarkCircleIcon height={20} width={20} />,
        });
      }

      // Close modal first
      setShowingMoveDialog({ show: false, id: null, isFolder: false, name: '' });

      // Refresh the folder contents to show the updated state
      // If moving between scopes, refresh both
      if (sourceScope !== targetScope) {
        // Refresh both source and target scopes
        await getFolderContents(currentFolderId, sourceScope);
        await getFolderContents(null, targetScope);
      } else {
        // Same scope, just refresh current
        await getFolderContents(currentFolderId, sourceScope);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to move item';
      updateSnackbarData({
        text: `${t(I18N_KEYS.MAIN_DASHBOARD.MOVE_MODAL.ERROR_PREFIX)} ${errorMessage}`,
        isOpen: true,
        icon: null,
        severity: 'error',
      });
    }
  };

  // Create menu items function that will be called fresh each time
  const getMenuItems = useCallback(
    (menuContext?: typeof contextMenu): MenuAction[] => {
      const currentContext = menuContext || contextMenu;
      const items: MenuAction[] = [];

      // Add Create Folder and Create File options (only in My Files and Workspace Files)
      if (!isSharedApps && !isSharedWithMe && !currentContext.isFolder && !currentContext.recipeId) {
        items.push({
          name: t(I18N_KEYS.MAIN_DASHBOARD.CONTEXT_MENU.CREATE_FILE),
          action: () => {
            const scope = section === DashboardSection.WorkspaceFiles ? FolderScope.WORKSPACE : FolderScope.PERSONAL;
            void createRecipe(false, currentFolderId, scope);
            handleContextMenuClose();
          },
          icon: <FileIcon width={16} height={16} />,
        });
        items.push({
          name: t(I18N_KEYS.MAIN_DASHBOARD.CONTEXT_MENU.CREATE_FOLDER),
          action: () => {
            setIsShowingCreateFolderDialog(true);
            handleContextMenuClose();
          },
          icon: <FolderEmptyIcon width={16} height={16} />,
        });
      }

      // Add folder-specific options if a folder is selected
      if (currentContext.recipeId && currentContext.isFolder) {
        const folder = allFolders.find((f) => f.id === currentContext.recipeId);

        if (items.length > 0) {
          items.push({ type: 'divider' });
        }

        // Add Open options for folders
        items.push(
          {
            name: t(I18N_KEYS.MAIN_DASHBOARD.CONTEXT_MENU.OPEN),
            action: () => {
              if (onFolderNavigate && folder) {
                onFolderNavigate(folder.id);
              }
              handleContextMenuClose();
            },
          },
          {
            name: t(I18N_KEYS.MAIN_DASHBOARD.CONTEXT_MENU.OPEN_NEW_TAB),
            action: () => {
              if (folder) {
                window.open(`/folders/${folder.id}`, '_blank');
              }
              handleContextMenuClose();
            },
          },
        );

        items.push({ type: 'divider' });

        // Add Rename for folders
        if (!isSharedApps && !isSharedWithMe) {
          items.push({
            name: t(I18N_KEYS.MAIN_DASHBOARD.CONTEXT_MENU.RENAME),
            action: () => {
              enableFolderNameEdit(currentContext.recipeId!);
              handleContextMenuClose();
            },
          });
        }

        // Add Move for folders
        if (!isSharedApps && !isSharedWithMe) {
          items.push({
            name: t(I18N_KEYS.MAIN_DASHBOARD.CONTEXT_MENU.MOVE),
            action: () => {
              setShowingMoveDialog({
                show: true,
                id: currentContext.recipeId,
                isFolder: true,
                name: folder?.name || '',
              });
              handleContextMenuClose();
            },
          });
        }

        // Add Delete for folders
        if (!isSharedApps && !isSharedWithMe) {
          items.push({ type: 'divider' });
          items.push({
            name: t(I18N_KEYS.MAIN_DASHBOARD.CONTEXT_MENU.DELETE),
            action: () => {
              onDeleteFolder(currentContext.recipeId);
              handleContextMenuClose();
            },
          });
        }
      }

      // Add recipe-specific options if a recipe is selected (not a folder)
      if (currentContext.recipeId && !currentContext.isFolder) {
        // Add divider if we already have items
        if (items.length > 0) {
          items.push({ type: 'divider' });
        }

        // Add Open options
        items.push(
          {
            name: t(I18N_KEYS.MAIN_DASHBOARD.CONTEXT_MENU.OPEN),
            action: () => {
              goToRecipe(currentContext.recipeId, false);
              handleContextMenuClose();
            },
          },
          {
            name: t(I18N_KEYS.MAIN_DASHBOARD.CONTEXT_MENU.OPEN_NEW_TAB),
            action: () => {
              goToRecipe(currentContext.recipeId, true);
              handleContextMenuClose();
            },
          },
        );

        items.push({ type: 'divider' });

        // Add Duplicate
        items.push({
          name: t(I18N_KEYS.MAIN_DASHBOARD.CONTEXT_MENU.DUPLICATE),
          action: () => {
            handleContextMenuClose();
            void handleDuplicateRecipe(currentContext.recipeId ?? '');
            if (section === DashboardSection.RecentRecipes || section === DashboardSection.WorkspaceFiles) {
              return;
            }
            updateSnackbarData({
              text: t(I18N_KEYS.DASHBOARD.DUPLICATE_SUCCESS),
              isOpen: true,
              action: {
                text: t(I18N_KEYS.DASHBOARD.DUPLICATE_SUCCESS_ACTION),
                onClick: handleGoToMyFiles,
              },
              icon: <CheckMarkCircleIcon height={20} width={20} />,
            });
          },
        });

        // Add Move (if allowed)
        if (!isSharedApps && !isSharedWithMe) {
          items.push({
            name: t(I18N_KEYS.MAIN_DASHBOARD.CONTEXT_MENU.MOVE),
            action: () => {
              const recipe = recipes.find((r) => r.id === currentContext.recipeId);
              setShowingMoveDialog({
                show: true,
                id: currentContext.recipeId,
                isFolder: false,
                name: recipe?.name || '',
              });
              handleContextMenuClose();
            },
          });
        }

        // Add Rename (if allowed)
        if (!isSharedApps && !isSharedWithMe) {
          items.push({
            name: t(I18N_KEYS.MAIN_DASHBOARD.CONTEXT_MENU.RENAME),
            action: () => {
              enableRecipeNameEdit(currentContext.recipeId ?? '');
              handleContextMenuClose();
            },
          });
        }

        // Add Change Owner for workspace files or when showChangeNameButton is true
        // Find the recipe to check ownership
        const recipe = recipes.find((r) => r.id === currentContext.recipeId) as DashboardRecipe & { owner?: string };
        const isOwner = recipe?.owner && currentUser?.uid ? recipe.owner === currentUser.uid : true;
        const isWorkspaceFile = section === DashboardSection.WorkspaceFiles;

        if ((showChangeNameButton || (isWorkspaceFile && isOwner)) && !isSharedApps && !isSharedWithMe) {
          items.push({ type: 'divider' });
          items.push({
            name: t(I18N_KEYS.MAIN_DASHBOARD.CONTEXT_MENU.CHANGE_OWNER),
            action: () => {
              if (!currentContext.recipeId) {
                return;
              }
              setIsShowingChangeOwnerDialog({ show: true, id: currentContext.recipeId });
              handleContextMenuClose();
            },
          });
        }

        // Add Delete (if allowed)
        if (!isSharedWithMe) {
          items.push({ type: 'divider' });
          items.push({
            name: t(I18N_KEYS.MAIN_DASHBOARD.CONTEXT_MENU.DELETE),
            action: () => {
              onDeleteRecipe(currentContext.recipeId);
              handleContextMenuClose();
            },
          });
        }
      }

      return items;
    },
    [
      allFolders,
      contextMenu,
      currentFolderId,
      createRecipe,
      currentUser?.uid,
      enableFolderNameEdit,
      enableRecipeNameEdit,
      goToRecipe,
      handleContextMenuClose,
      handleDuplicateRecipe,
      handleGoToMyFiles,
      isSharedApps,
      isSharedWithMe,
      onFolderNavigate,
      recipes,
      section,
      showChangeNameButton,
      t,
      updateSnackbarData,
    ],
  );

  const renderSubheader = () =>
    recipes?.length || allFolders?.length ? (
      <FlexCenVer
        data-testid="dashboard-top-menu-container"
        sx={{
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '40px',
          flexShrink: 0,
          mt: '32px',
          mb: '32px',
        }}
      >
        <Breadcrumbs folderPath={folderPath} onNavigate={onFolderNavigate!} rootName={title} />

        <FlexCenVer data-testid="dashboard-list-top-menu" sx={{ justifyContent: 'flex-end' }}>
          <Input
            placeholder={t(I18N_KEYS.GENERAL.SEARCH)}
            value={searchTerm}
            onChange={handleSearchChange}
            startAdornment={<SearchIcon />}
            sx={{ mr: 2 }}
          />

          <IconButton
            size="small"
            onClick={() => setIsListView(true)}
            sx={{ backgroundColor: isListView ? color.Super_Light_Transparent : '', borderRadius: 1 }}
          >
            <img src="/icons/list.svg" alt="list" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setIsListView(false)}
            sx={{ backgroundColor: !isListView ? color.Super_Light_Transparent : '', borderRadius: 1 }}
          >
            <img src="/icons/squares.svg" alt="squares" />
          </IconButton>
        </FlexCenVer>
      </FlexCenVer>
    ) : null;

  const renderContent = () => {
    if (filteredRecipes.length === 0 && filteredFolders.length === 0) {
      // Check if there's a search with no results (at any level - inside folder or at root)
      if (searchTerm) {
        return (
          <EmptyState
            icon={<FolderEmptyIcon />}
            title={t(I18N_KEYS.MAIN_DASHBOARD.SEARCH_NO_RESULTS.TITLE, { searchTerm })}
            description={t(I18N_KEYS.MAIN_DASHBOARD.SEARCH_NO_RESULTS.DESCRIPTION)}
            actions={[]}
            sx={{ paddingTop: '104px', alignItems: 'flex-start' }}
          />
        );
      }

      // Check if we're inside a folder and it's empty (no search active)
      if (currentFolderId) {
        return (
          <EmptyState
            icon={<FolderEmptyIcon />}
            title={t(I18N_KEYS.MAIN_DASHBOARD.FOLDER_EMPTY.TITLE)}
            description={t(I18N_KEYS.MAIN_DASHBOARD.FOLDER_EMPTY.DESCRIPTION)}
            actions={[]}
            sx={{ paddingTop: '104px', alignItems: 'flex-start' }}
          />
        );
      }
    }

    // Check if the root level is empty
    if (!recipes.length && !allFolders.length) {
      const icon = isSharedApps ? <AppWindowIcon /> : <YarnIcon />;
      const title = isSharedApps
        ? t(I18N_KEYS.DASHBOARD.PAGES.SHARED_APPS.EMPTY_STATE.TITLE)
        : isWorkspaceFiles
          ? t(I18N_KEYS.DASHBOARD.PAGES.WORKSPACE_FILES.EMPTY_STATE.TITLE)
          : t(I18N_KEYS.DASHBOARD.PAGES.FILES.EMPTY_STATE.TITLE);
      const description = isSharedApps
        ? null
        : isWorkspaceFiles
          ? 'Files added here will be shared with all workspace\u00A0members'
          : t(I18N_KEYS.DASHBOARD.PAGES.FILES.EMPTY_STATE.DESCRIPTION);
      const actions = isSharedApps
        ? [
            {
              label: t(I18N_KEYS.DASHBOARD.PAGES.SHARED_APPS.EMPTY_STATE.ACTION),
              href: EXTERNAL_LINKS.designAppTutorial,
              target: '_blank',
            },
          ]
        : isWorkspaceFiles
          ? [] // No actions for workspace files
          : [
              {
                label: t(I18N_KEYS.MAIN_DASHBOARD.CREATE_NEW_FILE),
                onClick: () => {
                  track('created_new_flow', { source: 'dashboard_empty_state' }, TrackTypeEnum.BI);
                  void createRecipe();
                },
              },
            ];
      return (
        <EmptyState
          icon={icon}
          title={title}
          description={description}
          actions={actions}
          sx={{ paddingTop: 'max(15%, 144px)', alignItems: 'flex-start' }}
        />
      );
    }
    if (isListView) {
      return (
        <DashboardListView
          recipes={filteredRecipes} // REMOVE THIS WHEN FILTER WILL BE IN THE SERVER
          allRecipes={recipes}
          folders={filteredFolders}
          allFolders={allFolders}
          handleRenameRecipe={(id, name) => void handleRenameRecipe(id, name)}
          handleContextMenu={handleContextMenu}
          editingRecipe={editingRecipe}
          setEditingRecipe={setEditingRecipe}
          cancelRename={handleCancelRenameRecipe}
          onFolderNavigate={onFolderNavigate}
          currentFolderId={currentFolderId}
          isSearching={searchTerm.length > 0}
          editingFolder={editingFolder}
          setEditingFolder={setEditingFolder}
          handleRenameFolder={handleRenameFolder ? (id, name) => void handleRenameFolder(id, name) : undefined}
          cancelRenameFolder={handleCancelRenameFolder}
          countFilesInFolder={(folderId) => countFilesInFolder(folderId, allFolders || [], foldersRecipes || [])}
          onMoveItem={(itemId, itemType, targetFolderId) => {
            void handleDragAndDropMove(itemId, itemType, targetFolderId);
          }}
          isWorkspaceFiles={isWorkspaceFiles || isSharedWithMe}
        />
      );
    }
    return (
      <DashboardCardView
        recipes={filteredRecipes}
        allRecipes={recipes}
        folders={filteredFolders}
        allFolders={allFolders}
        handleRenameRecipe={(id, name) => void handleRenameRecipe(id, name)}
        handleContextMenu={handleContextMenu}
        editingRecipe={editingRecipe}
        onSetEditingRecipe={handleEditingRecipe}
        cancelRename={handleCancelRenameRecipe}
        onFolderNavigate={onFolderNavigate}
        currentFolderId={currentFolderId}
        isSearching={searchTerm.length > 0}
        editingFolder={editingFolder}
        onSetEditingFolder={handleEditingFolder}
        handleRenameFolder={handleRenameFolder ? (id, name) => void handleRenameFolder(id, name) : undefined}
        cancelRenameFolder={handleCancelRenameFolder}
        countFilesInFolder={(folderId) => countFilesInFolder(folderId, allFolders || [], foldersRecipes || [])}
        onMoveItem={(itemId, itemType, targetFolderId) => {
          void handleDragAndDropMove(itemId, itemType, targetFolderId);
        }}
        isWorkspaceFiles={isWorkspaceFiles || isSharedWithMe}
      />
    );
  };

  return (
    <>
      <Box
        component="main"
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          pb: 0,
        }}
        onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
          // Don't show context menu in Shared with Me section
          if (isSharedWithMe) {
            return;
          }

          // Handle right-click on the main container or any empty space
          const target = e.target as HTMLElement;
          const isEmptySpace =
            target === e.currentTarget ||
            target.closest('[data-testid="dashboard-table-view-container"]') ||
            target.closest('[data-testid="dashboard-card-view-container"]') ||
            target.closest('.MuiGrid2-root');

          if (isEmptySpace && !target.closest('[role="button"]') && !target.closest('[data-testid^="recipe-card-"]')) {
            handleGeneralContextMenu(e);
          }
        }}
      >
        {showCase?.length && !isSharedApps ? (
          <Box data-testid="showcase-recipes-container" sx={{ width: '100%' }}>
            <EducationGallery recipes={showCase} />
          </Box>
        ) : null}

        {error ? (
          <FlexColCenHorVer sx={{ width: '100%', height: '100%' }}>
            <ErrorDisplay
              icon={<SmileyXEyes />}
              title={t(I18N_KEYS.MAIN_DASHBOARD.ERROR_LOADING_RECIPES.TITLE)}
              description={null}
              actions={[
                { label: t(I18N_KEYS.MAIN_DASHBOARD.ERROR_LOADING_RECIPES.ACTION), onClick: () => void reload() },
              ]}
            />
          </FlexColCenHorVer>
        ) : (
          <FlexCol
            sx={{ flexGrow: 1 }}
            onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
              // Handle right-click on empty space within the content area
              const target = e.target as HTMLElement;
              const isCard =
                target.closest('[data-testid^="recipe-card-"]') ||
                target.closest('[data-testid^="folder-card-"]') ||
                target.closest('tr[role="checkbox"]');

              if (!isCard) {
                e.stopPropagation();
                handleGeneralContextMenu(e);
              }
            }}
          >
            {renderSubheader()}
            {renderContent()}
          </FlexCol>
        )}
      </Box>
      <AppContextMenu
        key={`${contextMenu.recipeId}-${contextMenu.isFolder}`}
        mouseX={contextMenu.mouseX}
        mouseY={contextMenu.mouseY}
        open={(() => {
          if (!contextMenu.isOpen) return false;
          const items = getMenuItems(contextMenu);
          return items.length > 0;
        })()}
        onClose={handleContextMenuClose}
        items={useMemo(() => {
          if (!contextMenu.isOpen) return [];
          return getMenuItems(contextMenu);
        }, [contextMenu, getMenuItems])}
        width="200px"
      />
      <ConfirmationDialogV2
        open={isShowingDeleteDialog.show}
        onClose={handleDeleteDialogClose}
        onConfirm={handleConfirmDelete}
        title={
          isShowingDeleteDialog.isFolder
            ? t(I18N_KEYS.MAIN_DASHBOARD.DELETE_DIALOG.CONFIRMATION_DELETE_FOLDER)
            : !isSharedApps
              ? t(I18N_KEYS.MAIN_DASHBOARD.DELETE_DIALOG.CONFIRMATION_DELETE_FILE)
              : t(I18N_KEYS.MAIN_DASHBOARD.DELETE_DIALOG.CONFIRMATION_DELETE_APP)
        }
        message={
          isShowingDeleteDialog.isFolder ? t(I18N_KEYS.MAIN_DASHBOARD.DELETE_DIALOG.DELETE_FOLDER_MESSAGE) : undefined
        }
        confirmText={
          isShowingDeleteDialog.isFolder
            ? t(I18N_KEYS.MAIN_DASHBOARD.DELETE_DIALOG.DELETE_FOLDER_CONFIRM)
            : t(I18N_KEYS.MAIN_DASHBOARD.DELETE_DIALOG.CONFIRM)
        }
        withLoading
      />
      {isShowingChangeOwnerDialog.show && (
        <ChangeOwnerModal
          open={isShowingChangeOwnerDialog.show}
          onClose={() => setIsShowingChangeOwnerDialog({ show: false, id: null })}
          recipeId={isShowingChangeOwnerDialog.id}
        />
      )}
      <CreateFolderModal
        open={isShowingCreateFolderDialog}
        onClose={() => setIsShowingCreateFolderDialog(false)}
        onConfirm={handleCreateFolder}
      />
      {showingMoveDialog.show && (
        <MoveModal
          open={showingMoveDialog.show}
          onClose={() => setShowingMoveDialog({ show: false, id: null, isFolder: false, name: '' })}
          onConfirm={handleMove}
          itemName={showingMoveDialog.name}
          itemId={showingMoveDialog.id}
          isFolder={showingMoveDialog.isFolder}
          currentFolderId={currentFolderId}
          folders={allFolders}
          isWorkspaceScope={isWorkspaceFiles}
        />
      )}
    </>
  );
}
