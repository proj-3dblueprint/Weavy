import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PropsWithChildren, useCallback } from 'react';
import { Flex, FlexCenVer, FlexColCenHor } from '@/UI/styles';
import { I18N_KEYS } from '@/language/keys';
import { useCropView, useNode } from '@/components/Recipe/FlowContext';
import { color } from '@/colors';
import { LinkIcon } from '@/UI/Icons/LinkIcon';
import { LinkBreakIcon } from '@/UI/Icons/LinkBreakIcon';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { AppToggleButton } from '@/UI/AppToggleButtons/AppToggleButton';
import { Dropdown, Option } from '@/UI/Dropdown/Dropdown';
import { DEFAULT_DIMENSIONS } from '@/consts/dimensions';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';
import { NumberInput } from './Shared/NumberInput';
import { hasEditingPermissions } from './Utils';
import { CropArea } from './Crop/CropArea';
import { InputViewer } from './Shared/FileViewer';
import type { NodeId } from 'web';
import type { CropData } from '@/types/node';
import type { CornerType, EdgeType } from './Crop/types';

const ASPECT_RATIO_OPTIONS: Option<number>[] = [
  { id: '1:1', label: '1:1', value: 1 / 1 },
  { id: '3:4', label: '3:4', value: 3 / 4 },
  { id: '4:3', label: '4:3', value: 4 / 3 },
  { id: '16:9', label: '16:9', value: 16 / 9 },
  { id: '9:16', label: '9:16', value: 9 / 16 },
];

export function CropNode({ id, data }: { id: NodeId; data: CropData }) {
  const { t } = useTranslation();
  const role = useUserWorkflowRole();
  const view = useCropView(id);
  const { options: cropData } = data;
  const lockAspectRatio = cropData?.lockAspectRatio ?? true;

  const inputDimensions = view.getInputDimensions();
  const isSelected = useNode(id).selected;

  const handleWidthChange = useCallback((newWidth: number) => view.updateWidth(newWidth), [view]);
  const handleHeightChange = useCallback((newHeight: number) => view.updateHeight(newHeight), [view]);
  const toggleLockAspectRatio = useCallback(() => view.toggleLockAspectRatio(), [view]);
  const handleResetClick = useCallback(() => view.resetCrop(), [view]);

  const matchingAspectRatio =
    cropData && ASPECT_RATIO_OPTIONS.find(({ value }) => Math.abs(value - cropData.width / cropData.height) < 0.05);
  const handleAspectRatioChange = useCallback(
    (aspectRatio: Option<number>) => view.changeAspectRatio(aspectRatio.value),
    [view],
  );

  const handleDragBox = useCallback(
    (dx: number, dy: number, ongoing: boolean) => view.dragBox(dx, dy, ongoing),
    [view],
  );

  const handleDragCorner = useCallback(
    (dx: number, dy: number, type: CornerType, ongoing: boolean) => view.dragCorner(dx, dy, type, ongoing),
    [view],
  );

  const handleDragEdge = useCallback(
    (dx: number, dy: number, type: EdgeType, ongoing: boolean) => view.dragEdge(dx, dy, type, ongoing),
    [view],
  );

  return (
    <DynamicNode2 id={id} data={data} className="crop">
      <FlexColCenHor
        sx={{
          height: inputDimensions ? 'auto' : '430px',
          pointerEvents: !hasEditingPermissions(role, data) ? 'none' : 'auto',
          gap: 2,
        }}
      >
        {inputDimensions ? (
          <FlexColCenHor sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <InputViewer id={id} input={data.inputNode} />
            {cropData ? (
              <CropArea
                crop={cropData}
                originalWidth={inputDimensions.width}
                originalHeight={inputDimensions.height}
                onDragBox={handleDragBox}
                onDragCorner={handleDragCorner}
                onDragEdge={handleDragEdge}
                showGrid={isSelected}
                lockAspectRatio={lockAspectRatio}
              />
            ) : null}
          </FlexColCenHor>
        ) : (
          <Box className="media-container" sx={{ width: '100%', height: '100%' }} />
        )}
      </FlexColCenHor>

      <FlexCenVer
        sx={{
          pointerEvents: !hasEditingPermissions(role, data) ? 'none' : 'auto',
          mt: 2,
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: 'min(88px) auto', gap: 1 }}>
          <LabeledRow label={t(I18N_KEYS.RECIPE_MAIN.NODES.CROP.ASPECT_RATIO)}>
            <Dropdown
              sx={{ width: '100%', height: 24 }}
              emptyState={t(I18N_KEYS.RECIPE_MAIN.NODES.CROP.CUSTOM_ASPECT_RATIO)}
              value={lockAspectRatio && matchingAspectRatio ? matchingAspectRatio.value : null}
              options={ASPECT_RATIO_OPTIONS}
              onChange={handleAspectRatioChange}
              matchTriggerWidth
            />
          </LabeledRow>

          <LabeledRow label={t(I18N_KEYS.RECIPE_MAIN.NODES.CROP.DIMENSIONS)}>
            <Flex sx={{ width: '100%', gap: 0.5, justifyContent: 'space-between' }}>
              <NumberInput
                value={cropData?.width ?? DEFAULT_DIMENSIONS.width}
                onSubmit={handleWidthChange}
                decimals={0}
                startAdornment={
                  <Typography variant="body-sm-rg" sx={{ lineHeight: '1rem' }} color={color.White64_T}>
                    {t(I18N_KEYS.RECIPE_MAIN.NODES.CROP.WIDTH_LETTER)}
                  </Typography>
                }
                size="small"
                sx={{ width: '80px' }}
                aria-label="Width"
              />
              <NumberInput
                value={cropData?.height ?? DEFAULT_DIMENSIONS.height}
                onSubmit={handleHeightChange}
                decimals={0}
                startAdornment={
                  <Typography variant="body-sm-rg" sx={{ lineHeight: '1rem' }} color={color.White64_T}>
                    {t(I18N_KEYS.RECIPE_MAIN.NODES.CROP.HEIGHT_LETTER)}
                  </Typography>
                }
                size="small"
                sx={{ width: '80px' }}
                aria-label="Height"
              />
              <AppToggleButton
                sx={{
                  width: '26px',
                  height: '26px',
                  p: 0.5,
                }}
                value={lockAspectRatio}
                onClick={toggleLockAspectRatio}
              >
                {lockAspectRatio ? <LinkIcon width={8} height={8} /> : <LinkBreakIcon width={8} height={8} />}
              </AppToggleButton>
            </Flex>
          </LabeledRow>
        </Box>
        <Flex sx={{ alignItems: 'start', justifyContent: 'flex-end', width: '100%', alignSelf: 'stretch' }}>
          <ButtonContained
            mode="text"
            size="small"
            onClick={handleResetClick}
            sx={{ padding: (theme) => theme.spacing(0.5, 1) }}
          >
            <Typography variant="body-sm-rg">{t(I18N_KEYS.RECIPE_MAIN.NODES.CROP.RESET)}</Typography>
          </ButtonContained>
        </Flex>
      </FlexCenVer>
    </DynamicNode2>
  );
}

// to be used in a grid
function LabeledRow({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <>
      <FlexCenVer>
        <Typography variant="body-sm-rg" color={color.White64_T}>
          {label}
        </Typography>
      </FlexCenVer>
      <FlexCenVer>{children}</FlexCenVer>
    </>
  );
}
