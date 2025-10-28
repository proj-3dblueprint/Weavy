import { useState, useEffect } from 'react';
import { CircularProgress, Dialog, Divider, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import { FlexCol, FlexRow } from '@/UI/styles';
import { color } from '@/colors';
import Counter from '@/UI/Counter/Counter';
import { BillingCycle } from '@/types/shared';
import { ButtonContained } from '@/UI/Buttons/AppButton';

const DEFAULT_TEAM_SIZE = 5;
const MIN_TEAM_SIZE = 1;

interface TeamSizeModalProps {
  open: boolean;
  onClose: () => void;
  packagePrice: number;
  billingCycle: BillingCycle;
  isProcessing: boolean;
  getStripeCheckoutUrl: (numberOfSeats: number) => Promise<string | null>;
}

function TeamSizeModal({
  open,
  onClose,
  packagePrice,
  isProcessing,
  billingCycle,
  getStripeCheckoutUrl,
}: TeamSizeModalProps) {
  const { t } = useTranslation();

  const [teamSize, setTeamSize] = useState(DEFAULT_TEAM_SIZE);
  const [totalPrice, setTotalPrice] = useState(packagePrice * teamSize);

  useEffect(() => {
    setTotalPrice(packagePrice * teamSize);
  }, [teamSize, packagePrice]);

  const handlePayNowButtonClick = async () => {
    const checkoutSessionUrl = await getStripeCheckoutUrl(teamSize);
    if (checkoutSessionUrl) {
      window.location.href = checkoutSessionUrl;
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
        <Typography variant="body-lg-sb" sx={{ mb: 1.5 }}>
          {t(I18N_KEYS.PAYMENTS.TEAM_SIZE_MODAL.TITLE)}
        </Typography>
        <Typography variant="body-std-rg" sx={{ mb: 4 }}>
          {t(I18N_KEYS.PAYMENTS.TEAM_SIZE_MODAL.SUBTITLE, {
            pricePerSeat: billingCycle === BillingCycle.Yearly ? packagePrice * 12 : packagePrice,
            billingCycle: billingCycle === BillingCycle.Yearly ? t(I18N_KEYS.GENERAL.YEAR) : t(I18N_KEYS.GENERAL.MONTH),
          })}
        </Typography>
        <Counter count={teamSize} onChange={setTeamSize} min={MIN_TEAM_SIZE} size="large" />
        <Divider sx={{ my: 2 }} />
        <FlexRow sx={{ justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="body-std-md" color={color.White100}>
            Total
          </Typography>
          {billingCycle === BillingCycle.Yearly ? (
            <Typography variant="body-std-md" color={color.White100}>
              ${(packagePrice * 12).toLocaleString()} x {teamSize} = ${(totalPrice * 12).toLocaleString()} /{' '}
              {t(I18N_KEYS.GENERAL.YEAR)}
            </Typography>
          ) : (
            <Typography variant="body-std-md" color={color.White100}>
              ${packagePrice.toLocaleString()} x {teamSize} = ${totalPrice.toLocaleString()} /{' '}
              {t(I18N_KEYS.GENERAL.MONTH)}
            </Typography>
          )}
        </FlexRow>
        <FlexRow sx={{ justifyContent: 'flex-end', gap: 1 }}>
          <ButtonContained size="small" mode="text" onClick={onClose} disabled={isProcessing}>
            {t(I18N_KEYS.PAYMENTS.UPGRADE_MODAL.CTA_CANCEL)}
          </ButtonContained>
          <ButtonContained
            size="small"
            startIcon={isProcessing ? <CircularProgress size={16} sx={{ color: color.Black92 }} /> : null}
            onClick={() => void handlePayNowButtonClick()}
            disabled={isProcessing}
          >
            {isProcessing
              ? t(I18N_KEYS.PAYMENTS.UPGRADE_MODAL.PROCESSING)
              : t(I18N_KEYS.PAYMENTS.TEAM_SIZE_MODAL.CTA_CONFIRM)}
          </ButtonContained>
        </FlexRow>
      </FlexCol>
      <IconButton sx={{ position: 'absolute', top: 8, right: 8 }} onClick={onClose} size="small">
        <CloseIcon />
      </IconButton>
    </Dialog>
  );
}

export default TeamSizeModal;
