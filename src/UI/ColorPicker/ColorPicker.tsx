import * as colorPicker from '@zag-js/color-picker';
import { normalizeProps, useMachine } from '@zag-js/react';
import { useCallback, useId, useMemo, useState } from 'react';
import noop from 'lodash/noop';
import { FlexCenVer, FlexCol } from '../styles';
import { Dropdown, type Option } from '../Dropdown/Dropdown';
import { ColorInput } from './ColorInput';
import { ColorPickerSliders } from './ColorPickerSliders';

export type ColorFormat = 'HEX' | 'RGB' | 'HSL';

export interface WebColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-1
}

const formatOptions: Option<ColorFormat>[] = [
  { id: 'hex', label: 'HEX', value: 'HEX' },
  { id: 'rgb', label: 'RGB', value: 'RGB' },
  { id: 'hsl', label: 'HSL', value: 'HSL' },
];

interface ColorPickerProps {
  color: colorPicker.Color;
  format?: ColorFormat;
  onFormatChange?: (format: ColorFormat) => void;
  onChange: (color: colorPicker.Color) => void;
  onChangeEnd?: (color: colorPicker.Color) => void;
  showAlpha?: boolean;
}

export function ColorPicker({
  color,
  onChange,
  onChangeEnd,
  format: propFormat,
  onFormatChange: propOnFormatChange,
  showAlpha = true,
}: ColorPickerProps) {
  const [format, setFormat] = useState<ColorFormat>(propFormat || 'HEX');

  const onValueChange = useCallback(
    (details: colorPicker.ValueChangeDetails) => {
      onChange(details.value);
    },
    [onChange],
  );

  const onValueChangeEnd = useCallback(
    (details: colorPicker.ValueChangeDetails) => {
      onChangeEnd?.(details.value);
    },
    [onChangeEnd],
  );

  const machineId = useId();

  const machineOptions = useMemo(
    () => ({
      id: machineId,
      value: color.toFormat('rgba'),
      format: 'rgba' as colorPicker.ColorFormat,
      onFormatChange: noop,
      open: true, // Always open since this component doesn't handle positioning
      onValueChange,
      onValueChangeEnd,
    }),
    [machineId, color, onValueChange, onValueChangeEnd],
  );

  const service = useMachine(colorPicker.machine, machineOptions);
  const api = colorPicker.connect(service, normalizeProps);

  const onUpdateColor = useCallback(
    (color: colorPicker.Color) => {
      api.setValue(color);
    },
    [api],
  );

  const onFormatChange = useCallback(
    (format: Option<ColorFormat>) => {
      setFormat(format.value);
      propOnFormatChange?.(format.value);
    },
    [propOnFormatChange],
  );

  return (
    <div {...api.getRootProps()}>
      <div {...api.getContentProps()}>
        <FlexCol>
          <div {...api.getAreaProps()}>
            <div {...api.getAreaBackgroundProps()} />
            <div
              style={{
                position: 'absolute',
                top: 6,
                left: 6,
                width: 'calc(100% - 12px)',
                height: 'calc(100% - 12px)',
              }}
            >
              <div {...api.getAreaThumbProps()} />
            </div>
          </div>

          <ColorPickerSliders api={api} showAlpha={showAlpha} />

          <FlexCenVer sx={{ gap: 0.5 }}>
            <Dropdown
              width="64px"
              size="small"
              value={propFormat || format}
              options={formatOptions}
              onChange={onFormatChange}
            />
            <ColorInput
              color={api.value}
              onChange={onUpdateColor}
              format={propFormat || format}
              showAlpha={showAlpha}
            />
          </FlexCenVer>
        </FlexCol>
      </div>
    </div>
  );
}
