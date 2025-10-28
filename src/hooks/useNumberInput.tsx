import { ChangeEvent, KeyboardEvent, RefObject, useCallback, useState } from 'react';
import { roundToDecimalIfNotWhole } from '@/utils/numbers';

interface UseNumberInputProps {
  value?: number;
  inputRef: RefObject<HTMLInputElement>;
  onSubmit: (value: number) => void;
  parse?: (value: number) => number;
  format?: (value: number) => number;
  decimals?: 0 | 1 | 2;
}
export function useNumberInput({ inputRef, value, onSubmit, parse, format, decimals }: UseNumberInputProps) {
  const [tempValue, setTempValue] = useState<string>('');
  const [hasFocus, setHasFocus] = useState(false);

  const formatDisplayValue = useCallback(
    (value?: number) => {
      if (value === undefined || value === null || typeof value === 'string') return '';
      if (format) {
        return roundToDecimalIfNotWhole(format(Number(value)), decimals);
      } else {
        return roundToDecimalIfNotWhole(Number(value), decimals);
      }
    },
    [decimals, format],
  );

  const resetValue = useCallback(() => {
    setTempValue(formatDisplayValue(value));
  }, [value, formatDisplayValue]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setTempValue(e.target.value);
  }, []);

  const handleSubmit = useCallback(
    (val: string) => {
      const parsedValue = val !== '' && !Number.isNaN(Number(val)) ? Number(val) : null;
      if (parsedValue !== null) {
        onSubmit(parse ? parse(parsedValue) : parsedValue);
      } else {
        resetValue();
      }
    },
    [onSubmit, parse, resetValue],
  );

  const handleKeyDown = useCallback(
    (evt: KeyboardEvent<HTMLInputElement>) => {
      if (evt.code === 'Enter') {
        handleSubmit(tempValue);
      } else if (evt.code === 'Escape') {
        // press Escape -> cancel edit
        resetValue();
        setTimeout(() => inputRef.current?.blur());
      } else if (evt.code === 'z' && evt.getModifierState('Control')) {
        // stop Cmd+z propagation
        evt.stopPropagation();
        evt.preventDefault();
      } else if (evt.code === 'Backspace' || evt.code === 'Delete') {
        evt.stopPropagation();
      }
    },
    [handleSubmit, tempValue, resetValue, inputRef],
  );

  const handleFocus = useCallback(() => {
    setHasFocus(true);
    resetValue();
    setTimeout(() => inputRef.current?.select());
  }, [inputRef, resetValue]);

  const handleBlur = useCallback(() => {
    setHasFocus(false);
    handleSubmit(tempValue);
    setTempValue('');
  }, [handleSubmit, tempValue]);

  const displayedValue = hasFocus ? tempValue : formatDisplayValue(value);

  return {
    inputRef,
    handleBlur,
    handleFocus,
    handleKeyDown,
    handleChange,
    displayedValue,
  };
}
