import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import debounce from 'lodash/debounce';
import type { ThreeDProps } from '@/components/Common/ImageList/types';
import type { MediaAsset } from '@/types/api/assets';
import type { ModelBaseNodeData } from '@/types/nodes/model';
import type { BaseNodeData } from '@/types/node';

type TNodeData = BaseNodeData & {
  initialData?: MediaAsset | null;
  output?: {
    file?: Partial<MediaAsset> | null;
    image?: Partial<MediaAsset> | null;
  };
  pastedData?: {
    imageFile?: File;
  };
  result?: Partial<MediaAsset> | null;
  handles?: any;
} & ThreeDMNodeData;

interface CameraPosition {
  x: number;
  y: number;
  z: number;
}

export interface ThreeDMNodeData {
  is3DLocked?: boolean;
  cameraPosition?: CameraPosition;
}

export const use3DModelParameters = (
  id: string,
  data: ModelBaseNodeData | TNodeData,
  updateNodeData:
    | ((id: string, data: Partial<TNodeData>) => void)
    | ((id: string, data: Partial<ModelBaseNodeData>) => void),
): ThreeDProps => {
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>(data.cameraPosition || { x: -3, y: 4, z: 10 });
  const [is3DLocked, setIs3DLocked] = useState(data.is3DLocked || false);

  const setExported3DImage = useCallback(
    (image: Partial<MediaAsset>) => {
      updateNodeData(id, {
        output: {
          ...data.output,
          image,
        },
      });
    },
    [data.output, id, updateNodeData],
  );

  const debouncedUpdateNodeDataRef = useRef<ReturnType<typeof debounce> | null>(null);

  useEffect(() => {
    if (debouncedUpdateNodeDataRef.current) {
      debouncedUpdateNodeDataRef.current.cancel();
    }

    // Create new debounced function with current values
    debouncedUpdateNodeDataRef.current = debounce((position: CameraPosition) => {
      updateNodeData(id, {
        cameraPosition: position,
      });
    }, 1000);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (debouncedUpdateNodeDataRef.current) {
        debouncedUpdateNodeDataRef.current.cancel();
      }
    };
  }, [id]);

  const updateCameraPosition = useCallback((position: CameraPosition) => {
    setCameraPosition(position);
    if (debouncedUpdateNodeDataRef.current) {
      debouncedUpdateNodeDataRef.current(position);
    }
  }, []);

  const updateIs3DLocked = useCallback(
    (locked: boolean) => {
      setIs3DLocked(locked);
      updateNodeData(id, {
        is3DLocked: locked,
      });
    },
    [updateNodeData, id],
  );

  const threeDProps = useMemo<ThreeDProps>(
    () => ({
      cameraPosition,
      setCameraPosition: updateCameraPosition,
      is3DLocked,
      setIs3DLocked: updateIs3DLocked,
      setExported3DImage,
    }),
    [cameraPosition, updateCameraPosition, is3DLocked, updateIs3DLocked, setExported3DImage],
  );

  return threeDProps;
};
