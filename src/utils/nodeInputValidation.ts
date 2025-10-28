import { log } from '@/logger/logger.ts';
import { getFileExtension, urlCanParse } from './urls';
import type { FileKind, ParameterValue, Seed } from 'web';
import type { CloudinaryVideo, ImageResult, Schema, VideoResult } from '@/types/node';

const logger = log.getLogger('nodeInputValidation');

export function validateParameterValue(
  value: unknown,
  defaultValue: unknown,
  property: Schema,
): ParameterValue | undefined {
  if (
    value !== undefined &&
    value !== null &&
    !Array.isArray(value) &&
    typeof value === 'object' &&
    'value' in value &&
    property.type !== 'seed' &&
    property.type !== 'fal_image_size'
  ) {
    value = value.value;
  }

  switch (property.type) {
    case 'number':
    case 'input-float':
    case 'input-number': {
      const number = validateNumber(value);
      if (number !== undefined) {
        return {
          type: 'float',
          value: number,
        };
      }
      if (defaultValue === undefined) {
        return {
          type: 'float',
          value: validateNumber(property.min) ?? 0.0,
        };
      }
      break;
    }

    case 'integer':
    case 'input': // backward compatability 24.10 (adding separation between input of integer and floats)
    case 'input-integer': {
      const number = validateNumber(value);
      if (number !== undefined) {
        return {
          type: 'integer',
          value: Math.round(number),
        };
      }
      if (defaultValue === undefined) {
        return {
          type: 'integer',
          value: validateInteger(property.min) ?? 0,
        };
      }
      break;
    }
    case 'boolean': {
      const boolean = validateBoolean(value);
      if (boolean !== undefined) {
        return {
          type: 'boolean',
          value: boolean,
        };
      } else if (defaultValue === undefined) {
        return {
          type: 'boolean',
          value: false,
        };
      }
      break;
    }
    case 'seed': {
      const seed = validateSeed(value);
      if (seed !== undefined) {
        return {
          type: 'seed',
          value: seed,
        };
      }
      if (defaultValue === undefined) {
        return {
          type: 'seed',
          value: {
            seed: 1,
            isRandom: false,
          },
        };
      }
      break;
    }
    case 'enum': {
      const string = validateString(value);
      if (string !== undefined && property.options?.includes(string)) {
        return {
          type: 'string',
          value: string,
        };
      }
      const number = validateNumber(value);
      if (number !== undefined && property.options?.some((item) => Number(item) === number)) {
        return {
          type: 'integer',
          value: Math.round(number),
        };
      }
      if (defaultValue === undefined && property.options && property.options.length > 0) {
        const defaultValue = property.options[0];
        return typeof defaultValue === 'number'
          ? {
              type: 'integer',
              value: Math.round(defaultValue),
            }
          : {
              type: 'string',
              value: defaultValue,
            };
      }
      break;
    }
    case 'string':
    case 'text': {
      const string = validateString(value);
      if (string !== undefined) {
        return {
          type: 'string',
          value: string,
        };
      } else if (defaultValue === undefined) {
        return {
          type: 'string',
          value: '',
        };
      }
      break;
    }
    case 'array': {
      if (value === undefined && defaultValue === undefined) {
        return { type: 'string_array', value: [''] };
      }
      const asArray = Array.isArray(value)
        ? value
        : typeof value === 'string'
          ? value.split(',').map((item) => item.trim())
          : [value];
      return {
        type: 'string_array',
        value: asArray.filter((item) => item !== undefined && item !== null).map((item) => item.toString()),
      };
    }
    case 'fal_image_size': {
      if (
        value &&
        typeof value === 'object' &&
        'width' in value &&
        'height' in value &&
        typeof value.width === 'number' &&
        typeof value.height === 'number'
      ) {
        return {
          type: 'image_size',
          value: {
            type: 'custom',
            width: value.width,
            height: value.height,
          },
        };
      } else if (typeof value === 'string') {
        return {
          type: 'image_size',
          value: {
            type: 'built_in',
            value: value,
          },
        };
      } else if (value === null) {
        return {
          type: 'image_size',
          value: {
            type: 'built_in',
            value: 'match_input',
          },
        };
      }
      break;
    }
    case 'file':
      return undefined;
    case undefined:
      return undefined;
    default: {
      const _exhaustiveCheck: never = property.type;
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      logger.error(`Invalid parameter type: ${property.type}`);
      return undefined;
    }
  }

  if (defaultValue !== undefined) {
    return validateParameterValue(defaultValue, undefined, property);
  }

  logger.error(
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    `Failed to migrate property ${property.type} with value: ${value} and default value: ${defaultValue}`,
  );
  return undefined;
}

export function validateFile(val: unknown): FileKind | undefined {
  const obj = validateObject(val);
  if (!obj) return undefined;

  const type = validateObjectField(obj, 'type', validateString);

  if (type === 'image') {
    const image = validateImage(obj);
    if (!image) return undefined;
    const thumbnailUrl = validateObjectField(obj, 'thumbnailUrl', validateString);
    const publicId = validateObjectField(obj, 'publicId', validateString);
    return { ...image, thumbnailUrl, publicId };
  }
  if (type === 'video') {
    const video = validateVideo(obj);
    if (!video) return undefined;
    const thumbnailUrl = validateObjectField(obj, 'thumbnailUrl', validateString);
    const publicId = validateObjectField(obj, 'publicId', validateString);
    return { ...video, thumbnailUrl, publicId };
  }
  if (type === '3D') {
    return validate3D(obj);
  }
  if (type === 'audio') {
    return validateAudio(obj);
  }
  return undefined;
}

function isDataUrl(url: string | undefined): boolean {
  return typeof url === 'string' && url.startsWith('data:');
}
export function validateImage(val: unknown): ImageResult | undefined {
  const obj = validateObject(val);
  if (!obj) return;

  const url = validateObjectField(obj, 'url', validateString);
  const width = validateObjectField(obj, 'width', validateNumber);
  const height = validateObjectField(obj, 'height', validateNumber);
  const id = validateObjectField(obj, 'id', validateString);
  if (url && !isDataUrl(url) && !id) {
    logger.warn('AssetIdValidationError: missing id in validateImage', obj);
  }
  return url && width && height
    ? { type: 'image', url, width: Math.round(width), height: Math.round(height), id }
    : undefined;
}

const DEFAULT_FPS = 30;
const VALID_VIDEO_EXTENSIONS = [
  '.mp4',
  '.webm',
  '.mov',
  '.avi',
  '.flv',
  '.3gp',
  '.mpg',
  '.mpeg',
  '.wmv',
  '.ogg',
  '.avchd',
  '.mkv',
  '.f4v',
];

function validateVideo(obj: object): VideoResult | undefined {
  const url = validateObjectField(obj, 'url', validateString);
  const width = validateObjectField(obj, 'width', validateNumber);
  const height = validateObjectField(obj, 'height', validateNumber);
  const duration = validateObjectField(obj, 'duration', validateNumber);
  const fps = validateObjectField(obj, 'fps', validateNumber);
  const id = validateObjectField(obj, 'id', validateString);
  if (typeof fps === 'undefined' && typeof duration === 'undefined' && url) {
    if (!urlCanParse(url)) {
      return undefined;
    }
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    if (!VALID_VIDEO_EXTENSIONS.some((ext) => pathname.includes(ext))) {
      return undefined;
    }
  }
  if (url && !isDataUrl(url) && !id) {
    logger.warn('AssetIdValidationError: missing id in validateVideo', obj);
  }
  return url && width && height
    ? {
        type: 'video',
        url,
        width: Math.round(width),
        height: Math.round(height),
        duration: duration ?? 1,
        fps: Math.round(fps || DEFAULT_FPS),
        id,
      }
    : undefined;
}

function validate3D(obj: object): FileKind | undefined {
  const url = validateObjectField(obj, 'url', validateString);
  const thumbnailUrl = validateObjectField(obj, 'thumbnailUrl', validateString);
  const publicId = validateObjectField(obj, 'publicId', validateString);
  const id = validateObjectField(obj, 'id', validateString);
  if (url && !isDataUrl(url) && !id) {
    logger.warn('AssetIdValidationError: missing id in validate3D', obj);
  }
  return url ? { type: '3D', url, thumbnailUrl, publicId, id } : undefined;
}

function validateAudio(obj: object): FileKind | undefined {
  const url = validateObjectField(obj, 'url', validateString);
  const publicId = validateObjectField(obj, 'publicId', validateString);
  const id = validateObjectField(obj, 'id', validateString);
  if (url && !isDataUrl(url) && !id) {
    logger.warn('AssetIdValidationError: missing id in validateAudio', obj);
  }
  return url ? { type: 'audio', url, publicId, id } : undefined;
}

export function validateCloudinaryVideo(val: unknown): CloudinaryVideo | undefined {
  const obj = validateObject(val);
  if (!obj) return undefined;

  const video = validateVideo(obj);
  if (!video) return undefined;

  const publicId = validateObjectField(obj, 'publicId', validateString);
  const transformations = validateObjectField(obj, 'transformations', (v) => (Array.isArray(v) ? v : undefined));
  const cloudinaryType = validateObjectField(obj, 'cloudinaryType', (v) => (v === 'video' ? v : undefined));
  const suffix = getFileExtension(video.url, 'video');

  if (!publicId) return undefined;
  return {
    ...obj,
    ...video,
    publicId,
    transformations,
    cloudinaryType,
    suffix,
  };
}

function validateObject(val: unknown): object | undefined {
  return typeof val === 'object' && val !== null ? val : undefined;
}
function validateObjectField<T>(obj: object, key: string, validator: (v: unknown) => T): T | undefined {
  return key in obj ? validator(obj[key]) : undefined;
}

export function validateNumber(val: unknown): number | undefined {
  return typeof val === 'number' ? val : undefined;
}

export function validateInteger(val: unknown): number | undefined {
  return typeof val === 'number' ? Math.round(val) : undefined;
}

function validateArray(val: unknown): unknown[] | undefined {
  const obj = validateObject(val);
  if (!obj) return undefined;
  return Array.isArray(obj) ? obj : undefined;
}

function validateBoolean(val: unknown): boolean | undefined {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'object' && val !== null && 'value' in val && typeof val.value === 'boolean') return val.value;
  return undefined;
}

function validateSeed(val: unknown): Seed | undefined {
  if (
    typeof val === 'object' &&
    val !== null &&
    'seed' in val &&
    typeof val.seed === 'number' &&
    'isRandom' in val &&
    typeof val.isRandom === 'boolean'
  )
    return { seed: val.seed, isRandom: val.isRandom };
  return undefined;
}

export function validateString(val: unknown): string | undefined {
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null && 'value' in val && typeof val.value === 'string') return val.value;
  return undefined;
}

export function validateStringArray(val: unknown): string[] | undefined {
  const arr = validateArray(val);
  if (!arr) return undefined;
  if (arr.every((item) => validateString(item) !== undefined)) {
    return arr as string[];
  }
}

export function validateNumberArray(val: unknown): number[] | undefined {
  const arr = validateArray(val);
  if (!arr) return undefined;
  if (arr.every((item) => validateNumber(item) !== undefined)) {
    return arr as number[];
  }
}
