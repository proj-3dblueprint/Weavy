import { useTranslation } from 'react-i18next';
import { noop } from 'lodash';
import { useState } from 'react';
import { MenuAction } from '@/components/Menu/Actions';
import { I18N_KEYS } from '@/language/keys';
import { AppContextMenu } from '@/UI/AppContextMenu/AppContextMenu';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { ThreeDotsVerticalIcon } from '@/UI/Icons/ThreeDotsVerticalIcon';
import ConfirmationDialogV2 from '../ConfirmationDialogV2';
import type { DeleteFunctions } from './types';

interface MenuBtnProps {
  disabled: boolean;
  setDeleteMenuAnchorEl: (anchorEl: HTMLElement | null) => void;
}

const MenuBtnV2 = ({ disabled, setDeleteMenuAnchorEl }: MenuBtnProps) => (
  <AppIconButton
    onClick={(e) => {
      e.stopPropagation();
      setDeleteMenuAnchorEl(e.currentTarget);
    }}
    disabled={disabled}
  >
    <ThreeDotsVerticalIcon width={20} height={20} />
  </AppIconButton>
);

interface DotsMenuProps {
  setDeleteMenuAnchorEl: (anchorEl: HTMLElement | null) => void;
  deleteMenuAnchorEl: HTMLElement | null;
  deletionFunctions: DeleteFunctions;
  disabled: boolean;
  isDeleteAllOthersDisabled?: boolean;
}

const DotsMenu = ({
  setDeleteMenuAnchorEl,
  deleteMenuAnchorEl,
  deletionFunctions,
  disabled,
  isDeleteAllOthersDisabled,
}: DotsMenuProps) => {
  const [isShowDeletingAllConfirmation, setIsShowDeletingAllConfirmation] = useState(false);

  const { t } = useTranslation();

  const items: MenuAction[] = [
    {
      name: t(I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.DELETE_CURRENT_GENERATION),
      action: deletionFunctions?.deleteCurrentResult || noop,
      disabled: deletionFunctions?.disableDelete,
    },
    {
      name: t(I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.DELETE_ALL_OTHERS_GENERATIONS),
      action: deletionFunctions?.deleteAllOtherResults || noop,
      disabled: deletionFunctions?.disableDelete || isDeleteAllOthersDisabled,
    },
    {
      type: 'divider',
    },
    {
      name: t(I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.DELETE_ALL_GENERATIONS),
      action: () => setIsShowDeletingAllConfirmation(true),
      disabled: deletionFunctions?.disableDelete,
    },
  ];

  return (
    <>
      <MenuBtnV2 disabled={disabled} setDeleteMenuAnchorEl={setDeleteMenuAnchorEl} />
      <AppContextMenu
        width="200px"
        data-testid="design-app-dots-menu"
        open={deleteMenuAnchorEl !== null}
        onClose={(e: React.MouseEvent) => {
          if ('stopPropagation' in e) {
            e.stopPropagation();
          }
          setDeleteMenuAnchorEl(null);
        }}
        anchorEl={deleteMenuAnchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        items={items}
      />
      <ConfirmationDialogV2
        open={isShowDeletingAllConfirmation}
        title={t(I18N_KEYS.RECIPE_MAIN.NODES.NODE_MENU_CONFIRMATION_DIALOG.MESSAGE)}
        onConfirm={deletionFunctions.deleteAllResults}
        onClose={() => setIsShowDeletingAllConfirmation(false)}
      />
    </>
  );
};
export default DotsMenu;
