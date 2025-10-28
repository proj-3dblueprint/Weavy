import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { WarningCircleIcon } from '@/UI/Icons';
import { FlexCenHorVer } from '@/UI/styles';

const formatErrorMessage = (errorMessage: string | object) => {
  if (typeof errorMessage === 'string') {
    try {
      const firstColonIndex = errorMessage.indexOf(':');
      if (firstColonIndex === -1) {
        return errorMessage;
      }
      const title = errorMessage.slice(0, firstColonIndex);
      const message = errorMessage.slice(firstColonIndex + 1);
      const json = JSON.parse(message.trim()) as Record<string, unknown>;
      return `${title}:\n${JSON.stringify(json, null, 2)}`;
    } catch (_) {
      return errorMessage;
    }
  }
  return JSON.stringify(errorMessage);
};

export const ErrorMessage = ({ errorMessage }: { errorMessage?: string }) => {
  const { t } = useTranslation();
  if (!errorMessage) return null;
  return (
    <FlexCenHorVer data-testid="error-message-container" sx={{ gap: 1, pr: 1, maxWidth: '100%' }}>
      <WarningCircleIcon color={color.Weavy_Error} style={{ flexShrink: 0 }} />
      <Typography
        variant="body-sm-rg"
        color={color.Weavy_Error}
        sx={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          display: '-webkit-box',
          WebkitLineClamp: 10,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineClamp: 10,
        }}
      >
        {errorMessage ? formatErrorMessage(errorMessage) : t(I18N_KEYS.GENERAL.UNKNOWN_ERROR)}
      </Typography>
    </FlexCenHorVer>
  );
};
