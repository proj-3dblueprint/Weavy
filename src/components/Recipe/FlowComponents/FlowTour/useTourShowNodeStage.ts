import { useReactFlow } from 'reactflow';
import { useCallback } from 'react';
import type { AddNewNodeOptions } from '../../flowTypes';

const PROMPT_NODE_ID = 'jzXJ8QEfxQm2sZfvzu7q';
const PROMPT_NODE_INITIAL_DATA = {
  prompt: `A cinematic scene of a friendly monster playing with wires.
 The background is filled with lush greenery, and the entire scene is painted with a mix of bright and muted colors, giving it a whimsical feel.
 A text "My First Weavy" is prominently displayed in slightly uneven letters.`,
};

const TIMEOUT_MS = 300;
const FIT_VIEW_DURATION = 1000;

interface useTourShowNodeStageParams {
  addNewNode: (options: AddNewNodeOptions) => { id: string };
  getPromptNode: () => { id: string } | undefined;
  setIsNextStageAllowed: (allowed: boolean) => void;
}

export const useTourShowNodeStage = ({
  addNewNode,
  getPromptNode,
  setIsNextStageAllowed,
}: useTourShowNodeStageParams) => {
  const { fitView } = useReactFlow();

  const preHook = useCallback(() => {
    return new Promise<void>((resolve) => {
      const tryCreateAndFitNode = () => {
        const promptNode = getPromptNode();
        if (!promptNode) {
          addNewNode({
            action: { id: PROMPT_NODE_ID, initialData: PROMPT_NODE_INITIAL_DATA },
            dropX: -400,
            dropY: -400,
            fromCenter: true,
          });
        }

        setTimeout(() => {
          // Verify the node exists at timeout
          const verifyNode = getPromptNode();
          if (!verifyNode) {
            // If node doesn't exist, try again
            tryCreateAndFitNode();
            return;
          }

          setIsNextStageAllowed(false);
          fitView({ nodes: [verifyNode], maxZoom: 0.6, duration: FIT_VIEW_DURATION });
          // After fit view is done, allow next stage
          setTimeout(() => {
            setIsNextStageAllowed(true);
            resolve();
          }, FIT_VIEW_DURATION);
        }, TIMEOUT_MS);
      };

      tryCreateAndFitNode();
    });
  }, [addNewNode, fitView, getPromptNode, setIsNextStageAllowed]);

  return {
    preHook,
  };
};
