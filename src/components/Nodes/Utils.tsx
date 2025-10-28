import cloneDeep from 'lodash/cloneDeep';
import mimeDB from 'mime-db';
import { TextField, Typography, OutlinedInput, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import JSZip from 'jszip';
import { format } from 'date-fns';
import { log } from '@/logger/logger.ts';
// import { Video } from '@/UI/Video/Video';
import { getFileExtension } from '@/utils/urls';
import { getAxiosInstance } from '@/services/axiosConfig';
import { clampValue } from '@/utils/numbers';
import { ModelType } from '@/enums/model-type.enum';
import { color } from '@/colors';
import ThreeDeeViewer from './ThreeDeeViewer';
import type { MediaAsset } from '@/types/api/assets';
import type { Model, ModelBaseNodeData } from '@/types/nodes/model';
import type { WorkflowRole, ModelPricesMaps } from '@/state/workflow.state';
import type { ModelPrice } from '@/types/api/modelPrice';
import type { Edge, MergeAlphaData, Node, Schema } from '@/types/node';

// import AnyLLMIcon from '@/UI/Icons/sidebar/

const logger = log.getLogger('Utils');
const axiosInstance = getAxiosInstance();

export const ExtraSmallFontTextField = styled(TextField)`
  & .MuiInputBase-root,
  & {
    font-size: 0.6rem;
  }

  & .MuiSelect-select {
    padding: 4px 6px;
  }

  & .MuiOutlinedInput-notchedOutline {
    border-radius: 4px;
  }
`;

export const SmallFontTextField = styled(TextField)`
  & .MuiInputBase-root,
  & {
    font-size: 0.8rem;
  }

  & .MuiOutlinedInput-notchedOutline {
    border-radius: 4px;
  }
`;

export const getImageDimensions = async (image: string) => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const width = img.width;
      const height = img.height;
      resolve({ width, height });
    };

    img.onerror = (error) => {
      logger.error('Failed to load image', error);
      reject(new Error('Failed to load image'));
    };

    img.src = image;
  });
};

export const getFileDimensions = (file: string, type: 'image' | 'video') => {
  return new Promise((resolve, reject) => {
    // For images
    if (type === 'image') {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = file;
    }
    // For videos
    else if (type === 'video') {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve({ width: video.videoWidth, height: video.videoHeight });
      };
      video.onerror = reject;
      video.src = file;
    } else {
      reject(new Error('Unsupported file type'));
    }
  });
};

export const extractInputSchemaDetails = (
  jsonData: { openapi_schema: Record<string, any> },
  service: 'fal' | 'civit' | 'replicate' | null = null,
) => {
  const schemas = jsonData.openapi_schema?.components?.schemas || {};
  const inputSchema = schemas.Input?.properties || {};
  const requiredKeys = schemas.Input?.required || [];
  const extractedDetails: Record<string, unknown> = {};

  Object.entries(inputSchema as Record<string, any>).forEach(([propName, propInfo]) => {
    const propDetails: Record<string, unknown> = { type: propInfo.type };

    // skip sync_mode as it's not supported (returns a base64 video file)
    if (service === 'fal' && propName === 'sync_mode') return;
    // support array of diffrent types
    if (propInfo.type === 'array') {
      propDetails.array_type = propInfo.items.type;
    }

    // Include default values
    if (propInfo.default !== undefined) {
      propDetails.default = propInfo.default;
    }

    // Handle enums directly within the property
    if (propInfo.enum) {
      propDetails.options = propInfo.enum;
    }

    if (service === 'fal') {
      // Fixing Fal's "anyOf" mess
      if (propInfo?.anyOf) {
        if (propInfo?.anyOf?.[0]?.enum) {
          propDetails.options = propInfo.anyOf[0].enum;
        }
        if (propInfo?.anyOf?.[0]?.type === 'string') {
          propDetails.type = 'string';
        }
        if (propInfo?.anyOf?.[0]?.type === 'integer') {
          propDetails.type = 'integer';
          if (typeof propInfo?.anyOf?.[0]?.minimum === 'number') {
            propDetails.min = propInfo.anyOf[0].minimum;
          }
          if (typeof propInfo?.anyOf?.[0]?.maximum === 'number') {
            propDetails.max = propInfo.anyOf[0].maximum;
          }
        }
      }
      // Handle anyOf with both schema references and enum options (e.g., image_size)
      handleImageSizeProperty(propInfo, propName, propDetails);
    }

    // Handle min and max for numbers and integers
    if (propInfo.type === 'number' || propInfo.type === 'integer') {
      if (propInfo.minimum !== undefined) {
        propDetails.min = propInfo.minimum;
      }
      if (propInfo.maximum !== undefined) {
        propDetails.max = propInfo.maximum;
      }
      if (propInfo.minimum === undefined && propInfo.maximum === undefined) {
        // I assume it's not a slider but an input box
        if (propInfo.type === 'number') {
          propDetails.type = 'input-number';
        } else propDetails.type = 'input-integer';
      }
    }

    if (propName === 'Seed' || propName === 'seed') {
      propDetails.type = 'seed';
    }
    // Resolve references to other schemas and extract details
    // if (propInfo['allOf']) {
    //   const referencedSchema = resolveRef(propInfo['allOf'][0]['$ref']);
    //   // If the referenced schema is an enum, extract its options
    //   if (referencedSchema.enum) {
    //     propDetails.ref = propName;
    //     propDetails.options = referencedSchema.enum;
    //     propDetails.type = "enum";
    //   }
    //   // Extend to include other details from the referenced schema as needed
    // }
    if (propDetails.options && propDetails.type !== 'fal_image_size') {
      propDetails.type = 'enum';
    }

    /// fix name to be presentable
    function capitalizeWords(str: string) {
      return str
        .replace(/_/g, ' ') // Replace underscores with spaces
        .split(' ') // Split the string into words
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
        .join(' '); // Rejoin the words into a single string
    }
    /// title
    propDetails.title = capitalizeWords(propName);
    /// description
    propDetails.description = propInfo['description'];
    if (propName === 'seed' || propName === 'Seed') {
      propDetails.description = 'Seed value for random number generator. Uncheck for reproducible results.';
    }
    /// order
    propDetails.order = propInfo['x-order'];
    propDetails.required = requiredKeys.includes(propName) ? true : false;
    propDetails.format = propInfo['format'];

    // normalize seed names
    if (propName === 'seed' || propName === 'Seed') {
      propName = 'seed';
    }
    if (propDetails.type === undefined) {
      logger.error(`property type is undefined for ${propName}`);
    }
    extractedDetails[propName] = propDetails;
  });

  const sortedDetailsArray = Object.entries(extractedDetails).sort((a, b) => {
    const orderA = Number((a[1] as Record<string, unknown>).order) || 0; // Provide a default order if undefined
    const orderB = Number((b[1] as Record<string, unknown>).order) || 0; // Provide a default order if undefined

    return Number.isNaN(orderA) ? 0 : orderA - (Number.isNaN(orderB) ? 0 : orderB);
  });

  // Convert the sorted array back into an object
  const sortedExtractedDetails = sortedDetailsArray.reduce((acc, [key, value]) => {
    acc[key] = value;

    return acc;
  }, {});

  return sortedExtractedDetails;
};

const isFile = (conf: unknown): conf is { url: string; type: string } => {
  return !!conf && typeof conf === 'object' && 'url' in conf && typeof conf.url === 'string' && 'type' in conf;
};

const isMergeAlphaData = (data: unknown): data is MergeAlphaData => {
  return !!data && typeof data === 'object' && 'inputNode' in data;
};

export function sanitizeNodes(nodesToSanitize: Node[]) {
  const clonedNodes = cloneDeep(nodesToSanitize);
  // Now you can safely modify sanitizedNode since it's deeply cloned
  return clonedNodes.map((node) => {
    if (node.data.output) {
      for (const [name, conf] of Object.entries(node.data.output)) {
        if (
          conf?.type === 'image' &&
          (conf?.url.includes('data:image/png;base64') || conf?.url.includes('data:image/jpeg;base64'))
        ) {
          node.data.output[name].url = '';
        }
      }
    }

    if (node.data.input) {
      for (const [name, conf] of Object.entries(node.data.input)) {
        if (!isFile(conf)) {
          continue;
        }
        if (
          conf?.type === 'image' &&
          (conf?.url.includes('data:image/png;base64') || conf?.url.includes('data:image/jpeg;base64'))
        ) {
          node.data.input[name].url = '';
        }
      }
    }
    if (node.data.result && typeof node.data.result === 'object' && 'url' in node.data.result) {
      if (
        typeof node.data.result.url === 'string' &&
        (node.data.result.url.includes('data:image/png;base64') ||
          node.data.result.url.includes('data:image/jpeg;base64'))
      ) {
        node.data.result.url = '';
      }
    }

    if (Array.isArray(node.data.result)) {
      for (const result of node.data.result) {
        if (result.params && Object.entries(result.params)) {
          for (const [name, conf] of Object.entries(result.params)) {
            if (!isFile(conf)) {
              continue;
            }
            if (
              conf.type === 'image' &&
              (conf.url.includes('data:image/png;base64') || conf.url.includes('data:image/jpeg;base64'))
            ) {
              result.params[name].url = '';
            }
          }
        }
        if (result.input && Object.entries(result.input)) {
          for (const [name, conf] of Object.entries(result.input)) {
            if (!isFile(conf)) {
              continue;
            }
            if (
              conf.type === 'image' &&
              (conf.url.includes('data:image/png;base64') || conf.url.includes('data:image/jpeg;base64'))
            ) {
              result.input[name].url = '';
            }
          }
        }
      }
    }
    if (
      typeof node.data.result === 'object' &&
      node.data.result &&
      'params' in node.data.result &&
      typeof node.data.result.params === 'object' &&
      node.data.result.params
    ) {
      for (const [name, conf] of Object.entries(node.data.result.params)) {
        if (!isFile(conf)) {
          continue;
        }
        if (conf.type === 'image' && conf.url.includes('data:image/png;base64')) {
          node.data.result.params[name].url = '';
        }
      }
    }

    if ('layers' in node.data && node.data.layers && typeof node.data.layers === 'object') {
      for (const [name, conf] of Object.entries(node.data.layers)) {
        if (!isFile(conf)) {
          continue;
        }
        if (conf.type === 'image' && conf.url.includes('data:image/png;base64')) {
          node.data.layers[name].url = '';
        }
      }
    }
    if (
      node.type === 'compv3' &&
      'data' in node.data &&
      node.data.data &&
      typeof node.data.data === 'object' &&
      'input' in node.data.data &&
      Array.isArray(node.data.data.input)
    ) {
      for (const [i, input] of node.data.data.input.entries()) {
        // dynamic compositor input will be filled in at runtime
        if (input[1]?.file?.url.includes('data:image/png;base64')) {
          node.data.data.input[i][1].file = undefined;
        }
      }
    }
    if (isMergeAlphaData(node.data) && node.data.inputNode?.file?.url.includes('data:image/png;base64')) {
      node.data.inputNode.file = undefined;
    }
    if (isMergeAlphaData(node.data) && node.data.alphaInput?.file?.url.includes('data:image/png;base64')) {
      node.data.alphaInput.file = undefined;
    }

    return node;
  });
}

const handleImageSizeProperty = (propInfo: any, propName: string, propDetails: Record<string, unknown>) => {
  if (propInfo?.anyOf) {
    const hasSchemaRef = propInfo.anyOf.some((item) => item['$ref']);
    const enumItem = propInfo.anyOf.find((item) => item.enum);

    if (hasSchemaRef && enumItem && propName === 'image_size') {
      propDetails.type = 'fal_image_size';
      // Add "Default" (Custom) option for when user wants to input custom dimensions
      propDetails.options = ['Default', ...enumItem.enum];
      propDetails.default = null; // Default to "Match Input Image" (null value)
    }
  }
};
export function getMediaArray(nodes: Node[]): MediaAsset[] {
  const newMediaMap = new Map<string, MediaAsset>(); // Use a Map to track unique media objects by URL

  for (const node of nodes) {
    // Check if node.data.result is present and handle both single object and array cases
    if (node.data.result) {
      const results: unknown[] = Array.isArray(node.data.result) ? node.data.result : [node.data.result];
      for (const result of results) {
        if (
          result &&
          typeof result === 'object' &&
          'type' in result &&
          (result.type === 'image' || result.type === 'video' || result.type === 'audio') &&
          'url' in result &&
          typeof result.url === 'string' &&
          result.url &&
          !result.url.includes('data:image/png;base64')
        ) {
          // Only add the object if the URL is not already in the Map
          if (!newMediaMap.has(result.url)) {
            const { ...filteredResult } = result; // added this 4.10.24 to exclude the params and input from the media library to avoid issues with saving (cannot save base64 strings)
            newMediaMap.set(result.url, filteredResult as MediaAsset);
          }
        }
      }
    }

    // Handle node.data.file similarly if needed
    const nodeData: object = node.data;
    if (
      'file' in nodeData &&
      nodeData.file &&
      typeof nodeData.file == 'object' &&
      'type' in nodeData.file &&
      (nodeData.file.type === 'image' || nodeData.file.type === 'video') &&
      'url' in nodeData.file &&
      typeof nodeData.file.url === 'string' &&
      nodeData.file.url
    ) {
      if (!newMediaMap.has(nodeData.file.url)) {
        newMediaMap.set(nodeData.file.url, nodeData.file as MediaAsset);
      }
    }
  }

  return Array.from(newMediaMap.values());
}

export const sanitizeEdges = (edgesToSanitize: Edge[], nodes: Node[]) => {
  const nodeMap = new Set(nodes.map((node) => node.id));
  return edgesToSanitize.filter((edge) => {
    return nodeMap.has(edge.source) && nodeMap.has(edge.target);
  });
};

export const sanitizeRecipe = (nodes: Node[], edges: Edge[]) => {
  const sanitizedNodes = sanitizeNodes(nodes);
  const sanitizedEdges = sanitizeEdges(edges, sanitizedNodes);

  return { nodes: sanitizedNodes, edges: sanitizedEdges };
};

/// No longer used?
// function performMatteChoke(imageData, amount) {
//   const width = imageData.width;
//   const height = imageData.height;
//   const data = new Uint8ClampedArray(imageData.data);
//   const result = new Uint8ClampedArray(data.length);

//   const threshold = 128;
//   const iterations = Math.abs(amount);
//   const expand = amount > 0;

//   for (let i = 0; i < iterations; i++) {
//     for (let y = 0; y < height; y++) {
//       for (let x = 0; x < width; x++) {
//         const idx = (y * width + x) * 4;
//         let sum = 0;
//         let count = 0;

//         // Check neighboring pixels
//         for (let dy = -1; dy <= 1; dy++) {
//           for (let dx = -1; dx <= 1; dx++) {
//             const nx = x + dx;
//             const ny = y + dy;
//             if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
//               const nidx = (ny * width + nx) * 4;
//               sum += data[nidx] > threshold ? 1 : 0;
//               count++;
//             }
//           }
//         }

//         // Determine if the pixel should be white or black
//         const shouldBeWhite = expand ? sum > 0 : sum === count;
//         const value = shouldBeWhite ? 255 : 0;

//         // Set the result pixel
//         result[idx] = result[idx + 1] = result[idx + 2] = value;
//         result[idx + 3] = 255; // Alpha channel
//       }
//     }

//     // Copy result back to data for next iteration
//     data.set(result);
//   }

//   return new ImageData(result, width, height);
// }

// export function matteChoker2(base64Image, amount) {
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.onload = () => {
//       const canvas = document.createElement('canvas');
//       const ctx = canvas.getContext('2d');

//       if (!ctx) {
//         reject(new Error('Failed to get canvas context'));
//         return;
//       }

//       canvas.width = img.width;
//       canvas.height = img.height;
//       ctx.drawImage(img, 0, 0);

//       const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//       const chokedImageData = performMatteChoke(imageData, amount);

//       ctx.putImageData(chokedImageData, 0, 0);
//       resolve(canvas.toDataURL());
//     };
//     img.onerror = reject;
//     img.src = base64Image;
//   });
// }

// bria register image
export const registerImageUtil = async (url: string) => {
  const res = await axiosInstance.post<{ visualId: string }>('/v1/models/image/register', { url });

  return res.data.visualId;
};

// No longer used?
// export const flattenMenuItems = (items, searchTerm) => {
//   let flatItems = [];
//   const uniqueIds = new Set();

//   const searchAndFlatten = (item) => {
//     Object.keys(item).forEach((key) => {
//       const currentItem = item[key];

//       // Check if we have a valid item without children
//       if (!currentItem.children && currentItem.id && !uniqueIds.has(currentItem.id)) {
//         const searchTermLower = searchTerm.toLowerCase();

//         // Check displayName
//         const matchesDisplayName = currentItem.displayName.toLowerCase().includes(searchTermLower);

//         // Check aliases
//         const matchesAlias = currentItem.alias?.some((alias) => alias.toLowerCase().includes(searchTermLower));

//         if (matchesDisplayName || matchesAlias) {
//           flatItems.push(currentItem);
//           uniqueIds.add(currentItem.id);
//         }
//       }

//       // Continue searching in children
//       if (currentItem.children) {
//         searchAndFlatten(currentItem.children);
//       }
//     });
//   };

//   searchAndFlatten(items);

//   return flatItems;
// };

export const cleanParamsForSaving = (params: ModelBaseNodeData['params'], latestSeed: number) => {
  const cleanParams = cloneDeep(params);
  if (cleanParams && cleanParams.seed) {
    cleanParams.seed = latestSeed;
  }

  return cleanParams;
};

/// IMAGE processing functions

export function rgbaToRgb(imageUrl: string, format = 'jpeg') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Enable cross-origin if needed
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Set the canvas size to match the image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0);

      // Convert the canvas back to a data URL in the desired format
      const rgbImageUrl = canvas.toDataURL(`image/${format}`);

      // Cleanup: remove the canvas
      canvas.remove();

      resolve(rgbImageUrl);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image.'));
    };
  });
}

/**
 * Negates the colors of an image from a URL or base64 string.
 * @param {string} imageSource - URL or base64 string of the image
 * @returns {Promise<string>} Promise that resolves to a base64 string of the negated image
 */
export async function negateImageColors(imageSource: string) {
  // Create an off-screen canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Create and load the image
  const image = new Image();
  image.crossOrigin = 'Anonymous'; // Enable CORS if needed

  // Wait for the image to load
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = imageSource;
  });

  // Set canvas size to match image
  canvas.width = image.width;
  canvas.height = image.height;

  // Draw image to canvas
  ctx.drawImage(image, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Invert colors
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = 255 - imageData.data[i]; // Red
    imageData.data[i + 1] = 255 - imageData.data[i + 1]; // Green
    imageData.data[i + 2] = 255 - imageData.data[i + 2]; // Blue
    // Alpha channel (i + 3) remains unchanged
  }

  // Put the negated image data back
  ctx.putImageData(imageData, 0, 0);

  // Return as base64 string
  return canvas.toDataURL('image/png');
}

export const getHandleId = (nodeId, handleType, handleName) => {
  return `${nodeId}-${handleType}-${handleName}`;
};

/// programmatic node creation utils
export const getNodeTemplates = (type: string, param: unknown, schema: Schema) => {
  switch (type) {
    case 'number':
    case 'integer':
    case 'input-number':
    case 'input-integer': {
      const mode = schema.type === 'integer' || schema.type === 'input-integer' ? 'integer' : 'number';

      return {
        handleName: 'number',
        template: {
          id: 'JbQzwNX9qVhHP59o5yS1Clone',
          type: 'number',
          initialData: {
            name: schema.title,
            description: schema.description,
            result: clampValue(Number(param), Number(schema.min), Number(schema.max)),
            min: schema.min,
            max: schema.max,
            step: schema.step,
            mode: mode,
          },
        },
      };
    }
    case 'boolean':
      return {
        handleName: 'option',
        template: {
          id: 'UpdngxSEck7aHx92LkSgClone',
          initialData: {
            name: schema.title,
            description: schema.description,
            value: param,
          },
        },
      };
    case 'enum': {
      const isNumber = (schema.options as unknown[]).every((item) => typeof item === 'number');
      const i = (schema.options as unknown[]).indexOf(param);
      const index = i >= 0 && schema.options && i < schema.options.length ? i : 0;
      return {
        handleName: 'option',
        template: {
          id: isNumber ? 'number_selector' : 'K4Bi14QsmaOKQMHpZstoClone',
          initialData: {
            name: schema.title,
            description: schema.description,
            selectedIndex: index,
            params: {
              options: schema.options,
            },
            result: index,
          },
        },
      };
    }
    case 'text':
      return {
        handleName: 'text',
        template: {
          id: 'iB0UfxX3z6c1LCTaLH65Clone',
          initialData: {
            name: schema.title,
            description: schema.description,
            result: { string: param },
          },
        },
      };
    case 'array':
      return {
        handleName: 'array',
        template: {
          id: 'E4Lo1vBJYlSjvgs0LtcSClone',
          initialData: {
            name: schema.title,
            description: schema.description,
            array: param ? (Array.isArray(param) ? param.map(String) : param) : [''],
            placeholder: `${String(schema.title)} item`,
          },
        },
      };
    case 'seed':
      return {
        handleName: 'seed',
        template: {
          id: 'HMTea9nBdmeBeoCAdxvzClone',
          initialData: {
            name: schema.title,
            description: schema.description,
            result: param as { isRandom: boolean; seed: number },
            isRandom: (param as { isRandom: boolean }).isRandom,
            seed: (param as { seed: number }).seed,
          },
        },
      };
  }
};

/**

Determines the model type based on the provided model object.
@param {Object} model - The model object to evaluate.
@param {'replicate' | 'civit' | null=} model.service - The service type of the model.
@param {string} model.name - The name of the model.
@returns {ModelType} The determined model type.
*/
export const getModelType = (model: Partial<Model>) => {
  if (
    model.service === ModelType.Replicate.valueOf() ||
    model.service === ModelType.Civit.valueOf() ||
    model.service === ModelType.FalImported.valueOf()
  ) {
    return model.service as ModelType;
  }

  const enumValues = Object.values(ModelType).map((value) => value.valueOf());
  if (model.name && enumValues.includes(model.name)) {
    return model.name as ModelType;
  }

  if (model.name?.includes('/civitai.com')) {
    return ModelType.Civit;
  }

  if (model.name?.includes('/fal.ai') || model.name?.includes('fal-ai')) {
    return ModelType.FalImported;
  }

  return ModelType.Replicate;
};

const findPriceByVariantAndExtraData = (
  modelPrices: ModelPrice[],
  modelName: string | null,
  extraData: string | null,
) => {
  if (modelName && extraData) {
    const exactMatch = modelPrices.find((obj) => obj.modelVariant === modelName && obj.extraData === extraData);
    if (exactMatch) {
      return exactMatch;
    }
  }

  // Priority 2: Match modelVariant only
  if (modelName) {
    const variantMatch = modelPrices.find((obj) => obj.modelVariant === modelName);
    if (variantMatch) {
      return variantMatch;
    }
  }
  // Priority 3: Match extraData only
  if (extraData) {
    const extraDataMatch = modelPrices.find((obj) => obj.extraData === extraData);
    if (extraDataMatch) {
      return extraDataMatch;
    }
  }
};

export const RELEVANT_PRICING_MODEL_PARAMS = [
  'duration',
  'quality',
  'motion_mode',
  'rendering_speed',
  'resolution',
  'model',
] as const;

export const getModelPrice = (
  model: Partial<Model>,
  modelPricesMaps: ModelPricesMaps,
  modelInput: ModelBaseNodeData['params'],
) => {
  if (!modelPricesMaps?.modelsByType?.size) {
    return;
  }

  const modelName = model.name;
  const modelType = getModelType(model);

  // Try lookup by model name first and type after
  let modelPrices: ModelPrice[] | undefined;
  if (modelName && (modelType === ModelType.Replicate || modelType === ModelType.FalImported)) {
    modelPrices = modelPricesMaps.modelsByName.get(modelName);
  } else {
    modelPrices = modelPricesMaps.modelsByType.get(modelType);
  }
  if (!modelPrices?.length) {
    // todo: send an unknown model to stripe
    return modelPricesMaps.defaultPrice;
  }

  if (modelPrices.length === 1) {
    return modelPrices[0].credits;
  }

  const duration = modelInput?.duration ? String(modelInput.duration) : null;
  const quality = modelInput?.quality ? String(modelInput.quality) : null;
  const resolution = modelInput?.resolution ? String(modelInput.resolution) : null;
  const motion_mode = modelInput?.motion_mode ? String(modelInput.motion_mode) : null;
  const inputModel = modelInput?.model ? String(modelInput.model) : null;
  const rendering_speed = modelInput?.rendering_speed ? String(modelInput.rendering_speed) : null;
  const extraData = duration || quality || motion_mode || rendering_speed || resolution;

  const foundPrice = findPriceByVariantAndExtraData(modelPrices, inputModel, extraData);
  if (foundPrice) {
    return foundPrice.credits;
  }

  // If nothing matched, just fallback to the first available price
  return modelPrices[0].credits;
};

export const hasEditingPermissions = (role: WorkflowRole | null, data: { isLocked?: boolean }) => {
  if (role !== 'editor') {
    return false;
  }
  if (data.isLocked) {
    return false;
  }

  return true;
};

export const uploadFile = async (
  acceptedFiles: File[],
  setUploadProgress: (progress: number) => void,
  uploadSuccess: (data: MediaAsset) => void,
  setHasError: (hasError: boolean) => void,
) => {
  if (acceptedFiles.length > 0) {
    const file = acceptedFiles[0];

    const formData = new FormData();
    formData.append('file', file);
    if (file.type || file.name.toLowerCase().endsWith('.heic')) {
      formData.append('type', file.type || 'image/heic');
    }
    // formData.append("media_metadata", true);

    try {
      setUploadProgress(0); // Initialize the progress bar
      const response = await axiosInstance.post<MediaAsset>(`/v1/assets/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 95) / (progressEvent.total || (progressEvent.loaded || 1) * 100),
          );
          setUploadProgress(progress);
        },
      });

      uploadSuccess(response.data);
    } catch (error) {
      logger.error('Error uploading file', error);
      setHasError(true);
    } finally {
      setUploadProgress(0); // Reset the progress bar
    }
  }
};

function VideoPlayer({ mediaUrl }: { mediaUrl: string }) {
  return (
    <Box sx={{ position: 'relative' }}>
      <video src={mediaUrl} crossOrigin="anonymous" draggable="false" width="100%" controls loop />
      {/* <Video draggable="false" crossOrigin="anonymous" src={mediaUrl} /> */}
    </Box>
  );
}

export function renderMediaElement(
  mediaUrl: string,
  mediaType: string,
  containerSize: {
    w: number;
    h: number;
  },
) {
  if (!mediaUrl || !mediaType) {
    return null; // or a default placeholder
  }
  switch (true) {
    case mediaType.includes('video'):
      return <VideoPlayer mediaUrl={mediaUrl} />;
    case mediaType.includes('image'):
      return (
        <>
          <img
            draggable="false"
            src={mediaUrl}
            width="100%"
            height="100%"
            alt="Media"
            style={{ display: 'block', objectFit: 'contain' }}
          />
        </>
      );
    case mediaType.includes('audio'):
      return (
        <audio
          draggable="false"
          crossOrigin="anonymous"
          src={mediaUrl}
          controls
          style={{ display: 'block', width: '100%' }}
        />
      );
    case mediaType.includes('3D'):
      return (
        <Box className="nodrag">
          <ThreeDeeViewer objUrl={mediaUrl} containerSize={containerSize} />
        </Box>
      );
    // Add more cases for other types
    default:
      return <Typography variant="body-std-rg">Preview</Typography>;
  }
}

export const SmallOutlinedInput = styled(OutlinedInput)`
  & .MuiInputBase-root,
  & {
    font-size: 0.6rem;
    height: 26px;
  }

  & .MuiInputBase-input {
    padding: 4px 6px;

    /* Remove arrows from number input */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    /* Firefox */
    &[type='number'] {
      -moz-appearance: textfield;
    }
  }

  & .MuiOutlinedInput-notchedOutline {
    border-radius: 4px;
  }

  & .MuiInputAdornment-root {
    font-size: 0.65rem;
  }

  // Change selection outline to white
  &.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: ${color.Yambo_Idle_Icon} !important;
    border-width: 1px;
  }

  // Also ensure the fieldset border is white when focused
  & fieldset {
    &.Mui-focused {
      border-color: ${color.Yambo_Idle_Icon} !important;
    }
  }

  max-width: 70px;
  margin-left: 8px;
`;

export const ExtraSmallOutlinedInput = styled(OutlinedInput)`
  & .MuiInputBase-root,
  & {
    font-size: 0.6rem;
    height: 26px;
    background-color: ${color.Black100};
  }

  & .MuiInputBase-input {
    padding: 4px 6px;

    /* Remove arrows from number input */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    /* Firefox */
    &[type='number'] {
      -moz-appearance: textfield;
    }
  }

  & .MuiOutlinedInput-notchedOutline {
    border-radius: 4px;
  }

  & .MuiInputAdornment-root {
    font-size: 0.65rem;
  }

  // Change selection outline to white
  &.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: ${color.Yambo_Idle_Icon} !important;
    border-width: 1px;
  }

  // Also ensure the fieldset border is white when focused
  & fieldset {
    &.Mui-focused {
      border-color: ${color.Yambo_Idle_Icon} !important;
    }
  }

  max-width: 70px;
  margin-left: 8px;
`;

export function getMimeType(extension) {
  for (const mimeType in mimeDB) {
    const info = mimeDB[mimeType];
    if (info.extensions && info.extensions.includes(extension)) {
      return mimeType;
    }
  }
  return 'application/octet-stream';
}

// Shared utility function for traditional download fallback
const downloadWithFallback = async (getBlob: () => Promise<Blob | undefined>, fileName: string) => {
  const blob = await getBlob();
  if (!blob) {
    logger.error('No blob found for file', fileName);
    return;
  }
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Shared utility function for File System Access API save functionality
const saveFileWithPicker = async ({ getBlob, fileName, fileType, mimeType }) => {
  try {
    const extension = getFileExtension(fileName, fileType);
    const fileExtension = extension ? `.${extension}` : '';
    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
      types: [
        {
          description: fileType || 'File',
          accept: mimeType
            ? {
                [mimeType]: [fileExtension || '*'],
              }
            : undefined,
        },
      ],
    });
    const writable = await handle.createWritable();
    const blob = await getBlob();
    if (!blob) {
      logger.error('No blob found for file', fileName);
      return;
    }
    await writable.write(blob);
    await writable.close();
  } catch (error) {
    // Only log actual errors, not user cancellation
    if (error instanceof Error && error.name !== 'AbortError') {
      logger.error('Error using File System Access API:', error);
      await downloadWithFallback(getBlob, fileName);
    }
  }
};

export const downloadFile = async (fileUrl: string, fileName: string, fileType: string) => {
  try {
    const getFile = async () => {
      const response = await fetch(fileUrl);
      return response.blob();
    };

    // Try using File System Access API first
    if ('showSaveFilePicker' in window) {
      const fileExtension = getFileExtension(fileUrl, fileType);
      await saveFileWithPicker({
        getBlob: getFile,
        fileName,
        fileType: 'File',
        mimeType: getMimeType(fileExtension.toLowerCase()),
      });
    } else {
      await downloadWithFallback(getFile, fileName);
    }
  } catch (error) {
    logger.error('Error downloading file:', error);
  }
};

export const downloadAllToZip = async (files: MediaAsset[], modelName: string) => {
  try {
    const createZip = async () => {
      const zip = new JSZip();

      // Create an array of fetch promises
      const fetchPromises = files.map(async (file, index) => {
        try {
          const response = await fetch(file.url);
          if (!response.ok) throw new Error(`Failed to fetch ${file.url}`);

          const blob = await response.blob();

          // Use the requested naming convention
          const uniqueFileName = `weavy-${modelName || ''}-${String(index + 1).padStart(4, '0')}.${file.url.split('.').pop()}`;

          zip.file(uniqueFileName, blob);
          return { success: true, file };
        } catch (error) {
          return { success: false, file, error: error instanceof Error ? error.message : error };
        }
      });

      // Wait for all downloads to complete
      const results = await Promise.all(fetchPromises);

      // Check for any failures
      const failures = results.filter((r) => !r.success);
      if (failures.length > 0) {
        logger.error(`Failed to download ${failures.length} files: ${failures.map((f) => f.file.url).join(', ')}`);
        return;
      }

      // Generate zip file
      return await zip.generateAsync({ type: 'blob' });
    };
    const now = new Date();
    const timestamp = format(now, "yyyy-MM-dd 'at' HH.mm.ss");
    const zipFileName = `weavy-${modelName || ''}-generations-${timestamp}.zip`;

    if ('showSaveFilePicker' in window) {
      await saveFileWithPicker({
        getBlob: createZip,
        fileName: zipFileName,
        fileType: 'ZIP Archive',
        mimeType: 'application/zip',
      });
    } else {
      // If picker was not available or user cancelled, use fallback
      await downloadWithFallback(createZip, zipFileName);
    }
  } catch (error) {
    logger.error('Error downloading file', error);
  }
};

export const generateViewingUrl = (file: MediaAsset) => {
  if (!file?.url || !file?.publicId) {
    return '';
  }
  const extension = file.url.split('.').pop();
  const publicId = file.publicId.replace('uploads/', '');
  return `${window.location.origin}/view/${publicId}?type=${file.type}&extension=${extension}`;
};

export const generateCloudinaryUrl = (publicId, extension, type) => {
  return `https://media.weavy.ai/${type}/upload/uploads/${publicId}.${extension}`;
};
