import type { UploadedAsset, RenderingAsset, MediaAsset, TextAsset } from '@/types/api/assets';
import type { FileKind } from '@/designer/designer';

export const isMediaAsset = (file?: UploadedAsset | FileKind): file is MediaAsset => {
  return !!file?.type && file.type !== 'text' && file.type !== 'rendering';
};

export const isRenderingAsset = (file?: UploadedAsset | FileKind): file is RenderingAsset => {
  return !!file?.type && file.type === 'rendering';
};

export const isTextAsset = (file?: UploadedAsset | FileKind): file is TextAsset => {
  return !!file?.type && file.type === 'text';
};
