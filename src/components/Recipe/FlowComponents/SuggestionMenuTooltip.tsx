import { Typography, Popper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { FlexCenHorVer } from '@/UI/styles';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';

interface SuggestionMenuTooltipProps {
  isOpen?: boolean;
  anchorEl?: HTMLElement;
}

export const SuggestionMenuTooltip = ({ isOpen = false, anchorEl }: SuggestionMenuTooltipProps) => {
  const { t } = useTranslation();
  return (
    <Popper open={isOpen} anchorEl={anchorEl} placement="top-start">
      <FlexCenHorVer
        sx={{
          background: color.Black84,
          px: 1,
          py: 0.5,
          borderRadius: 1,
          border: `1px solid ${color.White04_T}`,
        }}
      >
        <Typography variant="body-sm-rg">{t(I18N_KEYS.RECIPE_MAIN.FLOW.SUGGESTION_MENU.DROP_INDICATION)}</Typography>
      </FlexCenHorVer>
    </Popper>
  );
};
