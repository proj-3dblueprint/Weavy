import cloneDeep from 'lodash/cloneDeep';
import { log } from '@/logger/logger.ts';
import { getAxiosInstance } from '@/services/axiosConfig';
import { ROUTES } from '@/consts/routes.consts';
import { ModelType } from '@/enums/model-type.enum';
import { getImageDimensions, registerImageUtil, negateImageColors } from './Utils';
import { SchedulerMapFix } from './Civit/civit-scheduler-mapping';

const logger = log.getLogger('RunModel');
const axiosInstance = getAxiosInstance();

type Handle = {
  required?: boolean;
  type?: string;
};

interface SuccessPrediction {
  status: 'succeeded';
  results: any[];
  remainingCredits?: number | null;
}

interface FailedPrediction {
  status: 'failed';
  error: any;
  remainingCredits?: number | null;
}

interface CanceledPrediction {
  status: 'canceled';
  remainingCredits?: number | null;
}

interface ProcessingPrediction {
  status: 'starting' | 'processing' | 'initial_processing';
  progress?: number;
}

type PredictionStatus = SuccessPrediction | FailedPrediction | CanceledPrediction | ProcessingPrediction;

interface Model {
  name: string;
  service: string;
  version: string;
  cover: string;
  label: string;
}

export interface PollCallbacks {
  onProgress?: (progress: number) => void;
  onSuccess?: (results: any[], remainingCredits?: number | null) => void;
  onError?: (error: any, remainingCredits?: number | null) => void;
  onStatusChange?: (status: string, remainingCredits?: number | null) => void;
}

export const pollPredictionStatus = async (
  predictionId: string,
  callbacks: PollCallbacks,
  isCanceled: () => boolean = () => false,
): Promise<void> => {
  const startTime = Date.now();

  const poll = async () => {
    if (isCanceled()) {
      return;
    }

    try {
      const response = await axiosInstance.get<PredictionStatus>(`/v1/models/predict/${predictionId}/status`);

      if (response.data.status === 'processing' && !('progress' in response.data)) {
        response.data.status = 'initial_processing';
      }

      callbacks.onStatusChange?.(
        response.data.status,
        'remainingCredits' in response.data ? response.data.remainingCredits : undefined,
      );

      if (isCanceled()) {
        return;
      }

      switch (response.data.status) {
        case 'succeeded':
          callbacks.onSuccess?.(response.data.results, response.data.remainingCredits);

          return; // Exit polling

        case 'processing':
          callbacks.onProgress?.(response.data.progress || 0);
          break;

        case 'failed':
          callbacks.onError?.(response.data.error, response.data.remainingCredits);
          return; // Exit polling

        case 'canceled':
          return; // Exit polling
      }

      // Calculate next polling interval
      const elapsedTime = Date.now() - startTime;
      let interval = 1000; // Default 1s
      if (elapsedTime < 10000) {
        interval = 1000;
      } else if (elapsedTime < 30000) {
        interval = 2500;
      } else {
        interval = 5000;
      }

      // Schedule next poll
      setTimeout(() => void poll(), interval);
    } catch (error: any) {
      callbacks.onError?.(error?.message);
    }
  };

  // Start polling
  await poll();
};

// todo: improve
const getModelType = (model: Model): ModelType => {
  if (
    model.service === ModelType.Replicate.valueOf() ||
    model.service === ModelType.Civit.valueOf() ||
    model.service === ModelType.FalImported.valueOf()
  ) {
    return model.service as ModelType;
  }

  const enumValues = Object.values(ModelType) as string[];
  if (enumValues.includes(model.name)) {
    return model.name as ModelType;
  }

  return ModelType.Replicate;
};

//we saved a wrong enum values in the db. this function fix it. remove after migrating the db data.
const fixCivitScheduler = (params) => {
  if (params.scheduler) {
    params.scheduler = SchedulerMapFix.get(params.scheduler) || params.scheduler;
  }

  return params;
};

export const runModel = async (
  handles,
  input,
  model,
  params,
  nodeId: string,
  recipeId: string,
  recipeVersion: number,
  callbacks: PollCallbacks = {},
  seed?,
  version?,
): Promise<RunModelResponse> => {
  const isValid = true; // todo: replace with input validation
  if (!isValid) {
    // error
  }
  let dimensions: any = {}; // todo: typing
  let inputObject: any = {}; // todo: typing
  // iterate over the input handles and create the input object to be sent to the server
  // if one of the inputs is an image, we extract the image dimensions and use is as params for the model
  if (version === 2 || version === 3) {
    // Handle the case where handles.input is a map
    Object.entries(handles.input as Record<string, Handle>).forEach(([key, _]) => {
      if (input[key] !== undefined && input[key] !== '' && input[key] !== null) {
        if (input[key]?.type === 'image' || input[key]?.type === 'video' || input[key]?.type === 'audio') {
          inputObject[key] = input[key].url;
        } else if (input[key]?.type === 'text' && 'value' in input[key]) {
          inputObject[key] = input[key].value;
        } else if ((input[key]?.type === 'number' || input[key]?.type === 'integer') && 'value' in input[key]) {
          inputObject[key] = input[key].value;
        } else {
          inputObject[key] = input[key];
        }
      }
    });
  } else {
    // backwards compatibility - Handle the case where handles.input is an array
    handles.input.forEach((handle) => {
      if (input[handle] !== undefined && input[handle] !== '' && input[handle] !== null) {
        if (input[handle]?.type === 'image' || input[handle]?.type === 'video' || input[handle]?.type === 'audio') {
          inputObject[handle] = input[handle].url;
        } else if (input[handle]?.type === 'text' && 'value' in input[handle]) {
          inputObject[handle] = input[handle].value;
        } else {
          inputObject[handle] = input[handle];
        }
      }
    });
  }
  if (input.image?.url) {
    try {
      dimensions = await getImageDimensions(input.image.url);
    } catch (_error) {
      logger.error('Cannot read input image');
      throw new Error('Cannot read input image');
    }
  }

  const modelType = getModelType(model);

  // todo: move all of those outside if this function
  if (modelType === ModelType.BRPsd) {
    let visualId;
    if (input['image'].visualId) {
      visualId = input['image'].visualId;
    } else {
      // backward compatibility
      visualId = await registerImageUtil(input['image'].url);
    }
    inputObject = {
      ...inputObject,
      visualId,
    };
  }

  if (modelType === ModelType.SDControlnet) {
    inputObject = {
      ...inputObject,
      type: params?.control_type,
    };
  }

  if (
    (model.name === 'ideogram-ai/ideogram-v2' || model.name === 'ideogram-ai/ideogram-v3-quality') &&
    input.mask?.url
  ) {
    inputObject.mask = await negateImageColors(input.mask.url);
  }

  // convert to array for ideogram-v3-quality
  if (
    model.name === 'ideogram-ai/ideogram-v3-quality' ||
    modelType === ModelType.IdeogramV3 ||
    modelType === ModelType.IdeogramV3ReplaceBackground
  ) {
    if (input.image_to_inpaint?.url) {
      inputObject.image = input.image_to_inpaint.url;
    }

    // consolidate to an array
    const imageInputs = Object.entries(input)
      .filter(([key]) => key.startsWith('style_reference_image'))
      .map(([_, value]) => (value as { url?: string })?.url)
      .filter(Boolean);

    inputObject.style_reference_images = imageInputs;

    Object.keys(inputObject).forEach((key) => {
      if (key.startsWith('style_reference_image') && key !== 'style_reference_images') {
        delete inputObject[key];
        if (params && params[key] !== undefined) {
          delete params[key];
        }
      }
    });
  }

  if (modelType === ModelType.TopazUpscaleVideo && input.video && input.video.width && input.video.height) {
    const maxUpscaleFactor = calculateMaxUpscaleFactor(input.video.width, input.video.height);
    inputObject.upscale_factor = Math.min(params.upscale_factor || 1, maxUpscaleFactor);
  }

  // todo: check all the text to prompt and make sure no discrepancy
  if (modelType === ModelType.Civit) {
    params = fixCivitScheduler(params);
  }

  if (
    modelType === ModelType.GeminiEdit ||
    modelType === ModelType.GptImage1Edit ||
    modelType === ModelType.Hyper3dRodin
  ) {
    // consolidate to an array
    const imageInputs = Object.entries(input)
      .filter(([key]) => key.startsWith('image'))
      .map(([_, value]) => (value as { url?: string })?.url)
      .filter(Boolean);

    inputObject.images = imageInputs;

    Object.keys(inputObject).forEach((key) => {
      if (key.startsWith('image') && key !== 'images') {
        delete inputObject[key];
        if (params && params[key] !== undefined) {
          delete params[key];
        }
      }
    });
  }

  if (model.name === 'runwayml/gen4-image') {
    // consolidate to an array
    const imageInputs = Object.entries(input)
      .filter(([key]) => key.startsWith('image'))
      .map(([_, value]) => (value as { url?: string })?.url)
      .filter(Boolean);

    inputObject.reference_images = imageInputs;

    Object.keys(inputObject).forEach((key) => {
      if (key.startsWith('image')) {
        delete inputObject[key];
      }
    });
  }

  if (modelType === ModelType.RunwayActTwo) {
    inputObject = transformRunwayActTwoInput(inputObject, input);
  }

  let cleanParams;
  if (params) {
    cleanParams = cloneDeep(params);
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        cleanParams[key] = value.filter(Boolean);
      }

      if (value === '' || value === null) {
        cleanParams[key] = undefined;
      }
    });
  }

  if (
    model.name === ModelType.Wan21Vace ||
    model.name === 'kwaivgi/kling-v1.6-pro' ||
    model.name === ModelType.Kling16
  ) {
    // consolidate to an array
    const imageInputs = Object.entries(input)
      .filter(([key]) => key.startsWith('reference_image'))
      .map(([_, value]) => (value as { url?: string })?.url)
      .filter(Boolean);

    if (model.name === 'kwaivgi/kling-v1.6-pro' || model.name === ModelType.Kling16) {
      inputObject.reference_images = imageInputs;
    } else {
      inputObject.ref_image_urls = imageInputs;
    }

    Object.keys(inputObject).forEach((key) => {
      if (key.startsWith('reference_image') && key !== 'reference_images') {
        delete inputObject[key];
        delete cleanParams[key];
      }
    });
  }

  if (model.name === ModelType.RunwayAleph) {
    inputObject = transformRunwayAlephInput(inputObject, input);
  }

  if (model.name === ModelType.FreepikMagnificUpscale) {
    checkIfValidImageAndScaleFactor(input.image.width, input.image.height, cleanParams.scale_factor);
  }

  if (seed) {
    if (cleanParams.seed) cleanParams.seed = parseInt(seed);
    if (inputObject.seed)
      // this can happen only if the seed is a separate node
      inputObject.seed = parseInt(seed);
  }
  const body: any = {
    // todo: typing
    model: {
      ...model,
      type: modelType,
    },
    input: {
      ...cleanParams,
      ...inputObject,
      ...(dimensions.width && dimensions.height ? { width: dimensions.width, height: dimensions.height } : {}),
    },
    nodeId,
    recipeId,
    recipeVersion,
  };

  const response = await axiosInstance.post(ROUTES.RunModel, body, { 'axios-retry': { retries: 0 } });

  const predictionId = response.data.predictionId;

  // Start polling in the background
  void pollPredictionStatus(predictionId, callbacks);

  return response.data;
};

const calculateMaxUpscaleFactor = (
  width: number,
  height: number,
  maxWidth: number = 3840,
  maxHeight: number = 2160,
): number => {
  const widthFactor = maxWidth / width;
  const heightFactor = maxHeight / height;
  return Math.min(4, Math.min(widthFactor, heightFactor));
};

const checkIfValidImageAndScaleFactor = (width: number, height: number, scaleFactorString: string) => {
  const pixels = width * height;
  const MAX_PIXELS = 25300000;
  const maxAllowedScale = calculateMaxUpscaleFactorFreepik(pixels, MAX_PIXELS);
  const scaleFactor = scaleFactorString === '8x' ? 8 : scaleFactorString === '4x' ? 4 : 2;
  if (pixels * scaleFactor > MAX_PIXELS) {
    const errorMessage = `Image too large for ${scaleFactor}x upscaling. Your ${width}×${height} image would become ${(width * scaleFactor).toLocaleString()}×${(height * scaleFactor).toLocaleString()} pixels (${(pixels * scaleFactor).toLocaleString()} total), but the maximum allowed is ${MAX_PIXELS.toLocaleString()} pixels. Try ${maxAllowedScale}x upscaling instead.`;
    throw new Error(errorMessage);
  }
};

const calculateMaxUpscaleFactorFreepik = (pixels: number, maxPixels: number) => {
  const availableScales = [2, 4, 8];
  let maxAllowedScale = 8;
  for (const scale of availableScales) {
    if (pixels * scale <= maxPixels) {
      maxAllowedScale = scale;
    }
  }
  return maxAllowedScale;
};

const transformRunwayActTwoInput = (inputObject: any, input: any) => {
  const { character } = inputObject;
  if (input.character.type === 'video') {
    inputObject.characterVideo = character;
  } else {
    inputObject.characterImage = character;
  }
  delete inputObject.character;
  return inputObject;
};

const transformRunwayAlephInput = (inputObject: any, input: any) => {
  const imageInputs = Object.entries(input)
    .filter(([key]) => key.startsWith('reference_image'))
    .map(([_, value]) => (value as { url?: string })?.url)
    .filter(Boolean);

  inputObject.referenceImages = imageInputs;

  Object.keys(inputObject).forEach((key) => {
    if (key.startsWith('reference_image')) {
      delete inputObject[key];
    }
  });

  return inputObject;
};

export const runModelFromEditor = async () => {};
