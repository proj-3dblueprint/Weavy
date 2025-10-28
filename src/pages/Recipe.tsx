import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { AxiosError, type AxiosResponse } from 'axios';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { log } from '@/logger/logger';
import Flow from '@/components/Recipe/Flow';
import { FlowProvider } from '@/components/Recipe/FlowContext';
import { getAxiosInstance } from '@/services/axiosConfig';
import { MediaGalleryProvider } from '@/components/Recipe/FlowComponents/MediaGalleryContext';
import { ConnectionProvider } from '@/components/Recipe/FlowComponents/FlowTour/ConnectionContext';
import { WasmProvider } from '@/components/Recipe/WasmContext';
import { useQueryParamsContext } from '@/contexts/QueryParamsContext';
import PreventWheelEvents from '@/components/Common/PreventWheelEvents';
import { useIsWorkflowLoading, useWorkflowStore } from '@/state/workflow.state';
import { NoRecipeAccessError } from '@/components/Common/Error/NoRecipeAccessError';
import { useDisableZoom } from '@/UI/AppContextMenu/useDisableZoom';
import { FlexRow } from '@/UI/styles';
import { PageLoader } from '@/components/Common/PageLoader/PageLoader';
import { color } from '@/colors';
import { SocketProvider } from '@/hooks/useSocket';
import { FlowRunProvider } from '@/components/Recipe/RunFlow/FlowRunContext';
import { useUpdateBatches } from '@/components/Recipe/RunFlow/batches.store';
import { ReloadAlert } from '@/UI/ReloadAlert/ReloadAlert';
import { I18N_KEYS } from '@/language/keys';
import type { Edge, Node } from '@/types/node';
import type { User } from '@/types/auth.types';
import type { Recipe } from '@/types/api/recipe';
import type { BatchRun } from '@/types/batch.types';

const logger = log.getLogger('Recipe');
const axiosInstance = getAxiosInstance();

function Recipe({ user }: { user: User | null }) {
  const params = useParams();
  const { queryParamVersion } = useQueryParamsContext();
  const recipeId = params.recipeId;
  const navigate = useNavigate();

  const [loadedNodes, setLoadedNodes] = useState<Node[]>([]);
  const [loadedEdges, setLoadedEdges] = useState<Edge[]>([]);
  const isLoadingRecipeRef = useRef(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useDisableZoom();

  /// permissions
  const [viewingVersionMode, setViewingVersionMode] = useState(false);

  // Workflow store
  const setIsLatestVersion = useWorkflowStore((state) => state.setIsLatestVersion);
  const setWorkflowRole = useWorkflowStore((state) => state.setWorkflowRole);
  const setRecipe = useWorkflowStore((state) => state.setRecipe);
  const recipeData = useWorkflowStore((state) => state.recipe);
  const recipeLoadingState = useWorkflowStore((state) => state.loadingStates.get('recipe-version'));
  const setLoadingState = useWorkflowStore((state) => state.setLoadingState);
  const loadNodeTypes = useWorkflowStore((state) => state.loadNodeTypes);
  const loadPrices = useWorkflowStore((state) => state.loadPrices);
  const nodeTypesLoadingState = useWorkflowStore((state) => state.loadingStates.get('node-types'));
  const modelPricesLoadingState = useWorkflowStore((state) => state.loadingStates.get('model-prices'));
  const { t } = useTranslation();

  // Batches store
  const setBatchRuns = useUpdateBatches();

  const setIsLoadingRecipe = useCallback(
    (isLoading: boolean) => {
      isLoadingRecipeRef.current = isLoading;
      setLoadingState('recipe-version', isLoading ? 'loading' : 'loaded');
    },
    [setLoadingState],
  );

  const getRecipe = useCallback(
    async (recipeIdToFetch: string) => {
      try {
        if (isLoadingRecipeRef.current) {
          return;
        }
        setIsLoadingRecipe(true);
        const version = queryParamVersion;
        let recipe: Recipe;
        let response: AxiosResponse<Recipe>;
        try {
          response = await axiosInstance.get<Recipe>(
            `/v1/recipes/${recipeIdToFetch}${version !== undefined ? `?version=${version}` : ''}`,
          );
          recipe = response.data;
        } catch (error) {
          if (error instanceof AxiosError && error.response && error.response.status === 403) {
            if (!user) {
              navigate(`/signin`, { state: { from: window.location.pathname } });
              return;
            }
            setIsUnauthorized(true);
            setIsLoadingRecipe(false);
            return;
          }
          throw error;
        }
        if (!recipe) {
          throw new Error('Recipe returned empty response', {
            cause: {
              recipeResponse: response,
              recipeId: recipeIdToFetch,
              version,
            },
          });
        }
        setLoadedNodes(recipe.nodes || []);
        setLoadedEdges(recipe.edges || []);
        if (recipe.batchRuns) {
          setBatchRuns(
            recipe.batchRuns.reduce(
              (acc, batchRun) => {
                acc[batchRun.batchId] = batchRun;
                return acc;
              },
              {} as Record<string, BatchRun>,
            ),
          );
        }
        setIsLoadingRecipe(false);

        /// setting permissions
        setWorkflowRole('guest');
        if (user && recipe.owner === user.uid) {
          if (version !== undefined && version !== recipe.latestVersion.version) {
            setViewingVersionMode(true); // deprecated
            setIsLatestVersion(false);
          } else {
            setWorkflowRole('editor');
          }
        }

        setRecipe({
          id: recipeIdToFetch,
          name: recipe.name,
          poster: recipe.poster,
          visibility: recipe.visibility,
          publishedVersions: recipe.publishedVersions,
          latestPublishedVersion: recipe.latestPublishedVersion,
          version: recipe.version,
          designAppMetadata: recipe.designAppMetadata,
          updatedAt: recipe.updatedAt,
          v3: recipe.v3,
          sections: recipe.sections,
        });
      } catch (error) {
        logger.error('Error getting flows', error);
        setIsLoadingRecipe(false);
        if (error instanceof AxiosError && error.response && [404, 403].includes(error.response.status)) {
          navigate('/');
        }
      }
    },
    [
      navigate,
      queryParamVersion,
      setBatchRuns,
      setIsLatestVersion,
      setIsLoadingRecipe,
      setRecipe,
      setWorkflowRole,
      user,
    ],
  );

  useEffect(() => {
    if (recipeId && !isLoadingRecipeRef.current) {
      void getRecipe(recipeId);
    }
  }, [getRecipe, recipeId]);

  useEffect(() => {
    if (user && nodeTypesLoadingState === 'initial') {
      void loadNodeTypes();
    }
  }, [loadNodeTypes, nodeTypesLoadingState, user]);

  useEffect(() => {
    if (user && modelPricesLoadingState === 'initial') {
      void loadPrices();
    }
  }, [loadPrices, modelPricesLoadingState, user]);

  // Update page title when recipe loads and restore when component unmounts
  useEffect(() => {
    if (recipeData?.name) {
      document.title = recipeData.name;
    }

    return () => {
      document.title = t(I18N_KEYS.GENERAL.PAGE_TITLE);
    };
  }, [recipeData?.name, t]);

  if (isUnauthorized) {
    return <NoRecipeAccessError />;
  }

  if (
    recipeLoadingState !== 'loaded' ||
    (user && (nodeTypesLoadingState !== 'loaded' || modelPricesLoadingState !== 'loaded'))
  ) {
    return null;
  }

  if (!recipeId) {
    return <Navigate to="/" />;
  }

  return (
    <>
      <WasmProvider>
        <FlowProvider nodes={loadedNodes} edges={loadedEdges}>
          <MediaGalleryProvider>
            <ReactFlowProvider>
              <ConnectionProvider>
                <SocketProvider>
                  <FlowRunProvider recipeId={recipeId}>
                    <Flow recipeId={recipeId} user={user} viewingVersionMode={viewingVersionMode} />
                  </FlowRunProvider>
                </SocketProvider>
              </ConnectionProvider>
            </ReactFlowProvider>
          </MediaGalleryProvider>
        </FlowProvider>
      </WasmProvider>
      <ReloadAlert />
    </>
  );
}

const WrappedRecipe = ({ user }: { user: User | null }) => {
  const isWorkflowLoading = useIsWorkflowLoading();
  return (
    <PreventWheelEvents sx={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%' }}>
      <FlexRow sx={{ width: '100%', height: '100%' }}>
        <Box sx={{ width: '100%', height: '100%', position: 'relative', backgroundColor: color.Black100 }} id="canvas">
          <Recipe user={user} />
          <AnimatePresence>
            {isWorkflowLoading && (
              <motion.div
                key="recipe-page-loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <PageLoader />
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </FlexRow>
    </PreventWheelEvents>
  );
};

export { WrappedRecipe as Recipe };
