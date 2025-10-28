/**
 * Node types that are not supported for running models
 * These nodes will show an error message when selected for running
 */
export const UNSUPPORTED_NODE_TYPES = [
  'painter',
  'painterV2',
  'merge_alpha',
  'channels',
  'masks',
  'extract_video_frame',
  'levels',
  'edit', // photopea
] as const;

/**
 * Node types that should be ignored when running selected nodes
 * These nodes will be silently filtered out from the selection
 */
export const IGNORE_NODE_TYPES = ['stickynote', 'custom_group'] as const;

export const ITERATOR_NODE_TYPES = ['muxv2', 'media_iterator'] as const;
