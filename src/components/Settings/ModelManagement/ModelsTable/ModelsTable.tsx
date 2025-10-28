import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  CircularProgress,
} from '@mui/material';
import React, { useCallback, useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { color } from '@/colors';
import modelIconMap from '@/components/Recipe/FlowComponents/LeftPanelSections/NodeIconMap';
import { I18N_KEYS } from '@/language/keys';
import { useSettingsStore } from '@/state/settings.state';
import useWorkspacesStore from '@/state/workspaces.state';
import { ModelDefinition } from '@/types/api/modelDefinition';
import { AppCheckbox } from '@/UI/AppCheckbox/AppCheckbox';
import { Input } from '@/UI/Input/Input';
import { SearchIcon } from '@/UI/Icons/SearchIcon';
import { Tag } from '@/UI/Tag/Tag';
import { FlexCol, FlexCenVer, Flex } from '@/UI/styles';
import { StyledTableCell, StyledTableRow } from '../../Team/TeamTable/TeamTable.styles';
import { LoadingSkeleton } from '../../LoadingSkeleton';
import { ModelFilters, BooleanFilter } from './ModelFilters';

type Order = 'asc' | 'desc';

type HeadCellId = keyof Pick<ModelDefinition, 'name' | 'commercialUse' | 'createdAt' | 'isAllowed' | 'isNotTraining'>;

interface HeadCell {
  id: HeadCellId;
  label: string;
}

interface ModelTableProps {
  models: ModelDefinition[];
  isLoading: boolean;
}

interface FiltersState {
  search: string;
  allowedFilter: BooleanFilter;
  commercialUseFilter: BooleanFilter;
  trainingFilter: BooleanFilter;
}

type FiltersAction =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_ALLOWED_FILTER'; payload: BooleanFilter }
  | { type: 'SET_COMMERCIAL_USE_FILTER'; payload: BooleanFilter }
  | { type: 'SET_TRAINING_FILTER'; payload: BooleanFilter }
  | { type: 'RESET_FILTERS' };

const initialFiltersState: FiltersState = {
  search: '',
  allowedFilter: 'all',
  commercialUseFilter: 'all',
  trainingFilter: 'all',
};

const filtersReducer = (state: FiltersState, action: FiltersAction): FiltersState => {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_ALLOWED_FILTER':
      return { ...state, allowedFilter: action.payload };
    case 'SET_COMMERCIAL_USE_FILTER':
      return { ...state, commercialUseFilter: action.payload };
    case 'SET_TRAINING_FILTER':
      return { ...state, trainingFilter: action.payload };
    case 'RESET_FILTERS':
      return initialFiltersState;
    default:
      return state;
  }
};

const getColWidth = (id: HeadCellId) => {
  switch (id) {
    case 'name':
      return '300px';
    case 'commercialUse':
      return '180px';
    case 'isNotTraining':
      return '220px';
    case 'createdAt':
      return '150px';
    case 'isAllowed':
      return '60px';
    default:
      return 'auto';
  }
};

export const ModelTable = ({ models, isLoading }: ModelTableProps) => {
  const [filtersState, dispatch] = useReducer(filtersReducer, initialFiltersState);
  const [orderBy, setOrderBy] = useState<keyof ModelDefinition>('name');
  const [order, setOrder] = useState<Order>('asc');
  const { t } = useTranslation();
  const workspaceId = useWorkspacesStore((state) => state.activeWorkspace.workspaceId);
  const updateModelAllowedStatus = useSettingsStore((state) => state.updateModelAllowedStatus);
  const updatingModelIds = useSettingsStore((state) => state.updatingModelIds);

  const headCells: HeadCell[] = useMemo(
    () => [
      { id: 'name', label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.TABLE.HEADER_NAME) },
      { id: 'commercialUse', label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.TABLE.HEADER_COMMERCIALLY_USE) },
      { id: 'isNotTraining', label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.TABLE.HEADER_TRAINING) },
      { id: 'createdAt', label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.TABLE.HEADER_DATE_ADDED) },
      { id: 'isAllowed', label: t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.TABLE.HEADER_APPROVED) },
    ],
    [t],
  );

  const handleAllowedToggle = useCallback(
    (modelId: string, allowed: boolean) => {
      void updateModelAllowedStatus(workspaceId, modelId, allowed);
    },
    [workspaceId, updateModelAllowedStatus],
  );

  const handleRequestSort = useCallback(
    (property: keyof ModelDefinition) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    },
    [orderBy, order],
  );

  const filteredAndSortedModels = useMemo(() => {
    if (!models?.length) {
      return [];
    }

    let filtered = [...models];

    if (filtersState.search) {
      filtered = filtered.filter(
        (model) =>
          model?.name?.toLowerCase().includes(filtersState.search.toLowerCase()) ||
          model?.displayName?.toLowerCase().includes(filtersState.search.toLowerCase()) ||
          model?.description?.toLowerCase().includes(filtersState.search.toLowerCase()),
      );
    }

    if (filtersState.allowedFilter !== 'all') {
      filtered = filtered.filter((model) => (filtersState.allowedFilter ? model.isAllowed : !model.isAllowed));
    }

    if (filtersState.commercialUseFilter !== 'all') {
      filtered = filtered.filter((model) =>
        filtersState.commercialUseFilter ? model.commercialUse : !model.commercialUse,
      );
    }

    if (filtersState.trainingFilter !== 'all') {
      filtered = filtered.filter((model) => (filtersState.trainingFilter ? !model.isNotTraining : model.isNotTraining));
    }

    return filtered.sort((a, b) => {
      const rawA = a[orderBy];
      const rawB = b[orderBy];

      const aVal = rawA ?? (typeof rawB === 'number' ? 0 : '');
      const bVal = rawB ?? (typeof rawA === 'number' ? 0 : '');

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        comparison = (aVal ? 1 : 0) - (bVal ? 1 : 0);
      } else {
        comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
      }

      return order === 'asc' ? comparison : -comparison;
    });
  }, [models, order, orderBy, filtersState]);

  const renderIcon = useCallback((model: ModelDefinition) => {
    if (!model.icon) {
      return null;
    }

    const iconDisplay = modelIconMap[model.icon];
    if (typeof iconDisplay === 'string') {
      return <img src={iconDisplay} width="20px" height="20px" />;
    }

    return (
      React.isValidElement(iconDisplay) &&
      React.cloneElement(iconDisplay, { width: 20, height: 20 } as React.SVGProps<SVGSVGElement>)
    );
  }, []);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      <Flex sx={{ flexWrap: 'wrap' }}>
        <Input
          placeholder={t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.TABLE.SEARCH_PLACEHOLDER)}
          onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
          sx={{ width: 240, mr: 0.5 }}
          startAdornment={<SearchIcon />}
        />
        <ModelFilters
          allowedFilter={filtersState.allowedFilter}
          commercialUseFilter={filtersState.commercialUseFilter}
          trainingFilter={filtersState.trainingFilter}
          onAllowedFilterChange={(value) => dispatch({ type: 'SET_ALLOWED_FILTER', payload: value })}
          onCommercialUseFilterChange={(value) => dispatch({ type: 'SET_COMMERCIAL_USE_FILTER', payload: value })}
          onTrainingFilterChange={(value) => dispatch({ type: 'SET_TRAINING_FILTER', payload: value })}
        />
      </Flex>

      <TableContainer className="wea-no-scrollbar" sx={{ backgroundColor: 'none' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ height: 40 }}>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  padding="none"
                  sortDirection={orderBy === headCell.id ? order : false}
                  sx={{ width: getColWidth(headCell.id), pl: 2 }}
                >
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : 'asc'}
                    onClick={() => handleRequestSort(headCell.id)}
                  >
                    <Typography
                      variant="label-sm-rg"
                      sx={{ color: orderBy === headCell.id ? color.White100 : color.White64_T }}
                    >
                      {headCell.label}
                    </Typography>
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedModels.length === 0 ? (
              <StyledTableRow>
                <StyledTableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body-sm-rg" color={color.White64_T}>
                    {t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.TABLE.NO_MODELS_FOUND)}
                  </Typography>
                </StyledTableCell>
              </StyledTableRow>
            ) : (
              filteredAndSortedModels.map((model) => (
                <StyledTableRow hover key={model.modelId}>
                  <StyledTableCell sx={{ pl: 2 }}>
                    <FlexCenVer sx={{ gap: 0.75 }}>
                      {renderIcon(model)}
                      <FlexCol>
                        <Typography sx={{ display: 'flex', gap: 1 }} variant="body-sm-md" color={color.White100}>
                          {model.displayName || model.name}
                          {model.isNew && (
                            <Box component="span" sx={{ position: 'relative', top: '-1px' }}>
                              <Tag
                                variant="large"
                                text={t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.NEW_INDICATOR)}
                                textColor={color.Yellow100}
                                bgColor={color.Yellow16_T}
                                sx={{ px: 0.5 }}
                              />
                            </Box>
                          )}
                        </Typography>
                      </FlexCol>
                    </FlexCenVer>
                  </StyledTableCell>

                  <StyledTableCell sx={{ pl: 2 }}>
                    <Tag
                      variant="large"
                      sx={{ px: 0.5 }}
                      bgColor={model.commercialUse ? color.TrueValueGreen_16 : color.FalseValueRed_16}
                      text={model.commercialUse ? t(I18N_KEYS.GENERAL.YES) : t(I18N_KEYS.GENERAL.NO)}
                      textColor={model.commercialUse ? color.TrueValueGreen : color.FalseValueRed}
                    />
                  </StyledTableCell>

                  <StyledTableCell sx={{ pl: 2 }}>
                    <Tag
                      variant="large"
                      sx={{ px: 0.5 }}
                      bgColor={!model.isNotTraining ? color.FalseValueRed_16 : color.TrueValueGreen_16}
                      text={
                        !model.isNotTraining
                          ? t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.TABLE.TRAINING_TRUE)
                          : t(I18N_KEYS.SETTINGS.MODEL_MANAGEMENT.TABLE.TRAINING_FALSE)
                      }
                      textColor={!model.isNotTraining ? color.FalseValueRed : color.TrueValueGreen}
                    />
                  </StyledTableCell>
                  <StyledTableCell sx={{ pl: 2 }}>
                    <Typography variant="body-sm-rg" color={color.White100}>
                      {model.createdAt ? format(new Date(model.createdAt), 'dd/MM/yyyy') : 'N/A'}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell sx={{ pl: 2 }}>
                    <FlexCenVer sx={{ gap: 1 }}>
                      <AppCheckbox
                        checked={model.isAllowed}
                        disabled={updatingModelIds.has(model.modelId)}
                        onChange={(e) => handleAllowedToggle(model.modelId, e.target.checked)}
                        slotProps={{ input: { 'aria-label': `allow model ${model.displayName || model.name}` } }}
                      />
                      {updatingModelIds.has(model.modelId) && (
                        <CircularProgress size={10} sx={{ color: color.White64_T }} />
                      )}
                    </FlexCenVer>
                  </StyledTableCell>
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
