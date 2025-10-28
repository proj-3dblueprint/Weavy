import { Typography } from '@mui/material';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { isNil } from 'lodash';
import { Flex, FlexCenVer, FlexColCenVer } from '@/UI/styles';
import { Label } from '@/UI/Label/Label';
import { formatNumberWithCommas } from '@/utils/numbers';
import { AsteriskIcon } from '@/UI/Icons/AsteriskIcon';
import { color } from '@/colors';
import { SubscriptionType } from '@/types/shared';
import { I18N_KEYS } from '@/language/keys';

const CreditsRenewalInfo = ({
  allocatedAmount,
  creditsRenewalDate,
}: {
  allocatedAmount: number;
  creditsRenewalDate: Date;
}) => {
  const { t } = useTranslation();
  return (
    <Typography variant="body-xs-rg" color={color.White64_T} sx={{ mb: 0.75 }}>
      {t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS_RENEWAL_TEXT, {
        allocatedAmount: formatNumberWithCommas(allocatedAmount),
        creditsRenewalDayInMonth: format(creditsRenewalDate, 'do'),
      })}
    </Typography>
  );
};

interface CreditsSectionProps {
  label: string;
  workspaceCredits: number | null;
  ctaEl: ReactNode;
  subscriptionType: SubscriptionType;
  creditsRenewalDate: Date;
  allocatedAmount: number;
  availableMonthlyCredits?: number;
  totalExtraCredits?: number;
  totalRolloverCredits?: number;
}

export const CreditsSection = ({
  label,
  workspaceCredits,
  ctaEl,
  subscriptionType,
  creditsRenewalDate,
  allocatedAmount,
  totalExtraCredits,
  totalRolloverCredits,
  availableMonthlyCredits,
}: CreditsSectionProps) => {
  const { t } = useTranslation();
  return (
    <FlexColCenVer sx={{ gap: 0.5 }}>
      <Label>{label}</Label>
      <FlexCenVer sx={{ justifyContent: 'space-between' }}>
        <FlexCenVer>
          {workspaceCredits !== null ? (
            <>
              <AsteriskIcon width={24} height={24} />
              <Typography variant="h2" sx={{ display: 'flex', flexDirection: 'column', fontWeight: 400, ml: 0.5 }}>
                {formatNumberWithCommas(workspaceCredits)}
              </Typography>
            </>
          ) : null}
        </FlexCenVer>
        <Flex>{ctaEl}</Flex>
      </FlexCenVer>
      {subscriptionType === SubscriptionType.Free ? (
        <CreditsRenewalInfo allocatedAmount={allocatedAmount} creditsRenewalDate={creditsRenewalDate} />
      ) : (
        <FlexColCenVer sx={{ pt: 1, mt: 1.5 }}>
          <Typography variant="body-sm-rg">
            {t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.REMAINING_MONTHLY_CREDITS_TEXT, {
              availableMonthlyCredits: formatNumberWithCommas(availableMonthlyCredits || 0),
            })}
          </Typography>
          <CreditsRenewalInfo allocatedAmount={allocatedAmount} creditsRenewalDate={creditsRenewalDate} />
          {isNil(totalRolloverCredits) ? null : (
            <Typography variant="body-sm-rg">
              {t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.ROLLOVER_CREDITS_TEXT, {
                totalRolloverCredits: formatNumberWithCommas(totalRolloverCredits),
              })}
            </Typography>
          )}
          {isNil(totalExtraCredits) ? null : (
            <Typography variant="body-sm-rg" sx={{ mt: 0.75 }}>
              {t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.EXTRA_CREDITS_TEXT, {
                totalExtraCredits: formatNumberWithCommas(totalExtraCredits),
              })}
            </Typography>
          )}
        </FlexColCenVer>
      )}
    </FlexColCenVer>
  );
};
