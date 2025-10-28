import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { log } from '@/logger/logger.ts';
import { getAxiosInstance } from '@/services/axiosConfig';
import useWorkspacesStore from '@/state/workspaces.state';
import { FolderScope } from '@/enums/folder-scope.enum';
import { DashboardRecipe } from '@/state/dashboardRecipes.state.ts';
import type {
  FolderResponseDto,
  ListFolderResponseDto,
  CreateFolderRequestDto,
  ListFolderRequestParams,
} from '@/types/folder.types';

const logger = log.getLogger('folders');
const axiosInstance = getAxiosInstance();

interface ScopedData {
  loaded: boolean;
  loading: boolean;
  caughtError: boolean;
  folders: FolderResponseDto[];
  recipes: DashboardRecipe[];
  currentFolderId?: string | null;
  folderPath: FolderResponseDto[];
}

interface FoldersState {
  // Separate data for each scope
  personal: ScopedData;
  workspace: ScopedData;
}

interface FoldersActions {
  // API Actions
  getFolderContents: (folderId?: string | null, scope?: FolderScope) => Promise<void>;
  createFolder: (name: string, parentId?: string | null, scope?: FolderScope) => Promise<FolderResponseDto>;

  // Navigation
  navigateToFolder: (folderId?: string | null, scope?: FolderScope) => Promise<void>;

  // Scope Management
  setScope: (scope: FolderScope) => void;

  // Store Management
  initialLoad: (scope?: FolderScope) => Promise<void>;
  reload: (scope?: FolderScope) => Promise<void>;
  reset: () => void;
}

export type FoldersStore = FoldersState & FoldersActions;

const createInitialScopedData = (): ScopedData => ({
  loaded: false,
  loading: false,
  caughtError: false,
  folders: [],
  recipes: [],
  currentFolderId: null,
  folderPath: [],
});

export const useFoldersStore = create<FoldersStore>()(
  devtools(
    (set, get) => ({
      personal: createInitialScopedData(),
      workspace: createInitialScopedData(),

      // API Actions
      getFolderContents: async (folderId?: string | null, scope?: FolderScope) => {
        const targetScope = scope || FolderScope.PERSONAL;
        const scopeKey = targetScope === FolderScope.PERSONAL ? 'personal' : 'workspace';

        set((state) => ({
          [scopeKey]: {
            ...state[scopeKey],
            loading: true,
            caughtError: false,
          },
        }));

        try {
          // Always fetch all folders and recipes, no parentId parameter
          const params: ListFolderRequestParams = {
            scope: targetScope,
          };
          const response = await axiosInstance.get<ListFolderResponseDto>('/v1/folders/list', {
            params,
          });

          logger.debug(`${scopeKey} folder contents response:`, {
            folderCount: response.data.folders.length,
            recipeCount: response.data.recipes.length,
            folders: response.data.folders.map((f) => ({ id: f.id, name: f.name, parentId: f.parentId })),
            recipes: response.data.recipes.map((r) => ({ id: r.id, name: r.name, folderId: r.folderId })),
            allRecipeFolderIds: [...new Set(response.data.recipes.map((r) => r.folderId))],
            allFolderParentIds: [...new Set(response.data.folders.map((f) => f.parentId))],
          });

          set((state) => ({
            [scopeKey]: {
              ...state[scopeKey],
              folders: response.data.folders,
              recipes: response.data.recipes,
              loading: false,
            },
          }));
        } catch (error) {
          logger.error(`Error fetching ${scopeKey} folder contents:`, error);
          set((state) => ({
            [scopeKey]: {
              ...state[scopeKey],
              loading: false,
              caughtError: true,
            },
          }));
        }
      },

      createFolder: async (name: string, parentId?: string | null, scope?: FolderScope) => {
        try {
          // Get the current workspace ID
          const workspaceId = useWorkspacesStore.getState().activeWorkspace.workspaceId;
          const targetScope = scope || FolderScope.PERSONAL;

          const requestData: CreateFolderRequestDto = {
            name,
            workspaceId,
            scope: targetScope,
            ...(parentId && { parentId }),
          };

          const response = await axiosInstance.post<FolderResponseDto>('/v1/folders', requestData);

          // Refresh the current folder contents to show the new folder
          const scopeKey = targetScope === FolderScope.PERSONAL ? 'personal' : 'workspace';
          await get().getFolderContents(get()[scopeKey].currentFolderId, targetScope);

          return response.data;
        } catch (error) {
          logger.error('Error creating folder:', error);
          throw error;
        }
      },

      // Navigation
      navigateToFolder: async (folderId?: string | null, scope?: FolderScope) => {
        const targetScope = scope || FolderScope.PERSONAL;
        const scopeKey = targetScope === FolderScope.PERSONAL ? 'personal' : 'workspace';
        const scopedData = get()[scopeKey];
        const { getFolderContents } = get();

        logger.debug(`Navigating to ${scopeKey} folder:`, { folderId, currentFolderId: scopedData.currentFolderId });

        // First, update the folder path based on navigation
        let newPath: FolderResponseDto[] = [];

        if (!folderId) {
          // Navigating to root - clear the path
          newPath = [];
        } else {
          // Check if we're navigating to a folder already in our path (going back)
          const existingIndex = scopedData.folderPath.findIndex((f) => f.id === folderId);

          if (existingIndex !== -1) {
            // We're navigating backwards in the breadcrumb - keep path up to this folder
            newPath = scopedData.folderPath.slice(0, existingIndex + 1);
          } else {
            // We're navigating forward (into a subfolder)
            // Find the folder in current folders to add it to the path
            const targetFolder = scopedData.folders.find((f) => f.id === folderId);
            if (targetFolder) {
              newPath = [...scopedData.folderPath, targetFolder];
            } else {
              // If we can't find the folder (e.g., direct URL navigation),
              // we'll need to rebuild the path after fetching
              newPath = [];
            }
          }
        }

        // Update the state with new path and current folder
        set((state) => ({
          [scopeKey]: {
            ...state[scopeKey],
            currentFolderId: folderId,
            folderPath: newPath,
          },
        }));

        // Only fetch contents if we haven't loaded data yet
        if (!scopedData.loaded) {
          await getFolderContents(folderId, targetScope);

          // Mark as loaded after fetching contents (even if there was an error)
          // This ensures the loading spinner disappears
          set((state) => ({
            [scopeKey]: {
              ...state[scopeKey],
              loaded: true,
            },
          }));

          // If we couldn't build the path earlier (direct navigation), try again with fetched data
          const updatedScopedData = get()[scopeKey];
          if (folderId && newPath.length === 0 && !updatedScopedData.caughtError) {
            // Build the folder path from the fetched data
            const targetFolder = updatedScopedData.folders.find((f) => f.id === folderId);
            if (targetFolder) {
              // Build the complete path by traversing parent folders
              const buildPath = (folder: FolderResponseDto): FolderResponseDto[] => {
                if (!folder.parentId) {
                  return [folder];
                }
                const parent = updatedScopedData.folders.find((f) => f.id === folder.parentId);
                if (parent) {
                  return [...buildPath(parent), folder];
                }
                return [folder];
              };
              set((state) => ({
                [scopeKey]: {
                  ...state[scopeKey],
                  folderPath: buildPath(targetFolder),
                },
              }));
            }
          }
        }
      },

      initialLoad: async (scope?: FolderScope) => {
        const targetScope = scope || FolderScope.PERSONAL;
        const scopeKey = targetScope === FolderScope.PERSONAL ? 'personal' : 'workspace';
        const scopedData = get()[scopeKey];

        if (scopedData.loaded || scopedData.loading) return;

        // If we already have a currentFolderId (from navigation), just mark as loaded
        // The navigateToFolder will handle fetching the data
        if (scopedData.currentFolderId) {
          set((state) => ({
            [scopeKey]: {
              ...state[scopeKey],
              loaded: true,
            },
          }));
          return;
        }

        // Otherwise, fetch the root folder contents
        await get().getFolderContents(null, targetScope);
        set((state) => ({
          [scopeKey]: {
            ...state[scopeKey],
            loaded: true,
          },
        }));
      },

      reload: async (scope?: FolderScope) => {
        const targetScope = scope || FolderScope.PERSONAL;
        const scopeKey = targetScope === FolderScope.PERSONAL ? 'personal' : 'workspace';
        set((state) => ({
          [scopeKey]: {
            ...state[scopeKey],
            loaded: false,
            loading: false,
            caughtError: false,
          },
        }));
        await get().initialLoad(targetScope);
      },

      reset: () => {
        set(() => ({
          personal: createInitialScopedData(),
          workspace: createInitialScopedData(),
        }));
      },
    }),
    {
      name: 'Folders store',
      enabled: import.meta.env.DEV,
    },
  ),
);
