import { Divider, Typography, type SxProps } from '@mui/material';
import { useCallback, type ChangeEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenHor, FlexCenHorVer, FlexCol } from '../styles';
import { SearchIcon } from '../Icons/SearchIcon';
import { Input } from '../Input/Input';
import { MenuItem } from '../Menu/Menu';
import type { Option } from './useSelect';

export const HelperText = ({ helperText, size = 'large' }: { helperText?: ReactNode; size?: 'small' | 'large' }) => {
  if (!helperText) return null;
  return (
    <FlexCenHorVer sx={{ p: 1.5, width: size === 'small' ? '104px' : '180px' }}>
      <Typography variant="body-xs-rg" color={color.White64_T}>
        {helperText}
      </Typography>
    </FlexCenHorVer>
  );
};

export const NoOptionsText = ({
  noOptionsText,
  size = 'large',
}: {
  noOptionsText?: ReactNode;
  size?: 'small' | 'large';
}) => {
  if (!noOptionsText) return null;
  return (
    <Typography variant="body-sm-rg" color={color.White64_T} sx={{ width: size === 'small' ? '80px' : '164px' }}>
      {noOptionsText}
    </Typography>
  );
};

export const MenuSearch = ({
  searchQuery,
  setSearchQuery,
  size = 'large',
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  size?: 'small' | 'large';
}) => {
  const { t } = useTranslation();
  const onSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery],
  );
  return (
    <FlexCol sx={{ width: '100%' }}>
      <FlexCenHor sx={{ p: 1 }}>
        <Input
          startAdornment={<SearchIcon height={16} width={16} />}
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={t(I18N_KEYS.GENERAL.SEARCH)}
          size="small"
          sx={{ width: size === 'small' ? '80px' : '164px' }}
        />
      </FlexCenHor>
      <Divider sx={{ borderColor: color.White16_T }} />
    </FlexCol>
  );
};

export interface SelectOptionBaseProps<T> {
  getIsOptionDisabled?: (option: Option<T>) => boolean;
  getIsOptionLoading?: (option: Option<T>) => boolean;
  size?: 'small' | 'large';
}

interface SelectOptionProps<T, Opt extends Option<T>> extends SelectOptionBaseProps<T> {
  clearHighlightedIndex: () => void;
  getIsSelected: (option: Opt) => boolean;
  handleItemSelected: (option: Opt) => void;
  index: number;
  isHighlighted: boolean;
  option: Opt;
  sx?: SxProps;
  updateHighlightedIndex: (index: number) => void;
}

export const SelectOption = <T, Opt extends Option<T>>({
  clearHighlightedIndex,
  getIsOptionDisabled,
  getIsOptionLoading,
  getIsSelected,
  handleItemSelected,
  index,
  isHighlighted,
  option,
  size = 'large',
  sx,
  updateHighlightedIndex,
}: SelectOptionProps<T, Opt>) => {
  const handleClick = useCallback(() => {
    handleItemSelected(option);
  }, [handleItemSelected, option]);

  const handelMouseEnter = useCallback(() => {
    updateHighlightedIndex(index);
  }, [updateHighlightedIndex, index]);

  return (
    <MenuItem
      disabled={getIsOptionDisabled?.(option)}
      isHighlighted={isHighlighted}
      loading={getIsOptionLoading?.(option)}
      onClick={handleClick}
      onMouseEnter={handelMouseEnter}
      onMouseLeave={clearHighlightedIndex}
      selected={getIsSelected(option)}
      size={size}
      sx={sx}
    >
      {option.label}
    </MenuItem>
  );
};
