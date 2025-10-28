import { useState } from 'react';
import { Box, CircularProgress, Menu, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import sortBy from 'lodash/sortBy';
import { log } from '@/logger/logger.ts';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenVer, FlexCol } from '@/UI/styles';
import { EllipsisText } from '@/UI/EllipsisText/EllipsisText';
import { CheckMarkIcon } from '@/UI/Icons/CheckMarkIcon';
import { WorkspaceIcon } from '../WorkspaceIcon';
import { Plan, StyledMenuItem } from './Workspaces.styles';
import type { ActiveWorkspace, BaseWorkspace } from '@/types/auth.types';

const logger = log.getLogger('WorkspacesMenu');

interface WorkspacesMenuProps {
  anchorEl: HTMLElement | null;
  workspaces: BaseWorkspace[];
  activeWorkspace: ActiveWorkspace;
  onSelect: (workspace: BaseWorkspace) => Promise<void>;
  onClose: () => void;
}

export const WorkspacesMenu = ({ anchorEl, workspaces, activeWorkspace, onSelect, onClose }: WorkspacesMenuProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [clickedWorkspaceId, setClickedWorkspaceId] = useState<string | null>();

  const handleSwitchWorkspace = async (workspace: BaseWorkspace) => {
    setIsLoading(true);
    setClickedWorkspaceId(workspace.workspaceId);
    try {
      await onSelect(workspace);
      onClose();
    } catch (e) {
      logger.error('Error switching workspace', e);
    } finally {
      setIsLoading(false);
      setClickedWorkspaceId(null);
    }
  };

  const renderPlan = (workspace: BaseWorkspace | ActiveWorkspace) => {
    if (isLoading && clickedWorkspaceId === workspace.workspaceId) {
      return <CircularProgress size={16} />;
    }
    if ('subscription' in workspace && workspace.subscription?.name) {
      return <Plan variant="label-xs-rg">{workspace.subscription?.name}</Plan>;
    }
  };

  return (
    <Menu
      className="app-menu-v2"
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      slotProps={{
        root: { sx: { '.MuiList-root': { p: 1 } } },
        paper: {
          sx: { ml: 0.5, width: '240px', borderRadius: 2 },
        },
      }}
      open={Boolean(anchorEl)}
      onClose={onClose}
    >
      <Box sx={{ height: '37px', p: 1 }}>
        <Typography variant="label-xs-rg" sx={{ opacity: 0.8 }}>
          {t(I18N_KEYS.MAIN_DASHBOARD.WORKSPACES_MENU.TITLE)}
        </Typography>
      </Box>
      <FlexCol sx={{ gap: 0.5 }}>
        {sortBy(workspaces, 'workspaceName').map((workspace) => {
          const isSelected = workspace.workspaceId === activeWorkspace.workspaceId;
          return (
            <StyledMenuItem
              key={workspace.workspaceId}
              onClick={() => void handleSwitchWorkspace(workspace)}
              selected={isSelected}
            >
              <FlexCenVer sx={{ gap: 1 }}>
                <WorkspaceIcon text={workspace.workspaceName} />
                <EllipsisText maxWidth="100px" variant="body-sm-rg">
                  {workspace.workspaceName}
                </EllipsisText>
              </FlexCenVer>
              {isSelected ? <CheckMarkIcon title="check" /> : renderPlan(workspace)}
            </StyledMenuItem>
          );
        })}
      </FlexCol>
    </Menu>
  );
};
