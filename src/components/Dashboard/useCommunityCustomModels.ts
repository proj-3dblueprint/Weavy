import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCustomModelsStore, type CustomModel, type CustomModelEnrichment } from '@/state/customModels.state';

interface CommunityCustomModelsState {
  loaded: boolean;
  loadingCommunityCustomModels: boolean;
  caughtError: boolean;
  getCommunityCustomModelEnrichmentLoading: (modelId: string) => boolean;

  communityCustomModels: CustomModel[];
  getCommunityCustomModelEnrichment: (modelId: string) => CustomModelEnrichment | undefined;

  saveCommunityCustomModelToMyModels: (modelId: string) => Promise<void>;
  reloadCommunityCustomModels: () => Promise<void>;
}

export const useCommunityCustomModels = (): CommunityCustomModelsState => {
  // Loading States
  const loaded = useCustomModelsStore((state) => state.communityCustomModelsLoaded);
  const loadingCommunityCustomModels = useCustomModelsStore((state) => state.communityCustomModelsLoading);
  const caughtError = useCustomModelsStore((state) => state.communityCustomModelsError);
  const enrichmentLoading = useCustomModelsStore(useShallow((state) => state.communityCustomModelsEnrichmentLoading));
  const getCommunityCustomModelEnrichmentLoading = (modelId: string) => enrichmentLoading[modelId];

  // Data
  const communityCustomModels = useCustomModelsStore(useShallow((state) => state.communityCustomModels));
  const customModelsEnrichments = useCustomModelsStore(useShallow((state) => state.communityCustomModelsEnrichments));
  const getCommunityCustomModelEnrichment = (modelId: string) => customModelsEnrichments[modelId];

  // Community Custom Model Management
  const saveCommunityCustomModelToMyModels = useCustomModelsStore((state) => state.saveCommunityCustomModelToMyModels);

  // Store Management
  const reloadCommunityCustomModels = useCustomModelsStore((state) => state.reloadCommunityCustomModels);

  useEffect(() => {
    void reloadCommunityCustomModels();
  }, [reloadCommunityCustomModels]);

  return {
    loaded,
    loadingCommunityCustomModels,
    caughtError,
    getCommunityCustomModelEnrichmentLoading,
    communityCustomModels,
    getCommunityCustomModelEnrichment,
    saveCommunityCustomModelToMyModels,
    reloadCommunityCustomModels,
  };
};
