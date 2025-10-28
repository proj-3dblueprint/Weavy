import { MouseEvent, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContextMenu } from '@/UI/AppContextMenu/AppContextMenu';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { MenuAction } from '@/components/Menu/Actions';
import { I18N_KEYS } from '@/language/keys';
import { useNodeFiltersStore } from '@/state/nodes/nodes.state';
import { color } from '@/colors';
import { SortIcon } from '@/UI/Icons/SortIcon';

const MENU_ITEM_STYLES = {
  '&.Mui-selected': {
    backgroundColor: color.Black92,
    '&:focus': {
      backgroundColor: color.Black92,
    },
    '&:hover': {
      backgroundColor: color.Black84,
    },
  },
};

export const SortMenu = () => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);

  const { t } = useTranslation();
  const { filters, setOrderBy } = useNodeFiltersStore();

  const items: MenuAction[] = useMemo(
    () => [
      {
        type: 'section_label',
        text: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.FILTERS.ORDERBY.LABEL),
      },
      {
        name: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.FILTERS.ORDERBY.FEATURED),
        action: () => setOrderBy('featured'),
        selected: filters?.orderBy === 'featured',
        sx: MENU_ITEM_STYLES,
      },
      {
        name: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.FILTERS.ORDERBY.PRICE_ASC),
        action: () => setOrderBy('price_asc'),
        selected: filters?.orderBy === 'price_asc',
        sx: MENU_ITEM_STYLES,
      },
      {
        name: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.FILTERS.ORDERBY.PRICE_DESC),
        action: () => setOrderBy('price_desc'),
        selected: filters?.orderBy === 'price_desc',
        sx: MENU_ITEM_STYLES,
      },
    ],
    [filters?.orderBy, setOrderBy, t],
  );

  return (
    <>
      <AppIconButton onClick={() => setMenuAnchorEl(filterBtnRef.current)} ref={filterBtnRef} width={24} height={24}>
        <SortIcon width={16} height={16} />
      </AppIconButton>
      <AppContextMenu
        width="160px"
        noClose
        open={!!menuAnchorEl}
        onClose={(e: MouseEvent) => {
          if ('stopPropagation' in e) {
            e.stopPropagation();
          }
          setMenuAnchorEl(null);
        }}
        anchorEl={menuAnchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        items={items}
      />
    </>
  );
};
