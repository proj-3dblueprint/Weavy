import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLocation } from 'react-router-dom';
import { useRecipesStore, type RecipesStore } from '@/state/dashboardRecipes.state';

export const useDashboardRecipes = (): Omit<
  RecipesStore,
  'getPublicRecipes' | 'getUserSharedApps' | 'getRecipes' | 'loadSharedAndShowcase'
> => {
  // Loading States
  const loaded = useRecipesStore((state) => state.loaded);
  const loadingRecipes = useRecipesStore((state) => state.loadingRecipes);
  const caughtError = useRecipesStore((state) => state.caughtError);

  // Data
  const recipes = useRecipesStore(useShallow((state) => state.recipes));
  const sharedApps = useRecipesStore(useShallow((state) => state.sharedApps));
  const sharedWithCurrentUser = useRecipesStore(useShallow((state) => state.sharedWithCurrentUser));
  const showCaseRecipes = useRecipesStore(useShallow((state) => state.showCaseRecipes));

  // API Actions
  const getUserRecipes = useRecipesStore((state) => state.getUserRecipes);

  // Recipe Management
  const createRecipe = useRecipesStore((state) => state.createRecipe);
  const duplicateRecipe = useRecipesStore((state) => state.duplicateRecipe);
  const deleteRecipe = useRecipesStore((state) => state.deleteRecipe);
  const renameRecipe = useRecipesStore((state) => state.renameRecipe);
  const changeOwner = useRecipesStore((state) => state.changeOwner);
  const cancelRenameRecipe = useRecipesStore((state) => state.cancelRenameRecipe);
  const goToRecipe = useRecipesStore((state) => state.goToRecipe);

  // Store Management
  const initialLoad = useRecipesStore((state) => state.initialLoad);
  const reload = useRecipesStore((state) => state.reload);

  const { pathname } = useLocation();

  // Only load shared apps and showcase recipes - skip getUserRecipes as we get those from folders API
  useEffect(() => {
    const store = useRecipesStore.getState();
    // Only load if not already loaded and not currently loading
    if (
      !store.loaded &&
      !store.loadingRecipes &&
      !pathname.startsWith('/flow') &&
      !pathname.startsWith('/settings') &&
      !pathname.startsWith('/pricing')
    ) {
      void store.loadSharedAndShowcase();
    }
  }, [pathname]);

  return {
    loaded,
    loadingRecipes,
    caughtError,
    recipes,
    sharedApps,
    sharedWithCurrentUser,
    showCaseRecipes,
    getUserRecipes,
    createRecipe,
    duplicateRecipe,
    deleteRecipe,
    renameRecipe,
    changeOwner,
    cancelRenameRecipe,
    goToRecipe,
    initialLoad,
    reload,
  };
};
