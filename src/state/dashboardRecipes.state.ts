import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { log } from '@/logger/logger.ts';
import { RecipeType } from '@/enums/recipe-type.enum';
import { FolderScope } from '@/enums/folder-scope.enum';
import { getAxiosInstance } from '@/services/axiosConfig';

const logger = log.getLogger('dashboardRecipes');
const axiosInstance = getAxiosInstance();

export interface DashboardRecipe {
  id: string;
  name: string;
  poster?: string;
  createdAt: string;
  updatedAt?: string;
  isApp?: boolean;
  workspaceId?: string;
  ownerName?: string;
  owner?: string;
  folderId: string | null;
}

interface RecipesState {
  // Loading States
  loaded: boolean;
  loadingRecipes: boolean;
  caughtError: boolean;

  // Data
  recipes: DashboardRecipe[];
  sharedWithCurrentUser: DashboardRecipe[];
  sharedApps: DashboardRecipe[];
  showCaseRecipes: DashboardRecipe[];
}

interface RecipesActions {
  // API Actions
  getUserRecipes: () => Promise<void>;
  getPublicRecipes: () => Promise<void>;
  getUserSharedApps: () => Promise<void>;
  getRecipes: () => Promise<void>;
  loadSharedAndShowcase: () => Promise<void>;

  // Recipe Management
  createRecipe: (openInNewTab?: boolean, parentId?: string | null, scope?: FolderScope) => Promise<void>;
  duplicateRecipe: (id: string) => Promise<void>;
  deleteRecipe: (id: string | null, type: RecipeType) => Promise<void>;
  renameRecipe: (id: string, newName: string) => Promise<void>;
  changeOwner: (id: string, newOwnerId: string, newOwnerName?: string) => Promise<void>;
  cancelRenameRecipe: (id: string, oldName: string) => void;
  goToRecipe: (id: string | null, openInNewTab?: boolean, isNewFile?: boolean) => void;

  // Store Management
  initialLoad: () => Promise<void>;
  reload: () => Promise<void>;
}

export type RecipesStore = RecipesState & RecipesActions;

export const useRecipesStore = create<RecipesStore>()(
  devtools(
    (set, get) => ({
      loaded: false,
      loadingRecipes: false,
      caughtError: false,
      recipes: [],
      sharedWithCurrentUser: [],
      sharedApps: [],
      showCaseRecipes: [],

      // API Actions
      getUserRecipes: async () => {
        const userRecipesResponse = await axiosInstance.get<DashboardRecipe[]>('/v1/recipes');
        set({ recipes: userRecipesResponse.data });
      },

      getPublicRecipes: async () => {
        const publicRecipesResponse = await axiosInstance.get<DashboardRecipe[]>('/v1/recipes/public');
        set({ showCaseRecipes: publicRecipesResponse.data });
      },

      getUserSharedApps: async () => {
        const userSharedAppsResponse = await axiosInstance.get<DashboardRecipe[]>('/v1/recipes/shared');
        const sharedApps = userSharedAppsResponse.data.filter((recipe) => recipe.isApp === true);
        const sharedWithCurrentUser = userSharedAppsResponse.data.filter((recipe) => recipe.isApp !== true);
        set({ sharedApps, sharedWithCurrentUser });
      },

      getRecipes: async () => {
        set({ loadingRecipes: true, caughtError: false });
        try {
          const { getUserRecipes, getPublicRecipes, getUserSharedApps } = get();
          await Promise.all([getUserRecipes(), getPublicRecipes(), getUserSharedApps()]);
          set({ loadingRecipes: false });
        } catch (error) {
          logger.error('Error fetching recipes:', error);
          set({ loadingRecipes: false, caughtError: true });
        }
      },

      loadSharedAndShowcase: async () => {
        set({ loadingRecipes: true, caughtError: false });
        try {
          const { getPublicRecipes, getUserSharedApps } = get();
          await Promise.all([getPublicRecipes(), getUserSharedApps()]);
          set({ loadingRecipes: false, loaded: true });
        } catch (error) {
          logger.error('Error fetching shared and showcase recipes:', error);
          set({ loadingRecipes: false, caughtError: true });
        }
      },

      // Recipe Management Actions
      createRecipe: async (openInNewTab = false, parentId?: string | null, scope?: FolderScope) => {
        set({ loadingRecipes: true, caughtError: false });
        try {
          const response = await axiosInstance.post<DashboardRecipe>('/v1/recipes/create', {
            ...(parentId && { folderId: parentId }),
            ...(scope && { scope }),
          });
          set((state) => ({
            recipes: [...state.recipes, response.data],
            loadingRecipes: false,
          }));
          get().goToRecipe(response.data.id, openInNewTab, true);
        } catch (error) {
          logger.error('error creating recipe: ', error);
          set({ loadingRecipes: false, caughtError: true });
        }
      },

      duplicateRecipe: async (id: string) => {
        try {
          const response = await axiosInstance.post<DashboardRecipe>(`/v1/recipes/${id}/duplicate`);
          set((state) => ({
            recipes: [...state.recipes, response.data],
          }));
        } catch (error) {
          logger.error('error duplicating recipe: ', error);
        }
      },

      deleteRecipe: async (id: string | null, type: RecipeType) => {
        if (!id) return;

        try {
          if (type === RecipeType.File) {
            await axiosInstance.delete(`/v1/recipes/${id}`);
          } else {
            await axiosInstance.post(`/v1/recipes/${id}/shared/delete`);
          }

          set((state) => ({
            recipes: type === RecipeType.File ? state.recipes.filter((recipe) => recipe.id !== id) : state.recipes,
            sharedApps:
              type !== RecipeType.File ? state.sharedApps.filter((recipe) => recipe.id !== id) : state.sharedApps,
          }));
        } catch (error) {
          logger.error('error deleting recipe: ', error);
        }
      },

      renameRecipe: async (id: string, newName: string) => {
        set((state) => ({
          recipes: state.recipes.map((recipe) => (recipe.id === id ? { ...recipe, name: newName } : recipe)),
        }));

        try {
          const recipe = get().recipes.find((r) => r.id === id);
          if (recipe) {
            await axiosInstance.put(`/v1/recipes/${id}`, { ...recipe, name: newName });
          }
        } catch (error) {
          logger.error('error renaming recipe: ', error);
        }
      },
      changeOwner: async (id: string, newOwnerId: string, newOwnerName?: string) => {
        try {
          const recipe = get().recipes.find((r) => r.id === id);

          // Make the API call
          if (!recipe) {
            // If recipe not in store, still make the API call
            await axiosInstance.put(`/v1/recipes/${id}`, {
              owner: newOwnerId,
            });
          } else {
            // Update the recipe with the new owner
            await axiosInstance.put(`/v1/recipes/${id}`, {
              name: recipe.name,
              owner: newOwnerId,
            });
          }

          // Update the recipe in the dashboard recipes store with new owner
          set((state) => ({
            recipes: state.recipes.map((r) => (r.id === id ? { ...r, owner: newOwnerId, ownerName: newOwnerName } : r)),
          }));

          // Also update in folders store
          const { useFoldersStore } = await import('@/state/folders.state');
          useFoldersStore.setState((state) => ({
            personal: {
              ...state.personal,
              // Remove from personal files since ownership changed
              recipes: state.personal.recipes.filter((r) => r.id !== id),
            },
            workspace: {
              ...state.workspace,
              // Update owner in workspace files (don't remove, just update)
              recipes: state.workspace.recipes.map((r) =>
                r.id === id ? { ...r, owner: newOwnerId, ownerName: newOwnerName } : r,
              ),
            },
          }));
        } catch (error) {
          logger.error('error changing owner: ', error);
          throw error; // Re-throw to allow the modal to handle the error
        }
      },

      cancelRenameRecipe: (id: string, oldName: string) => {
        set((state) => ({
          recipes: state.recipes.map((recipe) => (recipe.id === id ? { ...recipe, name: oldName } : recipe)),
        }));
      },

      goToRecipe: (id: string | null, openInNewTab = false, isNewFile = false) => {
        if (!id) return;
        const url = `/flow/${id}${isNewFile ? '?new=true' : ''}`;
        if (openInNewTab) {
          window.open(url, '_blank');
        } else {
          window.location.href = url;
        }
      },

      initialLoad: async () => {
        if (get().loaded || get().loadingRecipes) return;
        await get().getRecipes();
        set({ loaded: true });
      },

      reload: async () => {
        set({ loaded: false, loadingRecipes: false, caughtError: false });
        await get().initialLoad();
      },
    }),
    {
      name: 'Recipes store',
      enabled: import.meta.env.DEV,
    },
  ),
);
