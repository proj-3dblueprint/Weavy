import { useRef } from 'react';
import { useNumberInput } from '@/hooks/useNumberInput';
import { Input, InputProps } from '@/UI/Input/Input';

interface NumberInputProps
  extends Omit<InputProps, 'onSubmit' | 'onChange' | 'onFocus' | 'onBlur' | 'onKeyDownCapture' | 'value'> {
  value?: number;
  onSubmit: (value: number) => void;
  decimals?: 0 | 1 | 2;
}

export function NumberInput({ value, onSubmit, decimals, ...restProps }: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleBlur, handleFocus, handleKeyDown, handleChange, displayedValue } = useNumberInput({
    inputRef,
    value,
    onSubmit,
    decimals,
  });
  return (
    <Input
      value={displayedValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDownCapture={handleKeyDown}
      inputRef={inputRef}
      autoComplete="off"
      className="nodrag"
      {...restProps}
    />
  );
}
