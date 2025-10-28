import { createElement } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { t } from 'i18next';
import { log } from '@/logger/logger';
import { getAxiosInstance } from '@/services/axiosConfig';
import { useGlobalStore } from '@/state/global.state';
import { WarningCircleIcon } from '@/UI/Icons';
import { I18N_KEYS } from '@/language/keys';
import type { ModelDefinition } from '@/types/api/modelDefinition';

const logger = log.getLogger('SettingsStore');
const axiosInstance = getAxiosInstance();

type LoadingState = 'initial' | 'loading' | 'loaded' | 'error';

interface SettingsState {
  workspaceModels: ModelDefinition[];
  workspaceModelsLoadingState: LoadingState;
  updatingModelIds: Set<string>;
  loadWorkspaceModels: (workspaceId: string, signal?: AbortSignal) => Promise<void>;
  updateModelAllowedStatus: (workspaceId: string, modelId: string, allowed: boolean) => Promise<void>;
  resetSettingsState: () => void;
}

const createInitialState = () => ({
  workspaceModels: [] as ModelDefinition[],
  workspaceModelsLoadingState: 'initial' as LoadingState,
  updatingModelIds: new Set<string>(),
});

export const useSettingsStore = create<SettingsState>()(
  devtools(
    (set, get) => ({
      ...createInitialState(),
      loadWorkspaceModels: async (workspaceId: string, signal?: AbortSignal) => {
        if (get().workspaceModelsLoadingState === 'loaded') {
          return;
        }
        set({ workspaceModelsLoadingState: 'loading' });
        try {
          const response = await axiosInstance.get<{ models: ModelDefinition[] }>(
            `/v1/workspaces/${workspaceId}/models`,
            {
              signal,
            },
          );
          set({ workspaceModels: response.data.models, workspaceModelsLoadingState: 'loaded' });
        } catch (error) {
          // Don't update state if request was cancelled
          if (signal?.aborted) {
            logger.info('Workspace models request was cancelled');
            return;
          }
          logger.error('Error loading workspace models', error);
          set({ workspaceModelsLoadingState: 'error' });
        }
      },
      updateModelAllowedStatus: async (workspaceId: string, modelId: string, isAllowed: boolean) => {
        // Optimistic update: Update UI immediately
        set((state) => ({
          workspaceModels: state.workspaceModels.map((m) => (m.modelId === modelId ? { ...m, isAllowed } : m)),
          updatingModelIds: new Set(state.updatingModelIds).add(modelId),
        }));

        try {
          await axiosInstance.put(`/v1/workspaces/${workspaceId}/models`, {
            models: [
              {
                modelId,
                isAllowed,
              },
            ],
          });
          set((state) => {
            const newUpdatingIds = new Set(state.updatingModelIds);
            newUpdatingIds.delete(modelId);
            return { updatingModelIds: newUpdatingIds };
          });
        } catch (error) {
          logger.error('Error updating model allowed status', error);
          // Revert optimistic update and show error snackbar
          set((state) => {
            const newUpdatingIds = new Set(state.updatingModelIds);
            newUpdatingIds.delete(modelId);

            return {
              workspaceModels: state.workspaceModels.map((m) =>
                m.modelId === modelId ? { ...m, isAllowed: !isAllowed } : m,
              ),
              updatingModelIds: newUpdatingIds,
            };
          });

          useGlobalStore.getState().updateSnackbarData({
            text: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.ERROR_UPDATING_APPROVED),
            isOpen: true,
            severity: 'error',
            icon: createElement(WarningCircleIcon, { width: 20, height: 20 }),
          });
        }
      },
      resetSettingsState: () => set(createInitialState()),
    }),
    {
      name: 'Settings Store',
      enabled: import.meta.env.DEV,
    },
  ),
);
