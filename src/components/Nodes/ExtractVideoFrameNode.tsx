import { useCallback } from 'react';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { FlexCenVer, FlexColCenVer } from '@/UI/styles';
import { I18N_KEYS } from '@/language/keys';
import { Input } from '@/UI/Input/Input';
import { InputViewer } from '@/components/Nodes/Shared/FileViewer';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { useFlowState, useVideoView } from '../Recipe/FlowContext';
import { NumberInput } from '../Recipe/FlowComponents/Editor/Designer/LayerPropertyPanel/NumberInput';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';
import type { ExtractVideoFrameData } from '@/types/node';
import type { NodeId } from 'web';

function ExtractVideoFrameNode({ id, data }: { id: NodeId; data: ExtractVideoFrameData }) {
  const role = useUserWorkflowRole();
  const editable = !data.isLocked && role === 'editor';
  const { t } = useTranslation();
  const view = useVideoView(id);

  const { fps, currentTime } = useFlowState((s) => s.video[id]) ?? {
    fps: 30,
    currentTime: 0,
  };

  const frame = Math.round(currentTime * fps - 0.5);

  const minutes = Math.floor(currentTime / 60);
  const seconds = Math.floor(currentTime % 60);
  const frames = Math.floor((currentTime % 1) * fps);
  const timecodeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;

  const handleFrameNumberUpdate = useCallback(
    (value: string | number) => {
      const frame = Number(value);
      if (frame === undefined || frame === null || isNaN(frame)) {
        return;
      }

      const timeInSeconds = (Math.max(frame, 0) + 0.5) / fps;
      void view.setTime(timeInSeconds, false);
    },
    [fps, view],
  );

  return (
    <DynamicNode2 id={id} data={data}>
      <FlexColCenVer sx={{ width: '100%', height: '100%', cursor: 'default' }} className="nodrag">
        <InputViewer id={id} input={data.inputNode} disabled={!editable} />
        <FlexCenVer
          sx={{ width: '100%', gap: 2, borderTop: `1px solid ${color.White08_T}`, paddingTop: 2, marginTop: 2 }}
        >
          <FlexCenVer sx={{ gap: 0.75 }}>
            <Typography variant="body-sm-rg">{t(I18N_KEYS.RECIPE_MAIN.NODES.EXTRACT_VIDEO_FRAME.FRAME)}</Typography>
            <NumberInput disabled={!editable} value={frame} onSubmit={handleFrameNumberUpdate} decimals={0} />
          </FlexCenVer>
          <FlexCenVer sx={{ gap: 0.75 }}>
            <Typography variant="body-sm-rg">{t(I18N_KEYS.RECIPE_MAIN.NODES.EXTRACT_VIDEO_FRAME.TIMECODE)}</Typography>
            <Input size="small" value={timecodeStr} disabled sx={{ width: '72px' }} />
          </FlexCenVer>
        </FlexCenVer>
      </FlexColCenVer>
    </DynamicNode2>
  );
}

export default ExtractVideoFrameNode;
