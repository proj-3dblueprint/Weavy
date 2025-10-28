import { Divider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import xss from 'xss';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { AsteriskIcon } from '@/UI/Icons/AsteriskIcon';
import { FlexCenVer, FlexCol } from '@/UI/styles';

interface ModelDetailsProps {
  description: string;
  modelName: string;
  price?: number;
}

export const ModelDetails = ({ description, modelName, price }: ModelDetailsProps) => {
  const { t } = useTranslation();
  return (
    <FlexCol sx={{ gap: 1 }}>
      <FlexCol sx={{ gap: 1, p: 1 }}>
        <Typography variant="body-std-md">{modelName}</Typography>
        <Typography
          variant="body-sm-rg"
          dangerouslySetInnerHTML={{ __html: xss(description) }}
          sx={{ color: color.White80_T }}
        />
        {price ? (
          <FlexCenVer sx={{ gap: 0.5 }}>
            <AsteriskIcon width={16} height={16} style={{ color: color.White80_T }} />
            <Typography variant="body-sm-rg" sx={{ color: color.White80_T }}>
              {price} {t(I18N_KEYS.GENERAL.CREDITS)}
            </Typography>
          </FlexCenVer>
        ) : null}
      </FlexCol>
      <Divider sx={{ borderColor: color.White08_T, mb: 1 }} />
    </FlexCol>
  );
};
