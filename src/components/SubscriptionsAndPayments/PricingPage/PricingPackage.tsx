import { Typography, Divider, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useContext, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { log } from '@/logger/logger.ts';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { SubscriptionType, BillingCycle } from '@/types/shared';
import { getAxiosInstance } from '@/services/axiosConfig';
import { CreditsContext } from '@/services/CreditsContext';
import TeamSizeModal from '@/components/SubscriptionsAndPayments/TeamSizeModal';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { User } from '@/types/auth.types';
import { AsteriskIcon } from '@/UI/Icons/AsteriskIcon';
import { Flex, FlexCenHorVer, FlexCenVer, FlexCol } from '@/UI/styles';
import ConfirmationDialog from '@/components/Common/ConfirmationDialogV2';
import { ButtonContained } from '@/UI/Buttons/AppButton';

const logger = log.getLogger('PricingPackage');
const axiosInstance = getAxiosInstance();

interface PricingPackageProps {
  subscriptionType: SubscriptionType;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  credits: string;
  creditsInfo: string;
  featuresTitle?: string;
  features: string[];
  highlightedFeatureIndex?: number;
  currentUserPlan: SubscriptionType;
  isPopular?: boolean;
  billingCycle: BillingCycle;
  workspaceId?: string;
  downgradeData?: {
    date?: Date;
    plan?: string;
  };
  currentUser?: User | undefined;
}

export const PricingPackage = ({
  subscriptionType,
  description,
  monthlyPrice,
  annualPrice,
  credits,
  creditsInfo,
  featuresTitle,
  features,
  highlightedFeatureIndex,
  currentUserPlan,
  isPopular,
  billingCycle,
  workspaceId,
  downgradeData,
  currentUser,
}: PricingPackageProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showTeamSizeModal, setShowTeamSizeModal] = useState(false);
  const [isShowRestoreConfirmation, setIsShowRestoreConfirmation] = useState(false);
  const { track } = useAnalytics();
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('payment', 'upgrade');
  currentUrl.searchParams.set('plan', subscriptionType);
  const callbackUrl = currentUrl.toString();

  const { openUpgradeSubscriptionModal, openDowngradeSubscriptionModal } = useContext(CreditsContext);

  const planOrder = Object.values(SubscriptionType);

  const getPricingButtonText = () => {
    if (!currentUser) {
      return subscriptionType === SubscriptionType.Free
        ? t(I18N_KEYS.PAYMENTS.PRICING_TABLE.FREE_PLAN_CTA)
        : billingCycle === BillingCycle.Yearly
          ? t(I18N_KEYS.PAYMENTS.PRICING_TABLE.PAID_ANNUAL_PLAN_CTA)
          : t(I18N_KEYS.PAYMENTS.PRICING_TABLE.PAID_PLAN_CTA);
    }
    if (currentUserPlan === subscriptionType) {
      if (isDowngradedPlanExists) {
        return t(I18N_KEYS.PAYMENTS.PRICING_TABLE.RESTORE_PLAN);
      }
      return t(I18N_KEYS.PAYMENTS.PRICING_TABLE.CURRENT_PLAN_CTA);
    }
    const currentPlanIndex = planOrder.indexOf(currentUserPlan);
    const packagePlanIndex = planOrder.indexOf(subscriptionType);

    if (packagePlanIndex > currentPlanIndex) {
      return billingCycle === BillingCycle.Yearly
        ? t(I18N_KEYS.PAYMENTS.PRICING_TABLE.PAID_ANNUAL_PLAN_CTA)
        : t(I18N_KEYS.PAYMENTS.PRICING_TABLE.PAID_PLAN_CTA);
    } else {
      return t(I18N_KEYS.PAYMENTS.PRICING_TABLE.CHANGE_PLAN_CTA);
    }
  };

  const onPackageButtonClick = async () => {
    track(
      'Pricing Table - Clicked_package_button',
      { package: subscriptionType, billingCycle: billingCycle },
      TrackTypeEnum.BI,
    );
    if (!currentUser) {
      // if user is not logged in, we need to redirect to the login page
      window.location.href = '/signin';
      return;
    }
    if (currentUserPlan === SubscriptionType.Free) {
      // no subscription yet -> send directly to stripe
      if (subscriptionType === SubscriptionType.Team) {
        // in case of team plan, we need to show the team size modal
        setShowTeamSizeModal(true);
        return;
      }
      const checkoutSessionUrl = await getStripeCheckoutUrl();
      if (checkoutSessionUrl) {
        window.location.href = checkoutSessionUrl;
      }
    } else {
      if (isDowngradedPlanExists && currentUserPlan === subscriptionType) {
        try {
          setIsShowRestoreConfirmation(true);
        } catch (e) {
          logger.error('Failed restoring plan', e);
        }
        return;
      }
      // already have a subscription -> upgrade or downgrade
      // TODO:LAUNCH - add upgrade or downgrade logic
      const currentPlanIndex = planOrder.indexOf(currentUserPlan);
      const packagePlanIndex = planOrder.indexOf(subscriptionType);
      if (packagePlanIndex > currentPlanIndex) {
        openUpgradeSubscriptionModal({
          name: subscriptionType,
          billingCycle,
          price: billingCycle === BillingCycle.Monthly ? monthlyPrice : annualPrice,
        });
      } else {
        openDowngradeSubscriptionModal({
          name: subscriptionType,
          billingCycle,
          price: billingCycle === BillingCycle.Monthly ? monthlyPrice : annualPrice,
        });
      }
    }
  };

  const onRestoreConfirm = async () => {
    try {
      await axiosInstance.post(`/v1/workspaces/${workspaceId}/subscriptions/restore`);
      window.location.reload();
    } catch (e) {
      logger.error('Failed to restore plan', e);
    } finally {
      setIsShowRestoreConfirmation(false);
    }
  };

  const getStripeCheckoutUrl = async (numberOfSeats: number = 1): Promise<string | null> => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post<{ checkoutSessionUrl: string }>(
        `/v1/workspaces/${workspaceId}/subscriptions/checkout-session`,
        {
          subscriptionType,
          billingCycle,
          callbackUrl,
          numberOfSeats,
        },
      );
      return response.data.checkoutSessionUrl;
    } catch (error) {
      logger.error('Failed getting stripe checkout', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const StartIcon = (
    <FlexCenVer>{isLoading ? <CircularProgress size={16} sx={{ color: color.Black92 }} /> : null}</FlexCenVer>
  );

  const isThisDowngradedPlan = useMemo(
    () => Boolean(downgradeData?.plan === subscriptionType && downgradeData?.date),
    [downgradeData?.date, downgradeData?.plan, subscriptionType],
  );

  const isDowngradedPlanExists = useMemo(
    () => Boolean(downgradeData?.plan && downgradeData?.date),
    [downgradeData?.date, downgradeData?.plan],
  );

  const shouldDisablePackageButton = currentUser && currentUserPlan === subscriptionType && !isDowngradedPlanExists;

  const shouldHighlightPackage = isPopular && (currentUserPlan === SubscriptionType.Free || !currentUserPlan);

  return (
    <FlexCol
      data-testid="pricing-package-container"
      sx={{
        width: '100%',
        // maxWidth: '300px',
        minHeight: '573px',
        backgroundColor: shouldHighlightPackage ? color.Black84 : color.Black92,
        outline: shouldHighlightPackage ? `1px solid ${color.White16_T}` : 'none',
        borderRadius: 2,
        p: 4,
        pt: 7,
        position: 'relative',
      }}
    >
      <Typography variant="h2" sx={{ mb: 1, textTransform: 'capitalize' }}>
        {subscriptionType}
      </Typography>
      <Typography variant="body-std-md" color={color.White80_T} sx={{ mb: 3, minHeight: '44px' }}>
        {description}
      </Typography>
      <Flex
        sx={{
          alignItems:
            billingCycle === BillingCycle.Yearly && subscriptionType !== SubscriptionType.Free ? 'center' : 'baseline',
          mb: 3,
          gap: 1,
        }}
      >
        <Typography variant="h1" sx={{ fontSize: '3rem', fontWeight: 600 }}>
          ${billingCycle === BillingCycle.Monthly ? monthlyPrice : annualPrice}
        </Typography>
        <FlexCol>
          <Typography variant="body-sm-rg">
            {subscriptionType !== SubscriptionType.Free
              ? subscriptionType === SubscriptionType.Team
                ? ` / ${t(I18N_KEYS.GENERAL.USER)} / ${t(I18N_KEYS.GENERAL.MONTH)}`
                : ` / ${t(I18N_KEYS.GENERAL.MONTH)}`
              : ''}
          </Typography>
          {billingCycle === BillingCycle.Yearly && subscriptionType !== SubscriptionType.Free && (
            <Typography variant="body-sm-rg" color={color.White64_T}>
              billed annually as ${Number(annualPrice) * 12}
            </Typography>
          )}
        </FlexCol>
      </Flex>
      <ButtonContained
        disabled={shouldDisablePackageButton || isLoading || isThisDowngradedPlan}
        onClick={() => void onPackageButtonClick()}
        sx={{ mb: 3 }}
        startIcon={StartIcon}
      >
        {isThisDowngradedPlan && downgradeData?.date
          ? t(I18N_KEYS.PAYMENTS.PRICING_TABLE.DOWNGRADE_DATE_PREFIX) + ' ' + format(downgradeData.date, 'MMM d, yyyy')
          : getPricingButtonText()}
      </ButtonContained>
      <Flex sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Flex sx={{ gap: 0.5 }}>
          <AsteriskIcon style={{ position: 'relative', top: -1 }} />
          <FlexCol sx={{ gap: 0.5 }}>
            <Typography variant="body-sm-rg">{credits}</Typography>
            <Typography variant="body-sm-rg" color={color.White64_T}>
              {creditsInfo}
            </Typography>
          </FlexCol>
        </Flex>
        {/* <Tooltip title={creditsInfo} sx={{maxWidth: '120px !important'}}>
          <i className="fa-light fa-circle-info" style={{fontSize: '0.75rem'}}></i>
        </Tooltip> */}
      </Flex>
      <Divider sx={{ mb: 3, borderColor: color.White16_T }} />
      <FlexCol sx={{ gap: 1 }}>
        {featuresTitle && (
          <Typography variant="body-sm-rg" color={color.White80_T}>
            {featuresTitle}
          </Typography>
        )}
        {features.map((feature, index) => (
          <Flex key={index} sx={{ alignItems: 'flex-start', gap: 1 }}>
            <i className="fa-light fa-check" style={{ fontSize: '0.75rem' }}></i>
            <Typography variant="body-sm-rg" color={color.White80_T}>
              {feature}
            </Typography>
            {index === highlightedFeatureIndex && (
              <FlexCenHorVer
                sx={{
                  backgroundColor: color.Yellow16_T,
                  color: color.Yellow100,
                  fontSize: '0.65rem',
                  fontWeight: 400,
                  fontFamily: 'DM Mono',
                  borderRadius: 1,
                  height: '18px',
                  px: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {t(I18N_KEYS.PAYMENTS.PRICING_TABLE.GAIN_20_PERCENT)}
              </FlexCenHorVer>
            )}
          </Flex>
        ))}
      </FlexCol>
      {shouldHighlightPackage && (
        <FlexCenHorVer
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: color.Yellow16_T,
            color: color.Yellow100,
            fontSize: '0.65rem',
            fontWeight: 400,
            fontFamily: 'DM Mono',
            borderRadius: 1,
            height: '18px',
            px: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {t(I18N_KEYS.PAYMENTS.PRICING_TABLE.MOST_POPULAR)}
        </FlexCenHorVer>
      )}
      {showTeamSizeModal && (
        <TeamSizeModal
          open={showTeamSizeModal}
          onClose={() => setShowTeamSizeModal(false)}
          packagePrice={billingCycle === BillingCycle.Monthly ? monthlyPrice : annualPrice}
          billingCycle={billingCycle}
          isProcessing={isLoading}
          getStripeCheckoutUrl={getStripeCheckoutUrl}
        />
      )}
      <ConfirmationDialog
        open={isShowRestoreConfirmation}
        onClose={() => setIsShowRestoreConfirmation(false)}
        onConfirm={() => void onRestoreConfirm()}
        title={t(I18N_KEYS.PAYMENTS.PRICING_TABLE.RESTORE_CONFIRMATION_TITLE)}
      />
    </FlexCol>
  );
};
