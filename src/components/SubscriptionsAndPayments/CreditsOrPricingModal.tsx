import { useState } from 'react';
import { Dialog, IconButton, Typography, styled } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';
import { FlexCenVer, FlexCol } from '@/UI/styles';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { ButtonContained } from '@/UI/Buttons/AppButton';

const BlackRectangleButton = styled('button')({
  backgroundColor: 'transparent',
  border: '1px solid rgba(240, 240, 229, 0.2)',
  cursor: 'pointer',
  width: '100%',
  padding: '16px 24px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'flex-start',
  flexDirection: 'column',
  // gap: '8px',
  '&:hover': {
    backgroundColor: 'rgba(240, 240, 229, 0.1)',
  },
});

function getButtonStyles(isSelected: boolean) {
  return {
    position: 'relative',
    backgroundColor: isSelected ? color.Yellow8_T : 'transparent',
    borderColor: isSelected ? color.Yellow64_T : '',
    '&:hover': {
      backgroundColor: isSelected ? color.Yellow16_T : 'inherit',
    },
  };
}

function CheckmarkIcon({ isVisible }: { isVisible: boolean }) {
  return isVisible ? (
    <img
      src="/icons/checkmark_yellow.svg"
      alt="checkmark"
      width={20}
      height={20}
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
      }}
    />
  ) : null;
}

const enum SelectedOptionEnum {
  MoreCredits = 'more_credits',
  UpgradeToPaidPlan = 'upgrade_to_paid_plan',
}

interface CreditsOrPricingModalProps {
  open: boolean;
  onClose: () => void;
  setShowGetMoreCreditsModal: (open: boolean) => void;
  setShowPricingPlansModal: (open: boolean) => void;
}

function CreditsOrPricingModal({
  open,
  onClose,
  setShowGetMoreCreditsModal,
  setShowPricingPlansModal,
}: CreditsOrPricingModalProps) {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const [selectedOption, setSelectedOption] = useState<string>(SelectedOptionEnum.MoreCredits);

  const handleGetMoreCredits = () => {
    track(
      'Credits_or_pricing_modal - Clicked_get_more_credits',
      {
        context: 'Payments',
      },
      TrackTypeEnum.BI,
    );
    setShowGetMoreCreditsModal(true);
    onClose();
  };

  const handleUpgradeToPaidPlan = () => {
    track(
      'Credits_or_pricing_modal - Clicked_upgrade_to_paid_plan',
      {
        context: 'Payments',
      },
      TrackTypeEnum.BI,
    );
    setShowPricingPlansModal(true);
    onClose();
  };

  const handleContinueClick = () => {
    if (selectedOption === SelectedOptionEnum.MoreCredits) {
      handleGetMoreCredits();
    } else if (selectedOption === SelectedOptionEnum.UpgradeToPaidPlan) {
      handleUpgradeToPaidPlan();
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
        <Typography variant="h3" sx={{ mb: 1.5 }}>
          {t(I18N_KEYS.PAYMENTS.CREDITS_OR_PRICING_MODAL.TITLE)}
        </Typography>
        <Typography variant="body-std-rg" sx={{ mb: 4 }}>
          {t(I18N_KEYS.PAYMENTS.CREDITS_OR_PRICING_MODAL.SUBTITLE)}
        </Typography>
        <FlexCol sx={{ gap: 1 }}>
          <BlackRectangleButton
            onClick={() => setSelectedOption(SelectedOptionEnum.MoreCredits)}
            sx={getButtonStyles(selectedOption === SelectedOptionEnum.MoreCredits)}
          >
            <CheckmarkIcon isVisible={selectedOption === SelectedOptionEnum.MoreCredits} />
            <Typography variant="body-std-md" sx={{ mb: 0.5 }}>
              {t(I18N_KEYS.PAYMENTS.CREDITS_OR_PRICING_MODAL.CTA_CREDITS.TITLE)}
            </Typography>
            <Typography variant="body-sm-rg" color={color.White80_T}>
              {t(I18N_KEYS.PAYMENTS.CREDITS_OR_PRICING_MODAL.CTA_CREDITS.SUBTITLE)}
            </Typography>
          </BlackRectangleButton>
          <BlackRectangleButton
            onClick={() => setSelectedOption(SelectedOptionEnum.UpgradeToPaidPlan)}
            sx={getButtonStyles(selectedOption === SelectedOptionEnum.UpgradeToPaidPlan)}
          >
            <CheckmarkIcon isVisible={selectedOption === SelectedOptionEnum.UpgradeToPaidPlan} />
            <Typography variant="body-std-md" sx={{ mb: 0.5 }}>
              {t(I18N_KEYS.PAYMENTS.CREDITS_OR_PRICING_MODAL.CTA_PRICING.TITLE)}
            </Typography>
            <Typography variant="body-sm-rg" color={color.White80_T}>
              {t(I18N_KEYS.PAYMENTS.CREDITS_OR_PRICING_MODAL.CTA_PRICING.SUBTITLE)}
            </Typography>
          </BlackRectangleButton>
        </FlexCol>
        <FlexCenVer sx={{ justifyContent: 'flex-end', gap: 1, mt: 4 }}>
          <ButtonContained size="small" mode="text" onClick={onClose}>
            {t(I18N_KEYS.PAYMENTS.UPGRADE_MODAL.CTA_CANCEL)}
          </ButtonContained>
          <ButtonContained size="small" onClick={handleContinueClick}>
            {t(I18N_KEYS.PAYMENTS.CREDITS_OR_PRICING_MODAL.CTA_CONFIRM)}
          </ButtonContained>
        </FlexCenVer>
      </FlexCol>

      <IconButton sx={{ position: 'absolute', top: 8, right: 8 }} onClick={onClose} size="small">
        <CloseIcon />
      </IconButton>
    </Dialog>
  );
}

export default CreditsOrPricingModal;
