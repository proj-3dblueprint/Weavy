import { useCallback, ChangeEvent, useMemo } from 'react';
import { Box, Slider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useBlurView } from '@/components/Recipe/FlowContext';
import { Input } from '@/UI/Input/Input';
import { color, colorMap } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenHorVer, FlexCenVer } from '@/UI/styles';
import { Dropdown, type Option } from '@/UI/Dropdown/Dropdown';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { DynamicNode2 } from '../DynamicNode/DynamicNode2';
import { InputViewer } from '../Shared/FileViewer';
import type { BlurKind, NodeId } from 'web';
import type { BlurData } from '@/types/node';

function isBlurType(value: unknown): value is BlurKind {
  if (typeof value !== 'string') return false;
  return ['Box', 'Gaussian'].includes(value);
}

// FIXME ARBITRARY
const MAX_BLUR = 100;
// const MAX_BLUR_ITERS = 12;

interface BlurNodeProps {
  id: NodeId;
  data: BlurData;
}

export function BlurNode({ id, data }: BlurNodeProps) {
  const role = useUserWorkflowRole();
  const blurView = useBlurView(id);
  const { t } = useTranslation();

  const { options: blurOptions } = data;
  const editable = data.isLocked !== true && role === 'editor';

  const dropdownOptions = useMemo(() => {
    return [
      {
        label: t(I18N_KEYS.RECIPE_MAIN.NODES.BLUR.BOX),
        value: 'Box',
        id: 'box',
      },
      {
        label: t(I18N_KEYS.RECIPE_MAIN.NODES.BLUR.GAUSSIAN),
        value: 'Gaussian',
        id: 'gaussian',
      },
    ];
  }, [t]);

  const blurSize = blurOptions?.size ?? 1;
  const blurType: string = blurOptions?.type ?? 'Box';
  // const blurIterations = options?.iterations ?? 1;

  const handleBlurSizeChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      void blurView.setSize(Number(e.target.value), false);
    },
    [blurView],
  );

  // const handleIterationsChange = useCallback(
  //   (e: ChangeEvent<HTMLInputElement>) => {
  //     blurView.setIterations(Number(e.target.value), false);
  //   },
  //   [blurView],
  // );

  const handleBlurSizeSliderChange = useCallback(
    (_, newValue: number | number[]) => {
      void blurView.setSize(Array.isArray(newValue) ? newValue[0] : newValue, true);
    },
    [blurView],
  );

  const handleBlurSizeSliderChangeFinal = useCallback(
    (_, newValue: number | number[]) => {
      void blurView.setSize(Array.isArray(newValue) ? newValue[0] : newValue, false);
    },
    [blurView],
  );

  // const handleIterationsSliderChange = useCallback(
  //   (_, newValue: number | number[]) => {
  //     blurView.setIterations(Array.isArray(newValue) ? newValue[0] : newValue, true);
  //   },
  //   [blurView],
  // );

  // const handleIterationsSliderChangeFinal = useCallback(
  //   (_, newValue: number | number[]) => {
  //     blurView.setIterations(Array.isArray(newValue) ? newValue[0] : newValue, false);
  //   },
  //   [blurView],
  // );

  const handleTypeSelectChange = useCallback(
    (option: Option<string>) => {
      const value = option.value;
      if (!isBlurType(value)) return;
      void blurView.setType(value);
    },
    [blurView],
  );
  return (
    <DynamicNode2 id={id} data={data} className="blur" handleColor={colorMap.get(data.color)}>
      <InputViewer id={id} input={data.inputNode} />
      <Box sx={{ width: '100%', height: '100%', cursor: 'default' }} className="nodrag">
        <FlexCenVer
          sx={{
            pt: 2,
            rowGap: 1,
            columnGap: 3.5,
            width: '100%',
            flexWrap: 'wrap',
          }}
        >
          <FlexCenVer sx={{ gap: 1 }}>
            <Typography variant="body-sm-rg" sx={{ color: color.White64_T }}>
              {t(I18N_KEYS.RECIPE_MAIN.NODES.BLUR.TYPE)}
            </Typography>
            <Dropdown
              size="small"
              value={blurType}
              disabled={!editable}
              onChange={handleTypeSelectChange}
              options={dropdownOptions}
              width="96px"
            />
          </FlexCenVer>
          <FlexCenVer sx={{ gap: 1 }}>
            <Typography variant="body-sm-rg" sx={{ color: color.White64_T }}>
              {t(I18N_KEYS.RECIPE_MAIN.NODES.BLUR.SIZE)}
            </Typography>
            <FlexCenHorVer sx={{ width: '182px' }}>
              <Slider
                size="small"
                value={blurSize}
                onChange={handleBlurSizeSliderChange}
                onChangeCommitted={handleBlurSizeSliderChangeFinal}
                aria-labelledby="blur-size-slider"
                max={MAX_BLUR}
                min={1}
                disabled={!editable}
                slotProps={{
                  root: {
                    style: {
                      padding: '8px 0',
                    },
                  },
                }}
              />
            </FlexCenHorVer>
            <Input
              value={blurSize}
              disabled={!editable}
              size="small"
              onChange={handleBlurSizeChange}
              sx={{ maxWidth: '42px' }}
              inputProps={{
                step: 1,
                min: 1,
                max: MAX_BLUR,
                type: 'number',
                'aria-labelledby': 'input-slider',
              }}
            />
          </FlexCenVer>
          {/* temporarily hide iterations */}
          {/* <>
            <Typography variant="body-std-rg">Iterations</Typography>
            <Slider
              size="small"
              value={blurIterations}
              onChange={handleIterationsSliderChange}
              onChangeCommitted={handleIterationsSliderChangeFinal}
              aria-labelledby="blur-iter-slider"
              min={1}
              max={MAX_BLUR_ITERS}
            />
            <Input
              value={blurIterations}
              size="small"
              onChange={handleIterationsChange}
              inputProps={{
                step: 1,
                min: 1,
                max: MAX_BLUR_ITERS,
                type: 'number',
                'aria-labelledby': 'input-slider',
              }}
            />
          </> */}
        </FlexCenVer>
      </Box>
    </DynamicNode2>
  );
}
