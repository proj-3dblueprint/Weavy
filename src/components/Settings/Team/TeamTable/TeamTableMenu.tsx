import { Menu } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import Actions, { MenuAction } from '@/components/Menu/Actions';
import { I18N_KEYS } from '@/language/keys';
import { TeamMember } from '@/types/general';
import { TeamMemberStatus } from '@/enums/team-member-status.enum';
import { color } from '@/colors';

export enum TeamTableMenuActions {
  DELETE = 'delete',
  RESEND_INVITE = 'resend_invite',
  COPY_INVITE_LINK = 'copy_invite_link',
  EDIT_LIMIT = 'edit_limit',
}

interface TeamTableMenuProps {
  member: TeamMember;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  handleAction: (action: TeamTableMenuActions, member: TeamMember) => Promise<void>;
}

export const TeamTableMenu = ({ member, anchorEl, open, onClose, handleAction }: TeamTableMenuProps) => {
  const { t } = useTranslation();

  const menuItems: MenuAction[] = useMemo(() => {
    const res: MenuAction[] = [];
    if (member.status === TeamMemberStatus.INVITED) {
      res.push({
        name: t(I18N_KEYS.SETTINGS.TEAM.ACTIONS_MENU.RESEND_INVITE),
        action: () => handleAction(TeamTableMenuActions.RESEND_INVITE, member),
        withLoading: true,
      });
      res.push({
        name: t(I18N_KEYS.SETTINGS.TEAM.ACTIONS_MENU.COPY_INVITE_LINK),
        action: () => handleAction(TeamTableMenuActions.COPY_INVITE_LINK, member),
        withLoading: true,
      });
    }
    if (member.status !== TeamMemberStatus.INVITED) {
      res.push({
        name: t(I18N_KEYS.SETTINGS.TEAM.ACTIONS_MENU.EDIT_LIMIT),
        action: () => handleAction(TeamTableMenuActions.EDIT_LIMIT, member),
      });
    }
    res.push({
      name: t(I18N_KEYS.SETTINGS.TEAM.ACTIONS_MENU.DELETE),
      action: () => handleAction(TeamTableMenuActions.DELETE, member),
    });

    return res;
  }, [handleAction, member.email, member.id, member.status, t]);

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: '160px',
            backgroundColor: color.Black100,
            border: `1px solid ${color.White08_T}`,
            borderRadius: '8px',
            px: 1,
          },
        },
      }}
    >
      <Actions items={menuItems} />
    </Menu>
  );
};
