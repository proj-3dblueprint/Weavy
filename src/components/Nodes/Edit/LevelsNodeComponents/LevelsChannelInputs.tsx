import { Typography } from '@mui/material';
import { FlexCenHorVer, FlexCol, FlexRow } from '@/UI/styles';
import { color } from '@/colors';
import ThreeHandleSlider from '@/UI/ThreeHandleSlider/ThreeHandleSlider';
import { Input } from '@/UI/Input/Input';
import { Vec3 } from '@/designer/designer';

type Channel = 'R' | 'G' | 'B';
type InputType = 'min' | 'middle' | 'max';

interface LevelsChannelInputsProps {
  channel: Channel;
  label: string;
  data: any;
  tempInputValues: { [channel in Channel]: { [type in InputType]?: string } };
  onInputChange: (channel: Channel, type: InputType, value: string) => void;
  onInputCommit: (channel: Channel, type: InputType, value: string) => void;
  onSliderChange: (
    channel: Channel,
    values: { min: number; middle: number; max: number },
    activeThumb?: number,
  ) => void;
  onSliderChangeFinal: (
    channel: Channel,
    values: { min: number; middle: number; max: number },
    activeThumb?: number,
  ) => void;
  extractValue: (value: Vec3, channel: Channel) => number;
  getGammaSliderPosition: (channel: Channel, min: number, max: number) => number;
  editable: boolean;
}

export const LevelsChannelInputs = ({
  channel,
  label,
  data,
  tempInputValues,
  onInputChange,
  onInputCommit,
  onSliderChange,
  onSliderChangeFinal,
  extractValue,
  getGammaSliderPosition,
  editable,
}: LevelsChannelInputsProps) => {
  const min = extractValue(data.options.min, channel) * 255;
  const max = extractValue(data.options.max, channel) * 255;
  return (
    <FlexRow>
      <FlexCol sx={{ mr: 2 }}>
        <Typography variant="body-std-rg" sx={{ color: color.White100 }}>
          {label}
        </Typography>
      </FlexCol>
      <FlexCol sx={{ width: '100%', mt: 1 }}>
        <ThreeHandleSlider
          minValue={min}
          maxValue={max}
          middleValue={getGammaSliderPosition(channel, min, max)}
          minLimit={0}
          maxLimit={255}
          step={1}
          disabled={!editable}
          onChange={(values, activeThumb) => onSliderChange(channel, values, activeThumb)}
          onChangeCommitted={(values, activeThumb) => onSliderChangeFinal(channel, values, activeThumb)}
        />
        <FlexCenHorVer sx={{ width: '100%', justifyContent: 'space-between', my: 1 }}>
          <Input
            value={tempInputValues[channel].min || min.toFixed(0)}
            size="small"
            sx={{ width: 50, textAlign: 'center' }}
            onChange={(e) => onInputChange(channel, 'min', e.target.value)}
            onBlur={(e) => onInputCommit(channel, 'min', e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                onInputCommit(channel, 'min', e.currentTarget.value);
                e.currentTarget.blur();
              }
            }}
          />
          <Input
            value={tempInputValues[channel].middle || extractValue(data.options.inverseGamma, channel).toFixed(2)}
            size="small"
            sx={{ width: 50, textAlign: 'center' }}
            onChange={(e) => onInputChange(channel, 'middle', e.target.value)}
            onBlur={(e) => onInputCommit(channel, 'middle', e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                onInputCommit(channel, 'middle', e.currentTarget.value);
                e.currentTarget.blur();
              }
            }}
          />
          <Input
            value={tempInputValues[channel].max || max.toFixed(0)}
            size="small"
            sx={{ width: 50, textAlign: 'center' }}
            onChange={(e) => onInputChange(channel, 'max', e.target.value)}
            onBlur={(e) => onInputCommit(channel, 'max', e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                onInputCommit(channel, 'max', e.currentTarget.value);
                e.currentTarget.blur();
              }
            }}
          />
        </FlexCenHorVer>
      </FlexCol>
    </FlexRow>
  );
};
