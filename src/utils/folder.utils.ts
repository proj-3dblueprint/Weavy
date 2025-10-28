import { DashboardRecipe } from '@/state/dashboardRecipes.state.ts';
import type { FolderResponseDto } from '@/types/folder.types';

/**
 * Convert a timestamp (string or number) to milliseconds
 */
export const toMillis = (timestamp: string | number | undefined): number => {
  if (!timestamp) return 0;
  if (typeof timestamp === 'number') return timestamp;
  // Handle ISO date strings
  return new Date(timestamp).getTime();
};

/**
 * Get the latest updated timestamp from a folder, including all its nested content
 * @param folderId - The folder ID to check
 * @param allFolders - All folders in the system
 * @param allRecipes - All recipes in the system
 * @returns The latest timestamp in milliseconds
 */
export const getLatestUpdateInFolder = (
  folderId: string,
  allFolders: FolderResponseDto[],
  allRecipes: DashboardRecipe[],
): number => {
  const cache = new Map<string, number>();

  const calculateLatestUpdate = (id: string): number => {
    // Check cache first
    if (cache.has(id)) {
      return cache.get(id)!;
    }

    let latestUpdate = 0;

    // Get the folder itself to check its updatedAt
    const folder = allFolders.find((f) => f.id === id);
    if (folder) {
      const folderTime = Math.max(toMillis(folder.updatedAt), toMillis(folder.createdAt));
      if (folderTime > latestUpdate) {
        latestUpdate = folderTime;
      }
    }

    // Check all recipes in this folder
    const folderRecipes = allRecipes.filter((r) => r.folderId === id);
    folderRecipes.forEach((recipe) => {
      const recipeTime = Math.max(toMillis(recipe.updatedAt), toMillis(recipe.createdAt));
      if (recipeTime > latestUpdate) {
        latestUpdate = recipeTime;
      }
    });

    // Check all subfolders recursively
    const subfolders = allFolders.filter((f) => f.parentId === id);
    subfolders.forEach((subfolder) => {
      const subfolderLatest = calculateLatestUpdate(subfolder.id);
      if (subfolderLatest > latestUpdate) {
        latestUpdate = subfolderLatest;
      }
    });

    // Cache the result
    cache.set(id, latestUpdate);
    return latestUpdate;
  };

  return calculateLatestUpdate(folderId);
};

/**
 * Create a memoized version of getLatestUpdateInFolder
 */
export const createGetLatestUpdateInFolder = (allFolders: FolderResponseDto[], allRecipes: DashboardRecipe[]) => {
  const cache = new Map<string, number>();

  return (folderId: string): number => {
    const cacheKey = `${folderId}-${allFolders.length}-${allRecipes.length}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    const result = getLatestUpdateInFolder(folderId, allFolders, allRecipes);
    cache.set(cacheKey, result);
    return result;
  };
};
