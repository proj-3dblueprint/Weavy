import { Tooltip, Typography } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { AppContextMenu } from '@/UI/AppContextMenu/AppContextMenu';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { DotsThreeIcon } from '@/UI/Icons/DotsThreeIcon';
import { LockClosedIcon } from '@/UI/Icons/LockClosedIcon';
import { FlexCenVer } from '@/UI/styles';
import { color } from '@/colors';
import { getOS } from '@/utils/general';
import { useIsNodeInRunningBatch } from '@/components/Recipe/RunFlow/batches.store';
import { useNodeActions } from '../useNodeActions';
import type { MenuAction } from '@/components/Menu/Actions';
import type { BaseNodeData } from '@/types/node';

const MENU_POSITION = {
  vertical: 'top',
  horizontal: 'left',
} as const;

interface DynamicNodeTitleProps {
  additionalMenu?: MenuAction[];
  data: BaseNodeData;
  hideBody?: boolean;
  icon?: React.ReactNode;
  id: string;
  menuHeader?: React.ReactNode;
  showFullNode: boolean;
}
export const DynamicNodeTitle = ({
  additionalMenu = [],
  data,
  hideBody = false,
  icon,
  id,
  menuHeader,
  showFullNode,
}: DynamicNodeTitleProps) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const role = useUserWorkflowRole();
  const { deleteNode, duplicateNode, toggleLockNode, openOverlayDialog } = useNodeActions();
  const isNodeInRunningBatch = useIsNodeInRunningBatch(id);

  const handleDelete = useCallback(() => {
    deleteNode(id);
  }, [deleteNode, id]);

  const handleDuplicate = useCallback(() => {
    if (id) {
      duplicateNode(id);
    }
  }, [duplicateNode, id]);

  const handleRename = useCallback(() => {
    openOverlayDialog({ type: 'rename', id, initialName: data.name });
  }, [data, id, openOverlayDialog]);

  const handleToggleLock = useCallback(() => {
    toggleLockNode(id);
  }, [toggleLockNode, id]);

  const menu: MenuAction[] = useMemo(
    () => [
      {
        name: `${t(I18N_KEYS.RECIPE_MAIN.NODES.NODE_MENU.DUPLICATE)}`,
        action: handleDuplicate,
        shortcut: `${getOS() === 'Mac' ? 'cmd' : 'ctrl'}+d`,
      },
      {
        name: `${t(I18N_KEYS.RECIPE_MAIN.NODES.NODE_MENU.DELETE)}`,
        action: handleDelete,
        shortcut: 'delete / backspace',
        disabled: isNodeInRunningBatch,
      },
      {
        name: data.isLocked
          ? `${t(I18N_KEYS.RECIPE_MAIN.NODES.NODE_MENU.UNLOCK)}`
          : `${t(I18N_KEYS.RECIPE_MAIN.NODES.NODE_MENU.LOCK)}`,
        action: handleToggleLock,
        disabled: isNodeInRunningBatch,
      },
      {
        type: 'divider',
      },
      {
        name: `${t(I18N_KEYS.RECIPE_MAIN.NODES.NODE_MENU.RENAME)}`,
        action: handleRename,
      },
      ...additionalMenu,
    ],
    [
      additionalMenu,
      data.isLocked,
      handleDelete,
      handleDuplicate,
      handleRename,
      handleToggleLock,
      isNodeInRunningBatch,
      t,
    ],
  );

  return (
    <FlexCenVer
      sx={{
        width: '100%',
        justifyContent: 'space-between',
        mb: !hideBody ? 1.5 : 0,
      }}
    >
      <FlexCenVer sx={{ maxWidth: '320px', gap: 1 }}>
        {icon ?? null}
        <Typography
          variant="body-lg-rg"
          sx={{
            mr: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transition: 'all 0.25s ease-in-out',
            color: showFullNode ? color.White100 : color.White80_T,
            cursor: showFullNode ? 'grab' : 'pointer',
            pointerEvents: 'auto',
          }}
        >
          {data.name}
        </Typography>
      </FlexCenVer>
      <FlexCenVer>
        {role === 'editor' && menu && menu.length > 0 && (
          <>
            <FlexCenVer sx={{ gap: 1.25 }}>
              {data.isLocked ? (
                <Tooltip title={t(I18N_KEYS.RECIPE_MAIN.NODES.NODE_MENU.UNLOCK)} enterDelay={500} enterNextDelay={500}>
                  <AppIconButton onClick={handleToggleLock} disabled={isNodeInRunningBatch}>
                    <LockClosedIcon width={18} height={18} />
                  </AppIconButton>
                </Tooltip>
              ) : null}
              <AppIconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <DotsThreeIcon />
              </AppIconButton>
            </FlexCenVer>
            <AppContextMenu
              data-testid="node-menu"
              anchorEl={anchorEl}
              anchorOrigin={MENU_POSITION}
              header={menuHeader}
              items={menu}
              onClose={() => setAnchorEl(null)}
              open={open}
              transformOrigin={MENU_POSITION}
            />
          </>
        )}
      </FlexCenVer>
    </FlexCenVer>
  );
};
