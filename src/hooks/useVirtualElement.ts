import { useCallback, useState } from 'react';

export declare type VirtualElement = {
  getBoundingClientRect: () => DOMRect;
};

// This hook is used to create a virtual element that can be used to position a menu.
// This is a support hook for Popper.js.
export const useVirtualElement = (): [VirtualElement, (x: number, y: number) => void] => {
  const generateGetBoundingClientRect = useCallback((x = 0, y = 0): (() => DOMRect) => {
    return () => ({
      width: 0,
      height: 0,
      top: y,
      right: x,
      bottom: y,
      left: x,
      x: x,
      y: y,
      toJSON: () => '',
    });
  }, []);

  const [virtualElement, _setVirtualElement] = useState<VirtualElement>({
    getBoundingClientRect: generateGetBoundingClientRect(),
  });

  const setVirtualElement = useCallback(
    (x: number, y: number) => {
      _setVirtualElement({ getBoundingClientRect: generateGetBoundingClientRect(x, y) });
    },
    [generateGetBoundingClientRect, _setVirtualElement],
  );

  return [virtualElement, setVirtualElement];
};
