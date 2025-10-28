import { ReactNode, useContext, useState, useEffect, createContext } from 'react';
import noop from 'lodash/noop';
import { Alert, Snackbar } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import ConfirmUpgradeModal from '@/components/SubscriptionsAndPayments/ConfirmUpgradeModal';
import PricingModal from '@/components/SubscriptionsAndPayments/PricingModal';
import { asyncNoop } from '@/utils/functions';
import ConfirmDowngradeModal from '@/components/SubscriptionsAndPayments/ConfirmDowngradeModal';
import GetMoreCreditsModal from '@/components/SubscriptionsAndPayments/GetMoreCreditsModal';
import CreditsOrPricingModal from '@/components/SubscriptionsAndPayments/CreditsOrPricingModal';
import { SubscriptionType } from '@/types/shared';
import { PricingPackage, GetMoreCreditsRequest } from '@/components/SubscriptionsAndPayments/payments.types';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { AuthContext } from '../contexts/AuthContext';
import { getAxiosInstance } from './axiosConfig';

const axiosInstance = getAxiosInstance();

interface CreditsContextStore {
  credits: number | null;
  workspaceCredits: number | null;
  handleConfirmDowngrade: (toPackage: PricingPackage) => Promise<void>;
  handleConfirmUpgrade: (toPackage: PricingPackage) => Promise<void>;
  handleGetMoreCreditsClick: () => void;
  hasError: boolean;
  openDowngradeSubscriptionModal: (toPackage: PricingPackage) => void;
  openUpgradeModal: () => void;
  openUpgradeSubscriptionModal: (toPackage: PricingPackage) => void;
  setShouldShowCreditsToMembers: (shouldShowCreditsToMembers: boolean) => void;
  setUserCredits: (credits: number | null) => void;
  setWorkspaceCredits: (credits: number | null) => void;
  shouldShowCreditsToMembers: boolean;
  subscriptionType: SubscriptionType | null;
}

export const CreditsContext = createContext<CreditsContextStore>({
  credits: null,
  workspaceCredits: null,
  handleConfirmDowngrade: asyncNoop,
  handleConfirmUpgrade: asyncNoop,
  handleGetMoreCreditsClick: noop,
  hasError: false,
  openDowngradeSubscriptionModal: noop,
  openUpgradeModal: noop,
  openUpgradeSubscriptionModal: noop,
  setShouldShowCreditsToMembers: noop,
  setUserCredits: noop,
  setWorkspaceCredits: noop,
  shouldShowCreditsToMembers: true,
  subscriptionType: null,
});

type CreditsProviderProps = {
  children: ReactNode;
};

export const CreditsProvider = ({ children }: CreditsProviderProps) => {
  const { t: translate } = useTranslation();
  const { currentUser, enrichUser } = useContext(AuthContext);
  const [credits, setCredits] = useState<number | null>(null);
  const [workspaceCredits, setWorkspaceCredits] = useState<number | null>(null);
  const [currentSubscriptionType, setCurrentSubscriptionType] = useState<SubscriptionType | null>(null);
  const { track } = useAnalytics();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showGetMoreCreditsModal, setShowGetMoreCreditsModal] = useState(false);
  const [showPricingPlansModal, setShowPricingPlansModal] = useState(false);
  const [showCreditOrPricingModal, setShowCreditOrPricingModal] = useState(false);

  const [shouldShowCreditsToMembers, setShouldShowCreditsToMembers] = useState(true);
  const [showUpgradeSubscriptionModal, setShowUpgradeSubscriptionModal] = useState(false);
  const [upgradeToPackage, setUpgradeToPackage] = useState<PricingPackage>();
  const [downgradeToPackage, setDowngradeToPackage] = useState<PricingPackage>();
  const [showDowngradeSubscriptionModal, setShowDowngradeSubscriptionModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<ReactNode | null>(null);

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const hasCreditsLimit = currentUser.activeWorkspace?.hasCustomCreditsLimit;
      const monthlyCreditsLimit = currentUser.activeWorkspace?.monthlyCreditsLimit;
      const defaultMonthlyAllocatedCredits = currentUser.activeWorkspace?.preferences?.defaultMonthlyAllocatedCredits;

      const creditsLimit = hasCreditsLimit
        ? monthlyCreditsLimit // null means unlimited, value means limited
        : (monthlyCreditsLimit ?? defaultMonthlyAllocatedCredits);
      const usedCredits = currentUser.activeWorkspace?.userWorkspaceCreditsUsage;
      const totalWorkspaceCredits = currentUser.activeWorkspace?.subscription?.creditsList?.reduce(
        (acc, credit) => acc + credit.available,
        0,
      );

      const availableCredits =
        creditsLimit !== null && creditsLimit !== undefined
          ? Math.min(Math.max(0, creditsLimit - usedCredits), totalWorkspaceCredits)
          : totalWorkspaceCredits;

      setCredits(availableCredits || 0);
      setWorkspaceCredits(totalWorkspaceCredits || 0);
      setShouldShowCreditsToMembers(currentUser.activeWorkspace.preferences?.showCreditsToMembers ?? true);
      setCurrentSubscriptionType(currentUser.activeWorkspace.subscription?.type);
    }
  }, [currentUser]);

  const openUpgradeModal = () => {
    localStorage.setItem('lastPageBeforePayment', window.location.href);
    setShowUpgradeModal(true);
  };

  const handleGetMoreCreditsClick = () => {
    track(
      'Clicked_get_more_credits',
      {
        context: 'Payments',
      },
      TrackTypeEnum.BI,
    );
    localStorage.setItem('lastPageBeforePayment', window.location.href);
    if (currentSubscriptionType === SubscriptionType.Free) {
      setShowPricingPlansModal(true);
    } else if (
      currentSubscriptionType !== SubscriptionType.Team &&
      currentSubscriptionType !== SubscriptionType.Enterprise
    ) {
      setShowCreditOrPricingModal(true);
    } else {
      setShowGetMoreCreditsModal(true);
    }
  };

  const openUpgradeSubscriptionModal = (toPackage: PricingPackage) => {
    track(
      'Opened_upgrade_subscription_modal',
      {
        package: toPackage.name,
        context: 'Payments',
      },
      TrackTypeEnum.BI,
    );
    setHasError(false);
    setShowUpgradeSubscriptionModal(true);
    setUpgradeToPackage(toPackage);
  };

  const openDowngradeSubscriptionModal = (toPackage: PricingPackage) => {
    track(
      'Pricing - Opened_downgrade_subscription_modal',
      {
        package: toPackage.name,
        context: 'Payments',
      },
      TrackTypeEnum.BI,
    );
    setHasError(false);
    setShowDowngradeSubscriptionModal(true);
    setDowngradeToPackage(toPackage);
  };

  const upgradeSuccessMessage = (toPackage: PricingPackage) => (
    <Trans
      i18nKey={translate(I18N_KEYS.PAYMENTS.UPGRADE_SUCCESS_MESSAGE)}
      components={{
        plan: <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{toPackage.name}</span>,
      }}
    />
  );

  const handleConfirmUpgrade = async (toPackage: PricingPackage, numberOfSeats: number = 1) => {
    track(
      'Pricing - Confirmed_upgrade_subscription',
      {
        package: toPackage.name,
        numberOfSeats,
        context: 'Payments',
      },
      TrackTypeEnum.BI,
    );
    // TODO: handle upgrade / downgrade
    try {
      setHasError(false);
      setIsProcessingPayment(true);
      const response = await axiosInstance.post(
        `/v1/workspaces/${currentUser?.activeWorkspace?.workspaceId}/subscriptions/upgrade`,
        {
          subscriptionType: toPackage.name,
          billingCycle: toPackage.billingCycle,
          numberOfSeats: numberOfSeats,
        },
      );
      if (response.status === 200) {
        await enrichUser();
        setShowUpgradeModal(false);
        setShowPricingPlansModal(false);
        setShowSnackbar(true);
        setSnackbarMessage(upgradeSuccessMessage(toPackage));
        setShowUpgradeSubscriptionModal(false);
      }
    } catch (error) {
      setHasError(true);
      throw error;
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const downgradeSuccessMessage = (toPackage: PricingPackage) => (
    <Trans
      i18nKey={translate(I18N_KEYS.PAYMENTS.DOWNGRADE_SUCCESS_MESSAGE)}
      components={{
        plan: <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{toPackage.name}</span>,
      }}
    />
  );
  const handleConfirmDowngrade = async (toPackage: PricingPackage) => {
    track(
      'Pricing - Confirmed_downgrade_subscription',
      {
        package: toPackage.name,
        context: 'Payments',
      },
      TrackTypeEnum.BI,
    );
    // TODO: handle downgrade
    try {
      setHasError(false);
      setIsProcessingPayment(true);
      const response = await axiosInstance.post(
        `/v1/workspaces/${currentUser?.activeWorkspace?.workspaceId}/subscriptions/downgrade`,
        {
          subscriptionType: toPackage.name,
          billingCycle: toPackage.billingCycle,
        },
      );
      if (response.status === 200) {
        await enrichUser();
        setShowUpgradeModal(false);
        setShowPricingPlansModal(false);
        setShowSnackbar(true);
        setSnackbarMessage(downgradeSuccessMessage(toPackage));
      }
    } catch (error) {
      setHasError(true);
      throw error;
    } finally {
      setIsProcessingPayment(false);
      setShowDowngradeSubscriptionModal(false);
    }
  };

  const handleConfirmGetMoreCredits = async (creditsRequest: GetMoreCreditsRequest) => {
    track(
      'Pricing - Confirmed_get_more_credits',
      {
        credits: creditsRequest.credits,
        payAmountInUsd: creditsRequest.payAmountInUsd,
        context: 'Payments',
      },
      TrackTypeEnum.BI,
    );
    // round price
    creditsRequest.payAmountInUsd = Math.round(creditsRequest.payAmountInUsd * 100) / 100;
    try {
      setIsProcessingPayment(true);
      setHasError(false);
      const response = await axiosInstance.post(
        `/v1/workspaces/${currentUser?.activeWorkspace?.workspaceId}/subscriptions/credits/checkout-session`,
        creditsRequest,
      );
      const checkoutSessionUrl = response.data.checkoutSessionUrl;
      if (checkoutSessionUrl) {
        window.location.href = checkoutSessionUrl;
      }
    } catch (error) {
      setHasError(true);
      throw error;
    } finally {
      setIsProcessingPayment(false);
    }
  };

  useEffect(() => {
    // close modals on browser back/forward button
    const handlePopState = () => {
      setShowPricingPlansModal(false);
      setShowUpgradeModal(false);
      setShowCreditOrPricingModal(false);
      setShowGetMoreCreditsModal(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <CreditsContext.Provider
      value={{
        credits,
        workspaceCredits,
        handleConfirmDowngrade,
        handleConfirmUpgrade,
        handleGetMoreCreditsClick,
        hasError,
        openDowngradeSubscriptionModal,
        openUpgradeModal,
        openUpgradeSubscriptionModal,
        setShouldShowCreditsToMembers,
        setUserCredits: setCredits,
        setWorkspaceCredits: setWorkspaceCredits,
        shouldShowCreditsToMembers,
        subscriptionType: currentSubscriptionType,
      }}
    >
      {children}
      {currentUser && (
        <>
          {showGetMoreCreditsModal && (
            <GetMoreCreditsModal
              open={showGetMoreCreditsModal}
              onClose={() => setShowGetMoreCreditsModal(false)}
              currentUser={currentUser}
              isProcessing={isProcessingPayment}
              hasError={hasError}
              setHasError={setHasError}
              onConfirm={handleConfirmGetMoreCredits}
            />
          )}
          {(showPricingPlansModal || showUpgradeModal) && (
            <PricingModal
              open={showUpgradeModal || showPricingPlansModal}
              closeModal={() => {
                setShowPricingPlansModal(false);
                setShowUpgradeModal(false);
              }}
            />
          )}
          {showCreditOrPricingModal && (
            <CreditsOrPricingModal
              open={showCreditOrPricingModal}
              onClose={() => setShowCreditOrPricingModal(false)}
              setShowGetMoreCreditsModal={setShowGetMoreCreditsModal}
              setShowPricingPlansModal={setShowPricingPlansModal}
            />
          )}
        </>
      )}
      {currentUser && upgradeToPackage && showUpgradeSubscriptionModal && (
        <ConfirmUpgradeModal
          open={showUpgradeSubscriptionModal}
          onClose={() => setShowUpgradeSubscriptionModal(false)}
          toPackage={upgradeToPackage}
          onConfirm={handleConfirmUpgrade}
          isProcessing={isProcessingPayment}
          currentUser={currentUser}
          hasError={hasError}
        />
      )}
      {currentUser && downgradeToPackage && showDowngradeSubscriptionModal && (
        <ConfirmDowngradeModal
          open={showDowngradeSubscriptionModal}
          onClose={() => setShowDowngradeSubscriptionModal(false)}
          toPackage={downgradeToPackage}
          onConfirm={handleConfirmDowngrade}
          isProcessing={isProcessingPayment}
          hasError={hasError}
        />
      )}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={5000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowSnackbar(false)}
          severity="success"
          variant="filled"
          sx={{
            width: '100%',
            '& .MuiAlert-icon': { display: 'none' },
            color: color.Black100,
            backgroundColor: color.Yellow64,
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </CreditsContext.Provider>
  );
};

export const useCreditsContext = () => {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error('useCreditsContext must be used within a CreditsProvider');
  }
  return context;
};
