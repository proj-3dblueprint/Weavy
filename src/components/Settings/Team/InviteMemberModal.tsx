import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, CircularProgress, Typography, Divider, Tooltip, IconButton, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { isCancel } from 'axios';
import { log } from '@/logger/logger.ts';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { Flex, FlexCenVer, FlexCol } from '@/UI/styles';
import { WorkspaceRole } from '@/types/auth.types';
import { getAxiosInstance } from '@/services/axiosConfig';
import { BillingCycle, SubscriptionType } from '@/types/shared';
import { XIcon } from '@/UI/Icons/XIcon';
import { TeamMember } from '@/types/general';
import { useGlobalStore } from '@/state/global.state';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { CheckMarkCircleIcon } from '@/UI/Icons';
import EmailChipsInput from '../../Recipe/FlowComponents/Share/EmailChipsInputV2';

const logger = log.getLogger('InviteMemberModal');
const axiosInstance = getAxiosInstance();

interface InviteMemberModalProps {
  open: boolean;
  members: TeamMember[];
  currentSeatCount: number;
  workspaceId: string;
  subscriptionType: SubscriptionType;
  billingCycle: BillingCycle;
  onClose: () => void;
  onInviteMembersSuccess: (members: TeamMember[]) => void;
  inviteMembers: (emails: string[], role: WorkspaceRole) => Promise<{ data: { members: TeamMember[] } }>;
}

const InviteMemberModal = ({
  open,
  members,
  currentSeatCount,
  subscriptionType,
  billingCycle,
  workspaceId,
  onClose,
  onInviteMembersSuccess,
  inviteMembers,
}: InviteMemberModalProps) => {
  const [emails, setEmails] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState({ value: '', isValid: false });
  const [isInviteLoading, setIsInviteLoading] = useState(false);
  const [intendedRole, setIntendedRole] = useState(WorkspaceRole.Member);
  const [costPerSeat, setCostPerSeat] = useState(0);

  const { t } = useTranslation();
  const { updateSnackbarData } = useGlobalStore();
  const { track } = useAnalytics();
  const getCostPerSeat = useCallback(
    async (abortSignal: AbortSignal) => {
      try {
        const response = await axiosInstance.get<{ price: number }>(
          `/v1/workspaces/${workspaceId}/subscriptions/seats/price`,
          {
            signal: abortSignal,
          },
        );
        setCostPerSeat(response.data?.price);
      } catch (e) {
        if (isCancel(e)) {
          logger.debug('Request was cancelled');
        } else {
          logger.error('Error getting seat price', e);
        }
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    if (!open || subscriptionType !== SubscriptionType.Team) {
      return;
    }

    const abortController = new AbortController();

    void getCostPerSeat(abortController.signal);

    return () => abortController.abort();
  }, [getCostPerSeat, open, subscriptionType]);

  const handleClose = () => {
    setEmails([]);
    setCurrentInput({ value: '', isValid: false });
    setIsInviteLoading(false);
    onClose();
  };

  const handleInviteSubmit = async () => {
    const emailsToInvite = [...emails];
    if (currentInput.value.trim() && currentInput.isValid) {
      emailsToInvite.push(currentInput.value.trim());
    }
    if (emailsToInvite.length === 0) {
      return;
    }

    setIsInviteLoading(true);
    track('team_invite_member_by_email', { number_of_users: emailsToInvite.length }, TrackTypeEnum.BI);
    try {
      const response = await inviteMembers(emailsToInvite, intendedRole);
      handleInviteSuccess(response.data.members);
      handleClose();
    } catch (e) {
      logger.error('Error inviting members', e);
      // setError(
      //   (e instanceof AxiosError && String(e.response?.data?.error)) ||
      //     t(I18N_KEYS.SHARED_DESIGN_APP.MODAL.DEFAULT_ERROR),
      // );
    } finally {
      setIsInviteLoading(false);
    }
  };

  const handleInviteSuccess = (members: TeamMember[]) => {
    setEmails([]);
    updateSnackbarData({
      text: t(I18N_KEYS.SETTINGS.TEAM.INVITE_USER_MODAL.SUCCESS_MESSAGE, { count: members.length }),
      isOpen: true,
      icon: <CheckMarkCircleIcon width={20} height={20} />,
    });
    onInviteMembersSuccess(members); // todo: replace with actual members
  };

  const handleInputChange = (value: string, isValid: boolean) => setCurrentInput({ value, isValid });

  const handleSetRole = (role: WorkspaceRole) => setIntendedRole(role);

  const availableSeats = useMemo(() => currentSeatCount - members.length, [currentSeatCount, members]);

  const isAboveSeatLimit = useMemo(
    () => members.length + emails.length > currentSeatCount,
    [currentSeatCount, members, emails],
  );

  const extraSeats = useMemo(
    () => members.length + emails.length - currentSeatCount,
    [currentSeatCount, members, emails],
  );

  const getAvailableSeatsEl = () => {
    let count = availableSeats;
    if (count < 0) {
      logger.warn('WEA: current seat count is over the seat limit. This should not happen.');
      count = 0;
    }
    return (
      <Typography variant="body-sm-rg">
        {t(I18N_KEYS.SETTINGS.TEAM.INVITE_USER_MODAL.SEATS, {
          count,
        })}
      </Typography>
    );
  };
  const getTeamZeroSeatsSubtitleEl = () => {
    if (subscriptionType === SubscriptionType.Team && availableSeats === 0) {
      return (
        <Typography variant="body-sm-rg" color={color.White80_T}>
          {t(I18N_KEYS.SETTINGS.TEAM.INVITE_USER_MODAL.SEATS_ZERO_SUBTITLE)}
        </Typography>
      );
    }
  };

  const getInfoEl = () => {
    if (subscriptionType === SubscriptionType.Enterprise && availableSeats === 0) {
      return (
        <Tooltip
          placement="right-start"
          title={t(I18N_KEYS.SETTINGS.TEAM.INVITE_USER_MODAL.ENTERPRISE_SEAT_LIMIT_EXCEEDED)}
          sx={{ borderColor: '#fff !important' }}
          slotProps={{
            tooltip: {
              sx: {
                p: 1.5,
                backgroundColor: color.Black92,
                color: color.White100,
                border: `1px solid ${color.White08_T}`,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '12px',
                fontWeight: 400,
              },
            },
          }}
        >
          <img src="/icons/info.svg" width={14} height={14} style={{ marginLeft: '4px' }} />
        </Tooltip>
      );
    }
  };

  const renderSeatsInfoBlock = () => {
    if (isAboveSeatLimit) {
      return (
        <FlexCol sx={{ gap: 3 }}>
          <Divider />
          <Box>
            {subscriptionType === SubscriptionType.Team
              ? renderTeamSeatLimitExceededBlock()
              : renderEnterpriseSeatLimitExceededBlock()}
          </Box>
        </FlexCol>
      );
    }
  };

  const renderTeamSeatLimitExceededBlock = () => {
    const translationPart2 =
      billingCycle === BillingCycle.Yearly
        ? I18N_KEYS.SETTINGS.TEAM.INVITE_USER_MODAL.TEAM_SEAT_LIMIT_EXCEEDED_PART_2_YEARLY
        : I18N_KEYS.SETTINGS.TEAM.INVITE_USER_MODAL.TEAM_SEAT_LIMIT_EXCEEDED_PART_2_MONTHLY;
    return (
      <>
        <Typography variant="body-sm-rg" sx={{ whiteSpace: 'pre-line' }}>
          {t(I18N_KEYS.SETTINGS.TEAM.INVITE_USER_MODAL.TEAM_SEAT_LIMIT_EXCEEDED_PART_1, { count: extraSeats })}
        </Typography>
        <Typography variant="body-sm-md" sx={{ whiteSpace: 'pre-line' }}>
          {t(translationPart2, {
            costPerSeat: costPerSeat || 'N/A',
          })}
        </Typography>
        <Typography variant="body-sm-rg" sx={{ whiteSpace: 'pre-line' }}>
          {t(I18N_KEYS.SETTINGS.TEAM.INVITE_USER_MODAL.TEAM_SEAT_LIMIT_EXCEEDED_PART_3)}
        </Typography>
      </>
    );
  };

  const renderEnterpriseSeatLimitExceededBlock = () => {
    return (
      <Typography variant="body-sm-rg" sx={{ whiteSpace: 'pre-line' }}>
        {t(I18N_KEYS.SETTINGS.TEAM.INVITE_USER_MODAL.ENTERPRISE_SEAT_LIMIT_EXCEEDED)}
      </Typography>
    );
  };
  return (
    <>
      <Modal data-testid="team-invite-modal" open={open} onClose={handleClose} aria-labelledby="team-invite-modal">
        <FlexCol
          sx={{
            gap: 4,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 540,
            background: color.Black92,
            border: '1px solid',
            borderColor: color.White08_T,
            boxShadow: 24,
            p: 3,
            borderRadius: 2,
          }}
        >
          <IconButton sx={{ position: 'absolute', top: 12, right: 12 }} onClick={handleClose}>
            <XIcon />
          </IconButton>
          <Typography variant="body-lg-sb">{t(I18N_KEYS.SETTINGS.TEAM.INVITE_USER_MODAL.TITLE)}</Typography>
          <FlexCol sx={{ gap: 1 }}>
            <FlexCenVer>
              {/* backwards compatibility for missing subs */}
              {currentSeatCount && (
                <FlexCol>
                  <FlexCenVer>
                    {getAvailableSeatsEl()}
                    {getInfoEl()}
                  </FlexCenVer>
                  {getTeamZeroSeatsSubtitleEl()}
                </FlexCol>
              )}
            </FlexCenVer>
            <EmailChipsInput
              emails={emails}
              onSetEmails={setEmails}
              onInputChange={handleInputChange}
              currentRole={intendedRole}
              onSetRole={handleSetRole}
            />
          </FlexCol>

          {renderSeatsInfoBlock()}
          <Flex sx={{ justifyContent: 'flex-end', gap: 1 }}>
            <ButtonContained mode="text" size="small" onClick={handleClose}>
              {t(I18N_KEYS.GENERAL.CANCEL)}
            </ButtonContained>
            <ButtonContained
              size="small"
              onClick={() => void handleInviteSubmit()}
              disabled={(emails.length === 0 && !currentInput.isValid) || isInviteLoading}
              endIcon={isInviteLoading ? <CircularProgress color="inherit" size={16} /> : null}
            >
              {isInviteLoading
                ? t(I18N_KEYS.SHARE_WORKFLOW_MODAL.SHARE_BUTTON_LOADING)
                : t(I18N_KEYS.SHARE_WORKFLOW_MODAL.SHARE_BUTTON)}
            </ButtonContained>
          </Flex>
        </FlexCol>
      </Modal>
    </>
  );
};

export default InviteMemberModal;
