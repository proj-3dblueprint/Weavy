import {
  Box,
  CardContent,
  CardMedia,
  Input,
  CardActionArea,
  Card,
  IconButton,
  InputAdornment,
  Typography,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import { useState } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { getTimeDiffInWords } from '@/utils/date.utils';
import { toMillis } from '@/utils/folder.utils';
import { I18N_KEYS } from '@/language/keys';
import { useUserStore } from '@/state/user.state';
import { FlexCenVer, FlexCol } from '@/UI/styles';
import { useDashboardRecipes } from './useDashboardRecipes';
import type { DashboardRecipe } from '@/state/dashboardRecipes.state';

interface RecipeCardProps {
  recipe: DashboardRecipe & { owner?: string; ownerName?: string };
  editingRecipe: { id: string | null; name: string };
  handleContextMenu: (e: React.MouseEvent<HTMLDivElement>, id: string, itemType?: 'folder' | 'recipe') => void;
  handleRenameRecipe: (id: string, name: string) => void;
  handleCancelRenameRecipe: (id: string, oldName: string) => void;
  onSetEditingRecipe: (id: string, name: string) => void;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent, itemId: string) => void;
  onDragEnd?: () => void;
  showOwner?: boolean;
}

export const RecipeCard = ({
  recipe,
  editingRecipe,
  handleContextMenu,
  handleRenameRecipe,
  handleCancelRenameRecipe,
  onSetEditingRecipe,
  isDragging = false,
  onDragStart,
  onDragEnd,
  showOwner = false,
}: RecipeCardProps) => {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const { goToRecipe } = useDashboardRecipes();
  const { t } = useTranslation();
  const currentUser = useUserStore((state) => state.user);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editingRecipe.id) {
        handleRenameRecipe(editingRecipe.id, editingRecipe.name);
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (editingRecipe.id) {
        handleCancelRenameRecipe(editingRecipe.id, editingRecipe.name);
      }
    }
  };

  return (
    <Grid2 size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }} sx={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
      <Card
        onMouseEnter={() => setHoveredCardId(recipe.id)}
        onMouseLeave={() => setHoveredCardId(null)}
        onContextMenu={(e) => {
          e.stopPropagation();
          handleContextMenu(e, recipe.id, 'recipe');
        }}
        draggable={!editingRecipe.id}
        onDragStart={(e) => onDragStart?.(e, recipe.id)}
        onDragEnd={onDragEnd}
        sx={{
          maxWidth: 345,
          background: 'none',
          backgroundColor: 'transparent !important',
          backgroundImage: 'none !important',
          boxShadow: 'none !important',
          cursor: editingRecipe.id ? 'default' : isDragging ? 'grabbing' : 'grab',
        }}
      >
        <CardActionArea disableRipple sx={{ position: 'relative' }} onClick={() => goToRecipe(recipe.id)}>
          <Box
            sx={{
              overflow: 'hidden',
              border: '1px solid',
              borderRadius: 2,
              borderColor: hoveredCardId === recipe.id ? color.White08_T : color.Dark_Grey,
              height: 240,
              position: 'relative',
            }}
          >
            <CardMedia
              component="img"
              height="100%"
              image={recipe.poster || '/workflow-default-cover.png'}
              alt="recipe poster"
            />
            {hoveredCardId === recipe.id && (
              <Box sx={{ position: 'absolute', inset: 0, backgroundColor: color.White08_T, pointerEvents: 'none' }} />
            )}
          </Box>
        </CardActionArea>
        <CardContent
          sx={{
            py: 1,
            pl: 1,
            backgroundColor: 'transparent',
            boxShadow: 'none',
            backgroundImage: 'initial',
            flexDirection: 'column',
          }}
        >
          <FlexCenVer>
            <FlexCol>
              {editingRecipe?.id === recipe.id ? (
                <Input
                  inputRef={(input: HTMLInputElement | null) => input && input.focus()}
                  onFocus={(e) => e.currentTarget.setSelectionRange(0, e.currentTarget.value.length)}
                  value={editingRecipe?.name || ''}
                  onChange={(e) => onSetEditingRecipe(recipe.id, e.target.value)}
                  onKeyDown={onKeyDown}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="rename recipe"
                        onClick={(e) => {
                          e.preventDefault();
                          if (editingRecipe.id) {
                            handleRenameRecipe(editingRecipe.id, editingRecipe.name);
                          }
                        }}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  }
                />
              ) : (
                <Typography variant="body-std-rg">{recipe.name}</Typography>
              )}
              <Typography variant="body-sm-rg" sx={{ color: color.White64_T }}>
                {showOwner ? (
                  <>
                    Owned by{' '}
                    {currentUser && recipe.owner && recipe.owner === currentUser.uid ? 'you' : recipe.ownerName || '-'}
                  </>
                ) : recipe.updatedAt ? (
                  t(I18N_KEYS.DASHBOARD.PAGES.FILES.RECIPE_CARD.SUBTITLE_LAST_EDITED, {
                    date: getTimeDiffInWords(toMillis(recipe.updatedAt)),
                  })
                ) : (
                  t(I18N_KEYS.DASHBOARD.PAGES.FILES.RECIPE_CARD.SUBTITLE_CREATED, {
                    date: getTimeDiffInWords(toMillis(recipe.createdAt)),
                  })
                )}
              </Typography>
            </FlexCol>
          </FlexCenVer>
        </CardContent>
      </Card>
    </Grid2>
  );
};
