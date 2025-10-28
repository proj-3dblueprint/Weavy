import * as colorPicker from '@zag-js/color-picker';
import type { WebColor } from './ColorPicker';

export const parseWebColor = (color: WebColor) => {
  return colorPicker.parse(`rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`);
};

export const parseHexColor = (color: string) => {
  return colorPicker.parse(color);
};

export const parseColorPickerColor = (color: colorPicker.Color) => {
  const rgba = color.toFormat('rgba');
  return {
    r: rgba.getChannelValue('red'),
    g: rgba.getChannelValue('green'),
    b: rgba.getChannelValue('blue'),
    a: rgba.getChannelValue('alpha'),
  };
};
