import { useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useFoldersStore } from '@/state/folders.state';
import { FolderScope } from '@/enums/folder-scope.enum';
import { useDashboardRecipes } from './useDashboardRecipes';

export const useWorkspaceFolders = () => {
  // Loading States
  const loaded = useFoldersStore((state) => state.workspace.loaded);
  const loading = useFoldersStore((state) => state.workspace.loading);
  const caughtError = useFoldersStore((state) => state.workspace.caughtError);

  // Data
  const folders = useFoldersStore(useShallow((state) => state.workspace.folders));
  const folderRecipes = useFoldersStore(useShallow((state) => state.workspace.recipes));
  const currentFolderId = useFoldersStore((state) => state.workspace.currentFolderId);
  const folderPath = useFoldersStore(useShallow((state) => state.workspace.folderPath));

  // API Actions with workspace scope
  const baseFolderContents = useFoldersStore((state) => state.getFolderContents);
  const baseNavigateToFolder = useFoldersStore((state) => state.navigateToFolder);
  const baseCreateFolder = useFoldersStore((state) => state.createFolder);

  // Store Management
  const baseInitialLoad = useFoldersStore((state) => state.initialLoad);
  const baseReload = useFoldersStore((state) => state.reload);

  // Get recipe actions from the recipes store (but not the data - we use folder API for that)
  const { createRecipe, duplicateRecipe, deleteRecipe, renameRecipe, changeOwner, cancelRenameRecipe, goToRecipe } =
    useDashboardRecipes();

  // Wrapped actions that always use workspace scope
  const getFolderContents = useCallback(
    (folderId?: string | null) => baseFolderContents(folderId, FolderScope.WORKSPACE),
    [baseFolderContents],
  );

  const navigateToFolder = useCallback(
    (folderId?: string | null) => baseNavigateToFolder(folderId, FolderScope.WORKSPACE),
    [baseNavigateToFolder],
  );

  const createFolder = useCallback(
    (name: string, parentId?: string | null) => baseCreateFolder(name, parentId, FolderScope.WORKSPACE),
    [baseCreateFolder],
  );

  const initialLoad = useCallback(() => baseInitialLoad(FolderScope.WORKSPACE), [baseInitialLoad]);

  const reload = useCallback(() => {
    return baseReload(FolderScope.WORKSPACE);
  }, [baseReload]);

  useEffect(() => {
    // Always initialize workspace data
    void initialLoad();
  }, [initialLoad]);

  return {
    // Loading states
    loaded,
    loading,
    caughtError,

    // Folder data
    folders,
    recipes: folderRecipes,
    currentFolderId,
    folderPath,

    // Folder actions
    getFolderContents,
    navigateToFolder,
    createFolder,

    // Recipe actions
    createRecipe,
    duplicateRecipe,
    deleteRecipe,
    renameRecipe,
    changeOwner,
    cancelRenameRecipe,
    goToRecipe,

    // Store actions
    initialLoad,
    reload,
  };
};
