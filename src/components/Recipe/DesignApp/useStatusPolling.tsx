import { useEffect, useRef, useState, useCallback } from 'react';
import { getAxiosInstance } from '@/services/axiosConfig';
import type { DesignAppResult } from '@/types/design-app.types';

const axiosInstance = getAxiosInstance();
// Constants
const POLLING_INTERVAL = 1000;
const MAX_RETRY_ATTEMPTS = 3;

// Types
export type RunStatus = 'COMPLETED' | 'FAILED' | 'CANCELED' | 'RUNNING';

type RunStatusResponse = {
  status: RunStatus;
  progress: number;
  results: DesignAppResult[];
  error: string;
  outputCount?: number;
};

type StatusResponse = {
  runs: Record<string, RunStatusResponse>;
  userRemainingCredits?: number;
  remainingCredits?: number;
};

type StatusPollingParams = {
  addCurrentResults: (
    newResults: DesignAppResult[],
    userRemainingCredits?: number,
    workspaceRemainingCredits?: number,
  ) => void;
  recipeId: string;
  onDonePolling: () => void;
};

type PollingState = {
  isProcessing: boolean;
  progress: number;
  errorMessage?: string;
};

export const useStatusPolling = ({ addCurrentResults, recipeId, onDonePolling }: StatusPollingParams) => {
  const [pollingState, setPollingState] = useState<PollingState>({
    isProcessing: false,
    progress: 0,
  });
  const [runIdsToPoll, setRunIdsToPoll] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const [numberOfLoadingResults, setNumberOfLoadingResults] = useState(0);

  /**
   * Handles the status response and updates state accordingly
   */
  const handleStatusResponse = useCallback(
    (response: StatusResponse): { runId: string; outputCount: number }[] => {
      const remainingRuns: { runId: string; outputCount: number }[] = [];
      const { runs, userRemainingCredits, remainingCredits } = response;

      Object.entries(runs).forEach(([runId, status]) => {
        switch (status.status) {
          case 'COMPLETED':
            addCurrentResults(status.results, userRemainingCredits, remainingCredits);
            break;
          case 'FAILED':
            setPollingState((prev) => ({ ...prev, errorMessage: status.error }));
            break;
          case 'RUNNING':
            remainingRuns.push({ runId, outputCount: status.outputCount ?? 0 });
            break;
          // CANCELED status is handled implicitly by not adding to remainingRunIds
        }
      });

      const minProgress = Math.min(...Object.values(runs).map((status) => status.progress));
      setPollingState((prev) => ({ ...prev, progress: minProgress }));

      return remainingRuns;
    },
    [addCurrentResults],
  );

  /**
   * Main polling function
   */
  const pollStatus = useCallback(
    async (runIds: string[]) => {
      if (!runIds.length) return [];

      try {
        const response = await axiosInstance.get<StatusResponse>(
          `/v1/recipe-runs/recipes/${recipeId}/runs/status?runIds=${runIds.join(',')}`,
          { signal: abortControllerRef.current?.signal },
        );

        retryCountRef.current = 0;
        return handleStatusResponse(response.data);
      } catch (error) {
        if (error instanceof Error) {
          // Don't set error state if the request was aborted
          if (error.name === 'AbortError') return runIds.map((runId) => ({ runId, outputCount: 0 }));

          setPollingState((prev) => ({
            ...prev,
            errorMessage: error.message,
          }));
        } else {
          setPollingState((prev) => ({
            ...prev,
            errorMessage: 'An unexpected error occurred',
          }));
        }
        retryCountRef.current++;
        return runIds.map((runId) => ({ runId, outputCount: 0 }));
      }
    },
    [recipeId, handleStatusResponse],
  );

  // Polling effect
  useEffect(() => {
    if (!runIdsToPoll.length) return;

    let timeoutId: NodeJS.Timeout;
    abortControllerRef.current = new AbortController();
    let currentRunIds = [...runIdsToPoll];

    const poll = async () => {
      if (retryCountRef.current >= MAX_RETRY_ATTEMPTS) {
        setPollingState((prev) => ({ ...prev, isProcessing: false }));
        onDonePolling();
        return;
      }
      const remainingRuns = await pollStatus(currentRunIds);
      currentRunIds = remainingRuns.map((run) => run.runId);
      setNumberOfLoadingResults(remainingRuns.reduce((acc, curr) => acc + curr.outputCount, 0));
      if (currentRunIds.length && !abortControllerRef.current?.signal.aborted) {
        timeoutId = setTimeout(() => void poll(), POLLING_INTERVAL);
      } else {
        setPollingState((prev) => ({ ...prev, isProcessing: false }));
        onDonePolling();
      }
    };

    setPollingState((prev) => ({ ...prev, isProcessing: true }));
    void poll();

    return () => {
      abortControllerRef.current?.abort();
      clearTimeout(timeoutId);
    };
  }, [runIdsToPoll, pollStatus, onDonePolling]);

  /**
   * Starts polling for the given run IDs
   */
  const startPolling = useCallback((runIds: string[]) => {
    if (!runIds?.length) return;

    setPollingState({
      isProcessing: true,
      progress: 0,
      errorMessage: undefined,
    });
    setRunIdsToPoll(runIds);
  }, []);

  return {
    errorMessage: pollingState.errorMessage,
    isProcessing: pollingState.isProcessing,
    numberOfLoadingResults,
    progress: pollingState.progress,
    startPolling,
  };
};
