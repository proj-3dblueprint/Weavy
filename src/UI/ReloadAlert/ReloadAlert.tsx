import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useGlobalStore } from '@/state/global.state';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenHorVer } from '../styles';
import { ButtonContained } from '../Buttons/AppButton';
import { InfoIcon } from '../Icons';

export const ReloadAlert = () => {
  const isShowRefreshAlert = useGlobalStore((state) => state.isShowRefreshAlert);
  const { t } = useTranslation();
  if (!isShowRefreshAlert) {
    return null;
  }

  const handleRefresh = () => window.location.reload();

  return (
    <FlexCenHorVer
      sx={{
        position: 'fixed',
        inset: 0,
        backgroundColor: color.Black84_T,
        zIndex: 9999,
      }}
    >
      <FlexCenHorVer
        sx={{
          height: 40,
          backgroundColor: color.Yellow64,
          borderRadius: 1,
          pl: 1.5,
          py: 1.75,
          pr: 1,
        }}
      >
        <InfoIcon style={{ width: 20, height: 20, marginRight: '8px' }} color={color.Black100} />
        <Typography variant="body-sm-rg" color={color.Black100} mr={2}>
          {t(I18N_KEYS.GENERAL.RELOAD_ALERT_TITLE)}
        </Typography>
        <ButtonContained mode="text" onClick={handleRefresh} sx={{ fontSize: '0.75rem', color: color.Black100 }}>
          {t(I18N_KEYS.GENERAL.RELOAD_ALERT_CTA)}
        </ButtonContained>
      </FlexCenHorVer>
    </FlexCenHorVer>
  );
};
