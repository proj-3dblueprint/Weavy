import { ReactNode } from 'react';
import {
  styled,
  ToggleButtonGroup,
  toggleButtonGroupClasses,
  ToggleButtonGroupProps,
  Tooltip,
  type TooltipProps,
} from '@mui/material';
import { EL_COLORS } from '@/colors';
import { AppToggleButton, AppToggleButtonMode } from './AppToggleButton';

const StyledToggleButtonGroup = styled(ToggleButtonGroup)<{ mode?: AppToggleButtonMode }>(({ theme, mode }) => {
  if (mode === 'contained') {
    return {
      display: 'flex',
      justifyContent: 'space-between',
      height: 24,
      border: `1px solid ${EL_COLORS.BoxBorder}`,
      borderRadius: theme.spacing(0.5),
      [`& .${toggleButtonGroupClasses.grouped}`]: {
        border: 'none',
        '&:hover': {
          border: 'none',
        },
        [`&.${toggleButtonGroupClasses.disabled}`]: {
          border: 'none',
        },
      },
      [`& .${toggleButtonGroupClasses.middleButton}`]: {
        marginLeft: 0,
      },
    };
  }
  return {
    [`& .${toggleButtonGroupClasses.grouped}`]: {
      margin: theme.spacing(0.25),
      border: 0,
      borderRadius: theme.spacing(0.5),
      [`&.${toggleButtonGroupClasses.disabled}`]: {
        border: 0,
      },
    },
  };
});

export interface AppToggleButtonsProps<T extends string | number>
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
  /**
   * Visual mode for the toggle buttons. 'dark', 'light', or 'contained'.
   */
  mode?: AppToggleButtonMode;
  btnW?: number;
  btnH?: number;
  isIcons?: boolean;
  gap?: number;
  tooltipPlacement?: TooltipProps['placement'];
  allowDeselect?: boolean;
}

export const AppToggleButtons = <T extends string | number>({
  value,
  options,
  onChange,
  mode = 'dark',
  btnW,
  btnH,
  isIcons = false,
  gap = 0.25,
  tooltipPlacement = 'right',
  allowDeselect = false,
  ...props
}: AppToggleButtonsProps<T>) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newValue: T | null) => {
    if (allowDeselect) {
      onChange(newValue);
    } else if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <StyledToggleButtonGroup value={value} exclusive onChange={handleChange} sx={{ gap }} mode={mode} {...props}>
      {options.map((option) => {
        const button = (
          <AppToggleButton
            key={option.value}
            value={option.value}
            aria-label={option['aria-label'] || String(option.value)}
            mode={mode}
            btnW={btnW}
            btnH={btnH}
            isIcon={isIcons}
            id={option.id}
            disabled={option.disabled}
          >
            {option.label}
          </AppToggleButton>
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
    </StyledToggleButtonGroup>
  );
};
