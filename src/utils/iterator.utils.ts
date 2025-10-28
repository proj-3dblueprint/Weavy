import { getListNodeOptions } from '@/utils/listNode';
import { FileKind, ParameterValue } from '@/designer/designer';
import type { BaseNodeData, ListSelectorData, MediaIteratorData } from '@/types/node';

/**
 * Generic utility to get iterator options for any iterator type.
 * Handles both list selectors (text iterators) and image iterators.
 *
 * @param iteratorData - The iterator node data (ListSelectorData or MediaIteratorData)
 * @returns Array of options/items that the iterator will iterate over
 */
export const getIteratorValues = (iteratorData: ListSelectorData | MediaIteratorData): string[] | FileKind[] => {
  // Handle list selector (text iterator)
  if (iteratorData.type === 'list_selector' || iteratorData.type === 'muxv2') {
    return getListNodeOptions(iteratorData as ListSelectorData);
  }

  // Handle image iterator
  if (iteratorData.type === 'media_iterator') {
    const mediaData = iteratorData as MediaIteratorData;
    const filesParameter = mediaData.files;
    const parameterValue = filesParameter.data as ParameterValue;
    return parameterValue.value as FileKind[];
  }
  return [];
};

export const isIterator = (nodeData: BaseNodeData & { isIterator?: boolean }) => {
  return nodeData.isIterator || nodeData.type === 'media_iterator';
};
