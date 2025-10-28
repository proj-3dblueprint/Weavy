import { useState, useEffect, ChangeEvent } from 'react';
import { Input } from '@/UI/Input/Input';
import { Flex } from '@/UI/styles';
import { StyledSlider, FullWidthBox } from './number-input-field.styled';

export const NumberInputField = ({
  inputKey,
  value,
  disabled,
  min,
  max,
  type,
  onChange,
}: NumberInputFieldProps): JSX.Element => {
  const [tempValue, setTempValue] = useState(`${value || 0}`);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => setTempValue(e.target.value); // Update temporary value

  useEffect(() => {
    setTempValue(`${value || 0}`);
  }, [value]);

  const submitNewValue = () => {
    let newValue = parseFloat(tempValue);
    if (isNaN(newValue)) {
      newValue = value;
    }
    if (newValue <= min) {
      newValue = min;
    }
    if (newValue >= max) {
      newValue = max;
    }
    if (type === 'integer') {
      newValue = Math.round(newValue);
    }

    setTempValue(String(newValue));
    onChange(inputKey, newValue);
  };

  return (
    <FullWidthBox>
      <Flex>
        <StyledSlider
          disabled={disabled}
          valueLabelDisplay="auto"
          value={value || 0}
          onChange={(e, newValue) => {
            setTempValue(String(newValue));
            onChange(inputKey, newValue);
          }}
          aria-labelledby="input-slider"
          min={min}
          max={max}
          step={type === 'integer' ? 1 : 0.1}
          size="small"
        />
        <Input
          sx={{ width: '42px' }}
          disabled={disabled}
          value={tempValue}
          size="small"
          onChange={handleInputChange}
          onBlur={submitNewValue}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              submitNewValue();
            }
          }}
          inputProps={{
            step: type === 'integer' ? 1 : 0.1,
            min,
            max,
            type: 'number',
            'aria-labelledby': 'input-slider',
          }}
        />
      </Flex>
    </FullWidthBox>
  );
};
