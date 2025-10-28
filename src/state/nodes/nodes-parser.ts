import { MenuCategory, MenuData, MenuItem } from './nodes.types';

/**
 * these are types for the menudata from the backend.
 * DO NOT USE THESE ANYWHERE ELSE.
 */
interface RawModelItem {
  id: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  searchText: string;
  inputTypes: string[];
  outputTypes: string[];
  commercialUse: boolean | null;
  isLeaf: boolean;
  order: number | null;
  price: number | null;
  isNew: boolean | null;
}

// Interface for items that can have children (non-leaf nodes)
interface RawMenuCategory {
  id: string;
  children: (RawMenuCategory | RawModelItem)[];
  order?: number;
}

// Interface for the main menu structure
interface RawMenuData {
  menu: {
    models: RawMenuCategory[];
    tools: RawMenuCategory[];
    communityModels: RawMenuCategory[];
  };
  recent: RawModelItem[];
}

const isRawMenuCategory = (item: RawMenuCategory | RawModelItem): item is RawMenuCategory => {
  return 'children' in item;
};

const sortByOrder = <T extends { order?: number | null }>(items: T[]): T[] => {
  return items.slice().sort((a, b) => {
    const orderA = a.order ?? Infinity;
    const orderB = b.order ?? Infinity;
    return orderA - orderB;
  });
};

const sortCategoriesRecursively = (category: RawMenuCategory): MenuCategory => {
  if (!category || !Array.isArray(category.children))
    return {
      id: category.id,
      order: category.order,
      children: [],
    };

  const children = sortByOrder(category.children).map((child) => {
    if (isRawMenuCategory(child)) {
      return sortCategoriesRecursively(child);
    }

    return {
      id: child.id,
      displayName: child.displayName,
      description: child.description,
      icon: child.icon,
      searchText: child.searchText,
      inputTypes: child.inputTypes,
      outputTypes: child.outputTypes,
      commercialUse: child.commercialUse,
      isLeaf: child.isLeaf,
      price: child.price,
      isNew: child.isNew,
      order: child.order,
    } as MenuItem;
  });

  return {
    id: category.id,
    children,
  };
};

export const parseMenuData = (menuData: RawMenuData): MenuData => {
  const { tools, models, communityModels } = menuData.menu;

  return {
    recent: sortCategoriesRecursively({ id: 'recent', children: menuData.recent }),
    tools: sortCategoriesRecursively({ id: 'tools', children: tools }),
    imageModels: sortCategoriesRecursively({
      ...(models.find((model) => model.id === 'image_models') || ({} as RawMenuCategory)),
      id: 'image_models',
    }),
    videoModels: sortCategoriesRecursively({
      ...(models.find((model) => model.id === 'video_models') || ({} as RawMenuCategory)),
      id: 'video_models',
    }),
    threedModels: sortCategoriesRecursively({
      ...(models.find((model) => model.id === 'threed_models') || ({} as RawMenuCategory)),
      id: 'threed_models',
    }),
    customModels: sortCategoriesRecursively({ id: 'custom_models', children: communityModels }),
  };
};
