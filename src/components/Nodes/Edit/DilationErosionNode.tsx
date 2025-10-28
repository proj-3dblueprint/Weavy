import { useCallback, ChangeEvent } from 'react';
import { Box, Slider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDilationErosionView } from '@/components/Recipe/FlowContext';
import { Input } from '@/UI/Input/Input';
import { color, colorMap } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { DilationErosionData } from '@/types/node';
import { FlexCenHorVer, FlexCenVer } from '@/UI/styles';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { MaskExpandIcon } from '@/UI/Icons/MaskExpandIcon';
import { DynamicNode2 } from '../DynamicNode/DynamicNode2';
import { InputViewer } from '../Shared/FileViewer';
import type { NodeId } from 'web';

const MAX_SIZE = 100;

function DilationErosionNode({ id, data }: { id: NodeId; data: DilationErosionData }) {
  const role = useUserWorkflowRole();
  const dilationErosionView = useDilationErosionView(id);
  const { t } = useTranslation();

  const { size, inputNode, isLocked } = data;
  const editable = isLocked !== true && role === 'editor';

  const handleSizeChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      void dilationErosionView.setSize(Math.min(Math.max(Number(e.target.value), -MAX_SIZE), MAX_SIZE), false);
    },
    [dilationErosionView],
  );

  const handleSizeSliderChange = useCallback(
    (_, newValue: number | number[]) => {
      void dilationErosionView.setSize(Array.isArray(newValue) ? newValue[0] : newValue, true);
    },
    [dilationErosionView],
  );

  const handleSizeSliderChangeFinal = useCallback(
    (_, newValue: number | number[]) => {
      void dilationErosionView.setSize(Array.isArray(newValue) ? newValue[0] : newValue, false);
    },
    [dilationErosionView],
  );

  return (
    <DynamicNode2
      id={id}
      data={data}
      icon={<MaskExpandIcon />}
      className="dilation-erosion"
      handleColor={colorMap.get(data.color)}
    >
      <InputViewer id={id} input={inputNode} />
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
              {t(I18N_KEYS.RECIPE_MAIN.NODES.DILATION_EROSION.SIZE)}
            </Typography>
            <FlexCenHorVer sx={{ width: '182px' }}>
              <Slider
                size="small"
                value={size}
                onChange={handleSizeSliderChange}
                onChangeCommitted={handleSizeSliderChangeFinal}
                aria-labelledby="dilation-erosion-size-slider"
                max={MAX_SIZE}
                min={-MAX_SIZE}
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
              value={size}
              disabled={!editable}
              size="small"
              onChange={handleSizeChange}
              inputProps={{
                step: 1,
                min: -MAX_SIZE,
                max: MAX_SIZE,
                type: 'number',
                'aria-labelledby': 'input-slider',
              }}
            />
          </FlexCenVer>
        </FlexCenVer>
      </Box>
    </DynamicNode2>
  );
}

export default DilationErosionNode;
