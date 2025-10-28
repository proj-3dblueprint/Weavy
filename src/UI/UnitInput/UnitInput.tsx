import { forwardRef, useCallback, useState } from 'react';
import { Input, InputProps } from '../Input/Input';

export interface UnitInputProps extends Omit<InputProps, 'value' | 'defaultValue'> {
  unit: string;
  value?: 'auto' | number;
  defaultValue?: 'auto' | number;
}

const addUnit = (value: unknown, unit: string) => {
  if (String(value).endsWith(unit) || value === 'auto') {
    return value;
  }
  return `${String(value)}${unit}`;
};

// The following input is used to input a number with a unit.
// It is a wrapper around the Input component with a unit label.
export const UnitInput = forwardRef<HTMLInputElement, UnitInputProps>(function UnitInput(
  { unit, onChange, onBlur, value, defaultValue, ...props },
  ref,
) {
  const [tempValue, setTempValue] = useState(addUnit(defaultValue ?? value ?? 0, unit));

  if (addUnit(value, unit) !== addUnit(tempValue, unit)) {
    setTempValue(addUnit(value, unit));
  }

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      event.target.value = value.replace(unit, '');
      setTempValue(value);
      onChange?.(event);
    },
    [onChange, unit],
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const value = event.target.value;
      event.target.value = value.replace(unit, '');
      setTempValue(addUnit(value, unit));
      onBlur?.(event);
    },
    [onBlur, unit],
  );

  return <Input {...props} onChange={handleChange} onBlur={handleBlur} ref={ref} value={tempValue} />;
});
