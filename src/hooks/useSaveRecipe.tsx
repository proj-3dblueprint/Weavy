import { useCallback } from 'react';
import { useGetNodes, useGetEdges } from '@/components/Recipe/FlowContext';
import { useWorkflowStore, type SaveRecipeOptions } from '@/state/workflow.state';

export const useSaveRecipe = () => {
  const saveRecipe = useWorkflowStore((state) => state.saveRecipe);
  const getNodes = useGetNodes();
  const getEdges = useGetEdges();

  return useCallback(
    async (options?: Omit<SaveRecipeOptions, 'nodes' | 'edges'> & { saveFlowId?: string }, throwOnError = false) => {
      const nodes = getNodes();
      const edges = getEdges();

      try {
        await saveRecipe({ ...(options || {}), nodes, edges });
      } catch (error) {
        if (throwOnError) {
          throw error;
        }
      }
    },
    [getNodes, getEdges, saveRecipe],
  );
};
