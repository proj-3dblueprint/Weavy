import { Box, SxProps, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { UploadIcon } from '@/UI/Icons';
import { FlexColCenHorVer } from '@/UI/styles';

export const UploadAnotherOverlay = ({
  show = false,
  clickToReplace,
  sx,
}: {
  show?: boolean;
  clickToReplace?: (event: React.MouseEvent<HTMLDivElement>) => void;
  bottomMargin?: number;
  sx?: SxProps;
}) => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        backgroundColor: color.Black64_T,
        left: 0,
        position: 'absolute',
        top: 0,
        width: '100%',
        zIndex: 1000,
        opacity: show ? 1 : 0,
        transition: 'all 0.1s ease',
        ...sx,
      }}
      onClick={clickToReplace}
    >
      <FlexColCenHorVer
        sx={{
          cursor: 'pointer',
          height: '100%',
          gap: 1.25,
        }}
      >
        <UploadIcon />
        <Typography variant="body-sm-rg" color={color.White100}>
          {t(
            clickToReplace
              ? I18N_KEYS.COMMON_COMPONENTS.FILE_UPLOADER.REPLACE_FILE
              : I18N_KEYS.COMMON_COMPONENTS.FILE_UPLOADER.ADD_FILE,
          )}
        </Typography>
      </FlexColCenHorVer>
    </Box>
  );
};
