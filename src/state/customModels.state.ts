import { create, type StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getAxiosInstance } from '@/services/axiosConfig';
import { log } from '@/logger/logger.ts';

const axiosInstance = getAxiosInstance();

// --- Types (shared) ---
export type CustomModel = {
  id: string;
  data: {
    name: string;
    description: string;
    model: {
      name: string;
    };
    menu: {
      displayName: string;
    };
  };
  visibility: string;
};

export type CustomModelEnrichment = {
  poster?: string;
  creator?: string;
  license?: string;
  github?: string;
};

export interface UserCustomModelsState {
  userCustomModels: CustomModel[];
  userCustomModelsEnrichmentError: { [modelId: string]: boolean };
  userCustomModelsEnrichmentLoading: { [modelId: string]: boolean };
  userCustomModelsEnrichments: { [modelId: string]: CustomModelEnrichment | undefined };
  userCustomModelsError: boolean;
  userCustomModelsLoaded: boolean;
  userCustomModelsLoading: boolean;
}

export interface UserCustomModelsActions {
  deleteUserCustomModel: (modelId: string) => Promise<void>;
  editUserCustomModel: (
    modelId: string,
    editableDetails: { name: string; description: string; visibility: string },
  ) => Promise<void>;
  fetchAllUserCustomModelsEnrichments: () => Promise<void>;
  fetchUserCustomModels: () => Promise<void>;
  reloadUserCustomModels: () => Promise<void>;
}

export interface CommunityCustomModelsState {
  communityCustomModels: CustomModel[];
  communityCustomModelsEnrichmentError: { [modelId: string]: boolean };
  communityCustomModelsEnrichmentLoading: { [modelId: string]: boolean };
  communityCustomModelsEnrichments: { [modelId: string]: CustomModelEnrichment | undefined };
  communityCustomModelsError: boolean;
  communityCustomModelsLoaded: boolean;
  communityCustomModelsLoading: boolean;
}

export interface CommunityCustomModelsActions {
  fetchAllCommunityCustomModelsEnrichments: () => Promise<void>;
  fetchCommunityCustomModels: () => Promise<void>;
  reloadCommunityCustomModels: () => Promise<void>;
  saveCommunityCustomModelToMyModels: (modelId: string) => Promise<void>;
}

export type UserCustomModelsSlice = UserCustomModelsState & UserCustomModelsActions;

export type CommunityCustomModelsSlice = CommunityCustomModelsState & CommunityCustomModelsActions;

export type CustomModelsStore = UserCustomModelsSlice & CommunityCustomModelsSlice;

// --- User Custom Models Slice ---
const userLogger = log.getLogger('userCustomModels');

const createUserCustomModelsSlice: StateCreator<CustomModelsStore, [], [], UserCustomModelsSlice> = (set, get) => ({
  userCustomModels: [],
  userCustomModelsEnrichments: {},
  userCustomModelsLoaded: false,
  userCustomModelsLoading: false,
  userCustomModelsError: false,
  userCustomModelsEnrichmentLoading: {},
  userCustomModelsEnrichmentError: {},

  deleteUserCustomModel: async (modelId: string) => {
    try {
      await axiosInstance.delete(`/v1/user/node-definitions/${modelId}`);
      set((state: CustomModelsStore) => ({
        userCustomModels: state.userCustomModels.filter((model) => model.id !== modelId),
      }));
    } catch (error) {
      userLogger.error(`Error deleting user custom model ${modelId}:`, error);
    }
  },

  editUserCustomModel: async (
    modelId: string,
    editableDetails: { name: string; description: string; visibility: string },
  ) => {
    try {
      await axiosInstance.put(`/v1/user/node-definitions/${modelId}`, editableDetails);
      set((state: CustomModelsStore) => ({
        userCustomModels: state.userCustomModels.map((model) =>
          model.id === modelId
            ? {
                ...model,
                data: {
                  ...model.data,
                  description: editableDetails.description,
                  menu: {
                    ...model.data.menu,
                    displayName: editableDetails.name,
                  },
                },
                visibility: editableDetails.visibility,
              }
            : model,
        ),
      }));
    } catch (error) {
      userLogger.error(`Error editing user custom model ${modelId}:`, error);
    }
  },

  fetchUserCustomModels: async () => {
    set({ userCustomModelsLoading: true, userCustomModelsError: false });
    try {
      const response = await axiosInstance.get<CustomModel[]>('/v1/user/node-definitions');
      set({ userCustomModels: response.data, userCustomModelsLoaded: true, userCustomModelsLoading: false });
    } catch (error) {
      userLogger.error('Error fetching user custom models:', error);
      set({ userCustomModelsError: true, userCustomModelsLoading: false });
    }
  },

  fetchAllUserCustomModelsEnrichments: async () => {
    const { userCustomModels } = get();
    await fetchAllCustomModelsEnrichments({
      models: userCustomModels,
      setEnrichmentLoading: (updater) =>
        set((state: CustomModelsStore) => ({
          userCustomModelsEnrichmentLoading: updater(state.userCustomModelsEnrichmentLoading),
        })),
      setEnrichmentError: (updater) =>
        set((state: CustomModelsStore) => ({
          userCustomModelsEnrichmentError: updater(state.userCustomModelsEnrichmentError),
        })),
      setEnrichments: (modelId, enrichment) =>
        set((state: CustomModelsStore) => ({
          userCustomModelsEnrichments: {
            ...state.userCustomModelsEnrichments,
            [modelId]: enrichment,
          },
        })),
      logger: userLogger,
    });
  },

  reloadUserCustomModels: async () => {
    set({
      userCustomModelsLoaded: false,
      userCustomModelsLoading: false,
      userCustomModelsError: false,
      userCustomModelsEnrichments: {},
      userCustomModelsEnrichmentLoading: {},
      userCustomModelsEnrichmentError: {},
    });
    await get().fetchUserCustomModels();
    await get().fetchAllUserCustomModelsEnrichments();
  },
});

// --- Community Custom Models Slice ---
const communityLogger = log.getLogger('communityCustomModels');

const createCommunityCustomModelsSlice: StateCreator<CustomModelsStore, [], [], CommunityCustomModelsSlice> = (
  set,
  get,
) => ({
  communityCustomModels: [],
  communityCustomModelsEnrichments: {},
  communityCustomModelsLoaded: false,
  communityCustomModelsLoading: false,
  communityCustomModelsError: false,
  communityCustomModelsEnrichmentLoading: {},
  communityCustomModelsEnrichmentError: {},

  fetchCommunityCustomModels: async () => {
    set({ communityCustomModelsLoading: true, communityCustomModelsError: false });
    try {
      const response = await axiosInstance.get<CustomModel[]>('/v1/node-definitions/models/public');
      set({
        communityCustomModels: response.data,
        communityCustomModelsLoaded: true,
        communityCustomModelsLoading: false,
      });
    } catch (error) {
      communityLogger.error('Error fetching community custom models:', error);
      set({ communityCustomModelsError: true, communityCustomModelsLoading: false });
    }
  },

  fetchAllCommunityCustomModelsEnrichments: async () => {
    const { communityCustomModels } = get();
    await fetchAllCustomModelsEnrichments({
      models: communityCustomModels,
      setEnrichmentLoading: (updater) =>
        set((state: CustomModelsStore) => ({
          communityCustomModelsEnrichmentLoading: updater(state.communityCustomModelsEnrichmentLoading),
        })),
      setEnrichmentError: (updater) =>
        set((state: CustomModelsStore) => ({
          communityCustomModelsEnrichmentError: updater(state.communityCustomModelsEnrichmentError),
        })),
      setEnrichments: (modelId, enrichment) =>
        set((state: CustomModelsStore) => ({
          communityCustomModelsEnrichments: {
            ...state.communityCustomModelsEnrichments,
            [modelId]: enrichment,
          },
        })),
      logger: communityLogger,
    });
  },

  reloadCommunityCustomModels: async () => {
    set({
      communityCustomModelsLoaded: false,
      communityCustomModelsLoading: false,
      communityCustomModelsError: false,
      communityCustomModelsEnrichments: {},
      communityCustomModelsEnrichmentLoading: {},
      communityCustomModelsEnrichmentError: {},
    });
    await get().fetchCommunityCustomModels();
    await get().fetchAllCommunityCustomModelsEnrichments();
  },

  saveCommunityCustomModelToMyModels: async (modelId: string) => {
    try {
      await axiosInstance.post(`/v1/user/node-definitions/${modelId}/clone`);
    } catch (error) {
      communityLogger.error(`Error saving community custom model ${modelId} to my models:`, error);
    }
  },
});

// --- Helper for enrichment fetching ---
async function fetchAllCustomModelsEnrichments({
  models,
  setEnrichmentLoading,
  setEnrichmentError,
  setEnrichments,
  logger,
}: {
  models: CustomModel[];
  setEnrichmentLoading: (updater: (prev: { [modelId: string]: boolean }) => { [modelId: string]: boolean }) => void;
  setEnrichmentError: (updater: (prev: { [modelId: string]: boolean }) => { [modelId: string]: boolean }) => void;
  setEnrichments: (modelId: string, enrichment: CustomModelEnrichment) => void;
  logger: ReturnType<typeof log.getLogger>;
}) {
  // Initialize loading and error states
  setEnrichmentLoading((prev) => {
    const next = { ...prev };
    models.forEach((model) => {
      next[model.id] = true;
    });
    return next;
  });
  setEnrichmentError((prev) => {
    const next = { ...prev };
    models.forEach((model) => {
      next[model.id] = false;
    });
    return next;
  });

  await Promise.all(
    models.map(async (model: CustomModel) => {
      try {
        const res = await axiosInstance.get<{
          cover_image_url: string;
          owner: string;
          license_url: string;
          github_url: string;
        }>(`/v1/models/replicate/${model.data.model.name}`);
        setEnrichments(model.id, {
          poster: res.data.cover_image_url,
          creator: res.data.owner,
          license: res.data.license_url,
          github: res.data.github_url,
        });
        setEnrichmentLoading((prev) => ({ ...prev, [model.id]: false }));
      } catch (error) {
        logger.error(`Error fetching enrichment for model ${model.id}:`, error);
        setEnrichmentError((prev) => ({ ...prev, [model.id]: true }));
        setEnrichmentLoading((prev) => ({ ...prev, [model.id]: false }));
      }
    }),
  );
}

// --- Combined Store ---
export const useCustomModelsStore = create<CustomModelsStore>()(
  devtools(
    (...args) => ({
      ...createUserCustomModelsSlice(...args),
      ...createCommunityCustomModelsSlice(...args),
    }),
    {
      name: 'CustomModels store',
      enabled: import.meta.env.DEV,
    },
  ),
);
