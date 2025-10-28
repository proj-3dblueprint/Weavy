import posthog from 'posthog-js';
import { FF_TEXT_ITERATOR } from '@/consts/featureFlags';
import type { ListSelectorData } from '@/types/node';

const LIST_SELECTOR_ITERATOR_MAX_OPTIONS = 50;
let maxOptions: number | undefined;
const CACHE_TIMEOUT = 1000 * 60 * 60; // 1 hour
let lastUpdated = 0;

export const getListSelectorIteratorMaxOptions = () => {
  if (maxOptions !== undefined && Date.now() - lastUpdated < CACHE_TIMEOUT) {
    return maxOptions;
  }

  lastUpdated = Date.now();

  const payload = posthog.featureFlags.getFeatureFlagPayload(FF_TEXT_ITERATOR);
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'maxOptions' in payload &&
    typeof payload.maxOptions === 'number' &&
    payload.maxOptions > 0
  ) {
    maxOptions = payload.maxOptions;
    return maxOptions;
  }
  maxOptions = LIST_SELECTOR_ITERATOR_MAX_OPTIONS;
  return maxOptions;
};

export const getListNodeOptions = (listNode: ListSelectorData): string[] => {
  const nodeOptions = listNode.params?.options || [];
  if (!Array.isArray(nodeOptions)) return [];
  const options = nodeOptions.map((option) => (option ? String(option).trim() : ''));
  return options.slice(0, listNode.isIterator ? getListSelectorIteratorMaxOptions() : undefined).filter(Boolean);
};
