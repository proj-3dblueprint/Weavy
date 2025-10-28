import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import { Menu } from '../Menu/Menu';
import { FlexCol } from '../styles';
import { useSelect, type Option, type UseSelectProps } from './useSelect';
import { HelperText, MenuSearch, NoOptionsText, SelectOption, type SelectOptionBaseProps } from './SelectComponents';
import { getMaxHeight, isOptionLike, type TriggerOptions } from './selectUtils';
import type { PopperPlacementType, SxProps } from '@mui/material';

// Re-export Option type for convenience
export type { Option };

type CommonBaseSelectProps<T, Opt extends Option<T>> = UseSelectProps<T, Opt> &
  SelectOptionBaseProps<T> & {
    anchorEl?: HTMLElement;
    helperText?: ReactNode;
    noOptionsText?: ReactNode;
    offset?: number;
    optionSx?: SxProps;
    placement?: PopperPlacementType;
    renderTrigger: (options: TriggerOptions) => ReactNode;
    search?: boolean;
  };

export type BaseSingleSelectProps<T, Opt extends Option<T>> = CommonBaseSelectProps<T, Opt> & {
  value: Opt | T | null;
};

export type BaseMultiSelectProps<T, Opt extends Option<T>> = CommonBaseSelectProps<T, Opt> & {
  value: Opt[] | T[];
};

export type BaseSelectProps<T, Opt extends Option<T> = Option<T>> =
  | BaseSingleSelectProps<T, Opt>
  | BaseMultiSelectProps<T, Opt>;

export const BaseSelect = <T, Opt extends Option<T>>({
  anchorEl,
  getIsOptionDisabled,
  getIsOptionLoading,
  helperText,
  noCloseOnSelect = false,
  noOptionsText,
  offset,
  onChange,
  onClose,
  onHighlightedOptionChange,
  onOpen,
  optionSx,
  options,
  placement,
  renderTrigger,
  search = false,
  size = 'large',
  value,
}: BaseSelectProps<T, Opt>) => {
  const {
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
  } = useSelect<T, Opt>({
    noCloseOnSelect,
    onChange,
    onClose,
    onHighlightedOptionChange,
    onOpen,
    options,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);

  const { t } = useTranslation();

  const selected = useMemo(() => {
    if (value === null) return null;
    if (Array.isArray(value)) {
      return isOptionLike(value[0])
        ? (value as Opt[])
        : options.filter((option) => value.some((v) => v === option.value));
    }
    if (isOptionLike(value)) return [value];
    const selectedOption = options.find((option) => option.value === value);
    return selectedOption ? [selectedOption] : null;
  }, [value, options]);

  const getIsOptionSelected = useCallback(
    (option: Opt) => {
      if (!selected) return false;
      return getIsSelected(selected, option);
    },
    [selected, getIsSelected],
  );

  const trigger = useMemo(() => {
    return renderTrigger({
      isOpen,
      toggleOpen,
      triggerRef,
    });
  }, [renderTrigger, isOpen, toggleOpen]);

  return (
    <>
      {trigger}
      <Menu
        anchorEl={anchorEl || triggerRef.current}
        offset={offset}
        onClose={onPopupClose}
        open={isOpen && Boolean(anchorEl || triggerRef.current)}
        placement={placement}
        triggerRef={triggerRef}
      >
        {search ? <MenuSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} size={size} /> : null}
        <FlexCol sx={{ p: 0.5, maxHeight: getMaxHeight(search, !!helperText), overflow: 'auto' }}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <SelectOption
                key={getOptionId(option)}
                clearHighlightedIndex={clearHighlightedIndex}
                getIsOptionDisabled={getIsOptionDisabled}
                getIsOptionLoading={getIsOptionLoading}
                getIsSelected={getIsOptionSelected}
                handleItemSelected={handleItemSelected}
                index={index}
                isHighlighted={highlightedIndex === index}
                option={option}
                size={size}
                sx={optionSx}
                updateHighlightedIndex={updateHighlightedIndex}
              />
            ))
          ) : (
            <NoOptionsText
              noOptionsText={noOptionsText || t(I18N_KEYS.COMMON_COMPONENTS.BASE_SELECT.NO_OPTIONS_TEXT)}
              size={size}
            />
          )}
        </FlexCol>
        <HelperText helperText={helperText} size={size} />
      </Menu>
    </>
  );
};
