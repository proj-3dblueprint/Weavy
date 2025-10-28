import { color } from '@/colors';

/**
 * Represents the bounds of a group node with position and dimensions
 */
export interface GroupBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Default padding around grouped nodes
 */
export const DEFAULT_GROUP_PADDING = 30;

/**
 * Label size options for custom group nodes
 */
export enum LABEL_SIZE {
  SMALL = 16,
  MEDIUM = 20,
  LARGE = 24,
}

export const fontSizeToVariantTransformer: Map<LABEL_SIZE, 'body-lg-rg' | 'body-xl-rg' | 'body-xxl-rg'> = new Map([
  [LABEL_SIZE.SMALL, 'body-lg-rg'],
  [LABEL_SIZE.MEDIUM, 'body-xl-rg'],
  [LABEL_SIZE.LARGE, 'body-xxl-rg'],
]);

export const DEFAULT_GROUP_COLOR = color.Purple64_T;
