import { Box, styled } from '@mui/material';
import * as colorPicker from '@zag-js/color-picker';
import { ReactNode, useCallback, useState, type RefObject } from 'react';
import { color as colors } from '@/colors';
import { Input } from '../Input/Input';
import { FlexCenVer } from '../styles';
import { UnitInput } from '../UnitInput/UnitInput';
import type { ColorFormat } from './ColorPicker';

const ColorBox = styled('div', {
  shouldForwardProp: (prop) => prop !== 'bgColor',
})<{ bgColor: colorPicker.Color; size?: 'small' | 'large' }>(({ bgColor, size }) => ({
  width: size === 'small' ? '14px' : '18px',
  height: size === 'small' ? '14px' : '18px',
  borderRadius: '2px',
  backgroundColor: bgColor.toString('rgba'),
}));

interface ColorInputProps {
  adornment?: ReactNode;
  color: colorPicker.Color;
  disabled?: boolean;
  format?: ColorFormat;
  innerRef?: RefObject<HTMLElement>;
  onChange: (color: colorPicker.Color) => void;
  onColorBoxClick?: () => void;
  showAlpha?: boolean;
  showColorEditor?: boolean;
  size?: 'small' | 'large';
  withColorBox?: boolean;
}

const HEX_REGEX = /^([0-9a-fA-F]*)$/;
const DIGIT_REGEX = /^[0-9]*$/;

const getValidRange = (index: number, isRgb: boolean) => {
  if (isRgb) return { min: 0, max: 255 };
  return index === 0 ? { min: 0, max: 360 } : { min: 0, max: 100 };
};

const getClosestRangeValue = (value: number, range: { min: number; max: number }) => {
  if (value < range.min) return range.min;
  if (value > range.max) return range.max;
  return value;
};

const HexEditor = ({ color, onChange, disabled = false }: Pick<ColorInputProps, 'color' | 'onChange' | 'disabled'>) => {
  const [hexInputValue, setHexInputValue] = useState(color.toString('hex').slice(1));

  const updateHexColor = (value: string) => {
    if (!HEX_REGEX.test(value)) return;
    setHexInputValue(value);
  };

  const onBlur = () => {
    try {
      const parsedColor = colorPicker.parse(`#${hexInputValue}`);
      onChange(parsedColor);
    } catch (_error) {
      // Ignore if color is invalid
    }
  };

  return (
    <Input
      disabled={disabled}
      onBlur={onBlur}
      onChange={(e) => updateHexColor(e.target.value)}
      size="small"
      sx={{ width: '121px' }}
      value={hexInputValue}
    />
  );
};

const getChannelValue = (color: colorPicker.Color, channelIndex: number, isRgb: boolean) => {
  if (isRgb) {
    return color.getChannelValue(channelIndex === 0 ? 'red' : channelIndex === 1 ? 'green' : 'blue');
  }
  return color.getChannelValue(channelIndex === 0 ? 'hue' : channelIndex === 1 ? 'saturation' : 'lightness');
};

const ChannelsEditor = ({
  color,
  disabled = false,
  onChange,
  format = 'RGB',
}: Pick<ColorInputProps, 'color' | 'onChange' | 'disabled'> & { format?: 'RGB' | 'HSL' }) => {
  const isRgb = format === 'RGB';
  const [channels, setChannels] = useState(
    isRgb
      ? [color.getChannelValue('red'), color.getChannelValue('green'), color.getChannelValue('blue')]
      : [color.getChannelValue('hue'), color.getChannelValue('saturation'), color.getChannelValue('lightness')],
  );

  const updateChannel = useCallback(
    (index: number, value: string) => {
      if (!DIGIT_REGEX.test(value)) return;

      if (value === '') {
        setChannels(channels.map((channel, i) => (i === index ? -1 : channel)));
        return;
      }

      const parsedValue = Number(value);

      if (isNaN(parsedValue) || parsedValue < 0) return;
      setChannels(channels.map((channel, i) => (i === index ? Math.round(parsedValue) : channel)));
    },
    [channels],
  );

  const onBlur = useCallback(() => {
    const [validChannel1, validChannel2, validChannel3] = channels.map((channel, index) => {
      if (channel === -1) return getChannelValue(color, index, isRgb);
      const range = getValidRange(index, isRgb);
      return getClosestRangeValue(channel, range);
    });

    setChannels([validChannel1, validChannel2, validChannel3]);

    onChange(
      color
        .withChannelValue(isRgb ? 'red' : 'hue', validChannel1)
        .withChannelValue(isRgb ? 'green' : 'saturation', validChannel2)
        .withChannelValue(isRgb ? 'blue' : 'lightness', validChannel3),
    );
  }, [channels, isRgb, onChange, color]);

  return (
    <FlexCenVer sx={{ gap: 0.25 }}>
      <Input
        disabled={disabled}
        onBlur={onBlur}
        onChange={(e) => updateChannel(0, e.target.value)}
        size="small"
        sx={{ width: '39px' }}
        value={channels[0] === -1 ? '' : Math.round(channels[0])}
      />
      <Input
        disabled={disabled}
        onBlur={onBlur}
        onChange={(e) => updateChannel(1, e.target.value)}
        size="small"
        sx={{ width: '39px' }}
        value={channels[1] === -1 ? '' : Math.round(channels[1])}
      />
      <Input
        disabled={disabled}
        onBlur={onBlur}
        onChange={(e) => updateChannel(2, e.target.value)}
        size="small"
        sx={{ width: '39px' }}
        value={channels[2] === -1 ? '' : Math.round(channels[2])}
      />
    </FlexCenVer>
  );
};

const AlphaEditor = ({
  color,
  onChange,
  disabled = false,
}: Pick<ColorInputProps, 'color' | 'onChange' | 'disabled'>) => {
  const [alpha, setAlpha] = useState(Math.round(color.getChannelValue('alpha') * 100));

  const updateAlpha = useCallback((value: string) => {
    if (!DIGIT_REGEX.test(value)) return;

    if (value === '') {
      setAlpha(-1);
      return;
    }

    const parsedValue = Number(value);
    if (isNaN(parsedValue) || parsedValue < 0) return;
    setAlpha(Math.round(parsedValue));
  }, []);

  const onBlur = useCallback(() => {
    let alphaValue = alpha;
    if (alpha === -1) alphaValue = color.getChannelValue('alpha') * 100;
    if (alphaValue < 0) alphaValue = 0;
    if (alphaValue > 100) alphaValue = 100;
    setAlpha(alphaValue);
    onChange(color.withChannelValue('alpha', alphaValue / 100));
  }, [alpha, onChange, color]);

  return (
    <UnitInput
      disabled={disabled}
      onBlur={onBlur}
      onChange={(e) => updateAlpha(e.target.value)}
      size="small"
      sx={{ width: '56px' }}
      unit="%"
      value={alpha === -1 ? undefined : Math.round(alpha)}
    />
  );
};

export const ColorInput = ({
  adornment,
  color,
  disabled = false,
  format = 'HEX',
  innerRef,
  onChange,
  onColorBoxClick,
  showAlpha = true,
  showColorEditor = true,
  size = 'small',
  withColorBox = false,
}: ColorInputProps) => {
  return (
    <FlexCenVer sx={{ gap: 0.5 }}>
      {withColorBox && (
        <Box
          ref={innerRef}
          onClick={onColorBoxClick}
          sx={{
            position: 'relative',
            backgroundColor: colors.Black92,
            border: '1px solid',
            borderColor: colors.White08_T,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: size === 'small' ? '26px' : '28px',
            width: size === 'small' ? '26px' : '28px',
            cursor: onColorBoxClick && !disabled ? 'pointer' : 'default',
            '&:hover': {
              backgroundColor: onColorBoxClick && !disabled ? colors.Black84 : colors.Black92,
            },
          }}
        >
          <ColorBox bgColor={color} />
          <Box
            sx={{
              position: 'absolute',
              top: `calc(50% - 5px)`,
              left: `calc(50% - 4px)`,
              width: '8px',
              height: '8px',
              fontSize: '8px',
            }}
          >
            {adornment}
          </Box>
        </Box>
      )}
      <FlexCenVer sx={{ gap: 0.25 }}>
        {showColorEditor && (
          <>
            {format === 'HEX' ? (
              <HexEditor key={color.toString('hexa') + format} color={color} onChange={onChange} disabled={disabled} />
            ) : (
              <ChannelsEditor
                key={color.toString('rgba') + format}
                color={color.toFormat(format === 'RGB' ? 'rgba' : 'hsla')}
                onChange={onChange}
                format={format}
                disabled={disabled}
              />
            )}
          </>
        )}
        {showAlpha && (
          <AlphaEditor
            key={color.getChannelValue('alpha') + format}
            color={color}
            onChange={onChange}
            disabled={disabled}
          />
        )}
      </FlexCenVer>
    </FlexCenVer>
  );
};
