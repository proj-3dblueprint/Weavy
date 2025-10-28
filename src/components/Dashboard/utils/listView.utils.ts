import { DashboardRecipe } from '@/state/dashboardRecipes.state';
import type { FolderResponseDto } from '@/types/folder.types';

export function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  const valA = a[orderBy];
  const valB = b[orderBy];

  // Handle undefined/null values - put them at the end
  if (valA === undefined || valA === null) {
    return 1;
  }
  if (valB === undefined || valB === null) {
    return -1;
  }

  // Check if the values are strings; if so, compare them in a case-insensitive manner
  if (typeof valA === 'string' && typeof valB === 'string') {
    const aValueLower = valA.toLowerCase();
    const bValueLower = valB.toLowerCase();

    if (bValueLower < aValueLower) {
      return -1;
    }
    if (bValueLower > aValueLower) {
      return 1;
    }
    return 0;
  }

  if (valB < valA) {
    return -1;
  }
  if (valB > valA) {
    return 1;
  }

  return 0;
}

export type ListItem =
  | (DashboardRecipe & { type: 'recipe'; ownerName?: string; owner?: string })
  | (FolderResponseDto & { type: 'folder' });

export const FOLDER_ICON = 'folder' as const;
export type FolderItem = string;

export interface FolderRecipeData {
  [folderId: string]: {
    posters: FolderItem[];
    count: number;
  };
}

export function calculateFolderRecipeData(
  folders: FolderResponseDto[],
  recipes: (DashboardRecipe & { folderId?: string | null })[],
  allRecipes?: (DashboardRecipe & { folderId?: string | null })[],
  allFolders?: FolderResponseDto[],
): FolderRecipeData {
  const data: FolderRecipeData = {};

  // Use allRecipes (unfiltered) if available for accurate counts
  const recipesForCounting = allRecipes || recipes;

  folders.forEach((folder) => {
    const folderRecipes = recipesForCounting.filter((recipe) => recipe.folderId === folder.id);
    // Use allFolders to find subfolders, not the filtered folders
    const subfolders = (allFolders || folders).filter((f) => f.parentId === folder.id);

    // Combine folder icons and recipe posters
    const items: FolderItem[] = [];

    // Add folder icons first
    subfolders.forEach(() => items.push(FOLDER_ICON));

    // Then add recipe posters
    folderRecipes.forEach((r) => items.push(r.poster || '/workflow-default-cover.png'));

    data[folder.id] = {
      posters: items.slice(0, 4),
      count: subfolders.length + folderRecipes.length,
    };
  });

  return data;
}
