import { ReactNode } from 'react';
import {
  styled,
  ToggleButtonGroup,
  toggleButtonGroupClasses,
  ToggleButtonGroupProps,
  Tooltip,
  type TooltipProps,
} from '@mui/material';
import { color } from '@/colors';
import { PropertyToggleButton } from './PropertyToggleButton';

const StyledPropertyToggleButtonGroup = styled(ToggleButtonGroup)(() => ({
  display: 'flex',
  border: `1px solid ${color.White16_T}`,
  gap: '1px',
  [`& .${toggleButtonGroupClasses.grouped}`]: {
    border: 'none',
    '&:hover': {
      border: 'none',
    },
    [`&.${toggleButtonGroupClasses.disabled}`]: {
      border: 'none',
    },
  },
}));

export interface PropertyToggleButtonsProps<T extends string | number>
  extends Omit<ToggleButtonGroupProps, 'value' | 'onChange' | 'exclusive'> {
  /**
   * The selected value
   */
  value: T | null;
  options: Array<{
    'aria-label'?: string;
    disabled?: boolean;
    id?: string;
    label: ReactNode;
    tooltipText?: string;
    value: T;
  }>;
  /**
   * Called when the value changes
   */
  onChange: (value: T | null) => void;
  btnW?: number;
  btnH?: number;
  tooltipPlacement?: TooltipProps['placement'];
  allowDeselect?: boolean;
}

export const PropertyToggleButtons = <T extends string | number>({
  value,
  options,
  onChange,
  btnW,
  btnH,
  tooltipPlacement = 'right',
  allowDeselect = false,
  ...props
}: PropertyToggleButtonsProps<T>) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newValue: T | null) => {
    if (allowDeselect) {
      onChange(newValue);
    } else if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <StyledPropertyToggleButtonGroup value={value} exclusive onChange={handleChange} {...props}>
      {options.map((option) => {
        const button = (
          <PropertyToggleButton
            disableRipple
            key={option.value}
            value={option.value}
            aria-label={option['aria-label'] || String(option.value)}
            btnW={btnW}
            btnH={btnH}
            id={option.id}
            disabled={option.disabled}
          >
            {option.label}
          </PropertyToggleButton>
        );
        return option.tooltipText ? (
          <Tooltip
            key={option.value}
            title={option.tooltipText}
            placement={tooltipPlacement}
            enterDelay={800}
            enterNextDelay={800}
          >
            {button}
          </Tooltip>
        ) : (
          button
        );
      })}
    </StyledPropertyToggleButtonGroup>
  );
};
