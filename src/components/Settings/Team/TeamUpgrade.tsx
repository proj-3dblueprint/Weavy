import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { I18N_KEYS } from '@/language/keys';
import { FlexCol } from '@/UI/styles';
import { CreditsContext } from '@/services/CreditsContext';
import { ButtonContained } from '@/UI/Buttons/AppButton';

export const TeamUpgrade = () => {
  const { t } = useTranslation();
  const { openUpgradeModal } = useContext(CreditsContext);

  return (
    // pt here to align with the settings page top text
    <FlexCol sx={{ maxWidth: '600px', px: 2, gap: 3, pt: '3px' }}>
      <Typography variant="body-lg-sb">{t(I18N_KEYS.SETTINGS.TEAM.UPGRADE.TITLE)}</Typography>
      <Typography variant="body-sm-rg">{t(I18N_KEYS.SETTINGS.TEAM.UPGRADE.TEXT)}</Typography>
      <ButtonContained onClick={openUpgradeModal}>{t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.UPGRADE)}</ButtonContained>
    </FlexCol>
  );
};
