import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { FlexCenHor, FlexCenVer } from '@/UI/styles';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { CaretIcon } from '@/UI/Icons/CaretIcon';

function ShowMoreChip({
  isExpanded,
  showChip = true,
  setIsExpanded,
}: {
  isExpanded: boolean;
  showChip?: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <FlexCenHor
      sx={{
        position: 'absolute',
        bottom: 16,
        right: 0,
        width: '100%',
        opacity: showChip ? 1 : 0,
        pointerEvents: showChip ? 'auto' : 'none',
        transition: 'opacity 0.1s ease-in-out',
      }}
    >
      <FlexCenVer
        sx={{
          cursor: 'pointer',
          backgroundColor: color.Black84_T,
          '&:hover': { backgroundColor: color.Black92_T },
          px: 1,
          py: 0.25,
          borderRadius: 1,
          gap: 0.5,
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Typography variant="body-sm-md" sx={{ color: color.White100 }}>
          {isExpanded
            ? t(I18N_KEYS.RECIPE_MAIN.NODES.SHARED.SHOW_MORE_CHIP.SHOW_LESS)
            : t(I18N_KEYS.RECIPE_MAIN.NODES.SHARED.SHOW_MORE_CHIP.SHOW_MORE)}
        </Typography>
        <Box sx={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg) translateY(2px)' }}>
          <CaretIcon />
        </Box>
      </FlexCenVer>
    </FlexCenHor>
  );
}

export default ShowMoreChip;
