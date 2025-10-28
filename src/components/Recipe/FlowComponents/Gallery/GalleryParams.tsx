import { Box, Typography, Popover } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { FlexCenVer, FlexCol } from '@/UI/styles';
import { useIsHovered } from '@/hooks/useIsHovered';
import {
  CopyButton,
  CopyIndication,
  CustomChip,
  ExpandableText,
  getFormattedParam,
  ImageParamDisplay,
  ParamDisplay,
  SortedParams,
} from './ParamsDisplayComponents';
import type { MediaAsset } from '@/types/api/assets';

// Utility functions
const extractValue = (value: string | { value: string } | undefined): string | undefined => {
  return typeof value === 'object' && value !== null && 'value' in value ? value.value : value;
};

const extractSeed = (seed: string | { seed: string } | undefined): string | undefined => {
  return typeof seed === 'object' && seed !== null && 'seed' in seed ? seed.seed : seed;
};

const getImageInputsFromInputInfo = (
  inputsInfo: Record<string, unknown>,
  imageInputsParams: [string, MediaAsset][],
): Array<MediaAsset & { label: string; order: number }> => {
  const inputsData = inputsInfo;
  return imageInputsParams.map((input, index) => {
    const [key, value] = input;
    const inputDataEntry = Object.entries(inputsData).find(([k]) => k === key);
    let inputData: { label: string; order: number } | undefined;
    if (inputDataEntry) {
      inputData = inputDataEntry[1] as { label: string; order: number };
      if (!inputData.label) {
        // fallback to key if label is not available in the node data
        inputData.label = key;
      }
    } else {
      inputData = {
        label: key,
        order: index,
      };
    }
    return {
      ...value,
      key,
      label: getFormattedParam(inputData.label),
      order: inputData.order,
    };
  });
};

interface ProcessedInputs {
  sortedParams: Record<string, unknown>;
  prompt: string | { value: string } | undefined;
  negativePrompt: string | { value: string } | undefined;
  imageInputs: Array<MediaAsset & { label: string; order: number }> | undefined;
}

const processInputs = (inputs: Record<string, unknown>, inputsInfo: Record<string, unknown>): ProcessedInputs => {
  const negative = Object.entries(inputs).find(([key]) => key.includes('prompt') && key.includes('negative'))?.[1];

  // first look for an exact match
  const inputPrompt =
    Object.entries(inputs).find(([key]) => key === 'prompt') ||
    Object.entries(inputs).find(([key]) => key.includes('prompt') && !key.includes('negative'));

  const imageInputsParams = Object.entries(inputs).filter((entry): entry is [string, MediaAsset] => {
    const [_, value] = entry;
    return !!(
      value &&
      typeof value === 'object' &&
      'type' in value &&
      value.type === 'image' &&
      'url' in value &&
      value.url
    );
  });

  let imageInputs: Array<MediaAsset & { label: string; order: number }> | undefined;
  if (imageInputsParams.length > 0) {
    const imageInputsData = getImageInputsFromInputInfo(inputsInfo, imageInputsParams);
    imageInputs = imageInputsData.sort((a, b) => a.order - b.order);
  }

  const filtered = Object.fromEntries(
    Object.entries(inputs)
      .filter(([key]) => key !== inputPrompt?.[0])
      .map(([key, value]) =>
        key === 'seed' ? [key, String(extractSeed(value as string | { seed: string } | undefined))] : [key, value],
      ),
  );
  const sortedParams = Object.fromEntries(Object.entries(filtered).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)));

  return {
    sortedParams,
    prompt: inputPrompt?.[1] as string | { value: string } | undefined,
    negativePrompt: negative as string | { value: string } | undefined,
    imageInputs,
  };
};

const ANCHOR_ORIGIN = {
  vertical: 'bottom',
  horizontal: 'left',
} as const;

const POPOVER_STYLES = {
  '& .MuiPopover-paper': { width: '400px' },
};

const EMPTY_OBJECT = {};

interface GalleryParamsProps {
  inputs: Record<string, unknown>;
  container?: string;
  inputsInfo?: Record<string, unknown>;
}

function GalleryParams({ inputs, container = '', inputsInfo = EMPTY_OBJECT }: GalleryParamsProps) {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const { isHovered: isPromptHovered, ...elementProps } = useIsHovered();
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  const handleClickOpenParams = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
    track('gallery_params_opened', {}, TrackTypeEnum.Product);
  };

  const handleCloseParams = useCallback(() => {
    track('gallery_params_closed', {}, TrackTypeEnum.Product);
    setAnchorEl(null);
  }, [track]);

  const open = Boolean(anchorEl);
  const id = open ? 'params-popover' : undefined;

  const { sortedParams, prompt, negativePrompt, imageInputs } = useMemo<{
    sortedParams?: Record<string, unknown>;
    prompt?: string | { value: string };
    negativePrompt?: string | { value: string };
    imageInputs?: Array<MediaAsset & { label: string; order: number }>;
  }>(() => {
    if (inputs) {
      const processed = processInputs(inputs, inputsInfo);
      return {
        sortedParams: processed.sortedParams,
        prompt: processed.prompt,
        negativePrompt: processed.negativePrompt,
        imageInputs: processed.imageInputs,
      };
    } else {
      return {
        sortedParams: undefined,
        prompt: undefined,
        negativePrompt: undefined,
        imageInputs: undefined,
      };
    }
  }, [inputs, inputsInfo]);

  const { copyToClipboard: copyPromptToClipboard, copied: promptCopied } = useCopyToClipboard({
    trackingName: 'gallery_params_copied_prompt',
    trackingPayload: EMPTY_OBJECT,
  });
  const { copyToClipboard: copyNegativePromptToClipboard, copied: negativePromptCopied } = useCopyToClipboard({
    trackingName: 'gallery_params_copied_negative_prompt',
    trackingPayload: EMPTY_OBJECT,
  });
  const promptValue = extractValue(prompt);
  const negativePromptValue = extractValue(negativePrompt);

  if (container === 'gallery') {
    return (
      <FlexCol sx={{ gap: 1 }}>
        <Box {...elementProps} sx={{ mb: 2 }}>
          <FlexCenVer sx={{ justifyContent: 'space-between', height: '24px' }}>
            {promptValue && (
              <Typography variant="body-sm-rg">{t(I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.PARAMS.PROMPT)}</Typography>
            )}
            {isPromptHovered && promptValue && (
              <CopyButton text={promptValue} trackingName="gallery_params_copied_prompt" size="medium" />
            )}
          </FlexCenVer>
          <Typography variant="body-sm-rg" sx={{ mb: 2 }} color={color.White64_T}>
            {promptValue}
          </Typography>
        </Box>
        {imageInputs &&
          imageInputs.map((imageInput) => <ImageParamDisplay key={imageInput.order} imageInput={imageInput} />)}
        <SortedParams params={sortedParams} RenderComponent={ParamDisplay} />
      </FlexCol>
    );
  }
  return (
    <>
      <Typography
        onClick={handleClickOpenParams}
        variant="body-sm-rg"
        sx={{
          width: 'fit-content',
          p: 1,
          ml: -1,
          cursor: 'pointer',
          gap: 0.5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <i className={`fa-light fa-circle-${open ? 'x' : 'plus'} fa-lg`}></i>
        {t(
          open
            ? I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.PARAMS.HIDE_INFO
            : I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.PARAMS.SHOW_INFO,
        )}
      </Typography>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleCloseParams}
        anchorOrigin={ANCHOR_ORIGIN}
        sx={POPOVER_STYLES}
        disableAutoFocus
        disableEnforceFocus
      >
        <FlexCol sx={{ background: color.Black100, p: 2, gap: 1 }}>
          {promptValue && (
            <Box id="gallery-param-prompt" sx={{ position: 'relative' }}>
              <Typography variant="body-std-md" sx={{ mb: 1 }}>
                {t(I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.PARAMS.PROMPT)}
              </Typography>
              <ExpandableText text={promptValue} />
              {/* support both prompt and prompt.value coming from LLM results */}
              <CopyIndication
                copied={promptCopied}
                copyToClipboard={() => promptValue && void copyPromptToClipboard(promptValue)}
              />
            </Box>
          )}
          {negativePromptValue && (
            <Box id="gallery-param-n-prompt" sx={{ position: 'relative' }}>
              <Typography variant="body-std-md" sx={{ my: 1 }}>
                {t(I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.PARAMS.NEGATIVE_PROMPT)}
              </Typography>
              <ExpandableText text={negativePromptValue} />
              <CopyIndication
                copied={negativePromptCopied}
                copyToClipboard={() => negativePromptValue && void copyNegativePromptToClipboard(negativePromptValue)}
              />
            </Box>
          )}
          <SortedParams
            params={sortedParams}
            RenderComponent={CustomChip}
            header={
              <Typography variant="body-std-md" sx={{ my: 1 }}>
                {t(I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.PARAMS.PARAMETERS)}
              </Typography>
            }
          />
        </FlexCol>
      </Popover>
    </>
  );
}

export default GalleryParams;
