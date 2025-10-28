import { Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { AppContextMenu } from '@/UI/AppContextMenu/AppContextMenu';
import { AppMenuItem } from '@/UI/AppContextMenu/AppMenu.styles';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { CheckMarkIcon } from '@/UI/Icons/CheckMarkIcon';
import ParentMenuItem from '@/components/Recipe/Menu/ParentMenuItem';
import { I18N_KEYS } from '@/language/keys';
import { FiltersIcon, XIcon } from '@/UI/Icons';
import { Tag } from '@/UI/Tag/Tag';
import { FlexCenVer } from '@/UI/styles';

const MENU_ITEM_STYLES = {
  '&.Mui-selected': {
    backgroundColor: color.Black92,
    '&:focus': {
      backgroundColor: color.Black92,
    },
    '&:hover': {
      backgroundColor: color.Black84,
    },
  },
};

export type BooleanFilter = 'all' | true | false;

interface FilterOption<T> {
  value: T;
  label: string;
}

interface FilterCategoryConfig<T> {
  id: string;
  label: string;
  options: FilterOption<T>[];
  getCurrentValue: (props: ModelFiltersProps) => T;
  onChange: (props: ModelFiltersProps) => (value: T) => void;
}

interface ModelFiltersProps {
  allowedFilter: BooleanFilter;
  commercialUseFilter: BooleanFilter;
  trainingFilter: BooleanFilter;
  onAllowedFilterChange: (filter: BooleanFilter) => void;
  onCommercialUseFilterChange: (filter: BooleanFilter) => void;
  onTrainingFilterChange: (filter: BooleanFilter) => void;
}

const getAllowedConfig = (t: (key: string) => string): FilterCategoryConfig<BooleanFilter> => ({
  id: 'allowed',
  label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.FILTERS.STATUS.LABEL),
  options: [
    { value: 'all', label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.FILTERS.ALL) },
    { value: true, label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.FILTERS.STATUS.APPROVED) },
    { value: false, label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.FILTERS.STATUS.NOT_APPROVED) },
  ],
  getCurrentValue: (props) => props.allowedFilter,
  onChange: (props) => props.onAllowedFilterChange,
});

const getCommercialUseConfig = (t: (key: string) => string): FilterCategoryConfig<BooleanFilter> => ({
  id: 'commercial-use',
  label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.FILTERS.COMMERCIAL_USE.LABEL),
  options: [
    { value: 'all', label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.FILTERS.ALL) },
    { value: true, label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.FILTERS.COMMERCIAL_USE.SAFE) },
    { value: false, label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.FILTERS.COMMERCIAL_USE.NOT_SAFE) },
  ],
  getCurrentValue: (props) => props.commercialUseFilter,
  onChange: (props) => props.onCommercialUseFilterChange,
});

const getTrainingConfig = (t: (key: string) => string): FilterCategoryConfig<BooleanFilter> => ({
  id: 'training',
  label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.FILTERS.TRAINING.LABEL),
  options: [
    { value: 'all', label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.FILTERS.ALL) },
    { value: true, label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.FILTERS.TRAINING.TRAINS_ON_DATA) },
    { value: false, label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.FILTERS.TRAINING.NO_TRAINING) },
  ],
  getCurrentValue: (props) => props.trainingFilter,
  onChange: (props) => props.onTrainingFilterChange,
});

export const ModelFilters = ({
  allowedFilter,
  commercialUseFilter,
  trainingFilter,
  onAllowedFilterChange,
  onCommercialUseFilterChange,
  onTrainingFilterChange,
}: ModelFiltersProps) => {
  const props = {
    allowedFilter,
    commercialUseFilter,
    trainingFilter,
    onAllowedFilterChange,
    onCommercialUseFilterChange,
    onTrainingFilterChange,
  };

  const { t } = useTranslation();
  const [filtersAnchorEl, setFiltersAnchorEl] = useState<null | HTMLElement>(null);

  const handleCloseMenu = () => setFiltersAnchorEl(null);

  const renderFilterCategory = <T,>(category: FilterCategoryConfig<T>) => {
    const currentValue = category.getCurrentValue(props);
    const onChange = category.onChange(props);

    return (
      <ParentMenuItem
        key={category.id}
        label={category.label}
        onClose={handleCloseMenu}
        id={category.id}
        contextMenuWidth="180px"
      >
        {category.options.map((option) => {
          const isSelected = currentValue === option.value;
          return (
            <AppMenuItem
              key={String(option.value)}
              selected={isSelected}
              onClick={() => onChange(option.value)}
              sx={{ mb: 0.25, ...MENU_ITEM_STYLES }}
            >
              <Typography variant="body-sm-rg">{option.label}</Typography>
              {isSelected && <CheckMarkIcon />}
            </AppMenuItem>
          );
        })}
      </ParentMenuItem>
    );
  };

  const getSelectedFilterLabel = (filterValue: BooleanFilter, config: FilterCategoryConfig<BooleanFilter>) => {
    const option = config.options.find((opt) => opt.value === filterValue);
    return option?.label || '';
  };

  const allowedConfig = useMemo(() => getAllowedConfig(t), [t]);
  const commercialUseConfig = useMemo(() => getCommercialUseConfig(t), [t]);
  const trainingConfig = useMemo(() => getTrainingConfig(t), [t]);

  return (
    <>
      <ButtonContained
        mode="text"
        size="small"
        sx={{
          height: 34,
          mr: 1,
          ...(Boolean(filtersAnchorEl) && { backgroundColor: color.White08_T }),
        }}
        onClick={(e) => setFiltersAnchorEl(e.currentTarget)}
        startIcon={<FiltersIcon width={16} height={16} />}
      >
        {t(I18N_KEYS.GENERAL.FILTERS)}
      </ButtonContained>
      <FlexCenVer sx={{ gap: 1, flexWrap: 'wrap', flex: 1 }}>
        {allowedFilter !== 'all' && (
          <Tag
            text={getSelectedFilterLabel(allowedFilter, allowedConfig)}
            bgColor={color.Black84}
            textColor={color.White100}
            endIcon={<XIcon width={12} height={12} />}
            onClick={() => onAllowedFilterChange('all')}
            sx={{ cursor: 'pointer' }}
            variant="large"
          />
        )}

        {commercialUseFilter !== 'all' && (
          <Tag
            text={getSelectedFilterLabel(commercialUseFilter, commercialUseConfig)}
            bgColor={color.Black84}
            textColor={color.White100}
            endIcon={<XIcon width={12} height={12} />}
            onClick={() => onCommercialUseFilterChange('all')}
            sx={{ cursor: 'pointer' }}
            variant="large"
          />
        )}

        {trainingFilter !== 'all' && (
          <Tag
            text={getSelectedFilterLabel(trainingFilter, trainingConfig)}
            bgColor={color.Black84}
            textColor={color.White100}
            endIcon={<XIcon width={12} height={12} />}
            onClick={() => onTrainingFilterChange('all')}
            sx={{ cursor: 'pointer' }}
            variant="large"
          />
        )}
      </FlexCenVer>

      <AppContextMenu
        anchorEl={filtersAnchorEl}
        open={Boolean(filtersAnchorEl)}
        onClose={handleCloseMenu}
        width="180px"
        offset={{ top: '4px' }}
      >
        {renderFilterCategory(allowedConfig)}
        {renderFilterCategory(commercialUseConfig)}
        {renderFilterCategory(trainingConfig)}
      </AppContextMenu>
    </>
  );
};
