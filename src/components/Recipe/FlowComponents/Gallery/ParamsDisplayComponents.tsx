import { Box, Typography, Chip, Tooltip } from '@mui/material';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { Flex, FlexCenVer, FlexCol } from '@/UI/styles';
import CopyBtn from '@/components/Common/ImageList/CopyBtnV2';
import { useIsHovered } from '@/hooks/useIsHovered';
import { EllipsisText } from '@/UI/EllipsisText/EllipsisText';
import { copyImage } from '@/utils/files';
import { ImageIcon } from '@/UI/Icons/ImageIcon';
import type { MediaAsset } from '@/types/api/assets';
import type { ApiObject } from '@rudderstack/analytics-js';

const getFormattedParam = (param: string) => {
  return param
    .split('_') // Split by underscore
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
    .join(' ');
};

const isValidParamValue = (value: unknown): boolean => {
  const typeofValue = typeof value;
  return !(typeofValue === 'object' || value === '' || typeofValue === 'undefined' || typeofValue === 'function');
};

// Style constants
const TYPOGRAPHY_STYLES = {
  italic: { fontStyle: 'italic', fontWeight: '400' },
  copyButton: { position: 'absolute', top: 2, right: 2 },
} as const;

interface CopyButtonProps {
  text: string;
  trackingName: string;
  trackingPayload?: ApiObject;
  size?: 'medium' | 'large';
  onClick?: () => void;
}

const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  trackingName,
  trackingPayload = {},
  size = 'medium',
  onClick,
}) => {
  const { copyToClipboard } = useCopyToClipboard({
    trackingName,
    trackingPayload,
  });

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      void copyToClipboard(text);
    }
  };

  return (
    <CopyBtn
      text={text}
      size={size}
      onClick={handleClick}
      eventTracking={{ name: trackingName, payload: trackingPayload }}
    />
  );
};

const ExpandableText = ({ text, maxChars = 300 }: { text: string; maxChars?: number }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const displayText = useMemo(() => {
    if (text.length <= maxChars || expanded) {
      return text;
    }

    return text.slice(0, maxChars).trim() + '...';
  }, [text, maxChars, expanded]);

  const handleToggle = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setExpanded(!expanded);
  };

  return (
    <FlexCenVer sx={{ gap: 0.25 }}>
      <Typography variant="body-sm-rg" sx={TYPOGRAPHY_STYLES.italic}>
        {displayText}
      </Typography>
      {text.length > maxChars ? (
        <Typography variant="body-sm-rg" sx={TYPOGRAPHY_STYLES.italic}>
          <a
            href="#"
            onClick={handleToggle}
            style={{
              color: 'inherit',
              textDecoration: 'underline',
              ...TYPOGRAPHY_STYLES.italic,
            }}
          >
            {expanded
              ? t(I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.PARAMS.SHOW_LESS)
              : t(I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.PARAMS.SHOW_MORE)}
          </a>
        </Typography>
      ) : null}
    </FlexCenVer>
  );
};

const CustomChip = ({ param, value }: { param: string; value: string }) => {
  const { t } = useTranslation();
  const formattedParam = getFormattedParam(param);
  const { copied, copyToClipboard } = useCopyToClipboard({
    trackingName: 'gallery_params_copied_param',
    trackingPayload: { param },
    timeout: 500,
  });

  return (
    <Tooltip title={t(I18N_KEYS.GENERAL.COPIED)} open={copied} disableHoverListener placement="top">
      <Chip
        size="small"
        sx={{ width: 'fit-content', px: 0.5 }}
        label={
          <Typography variant="body-sm-rg">
            {formattedParam}: <b>{value}</b>
          </Typography>
        }
        onClick={() => void copyToClipboard(value)}
      />
    </Tooltip>
  );
};

const ParamDisplay = ({ param, value }: { param: string; value: string }) => {
  const formattedParam = getFormattedParam(param);
  const { isHovered, ...elementProps } = useIsHovered();

  return (
    <FlexCenVer sx={{ height: '24px', width: '100%', justifyContent: 'space-between', gap: 1 }} {...elementProps}>
      <Typography variant="body-sm-rg">{formattedParam}</Typography>
      <Flex sx={{ height: '24px', minWidth: '86px', gap: 0.5 }}>
        <EllipsisText
          sx={{
            bgcolor: color.White04_T,
            py: 0.5,
            px: 1,
            borderRadius: 1,
            flex: 1,
            height: '100%',
          }}
          variant="body-sm-rg"
        >
          {value}
        </EllipsisText>

        {isHovered && (
          <CopyButton
            text={value}
            trackingName="gallery_params_copied_param"
            trackingPayload={{ param }}
            size="medium"
          />
        )}
      </Flex>
    </FlexCenVer>
  );
};

const PlaceholderImage = () => {
  const { t } = useTranslation();

  return (
    <Tooltip title={t(I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.PARAMS.NO_PREVIEW)} placement="bottom">
      <FlexCenVer
        sx={{
          width: '56px',
          height: '56px',
          borderRadius: 1,
          bgcolor: color.White04_T,
          justifyContent: 'center',
        }}
      >
        <ImageIcon width="24" height="24" color={color.White64_T} />
      </FlexCenVer>
    </Tooltip>
  );
};

const ImageParamDisplay = ({ imageInput }: { imageInput: MediaAsset & { label: string; order: number } }) => {
  const { isHovered, ...elementProps } = useIsHovered();
  const handleCopyImage = () => {
    void copyImage(imageInput);
  };
  return (
    <Box {...elementProps} sx={{ mb: 2 }}>
      <FlexCol sx={{ gap: 0.5 }}>
        <FlexCenVer sx={{ justifyContent: 'space-between', height: '24px', py: 0.5 }}>
          <Typography variant="body-sm-rg">{imageInput.label}</Typography>
          {isHovered && (
            <CopyButton
              text=""
              trackingName="gallery_params_copied_image_prompt"
              size="medium"
              onClick={handleCopyImage}
            />
          )}
        </FlexCenVer>
        <FlexCenVer>
          {imageInput.thumbnailUrl || imageInput.url ? (
            <img
              src={imageInput.thumbnailUrl || imageInput.url}
              width="56px"
              height="56px"
              style={{ borderRadius: '4px' }}
            />
          ) : (
            <PlaceholderImage />
          )}
        </FlexCenVer>
      </FlexCol>
    </Box>
  );
};

const SortedParams = ({
  params,
  RenderComponent,
  header = null,
}: {
  params?: Record<string, unknown>;
  header?: React.ReactNode;
  RenderComponent: ({ param, value }: { param: string; value: string }) => JSX.Element;
}) => {
  if (!params) return null;
  const filteredParams = Object.entries(params).filter(([param, _]) => param !== 'file');
  if (filteredParams.length === 0) return null;
  const mappedParams = filteredParams
    .map(([param, value]) => {
      if (!isValidParamValue(value)) {
        return null;
      }

      return (
        <RenderComponent
          key={param}
          param={param}
          value={typeof value === 'boolean' ? value.toString() : String(value)}
        />
      );
    })
    .filter((param) => !!param);
  if (mappedParams.length === 0) return null;
  return (
    <FlexCol sx={{ gap: 1 }}>
      {header}
      {mappedParams}
    </FlexCol>
  );
};

const CopyIndication = ({ copied, copyToClipboard }: { copied: boolean; copyToClipboard: () => void }) => {
  const { t } = useTranslation();
  return (
    <Tooltip title={t(I18N_KEYS.GENERAL.COPIED)} open={copied} disableHoverListener placement="top">
      <Box id="gallery-params-copy-n-prompt" style={TYPOGRAPHY_STYLES.copyButton}>
        {!copied ? (
          <i className="fa-light fa-copy fade-in-slow" style={{ cursor: 'pointer' }} onClick={copyToClipboard}></i>
        ) : (
          <i className="fa-light fa-check fade-in-slow"></i>
        )}
      </Box>
    </Tooltip>
  );
};

export {
  CopyButton,
  ExpandableText,
  CustomChip,
  ParamDisplay,
  ImageParamDisplay,
  SortedParams,
  CopyIndication,
  getFormattedParam,
};
