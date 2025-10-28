import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import CancelIcon from '@mui/icons-material/Cancel';
import { CircularProgress } from '@mui/material';
import { ButtonContained } from '@/UI/Buttons/AppButton';

const CancellableLoadingButton = ({
  onClick,
  onCancel,
  isProcessing,
  title,
  subtitle,
  data,
  canCancel,
  disabled,
  shouldShowEndIcon,
}) => {
  const renderButton = () => {
    let endIcon;
    let localDisabled = disabled;
    if (isProcessing) {
      endIcon = <CircularProgress size="16px" sx={{ color: 'rgba(255, 255, 255, 0.3)' }} />;
      localDisabled = !canCancel;
    } else {
      endIcon = data.result && data.result.length > 0 ? <ReplayIcon /> : <PlayArrowIcon />;
    }

    //todo: replace loading button with regular one
    return (
      <ButtonContained
        onClick={() => (isProcessing ? onCancel() : onClick())}
        endIcon={shouldShowEndIcon && endIcon}
        startIcon={isProcessing && canCancel ? <CancelIcon sx={{ fontSize: '14px !important' }} /> : null}
        fullWidth
        disabled={localDisabled}
      >
        {title}
        {subtitle}
      </ButtonContained>
    );
  };

  return renderButton();
};

export default CancellableLoadingButton;
