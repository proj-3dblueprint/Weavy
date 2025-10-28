import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import xss from 'xss';
import { color } from '@/colors';
import { FlexCenVer, FlexCol } from '@/UI/styles';
import { I18N_KEYS } from '@/language/keys';
import { Tag } from '@/UI/Tag/Tag';
import { AsteriskIcon } from '@/UI/Icons/AsteriskIcon';
import { ModelItem } from '@/state/nodes/nodes.types';
import { getHandleColor } from '@/components/Nodes/DynamicNode/HandlesUtils';

export const NodeDetails = ({ item }: { item: ModelItem }) => {
  const { t } = useTranslation();

  if (!item) {
    return null;
  }

  return (
    <FlexCol sx={{ width: 240, p: 1 }}>
      <Typography
        variant="body-sm-rg"
        dangerouslySetInnerHTML={{ __html: xss(item.description || item.displayName) }}
        className="wea-disable-link-decoration"
      />
      {item.inputTypes?.length && item.outputTypes?.length ? (
        <FlexCenVer sx={{ gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
          <>
            <Typography variant="body-xs-rg">{t(I18N_KEYS.GENERAL.FROM)}</Typography>
            {item.inputTypes?.map((input) => (
              <Tag key={input} text={input} bgColor={getHandleColor(input)} textColor={color.Black92} />
            ))}
          </>
          <>
            <Typography variant="body-xs-rg">{t(I18N_KEYS.GENERAL.TO)}</Typography>
            {item.outputTypes?.map((output) => (
              <Tag key={output} text={output} bgColor={getHandleColor(output)} textColor={color.Black92} />
            ))}
          </>
        </FlexCenVer>
      ) : null}
      {item.commercialUse && (
        <Tag
          sx={{ mt: 1 }}
          text={t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.FILTERS.LEGAL.COMMERCIALLY_SAFE)}
          bgColor={color.White80_T}
          textColor={color.Black92}
        />
      )}
      {item.price ? (
        <FlexCenVer sx={{ gap: 0.5, mt: 1 }}>
          <AsteriskIcon />
          <Typography variant="body-xs-rg">
            {t(I18N_KEYS.GENERAL.CREDITS_DISPLAY, {
              credits: item.price,
            })}
          </Typography>
        </FlexCenVer>
      ) : null}
    </FlexCol>
  );
};
