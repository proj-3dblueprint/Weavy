import { NodeId } from '@/designer/designer';

// recursively check if any nested object in nodeData contains file data object without id
export function containFileDataWithoutId(
  currentObject: any,
  nodeId: NodeId,
  path: string = '',
): boolean | { objectWithMissingId: any; path: string; nodeId: string } {
  function isFileDataObject(value) {
    return (
      typeof value === 'object' &&
      value !== null &&
      value.url &&
      (value.type === 'image' || value.type === 'video' || value.type === '3D' || value.type === 'audio')
    );
  }

  for (const pair of Object.entries(currentObject)) {
    const [key, value]: [string, any] = pair;
    const newPath = path ? `${path}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      if (isFileDataObject(value)) {
        const isMissingId = value.id === undefined || value.id === '' || value.id === null;
        if (isMissingId) {
          return {
            objectWithMissingId: value,
            path: newPath,
            nodeId,
          };
        }
      } else {
        const result = containFileDataWithoutId(value, nodeId, newPath);
        if (result !== false) {
          return result;
        }
      }
    }
  }

  return false;
}
