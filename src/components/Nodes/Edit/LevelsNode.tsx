import { NodeId, Vec3 } from 'web';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { color, colorMap } from '@/colors';
import { DynamicNode2 } from '@/components/Nodes/DynamicNode/DynamicNode2';
import { useLevelsView } from '@/components/Recipe/FlowContext';
import { LevelsData } from '@/types/node';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenVer, FlexCol, FlexColCenHorVer } from '@/UI/styles';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { SlidersIcon } from '@/UI/Icons/SlidersIcon';
import { LockAspectRatioButton } from '@/components/Common/LockAspectRatioButton';
import { InputViewer } from '../Shared/FileViewer';
import { LevelsChannelInputs } from './LevelsNodeComponents/LevelsChannelInputs';

type Channel = 'R' | 'G' | 'B';
type InputType = 'min' | 'middle' | 'max';

// Convert relative position (0 to 1) to gamma value (0.1 to 10)
const relativePositionToGamma = (position: number): number => {
  const exponent = position * 2 - 1;
  return Math.pow(10, exponent);
};

// Convert gamma value (0.1 to 10) to relative position (0 to 1)
const gammaToRelativePosition = (gamma: number): number => {
  return (Math.log10(gamma) + 1) / 2;
};

function LevelsNode({ id, data }: { id: NodeId; data: LevelsData }) {
  const { t } = useTranslation();
  const histogramCanvasRef = useRef<HTMLCanvasElement>(null);
  const view = useLevelsView(id);
  const role = useUserWorkflowRole();
  const editable = data.isLocked !== true && role === 'editor';
  const [lockChannels, setLockChannels] = useState(true);
  const [histogramData, setHistogramData] = useState<number[] | null>(null);
  const [histogramMaxValue, setHistogramMaxValue] = useState<number>(0);
  const [calculatingHistogram, setCalculatingHistogram] = useState(false);

  const [tempInputValues, setTempInputValues] = useState<{
    [channel in Channel]: { [type in InputType]?: string };
  }>({
    R: {},
    G: {},
    B: {},
  });

  const extractValue = (value: Vec3, channel: Channel): number => {
    return channel === 'R' ? value.x : channel === 'G' ? value.y : value.z;
  };

  const changeValue = (newValue: number | number[], oldValue: Vec3, channel: Channel): Vec3 => {
    const newVal = Array.isArray(newValue) ? newValue[0] : newValue;
    return channel === 'R'
      ? { ...oldValue, x: newVal }
      : channel === 'G'
        ? { ...oldValue, y: newVal }
        : { ...oldValue, z: newVal };
  };

  const getGammaSliderPosition = (channel: Channel, min: number, max: number): number => {
    const gamma = extractValue(data.options.inverseGamma, channel);
    const position = gammaToRelativePosition(gamma);
    return min + (max - min) * position;
  };

  const handleLevelsChange = (
    channel: Channel,
    values: { min: number; middle: number; max: number },
    activeThumb?: number,
    isTemporary: boolean = true,
  ) => {
    const min = Math.max(0, Math.min(1, values.min / 255));
    const max = Math.max(0, Math.min(1, values.max / 255));
    let gamma: number;
    if (activeThumb === 1) {
      const denominator = values.max - values.min;
      if (denominator === 0) {
        gamma = extractValue(data.options.inverseGamma, channel);
      } else {
        const ratio = (values.middle - values.min) / denominator;
        gamma = relativePositionToGamma(ratio);
      }
    } else {
      gamma = extractValue(data.options.inverseGamma, channel);
    }
    gamma = Math.max(0.1, Math.min(10, gamma));

    if (lockChannels) {
      // Calculate the delta from the current values
      const minDelta = min - extractValue(data.options.min, channel);
      const maxDelta = max - extractValue(data.options.max, channel);
      const gammaRatio = gamma / extractValue(data.options.inverseGamma, channel);

      // Apply the same delta to all channels
      void view.setLevelsOptions(
        {
          min: {
            x: Math.max(0, Math.min(1, extractValue(data.options.min, 'R') + minDelta)),
            y: Math.max(0, Math.min(1, extractValue(data.options.min, 'G') + minDelta)),
            z: Math.max(0, Math.min(1, extractValue(data.options.min, 'B') + minDelta)),
          },
          max: {
            x: Math.max(0, Math.min(1, extractValue(data.options.max, 'R') + maxDelta)),
            y: Math.max(0, Math.min(1, extractValue(data.options.max, 'G') + maxDelta)),
            z: Math.max(0, Math.min(1, extractValue(data.options.max, 'B') + maxDelta)),
          },
          inverseGamma: {
            x: Math.max(0.1, Math.min(10, extractValue(data.options.inverseGamma, 'R') * gammaRatio)),
            y: Math.max(0.1, Math.min(10, extractValue(data.options.inverseGamma, 'G') * gammaRatio)),
            z: Math.max(0.1, Math.min(10, extractValue(data.options.inverseGamma, 'B') * gammaRatio)),
          },
        },
        isTemporary,
      );
    } else {
      // Update only the specified channel
      void view.setLevelsOptions(
        {
          min: changeValue(min, data.options.min, channel),
          max: changeValue(max, data.options.max, channel),
          inverseGamma: changeValue(gamma, data.options.inverseGamma, channel),
        },
        isTemporary,
      );
    }
  };

  const handleSliderChange = (
    channel: Channel,
    values: { min: number; middle: number; max: number },
    activeThumb?: number,
  ) => {
    handleLevelsChange(channel, values, activeThumb, true);
  };

  const handleSliderChangeFinal = (
    channel: Channel,
    values: { min: number; middle: number; max: number },
    activeThumb?: number,
  ) => {
    handleLevelsChange(channel, values, activeThumb, false);
  };

  const handleInputChange = (channel: Channel, type: InputType, value: string) => {
    // Only allow numbers and decimal point
    if (!/^-?\d*\.?\d*$/.test(value)) return;
    setTempInputValues((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], [type]: value },
    }));
  };

  const handleInputCommit = (channel: Channel, type: InputType, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    // Apply limits for min and max values
    let limitedValue = numValue;
    if (type !== 'middle') {
      limitedValue = Math.max(0, Math.min(255, numValue));
    }

    if (type === 'middle') {
      // For gamma input, directly use the value but ensure it's within valid range
      limitedValue = Math.max(0.1, Math.min(10, numValue));
      // Convert gamma to slider position
      const min = extractValue(data.options.min, channel) * 255;
      const max = extractValue(data.options.max, channel) * 255;
      const position = gammaToRelativePosition(limitedValue);
      limitedValue = min + (max - min) * position;
      // Commit the final value
      handleLevelsChange(
        channel,
        {
          min: extractValue(data.options.min, channel) * 255,
          middle: limitedValue,
          max: extractValue(data.options.max, channel) * 255,
        },
        1,
        false,
      );
    } else {
      // For min/max inputs, ensure min <= max
      const currentMin = type === 'min' ? limitedValue : extractValue(data.options.min, channel) * 255;
      const currentMax = type === 'max' ? limitedValue : extractValue(data.options.max, channel) * 255;

      // If min would be greater than max, adjust it
      const adjustedMin = type === 'min' ? Math.min(currentMin, currentMax) : currentMin;
      // If max would be less than min, adjust it
      const adjustedMax = type === 'max' ? Math.max(currentMax, currentMin) : currentMax;
      // Commit the final value
      handleLevelsChange(
        channel,
        {
          min: adjustedMin,
          middle: getGammaSliderPosition(channel, adjustedMin, adjustedMax),
          max: adjustedMax,
        },
        type === 'min' ? 0 : 2,
        false,
      );
    }

    // Clear the temporary value
    setTempInputValues((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], [type]: '' },
    }));
  };

  const handleReset = useCallback(() => {
    setTempInputValues({
      R: {},
      G: {},
      B: {},
    });
    void view.setLevelsOptions(
      {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 1, y: 1, z: 1 },
        inverseGamma: { x: 1, y: 1, z: 1 },
      },
      false,
    );
  }, [view]);

  const updateHistogramData = useCallback(async () => {
    if (view.hasValidInput()) {
      setCalculatingHistogram(true);
      const histogram = await view.computeInputHistogram();
      if (histogram) {
        const luminanceHistogram = histogram.luminance;
        setHistogramMaxValue(luminanceHistogram.reduce((max, val) => Math.max(max, val), 0));
        setHistogramData(luminanceHistogram);
      }
      setCalculatingHistogram(false);
    } else {
      setHistogramData(null);
      setHistogramMaxValue(1);
    }
  }, [view]);

  const drawHistogram = useCallback(() => {
    const canvas = histogramCanvasRef.current;
    if (!canvas || !histogramData || histogramData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use fixed dimensions that match the original design
    const displayWidth = 354;
    const displayHeight = 80;

    // Get device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size to match display size with pixel ratio
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    // Scale the context to account for the pixel ratio
    ctx.scale(dpr, dpr);

    // Set canvas CSS size to match display size
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    const maxValue = histogramMaxValue || 1;
    const barWidth = displayWidth / histogramData.length;

    ctx.fillStyle = color.Black40;

    histogramData.forEach((value, index) => {
      const barHeight = (value / maxValue) * displayHeight * 0.85;
      const x = index * barWidth;
      const y = displayHeight - barHeight;

      ctx.fillRect(x, y, barWidth, barHeight);
    });
  }, [histogramData, histogramMaxValue]);

  useEffect(() => {
    void updateHistogramData();
  }, [updateHistogramData]);

  useEffect(() => {
    drawHistogram();
  }, [drawHistogram]);

  return (
    <DynamicNode2
      id={id}
      data={data}
      className="invert"
      handleColor={colorMap.get('Yambo_Black')}
      icon={<SlidersIcon />}
    >
      <Box sx={{ width: '100%', height: '100%', cursor: 'default' }} className="nodrag">
        <InputViewer
          id={id}
          input={data.inputNode}
          onVideoPause={() => void updateHistogramData()}
          onVideoScrub={(_, ongoing) => {
            if (!ongoing) {
              void updateHistogramData();
            }
          }}
        />
        <FlexCenVer sx={{ alignItems: 'flex-start', gap: 1, width: '100%', position: 'relative', mt: 2 }}>
          <Box
            sx={{
              height: 80,
              position: 'relative',
              left: 70,
              width: '354px',
              backgroundColor: color.White04_T,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {histogramData ? (
              <canvas
                ref={histogramCanvasRef}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                }}
              />
            ) : calculatingHistogram ? (
              <FlexColCenHorVer sx={{ width: '100%', height: '100%', backgroundColor: color.White04_T }}>
                <CircularProgress size={16} sx={{ color: color.White64_T }} />
              </FlexColCenHorVer>
            ) : (
              <Typography variant="body-sm-rg" sx={{ color: color.White64_T }}>
                {t(I18N_KEYS.RECIPE_MAIN.NODES.LEVELS.NO_HISTOGRAM_DATA)}
              </Typography>
            )}
          </Box>
        </FlexCenVer>
        <FlexCenVer sx={{ mt: 1 }}>
          <FlexCol sx={{ mr: 1, width: 42, position: 'relative' }}>
            <Box
              sx={{
                width: 16,
                height: 35,
                position: 'relative',
                left: 12,
                top: -36,
                borderTop: '2px solid',
                borderLeft: '2px solid',
                borderColor: color.White16_T,
                borderRadius: '8px 0 0 0',
              }}
            />
            <Box sx={{ position: 'absolute', top: `calc(50% - 30px)`, left: 0 }}>
              <LockAspectRatioButton isLocked={lockChannels} onChange={() => setLockChannels((prev) => !prev)} />
            </Box>
            <Box
              sx={{
                width: 16,
                height: 36,
                position: 'relative',
                left: 12,
                bottom: -2,
                borderBottom: '2px solid',
                borderLeft: '2px solid',
                borderRadius: '0 0 0 8px',
                borderColor: color.White16_T,
              }}
            />
          </FlexCol>

          <FlexCol sx={{ width: '100%' }}>
            <LevelsChannelInputs
              channel="R"
              label={t(I18N_KEYS.RECIPE_MAIN.NODES.LEVELS.RED)}
              data={data}
              tempInputValues={tempInputValues}
              onInputChange={handleInputChange}
              onInputCommit={handleInputCommit}
              onSliderChange={handleSliderChange}
              onSliderChangeFinal={handleSliderChangeFinal}
              extractValue={extractValue}
              getGammaSliderPosition={getGammaSliderPosition}
              editable={editable}
            />
            <LevelsChannelInputs
              channel="G"
              label={t(I18N_KEYS.RECIPE_MAIN.NODES.LEVELS.GREEN)}
              data={data}
              tempInputValues={tempInputValues}
              onInputChange={handleInputChange}
              onInputCommit={handleInputCommit}
              onSliderChange={handleSliderChange}
              onSliderChangeFinal={handleSliderChangeFinal}
              extractValue={extractValue}
              getGammaSliderPosition={getGammaSliderPosition}
              editable={editable}
            />
            <LevelsChannelInputs
              channel="B"
              label={t(I18N_KEYS.RECIPE_MAIN.NODES.LEVELS.BLUE)}
              data={data}
              tempInputValues={tempInputValues}
              onInputChange={handleInputChange}
              onInputCommit={handleInputCommit}
              onSliderChange={handleSliderChange}
              onSliderChangeFinal={handleSliderChangeFinal}
              extractValue={extractValue}
              getGammaSliderPosition={getGammaSliderPosition}
              editable={editable}
            />
          </FlexCol>
        </FlexCenVer>
        <FlexCenVer sx={{ justifyContent: 'flex-end' }}>
          <ButtonContained mode="text" onClick={() => handleReset()} sx={{ height: 24, width: 50, minWidth: 50 }}>
            <Typography variant="body-sm-rg">{t(I18N_KEYS.RECIPE_MAIN.NODES.LEVELS.RESET)}</Typography>
          </ButtonContained>
        </FlexCenVer>
      </Box>
    </DynamicNode2>
  );
}

export default LevelsNode;
