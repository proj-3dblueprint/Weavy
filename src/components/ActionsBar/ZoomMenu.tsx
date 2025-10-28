import { useTranslation } from 'react-i18next';
import { AppContextMenu } from '@/UI/AppContextMenu/AppContextMenu';
import { MenuAction } from '@/components/Menu/Actions';
import { I18N_KEYS } from '@/language/keys';

interface ZoomMenuProps {
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
  onZoomToHundred: () => void;
}

export const ZoomMenu = ({
  anchorEl,
  isOpen,
  onClose,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onZoomToHundred,
}: ZoomMenuProps) => {
  const { t } = useTranslation();
  const items: MenuAction[] = [
    {
      name: t(I18N_KEYS.RECIPE_MAIN.FLOW.ACTIONS.ZOOM_IN),
      action: onZoomIn,
      shortcutKey: '+',
    },
    {
      name: t(I18N_KEYS.RECIPE_MAIN.FLOW.ACTIONS.ZOOM_OUT),
      action: onZoomOut,
      shortcutKey: '-',
    },
    {
      name: t(I18N_KEYS.RECIPE_MAIN.FLOW.ACTIONS.ZOOM_TO_HUNDRED),
      action: onZoomToHundred,
      shortcutKey: '0',
    },
    {
      name: t(I18N_KEYS.RECIPE_MAIN.FLOW.ACTIONS.ZOOM_TO_FIT),
      action: onZoomToFit,
      shortcutKey: '1',
    },
  ];

  return (
    <AppContextMenu
      items={items}
      anchorEl={anchorEl}
      open={isOpen}
      onClose={onClose}
      width="200px"
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    />
  );
};
