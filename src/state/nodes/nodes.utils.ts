import { partition } from 'lodash';
import { HandleType } from '@/enums/handle-type.enum';
import { searchAndSort } from '@/utils/search';
import { MenuCategory, MenuData, ModelItem } from './nodes.types';

export const flattenMenuData = (menu: Partial<MenuData>): ModelItem[] => {
  let items: ModelItem[] = [];
  for (const key in menu) {
    const category = menu[key as keyof MenuData];
    if (category && 'children' in category && Array.isArray(category.children)) {
      items = items.concat(flattenMenuCategories([category]));
    }
  }
  // Deduplicate by id (keep first occurrence)
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

export const flattenMenuCategories = (categories: MenuCategory[]): ModelItem[] => {
  const result: ModelItem[] = [];
  for (const cat of categories) {
    const [withChildren, withoutChildren] = partition(cat.children, (child) => 'children' in child);
    result.push(...flattenMenuCategories(withChildren));
    result.push(...withoutChildren);
  }
  return result;
};

/**
 * Filters a list of ModelItem by a search string, matching displayName, description, or searchText (case-insensitive).
 * Uses enhanced search with relevance scoring for better results.
 */
export function filterNodesBySearch(items: ModelItem[], search: string): ModelItem[] {
  if (!search) return items;

  return searchAndSort(items, search, (item) => [item.displayName || '', item.searchText || '']);
}

/**
 * Filters a list of ModelItem by inputTypes/outputTypes and side of requested connection.
 */
export function filterNodesByInputOutputTypes(
  items: ModelItem[],
  typeKey: keyof Pick<ModelItem, 'inputTypes' | 'outputTypes'>,
  types: HandleType[],
): ModelItem[] {
  if (!items?.length) {
    return items;
  }

  // filter out items that don't have handles on the requested side e.g. preview and export
  const res = items.filter((item) => Boolean(item[typeKey] && item[typeKey].length));

  if (!types || !types.length) {
    return res;
  }

  return res.filter((item) => types.every((type) => item[typeKey].includes(type)));
}
