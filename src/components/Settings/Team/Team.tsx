import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { log } from '@/logger/logger.ts';
import { TrackTypeEnum, useAnalytics } from '@/hooks/useAnalytics';
import { I18N_KEYS } from '@/language/keys';
import { TeamMember } from '@/types/general';
import { User, WorkspaceRole } from '@/types/auth.types';
import { FlexCol } from '@/UI/styles';
import { getAxiosInstance } from '@/services/axiosConfig';
import { SubscriptionType } from '@/types/shared';
import { TeamMemberStatus } from '@/enums/team-member-status.enum.ts';
import ConfirmationDialog from '../../Common/ConfirmationDialogV2';
import { TeamUpgrade } from './TeamUpgrade';
import { TeamTableHeader } from './TeamTableHeader';
import InviteMemberModal from './InviteMemberModal';
import { TeamTableV2 } from './TeamTable/TeamTable';

const logger = log.getLogger('Team');
const axiosInstance = getAxiosInstance();

interface TeamProps {
  currentUser: User;
}

function Team({ currentUser }: TeamProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [workspaceDefaultMonthlyAllocatedCredits, setWorkspaceDefaultMonthlyAllocatedCredits] = useState<number | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [openInviteMemberModal, setOpenInviteMemberModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember>();
  // TODO:LAUNCH - add back loading animation while invite link is being generated
  // const [copyingInviteId, setCopyingInviteId] = useState<string>();
  const [currentUserRole, setCurrentUserRole] = useState<WorkspaceRole>();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { track } = useAnalytics();
  const handleOpenInviteMemberModal = () => {
    track('Clicked_open_invite_member_modal', {}, TrackTypeEnum.BI);
    setOpenInviteMemberModal(true);
  };

  const handleCloseInviteMemberModal = () => {
    track('Clicked_close_invite_member_modal', {}, TrackTypeEnum.BI);
    setOpenInviteMemberModal(false);
  };

  const getWorkspace = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get(`/v1/workspaces`);
      setMembers([
        ...(res.data?.members || []).map((member) => ({
          ...member,
          monthlyCreditsLimit: member.hasCustomCreditsLimit
            ? member.monthlyCreditsLimit
            : res.data?.preferences?.defaultMonthlyAllocatedCredits || null,
        })),
      ]);

      setCurrentUserRole(res.data?.members?.find((m) => m.id === currentUser.uid)?.role);
      setWorkspaceId(res.data?.id);
      setWorkspaceDefaultMonthlyAllocatedCredits(res.data?.preferences?.defaultMonthlyAllocatedCredits);
    } catch (e: any) {
      setIsLoading(false);
      logger.error('Error getting workspace', e);
      if (e.response && [404, 403].includes(e.response.status)) {
        navigate('/');
      }
      // todo: show error to user
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.uid, navigate]);

  useEffect(() => {
    void getWorkspace();
  }, [getWorkspace]);

  const updateMember = async (memberId: string, update: any) => {
    try {
      await axiosInstance.put(`/v1/workspaces/${workspaceId}/members/${memberId}`, update);
    } catch (e) {
      logger.error('Error updating user', e);
      // todo: show error to user
    }
  };
  const updateMembers = async (memberIds: string[], update: any) => {
    try {
      await axiosInstance.put(`/v1/workspaces/${workspaceId}/members`, { ...update, memberIds });
    } catch (e) {
      logger.error('Error updating user', e);
      // todo: show error to user
    }
  };

  const updateMemberRole = async (id: string, role: WorkspaceRole) => {
    setMembers(members.map((member) => (member.id === id ? { ...member, role: role } : member)));
    await updateMember(id, { role });
  };

  const updateMemberLimit = async (ids: string[], limit: number | null) => {
    let setAsUnlimited = false;
    if (limit === null) {
      setAsUnlimited = true;
    }
    setMembers((prevMembers) =>
      prevMembers.map((member) =>
        ids.includes(member.id)
          ? {
              ...member,
              monthlyCreditsLimit: setAsUnlimited ? null : (limit ?? 0),
              hasCustomCreditsLimit: true,
            }
          : member,
      ),
    );
    await updateMembers(ids, {
      monthlyCreditsLimit: setAsUnlimited ? null : (limit ?? 0),
      hasCustomCreditsLimit: true,
    });
  };

  const resetToDefaultLimit = async (ids: string[]) => {
    setMembers((prevMembers) =>
      prevMembers.map((member) =>
        ids.includes(member.id)
          ? { ...member, monthlyCreditsLimit: workspaceDefaultMonthlyAllocatedCredits, hasCustomCreditsLimit: false }
          : member,
      ),
    );
    await updateMembers(ids, {
      monthlyCreditsLimit: null,
      hasCustomCreditsLimit: false,
    });
  };

  const resendInvite = async (email: string) => {
    await axiosInstance.post(`/v1/workspaces/${workspaceId}/members/${email}/invitation/resend`);
  };

  const handleRemoveMember = (member: TeamMember) => {
    setMemberToRemove(member);
    setOpenConfirmationDialog(true);
  };

  const removeMember = async (memberToRemove: TeamMember | undefined) => {
    if (!memberToRemove) {
      return;
    }

    try {
      if (memberToRemove.status === TeamMemberStatus.INVITED) {
        await axiosInstance.delete(`/v1/workspaces/${workspaceId}/members/${memberToRemove.email}/invitations`);
      } else {
        await axiosInstance.delete(`/v1/workspaces/${workspaceId}/members/${memberToRemove.id}`);
      }
      setMembers(members.filter((member) => member.id !== memberToRemove.id));
      setOpenConfirmationDialog(false);
    } catch (e) {
      logger.error('Error removing member', e);
    }
  };

  const copyInviteLink = async (email: string) => {
    try {
      // setCopyingInviteId(id);
      const res = await axiosInstance.get(`/v1/workspaces/${workspaceId}/members/${email}/invitation-link`);
      const { link } = res.data;
      void navigator.clipboard.writeText(link);
      track('team_invite_link_copied', {}, TrackTypeEnum.BI);

      return true;
    } catch (e) {
      logger.error('Error copying invite link', e);
      return false;
    }
    // finally {
    // setCopyingInviteId(undefined);
    // }
  };

  const handleCloseConfirmationDialog = () => {
    setOpenConfirmationDialog(false);
  };

  const handleInviteMembersSuccess = (members) => {
    setMembers((prevMembers) => [...prevMembers, ...members]);
  };

  const inviteMembers = async (emails: string[], intendedRole: WorkspaceRole) =>
    axiosInstance.post(`/v1/workspaces/${workspaceId}/members/invite`, { emails, userRole: intendedRole });

  if (
    currentUser?.activeWorkspace?.subscription?.type === SubscriptionType.Free ||
    currentUser?.activeWorkspace?.subscription?.type === SubscriptionType.Starter ||
    currentUser?.activeWorkspace?.subscription?.type === SubscriptionType.Pro
  ) {
    return <TeamUpgrade />;
  }

  return (
    <>
      <FlexCol sx={{ flex: 1, height: '100%', gap: 3, pb: 3 }}>
        <TeamTableHeader
          membersCount={members.length}
          onOpenInviteMemberModal={handleOpenInviteMemberModal}
          showInviteBtn={currentUserRole === WorkspaceRole.Admin}
        />

        <TeamTableV2
          members={members}
          currentUser={currentUser}
          isLoading={isLoading}
          updateMemberRole={updateMemberRole}
          updateMemberLimit={updateMemberLimit}
          resetToDefaultLimit={resetToDefaultLimit}
          resendInvite={resendInvite}
          removeMember={handleRemoveMember}
          copyInviteLink={copyInviteLink}
          // copyingInviteId={copyingInviteId}
          isEditPermissions={currentUserRole === WorkspaceRole.Admin}
        />
      </FlexCol>

      <InviteMemberModal
        open={openInviteMemberModal}
        members={members}
        currentSeatCount={currentUser?.activeWorkspace?.subscription?.seatsLimit}
        workspaceId={workspaceId}
        subscriptionType={currentUser?.activeWorkspace?.subscription?.type}
        billingCycle={currentUser?.activeWorkspace?.subscription?.billingCycle}
        onClose={handleCloseInviteMemberModal}
        onInviteMembersSuccess={handleInviteMembersSuccess}
        inviteMembers={inviteMembers}
      />
      <ConfirmationDialog
        open={openConfirmationDialog}
        title={t(I18N_KEYS.SETTINGS.TEAM.CONFIRM_DELETE.TITLE)}
        message={t(I18N_KEYS.SETTINGS.TEAM.REMOVE_MEMBER_DIALOG.CONTENT, {
          email: memberToRemove?.email,
        })}
        confirmText={t(I18N_KEYS.SETTINGS.TEAM.CONFIRM_DELETE.CONFIRM)}
        onConfirm={() => removeMember(memberToRemove)}
        onClose={handleCloseConfirmationDialog}
        withLoading
      />
    </>
  );
}

export default Team;
