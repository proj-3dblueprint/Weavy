import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useHotkeysUniqueScope } from '@/hooks/useHotkeysUniqueScope';

type StringIdOption<T> = {
  id: string;
  label: ReactNode;
  value: T;
};

type FunctionIdOption<T> = {
  id: (value: T) => string;
  label: ReactNode;
  value: T;
};

export type Option<T> = StringIdOption<T> | FunctionIdOption<T>;

export interface UseSelectProps<T, Opt extends Option<T>> {
  noCloseOnSelect?: boolean;
  onChange: (option: Opt) => void;
  onClose?: () => void;
  onHighlightedOptionChange?: (option: Opt | null) => void;
  onOpen?: () => void;
  options: Opt[];
}

interface UseSelectReturn<T, Opt extends Option<T>> {
  clearHighlightedIndex: () => void;
  filteredOptions: Opt[];
  getIsSelected: (selectedOptions: Opt[], option: Opt) => boolean;
  getOptionId: (option: Opt) => string;
  handleItemSelected: (option: Opt) => void;
  highlightedIndex: number | null;
  isOpen: boolean;
  onPopupClose: () => void;
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
  toggleOpen: () => void;
  updateHighlightedIndex: (index: number | null) => void;
}

export const useSelect = <T, Opt extends Option<T>>({
  options,
  onHighlightedOptionChange,
  onClose,
  onOpen,
  onChange,
  noCloseOnSelect = false,
}: UseSelectProps<T, Opt>): UseSelectReturn<T, Opt> => {
  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getOptionId = useCallback((option: Option<T>) => {
    if (typeof option.id !== 'function') return String(option.id);
    return option.id(option.value);
  }, []);

  const updateIsOpen = useCallback((value: boolean) => {
    setIsOpen(value);
    isOpenRef.current = value;
  }, []);

  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  const clearHighlightedIndex = useCallback(() => {
    setHighlightedIndex(null);
    onHighlightedOptionChange?.(null);
  }, [onHighlightedOptionChange]);

  const updateHighlightedIndex = useCallback(
    (index: number | null) => {
      if (!isOpenRef.current) return;
      setHighlightedIndex(index);
      onHighlightedOptionChange?.(index !== null ? options[index] : null);
    },
    [onHighlightedOptionChange, options],
  );

  const onPopupClose = useCallback(() => {
    updateIsOpen(false);
    onClose?.();
    clearHighlightedIndex();
  }, [updateIsOpen, onClose, clearHighlightedIndex]);

  const onPopupOpen = useCallback(() => {
    updateIsOpen(true);
    onOpen?.();
  }, [onOpen, updateIsOpen]);

  const toggleOpen = useCallback(() => {
    if (isOpenRef.current) {
      onPopupClose();
    } else {
      onPopupOpen();
    }
  }, [onPopupClose, onPopupOpen]);

  const handleItemSelected = useCallback(
    (option: Opt) => {
      onChange(option);
      if (!noCloseOnSelect) {
        onPopupClose();
      }
    },
    [noCloseOnSelect, onChange, onPopupClose],
  );

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    return options.filter((option) => {
      if (typeof option.label === 'string') {
        return option.label.toLowerCase().includes(searchQuery.toLowerCase());
      }
      if (typeof option.value === 'string') {
        return option.value.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return false;
    });
  }, [options, searchQuery]);

  const getIsSelected = useCallback(
    (selectedOptions: Option<T>[], option: Option<T>) => {
      if (!selectedOptions.length) return false;
      const valueIds = selectedOptions.map(getOptionId);
      const optionId = getOptionId(option);
      return valueIds.includes(optionId);
    },
    [getOptionId],
  );

  const onArrowKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpenRef.current) return;
      if (event.key === 'ArrowDown') {
        updateHighlightedIndex(highlightedIndex === null ? 0 : (highlightedIndex + 1) % filteredOptions.length);
      } else if (event.key === 'ArrowUp') {
        updateHighlightedIndex(
          highlightedIndex === null
            ? filteredOptions.length - 1
            : (highlightedIndex - 1 + filteredOptions.length) % filteredOptions.length,
        );
      }
    },
    [isOpenRef, highlightedIndex, filteredOptions, updateHighlightedIndex],
  );

  const onEnterKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpenRef.current) return;
      event.preventDefault();
      if (
        highlightedIndex !== null &&
        highlightedIndex < filteredOptions.length &&
        highlightedIndex >= 0 &&
        filteredOptions[highlightedIndex]
      ) {
        handleItemSelected(filteredOptions[highlightedIndex]);
      }
    },
    [isOpenRef, highlightedIndex, filteredOptions, handleItemSelected],
  );

  useHotkeysUniqueScope('dropdown', isOpen);

  useHotkeys('ArrowDown, ArrowUp', onArrowKeyDown, { enabled: isOpen, scopes: 'dropdown' });
  useHotkeys('Enter', onEnterKeyDown, { enabled: isOpen, scopes: 'dropdown' });
  useHotkeys('Escape', onPopupClose, { enabled: isOpen, scopes: 'dropdown' });

  return {
    clearHighlightedIndex,
    filteredOptions,
    getOptionId,
    getIsSelected,
    handleItemSelected,
    highlightedIndex,
    isOpen,
    onPopupClose,
    searchQuery,
    setSearchQuery,
    toggleOpen,
    updateHighlightedIndex,
  };
};
