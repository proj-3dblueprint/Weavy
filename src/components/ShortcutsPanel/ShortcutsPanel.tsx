import { useTranslation } from 'react-i18next';
import { Divider, Typography } from '@mui/material';
import { ShortcutKey, SHORTCUTS } from '@/consts/shortcuts';
import { I18N_KEYS } from '@/language/keys';
import { useGlobalStore } from '@/state/global.state';
import { AppPaper, FlexCenVer, FlexCenVerSpaceBetween, FlexCol } from '@/UI/styles';
import { AppXBtn } from '@/UI/AppXBtn/AppXBtn';
import { getDescription } from '@/utils/shortcuts';
import { CREDITS_INFO_WIDTH } from '../Recipe/consts/ui';

export const ShortcutsPanel = () => {
  const { t } = useTranslation();
  const isShortcutsPanelOpen = useGlobalStore((s) => s.isShortcutsPanelOpen);
  const setIsShortcutsPanelOpen = useGlobalStore((s) => s.setIsShortcutsPanelOpen);

  const handleClose = () => setIsShortcutsPanelOpen(false);

  if (!isShortcutsPanelOpen) return null;

  return (
    <AppPaper p={1} pt={1.5} width={CREDITS_INFO_WIDTH} position="relative">
      <FlexCenVer sx={{ justifyContent: 'space-between' }}>
        <Typography variant="label-sm-rg">{t(I18N_KEYS.SHORTCUTS.PANEL_TITLE)}</Typography>
        <AppXBtn onClick={handleClose} size={16} />
      </FlexCenVer>
      <Divider sx={{ mt: 1, mb: 1.5 }} />
      <FlexCol sx={{ gap: 0.75, mt: 1 }}>
        {Object.entries(SHORTCUTS)
          .sort((a, b) => a[1].ORDER - b[1].ORDER)
          .map(([key]) => (
            <FlexCenVerSpaceBetween key={key}>
              <Typography variant="label-sm-rg">{t(I18N_KEYS.SHORTCUTS[key])}</Typography>
              <Typography variant="body-sm-rg">{getDescription(key as ShortcutKey)}</Typography>
            </FlexCenVerSpaceBetween>
          ))}
      </FlexCol>
    </AppPaper>
  );
};
