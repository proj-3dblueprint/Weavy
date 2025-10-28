import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCustomModelsStore, type CustomModel, type CustomModelEnrichment } from '@/state/customModels.state';

interface UserCustomModelsState {
  loaded: boolean;
  loadingUserCustomModels: boolean;
  caughtError: boolean;
  getUserCustomModelEnrichmentLoading: (modelId: string) => boolean;

  userCustomModels: CustomModel[];
  getUserCustomModelEnrichment: (modelId: string) => CustomModelEnrichment | undefined;

  deleteUserCustomModel: (modelId: string) => Promise<void>;
  editUserCustomModel: (
    modelId: string,
    editableDetails: { name: string; description: string; visibility: string },
  ) => Promise<void>;

  reloadUserCustomModels: () => Promise<void>;
}

export const useUserCustomModels = (): UserCustomModelsState => {
  // Loading States
  const loaded = useCustomModelsStore((state) => state.userCustomModelsLoaded);
  const loadingUserCustomModels = useCustomModelsStore((state) => state.userCustomModelsLoading);
  const caughtError = useCustomModelsStore((state) => state.userCustomModelsError);
  const enrichmentLoading = useCustomModelsStore(useShallow((state) => state.userCustomModelsEnrichmentLoading));
  const getUserCustomModelEnrichmentLoading = (modelId: string) => enrichmentLoading[modelId];

  // Data
  const userCustomModels = useCustomModelsStore(useShallow((state) => state.userCustomModels));
  const customModelsEnrichments = useCustomModelsStore(useShallow((state) => state.userCustomModelsEnrichments));
  const getUserCustomModelEnrichment = (modelId: string) => customModelsEnrichments[modelId];

  // User Custom Model Management
  const deleteUserCustomModel = useCustomModelsStore((state) => state.deleteUserCustomModel);
  const editUserCustomModel = useCustomModelsStore((state) => state.editUserCustomModel);

  // Store Management
  const reloadUserCustomModels = useCustomModelsStore((state) => state.reloadUserCustomModels);

  useEffect(() => {
    void reloadUserCustomModels();
  }, [reloadUserCustomModels]);

  return {
    loaded,
    loadingUserCustomModels,
    caughtError,
    getUserCustomModelEnrichmentLoading,
    userCustomModels,
    getUserCustomModelEnrichment,
    deleteUserCustomModel,
    editUserCustomModel,
    reloadUserCustomModels,
  };
};
