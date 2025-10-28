import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as colorPicker from '@zag-js/color-picker';
import { AppContextMenu } from '@/UI/AppContextMenu/AppContextMenu';
import { ColorPicker } from '@/UI/ColorPicker/ColorPicker';
import { I18N_KEYS } from '@/language/keys';
import { useCustomGroupView } from '../FlowContext';
import { DEFAULT_GROUP_COLOR, LABEL_SIZE } from '../Views/NodeGrouping/groups.types';
import type { MenuAction } from '@/components/Menu/Actions';

interface GroupContextMenuProps {
  positionX: number;
  positionY: number;
  isOpen: boolean;
  onClose: () => void;
  groupNodeId: string;
}

export const GroupContextMenu = ({ positionX, positionY, isOpen, onClose, groupNodeId }: GroupContextMenuProps) => {
  const { t } = useTranslation();
  const customGroupView = useCustomGroupView(groupNodeId);

  const handleUngroup = useCallback(() => {
    customGroupView.ungroup();
    onClose();
  }, [customGroupView, onClose]);

  const handleDelete = useCallback(() => {
    customGroupView.delete();
    onClose();
  }, [customGroupView, onClose]);

  const handleColorChange = useCallback(
    (color: colorPicker.Color) => {
      // Update the group node's color
      customGroupView.updateGroupColor(color.toString('hex'));
    },
    [customGroupView],
  );

  const handleLabelSizeChange = useCallback(
    (labelFontSize: number) => {
      customGroupView.updateGroupLabelSize(labelFontSize);
      onClose();
    },
    [customGroupView, onClose],
  );

  // Get current group data
  const currentColor = customGroupView.getGroupColor() || DEFAULT_GROUP_COLOR;
  const currentLabelSize = customGroupView.getGroupLabelSize() || LABEL_SIZE.SMALL;

  const menu: MenuAction[] = useMemo(
    () => [
      {
        name: t(I18N_KEYS.RECIPE_MAIN.GROUP_CONTEXT_MENU.COLOR),
        action: () => {}, // No-op action for parent menu item
        childrenOffset: { left: '14px' },
        children: [
          {
            type: 'slot' as const,
            el: <ColorPicker color={colorPicker.parse(currentColor)} onChange={handleColorChange} showAlpha={false} />,
          },
        ],
      },
      {
        name: t(I18N_KEYS.RECIPE_MAIN.GROUP_CONTEXT_MENU.LABEL_SIZE),
        action: () => {}, // No-op action for parent menu item
        childrenOffset: { left: '14px' },
        children: [
          {
            name: t(I18N_KEYS.RECIPE_MAIN.GROUP_CONTEXT_MENU.LABEL_SIZE_OPTIONS.SMALL),
            action: () => handleLabelSizeChange(LABEL_SIZE.SMALL),
            selected: currentLabelSize === LABEL_SIZE.SMALL,
          },
          {
            name: t(I18N_KEYS.RECIPE_MAIN.GROUP_CONTEXT_MENU.LABEL_SIZE_OPTIONS.MEDIUM),
            action: () => handleLabelSizeChange(LABEL_SIZE.MEDIUM),
            selected: currentLabelSize === LABEL_SIZE.MEDIUM,
          },
          {
            name: t(I18N_KEYS.RECIPE_MAIN.GROUP_CONTEXT_MENU.LABEL_SIZE_OPTIONS.LARGE),
            action: () => handleLabelSizeChange(LABEL_SIZE.LARGE),
            selected: currentLabelSize === LABEL_SIZE.LARGE,
          },
        ],
      },

      { type: 'divider' },
      {
        name: t(I18N_KEYS.RECIPE_MAIN.GROUP_CONTEXT_MENU.UNGROUP),
        action: handleUngroup,
      },
      { type: 'divider' },
      {
        name: t(I18N_KEYS.RECIPE_MAIN.GROUP_CONTEXT_MENU.DELETE),
        action: handleDelete,
      },
    ],
    [handleUngroup, handleDelete, t, currentColor, handleColorChange, currentLabelSize, handleLabelSizeChange],
  );

  return <AppContextMenu open={isOpen} onClose={onClose} mouseX={positionX} mouseY={positionY} items={menu} />;
};
