import { useState, useCallback, useEffect } from 'react';
import { Dialog, Typography, Box, Divider, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CaretIcon } from '@/UI/Icons/CaretIcon';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { useFoldersStore } from '@/state/folders.state';
import { FolderScope } from '@/enums/folder-scope.enum';
import { TeamIcon } from '@/UI/Icons/TeamIcon';
import { XIcon } from '@/UI/Icons/XIcon';
import { Flex, FlexCenVer, FlexCol } from '@/UI/styles';
import { Tag } from '@/UI/Tag/Tag';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import type { FolderResponseDto } from '@/types/folder.types';

interface MoveModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (targetFolderId: string | null, targetScope: FolderScope) => void | Promise<void>;
  itemName: string;
  itemId: string | null;
  isFolder: boolean;
  currentFolderId?: string | null;
  folders?: FolderResponseDto[];
  isWorkspaceScope?: boolean;
}

interface BreadcrumbItem {
  id: string | null;
  name: string;
  type?: 'dashboard' | 'scope' | 'folder';
  scope?: FolderScope;
}

export const MoveModal = ({
  open,
  onClose,
  onConfirm,
  itemName,
  itemId,
  isFolder,
  currentFolderId,
  isWorkspaceScope,
}: MoveModalProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const personalFolders = useFoldersStore((state) => state.personal.folders);
  const workspaceFolders = useFoldersStore((state) => state.workspace.folders);
  const [selectedScope, setSelectedScope] = useState<FolderScope>(
    isWorkspaceScope ? FolderScope.WORKSPACE : FolderScope.PERSONAL,
  );
  const folders = selectedScope === FolderScope.PERSONAL ? personalFolders : workspaceFolders;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedRoot, setSelectedRoot] = useState(false);
  const [currentPath, setCurrentPath] = useState<BreadcrumbItem[]>([]);
  const [displayFolders, setDisplayFolders] = useState<FolderResponseDto[]>([]);
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);

  // Get the current location name
  const currentLocationName = currentFolderId
    ? folders.find((f) => f.id === currentFolderId)?.name ||
      (isWorkspaceScope ? t(I18N_KEYS.NAVIGATION_DRAWER.WORKSPACE_FILES) : t(I18N_KEYS.NAVIGATION_DRAWER.MY_FILES))
    : isWorkspaceScope
      ? t(I18N_KEYS.NAVIGATION_DRAWER.WORKSPACE_FILES)
      : t(I18N_KEYS.NAVIGATION_DRAWER.MY_FILES);

  // Initialize path when modal opens
  useEffect(() => {
    if (open && currentPath.length === 0) {
      // Build initial path based on current location
      const initialPath: BreadcrumbItem[] = [
        { id: null, name: 'Dashboard', type: 'dashboard' },
        {
          id: null,
          name: isWorkspaceScope
            ? t(I18N_KEYS.NAVIGATION_DRAWER.WORKSPACE_FILES)
            : t(I18N_KEYS.NAVIGATION_DRAWER.MY_FILES),
          type: 'scope',
          scope: isWorkspaceScope ? FolderScope.WORKSPACE : FolderScope.PERSONAL,
        },
      ];

      // If item is in a folder, build the path to that folder
      if (currentFolderId) {
        const buildFolderPath = (folderId: string, folders: FolderResponseDto[]): BreadcrumbItem[] => {
          const folder = folders.find((f) => f.id === folderId);
          if (!folder) return [];

          if (folder.parentId) {
            return [...buildFolderPath(folder.parentId, folders), { id: folder.id, name: folder.name, type: 'folder' }];
          }
          return [{ id: folder.id, name: folder.name, type: 'folder' }];
        };

        const folderPath = buildFolderPath(currentFolderId, folders);
        initialPath.push(...folderPath);
      }

      setCurrentPath(initialPath);
      setSelectedRoot(false);
      setSelectedFolderId(null);
    }
  }, [open, currentFolderId, folders, isWorkspaceScope, t, currentPath.length]);

  // Determine what to display based on current path
  useEffect(() => {
    if (open && currentPath.length > 0) {
      const lastPathItem = currentPath[currentPath.length - 1];

      // If we're at Dashboard level, don't show folders
      if (lastPathItem.type === 'dashboard') {
        setDisplayFolders([]);
      } else {
        // Otherwise show folders for the current path
        const currentPathId = lastPathItem.id;
        const filteredFolders = folders.filter(
          (folder) => folder.parentId === currentPathId && !(isFolder && folder.id === itemId),
        );
        setDisplayFolders(filteredFolders);
      }
    }
  }, [open, currentPath, folders, isFolder, itemId]);

  const handleBreadcrumbClick = (index: number) => {
    const clickedItem = currentPath[index];

    // Navigate to the clicked breadcrumb
    setCurrentPath(currentPath.slice(0, index + 1));
    setSelectedFolderId(null);

    // If clicking on a scope breadcrumb, mark it as selected for move
    if (clickedItem.type === 'scope') {
      setSelectedRoot(true);
    } else {
      setSelectedRoot(false);
    }

    // If going back to dashboard, reset scope
    if (clickedItem.type === 'dashboard') {
      setSelectedScope(FolderScope.PERSONAL); // Default to personal
    }
  };

  const handleFolderClick = (folder: FolderResponseDto) => {
    setSelectedFolderId(folder.id);
    setSelectedRoot(false);
  };

  const handleFolderNavigate = (folder: FolderResponseDto) => {
    // Add to breadcrumb and navigate into folder
    setCurrentPath([...currentPath, { id: folder.id, name: folder.name, type: 'folder' }]);
    setSelectedFolderId(null);
    setSelectedRoot(false);
  };

  const handleConfirm = useCallback(async () => {
    if (selectedRoot) {
      // Moving to root (My Files)
      setIsLoading(true);
      try {
        await onConfirm(null, selectedScope);
        // Don't close here - let the parent handle it after state update
      } catch (_error) {
        // Handle error silently
        setIsLoading(false);
      }
    } else if (selectedFolderId) {
      // Moving to selected folder
      setIsLoading(true);
      try {
        await onConfirm(selectedFolderId, selectedScope);
        // Don't close here - let the parent handle it after state update
      } catch (_error) {
        // Handle error silently
        setIsLoading(false);
      }
    }
  }, [selectedFolderId, selectedRoot, onConfirm, selectedScope]);

  // Handle scope selection from Dashboard
  const handleScopeSelect = (scope: FolderScope) => {
    setSelectedScope(scope);
    setSelectedFolderId(null);
    setSelectedRoot(true); // Select the scope root by default

    // Update path to include the selected scope
    setCurrentPath([
      { id: null, name: 'Dashboard', type: 'dashboard' },
      {
        id: null,
        name:
          scope === FolderScope.PERSONAL
            ? t(I18N_KEYS.NAVIGATION_DRAWER.MY_FILES)
            : t(I18N_KEYS.NAVIGATION_DRAWER.WORKSPACE_FILES),
        type: 'scope',
        scope: scope,
      },
    ]);
  };

  // Allow move when a folder is selected or when root is explicitly selected
  // But prevent moving to the same location in the same scope
  const canMove =
    currentPath.length > 1 && // Must have selected at least a scope
    ((selectedFolderId !== null &&
      (selectedFolderId !== currentFolderId ||
        selectedScope !== (isWorkspaceScope ? FolderScope.WORKSPACE : FolderScope.PERSONAL))) ||
      (selectedRoot &&
        (currentFolderId !== null ||
          selectedScope !== (isWorkspaceScope ? FolderScope.WORKSPACE : FolderScope.PERSONAL))));

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentPath([]);
      setSelectedFolderId(null);
      setSelectedRoot(false);
      setDisplayFolders([]);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{ zIndex: 1600 }}
      slotProps={{
        paper: {
          sx: {
            background: color.Black92,
            borderRadius: 1,
            border: `1px solid ${color.White04_T}`,
            width: '420px',
            maxWidth: '420px',
            m: 0,
          },
        },
      }}
    >
      <FlexCol
        sx={{
          gap: 4,
          p: 3,
          pt: 5.25,
          pb: 3,
          position: 'relative',
        }}
      >
        <AppIconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12, color: color.White80_T }}>
          <XIcon width={20} height={20} />
        </AppIconButton>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="body-lg-md" sx={{ color: color.White100 }}>
            {t(I18N_KEYS.MAIN_DASHBOARD.MOVE_MODAL.TITLE, { name: itemName })}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Typography variant="body-sm-rg" sx={{ color: color.White64_T }}>
              {t(I18N_KEYS.MAIN_DASHBOARD.MOVE_MODAL.CURRENT_LOCATION)}
            </Typography>
            <Typography
              variant="body-sm-rg"
              sx={{
                color: color.White100,
                fontSize: theme.typography.pxToRem(12),
                fontWeight: 400,
                lineHeight: 'normal',
              }}
            >
              {currentLocationName}
            </Typography>
          </Box>
        </Box>

        <FlexCol>
          {/* Breadcrumbs */}
          <FlexCenVer>
            {currentPath.map((item, index) => (
              <FlexCenVer key={index}>
                <Typography
                  variant="body-sm-rg"
                  onClick={() => handleBreadcrumbClick(index)}
                  sx={{
                    color: index === currentPath.length - 1 ? color.White100 : color.White80_T,
                    px: 0.75,
                    // py: 0.5,
                    borderRadius: 0.5,
                    cursor: index === currentPath.length - 1 ? 'default' : 'pointer',
                    '&:hover': {
                      bgcolor: index === currentPath.length - 1 ? 'transparent' : color.White08_T,
                    },
                  }}
                >
                  {item.name}
                </Typography>

                {index < currentPath.length - 1 && (
                  <CaretIcon
                    width={12}
                    height={12}
                    color={color.White80_T}
                    style={{ transform: 'rotate(-90deg)', marginLeft: 4, marginRight: 4 }}
                  />
                )}
              </FlexCenVer>
            ))}
          </FlexCenVer>

          <Divider sx={{ bgcolor: color.White16_T, my: 1 }} />

          {/* Content based on current selection */}
          <FlexCol sx={{ maxHeight: '300px', overflowY: 'auto' }}>
            {currentPath.length === 1 ? (
              // Show scope options when at Dashboard level
              <>
                {/* My files option */}
                <FlexCenVer
                  onClick={() => handleScopeSelect(FolderScope.PERSONAL)}
                  sx={{
                    borderRadius: 1,
                    gap: 1,
                    py: 1,
                    px: 1.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: color.White04_T },
                  }}
                >
                  <img src="/icons/files.svg" alt="files" style={{ width: '20px', height: '20px' }} />
                  <Typography variant="body-std-rg" sx={{ color: color.White100 }}>
                    {t(I18N_KEYS.NAVIGATION_DRAWER.MY_FILES)}
                  </Typography>
                </FlexCenVer>

                {/* Workspace files option */}
                <FlexCenVer
                  onClick={() => handleScopeSelect(FolderScope.WORKSPACE)}
                  sx={{
                    borderRadius: 1,
                    gap: 1,
                    py: 1,
                    px: 1.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: color.White04_T },
                  }}
                >
                  <TeamIcon width={20} height={20} />
                  <Typography variant="body-std-rg" sx={{ color: color.White100 }}>
                    {t(I18N_KEYS.NAVIGATION_DRAWER.WORKSPACE_FILES)}
                  </Typography>
                </FlexCenVer>
              </>
            ) : (
              // Show folders when in a scope
              displayFolders.map((folder) => (
                <FlexCenVer
                  key={folder.id}
                  onMouseEnter={() => setHoveredFolderId(folder.id)}
                  onMouseLeave={() => setHoveredFolderId(null)}
                  onClick={() => handleFolderClick(folder)}
                  sx={{
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderRadius: 1,
                    bgcolor: selectedFolderId === folder.id ? color.Black84 : 'transparent',
                    '&:hover': { bgcolor: selectedFolderId === folder.id ? color.Black84 : color.White04_T },
                  }}
                >
                  <FlexCenVer
                    sx={{
                      gap: 1,
                      py: 1,
                      px: 1.5,
                      flex: 1,
                    }}
                  >
                    <Typography variant="body-std-rg" sx={{ color: color.White100 }}>
                      {folder.name}
                    </Typography>
                    {folder.id === currentFolderId && (
                      <Box component="span" sx={{ position: 'relative', top: '-1px' }}>
                        <Tag
                          text={t(I18N_KEYS.MAIN_DASHBOARD.MOVE_MODAL.CURRENT)}
                          textColor={color.White80_T}
                          bgColor={color.White08_T}
                        />
                      </Box>
                    )}
                  </FlexCenVer>
                  {hoveredFolderId === folder.id &&
                    folders.some((f) => f.parentId === folder.id && !(isFolder && f.id === itemId)) && (
                      <AppIconButton
                        size="medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleFolderNavigate(folder);
                        }}
                        sx={{ mr: 0.5 }}
                      >
                        <CaretIcon width={16} height={16} style={{ transform: 'rotate(-90deg)' }} />
                      </AppIconButton>
                    )}
                </FlexCenVer>
              ))
            )}
          </FlexCol>
        </FlexCol>

        <Flex sx={{ gap: 1, justifyContent: 'flex-end' }}>
          <ButtonContained mode="text" onClick={onClose} size="medium" sx={{ px: 2 }}>
            {t(I18N_KEYS.MAIN_DASHBOARD.MOVE_MODAL.CANCEL)}
          </ButtonContained>
          <ButtonContained
            mode="filled-light"
            onClick={() => void handleConfirm()}
            disabled={isLoading || !canMove}
            size="medium"
            sx={{
              px: 2,
              bgcolor: canMove ? color.Yellow100 : color.White04_T,
              color: canMove ? color.Black100 : color.White16_T,
              '&:hover': { bgcolor: canMove ? color.Yellow100 : color.White04_T, opacity: canMove ? 0.9 : 1 },
            }}
          >
            {t(I18N_KEYS.MAIN_DASHBOARD.MOVE_MODAL.MOVE)}
          </ButtonContained>
        </Flex>
      </FlexCol>
    </Dialog>
  );
};
