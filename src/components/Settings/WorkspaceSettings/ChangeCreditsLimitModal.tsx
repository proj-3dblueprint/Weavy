import { useCallback, useMemo, useState } from 'react';
import { Dialog, Typography, styled, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';
import { FlexCenVer, FlexCol } from '@/UI/styles';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { AppXBtn } from '@/UI/AppXBtn/AppXBtn';
import { CreditsInput } from '@/UI/Input/CreditsInputs';
import { AsteriskIcon } from '@/UI/Icons/AsteriskIcon';
import { ActiveWorkspace } from '@/types/auth.types';

const DEFAULT_ALLOCATION_CREDITS = 1000;
const CREDITS_TO_IMAGE_RATIO = 2.5;
const CREDITS_TO_SECONDS_VIDEOS_RATIO = 0.1666666;

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
    backgroundColor: 'rgba(42, 56, 140, 0.1)',
  },
});

function getButtonStyles(isSelected: boolean) {
  return {
    position: 'relative',
    backgroundColor: isSelected ? color.Yellow8_T : 'transparent',
    borderColor: isSelected ? color.Yellow64_T : '',
    '&:hover': {
      backgroundColor: isSelected ? color.Yellow16_T : color.White04_T,
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

export enum SelectedOptionEnum {
  Unlimited = 'unlimited',
  Limit = 'limit',
}

interface ChangeCreditsLimitModalProps {
  open: boolean;
  onClose: () => void;
  activeWorkspace: ActiveWorkspace;
  title: string;
  subtitle: string;
  onConfirm: (selectedOption: SelectedOptionEnum, limit: number | null, userIds?: string[] | null) => Promise<void>;
  showCaption?: boolean;
  userIds?: string[];
}

function ChangeCreditsLimitModal({
  open,
  onClose,
  activeWorkspace,
  title,
  subtitle,
  onConfirm,
  showCaption = true,
  userIds,
}: ChangeCreditsLimitModalProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SelectedOptionEnum>(() => {
    // If no preferences exist or defaultMonthlyAllocatedCredits is null then unlimited
    if (!activeWorkspace?.preferences?.defaultMonthlyAllocatedCredits) {
      return SelectedOptionEnum.Unlimited;
    }
    return SelectedOptionEnum.Limit;
  });
  const [defaultMonthlyAllocatedCredits, setDefaultMonthlyAllocatedCredits] = useState<number | null>(
    activeWorkspace?.preferences?.defaultMonthlyAllocatedCredits || DEFAULT_ALLOCATION_CREDITS,
  );

  const estimatedImages = useMemo(
    () => (defaultMonthlyAllocatedCredits || 0) * CREDITS_TO_IMAGE_RATIO,
    [defaultMonthlyAllocatedCredits],
  );
  const estimatedVideos = useMemo(
    () => (defaultMonthlyAllocatedCredits || 0) * CREDITS_TO_SECONDS_VIDEOS_RATIO,
    [defaultMonthlyAllocatedCredits],
  );

  const handleCreditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      setDefaultMonthlyAllocatedCredits(0);
      return;
    }

    // Strip all non-digit characters (e.g., thousands separators) before converting
    const digitsOnly = rawValue.replace(/[^0-9]/g, '');
    const parsed = digitsOnly ? Number(digitsOnly) : 0;

    // Optional: clamp to a reasonable range to avoid overflow
    const clamped = Math.max(0, Math.min(parsed, 1_000_000));
    setDefaultMonthlyAllocatedCredits(clamped);
  };

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    await onConfirm(selectedOption, defaultMonthlyAllocatedCredits || 0, userIds || null);
    setIsLoading(false);
    onClose();
  }, [selectedOption, defaultMonthlyAllocatedCredits, userIds, onConfirm, onClose]);

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
          {title}
        </Typography>
        <Typography variant="body-std-rg" sx={{ mb: 4 }}>
          {subtitle}
        </Typography>
        <FlexCol sx={{ gap: 1 }}>
          <BlackRectangleButton
            onClick={() => setSelectedOption(SelectedOptionEnum.Unlimited)}
            sx={getButtonStyles(selectedOption === SelectedOptionEnum.Unlimited)}
          >
            <CheckmarkIcon isVisible={selectedOption === SelectedOptionEnum.Unlimited} />
            <Typography variant="body-std-md" sx={{ mb: showCaption ? 0.5 : 0 }}>
              {t(
                I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS_ALLOCATION.CHANGE_DEFAULT_ALLOCATION_MODAL
                  .BUTTON_UNLIMITED_TITLE,
              )}
            </Typography>
            {showCaption && (
              <Typography variant="body-sm-rg" color={color.White80_T}>
                {t(
                  I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS_ALLOCATION.CHANGE_DEFAULT_ALLOCATION_MODAL
                    .BUTTON_UNLIMITED_SUBTITLE,
                )}
              </Typography>
            )}
          </BlackRectangleButton>
          <BlackRectangleButton
            onClick={() => setSelectedOption(SelectedOptionEnum.Limit)}
            sx={getButtonStyles(selectedOption === SelectedOptionEnum.Limit)}
          >
            <CheckmarkIcon isVisible={selectedOption === SelectedOptionEnum.Limit} />
            <Typography variant="body-std-md" sx={{ mb: showCaption ? 0.5 : 0 }}>
              {t(
                I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS_ALLOCATION.CHANGE_DEFAULT_ALLOCATION_MODAL
                  .BUTTON_LIMIT_TITLE,
              )}
            </Typography>
            {showCaption && (
              <Typography variant="body-sm-rg" color={color.White80_T}>
                {t(
                  I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS_ALLOCATION.CHANGE_DEFAULT_ALLOCATION_MODAL
                    .BUTTON_LIMIT_SUBTITLE,
                )}
              </Typography>
            )}
            <FlexCol sx={{ gap: 1, alignItems: 'flex-start', mt: 2 }}>
              <CreditsInput
                value={defaultMonthlyAllocatedCredits?.toLocaleString() || DEFAULT_ALLOCATION_CREDITS.toLocaleString()}
                disabled={isLoading || selectedOption === SelectedOptionEnum.Unlimited}
                sx={{
                  width: '100%',
                }}
                onChange={handleCreditInputChange}
                startAdornment={<AsteriskIcon width={24} height={24} />}
                error={false}
                autoFocus={true}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  autoComplete: 'off',
                  min: 0,
                  max: 1000000,
                  style: {
                    cursor: selectedOption === SelectedOptionEnum.Unlimited ? 'pointer' : 'default',
                  },
                }}
              />
              <Typography variant="body-sm-rg" color={color.White80_T}>
                {t(
                  I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS_ALLOCATION.CHANGE_DEFAULT_ALLOCATION_MODAL
                    .CREDITS_ESTIMATION_TEXT,
                  {
                    estimatedImages: Math.round(estimatedImages).toLocaleString(),
                    estimatedVideos: Math.round(estimatedVideos).toLocaleString(),
                  },
                )}
              </Typography>
            </FlexCol>
          </BlackRectangleButton>
        </FlexCol>
        <FlexCenVer sx={{ justifyContent: 'flex-end', gap: 1, mt: 4 }}>
          <ButtonContained size="small" mode="text" onClick={onClose}>
            {t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS_ALLOCATION.CHANGE_DEFAULT_ALLOCATION_MODAL.CTA_CANCEL)}
          </ButtonContained>
          <ButtonContained
            size="small"
            onClick={() => void handleConfirm()}
            disabled={isLoading}
            endIcon={isLoading ? <CircularProgress size={12} sx={{ color: color.White64_T }} /> : null}
          >
            {t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.CREDITS_ALLOCATION.CHANGE_DEFAULT_ALLOCATION_MODAL.CTA_CONFIRM)}
          </ButtonContained>
        </FlexCenVer>
      </FlexCol>

      <AppXBtn sx={{ position: 'absolute', top: 12, right: 12 }} onClick={onClose} />
    </Dialog>
  );
}

export default ChangeCreditsLimitModal;
