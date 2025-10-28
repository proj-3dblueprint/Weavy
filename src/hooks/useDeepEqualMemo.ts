import isEqual from 'lodash/isEqual';
import { useRef } from 'react';

export function useDeepEqualMemo<T>(value: T) {
  const ref = useRef<T>(value);

  if (!isEqual(ref.current, value)) {
    ref.current = value;
  }

  return ref.current;
}
