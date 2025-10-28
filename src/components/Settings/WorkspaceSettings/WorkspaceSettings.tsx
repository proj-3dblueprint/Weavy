import { Box, CircularProgress, Divider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isCancel } from 'axios';
import { format } from 'date-fns';
import { log } from '@/logger/logger.ts';
import { Input } from '@/UI/Input/Input';
import { FlexCenHorVer, FlexCenVer, FlexCol } from '@/UI/styles';
import { WorkspaceIcon } from '@/components/Dashboard/UserMenu/WorkspaceIcon';
import { I18N_KEYS } from '@/language/keys';
import { CreditsType, WorkspaceRole } from '@/types/auth.types';
import { color } from '@/colors';
import { PermissionsContainer } from '@/components/PermissionsContainer/PermissionsContainer';
import { ButtonTextPlain } from '@/UI/ButtonTextPlain/ButtonTextPlain';
import { SubscriptionType } from '@/types/shared';
import { CreditsContext } from '@/services/CreditsContext';
import { useSubscriptionPermissions } from '@/hooks/useSubscriptionPermissions';
import { openIntercom } from '@/providers/intercom';
import { getAxiosInstance } from '@/services/axiosConfig';
import useWorkspacesStore from '@/state/workspaces.state';
import { useUserStore } from '@/state/user.state';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { PlanSection } from './PlanSection';
import { CreditsSection } from './CreditsSection';
import { CreditsAllocationSection } from './CreditsAllocationSection';

const logger = log.getLogger('WorkspaceSettings');
const axiosInstance = getAxiosInstance();

export const WorkspaceSettings = () => {
  const [customerPortalSession, setCustomerPortalSession] = useState('');

  const { t } = useTranslation();
  const { workspaceCredits, openUpgradeModal, handleGetMoreCreditsClick } = useContext(CreditsContext);
  const { managePaymentsPermissions } = useSubscriptionPermissions();

  const workspaceId = useWorkspacesStore((state) => state.activeWorkspace.workspaceId);
  const workspaceName = useWorkspacesStore((state) => state.activeWorkspace.workspaceName);
  const updateActiveWorkspace = useWorkspacesStore((state) => state.updateActiveWorkspace);
  const updateUserWorkspaces = useWorkspacesStore((state) => state.updateUserWorkspaces);
  const activeWorkspace = useUserStore((state) => state.user?.activeWorkspace);
  const subscription = activeWorkspace?.subscription;
  const getCreditsCtaEl = (): ReactNode => {
    if (subscription?.type === SubscriptionType.Free) {
      return (
        <>
          <ButtonTextPlain onClick={handleGetMoreCreditsClick} variant="body-std-rg">
            {t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS.UPGRADE_CTA_FREE_PART_1)}
          </ButtonTextPlain>
          <Typography variant="body-std-rg">
            &nbsp;{t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS.UPGRADE_CTA_FREE_PART_2)}
          </Typography>
        </>
      );
    }
    return (
      <PermissionsContainer permission="credits" type="action">
        <ButtonTextPlain onClick={handleGetMoreCreditsClick} variant="body-std-rg">
          {t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS.UPGRADE_CTA)}
        </ButtonTextPlain>
      </PermissionsContainer>
    );
  };

  const getPlanCta = () => {
    if (subscription?.type === SubscriptionType.Team) {
      return (
        <PermissionsContainer permission="plan" type="action">
          <Box>
            <ButtonContained mode="outlined" onClick={openUpgradeModal} size="small">
              {t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CHANGE_PLAN)}
            </ButtonContained>
          </Box>
        </PermissionsContainer>
      );
    }

    return (
      <PermissionsContainer permission="plan" type="action">
        <ButtonContained onClick={openUpgradeModal}>{t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.UPGRADE)}</ButtonContained>
      </PermissionsContainer>
    );
  };

  const getContactUsCta = () => {
    if (subscription?.type === SubscriptionType.Team) {
      return (
        <Box>
          <Typography variant="body-std-rg">
            {t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CONTACT_US_PART_1)}&nbsp;
          </Typography>
          <ButtonTextPlain onClick={openIntercom} variant="body-std-rg">
            {t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CONTACT_US_PART_2)}
          </ButtonTextPlain>
        </Box>
      );
    }
  };

  const getManagePaymentsCta = () => {
    return (
      <PermissionsContainer permission="managePayments" type="action">
        <FlexCenVer
          sx={{
            justifyContent: subscription?.type === SubscriptionType.Team ? 'flex-start' : 'center',
          }}
        >
          <ButtonTextPlain
            variant="body-sm-rg"
            color={color.White80_T}
            onClick={() => window.open(customerPortalSession, '_blank', 'noreferrer=yes,noopener=yes')}
            disabled={!customerPortalSession}
          >
            {t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.MANAGE_PAYMENTS)}
          </ButtonTextPlain>
        </FlexCenVer>
      </PermissionsContainer>
    );
  };

  const getDowngradeText = () => {
    if (subscription?.scheduledDowngradeDate) {
      return (
        <Typography variant="body-std-rg">
          {t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.PLAN.DOWNGRADE_TEXT, {
            date: format(subscription?.scheduledDowngradeDate, 'MMM d, yyyy'),
            plan: subscription?.scheduledDowngradePlan,
          })}
        </Typography>
      );
    }
  };

  const onWorkspaceNameChange = async (name: string) => {
    if (!name || name === workspaceName) {
      return;
    }

    try {
      await axiosInstance.put(`/v1/workspaces/${workspaceId}`, { name });
      updateActiveWorkspace({ workspaceName: name });
      updateUserWorkspaces(workspaceId, { workspaceName: name });
    } catch (e) {
      logger.error('Error updating workspace name', e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const getCustomerPortalSession = useCallback(
    async (abortSignal: AbortSignal) => {
      try {
        const res = await axiosInstance.post<{ link: string }>(
          `/v1/workspaces/${workspaceId}/subscriptions/customer-portal-session`,
          {
            returnUrl: window.location.href,
          },
          { signal: abortSignal },
        );
        setCustomerPortalSession(res.data.link);
      } catch (e) {
        if (isCancel(e)) {
          logger.log('Request was cancelled');
        } else {
          logger.warn('Error requesting manage payments link', e);
        }
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    const abortController = new AbortController();
    if (managePaymentsPermissions.action) {
      void getCustomerPortalSession(abortController.signal);
    }
    return () => {
      abortController.abort();
    };
  }, [getCustomerPortalSession, managePaymentsPermissions?.action]);

  const dateLabel = useMemo(() => {
    return subscription?.scheduledDowngradeDate
      ? t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.PLAN.EXPIRATION_DATE)
      : t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.PLAN.RENEWAL_DATE);
  }, [subscription?.scheduledDowngradeDate, t]);

  const dateToDisplay = useMemo(() => {
    return subscription?.scheduledDowngradeDate ? subscription?.scheduledDowngradeDate : subscription?.expiresAt;
  }, [subscription?.scheduledDowngradeDate, subscription?.expiresAt]);

  const totalExtraCredits = useMemo(() => {
    const extraCredits = subscription?.creditsList?.filter((credit) => credit.type === CreditsType.Extra);

    // if no active extra credits - don't show
    if (!extraCredits?.length) {
      return;
    }

    return extraCredits.reduce((acc, credit) => {
      return acc + credit.available;
    }, 0);
  }, [subscription?.creditsList]);

  const totalRolloverCredits = useMemo(() => {
    const rolloverCredits = subscription?.creditsList?.filter((credit) => credit.type === CreditsType.Rollover);
    if (!rolloverCredits?.length) {
      return;
    }

    return rolloverCredits.reduce((acc, credit) => {
      return acc + credit.available;
    }, 0);
  }, [subscription?.creditsList]);

  const availableMonthlyCredits = useMemo(() => {
    return subscription?.creditsList?.find((credit) => credit.type === CreditsType.Monthly)?.available;
  }, [subscription?.creditsList]);

  if (!subscription) {
    return (
      <FlexCenHorVer>
        <CircularProgress />
      </FlexCenHorVer>
    );
  }

  return (
    <FlexCol sx={{ flex: 1, gap: 4 }}>
      <WorkspaceIcon text={workspaceName} size="large" />
      <FlexCenVer sx={{ gap: 2 }}>
        <Input
          label={t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.FORM.NAME)}
          sx={{ width: '300px' }}
          defaultValue={workspaceName}
          onBlur={(e) => void onWorkspaceNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={activeWorkspace?.role !== WorkspaceRole.Admin}
        />
      </FlexCenVer>
      <PermissionsContainer permission="credits">
        <Divider />
        <CreditsSection
          label={
            subscription?.type === SubscriptionType.Team || subscription?.type === SubscriptionType.Enterprise
              ? t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.TEAM_CREDITS_TITLE)
              : t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS_TITLE)
          }
          workspaceCredits={workspaceCredits}
          ctaEl={getCreditsCtaEl()}
          subscriptionType={subscription?.type}
          creditsRenewalDate={subscription?.startsAt}
          allocatedAmount={subscription?.monthlyCredits}
          totalExtraCredits={totalExtraCredits}
          totalRolloverCredits={totalRolloverCredits}
          availableMonthlyCredits={availableMonthlyCredits}
        />
        {subscription?.type === SubscriptionType.Team || subscription?.type === SubscriptionType.Enterprise ? (
          <>
            <Divider />
            <CreditsAllocationSection />
          </>
        ) : null}
      </PermissionsContainer>

      <Divider />
      <PermissionsContainer permission="plan">
        <PlanSection
          plan={subscription?.name}
          usedSeats={String(subscription?.usedSeats ?? '')}
          seats={String(subscription?.seatsLimit ?? '')}
          dateLabel={dateLabel}
          date={dateToDisplay}
          monthlyCredits={subscription?.monthlyCredits}
        />
      </PermissionsContainer>
      {getDowngradeText()}
      {getContactUsCta()}
      {getPlanCta()}
      {getManagePaymentsCta()}
    </FlexCol>
  );
};
