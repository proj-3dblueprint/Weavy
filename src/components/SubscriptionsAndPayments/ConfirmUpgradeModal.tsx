import { useEffect, useState } from 'react';
import { Dialog, IconButton, Typography, Divider, Skeleton, CircularProgress, Link } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Trans, useTranslation } from 'react-i18next';
import { log } from '@/logger/logger.ts';
import { color } from '@/colors';
import { getAxiosInstance } from '@/services/axiosConfig';
import { BillingCycle } from '@/types/shared';
import { User } from '@/types/auth.types';
import { I18N_KEYS } from '@/language/keys';
import { Flex, FlexCenVer, FlexCol, FlexRow } from '@/UI/styles';
import { PricingPackage } from '@/components/SubscriptionsAndPayments/payments.types';
import { ButtonContained } from '@/UI/Buttons/AppButton';

const logger = log.getLogger('ConfirmUpgradeModal');
const axiosInstance = getAxiosInstance();

interface ConfirmUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  toPackage: PricingPackage;
  onConfirm: (toPackage: PricingPackage) => Promise<void>;
  isProcessing: boolean;
  hasError: boolean;
  currentUser: User;
}

function ConfirmUpgradeModal({
  open,
  onClose,
  toPackage,
  onConfirm,
  isProcessing,
  hasError,
  currentUser,
}: ConfirmUpgradeModalProps) {
  const { t } = useTranslation();

  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [paymentMethodBrand, setPaymentMethodBrand] = useState<string | null>(null);
  const [paymentMethodLast4, setPaymentMethodLast4] = useState<string | null>(null);
  const [customerPortalSessionLink, setCustomerPortalSessionLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLocalError, setHasLocalError] = useState(false);

  useEffect(() => {
    // get user payment info.
    const getPaymentMethod = async () => {
      try {
        setHasLocalError(false);
        setIsLoading(true);
        const [paymentMethodRes, customerPortalSessionRes] = await Promise.all([
          axiosInstance.get(`/v1/workspaces/${currentUser?.activeWorkspace?.workspaceId}/subscriptions/payment-method`),
          axiosInstance.post(
            `/v1/workspaces/${currentUser?.activeWorkspace?.workspaceId}/subscriptions/customer-portal-session`,
            {
              returnUrl: window.location.href,
            },
          ),
        ]);
        setPaymentMethodBrand(paymentMethodRes.data?.card?.brand);
        setPaymentMethodLast4(paymentMethodRes.data?.card?.last4Numbers);
        setPaymentMethod(paymentMethodRes.data?.type);
        setCustomerPortalSessionLink(customerPortalSessionRes.data.link);
      } catch (error) {
        logger.error('Failed getting payment method', error);
        setHasLocalError(true);
      } finally {
        setIsLoading(false);
      }
    };
    void getPaymentMethod();
  }, []);

  const openIntercom = () => {
    if (window.Intercom) {
      window.Intercom('show');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          backgroundImage: 'none',
          borderRadius: '8px',
          border: `1px solid ${color.White08_T}`,
        },
      }}
    >
      <FlexCol
        sx={{
          width: '420px',
          p: 3,
          pt: 5,
          backgroundColor: color.Black92,
        }}
      >
        <Typography variant="h3" sx={{ mb: 4 }}>
          {isLoading ? <Skeleton variant="text" width={160} height={24} /> : t(I18N_KEYS.PAYMENTS.UPGRADE_MODAL.TITLE)}
        </Typography>
        {(hasError || hasLocalError) && (
          <Flex
            sx={{
              width: '100%',
              mb: 4,
              backgroundColor: color.Weavy_Error_08_T,
              border: `1px solid ${color.Weavy_Error_64_T}`,
              borderRadius: 1,
              p: 2,
            }}
          >
            <Typography variant="body-sm-rg" color={color.Weavy_Error}>
              <Trans
                i18nKey={I18N_KEYS.PAYMENTS.UPGRADE_MODAL.ERROR_MESSAGE}
                components={{
                  link: (
                    <Link
                      onClick={openIntercom}
                      sx={{ cursor: 'pointer', textDecoration: 'underline', color: color.Weavy_Error }}
                    >
                      <Typography variant="body-sm-rg" color={color.Weavy_Error}>
                        {t(I18N_KEYS.PAYMENTS.UPGRADE_MODAL.ERROR_MESSAGE_LINK)}
                      </Typography>
                    </Link>
                  ),
                }}
              />
            </Typography>
          </Flex>
        )}
        <FlexRow sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <FlexCol sx={{ gap: 1 }}>
            <Typography variant="body-std-md">
              {isLoading ? (
                <Skeleton variant="text" width={160} height={20} />
              ) : (
                <Trans
                  i18nKey={I18N_KEYS.PAYMENTS.UPGRADE_MODAL.PLAN_DESCRIPTION}
                  components={{ plan: <span style={{ textTransform: 'capitalize' }}>{toPackage.name}</span> }}
                />
              )}
            </Typography>
            <Typography variant="body-sm-rg" color={color.White64_T}>
              {isLoading ? (
                <Skeleton variant="text" width={100} height={16} />
              ) : (
                <Trans
                  i18nKey={I18N_KEYS.PAYMENTS.UPGRADE_MODAL.BILLING_CYCLE_INFO}
                  components={{ billingCycle: <span style={{}}>{toPackage.billingCycle}</span> }}
                />
              )}
            </Typography>
          </FlexCol>
          <FlexCol sx={{ gap: 2 }}>
            <Typography variant="body-std-md">
              {isLoading ? (
                <Skeleton variant="text" width={80} height={20} />
              ) : (
                `$${toPackage.billingCycle === BillingCycle.Monthly ? toPackage.price : toPackage.price * 12}`
              )}
            </Typography>
          </FlexCol>
        </FlexRow>
        <Divider sx={{ my: 2 }} />
        <FlexCenVer sx={{ justifyContent: 'space-between' }}>
          <Typography variant="body-lg-md">
            {isLoading ? <Skeleton variant="text" width={100} height={16} /> : 'Payment method'}
          </Typography>
          <FlexCol sx={{ alignItems: 'baseline', gap: 1 }}>
            <Typography variant="body-lg-md">
              {isLoading ? (
                <Skeleton variant="text" width={100} height={16} />
              ) : paymentMethod === 'card' ? (
                `${paymentMethodBrand} *${paymentMethodLast4}`
              ) : (
                paymentMethod
              )}
            </Typography>
          </FlexCol>
        </FlexCenVer>
        <FlexCenVer sx={{ justifyContent: 'flex-end', mb: 4 }}>
          {isLoading ? (
            <Skeleton variant="text" width={50} height={12} />
          ) : (
            <>
              {/* <ButtonTextPlain>
               <Typography variant="body-xs-rg" color={color.White64_T}>
                {t(I18N_KEYS.PAYMENTS.UPGRADE_MODAL.CHANGE_PAYMENT_METHOD)}
              </Typography>
            </ButtonTextPlain> */}
              <Link href={customerPortalSessionLink ?? ''} target="_blank">
                <Typography variant="body-xs-rg" color={color.White64_T}>
                  {t(I18N_KEYS.PAYMENTS.UPGRADE_MODAL.CHANGE_PAYMENT_METHOD)}
                </Typography>
              </Link>
            </>
          )}
        </FlexCenVer>
        <FlexCenVer sx={{ justifyContent: 'flex-end', gap: 1 }}>
          <ButtonContained size="small" mode="text" onClick={onClose} disabled={isLoading}>
            {t(I18N_KEYS.PAYMENTS.UPGRADE_MODAL.CTA_CANCEL)}
          </ButtonContained>
          <ButtonContained
            startIcon={isProcessing ? <CircularProgress size={16} sx={{ color: color.Black92 }} /> : null}
            onClick={() => void onConfirm(toPackage)}
            disabled={isLoading || isProcessing}
            size="small"
          >
            {isProcessing
              ? t(I18N_KEYS.PAYMENTS.UPGRADE_MODAL.PROCESSING)
              : t(I18N_KEYS.PAYMENTS.UPGRADE_MODAL.CTA_CONFIRM)}
          </ButtonContained>
        </FlexCenVer>
      </FlexCol>
      <IconButton sx={{ position: 'absolute', top: 8, right: 8 }} onClick={onClose} size="small">
        <CloseIcon />
      </IconButton>
    </Dialog>
  );
}

export default ConfirmUpgradeModal;
