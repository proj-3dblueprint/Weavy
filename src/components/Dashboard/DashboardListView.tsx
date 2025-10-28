import { SetStateAction, Dispatch, useMemo, useState } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TablePagination, TableRow, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getTimeDiffInWords } from '@/utils/date.utils';
import { toMillis, createGetLatestUpdateInFolder } from '@/utils/folder.utils';
import { color } from '@/colors';
import { FlexCenVer } from '@/UI/styles';
import { DashboardRecipe } from '@/state/dashboardRecipes.state';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useUserStore } from '@/state/user.state';
import { I18N_KEYS } from '@/language/keys';
import { useDashboardRecipes } from './useDashboardRecipes';
import { EnhancedTableHead } from './components/EnhancedTableHead';
import { FolderThumbnail } from './components/FolderThumbnail';
import { EditableListItem } from './components/EditableListItem';
import { descendingComparator, calculateFolderRecipeData, type ListItem } from './utils/listView.utils';
import type { FolderResponseDto } from '@/types/folder.types';
import type { Order, AllowedRecipeKeys } from './types/listView.types';

interface DashboardListViewProps {
  recipes: (DashboardRecipe & { folderId?: string | null; ownerName?: string; owner?: string })[];
  allRecipes?: (DashboardRecipe & { folderId?: string | null; ownerName?: string; owner?: string })[];
  folders?: FolderResponseDto[];
  allFolders?: FolderResponseDto[];
  editingRecipe: { id: string | null; name: string };
  handleRenameRecipe: (name: string, id: string) => void;
  handleContextMenu: (event: React.MouseEvent<HTMLDivElement>, id: string, itemType?: 'folder' | 'recipe') => void;
  setEditingRecipe: Dispatch<SetStateAction<{ id: string | null; name: string }>>;
  cancelRename: (id: string, oldName: string) => void;
  onFolderNavigate?: (folderId?: string | null) => void;
  currentFolderId?: string | null;
  editingFolder?: { id: string | null; name: string };
  setEditingFolder?: Dispatch<SetStateAction<{ id: string | null; name: string }>>;
  handleRenameFolder?: (id: string, name: string) => void;
  cancelRenameFolder?: (id: string) => void;
  countFilesInFolder?: (folderId: string) => number;
  isSearching?: boolean;
  onMoveItem?: (itemId: string, itemType: 'file' | 'folder', targetFolderId: string) => void;
  isWorkspaceFiles?: boolean;
}

function DashboardListView({
  recipes,
  allRecipes,
  folders = [],
  allFolders = [],
  editingRecipe,
  handleRenameRecipe,
  setEditingRecipe,
  cancelRename,
  handleContextMenu,
  onFolderNavigate,
  currentFolderId,
  editingFolder,
  setEditingFolder,
  handleRenameFolder,
  cancelRenameFolder,
  countFilesInFolder,
  isSearching = false,
  onMoveItem,
  isWorkspaceFiles = false,
}: DashboardListViewProps) {
  const foldersForRecursion = allFolders || folders;
  const recipesForLatestUpdate = allRecipes || recipes;

  const getLatestUpdateInFolder = useMemo(
    () => createGetLatestUpdateInFolder(foldersForRecursion, recipesForLatestUpdate),
    [foldersForRecursion, recipesForLatestUpdate],
  );

  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<AllowedRecipeKeys>('updatedAt');
  const [page, setPage] = useState(0);
  const [dense] = useState(false);
  const [rowsPerPage] = useState(5);
  const [oldRecipeName] = useState({ id: null, name: '' });

  const { goToRecipe } = useDashboardRecipes();
  const currentUser = useUserStore((state) => state.user);
  const { t } = useTranslation();
  const { dragState, handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop } = useDragAndDrop();

  const folderRecipeData = useMemo(
    () => calculateFolderRecipeData(folders, recipes, allRecipes, allFolders),
    [folders, recipes, allRecipes, allFolders],
  );

  const handleRequestSort = (_e: React.MouseEvent<unknown>, property: AllowedRecipeKeys) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleClick = (evt: React.MouseEvent<HTMLDivElement>, id: string) => {
    if (evt.detail == 1) {
      goToRecipe(id, false);
    }
  };

  const handleChangePage = (_e: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => setPage(newPage);

  const visibleFolders = folders;
  const visibleRecipes = isSearching
    ? recipes // When searching, show all recipes regardless of folder
    : currentFolderId
      ? recipes.filter((recipe) => recipe.folderId === currentFolderId)
      : recipes.filter((recipe) => !recipe.folderId);

  const [folderTimestamps] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>();
    visibleFolders.forEach((folder) => {
      map.set(folder.id, getLatestUpdateInFolder(folder.id));
    });
    return map;
  });

  const combinedItems: ListItem[] = useMemo(() => {
    const folderItems = visibleFolders.map((folder) => ({ ...folder, type: 'folder' as const }));
    const recipeItems = visibleRecipes.map((recipe) => ({ ...recipe, type: 'recipe' as const }));
    return [...folderItems, ...recipeItems];
  }, [visibleFolders, visibleRecipes]);

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - combinedItems.length) : 0;

  const visibleRows = useMemo(() => {
    const sorted = [...combinedItems].sort((a, b) => {
      if (orderBy === 'updatedAt' || orderBy === 'createdAt') {
        let updatedAt_A: number;
        let updatedAt_B: number;

        if (a.type === 'folder') {
          updatedAt_A = folderTimestamps.get(a.id) || getLatestUpdateInFolder(a.id);
        } else {
          updatedAt_A = Math.max(toMillis(a.updatedAt), toMillis(a.createdAt));
        }

        if (b.type === 'folder') {
          updatedAt_B = folderTimestamps.get(b.id) || getLatestUpdateInFolder(b.id);
        } else {
          updatedAt_B = Math.max(toMillis(b.updatedAt), toMillis(b.createdAt));
        }

        const compareResult = updatedAt_B - updatedAt_A;
        return order === 'desc' ? compareResult : -compareResult;
      } else if (orderBy === 'files') {
        const filesA = a.type === 'folder' ? folderRecipeData[a.id]?.count || 0 : 0;
        const filesB = b.type === 'folder' ? folderRecipeData[b.id]?.count || 0 : 0;

        const compareResult = filesB - filesA;
        return order === 'desc' ? compareResult : -compareResult;
      } else if (orderBy === 'ownerName') {
        let ownerA = '';
        let ownerB = '';

        if (a.type === 'recipe') {
          ownerA = currentUser && a.owner && a.owner === currentUser.uid ? t(I18N_KEYS.GENERAL.YOU) : a.ownerName || '';
        }
        if (b.type === 'recipe') {
          ownerB = currentUser && b.owner && b.owner === currentUser.uid ? t(I18N_KEYS.GENERAL.YOU) : b.ownerName || '';
        }

        const compareResult = ownerB.toLowerCase().localeCompare(ownerA.toLowerCase());
        return order === 'desc' ? compareResult : -compareResult;
      } else {
        if (a.type === 'folder' && b.type === 'recipe') return -1;
        if (a.type === 'recipe' && b.type === 'folder') return 1;

        const compareResult = descendingComparator(a, b, orderBy as any);
        return order === 'desc' ? compareResult : -compareResult;
      }
    });

    return sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [
    combinedItems,
    order,
    orderBy,
    page,
    rowsPerPage,
    getLatestUpdateInFolder,
    folderTimestamps,
    folderRecipeData,
    currentUser,
  ]);

  const handleCancelRenameRecipe = (id: string) => {
    cancelRename(oldRecipeName.name, id);
    setEditingRecipe({ id: null, name: '' });
  };

  const handleCancelRenameFolder = (id: string) => {
    if (cancelRenameFolder) {
      cancelRenameFolder(id);
    }
  };

  if (!recipes.length && !folders.length) {
    return null;
  }

  return (
    <Box data-testid="dashboard-table-view-container">
      <TableContainer>
        <Table
          aria-labelledby="tableTitle"
          size={dense ? 'small' : 'medium'}
          sx={{
            '& .MuiTableCell-root': {
              borderBottom: 'none',
            },
          }}
        >
          <EnhancedTableHead
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
            isWorkspaceFiles={isWorkspaceFiles}
          />
          <TableBody>
            {visibleRows.map((item, index) => {
              const labelId = `enhanced-table-checkbox-${index}`;
              const isFolder = item.type === 'folder';

              return (
                <TableRow
                  hover
                  onClick={(event) => {
                    if (isFolder && onFolderNavigate && !editingFolder?.id) {
                      onFolderNavigate(item.id);
                    } else if (!isFolder && !editingRecipe.id) {
                      handleClick(event, item.id);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleContextMenu(e, item.id, isFolder ? 'folder' : 'recipe');
                  }}
                  role="checkbox"
                  tabIndex={-1}
                  key={item.id}
                  sx={{
                    borderRadius: 1,
                    cursor:
                      (isFolder && editingFolder?.id === item.id) || (!isFolder && editingRecipe.id)
                        ? 'default'
                        : 'grab',
                    border: 'none',
                    opacity: dragState.draggedItemId === item.id ? 0.5 : 1,
                    backgroundColor:
                      isFolder && dragState.dragOverItemId === item.id && dragState.draggedItemId !== item.id
                        ? color.Black88
                        : 'transparent',
                    transition: 'opacity 0.2s, background-color 0.2s',
                  }}
                  draggable={(isFolder && !editingFolder?.id) || (!isFolder && !editingRecipe.id)}
                  onDragStart={(e) => {
                    if (isFolder && !editingFolder?.id) {
                      handleDragStart(e, item.id, 'folder');
                    } else if (!isFolder && !editingRecipe.id) {
                      handleDragStart(e, item.id, 'file');
                    }
                  }}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => {
                    if (isFolder) {
                      e.preventDefault();
                      handleDragOver(e, item.id);
                    }
                  }}
                  onDragLeave={() => isFolder && handleDragLeave()}
                  onDrop={(e) => {
                    if (isFolder) {
                      e.preventDefault();
                      handleDrop(e, item.id, (itemId, itemType, targetFolderId) => {
                        if (itemId !== targetFolderId) {
                          onMoveItem?.(itemId, itemType, targetFolderId);
                        }
                      });
                    }
                  }}
                >
                  <TableCell component="th" id={labelId} scope="row" padding="none" sx={{ p: 0, borderRadius: 2 }}>
                    <FlexCenVer sx={{ p: 1 }}>
                      <Box
                        sx={{
                          width: '144px',
                          height: '72px',
                          borderRadius: 2,
                          position: 'relative',
                          border: `1px solid ${color.White08_T}`,
                          overflow: 'hidden',
                        }}
                      >
                        {isFolder ? (
                          <FolderThumbnail folderId={item.id} folderRecipeData={folderRecipeData} />
                        ) : (
                          <img
                            style={{
                              display: 'block',
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: 1,
                            }}
                            src={item.poster || '/workflow-default-cover-list.png'}
                          />
                        )}
                      </Box>
                      <Box data-testid="dashboard-list-view-recipe-name-container" sx={{ ml: 3 }}>
                        {isFolder && editingFolder && editingFolder.id === item.id ? (
                          <EditableListItem
                            isEditing={true}
                            value={editingFolder.name}
                            onChange={(name) => setEditingFolder && setEditingFolder((prev) => ({ ...prev, name }))}
                            onConfirm={() => {
                              if (editingFolder.id && handleRenameFolder) {
                                handleRenameFolder(editingFolder.id, editingFolder.name);
                              }
                            }}
                            onCancel={() => {
                              if (editingFolder.id) {
                                handleCancelRenameFolder(editingFolder.id);
                              }
                            }}
                            displayValue={item.name}
                          />
                        ) : !isFolder && editingRecipe.id === item.id ? (
                          <EditableListItem
                            isEditing={true}
                            value={editingRecipe.name}
                            onChange={(name) => setEditingRecipe((prev) => ({ ...prev, name }))}
                            onConfirm={() => {
                              if (editingRecipe.id) {
                                handleRenameRecipe(editingRecipe.name, editingRecipe.id);
                              }
                            }}
                            onCancel={() => {
                              if (editingRecipe.id) {
                                handleCancelRenameRecipe(editingRecipe.id);
                              }
                            }}
                            displayValue={item.name}
                          />
                        ) : (
                          <EditableListItem isEditing={false} displayValue={item.name} />
                        )}
                      </Box>
                    </FlexCenVer>
                  </TableCell>
                  {isWorkspaceFiles && (
                    <TableCell align="center">
                      <Typography variant="body-sm-rg">
                        {!isFolder && item.type === 'recipe'
                          ? currentUser && item.owner && item.owner === currentUser.uid
                            ? t(I18N_KEYS.GENERAL.YOU)
                            : item.ownerName || '-'
                          : '-'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <Typography variant="body-sm-rg">
                      {isFolder
                        ? `${
                            isSearching && countFilesInFolder
                              ? countFilesInFolder(item.id)
                              : folderRecipeData[item.id]?.count || 0
                          } ${
                            (isSearching && countFilesInFolder
                              ? countFilesInFolder(item.id)
                              : folderRecipeData[item.id]?.count || 0) === 1
                              ? t(I18N_KEYS.GENERAL.FILE)
                              : t(I18N_KEYS.GENERAL.FILES)
                          }`
                        : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body-sm-rg">
                      {item.updatedAt ? getTimeDiffInWords(toMillis(item.updatedAt)) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ borderRadius: 2 }}>
                    <Typography variant="body-sm-rg">
                      {item.createdAt ? getTimeDiffInWords(toMillis(item.createdAt)) : '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
            {emptyRows > 0 && (
              <TableRow
                style={{
                  height: (dense ? 33 : 53) * emptyRows,
                }}
              >
                <TableCell colSpan={7} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[]}
        component="div"
        count={combinedItems.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
      />
    </Box>
  );
}

export default DashboardListView;
