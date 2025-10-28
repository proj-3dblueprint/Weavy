import type { ReactNode, RefObject } from 'react';

export const getMaxHeight = (hasSearch: boolean, hasHelperText: boolean) => {
  const baseHeight = 334;
  if (hasSearch && hasHelperText) return `${baseHeight}px`;
  if (hasSearch) return `${baseHeight + 42}px`;
  if (hasHelperText) return `${baseHeight + 44}px`;
  return `${baseHeight + 86}px`;
};

interface OptionLike<T> {
  label: ReactNode;
  value: T;
}

export const isOptionLike = <T>(value: OptionLike<T> | T | null): value is OptionLike<T> => {
  return typeof value === 'object' && value !== null && 'label' in value;
};

export interface TriggerOptions {
  toggleOpen: () => void;
  isOpen: boolean;
  triggerRef: RefObject<HTMLElement>;
}
