import { Grid2, Box, Typography, Card, CardContent, IconButton, InputAdornment, Input } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CheckIcon from '@mui/icons-material/Check';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenVer, FlexCol } from '@/UI/styles';
import { FolderEmptyIcon } from '@/UI/Icons/FolderEmptyIcon';
import type { FolderResponseDto } from '@/types/folder.types';

interface FolderCardProps {
  folder: FolderResponseDto;
  onFolderNavigate?: (folderId?: string | null) => void;
  handleContextMenu?: (event: React.MouseEvent<HTMLDivElement>, id: string, itemType?: 'folder' | 'recipe') => void;
  recipePosters?: string[];
  recipeCount?: number;
  isEditing?: boolean;
  editingName?: string;
  onEditingChange?: (id: string, name: string) => void;
  onRename?: (id: string, name: string) => void;
  onCancelRename?: (id: string) => void;
  isDragOver?: boolean;
  isDragging?: boolean;
  onDragOver?: (e: React.DragEvent, folderId: string) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, folderId: string) => void;
  onDragStart?: (e: React.DragEvent, itemId: string) => void;
  onDragEnd?: () => void;
}

export const FolderCard = ({
  folder,
  onFolderNavigate,
  handleContextMenu,
  recipePosters = [],
  recipeCount = 0,
  isEditing = false,
  editingName = '',
  onEditingChange,
  onRename,
  onCancelRename,
  isDragOver = false,
  isDragging = false,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
}: FolderCardProps) => {
  const [hovered, setHovered] = useState(false);
  const { t } = useTranslation();

  const handleClick = () => {
    if (onFolderNavigate && !isEditing) {
      onFolderNavigate(folder.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onRename) {
      onRename(folder.id, editingName);
    } else if (e.key === 'Escape' && onCancelRename) {
      onCancelRename(folder.id);
    }
  };

  const handleRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (handleContextMenu) {
      handleContextMenu(e, folder.id, 'folder');
    }
  };

  // Use provided recipe posters
  const images = recipePosters;
  const totalFiles = recipeCount || 0;
  const extraCount = totalFiles > 4 ? totalFiles - 4 : 0;

  return (
    <Grid2 size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }} sx={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
      <Card
        data-testid={`folder-card-${folder.id}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        draggable={!isEditing}
        onDragStart={(e) => onDragStart?.(e, folder.id)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver?.(e, folder.id);
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          onDrop?.(e, folder.id);
        }}
        sx={{
          maxWidth: 345,
          background: 'none',
          backgroundColor: 'transparent',
          backgroundImage: 'none',
          boxShadow: 'none',
          cursor: isEditing ? 'default' : isDragging ? 'grabbing' : 'pointer',
          border: 'none',
          transition: 'border 0.2s',
        }}
        onClick={handleClick}
        onContextMenu={handleRightClick}
      >
        <Box
          sx={{
            width: '100%',
            height: 240,
            bgcolor: color.Black92,
            borderRadius: 2,
            position: 'relative',
            border: `1px solid ${isDragOver ? color.White40_T : color.White08_T}`,
            overflow: 'hidden',
            transition: 'border-color 0.2s ease-in-out',
          }}
        >
          {images.length > 0 ? (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gridTemplateRows: 'repeat(2, 1fr)',
                  gap: 1.5,
                  padding: 2,
                  height: '100%',
                  width: '100%',
                  position: 'relative',
                }}
              >
                {[0, 1, 2, 3].map((index) => {
                  const image = images[index];
                  const isLastSlot = index === 3;
                  const shouldShowOverlay = isLastSlot && extraCount > 0;

                  if (!image) {
                    // Return empty box for slots without images
                    return <Box key={index} />;
                  }

                  // Check if this is a folder icon
                  if (image === 'folder') {
                    return (
                      <Box
                        key={index}
                        sx={{
                          borderRadius: 2,
                          bgcolor: color.Black92,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          position: 'relative',
                          border: `1px solid ${color.White08_T}`,
                        }}
                      >
                        <Box sx={{ opacity: shouldShowOverlay ? 0.5 : 1 }}>
                          <FolderEmptyIcon width={32} height={32} color={color.White80_T} />
                        </Box>
                        {shouldShowOverlay && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              borderRadius: 2,
                              bgcolor: color.Black64_T,
                            }}
                          />
                        )}
                      </Box>
                    );
                  }

                  return (
                    <Box
                      key={index}
                      sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        border: `1px solid ${color.White08_T}`,
                      }}
                    >
                      {image && image !== 'folder' ? (
                        <>
                          <img
                            src={image}
                            alt="recipe poster"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: 'center',
                            }}
                          />
                          {shouldShowOverlay && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                borderRadius: 2,
                                backgroundImage: `linear-gradient(90deg, ${color.Black64_T} 0%, ${color.Black64_T} 100%)`,
                              }}
                            />
                          )}
                        </>
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            backgroundImage: `linear-gradient(90deg, ${color.Black64_T} 0%, ${color.Black64_T} 100%)`,
                          }}
                        />
                      )}
                    </Box>
                  );
                })}
                {extraCount > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      color: color.White100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 'calc(50% + 10px)',
                      width: 'calc(50% + 12px)',
                    }}
                  >
                    +{extraCount}
                  </Box>
                )}
              </Box>
              {(hovered || isDragOver) && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: isDragOver ? color.White16_T : color.White08_T,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </>
          ) : (
            <>
              <Box
                sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <img src="/icons/folder.svg" alt="folder" style={{ width: '42px', height: '42px' }} />
              </Box>
              {(hovered || isDragOver) && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: isDragOver ? color.White16_T : color.White08_T,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </>
          )}
        </Box>
        <CardContent
          sx={{
            pt: 1,
            pb: 1,
            pl: 1,
            backgroundColor: 'transparent',
            boxShadow: 'none',
            backgroundImage: 'initial',
          }}
        >
          <FlexCenVer sx={{ gap: 1 }}>
            <FolderEmptyIcon width={24} height={24} color={color.White64_T} />
            <FlexCol>
              {isEditing ? (
                <Input
                  inputRef={(input: HTMLInputElement | null) => input && input.focus()}
                  onFocus={(e) => e.currentTarget.setSelectionRange(0, e.currentTarget.value.length)}
                  value={editingName}
                  onChange={(e) => onEditingChange?.(folder.id, e.target.value)}
                  onKeyDown={handleKeyDown}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="rename recipe"
                        onClick={(e) => {
                          e.preventDefault();
                          if (folder.id) {
                            onRename?.(folder.id, editingName);
                          }
                        }}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  }
                />
              ) : (
                <Typography variant="body-std-rg">{folder.name}</Typography>
              )}
              <Typography variant="body-sm-rg" sx={{ color: color.White64_T }}>
                {totalFiles === 1
                  ? t(I18N_KEYS.MAIN_DASHBOARD.FOLDER_CARD.FILE_COUNT_SINGULAR, { count: totalFiles })
                  : t(I18N_KEYS.MAIN_DASHBOARD.FOLDER_CARD.FILE_COUNT_PLURAL, { count: totalFiles })}
              </Typography>
            </FlexCol>
          </FlexCenVer>
        </CardContent>
      </Card>
    </Grid2>
  );
};
