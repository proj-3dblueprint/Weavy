import { I18N_KEYS } from '@/language/keys';
import type { BlendMode } from '@/designer/designer';

export const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: 'source-over', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.NORMAL },
  { value: 'add', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.ADD },
  { value: 'multiply', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.MULTIPLY },
  { value: 'screen', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.SCREEN },
  { value: 'overlay', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.OVERLAY },
  { value: 'darken', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.DARKEN },
  { value: 'lighten', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.LIGHTEN },
  { value: 'color-dodge', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.COLOR_DODGE },
  { value: 'color-burn', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.COLOR_BURN },
  { value: 'hard-light', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.HARD_LIGHT },
  { value: 'soft-light', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.SOFT_LIGHT },
  { value: 'difference', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.DIFFERENCE },
  { value: 'exclusion', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.EXCLUSION },
  { value: 'hue', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.HUE },
  { value: 'saturation', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.SATURATION },
  { value: 'color', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.COLOR },
  { value: 'luminosity', label: I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.BLEND_MODES.LUMINOSITY },
];

export function isBlendMode(value: string): value is BlendMode {
  return BLEND_MODES.some((mode) => mode.value === value);
}
