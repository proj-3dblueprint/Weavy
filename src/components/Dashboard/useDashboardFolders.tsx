import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useFoldersStore } from '@/state/folders.state';
import { FolderScope } from '@/enums/folder-scope.enum';
import { useDashboardRecipes } from './useDashboardRecipes';

export const useDashboardFolders = () => {
  // Loading States
  const loaded = useFoldersStore((state) => state.personal.loaded);
  const loading = useFoldersStore((state) => state.personal.loading);
  const caughtError = useFoldersStore((state) => state.personal.caughtError);

  // Data
  const folders = useFoldersStore(useShallow((state) => state.personal.folders));
  const folderRecipes = useFoldersStore(useShallow((state) => state.personal.recipes));
  const currentFolderId = useFoldersStore((state) => state.personal.currentFolderId);
  const folderPath = useFoldersStore(useShallow((state) => state.personal.folderPath));

  // API Actions
  const getFolderContents = useFoldersStore((state) => state.getFolderContents);
  const navigateToFolder = useFoldersStore((state) => state.navigateToFolder);
  const createFolder = useFoldersStore((state) => state.createFolder);
  const setScope = useFoldersStore((state) => state.setScope);

  // Store Management
  const initialLoad = useFoldersStore((state) => state.initialLoad);
  const baseReload = useFoldersStore((state) => state.reload);
  const reload = () => baseReload(FolderScope.PERSONAL);

  // Get recipe actions from the recipes store (but not the data - we use folder API for that)
  const {
    sharedApps,
    sharedWithCurrentUser,
    showCaseRecipes,
    createRecipe,
    duplicateRecipe,
    deleteRecipe,
    renameRecipe,
    changeOwner,
    cancelRenameRecipe,
    goToRecipe,
  } = useDashboardRecipes();

  useEffect(() => {
    // Always call initialLoad with PERSONAL scope to ensure data is fetched
    // The navigateToFolder in Dashboard will handle setting the correct folder
    void initialLoad(FolderScope.PERSONAL);
    // Note: We're not calling recipe initialLoad anymore since we get recipes from folders API
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

    // Shared data from recipes store
    sharedApps,
    sharedWithCurrentUser,
    showCaseRecipes,

    // Folder actions
    getFolderContents,
    navigateToFolder,
    createFolder,
    setScope,

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
