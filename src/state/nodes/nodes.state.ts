import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import lodashOrderBy from 'lodash/orderBy';
import { HandleType } from '@/enums/handle-type.enum';
import { ModelItem, MenuData } from './nodes.types';
import { flattenMenuData, filterNodesBySearch, filterNodesByInputOutputTypes } from './nodes.utils';

type OrderByTypeFilter = 'featured' | 'price_asc' | 'price_desc';
type SourceTypeFilter = 'all' | 'tools_only' | 'models_only';

const initialFilters = {
  search: '',
  orderBy: 'featured' as OrderByTypeFilter,
  source: 'all' as SourceTypeFilter,
  extraFilters: {
    no_training_mode: false,
    commercially_safe: false,
  },
  inputTypes: [],
  outputTypes: [],
};

const initialState: NodesMenuState = {
  isFiltersActive: false,
  filters: initialFilters,
  isMenuDataLoaded: false,
  menu: {
    recent: { id: 'recent', children: [] },
    tools: { id: 'tools', children: [] },
    imageModels: { id: 'image_models', children: [] },
    videoModels: { id: 'video_models', children: [] },
    threedModels: { id: 'threed_models', children: [] },
    customModels: { id: 'custom_models', children: [] },
  },
  filteredMenuData: [],
};

interface NodesMenuState {
  isFiltersActive: boolean;
  filters: {
    search: string;
    orderBy: OrderByTypeFilter;
    source: SourceTypeFilter;
    inputTypes: HandleType[];
    outputTypes: HandleType[];
  };
  isMenuDataLoaded: boolean;
  // menuData: MenuData;
  menu: MenuData;
  filteredMenuData: ModelItem[];
}

interface NodeMenuActions {
  setSearch: (search: string) => void;
  setOrderBy: (orderBy: OrderByTypeFilter) => void;
  setSource: (source: SourceTypeFilter) => void;
  setInputTypes: (inputTypes: HandleType[]) => void;
  setOutputTypes: (outputTypes: HandleType[]) => void;
  resetFilters: () => void;
  setMenuData: (menu: MenuData) => void;
}

type NodeFiltersStore = NodesMenuState & NodeMenuActions;

export const useNodeFiltersStore = create<NodeFiltersStore>()(
  devtools(
    (set) => ({
      ...initialState,
      setSearch: (search: string) =>
        set((state) => {
          const newFilters = { ...state.filters, search };
          return {
            filters: newFilters,
            filteredMenuData: filterMenu(state.menu, newFilters),
            isFiltersActive: isFiltersActive(newFilters),
          };
        }),
      setOrderBy: (orderBy: OrderByTypeFilter) =>
        set((state) => {
          const newFilters = { ...state.filters, orderBy };
          return {
            filters: newFilters,
            filteredMenuData: filterMenu(state.menu, newFilters),
            isFiltersActive: isFiltersActive(newFilters),
          };
        }),
      setSource: (source: SourceTypeFilter) =>
        set((state) => {
          const newFilters = { ...state.filters, source };
          return {
            filters: newFilters,
            filteredMenuData: filterMenu(state.menu, newFilters),
            isFiltersActive: isFiltersActive(newFilters),
          };
        }),
      setInputTypes: (inputTypes: HandleType[]) =>
        set((state) => {
          const newFilters = { ...state.filters, inputTypes: [...inputTypes] };
          return {
            filters: newFilters,
            filteredMenuData: filterMenu(state.menu, newFilters),
            isFiltersActive: isFiltersActive(newFilters),
          };
        }),
      setOutputTypes: (outputTypes: HandleType[]) =>
        set((state) => {
          const newFilters = { ...state.filters, outputTypes: [...outputTypes] };
          return {
            filters: newFilters,
            filteredMenuData: filterMenu(state.menu, newFilters),
            isFiltersActive: isFiltersActive(newFilters),
          };
        }),
      resetFilters: () =>
        set((state) => ({
          filters: initialFilters,
          filteredMenuData: flattenMenuData(state.menu),
          isFiltersActive: false,
        })),
      setMenuData: (menu: MenuData) =>
        set(() => {
          return { menu, filteredMenuData: flattenMenuData(menu) };
        }),
      setIsMenuDataLoaded: (isMenuDataLoaded: boolean) => set(() => ({ isMenuDataLoaded })),
    }),
    {
      name: 'Node Filters Store',
      enabled: import.meta.env.DEV,
    },
  ),
);

const filterMenu = (menuData: MenuData, filters: NodeFiltersStore['filters']): ModelItem[] => {
  if (!filters) return [];

  const { search, orderBy, source, inputTypes, outputTypes } = filters;
  let menuDataToFilter: Partial<MenuData> = {};
  if (source === 'tools_only') {
    menuDataToFilter.tools = menuData.tools;
  } else if (source === 'models_only') {
    menuDataToFilter.imageModels = menuData.imageModels;
    menuDataToFilter.videoModels = menuData.videoModels;
    menuDataToFilter.threedModels = menuData.threedModels;
    menuDataToFilter.customModels = menuData.customModels;
  } else {
    menuDataToFilter = { ...menuData };
  }

  const flatList = flattenMenuData(menuDataToFilter);
  let filteredMenuData = filterNodesBySearch(flatList, search);
  if (inputTypes.length) {
    filteredMenuData = filterNodesByInputOutputTypes(filteredMenuData, 'inputTypes', inputTypes);
  }
  if (outputTypes.length) {
    filteredMenuData = filterNodesByInputOutputTypes(filteredMenuData, 'outputTypes', outputTypes);
  }
  if (orderBy === 'price_asc' || orderBy === 'price_desc') {
    const sort = orderBy === 'price_asc' ? 'asc' : 'desc';
    filteredMenuData = lodashOrderBy(
      filteredMenuData,
      [(item) => (item.price == null ? 0 : item.price), (item) => (item.order == null ? 0 : item.order)],
      [sort, 'asc'],
    );
  }
  return filteredMenuData;
};

const isFiltersActive = (filters: NodeFiltersStore['filters']) => {
  const res = Boolean(
    filters.search ||
      filters.orderBy !== 'featured' ||
      filters.source !== 'all' ||
      filters.inputTypes.length ||
      filters.outputTypes.length,
  );
  return res;
};
