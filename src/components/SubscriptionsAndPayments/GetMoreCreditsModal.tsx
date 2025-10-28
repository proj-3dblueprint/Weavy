import { useEffect, useState } from 'react';
import { Dialog, IconButton, Typography, Divider, CircularProgress, Link } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Trans, useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { CreditsInput } from '@/UI/Input/CreditsInputs';
import { User } from '@/types/auth.types';
import { I18N_KEYS } from '@/language/keys';
import { Flex, FlexCol, FlexRow } from '@/UI/styles';
import { GetMoreCreditsRequest } from '@/components/SubscriptionsAndPayments/payments.types';
import { AsteriskIcon } from '@/UI/Icons/AsteriskIcon';
import { ButtonContained } from '@/UI/Buttons/AppButton';

const creditsToImagesRatio = 2.5;

const creditsToSecondsVideosRatio = 0.1666666;

const minPrice = 10;
const maxPrice = 10000;
const defaultPrice = 10;

interface GetMoreCreditsModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (creditsRequest: GetMoreCreditsRequest) => Promise<void>;
  isProcessing: boolean;
  hasError: boolean;
  setHasError: (hasError: boolean) => void;
  currentUser: User;
}

function GetMoreCreditsModal({
  open,
  onClose,
  onConfirm,
  isProcessing,
  hasError,
  setHasError,
  currentUser,
}: GetMoreCreditsModalProps) {
  const { t } = useTranslation();

  const creditsPerDollar = currentUser?.activeWorkspace?.subscription?.creditsPerDollar || 100;

  const [price, setPrice] = useState(defaultPrice);
  const [credits, setCredits] = useState(defaultPrice * creditsPerDollar);
  const [minPriceError, setMinPriceError] = useState(false);
  const [estimatedImages, setEstimatedImages] = useState(defaultPrice * creditsPerDollar * creditsToImagesRatio);
  const [estimatedVideos, setEstimatedVideos] = useState(defaultPrice * creditsPerDollar * creditsToSecondsVideosRatio);

  useEffect(() => {
    //reset error state when modal is opened
    if (hasError) {
      setHasError(false);
    }
  }, []);

  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('payment', 'credits');
  currentUrl.searchParams.set('amount', credits.toString());
  const callbackUrl = currentUrl.toString();

  const openIntercom = () => {
    if (window.Intercom) {
      window.Intercom('show');
    }
  };

  const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMinPriceError(false);
    const value = event.target.value.replace(/,/g, '');
    if (value === '') {
      setPrice(0);
      setCredits(0);
      setEstimatedImages(0);
      setEstimatedVideos(0);
      setMinPriceError(true);
      return;
    }
    let numericValue = parseInt(value, 10);
    if (!isNaN(numericValue)) {
      if (numericValue > maxPrice) {
        numericValue = maxPrice;
      }
      if (numericValue < minPrice) {
        setMinPriceError(true);
      }
      setPrice(numericValue);
      setCredits(numericValue * creditsPerDollar);
      setEstimatedImages(numericValue * creditsPerDollar * creditsToImagesRatio);
      setEstimatedVideos(numericValue * creditsPerDollar * creditsToSecondsVideosRatio);
    }
  };

  const enforcePriceLimits = () => {
    setMinPriceError(false);
    let adjustedPrice = price;
    if (price < minPrice) {
      adjustedPrice = minPrice;
    } else if (price > maxPrice) {
      adjustedPrice = maxPrice;
    }
    setPrice(adjustedPrice);
    setCredits(adjustedPrice * creditsPerDollar);
    setEstimatedImages(adjustedPrice * creditsPerDollar * creditsToImagesRatio);
    setEstimatedVideos(adjustedPrice * creditsPerDollar * creditsToSecondsVideosRatio);
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
          {t(I18N_KEYS.PAYMENTS.GET_MORE_CREDITS_MODAL.TITLE)}
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
        <Flex sx={{ alignItems: 'flex-end', mb: 1 }}>
          <CreditsInput
            value={price.toLocaleString()}
            autoFocus
            onBlur={enforcePriceLimits}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                enforcePriceLimits();
              }
            }}
            sx={{ mb: 1, width: '260px' }}
            onChange={handlePriceChange}
            startAdornment={<span>$&nbsp;</span>}
            error={minPriceError}
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
              autoComplete: 'off',
              min: minPrice,
              max: maxPrice,
            }}
          />

          <FlexCol sx={{ ml: 2, pb: 1 }}>
            <Typography variant="label-sm-rg" color={color.White80_T}>
              {t(I18N_KEYS.PAYMENTS.GET_MORE_CREDITS_MODAL.EQUALS)}
            </Typography>
            <Typography
              variant="body-lg-md"
              sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 0.5,
              }}
            >
              <AsteriskIcon style={{ marginRight: '4px' }} />
              {(Math.round(credits * 100) / 100).toLocaleString()}
            </Typography>
          </FlexCol>
        </Flex>
        {!minPriceError ? (
          <Typography variant="body-sm-rg" color={color.White80_T} sx={{ mb: 3 }}>
            ~ {Math.round(estimatedImages).toLocaleString()} images or {Math.round(estimatedVideos).toLocaleString()}{' '}
            seconds of video
          </Typography>
        ) : (
          <Typography variant="body-sm-rg" color={color.Weavy_Error} sx={{ mb: 3 }}>
            {t(I18N_KEYS.PAYMENTS.GET_MORE_CREDITS_MODAL.MIN_PRICE_ERROR, { minPrice: minPrice })}
          </Typography>
        )}
        <Divider sx={{ mb: 3 }} />
        <FlexRow sx={{ justifyContent: 'flex-end', gap: 1 }}>
          <ButtonContained size="small" mode="text" onClick={onClose} disabled={isProcessing}>
            {t(I18N_KEYS.PAYMENTS.UPGRADE_MODAL.CTA_CANCEL)}
          </ButtonContained>
          <ButtonContained
            startIcon={isProcessing ? <CircularProgress size={16} sx={{ color: color.Black92 }} /> : null}
            onClick={() =>
              void onConfirm({
                credits: credits,
                payAmountInUsd: price,
                callbackUrl: callbackUrl,
              })
            }
            disabled={isProcessing || minPriceError}
            size="small"
          >
            {isProcessing
              ? t(I18N_KEYS.PAYMENTS.UPGRADE_MODAL.PROCESSING)
              : t(I18N_KEYS.PAYMENTS.UPGRADE_MODAL.CTA_CONFIRM)}
          </ButtonContained>
        </FlexRow>
      </FlexCol>
      <IconButton sx={{ position: 'absolute', top: 8, right: 8 }} onClick={onClose} size="small">
        <CloseIcon />
      </IconButton>
    </Dialog>
  );
}

export default GetMoreCreditsModal;
