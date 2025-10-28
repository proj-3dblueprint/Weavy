import { useCallback } from 'react';
import { create, type StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { HttpStatusCode, isAxiosError } from 'axios';
import { log } from '@/logger/logger';
import { getAxiosInstance } from '@/services/axiosConfig';
// import { createQueueFunction } from '@/utils/actionQueue';
import {
  DEFAULT_DILATION_EROSION_DATA,
  DEFAULT_LEVELS_DATA,
  DEFAULT_LIST_SELECTOR_DATA,
  DEFAULT_LIST_SELECTOR_ITERATOR_DATA,
  DEFAULT_NUMBER_SELECTOR_DATA,
  DEFAULT_IMAGE_ITERATOR_DATA,
  type Edge,
  type Node,
} from '@/types/node';
import { sanitizeRecipe } from '@/components/Nodes/Utils';
import { track } from '@/utils/analytics';
import { TrackTypeEnum } from '@/hooks/useAnalytics';
import { RecipeVisibilityType } from '@/enums/recipe-visibility-type';
import type { Recipe } from '@/types/api/recipe';
import type { NodeDefinition } from '@/types/api/nodeDefinition';
import type { ModelPrice, ModelPricing } from '@/types/api/modelPrice';
import type { InvalidConnectionOptions } from '@/components/Recipe/Views/FlowView';
import type { User } from '@/types/auth.types';

const logger = log.getLogger('WorkflowStore');
const axiosInstance = getAxiosInstance();

export type WorkflowRole = 'guest' | 'editor';

export type WorkflowRecipe = Pick<
  Recipe,
  | 'designAppMetadata'
  | 'id'
  | 'latestPublishedVersion'
  | 'name'
  | 'poster'
  | 'publishedVersions'
  | 'sections'
  | 'updatedAt'
  | 'v3'
  | 'version'
  | 'visibility'
>;

function parsePrices(modelPrices: ModelPricing): ModelPricesMaps {
  const modelPricesMaps = {
    modelsByType: new Map<string, ModelPrice[]>(),
    modelsByName: new Map<string, ModelPrice[]>(),
    defaultPrice: modelPrices.defaultPrice,
  };

  for (const model of modelPrices.prices) {
    // Index by modelType
    if (model.modelType) {
      const currentModelsByType: ModelPrice[] = modelPricesMaps.modelsByType.get(model.modelType) || [];
      currentModelsByType.push(model);
      modelPricesMaps.modelsByType.set(model.modelType, currentModelsByType);
    }

    // Index by modelName (for Replicate models)
    if (model.modelName) {
      const currentModelsByName: ModelPrice[] = modelPricesMaps.modelsByName.get(model.modelName) || [];
      currentModelsByName.push(model);
      modelPricesMaps.modelsByName.set(model.modelName, currentModelsByName);
    }
  }
  return modelPricesMaps;
}

type WorkflowLoadingKeys = 'recipe-version' | 'node-types' | 'wasm' | 'flow-graph' | 'model-prices';
const WORKFLOW_LOADING_KEYS: WorkflowLoadingKeys[] = [
  'recipe-version',
  'node-types',
  'wasm',
  'flow-graph',
  'model-prices',
];

// --- Data Slice ---
export interface ModelPricesMaps {
  modelsByType: Map<string, ModelPrice[]>;
  modelsByName: Map<string, ModelPrice[]>;
  defaultPrice: number;
}

type LoadingState = 'initial' | 'loading' | 'loaded' | 'error';

interface WorkflowDataState {
  _isSaving: boolean;
  isLatestVersion: boolean;
  loadingStates: Map<WorkflowLoadingKeys, LoadingState>;
  modelPricesMaps: ModelPricesMaps;
  nodeTypes: NodeDefinition[];
  recipe: WorkflowRecipe;
  workflowRole: WorkflowRole;
}

export interface SaveRecipeOptions extends Pick<Partial<Recipe>, 'poster' | 'designAppMetadata'> {
  nodes: Node[];
  edges: Edge[];
  saveFlowId?: string;
}

interface WorkflowDataActions {
  addNodeType: (nodeType: NodeDefinition) => void;
  deleteSharedUser: (userId: string) => Promise<void>;
  loadNodeTypes: () => Promise<void>;
  loadPrices: () => Promise<void>;
  publishDesignApp: () => Promise<void>;
  renameRecipe: (newName: string) => Promise<void>;
  resetWorkflowState: () => void;
  saveRecipe: (options: SaveRecipeOptions) => Promise<void>;
  setIsLatestVersion: (isLatestVersion: boolean) => void;
  setLoadingState: (key: WorkflowLoadingKeys, value: LoadingState) => void;
  setRecipe: (recipe: WorkflowRecipe) => void;
  setRecipePoster: (posterUrl: string) => Promise<void>;
  setWorkflowRole: (role: WorkflowRole) => void;
  shareRecipe: (emails: string[]) => Promise<{ users: User[] }>;
  updateRecipeVisibility: (newVisibility: RecipeVisibilityType) => Promise<void>;
}

export type WorkflowDataSlice = WorkflowDataState & WorkflowDataActions;

const DEFAULT_NODE_TYPES: NodeDefinition[] = [
  {
    id: 'levels',
    type: 'levels',
    data: DEFAULT_LEVELS_DATA,
    isModel: false,
    owner: null,
    visibility: 'public',
  },
  {
    id: 'dilation_erosion',
    type: 'dilation_erosion',
    data: DEFAULT_DILATION_EROSION_DATA,
    isModel: false,
    owner: null,
    visibility: 'public',
  },
  {
    id: 'number_selector',
    type: 'number_selector',
    data: DEFAULT_NUMBER_SELECTOR_DATA,
    isModel: false,
    owner: null,
    visibility: 'public',
  },
  {
    id: 'text_iterator',
    type: 'muxv2',
    data: DEFAULT_LIST_SELECTOR_ITERATOR_DATA,
    isModel: false,
    owner: null,
    visibility: 'public',
  },
  {
    id: 'K4Bi14QsmaOKQMHpZstoClone',
    type: 'muxv2',
    data: DEFAULT_LIST_SELECTOR_DATA,
    isModel: false,
    owner: null,
    visibility: 'public',
  },
  {
    id: 'image_iterator',
    type: 'media_iterator',
    data: DEFAULT_IMAGE_ITERATOR_DATA,
    isModel: false,
    owner: null,
    visibility: 'public',
  },
];

// Initial state factory functions
const createInitialWorkflowDataState = (): WorkflowDataState => ({
  _isSaving: false,
  isLatestVersion: true,
  loadingStates: new Map(WORKFLOW_LOADING_KEYS.map((key) => [key, 'initial'])),
  modelPricesMaps: {} as ModelPricesMaps,
  nodeTypes: DEFAULT_NODE_TYPES,
  recipe: {} as WorkflowRecipe,
  workflowRole: 'guest',
});

const createInitialWorkflowUiState = (): WorkflowUiState => ({
  isGalleryParamsOpen: false,
  reactFlowContainerRect: undefined,
  workflowError: undefined,
  highlightedGroupId: null,
});

const createInitialWorkflowEdgesState = (): WorkflowEdgesState => ({
  invalidConnection: null,
});

const createInitialWorkflowNodeValidationState = (): WorkflowNodeValidationState => ({
  nodeValidation: {},
});

const createWorkflowDataSlice: StateCreator<WorkflowState, [], [], WorkflowDataSlice> = (set, get) => {
  return {
    // State
    ...createInitialWorkflowDataState(),
    // Actions
    addNodeType: (nodeType: NodeDefinition) => set((state) => ({ nodeTypes: [...state.nodeTypes, nodeType] })),
    deleteSharedUser: async (userId: string) => {
      const response = await axiosInstance.delete<{ recipeUpdatedAt: string }>(
        `/v1/recipes/${get().recipe.id}/users/${userId}`,
      );
      set((state) => ({
        recipe: { ...state.recipe, updatedAt: response.data.recipeUpdatedAt || new Date().toISOString() },
      }));
    },
    loadNodeTypes: async () => {
      if (get().loadingStates.get('node-types') === 'loaded') {
        return;
      }
      get().setLoadingState('node-types', 'loading');
      try {
        const [publicNodeTypesResponse, userNodeTypesResponse] = await Promise.all([
          axiosInstance.get<NodeDefinition[]>('/v1/node-definitions/public'),
          axiosInstance.get<NodeDefinition[]>('/v1/node-definitions/user'),
        ]);
        const publicNodeTypes = publicNodeTypesResponse.data;
        const userNodeTypes = userNodeTypesResponse.data;
        const allNodeTypes = DEFAULT_NODE_TYPES.concat(publicNodeTypes).concat(userNodeTypes);
        set({ nodeTypes: allNodeTypes });
        get().setLoadingState('node-types', 'loaded');
      } catch (error) {
        logger.error('Error loading node types', error);
        get().setLoadingState('node-types', 'error');
      }
    },
    loadPrices: async () => {
      if (get().loadingStates.get('model-prices') === 'loaded') {
        return;
      }
      get().setLoadingState('model-prices', 'loading');
      try {
        const modelPrices = await axiosInstance.get<ModelPricing>('/v1/models/prices');
        set({ modelPricesMaps: parsePrices(modelPrices.data) });
        get().setLoadingState('model-prices', 'loaded');
      } catch (error) {
        logger.error('Error loading model prices', error);
        get().setLoadingState('model-prices', 'error');
      }
    },
    publishDesignApp: async () => {
      const response = await axiosInstance.post<Recipe>(`/v1/recipes/${get().recipe.id}/publish`);
      set((state) => ({
        recipe: {
          ...state.recipe,
          latestPublishedVersion: response.data.latestPublishedVersion,
          publishedVersions: response.data.publishedVersions,
          version: response.data.latestVersion.version,
          updatedAt: response.data.updatedAt,
        },
      }));
    },
    renameRecipe: async (newName: string) => {
      const response = await axiosInstance.put<{ recipeUpdatedAt: string }>(`/v1/recipes/${get().recipe.id}`, {
        name: newName,
      });
      set((state) => ({
        recipe: {
          ...state.recipe,
          name: newName,
          updatedAt: response.data.recipeUpdatedAt || new Date().toISOString(),
        },
      }));
    },
    saveRecipe: async (options: SaveRecipeOptions) => {
      const { workflowRole, recipe: currentRecipe } = get();
      if (workflowRole !== 'editor') {
        return;
      }

      if (options.nodes.length === 0) {
        logger.info('Save blocked: empty nodes array', {
          saveFlowId: options.saveFlowId,
          workflowRole,
          edgesCount: options.edges.length,
        });
        return;
      }

      if (get()._isSaving) {
        return;
      }
      set({ _isSaving: true });

      const { nodes, edges } = sanitizeRecipe(options.nodes, options.edges);

      const designAppMetadata = options.designAppMetadata || undefined;

      const dataToSave = {
        nodes,
        edges,
        v3: currentRecipe.v3,
        posterImageUrl: options.poster || undefined,
        designAppMetadata,
        lastUpdatedAt: currentRecipe.updatedAt || new Date().toISOString(),
      };

      try {
        const response = await axiosInstance.post<Recipe>(`/v1/recipes/${currentRecipe.id}/save`, dataToSave);

        set((state) => ({
          _isSaving: false,
          recipe: {
            ...state.recipe,
            updatedAt: response.data.updatedAt || new Date().toISOString(),
          },
        }));
      } catch (error) {
        let message = 'Unknown error';
        let responseMessage: string | undefined = undefined;
        let response: unknown = undefined;
        let statusCode: number | undefined = undefined;

        const axiosError = isAxiosError<{ message: string }>(error) ? error : undefined;
        if (axiosError) {
          message = axiosError.message;
          responseMessage = axiosError.response?.data?.message;
          response = axiosError.response?.data;
          statusCode = axiosError.response?.status;
        }

        logger.error(`Saving recipe failed`, error, {
          saveFlowId: options.saveFlowId,
          recipeId: currentRecipe.id,
          message,
          responseMessage,
          response,
          statusCode,
          sentLastSavedAt: dataToSave.lastUpdatedAt,
          currentLastSavedAt: currentRecipe.updatedAt,
          nodesCount: nodes.length,
          edgesCount: edges.length,
          payloadSize: JSON.stringify(dataToSave).length,
          isAxiosError: !!axiosError,
          isConflict: statusCode === HttpStatusCode.Conflict,
        });

        let workflowError: WorkflowError = 'Unknown';
        if (axiosError?.response?.status === HttpStatusCode.Conflict) {
          workflowError = 'Conflict';
        }
        get().setWorkflowError(workflowError);
        track('save_error', { errorType: workflowError }, TrackTypeEnum.Product);

        set({ _isSaving: false });
        throw error;
      }
      // });
    },
    setIsLatestVersion: (isLatestVersion) => set({ isLatestVersion }),
    setLoadingState: (key: WorkflowLoadingKeys, value: LoadingState) => {
      set((state) => ({ loadingStates: new Map(state.loadingStates).set(key, value) }));
    },
    setRecipe: (recipe) => set({ recipe }),
    setRecipePoster: async (posterUrl) => {
      const response = await axiosInstance.put<{ updatedAt: string; poster: string }>(
        `/v1/recipes/${get().recipe.id}/poster`,
        {
          url: posterUrl,
        },
      );
      set((state) => ({
        recipe: {
          ...state.recipe,
          updatedAt: response.data.updatedAt || new Date().toISOString(),
          poster: response.data.poster,
        },
      }));
    },
    setWorkflowRole: (role) => set({ workflowRole: role }),
    shareRecipe: async (emails) => {
      track('share_workflow_modal_share_recipe', { emails }, TrackTypeEnum.BI);
      const response = await axiosInstance.post<{ users: User[]; recipeUpdatedAt: string }>(
        `/v1/recipes/${get().recipe.id}/share`,
        {
          emails,
        },
      );
      set((state) => ({
        recipe: {
          ...state.recipe,
          updatedAt: response.data.recipeUpdatedAt || new Date().toISOString(),
        },
      }));
      return { users: response.data.users };
    },
    updateRecipeVisibility: async (newVisibility) => {
      track('share_workflow_modal_visibility_selected', { visibility: newVisibility }, TrackTypeEnum.BI);
      try {
        const response = await axiosInstance.put<{ recipeUpdatedAt: string }>(`/v1/recipes/${get().recipe.id}`, {
          visibility: newVisibility,
        });
        set((state) => ({
          recipe: {
            ...state.recipe,
            visibility: newVisibility,
            updatedAt: response.data.recipeUpdatedAt || new Date().toISOString(),
          },
        }));
      } catch (e) {
        logger.error('Error updating recipe in updateRecipeVisibility.', e);
      }
    },
    resetWorkflowState: () => set(createInitialWorkflowDataState()),
  };
};

// --- UI Slice ---
type WorkflowError = 'Conflict' | 'Unknown';

interface WorkflowUiState {
  isGalleryParamsOpen: boolean;
  reactFlowContainerRect?: DOMRect;
  workflowError?: WorkflowError;
  highlightedGroupId: string | null;
}

interface WorkflowUiActions {
  setIsGalleryParamsOpen: (isOpen: boolean) => void;
  setReactFlowContainerRect: (rect: DOMRect) => void;
  getReactFlowContainerRect: () => DOMRect | undefined;
  setWorkflowError: (error: WorkflowError | undefined) => void;
  setHighlightedGroupId: (groupId: string) => void;
  clearHighlightedGroupId: () => void;
  resetWorkflowUiState: () => void;
}

export type WorkflowUiSlice = WorkflowUiState & WorkflowUiActions;

const createWorkflowUiSlice: StateCreator<WorkflowState, [], [], WorkflowUiSlice> = (set, get) => ({
  ...createInitialWorkflowUiState(),
  setIsGalleryParamsOpen: (isOpen: boolean) => set(() => ({ isGalleryParamsOpen: isOpen })),
  setReactFlowContainerRect: (rect: DOMRect) => set(() => ({ reactFlowContainerRect: rect })),
  getReactFlowContainerRect: () => get().reactFlowContainerRect,
  setWorkflowError: (error) => set(() => ({ workflowError: error })),
  setHighlightedGroupId: (groupId: string) => set(() => ({ highlightedGroupId: groupId })),
  clearHighlightedGroupId: () => set(() => ({ highlightedGroupId: null })),
  resetWorkflowUiState: () => set(() => createInitialWorkflowUiState()),
});

// --- Edges Slice ---
interface WorkflowEdgesState {
  invalidConnection: InvalidConnectionOptions | null;
}

interface WorkflowEdgesActions {
  setInvalidConnection: (invalidConnection: InvalidConnectionOptions | null) => void;
  resetWorkflowEdgesState: () => void;
}

export type WorkflowEdgesSlice = WorkflowEdgesState & WorkflowEdgesActions;

const createWorkflowEdgesSlice: StateCreator<WorkflowState, [], [], WorkflowEdgesSlice> = (set) => ({
  ...createInitialWorkflowEdgesState(),
  setInvalidConnection: (invalidConnection) => set(() => ({ invalidConnection })),
  resetWorkflowEdgesState: () => set(() => createInitialWorkflowEdgesState()),
});

// --- Node Validation Slice ---

type MissingRequiredInputError = {
  type: 'missingRequiredInputs';
  extraInfo: {
    keys: string[];
  };
};

type EmptyRequiredInputError = {
  type: 'emptyRequiredInputs';
  extraInfo: {
    keys: string[];
  };
};

// Currently we only have one type of validation, but we can add more in the future

type NodeValidationError = MissingRequiredInputError | EmptyRequiredInputError;

interface WorkflowNodeValidationState {
  nodeValidation: Record<string, Record<NodeValidationError['type'], NodeValidationError | undefined>>;
}

interface WorkflowNodeValidationActions {
  setNodeValidation: (nodeId: string, validation: NodeValidationError) => void;
  removeNodeValidationByType: (nodeId: string, type: NodeValidationError['type']) => void;
  resetWorkflowNodeValidationState: () => void;
}

export type WorkflowNodeValidationSlice = WorkflowNodeValidationState & WorkflowNodeValidationActions;

const createWorkflowNodeValidationSlice: StateCreator<WorkflowState, [], [], WorkflowNodeValidationSlice> = (set) => ({
  ...createInitialWorkflowNodeValidationState(),
  setNodeValidation: (nodeId, validation) =>
    set((state) => ({
      nodeValidation: {
        ...state.nodeValidation,
        [nodeId]: { ...(state.nodeValidation[nodeId] || {}), [validation.type]: validation },
      },
    })),
  removeNodeValidationByType: (nodeId, type) =>
    set((state) => ({
      nodeValidation: {
        ...state.nodeValidation,
        [nodeId]: { ...(state.nodeValidation[nodeId] || {}), [type]: undefined },
      },
    })),
  resetWorkflowNodeValidationState: () => set(() => createInitialWorkflowNodeValidationState()),
});

// --- Combined Store ---
export type WorkflowState = WorkflowDataSlice & WorkflowUiSlice & WorkflowEdgesSlice & WorkflowNodeValidationSlice;

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    (...args) => ({
      ...createWorkflowDataSlice(...args),
      ...createWorkflowUiSlice(...args),
      ...createWorkflowEdgesSlice(...args),
      ...createWorkflowNodeValidationSlice(...args),
    }),
    {
      name: 'Workflow Store',
      enabled: import.meta.env.DEV,
    },
  ),
);

export const useIsWorkflowLoading = () => {
  const isLoading = useWorkflowStore(
    useShallow((state) => Array.from(state.loadingStates.entries()).some(([_, value]) => value === 'loading')),
  );
  return isLoading;
};

export const useUserWorkflowRole = () => {
  const workflowRole = useWorkflowStore((state) => state.workflowRole);
  return workflowRole;
};

export const useModelPricesMaps = () => {
  const modelPricesMaps = useWorkflowStore((state) => state.modelPricesMaps);
  return modelPricesMaps;
};

export const useResetWorkflowState = () => {
  const resetWorkflowState = useWorkflowStore((state) => state.resetWorkflowState);
  const resetWorkflowUiState = useWorkflowStore((state) => state.resetWorkflowUiState);
  const resetWorkflowEdgesState = useWorkflowStore((state) => state.resetWorkflowEdgesState);
  const resetWorkflowNodeValidationState = useWorkflowStore((state) => state.resetWorkflowNodeValidationState);

  return useCallback(() => {
    resetWorkflowState();
    resetWorkflowUiState();
    resetWorkflowEdgesState();
    resetWorkflowNodeValidationState();
  }, [resetWorkflowState, resetWorkflowUiState, resetWorkflowEdgesState, resetWorkflowNodeValidationState]);
};
