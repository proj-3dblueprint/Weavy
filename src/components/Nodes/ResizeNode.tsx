import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { Flex } from '@/UI/styles';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { useResizeView } from '@/components/Recipe/FlowContext';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';
import { AppToggleButton } from '@/UI/AppToggleButtons/AppToggleButton';
import { LinkIcon, LinkBreakIcon } from '@/UI/Icons';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';
import { hasEditingPermissions } from './Utils';
import { InputViewer } from './Shared/FileViewer';
import { NumberInput } from './Shared/NumberInput';
import type { NodeId } from 'web';
import type { ResizeData } from '@/types/node';

export function ResizeNode({ id, data }: { id: NodeId; data: ResizeData }) {
  const { t } = useTranslation();
  const role = useUserWorkflowRole();
  const view = useResizeView(id);
  const { width, height, lockAspectRatio } = view.getOptions();

  const handleWidthChange = useCallback((value: number) => void view.setWidth(value), [view]);
  const handleHeightChange = useCallback((value: number) => void view.setHeight(value), [view]);
  const toggleLockAspectRatio = useCallback(() => void view.toggleLockAspectRatio(), [view]);

  return (
    <DynamicNode2 id={id} data={data} className="resize">
      <InputViewer id={id} input={data.inputNode} />

      <Flex
        sx={{
          width: '100%',
          gap: 0.5,
          mt: 2,
          justifyContent: 'start',
          pointerEvents: !hasEditingPermissions(role, data) ? 'none' : 'auto',
        }}
      >
        <NumberInput
          value={width}
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
          value={height}
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
    </DynamicNode2>
  );
}
