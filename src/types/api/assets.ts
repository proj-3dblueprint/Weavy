import { FileKind, ModelAsset } from 'web';
import { validateFile } from '@/utils/nodeInputValidation';
import { log } from '@/logger/logger';

export type AssetType = 'image' | 'video' | 'audio' | '3D' | 'text';

const logger = log.getLogger('assets');

export type TextAsset = {
  id: string;
  type: 'text';
  input?: Record<string, string | number>;
  params?: Record<string, string | number>;
  value: string;
  originalValue?: string;
};

export type MediaAsset = {
  id: string;
  duration?: number;
  fps?: number;
  height?: number;
  input?: Record<string, any>;
  params?: Record<string, any>;
  publicId: string;
  thumbnailUrl: string;
  type: AssetType;
  url: string;
  viewUrl: string;
  visualId: string;
  width?: number;
};

export type RenderingAsset = {
  type: 'rendering';
  progress?: number;
};

export type UploadedAsset = (TextAsset | MediaAsset | RenderingAsset) & {
  name?: string; // temp for design app output
  batchId?: string;
  order?: number;
  secondaryOrder?: number;
};

const validateInputInfo = (input: Record<string, any>) => {
  const array: [string, string][] = Array.from(
    Object.entries(input).map(([key, value]) => {
      if (value === undefined || value === null) {
        return [key, ''];
      }
      if (typeof value === 'object' && 'url' in value && typeof value.url === 'string') {
        return [key, value.url];
      }
      if (typeof value === 'object') {
        logger.error(`Unexpected input value for key: ${key}, value: ${JSON.stringify(value)}`);
      }
      return [key, value.toString()];
    }),
  );
  return array;
};

export function UploadedAssetToModelAsset(asset: UploadedAsset): ModelAsset {
  switch (asset.type) {
    case 'text': {
      const textAsset = asset as TextAsset;
      return {
        name: asset.name,
        batchId: asset.batchId,
        order: asset.order,
        secondaryOrder: asset.secondaryOrder,
        input: validateInputInfo(asset.input ?? {}),
        parameters: validateInputInfo(asset.params ?? {}),
        kind: { type: 'text', value: textAsset.value, originalValue: textAsset.originalValue, id: textAsset.id },
      };
    }
    case 'image':
    case 'video':
    case 'audio':
    case '3D': {
      const mediaAsset = asset as MediaAsset;
      const kind: FileKind | undefined = validateFile(mediaAsset);
      if (!kind) {
        throw new Error(`Invalid media asset: ${mediaAsset.type}`);
      }

      return {
        name: asset.name,
        batchId: asset.batchId,
        order: asset.order,
        secondaryOrder: asset.secondaryOrder,
        input: validateInputInfo(asset.input ?? {}),
        parameters: validateInputInfo(asset.params ?? {}),
        kind,
      };
    }
    default:
      throw new Error(`Unsupported asset type: ${asset.type}`);
  }
}

export function ModelAssetToUploadedAsset(asset: ModelAsset): UploadedAsset {
  const common = {
    id: asset.kind.id ?? '',
    name: asset.name,
    batchId: asset.batchId,
    order: asset.order,
    secondaryOrder: asset.secondaryOrder,
    input: Object.fromEntries(asset.input.map((v) => [v[0], v[1].toString()])),
    params: Object.fromEntries(asset.parameters.map((v) => [v[0], v[1].toString()])),
  };

  switch (asset.kind.type) {
    case 'text':
      return {
        type: 'text',
        value: asset.kind.value,
        originalValue: asset.kind.originalValue,
        ...common,
      };
    case 'image':
      return {
        type: 'image',
        url: asset.kind.url,
        publicId: asset.kind.publicId ?? '',
        thumbnailUrl: asset.kind.thumbnailUrl ?? '',
        viewUrl: '',
        visualId: '',
        width: asset.kind.width,
        height: asset.kind.height,
        ...common,
      };
    case 'video':
      return {
        type: 'video',
        url: asset.kind.url,
        publicId: asset.kind.publicId ?? '',
        thumbnailUrl: asset.kind.thumbnailUrl ?? '',
        viewUrl: '',
        visualId: '',
        width: asset.kind.width,
        height: asset.kind.height,
        duration: asset.kind.duration,
        fps: asset.kind.fps,
        ...common,
      };
    case 'audio':
      return {
        type: 'audio',
        url: asset.kind.url,
        publicId: asset.kind.publicId ?? '',
        thumbnailUrl: '',
        viewUrl: '',
        visualId: '',
        ...common,
      };
    case '3D':
      return {
        type: '3D',
        url: asset.kind.url,
        publicId: asset.kind.publicId ?? '',
        thumbnailUrl: asset.kind.thumbnailUrl ?? '',
        viewUrl: '',
        visualId: '',
        ...common,
      };
  }
}
