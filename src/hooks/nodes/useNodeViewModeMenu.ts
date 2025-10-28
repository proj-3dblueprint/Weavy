import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import { MenuAction } from '@/components/Menu/Actions';
import { NodeViewMode } from '@/enums/node-view-mode.enum';

export const useNodeViewModesMenuItems = (
  viewMode: NodeViewMode,
  setViewMode: (viewMode: NodeViewMode) => void,
): MenuAction[] => {
  const { t } = useTranslation();
  return [
    {
      type: 'divider',
    },
    {
      type: 'section_label',
      text: t(I18N_KEYS.RECIPE_MAIN.NODES.NODE_MENU.VIEW_MODE),
    },
    {
      name: t(I18N_KEYS.RECIPE_MAIN.NODES.NODE_MENU.VIEW_MODE_SINGLE),
      action: () => setViewMode(NodeViewMode.Single),
      selected: viewMode === NodeViewMode.Single,
    },
    {
      name: t(I18N_KEYS.RECIPE_MAIN.NODES.NODE_MENU.VIEW_MODE_GRID),
      action: () => setViewMode(NodeViewMode.Grid),
      selected: viewMode === NodeViewMode.Grid,
    },
  ];
};
