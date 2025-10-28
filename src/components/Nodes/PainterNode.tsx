import { useCallback } from 'react';
import { Box, Divider, IconButton, Typography, Link, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { FlexCenHorVer, FlexCenVer, FlexColCenHor } from '@/UI/styles';
import { ColorPickerField } from '@/UI/ColorPicker/ColorPickerField';
import { AppToggleButton } from '@/UI/AppToggleButtons/AppToggleButton';
import { LinkIcon } from '@/UI/Icons/LinkIcon';
import { LinkBreakIcon } from '@/UI/Icons/LinkBreakIcon';
import { I18N_KEYS } from '@/language/keys';
import { usePainterView, useFlowState } from '../Recipe/FlowContext';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';
import { hasEditingPermissions } from './Utils';
import { NumberInput } from './Shared/NumberInput';
import { ImageViewer } from './Shared/FileViewer';

import type { NodeId, PainterMode } from 'web';
import type { PainterData } from '@/types/node';
import type { WebColor } from '@/UI/ColorPicker/ColorPicker';

export function PainterNode({ id, data }: { id: NodeId; data: PainterData }) {
  const { t } = useTranslation();
  const view = usePainterView(id);
  const role = useUserWorkflowRole();

  const tool: PainterMode = useFlowState((s) => s.painter[id]?.mode ?? 'brush');

  const { width, height, lockAspectRatio, brushSize, brushColor, backgroundColor } = view.getOptions();
  const hasInput = view.hasInputImage();

  const handleReset = useCallback(() => void view.reset(), [view]);

  const handleBrushSizeChange = useCallback(
    (_: unknown, size: number | number[]) => {
      if (Array.isArray(size)) return;
      void view.setBrushSize(size, true);
    },
    [view],
  );
  const handleBrushSizeChangeEnd = useCallback(
    (_: unknown, size: number | number[]) => {
      if (Array.isArray(size)) return;
      void view.setBrushSize(size, false);
    },
    [view],
  );

  const setBrushColor = useCallback((color: WebColor) => void view.setBrushColor(color, true), [view]);
  const setBrushColorEnd = useCallback((color: WebColor) => void view.setBrushColor(color, false), [view]);

  const setBackgroundColor = useCallback((color: WebColor) => void view.setBackgroundColor(color, true), [view]);
  const setBackgroundColorEnd = useCallback((color: WebColor) => void view.setBackgroundColor(color, false), [view]);

  const setMode = useCallback((mode: PainterMode) => void view.setMode(mode), [view]);

  const setWidth = useCallback((value: number) => void view.setWidth(value), [view]);
  const setHeight = useCallback((value: number) => void view.setHeight(value), [view]);
  const toggleLockAspectRatio = useCallback(() => void view.toggleLockAspectRatio(), [view]);

  return (
    <DynamicNode2 id={id} data={data} className="painterV2">
      <Box className="nodrag" sx={{ cursor: 'none' }}>
        <ImageViewer id={id} />
      </Box>

      <FlexColCenHor id="painter-main" sx={{ width: '100%' }}>
        {role === 'editor' && (
          <FlexCenVer id="painter-tools-container" sx={{ justifyContent: 'space-between', width: '100%', mt: 2 }}>
            <Box data-testid="painter-tools" className="nodrag">
              <IconButton
                disableRipple
                onClick={() => setMode('brush')}
                sx={{
                  width: '30px',
                  height: '30px',
                  p: 0.2,
                  borderRadius: '4px',
                  backgroundColor: tool === 'brush' ? color.Black64_T : 'transparent',
                  '&:active': {
                    backgroundColor: color.Black64_T,
                  },
                }}
              >
                <i className="fa-thin fa-paintbrush fa-xs"></i>
              </IconButton>
              <IconButton
                disableRipple
                onClick={() => setMode('eraser')}
                sx={{
                  width: '30px',
                  height: '30px',
                  p: 0.2,
                  borderRadius: '4px',
                  ml: 1,
                  backgroundColor: tool === 'eraser' ? color.Black64_T : 'transparent',
                  '&:active': {
                    backgroundColor: color.Black64_T,
                  },
                }}
              >
                <i className="fa-thin fa-eraser fa-xs"></i>
              </IconButton>
            </Box>
            <Link onClick={handleReset} className="nodrag" sx={{ fontSize: '12px', color: color.White80_T }}>
              {t(I18N_KEYS.GENERAL.CLEAR)}
            </Link>
          </FlexCenVer>
        )}

        {role === 'editor' && (
          <FlexCenVer
            className="nodrag"
            id="painter-brush-attributes-container"
            sx={{ width: '100%', mt: 1.5, mb: 2, justifyContent: 'space-between' }}
          >
            <ColorPickerField
              color={brushColor}
              onChange={setBrushColor}
              onChangeEnd={setBrushColorEnd}
              showColorEditor={true}
              showAlpha={true}
            />
            <FlexCenHorVer sx={{ gap: 1 }}>
              <Typography variant="body-sm-rg" sx={{ color: color.White80_T }}>
                {t(I18N_KEYS.RECIPE_MAIN.NODES.PAINTER.BRUSH_SIZE_LABEL)}
              </Typography>
              <Slider
                className="nodrag"
                value={brushSize}
                sx={{ width: '140px' }}
                onChange={handleBrushSizeChange}
                onChangeCommitted={handleBrushSizeChangeEnd}
                size="small"
              />
              <Typography variant="body-sm-rg" sx={{ minWidth: '20px', textAlign: 'right' }}>
                {brushSize.toFixed(0)}
              </Typography>
            </FlexCenHorVer>
          </FlexCenVer>
        )}
      </FlexColCenHor>

      <Divider sx={{ width: '100%' }} />

      <FlexCenVer
        data-testid={`painter-settings-${id}`}
        sx={{
          justifyContent: 'space-between',
          width: '100%',
          mt: 2,
        }}
      >
        <FlexCenVer
          sx={{
            width: '100%',
            gap: 0.5,
            justifyContent: 'start',
            pointerEvents: !hasEditingPermissions(role, data) ? 'none' : 'auto',
          }}
        >
          <NumberInput
            value={width}
            onSubmit={setWidth}
            decimals={0}
            startAdornment={
              <Typography variant="body-sm-rg" sx={{ lineHeight: '1rem' }} color={color.White64_T}>
                {t(I18N_KEYS.RECIPE_MAIN.NODES.CROP.WIDTH_LETTER)}
              </Typography>
            }
            size="small"
            sx={{ width: '80px' }}
            aria-label="Width"
            disabled={hasInput}
          />
          <NumberInput
            value={height}
            onSubmit={setHeight}
            decimals={0}
            startAdornment={
              <Typography variant="body-sm-rg" sx={{ lineHeight: '1rem' }} color={color.White64_T}>
                {t(I18N_KEYS.RECIPE_MAIN.NODES.CROP.HEIGHT_LETTER)}
              </Typography>
            }
            size="small"
            sx={{ width: '80px' }}
            aria-label="Height"
            disabled={hasInput}
          />
          <AppToggleButton
            sx={{
              width: '26px',
              height: '26px',
              p: 0.5,
            }}
            value={lockAspectRatio}
            onClick={toggleLockAspectRatio}
            disabled={hasInput}
          >
            {lockAspectRatio ? <LinkIcon width={8} height={8} /> : <LinkBreakIcon width={8} height={8} />}
          </AppToggleButton>
        </FlexCenVer>

        <FlexCenHorVer sx={{ gap: 1, justifyContent: 'end', flex: '50%' }} className="nodrag">
          <Typography variant="body-sm-rg" sx={{ color: color.White80_T }}>
            {t(I18N_KEYS.RECIPE_MAIN.NODES.PAINTER.BACKGROUND_COLOR_LABEL)}
          </Typography>
          <ColorPickerField
            color={backgroundColor}
            onChange={setBackgroundColor}
            onChangeEnd={setBackgroundColorEnd}
            showColorEditor={false}
            showAlpha={false}
            size="large"
          />
        </FlexCenHorVer>
      </FlexCenVer>
    </DynamicNode2>
  );
}
