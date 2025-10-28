import * as colorPicker from '@zag-js/color-picker';
import { ReactNode, useCallback, useRef, useState } from 'react';
import './ColorPicker.styles.css';
import { ColorInput } from './ColorInput';
import { parseColorPickerColor, parseWebColor } from './colorPicker.utils';
import { ColorPickerPopup } from './ColorPickerPopup';
import type { ColorFormat, WebColor } from './ColorPicker';

interface ColorPickerFieldProps {
  adornment?: ReactNode;
  color: WebColor;
  disabled?: boolean;
  offset?: number;
  onChange: (color: WebColor) => void;
  onChangeEnd: (color: WebColor) => void;
  showAlpha?: boolean;
  showColorEditor?: boolean;
  size?: 'small' | 'large';
}

export function ColorPickerField({
  adornment,
  color: color,
  disabled = false,
  offset = 0,
  onChange,
  onChangeEnd,
  showAlpha = true,
  showColorEditor = true,
  size = 'small',
}: ColorPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ColorFormat>('HEX');

  const handleColorPickerChange = useCallback(
    (color: colorPicker.Color) => {
      onChange(parseColorPickerColor(color));
    },
    [onChange],
  );

  const handleColorPickerChangeEnd = useCallback(
    (color: colorPicker.Color) => {
      onChangeEnd(parseColorPickerColor(color));
    },
    [onChangeEnd],
  );

  const onColorInputChange = useCallback(
    (color: colorPicker.Color) => {
      handleColorPickerChangeEnd(color);
    },
    [handleColorPickerChangeEnd],
  );

  const onColorBoxClick = useCallback(() => {
    if (disabled) return;
    setOpen((current) => !current);
  }, [disabled]);

  const onPickerClosed = useCallback(() => {
    setOpen(false);
  }, []);

  const triggerRef = useRef<HTMLElement>(null);

  const colorPickerValue = parseWebColor(color).toFormat('rgba');
  return (
    <>
      <ColorInput
        adornment={adornment}
        color={colorPickerValue}
        disabled={disabled}
        format={format}
        innerRef={triggerRef}
        onChange={onColorInputChange}
        onColorBoxClick={onColorBoxClick}
        showAlpha={showAlpha}
        showColorEditor={showColorEditor}
        size={size}
        withColorBox
      />
      <ColorPickerPopup
        color={colorPickerValue}
        format={format}
        offset={offset}
        onChange={handleColorPickerChange}
        onChangeEnd={handleColorPickerChangeEnd}
        onClose={onPickerClosed}
        onFormatChange={setFormat}
        isOpen={!disabled && open}
        triggerRef={triggerRef}
      />
    </>
  );
}
