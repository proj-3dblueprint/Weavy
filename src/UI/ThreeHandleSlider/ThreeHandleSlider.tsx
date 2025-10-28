import { Slider, styled } from '@mui/material';
import { useCallback } from 'react';
import { color } from '@/colors';
import { FlexCenVer } from '../styles';
import type { SyntheticEvent } from 'react';

const StyledSlider = styled(Slider)(() => ({
  '&.MuiSlider-root': {
    padding: '0px !important',
    '& .MuiSlider-rail': {
      transition: 'none !important',
      backgroundColor: color.Black64,
      height: 2,
    },
    '& .MuiSlider-track': {
      transition: 'none !important',
      display: 'none',
    },
    '& .MuiSlider-thumb': {
      transition: 'none !important',
      width: `10px !important`,
      height: `10px !important`,
      '&:hover, &.Mui-focusVisible, &.Mui-active': {
        boxShadow: 'none !important',
      },
    },
    '& .MuiSlider-thumb[data-index="0"]': {
      backgroundColor: `${color.Black100} !important`,
      border: `1px solid ${color.Black64} !important`,
    },
    '& .MuiSlider-thumb[data-index="1"]': {
      backgroundColor: `${color.Black40} !important`,
      border: `1px solid ${color.Black64} !important`,
    },
    '& .MuiSlider-thumb[data-index="2"]': {
      backgroundColor: `${color.White100} !important`,
      border: `1px solid ${color.Black64} !important`,
    },
  },
}));

interface ThreeHandleSliderProps {
  minValue: number;
  maxValue: number;
  middleValue: number;
  minLimit?: number;
  maxLimit?: number;
  step?: number;
  disabled?: boolean;
  onChange?: (values: { min: number; middle: number; max: number }, activeThumb: number) => void;
  onChangeCommitted?: (values: { min: number; middle: number; max: number }, activeThumb: number) => void;
}

function ThreeHandleSliderComponent({
  minValue,
  maxValue,
  middleValue,
  minLimit = 0,
  maxLimit = 255,
  step = 1,
  disabled = false,
  onChange,
  onChangeCommitted,
}: ThreeHandleSliderProps) {
  const handleChange = useCallback(
    (_event: Event | SyntheticEvent, newValues: number | number[], activeThumb?: number) => {
      if (!Array.isArray(newValues)) return;

      // Ensure values are properly ordered
      const [min, newMiddle, max] = newValues;

      // Prevent middle from going below min or above max
      const middle = Math.max(min, Math.min(max, newMiddle));

      // Only trigger onChange if values are different
      if (min !== minValue || middle !== middleValue || max !== maxValue) {
        onChange?.({ min, middle, max }, activeThumb ?? 0);
      }
    },
    [onChange, minValue, middleValue, maxValue],
  );

  const handleChangeCommitted = useCallback(
    (_event: Event | SyntheticEvent, newValues: number | number[], activeThumb?: number) => {
      if (!Array.isArray(newValues)) return;

      // Ensure values are properly ordered
      const [min, newMiddle, max] = newValues;

      // Prevent middle from going below min or above max
      const middle = Math.max(min, Math.min(max, newMiddle));

      onChangeCommitted?.({ min, middle, max }, activeThumb ?? 0);
    },
    [onChangeCommitted],
  );

  return (
    <FlexCenVer sx={{ width: '100%', px: 0.25 }}>
      <StyledSlider
        value={[minValue, middleValue, maxValue]}
        onChange={handleChange}
        onChangeCommitted={handleChangeCommitted}
        min={minLimit}
        max={maxLimit}
        step={step}
        disabled={disabled}
        marks={[]}
        disableSwap
      />
    </FlexCenVer>
  );
}

export default ThreeHandleSliderComponent;
