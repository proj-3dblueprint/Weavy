import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import isEqual from 'lodash/isEqual';
import { getIteratorValues } from '@/utils/iterator.utils';
import { useModelPricesMaps } from '@/state/workflow.state';
import { getModelPrice, RELEVANT_PRICING_MODEL_PARAMS } from '@/components/Nodes/Utils';
import { useWithLoader } from './useWithLoader';
import type { PrecedingIteratorData } from './usePrecedingIterators';
import type { BaseNodeData } from '@/types/node';
import type { Model, ModelBaseNodeData } from '@/types/nodes/model';

const DEBOUNCE_WAIT = 300;

type CalculationRelevantData = {
  model: Model;
  params: Record<(typeof RELEVANT_PRICING_MODEL_PARAMS)[number], unknown>;
};

export const useGetCost = ({
  enabled = true,
  precedingIterators,
  calculateCost,
  selectedNodes,
  runs = 1,
}: {
  enabled?: boolean;
  precedingIterators: PrecedingIteratorData[] | null;
  calculateCost: () => Promise<number>;
  selectedNodes?: BaseNodeData[] | BaseNodeData;
  runs?: number;
}) => {
  const [cost, setCost] = useState<number>();
  const [calculationRelevantData, setCalculationRelevantData] = useState<CalculationRelevantData[]>([]);
  const [recalculate, setRecalculate] = useState(0);
  const timeoutRef = useRef<number>();
  const modelPricesMaps = useModelPricesMaps();

  // This is used to decide when we need to recalculate the cost
  const totalValues = useMemo(() => {
    if (!precedingIterators?.length) return 0;
    return precedingIterators.reduce((acc, iterator) => acc + getIteratorValues(iterator.iteratorNode.data).length, 0);
  }, [precedingIterators]);

  useEffect(() => {
    const nodesData = Array.isArray(selectedNodes) ? selectedNodes : [selectedNodes];
    const updatedCalculationRelevantData = nodesData
      .filter((data): data is ModelBaseNodeData & { model: Model } => !!(data as ModelBaseNodeData | undefined)?.model)
      .map(
        (data) =>
          ({
            model: data.model,
            params: Object.fromEntries(
              Object.entries(data.params || {}).filter(([key]) =>
                (RELEVANT_PRICING_MODEL_PARAMS as readonly string[]).includes(key),
              ),
            ),
          }) as CalculationRelevantData,
      );

    if (!isEqual(updatedCalculationRelevantData, calculationRelevantData)) {
      setCalculationRelevantData(updatedCalculationRelevantData);
    }
  }, [calculationRelevantData, selectedNodes]);

  useEffect(() => {
    // Force recalculation of the cost
    setRecalculate((prev) => prev + 1);
  }, [calculationRelevantData, totalValues]);

  const getPredictableCost = useCallback(() => {
    const runPrice = calculationRelevantData
      .map((data) => getModelPrice(data.model, modelPricesMaps, data.params) || 0)
      .reduce((a, b) => a + b, 0);
    return runPrice * runs;
  }, [calculationRelevantData, modelPricesMaps, runs]);

  const getCost = useCallback(async () => {
    if (precedingIterators?.length) {
      const cost = await calculateCost();
      setCost(cost);
      return cost;
    }
    const cost = getPredictableCost();
    setCost(cost);
    return cost;
  }, [calculateCost, getPredictableCost, precedingIterators?.length]);

  const { execute: fetchCost, isLoading } = useWithLoader(getCost);

  useEffect(() => {
    if (enabled) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timeout to debounce the request
      timeoutRef.current = window.setTimeout(() => {
        void fetchCost();
      }, DEBOUNCE_WAIT);
    }

    // Cleanup function to clear timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fetchCost, recalculate, enabled]);

  return { cost, isLoading, forceGetCost: getCost };
};
