import { Skeleton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import { FlexCenVer } from '@/UI/styles';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { AsteriskIcon } from '@/UI/Icons';
import { roundToDecimalIfNotWhole } from '@/utils/numbers';
import { useContentRect } from '@/hooks/useContentRect';

const DEFAULT_WIDTH = 55;

export const PriceInfo = ({
  cost,
  isLoading,
  longTitle = false,
}: {
  cost?: number;
  isLoading: boolean;
  longTitle?: boolean;
}) => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  const dimensions = useContentRect(ref);
  const widthRef = useRef(dimensions?.width || DEFAULT_WIDTH);
  useEffect(() => {
    widthRef.current = dimensions?.width || DEFAULT_WIDTH;
  }, [dimensions]);

  if (typeof cost === 'number' && cost < 0) {
    return null;
  }
  return (
    <FlexCenVer sx={{ gap: 1, justifyContent: 'space-between', width: '100%' }}>
      <Typography variant="label-xs-rg" sx={{ color: color.White64_T }}>
        {t(I18N_KEYS.COMMON_COMPONENTS.PRICE_INFO.TITLE, { context: longTitle ? 'long' : 'short' })}
      </Typography>
      <FlexCenVer sx={{ gap: 0.25, flexShrink: 0, color: color.White100, height: '16px' }}>
        <AsteriskIcon width={16} height={16} />
        <Typography variant="body-sm-rg" ref={ref}>
          {isLoading ? (
            <Skeleton variant="rectangular" sx={{ borderRadius: '2px' }} width={widthRef.current} height={12} />
          ) : (
            t(I18N_KEYS.COMMON_COMPONENTS.PRICE_INFO.CREDITS, {
              count: Number(roundToDecimalIfNotWhole(cost || 0)),
            })
          )}
        </Typography>
      </FlexCenVer>
    </FlexCenVer>
  );
};
