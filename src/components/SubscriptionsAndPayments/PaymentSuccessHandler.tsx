import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';
import { SubscriptionType } from '@/types/shared';

const enum PaymentType {
  CREDITS = 'credits',
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade',
  UNKNOWN = 'unknown',
}

function PaymentSuccessHandler() {
  const navigate = useNavigate();
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [paymentType, setPaymentType] = useState('');
  const [amount, setAmount] = useState('');
  const [plan, setPlan] = useState('');
  const { track } = useAnalytics();
  const { t } = useTranslation();
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('session_id')) {
      const paymentType = urlParams.get('payment') || PaymentType.UNKNOWN; // upgrade plan or buy credits
      const plan = urlParams.get('plan') || 'unknown';
      const amount = urlParams.get('amount') || 'unknown';
      setPaymentType(paymentType);
      setPlan(plan);
      setAmount(amount);
      track(
        'Pricing - Payment_success',
        {
          context: 'Payments',
          paymentType,
          amount,
          plan,
        },
        TrackTypeEnum.BI,
      );
      if (paymentType !== PaymentType.UNKNOWN) {
        // Clean up the specific payment-related query params
        urlParams.delete('payment');
        urlParams.delete('session_id');
        navigate(`${window.location.pathname}?${urlParams.toString()}`, { replace: true });

        // Get the previous page URL from localStorage
        const previousPageUrl = localStorage.getItem('lastPageBeforePayment') || '/';

        try {
          let redirectPath: string;
          const { search } = new URL(previousPageUrl);
          if (plan === SubscriptionType.Team) {
            redirectPath = `/settings?section=team${search}`;
          } else {
            const { pathname } = new URL(previousPageUrl);
            redirectPath = pathname + search;
          }

          // Set flag to show the snackbar after redirecting
          setShowSnackbar(true);

          // Redirect to the previous page
          navigate(redirectPath);
        } catch (_error) {
          // Fallback if URL parsing fails
          navigate('/');
          setShowSnackbar(true);
        }
      }
    } else if (urlParams.get('payment')) {
      // Delete the payment parameter if session_id is not present
      urlParams.delete('payment');
      urlParams.delete('amount');
      urlParams.delete('plan');
      const newUrl = urlParams.toString();
      navigate(`${window.location.pathname}?${newUrl}`, { replace: true });
    }
  }, [navigate, track]);

  // // Clean up URL and show the snackbar after redirect
  useEffect(() => {
    if (showSnackbar) {
      setTimeout(() => {
        // Clean up any remaining query params from the current URL
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete('payment');
        urlParams.delete('session_id');
        urlParams.delete('amount');
        urlParams.delete('plan');
        navigate(`${window.location.pathname}?${urlParams.toString()}`, { replace: true });
      }, 500); // Delay before cleaning the URL after showing the snackbar
    }
  }, [navigate, showSnackbar]);

  const getSuccessMessage = () => {
    switch (paymentType) {
      case PaymentType.CREDITS:
        return (
          <div translate="no">
            <Trans
              i18nKey={t(I18N_KEYS.PAYMENTS.CREDITS_SUCCESS_MESSAGE)}
              components={{
                amount: <span style={{ fontWeight: 'bold' }}>{(Number(amount) || '').toLocaleString()} </span>,
              }}
            />
          </div>
        );
      case PaymentType.UPGRADE:
        return (
          <div translate="no">
            <Trans
              i18nKey={t(I18N_KEYS.PAYMENTS.UPGRADE_SUCCESS_MESSAGE)}
              components={{
                plan: <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{plan}</span>,
              }}
            />
          </div>
        );
      case PaymentType.DOWNGRADE:
        return t(I18N_KEYS.PAYMENTS.DOWNGRADE_SUCCESS_MESSAGE);
      default:
        return 'Awesome! Your payment was successful.';
    }
  };

  return (
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
        {getSuccessMessage()}
      </Alert>
    </Snackbar>
  );
}

export default PaymentSuccessHandler;
