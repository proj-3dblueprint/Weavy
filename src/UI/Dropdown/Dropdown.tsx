import { useCallback, useMemo, useState, type MutableRefObject, type ReactNode } from 'react';
import { styled, type SxProps, useTheme } from '@mui/material';
import { color } from '@/colors';
import { useDeepEqualMemo } from '@/hooks/useDeepEqualMemo';
import { CaretIcon } from '../Icons/CaretIcon';
import { EllipsisText } from '../EllipsisText/EllipsisText';
import { BaseSelect, type BaseSingleSelectProps, type Option } from '../BaseSelect/BaseSelect';
import { isOptionLike, type TriggerOptions } from '../BaseSelect/selectUtils';

// Export here for convenience
export type { Option };

interface DropdownButtonProps {
  isOpen?: boolean;
  width?: string;
  noBorder?: boolean;
}

const DropdownButton = styled('button', {
  shouldForwardProp: (prop) => prop !== 'isOpen' && prop !== 'noBorder' && prop !== 'width',
})<DropdownButtonProps>(({ theme, isOpen = false, noBorder = false, width = '100px', disabled = false }) => ({
  width,
  padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: theme.spacing(1),
  backgroundColor: noBorder ? 'transparent' : color.Black92,
  border: noBorder ? 'none' : '1px solid',
  borderColor: isOpen ? color.White40_T : color.White08_T,
  borderRadius: '4px',
  color: color.White100,
  cursor: disabled ? 'initial' : 'pointer',
  '&:hover': {
    backgroundColor: color.Black84,
  },
}));

interface DropdownProps<T, Opt extends Option<T>> extends Omit<BaseSingleSelectProps<T, Opt>, 'renderTrigger'> {
  disabled?: boolean;
  emptyState?: ReactNode;
  noBorder?: boolean;
  matchTriggerWidth?: boolean;
  sx?: SxProps;
  width?: string;
}

export const Dropdown = <T, Opt extends Option<T>>({
  disabled,
  emptyState = null,
  noBorder = false,
  sx,
  width = '100px',
  value,
  options,
  optionSx: optionSxProp,
  matchTriggerWidth = false,
  ...selectProps
}: DropdownProps<T, Opt>) => {
  const theme = useTheme();
  const triggerSx = useDeepEqualMemo(sx);
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null);

  const selectedOption = useMemo(() => {
    if (isOptionLike(value)) return value;
    return options.find((option) => option.value === value);
  }, [value, options]);

  const label = useMemo(() => {
    if (!selectedOption) return emptyState;
    if (
      typeof selectedOption.label === 'string' ||
      typeof selectedOption.label === 'number' ||
      typeof selectedOption.label === 'boolean'
    ) {
      let calculatedWidth = width;
      if (!Number.isNaN(Number(calculatedWidth))) {
        calculatedWidth = `${Number(calculatedWidth)}px`;
      }
      // 12px is the width of the caret icon, spacing is the padding of the button
      calculatedWidth = `calc(${calculatedWidth} - ${theme.spacing(1)} - 12px)`;
      return (
        <EllipsisText
          maxWidth={CSS.supports(calculatedWidth) ? calculatedWidth : undefined}
          variant="body-sm-rg"
          color={disabled ? color.White16_T : color.White100}
        >
          {String(selectedOption.label)}
        </EllipsisText>
      );
    }
    return selectedOption.label;
  }, [selectedOption, emptyState, width, theme, disabled]);

  const optionSx = useMemo(() => {
    if (!buttonElement) return optionSxProp;
    if (matchTriggerWidth) {
      return {
        ...(optionSxProp || {}),
        width: `calc(${buttonElement.clientWidth}px - ${theme.spacing(2)} - 2px)`,
      };
    }
    return {
      ...(optionSxProp || {}),
      // 2px is the border of the menu, 2 times spacing is the padding of the menu
      minWidth: `calc(${buttonElement.clientWidth}px - ${theme.spacing(2)} - 2px)`,
      width: 'fill-available',
      maxWidth: selectProps.size === 'large' ? '240px' : '200px',
    };
  }, [buttonElement, matchTriggerWidth, optionSxProp, theme, selectProps.size]);

  const renderTrigger = useCallback(
    ({ isOpen, toggleOpen, triggerRef }: TriggerOptions) => {
      return (
        <DropdownButton
          onClick={toggleOpen}
          disabled={disabled}
          isOpen={isOpen}
          noBorder={noBorder}
          width={width}
          sx={triggerSx}
          ref={(el) => {
            setButtonElement(el);
            if (triggerRef) {
              (triggerRef as MutableRefObject<HTMLButtonElement | null>).current = el;
            }
          }}
          key="dropdown-button"
        >
          {label}

          <CaretIcon
            style={{
              transition: 'transform 0.2s ease-in-out',
              transform: isOpen ? 'rotate(180deg)' : 'none',
            }}
          />
        </DropdownButton>
      );
    },
    [disabled, noBorder, width, triggerSx, label],
  );

  return (
    <BaseSelect {...selectProps} value={value} options={options} renderTrigger={renderTrigger} optionSx={optionSx} />
  );
};
