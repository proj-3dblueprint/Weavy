import { CompositorView } from '@/components/Recipe/Views/CompositorView';
import { I18N_KEYS } from '@/language/keys';
import { AngleIcon } from '@/UI/Icons/AngleIcon';
import { BLEND_MODES, isBlendMode } from '../../CompositorV2/BlendModes';
import FontsList from './FontsList';
import type { Color, BuiltInFont, Font, LayerId, Layer, VerticalAlign, HorizontalAlign } from 'web';

function degreesToRadians(a: number): number {
  return (a / 180) * Math.PI;
}
function radiansToDegrees(a: number): number {
  return (a / Math.PI) * 180;
}

export type LayerProperty =
  | 'blendMode'
  | 'color'
  | 'dimensions'
  | 'opacity'
  | 'position'
  | 'rotation'
  | 'textFont'
  | 'textItalic'
  | 'textLetterSpacing'
  | 'textLineHeight'
  | 'textSize'
  | 'textWeight'
  | 'textAlign';

export type LayerPropertyLayout = LayerPropertyLayoutSection[];
export type LayerPropertyLayoutSection = LayerPropertyLayoutRow[];
export type LayerPropertyLayoutRow = LayerProperty | LayerProperty[];

export const imageLayerPropertyLayout: LayerPropertyLayout = [
  ['position', 'dimensions', 'rotation'],
  [['opacity', 'blendMode']],
];

export const textLayerPropertyLayout: LayerPropertyLayout = [
  ['position', 'dimensions', 'rotation'],
  ['blendMode'],
  ['textFont', ['textWeight', 'textItalic'], ['textSize'], ['textLineHeight', 'textLetterSpacing'], ['textAlign']],
  ['color'],
];

export const layerPropertyGroups = {
  position: {
    label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.POSITION,
    properties: ['x', 'y'],
  },
  rotation: {
    label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.ROTATION,
    properties: ['rotation'],
  },
  dimensions: {
    label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.DIMENSIONS,
    properties: ['width', 'height'],
  },
  color: {
    label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FILL,
    properties: ['color'],
  },
  opacity: {
    label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.OPACITY,
    properties: ['opacity'],
  },
  blendMode: {
    label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODE,
    properties: ['blendMode'],
  },
  textFont: {
    label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT,
    properties: ['textFont'],
  },
  textSize: {
    label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_SIZE,
    properties: ['textSize'],
  },
  textLetterSpacing: {
    label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_LETTER_SPACING,
    properties: ['textLetterSpacing'],
  },
  textLineHeight: {
    label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_LINE_HEIGHT,
    properties: ['textLineHeight'],
  },
  textWeight: {
    label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_WEIGHT,
    properties: ['textWeight'],
  },
  textItalic: {
    label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_STYLE,
    properties: ['textItalic'],
  },
  textAlign: {
    label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_ALIGN,
    properties: ['textHorizontalAlign', 'textVerticalAlign'],
  },
} as const;

const VERTICAL_ALIGN_OPTIONS: { value: VerticalAlign; label: string }[] = [
  { value: 'top', label: 'top' },
  { value: 'center', label: 'center' },
  { value: 'bottom', label: 'bottom' },
];

const HORIZONTAL_ALIGN_OPTIONS: { value: HorizontalAlign; label: string }[] = [
  { value: 'left', label: 'left' },
  { value: 'center', label: 'center' },
  { value: 'right', label: 'right' },
];

const defaultDisplay = {
  parse: undefined,
  format: undefined,
  search: undefined,
  helperText: undefined,
  noOptionsText: undefined,
};

export const layerProperties = {
  x: {
    ...defaultDisplay,
    label: 'X',
    unit: '',
    type: 'number',
    getValue: (layer: Layer) => layer?.position?.x || 0,
    setValue: (compositorView: CompositorView, layerId: LayerId, value: number) =>
      compositorView.setLayerPositionX(layerId, value),
    decimals: 1,
  },
  y: {
    ...defaultDisplay,
    label: 'Y',
    unit: '',
    type: 'number',
    getValue: (layer: Layer) => layer?.position?.y || 0,
    setValue: (compositorView: CompositorView, layerId: LayerId, value: number) =>
      compositorView.setLayerPositionY(layerId, value),
    decimals: 1,
  },
  rotation: {
    ...defaultDisplay,
    label: <AngleIcon height={16} width={16} />,
    unit: '°',
    type: 'number',
    getValue: (layer: Layer) => (layer?.rotation as number) || 0,
    setValue: (compositorView: CompositorView, layerId: LayerId, value: number) =>
      compositorView.setLayerRotation(layerId, value),
    parse: (value: number) => degreesToRadians(value),
    format: (value: number) => radiansToDegrees(value),
    decimals: 1,
  },
  width: {
    ...defaultDisplay,
    label: 'W',
    unit: '',
    type: 'number',
    getValue: (layer: Layer) => layer?.dimension?.x || 0,
    setValue: (compositorView: CompositorView, layerId: LayerId, value: number) =>
      compositorView.setLayerWidth(layerId, value),
    decimals: 0,
  },
  height: {
    ...defaultDisplay,
    label: 'H',
    unit: '',
    type: 'number',
    getValue: (layer: Layer) => layer?.dimension?.y || 0,
    setValue: (compositorView: CompositorView, layerId: LayerId, value: number) =>
      compositorView.setLayerHeight(layerId, value),
    decimals: 0,
  },
  opacity: {
    ...defaultDisplay,
    label: '',
    unit: '%',
    type: 'number',
    getValue: (layer: Layer) => (layer?.color?.a ?? 1) * 100,
    setValue: (compositorView: CompositorView, layerId: LayerId, value: number) => {
      return compositorView.setLayerColor(layerId, { r: 255, g: 255, b: 255, a: value / 100 });
    },
    decimals: 0,
  },
  color: {
    ...defaultDisplay,
    label: '',
    unit: '',
    type: 'color',
    getValue: (layer: Layer) => layer?.color ?? { r: 255, g: 255, b: 255, a: 1.0 },
    setValue: (compositorView: CompositorView, layerId: LayerId, value: Color, ongoing: boolean) =>
      compositorView.setLayerColor(layerId, value, ongoing),
  },
  blendMode: {
    ...defaultDisplay,
    label: '',
    type: 'select',
    options: () => BLEND_MODES,
    getValue: (layer: Layer) => layer?.blendMode,
    setValue: (compositorView: CompositorView, layerId: LayerId, value: string, ongoing: boolean) => {
      if (isBlendMode(value)) {
        return compositorView.setLayerBlendMode(layerId, value, ongoing);
      } else {
        throw new Error(`invalid blend mode value: ${String(value)}`);
      }
    },
  },
  textSize: {
    ...defaultDisplay,
    label: '',
    unit: '',
    type: 'number',
    getValue: (layer: Layer) => (layer?.kind.type === 'text' ? layer?.kind.layoutOptions.size : 16),
    setValue: (compositorView: CompositorView, layerId: LayerId, value: number) => {
      return compositorView.setLayerTextSize(layerId, value, false);
    },
    decimals: 2,
  },
  textLetterSpacing: {
    ...defaultDisplay,
    label: '',
    unit: '%',
    type: 'number',
    getValue: (layer: Layer) => (layer?.kind.type === 'text' ? layer?.kind.layoutOptions.letterSpacing * 100 : 100),
    setValue: (compositorView: CompositorView, layerId: LayerId, value: number) => {
      return compositorView.setLayerTextLetterSpacing(layerId, value / 100, false);
    },
    decimals: 0,
  },
  textLineHeight: {
    ...defaultDisplay,
    label: '',
    unit: '%',
    type: 'number',
    getValue: (layer: Layer) => (layer?.kind.type === 'text' ? layer?.kind.layoutOptions.lineHeight * 100 : 100),
    setValue: (compositorView: CompositorView, layerId: LayerId, value: number) => {
      return compositorView.setLayerTextLineHeight(layerId, value / 100, false);
    },
    decimals: 0,
  },
  textVerticalAlign: {
    ...defaultDisplay,
    label: '',
    unit: '',
    type: 'toggle',
    options: () => VERTICAL_ALIGN_OPTIONS,
    getValue: (layer: Layer) =>
      layer.kind.type === 'text' ? (layer.kind.layoutOptions.verticalAlign ?? 'top') : 'top',
    setValue: (compositorView: CompositorView, layerId: LayerId, value: string, ongoing: boolean) => {
      return compositorView.setLayerTextVerticalAlign(layerId, value as VerticalAlign, ongoing);
    },
  },
  textHorizontalAlign: {
    ...defaultDisplay,
    label: '',
    unit: '',
    type: 'toggle',
    options: () => HORIZONTAL_ALIGN_OPTIONS,
    getValue: (layer: Layer) =>
      layer.kind.type === 'text' ? (layer.kind.layoutOptions.horizontalAlign ?? 'left') : 'left',
    setValue: (compositorView: CompositorView, layerId: LayerId, value: string, ongoing: boolean) => {
      return compositorView.setLayerTextHorizontalAlign(layerId, value as HorizontalAlign, ongoing);
    },
  },
  textWeight: {
    ...defaultDisplay,
    label: '',
    unit: '',
    type: 'select',
    options: (compositorView: CompositorView, layerId: LayerId) => {
      return compositorView.weightSupport(layerId).map((weight) => {
        switch (weight) {
          case 100:
            return { value: '100', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_WEIGHTS.THIN };
          case 200:
            return { value: '200', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_WEIGHTS.EXTRA_LIGHT };
          case 300:
            return { value: '300', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_WEIGHTS.LIGHT };
          case 400:
            return { value: '400', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_WEIGHTS.REGULAR };
          case 500:
            return { value: '500', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_WEIGHTS.MEDIUM };
          case 600:
            return { value: '600', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_WEIGHTS.SEMI_BOLD };
          case 700:
            return { value: '700', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_WEIGHTS.BOLD };
          case 800:
            return { value: '800', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_WEIGHTS.EXTRA_BOLD };
          case 900:
            return { value: '900', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_WEIGHTS.BLACK };
          default:
            throw new Error(`invalid font weight value: ${String(weight)}`);
        }
      });
    },
    getValue: (layer: Layer) => (layer?.kind.type === 'text' ? String(layer?.kind.fontOptions.weight) : '400'),
    setValue: (compositorView: CompositorView, layerId: LayerId, value: string, ongoing = false) => {
      return compositorView.setLayerTextWeight(layerId, Number(value), ongoing);
    },
  },
  textItalic: {
    ...defaultDisplay,
    label: '',
    unit: '',
    type: 'select',
    options: (compositorView: CompositorView, layerId: LayerId) => {
      return compositorView
        .italicSupport(layerId)
        .map((b) =>
          b
            ? { value: 'italic', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_STYLES.ITALIC }
            : { value: 'normal', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_STYLES.NORMAL },
        );
    },
    getValue: (layer: Layer) =>
      layer?.kind.type === 'text' ? (layer?.kind.fontOptions.italic ? 'italic' : 'normal') : 'normal',
    setValue: (compositorView: CompositorView, layerId: LayerId, value: string, ongoing = false) => {
      return compositorView.setLayerTextItalic(layerId, value === 'italic', ongoing);
    },
  },
  textFont: {
    ...defaultDisplay,
    label: '',
    type: 'select',
    options: () => FontsList(),
    getValue: (layer: Layer) => {
      return layer?.kind.type === 'text'
        ? layer?.kind.fontOptions.font.type === 'built_in'
          ? layer?.kind.fontOptions.font.data
          : layer?.kind.fontOptions.font.data.resourceKey
        : 'nunito';
    },
    setValue: (compositorView: CompositorView, layerId: LayerId, value: string, ongoing: boolean) => {
      let font: Font;
      const builtInFont = value as BuiltInFont;
      if (builtInFont !== undefined && builtInFont !== null) {
        font = { type: 'built_in', data: builtInFont };
      } else {
        font = { type: 'custom', data: { resourceKey: value, index: 0 } };
      }
      return compositorView.setLayerTextFont(layerId, font, ongoing);
    },
    search: true,
    helperText: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_SELECT_INPUT.HELPER_TEXT,
    noOptionsText: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FONT_SELECT_INPUT.NO_OPTIONS_TEXT,
  },
} as const;

type LayerProperties = typeof layerProperties;
export type GroupKey = keyof typeof layerPropertyGroups;
export type PropertyKey = keyof LayerProperties;
export type NumberPropertyKey = keyof {
  [K in PropertyKey as LayerProperties[K]['type'] extends 'number' ? K : never]: never;
};
export type BooleanPropertyKey = keyof {
  [K in PropertyKey as LayerProperties[K]['type'] extends 'boolean' ? K : never]: never;
};
export type SelectPropertyKey = keyof {
  [K in PropertyKey as LayerProperties[K]['type'] extends 'select' ? K : never]: never;
};
export type ColorPropertyKey = keyof {
  [K in PropertyKey as LayerProperties[K]['type'] extends 'color' ? K : never]: never;
};
export type TogglePropertyKey = keyof {
  [K in PropertyKey as LayerProperties[K]['type'] extends 'toggle' ? K : never]: never;
};
