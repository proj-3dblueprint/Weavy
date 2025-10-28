import { Typography } from '@mui/material';
import { useMemo, useRef, type ReactNode } from 'react';
import { Input } from '@/UI/Input/Input';
import { color } from '@/colors';
import { UnitInput, type UnitInputProps } from '@/UI/UnitInput/UnitInput';
import { useNumberInput } from '@/hooks/useNumberInput';

interface NumberInputProps {
  value: number;
  onSubmit: (value: number) => void;
  parse?: (value: number) => number;
  format?: (value: number) => number;
  decimals?: 0 | 1 | 2;
  disabled: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  unit?: string;
}

export function NumberInput({
  value,
  onSubmit,
  parse,
  format,
  disabled,
  suffix,
  decimals = 2,
  prefix,
  unit,
}: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleBlur, handleFocus, handleKeyDown, handleChange, displayedValue } = useNumberInput({
    inputRef,
    value,
    onSubmit,
    parse,
    format,
    decimals,
  });

  const inputProps = useMemo<Omit<UnitInputProps, 'unit' | 'value'>>(() => {
    return {
      disabled,
      size: 'small',
      onChange: handleChange,
      onBlur: handleBlur,
      onFocus: handleFocus,
      onKeyDownCapture: handleKeyDown,
      startAdornment: prefix ? (
        <Typography variant="body-sm-rg" sx={{ lineHeight: '1rem', height: '1rem' }} color={color.White64_T}>
          {prefix}
        </Typography>
      ) : null,
      endAdornment: suffix ? (
        <Typography variant="body-sm-rg" sx={{ lineHeight: '1rem', height: '1rem' }} color={color.White64_T}>
          {suffix}
        </Typography>
      ) : null,
      inputRef,
      'aria-autocomplete': 'none',
      autoComplete: 'off',
      sx: {
        width: '88px',
      },
    };
  }, [disabled, handleChange, handleBlur, handleFocus, handleKeyDown, prefix, suffix]);

  return unit ? (
    <UnitInput {...inputProps} unit={unit} value={Number(displayedValue)} />
  ) : (
    <Input {...inputProps} value={displayedValue} />
  );
}
