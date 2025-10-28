import { Dialog, IconButton, Typography, CircularProgress, Link } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Trans, useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { Flex, FlexCol, FlexRow } from '@/UI/styles';
import { PricingPackage } from '@/components/SubscriptionsAndPayments/payments.types';
import { ButtonContained } from '@/UI/Buttons/AppButton';

interface ConfirmDowngradeModalProps {
  open: boolean;
  onClose: () => void;
  toPackage: PricingPackage;
  onConfirm: (toPackage: PricingPackage) => Promise<void>;
  isProcessing: boolean;
  hasError: boolean;
}
function ConfirmDowngradeModal({
  open,
  onClose,
  toPackage,
  onConfirm,
  isProcessing,
  hasError,
}: ConfirmDowngradeModalProps) {
  const { t } = useTranslation();

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
        <Typography variant="h3" sx={{ mb: 2 }}>
          {t(I18N_KEYS.PAYMENTS.DOWNGRADE_MODAL.TITLE)}
        </Typography>
        {hasError && (
          <Flex sx={{ width: '100%', mb: 4, backgroundColor: color.Weavy_Error_08_T, borderRadius: 1, p: 2 }}>
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
        <Flex sx={{ mb: 4 }}>
          <Typography variant="body-std-rg" sx={{ lineHeight: 'normal' }}>
            <Trans
              i18nKey={I18N_KEYS.PAYMENTS.DOWNGRADE_MODAL.PLAN_CHANGE_MESSAGE}
              components={{
                plan: (
                  <Typography variant="body-std-rg" sx={{ textTransform: 'capitalize' }}>
                    {toPackage.name}
                  </Typography>
                ),
              }}
            />
          </Typography>
        </Flex>
        <FlexRow sx={{ justifyContent: 'flex-end', gap: 1 }}>
          <ButtonContained mode="text" onClick={onClose} size="small">
            {t(I18N_KEYS.PAYMENTS.DOWNGRADE_MODAL.CTA_CANCEL)}
          </ButtonContained>
          <ButtonContained
            startIcon={isProcessing ? <CircularProgress size={16} sx={{ color: color.Black92 }} /> : null}
            onClick={() => void onConfirm(toPackage)}
            disabled={isProcessing}
            size="small"
          >
            {isProcessing
              ? t(I18N_KEYS.PAYMENTS.UPGRADE_MODAL.PROCESSING)
              : t(I18N_KEYS.PAYMENTS.DOWNGRADE_MODAL.CTA_CONFIRM)}
          </ButtonContained>
        </FlexRow>
      </FlexCol>
      <IconButton sx={{ position: 'absolute', top: 8, right: 8 }} onClick={onClose} size="small">
        <CloseIcon />
      </IconButton>
    </Dialog>
  );
}

export default ConfirmDowngradeModal;
