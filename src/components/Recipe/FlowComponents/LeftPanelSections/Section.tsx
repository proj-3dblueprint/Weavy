import { DragEvent } from 'react';
import { Box, Typography, Grid2 as Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { FlexColCenHorVer } from '@/UI/styles';
import { EXTERNAL_LINKS } from '@/consts/externalLinks.consts';
import { LeftPanelMenuItem } from './LeftPanelMenuItem';
import { MENU_ITEM_ID_TEXT_MAP } from './MenuItemIdTextsMap';
import type { MenuItem, ModelItem } from '@/state/nodes/nodes.types';

function isLeafNode(node: MenuItem): node is ModelItem {
  return (node as ModelItem).isLeaf === true;
}

export function Section({
  node,
  hideTitle = false,
  onDragEnd,
  onDragStart,
  getShouldDisable,
  getIsSelected,
  isLast = false,
}: {
  node: MenuItem;
  hideTitle?: boolean;
  isLast?: boolean;
  onDragStart: (event: DragEvent<HTMLDivElement>, item: ModelItem) => void;
  onDragEnd: (event: DragEvent<HTMLDivElement>) => void;
  getShouldDisable: (id: string) => boolean;
  getIsSelected: (id: string) => boolean;
}) {
  const { t } = useTranslation();

  if (!node) return null;

  if (isLeafNode(node)) {
    const menuItem: ModelItem = {
      ...node,
      description: node.description ?? '',
      icon: node.icon,
      isNew: node.isNew ?? undefined,
    };
    return (
      <Grid size={6}>
        <LeftPanelMenuItem
          item={menuItem}
          onDragEnd={onDragEnd}
          onDragStart={onDragStart}
          disabled={getShouldDisable(node.id)}
          selected={getIsSelected(node.id)}
        />
      </Grid>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {!hideTitle && (
        <Typography variant="label-sm-rg" color={color.White64_T} sx={{ mt: 2, mb: 1.5 }}>
          {t(
            I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.MENU_TITLES[
              MENU_ITEM_ID_TEXT_MAP[node.id] as keyof typeof I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.MENU_TITLES
            ],
          )}
        </Typography>
      )}
      {node.id === 'userModels' && (!node.children || node.children.length === 0) ? (
        <FlexColCenHorVer sx={{ mt: 1.5, mb: 3 }}>
          <ButtonContained
            size="small"
            mode="outlined"
            onClick={() => window.open(EXTERNAL_LINKS.importModelTutorial, '_blank')}
          >
            {t(I18N_KEYS.DASHBOARD.PAGES.MY_MODELS.EMPTY_STATE.ACTION)}
          </ButtonContained>
        </FlexColCenHorVer>
      ) : (
        <Grid container spacing={1} sx={{ mt: 1, mb: isLast ? 0 : 3 }}>
          {node.children &&
            node.children.map((child) => (
              <Section
                key={child.id}
                node={child}
                hideTitle={false}
                onDragEnd={onDragEnd}
                onDragStart={onDragStart}
                getShouldDisable={getShouldDisable}
                getIsSelected={getIsSelected}
              />
            ))}
        </Grid>
      )}
    </Box>
  );
}
