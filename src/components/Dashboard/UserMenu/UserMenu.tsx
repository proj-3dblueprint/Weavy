import { IconButton, Menu } from '@mui/material';
import { MouseEvent, ReactNode, useContext, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { log } from '@/logger/logger.ts';
import { CreditsContext } from '@/services/CreditsContext';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenVer } from '@/UI/styles';
import { SubscriptionType } from '@/types/shared';
import { getAxiosInstance } from '@/services/axiosConfig';
import { BaseWorkspace, WorkspaceRole } from '@/types/auth.types';
import { PermissionsContainer } from '@/components/PermissionsContainer/PermissionsContainer';
import { ButtonTextPlain } from '@/UI/ButtonTextPlain/ButtonTextPlain';
import { EllipsisText } from '@/UI/EllipsisText/EllipsisText';
import useWorkspacesStore from '@/state/workspaces.state';
import { AsteriskIcon } from '@/UI/Icons/AsteriskIcon';
import { formatNumberWithCommas } from '@/utils/numbers';
import { useSubscriptionPermissions } from '@/hooks/useSubscriptionPermissions';
import Actions, { MenuAction } from '../../Menu/Actions';
import { SubscriptionSection } from './SubscriptionSection';
import { WorkspaceIcon } from './WorkspaceIcon';
import { WorkspacesMenu } from './WorkspacesMenu/WorkspacesMenu';

const logger = log.getLogger('UserMenu');
const axiosInstance = getAxiosInstance();

const WorkspaceSection = ({
  showSwitch,
  onClickSwitch,
}: {
  workspaceName: string;
  showSwitch: boolean;
  onClickSwitch: (event: MouseEvent<HTMLElement>) => void;
}) => {
  const workspaceName = useWorkspacesStore((state) => state.activeWorkspace.workspaceName);

  return (
    <FlexCenVer sx={{ height: '40px', justifyContent: 'space-between', p: 1 }}>
      <FlexCenVer sx={{ gap: 1 }}>
        <WorkspaceIcon text={workspaceName} />
        <EllipsisText maxWidth="130px" variant="body-sm-rg">
          {workspaceName}
        </EllipsisText>
      </FlexCenVer>
      {showSwitch && (
        <IconButton
          disableRipple
          onClick={onClickSwitch}
          sx={{
            pr: 0,
            '&:hover': {
              backgroundColor: 'transparent !important',
            },
          }}
        >
          <img src="/icons/switch-arrows.svg" alt="switch-arrows" className="wea-menu-icon" />
        </IconButton>
      )}
    </FlexCenVer>
  );
};

interface UserMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  settings: MenuAction[];
}

export const UserMenu = ({ anchorEl, onClose, settings }: UserMenuProps) => {
  const { credits, workspaceCredits, openUpgradeModal, handleGetMoreCreditsClick } = useContext(CreditsContext);
  const { t } = useTranslation();
  const [anchorElWorkspaces, setAnchorElWorkspaces] = useState<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { activeWorkspace, workspaces } = useWorkspacesStore();
  const { isActionAllowed } = useSubscriptionPermissions();

  const getCreditsHintText = useMemo(() => {
    if (isActionAllowed([SubscriptionType.Team]) && activeWorkspace?.role !== WorkspaceRole.Admin && credits === 0) {
      return t(I18N_KEYS.MAIN_DASHBOARD.USERMENU.TEAM_HINT_CREDITS_EMPTY);
    }
    return '';
  }, [activeWorkspace?.role, credits, t, isActionAllowed]);

  const handleOpenWorkspacesMenu = () =>
    setAnchorElWorkspaces((menuRef?.current?.querySelector('.MuiPaper-root') as HTMLElement) || null);

  const handleCloseWorkspacesMenu = () => setAnchorElWorkspaces(null);

  const onSwitchWorkspace = async (workspace: BaseWorkspace) => {
    try {
      const res = await axiosInstance.put(`/v1/users/set-active-workspace`, {
        workspaceId: workspace.workspaceId,
      });
      if (res.status === 200) {
        window.location.reload();
      }
    } catch (e) {
      logger.error('Error setting active workspace.', e);
    }
  };

  const onCreditsCta = () => {
    handleGetMoreCreditsClick();
    onClose();
  };

  const onPlanCta = () => {
    openUpgradeModal();
    onClose();
  };

  const getCreditsCtaEl = (): ReactNode => {
    const text = isActionAllowed([SubscriptionType.Free])
      ? t(I18N_KEYS.MAIN_DASHBOARD.USERMENU.CTA_CREDITS_FREE)
      : t(I18N_KEYS.MAIN_DASHBOARD.USERMENU.CTA_CREDITS);
    return (
      <PermissionsContainer permission="credits" type="action">
        <ButtonTextPlain onClick={onCreditsCta} variant="body-sm-rg">
          {text}
        </ButtonTextPlain>
      </PermissionsContainer>
    );
  };

  const getPlanCtaEl = (): ReactNode => {
    if (isActionAllowed([SubscriptionType.Team])) {
      return null;
    }
    return (
      <PermissionsContainer permission="plan" type="action">
        <ButtonTextPlain onClick={onPlanCta} variant="body-sm-rg">
          {t(I18N_KEYS.MAIN_DASHBOARD.USERMENU.CTA_PLAN)}
        </ButtonTextPlain>
      </PermissionsContainer>
    );
  };

  return (
    <Menu
      ref={menuRef}
      className="app-menu-v2"
      anchorEl={anchorEl}
      marginThreshold={8}
      slotProps={{
        root: { sx: { '.MuiList-root': { p: 1 } } },
        paper: {
          sx: { mt: 0.5, width: '240px', borderRadius: 2 },
        },
      }}
      open={Boolean(anchorEl)}
      onClose={onClose}
    >
      <WorkspaceSection
        workspaceName={activeWorkspace?.workspaceName}
        showSwitch={workspaces?.length > 1}
        onClickSwitch={handleOpenWorkspacesMenu}
      />
      <PermissionsContainer permission="credits">
        <SubscriptionSection
          title={
            activeWorkspace?.subscription?.type === SubscriptionType.Team ||
            activeWorkspace?.subscription?.type === SubscriptionType.Enterprise
              ? t(I18N_KEYS.MAIN_DASHBOARD.USERMENU.TEAM_CREDITS)
              : t(I18N_KEYS.MAIN_DASHBOARD.USERMENU.CREDITS)
          }
          value={formatNumberWithCommas(
            activeWorkspace?.subscription?.type === SubscriptionType.Team ||
              activeWorkspace?.subscription?.type === SubscriptionType.Enterprise
              ? workspaceCredits || 0
              : credits || 0,
          )}
          icon={<AsteriskIcon />}
          hintText={getCreditsHintText}
          ctaEl={getCreditsCtaEl()}
        />
      </PermissionsContainer>

      <PermissionsContainer permission="plan">
        <SubscriptionSection
          title={t(I18N_KEYS.MAIN_DASHBOARD.USERMENU.PLAN)}
          value={activeWorkspace?.subscription?.name}
          ctaEl={getPlanCtaEl()}
        />
      </PermissionsContainer>
      <Actions items={settings} setAnchorEl={onClose} />
      <WorkspacesMenu
        workspaces={workspaces}
        anchorEl={anchorElWorkspaces}
        activeWorkspace={activeWorkspace}
        onSelect={onSwitchWorkspace}
        onClose={handleCloseWorkspacesMenu}
      />
    </Menu>
  );
};
