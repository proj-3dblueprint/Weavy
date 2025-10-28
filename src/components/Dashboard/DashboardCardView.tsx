import { Grid2 } from '@mui/material';
import { useMemo, useState } from 'react';
import { toMillis, createGetLatestUpdateInFolder } from '@/utils/folder.utils';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { RecipeCard } from './RecipeCard';
import { FolderCard } from './FolderCard';
import type { DashboardRecipe } from '@/state/dashboardRecipes.state';
import type { FolderResponseDto } from '@/types/folder.types';

interface DashboardCardViewProps {
  recipes: (DashboardRecipe & { folderId?: string | null })[];
  allRecipes?: (DashboardRecipe & { folderId?: string | null })[];
  folders?: FolderResponseDto[];
  allFolders?: FolderResponseDto[]; // Add this to get all folders for preview calculation
  editingRecipe: { id: string | null; name: string };
  handleContextMenu: (event: React.MouseEvent<HTMLDivElement>, id: string, itemType?: 'folder' | 'recipe') => void;
  handleRenameRecipe: (id: string, name: string) => void;
  cancelRename: (id: string, oldName: string) => void;
  onSetEditingRecipe: (id: string, name: string) => void;
  onFolderNavigate?: (folderId?: string | null) => void;
  currentFolderId?: string | null;
  isSearching?: boolean;
  editingFolder?: { id: string | null; name: string };
  onSetEditingFolder?: (id: string, name: string) => void;
  handleRenameFolder?: (id: string, name: string) => void;
  cancelRenameFolder?: (id: string) => void;
  countFilesInFolder?: (folderId: string) => number;
  onMoveItem?: (itemId: string, itemType: 'file' | 'folder', targetFolderId: string) => void;
  isWorkspaceFiles?: boolean;
}

export const DashboardCardView = ({
  recipes,
  allRecipes,
  folders = [],
  allFolders,
  editingRecipe,
  onSetEditingRecipe,
  handleRenameRecipe,
  cancelRename,
  handleContextMenu,
  onFolderNavigate,
  currentFolderId,
  isSearching = false,
  editingFolder,
  onSetEditingFolder,
  handleRenameFolder,
  cancelRenameFolder,
  countFilesInFolder,
  onMoveItem,
  isWorkspaceFiles = false,
}: DashboardCardViewProps) => {
  // Use allFolders if provided, otherwise fall back to folders
  const foldersForRecursion = allFolders || folders;
  const recipesForLatestUpdate = allRecipes || recipes;

  // Initialize drag and drop functionality
  const { dragState, handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop } = useDragAndDrop();

  const getLatestUpdateInFolder = useMemo(
    () => createGetLatestUpdateInFolder(foldersForRecursion, recipesForLatestUpdate),
    [foldersForRecursion, recipesForLatestUpdate],
  );

  // Calculate recipe posters and counts for each folder
  const folderRecipeData = useMemo(() => {
    const FOLDER_ICON = 'folder' as const;
    type FolderItem = string;
    const data: Record<string, { posters: FolderItem[]; count: number }> = {};

    // Use allRecipes (unfiltered) if available for accurate counts, otherwise fall back to filtered recipes
    const recipesForCounting = allRecipes || recipes;

    // Group recipes and subfolders by folder
    folders.forEach((folder) => {
      const folderRecipes = recipesForCounting.filter((recipe) => recipe.folderId === folder.id);
      // Use allFolders to find subfolders, not the filtered folders
      const subfolders = foldersForRecursion.filter((f) => f.parentId === folder.id);

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
  }, [folders, recipes, allRecipes, allFolders]);
  // Combine and sort folders and recipes
  type ListItem = (DashboardRecipe & { type: 'recipe' }) | (FolderResponseDto & { type: 'folder' });

  // At root level, we should only show recipes without a folderId
  // When inside a folder, show only recipes that belong to that folder
  // When searching, show all matching recipes regardless of folder
  const visibleRecipes = isSearching
    ? recipes // Show all recipes when searching
    : currentFolderId
      ? recipes.filter((recipe) => recipe.folderId === currentFolderId)
      : recipes.filter((recipe) => !recipe.folderId);

  // Folders are already filtered in DashboardMain, so just use them directly
  const visibleFolders = folders;

  // Keep track of folder timestamps to prevent reordering during drag operations
  const [folderTimestamps] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>();
    visibleFolders.forEach((folder) => {
      map.set(folder.id, getLatestUpdateInFolder(folder.id));
    });
    return map;
  });

  const combinedItems: ListItem[] = useMemo(() => {
    const items = [
      ...visibleFolders.map((folder) => ({ ...folder, type: 'folder' as const })),
      ...visibleRecipes.map((recipe) => ({ ...recipe, type: 'recipe' as const })),
    ];

    return items.sort((a, b) => {
      // Get the effective updated timestamp for each item
      let timestampA: number;
      let timestampB: number;

      if (a.type === 'folder') {
        // Use cached timestamp for folders to prevent reordering
        timestampA = folderTimestamps.get(a.id) || getLatestUpdateInFolder(a.id);
      } else {
        // For recipes, convert their timestamp to milliseconds
        timestampA = Math.max(toMillis(a.updatedAt), toMillis(a.createdAt));
      }

      if (b.type === 'folder') {
        // Use cached timestamp for folders to prevent reordering
        timestampB = folderTimestamps.get(b.id) || getLatestUpdateInFolder(b.id);
      } else {
        // For recipes, convert their timestamp to milliseconds
        timestampB = Math.max(toMillis(b.updatedAt), toMillis(b.createdAt));
      }

      // Sort by timestamp descending (newest first)
      return timestampB - timestampA;
    });
  }, [visibleFolders, visibleRecipes, folderTimestamps]);

  return (
    <Grid2 container spacing={2} data-testid="dashboard-recipes-container" sx={{ height: '100%' }}>
      {combinedItems.map((item) =>
        item.type === 'folder' ? (
          <FolderCard
            key={item.id}
            folder={item}
            onFolderNavigate={onFolderNavigate}
            handleContextMenu={handleContextMenu}
            recipePosters={folderRecipeData[item.id]?.posters || []}
            recipeCount={
              isSearching && countFilesInFolder ? countFilesInFolder(item.id) : folderRecipeData[item.id]?.count || 0
            }
            isEditing={editingFolder?.id === item.id}
            editingName={editingFolder?.id === item.id ? editingFolder.name : ''}
            onEditingChange={onSetEditingFolder}
            onRename={handleRenameFolder}
            onCancelRename={cancelRenameFolder}
            isDragOver={dragState.dragOverItemId === item.id && dragState.draggedItemId !== item.id}
            isDragging={dragState.draggedItemId === item.id}
            onDragStart={(e) => handleDragStart(e, item.id, 'folder')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) =>
              handleDrop(e, item.id, (itemId, itemType, targetFolderId) => {
                // Don't allow dropping a folder into itself
                if (itemId !== targetFolderId) {
                  onMoveItem?.(itemId, itemType, targetFolderId);
                }
              })
            }
          />
        ) : (
          <RecipeCard
            key={item.id}
            recipe={item}
            editingRecipe={editingRecipe}
            onSetEditingRecipe={onSetEditingRecipe}
            handleContextMenu={handleContextMenu}
            handleRenameRecipe={handleRenameRecipe}
            handleCancelRenameRecipe={cancelRename}
            isDragging={dragState.draggedItemId === item.id}
            onDragStart={(e) => handleDragStart(e, item.id, 'file')}
            onDragEnd={handleDragEnd}
            showOwner={isWorkspaceFiles}
          />
        ),
      )}
    </Grid2>
  );
};
