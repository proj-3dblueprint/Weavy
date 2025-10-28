import { useState, useContext, useEffect } from 'react';
import { Box, Typography, Grid, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { SubscriptionType, BillingCycle } from '@/types/shared';
import { PricingPackage } from '@/components/SubscriptionsAndPayments/PricingPage/PricingPackage';
import EnterprisePackage from '@/components/SubscriptionsAndPayments/PricingPage/EnterprisePackage';
import CreditsTable from '@/components/SubscriptionsAndPayments/PricingPage/CreditsTable';
import PricingFAQS from '@/components/SubscriptionsAndPayments/PricingPage/PricingFAQS';
import { AuthContext } from '@/contexts/AuthContext';
import { PricingPageContainer } from '@/enums/pricing-page.enum';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { AppToggleButtons } from '@/UI/AppToggleButtons/AppToggleButtons';

const getPricingPackages = (currentUserPlan: SubscriptionType) => {
  const basePackages = [
    {
      name: SubscriptionType.Free,
      description: "Explore Weavy's possibilities.",
      monthlyPrice: 0,
      annualPrice: 0,
      credits: '150 monthly credits',
      creditsInfo: '= 375 images or 25 sec video',
      features: [
        'Access to all AI models',
        'Professional-grade editing tools',
        'Workflow collaboration feature',
        '5 workflows',
        'No workflow history',
      ],
      highlightedFeature: 3,
    },
    {
      name: SubscriptionType.Starter,
      description: 'For creators producing content occasionally.',
      monthlyPrice: 24,
      annualPrice: 19,
      credits: '1,500 monthly credits',
      creditsInfo: '= 3,750 images or 417 sec video',
      featuresTitle: 'Everything in Free, plus -',
      features: ['Unlimited workflows', 'Top up at $10 / 1,000 credits'],
    },
    {
      name: SubscriptionType.Pro,
      description: 'For professionals generating media daily.',
      monthlyPrice: 45,
      annualPrice: 36,
      credits: '4,000 monthly credits',
      creditsInfo: '= 10,000 images or 1,111 sec video',
      featuresTitle: 'Everything in Starter, plus -',
      features: ['3-month credit rollover', 'Top up at $10 / 1,200 credits'],
      highlightedFeatureIndex: 1,
      isPopular: true,
    },
    {
      name: SubscriptionType.Team,
      description: 'For in-house and agency visual teams.',
      monthlyPrice: 60,
      annualPrice: 48,
      credits: '4,500 monthly credits / user',
      creditsInfo: '= 11,250 images or 1,250 sec video',
      featuresTitle: 'Everything in Pro, plus -',
      features: [
        'Unified billing',
        'Shared credit pool for maximal efficiency',
        'Workspace file sharing',
        'Team members administration',
        'Team credits management',
      ],
    },
  ];

  return basePackages.map((pkg) => {
    // If current user is on Free plan and this is the Starter package
    if (currentUserPlan !== SubscriptionType.Free && pkg.name === SubscriptionType.Starter) {
      return {
        ...pkg,
        featuresTitle: '',
        features: [
          'Full access to all AI models',
          'Professional-grade editing tools',
          'Workflow collaboration feature',
          'Commercial license',
          'Unlimited workflows',
          'Top up at $10 / 1,000 credits',
        ],
      };
    }

    return pkg;
  });
};

export const PricingTablePage = ({ container }: { container: PricingPageContainer }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser } = useContext(AuthContext);
  const { track } = useAnalytics();
  const [currentUserPlan] = useState(currentUser?.activeWorkspace?.subscription?.type || SubscriptionType.Free);
  const [billingCycle, setBillingCycle] = useState(BillingCycle.Yearly);

  const MAX_WIDTH = currentUserPlan !== SubscriptionType.Free ? '936px' : '1248px';

  useEffect(() => {
    track(
      'Opened_pricing_table',
      {
        context: 'Payments',
        context_data: { container },
      },
      TrackTypeEnum.BI,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBillingCycleChange = (newBillingCycle: BillingCycle | null) => {
    track('Pricing Table - Changed_billing_cycle', { billingCycle: newBillingCycle }, TrackTypeEnum.BI);
    if (newBillingCycle) {
      setBillingCycle(newBillingCycle);
    }
  };

  return (
    <>
      <Box
        data-testid="pricing-table-page-container"
        sx={{
          width: '100%',
          overflowY: 'auto',
          background: `${color.Black100}`,
          backdropFilter: `blur(3px)`,
          WebkitBackdropFilter: `blur(3px)`,
          p: {
            xs: 4,
            md: 12,
          },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography variant="h1" sx={{ fontSize: '3rem', fontWeight: 600, mb: 4, mt: 6 }}>
          {currentUser ? t(I18N_KEYS.PAYMENTS.PRICING_TABLE.TITLE) : t(I18N_KEYS.PAYMENTS.PRICING_TABLE.TEMP_TITLE)}
        </Typography>
        {/* Toggle Monthly / Annually */}
        <Box sx={{ mb: 6, mt: 4 }}>
          <AppToggleButtons
            btnH={32}
            btnW={136}
            sx={{
              backgroundColor: color.White04_T,
              borderRadius: 2,
              p: 0.5,
            }}
            value={billingCycle}
            options={[
              {
                value: BillingCycle.Monthly,
                label: (
                  <Typography variant="body-sm-md" color="inherit">
                    {t(I18N_KEYS.PAYMENTS.PRICING_TABLE.TOGGLE_BUTTON.MONTHLY)}
                  </Typography>
                ),
                'aria-label': t(I18N_KEYS.PAYMENTS.PRICING_TABLE.TOGGLE_BUTTON.MONTHLY),
              },
              {
                value: BillingCycle.Yearly,
                label: (
                  <Typography variant="body-sm-md" color="inherit">
                    {t(I18N_KEYS.PAYMENTS.PRICING_TABLE.TOGGLE_BUTTON.YEARLY)}
                  </Typography>
                ),
                'aria-label': t(I18N_KEYS.PAYMENTS.PRICING_TABLE.TOGGLE_BUTTON.YEARLY),
              },
            ]}
            mode="light"
            onChange={handleBillingCycleChange}
          />
        </Box>
        {/* Packages */}
        <Grid
          container
          data-testid="pricing-table-packages-container"
          spacing={2}
          sx={{
            maxWidth: MAX_WIDTH,
            mb: 8,
          }}
        >
          {getPricingPackages(currentUserPlan)
            .filter(
              (pricingPackage) =>
                currentUserPlan === SubscriptionType.Free || pricingPackage.name !== SubscriptionType.Free,
            )
            .map((pricingPackage) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                lg={currentUserPlan === SubscriptionType.Free ? 3 : 4}
                key={pricingPackage.name}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <PricingPackage
                  subscriptionType={pricingPackage.name}
                  description={pricingPackage.description}
                  monthlyPrice={pricingPackage.monthlyPrice}
                  annualPrice={pricingPackage.annualPrice}
                  credits={pricingPackage.credits}
                  creditsInfo={pricingPackage.creditsInfo}
                  featuresTitle={pricingPackage.featuresTitle}
                  features={pricingPackage.features}
                  highlightedFeatureIndex={pricingPackage.highlightedFeatureIndex}
                  billingCycle={billingCycle}
                  currentUserPlan={currentUserPlan}
                  isPopular={pricingPackage.isPopular}
                  workspaceId={currentUser?.activeWorkspace?.workspaceId}
                  downgradeData={{
                    date: currentUser?.activeWorkspace?.subscription?.scheduledDowngradeDate,
                    plan: currentUser?.activeWorkspace?.subscription?.scheduledDowngradePlan,
                  }}
                  currentUser={currentUser || undefined}
                />
              </Grid>
            ))}
        </Grid>
        {/* Enterprise Package */}
        <Box sx={{ width: '100%', maxWidth: MAX_WIDTH, display: 'flex', justifyContent: 'center', mb: 6 }}>
          <EnterprisePackage currentUser={currentUser || undefined} />
        </Box>
        {/* Partners */}

        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            pt: 9,
            mb: 6,
            alignItems: 'center',
          }}
        >
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 8 }}>
            <Typography variant="body-lg-rg">{t(I18N_KEYS.PAYMENTS.PRICING_TABLE.PARTNERS_TITLE)}</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 0,
              flexWrap: 'wrap',
              justifyContent: 'center',
              width: '75%',
            }}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <img src={`/partners-logos/partner_logo_0${index + 1}.svg`} alt={`Logo ${index + 1}`} key={index} />
            ))}
            {Array.from({ length: 6 }).map((_, index) => (
              <img src={`/partners-logos/partner_logo_0${index + 7}.svg`} alt={`Logo ${index + 7}`} key={index + 7} />
            ))}
          </Box>
        </Box>

        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', pt: 9, mb: 6 }}>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 8 }}>
            <Typography variant="body-lg-rg">{t(I18N_KEYS.PAYMENTS.PRICING_TABLE.CREDITS_TABLE_TITLE)}</Typography>
          </Box>
          <Box>
            <CreditsTable maxWidth={720} />
          </Box>
        </Box>
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', pt: 9, mb: 6 }}>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 8 }}>
            <Typography variant="body-lg-rg">{t(I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQ_TITLE)}</Typography>
          </Box>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <PricingFAQS maxWidth={720} />
          </Box>
        </Box>
      </Box>
      {container === PricingPageContainer.Page && (
        <Box
          data-testid="pricing-table-page-home-button"
          sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <IconButton onClick={() => navigate('/')} sx={{ position: 'fixed', top: 17, left: 16, zIndex: 1000 }}>
            <img src="/icons/logo.svg" alt="weavy_logo" />
          </IconButton>
        </Box>
      )}
    </>
  );
};
