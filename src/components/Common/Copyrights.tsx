import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';

export const Copyrights = ({ textColor = color.Black40_T }: { textColor?: string }) => {
  const { t } = useTranslation();
  return (
    <Typography variant="body-xs-rg" color={textColor}>
      {t(I18N_KEYS.COMMON_COMPONENTS.COPYRIGHT)}
    </Typography>
  );
};
