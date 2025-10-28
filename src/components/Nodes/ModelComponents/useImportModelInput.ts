import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import random from 'lodash/random';
import { useTranslation } from 'react-i18next';
import { getAxiosInstance } from '@/services/axiosConfig';
import { log } from '@/logger/logger.ts';
import { ModelType } from '@/enums/model-type.enum';
import { HandleType } from '@/enums/handle-type.enum';
import { I18N_KEYS } from '@/language/keys';
import { civitSchema } from '../Civit/CivitSchema';
import { extractInputSchemaDetails } from '../Utils';
import type { BaseNodeData, Handle, Schema } from '@/types/node';
import type { Model, ModelBaseNodeData } from '@/types/nodes/model';

const logger = log.getLogger('useImportModelInput');
const axiosInstance = getAxiosInstance();

const BLOCKED_MODELS = ['fofr/video-to-frames'];

interface ImportModelInputOptions {
  handles: BaseNodeData['handles'];
  id: string;
  model?: Partial<Model>;
  params: Record<string, unknown>;
  schema: Record<string, unknown>;
  setModelNotSupported: (modelNotSupported: string | null) => void;
  updateNodeData: (id: string, data: Partial<ModelBaseNodeData>) => void;
}

const hasType = (prop: unknown): prop is { type: string } => {
  return !!prop && typeof prop === 'object' && 'type' in prop && prop.type !== undefined;
};

const hasDefault = (prop: unknown): prop is { default: unknown } => {
  return !!prop && typeof prop === 'object' && 'default' in prop && prop.default !== undefined;
};

const isEnum = (prop: unknown): prop is { type: 'enum'; options: unknown[] } => {
  return hasType(prop) && prop.type === 'enum';
};

const isStringSchema = (
  prop: unknown,
): prop is { type: 'string'; required?: boolean; description?: string; format?: string; order?: number } => {
  return hasType(prop) && prop.type === 'string';
};

const getEstimatedHandleType = (key: string) => {
  if (key.includes('prompt') || key.includes('text')) return HandleType.Text;
  if (key.includes('image')) return HandleType.Image;
  if (key.includes('video')) return HandleType.Video;
  if (key.includes('audio') || key.includes('voice')) return HandleType.Audio;
  if (key.includes('3d')) return HandleType.ThreeDee;
  if (key.includes('lora')) return HandleType.Lora;
  return HandleType.Any;
};

const getSchemaParams = (
  schemaToPopulate: Record<string, unknown>,
  params: Record<string, unknown>,
  handles: BaseNodeData['handles'],
) => {
  const isParamsEmpty = !params || Object.keys(params).length === 0;
  if (!isParamsEmpty) {
    return;
  }

  const defaultHandles = {};
  const initialFields = {};
  Object.keys(schemaToPopulate).forEach((key: keyof typeof schemaToPopulate) => {
    const prop = schemaToPopulate[key];
    if (hasDefault(prop)) {
      initialFields[key] = prop.default;
    } else {
      initialFields[key] = ''; // Default for strings
    }

    if (!hasType(prop)) {
      return;
    }

    if (isEnum(prop) && !hasDefault(prop)) {
      initialFields[key] = prop.options[0];
    }

    if (isStringSchema(prop)) {
      defaultHandles[key] = {
        required: prop.required,
        description: prop.description,
        format: prop.format || 'text',
        order: prop.order,
        id: uuidv4(),
        label: key,
        type: getEstimatedHandleType(key),
      };
    }

    if (prop.type === 'seed') {
      initialFields[key] = {
        isRandom: true,
        seed: random(1, 1000000),
      };
    }
  });

  return {
    params: initialFields,
    handles: {
      ...handles,
      input: { ...handles.input, ...defaultHandles },
    },
  };
};

const getReplicateModelVersionParams = async (modelToFetch: Model) => {
  try {
    const res = await axiosInstance.get<{ openapi_schema: Record<string, unknown> }>(
      `/v1/models/replicate/${modelToFetch.name}/${modelToFetch.version}`,
    );

    return res.data;
  } catch (e) {
    logger.error('Could not get version params', e);
  }
};

export const useImportModelInput = ({
  handles,
  id,
  model,
  params,
  schema,
  setModelNotSupported,
  updateNodeData,
}: ImportModelInputOptions) => {
  const [isFocused, setIsFocused] = useState(false);
  const [cannotFindModel, setCannotFindModel] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const { t } = useTranslation();
  const getCivitModelVersionsByNumericalId = useCallback(async (civitModelUrl: string) => {
    const civitId = civitModelUrl.split('/').filter((part) => /^\d+$/.test(part))[0];
    try {
      const response = await axiosInstance.get<{ modelVersions: { id: string }[]; name: string }>(
        `/v1/models/civit/${civitId}`,
      );

      return response.data;
    } catch (_e) {
      setCannotFindModel(true);
      setModelLoading(false);
      return null;
    }
  }, []);

  const getCivitModelByVersionId = useCallback(async (versionId: string) => {
    try {
      const response = await axiosInstance.get<{
        air: string;
        images: { url: string }[];
      }>(`/v1/models/civit/version/${versionId}`);

      return response.data;
    } catch (error) {
      logger.error('Could not get civit version ', error);
      return null;
    }
  }, []);

  const getReplicateModelVersionByName = useCallback(async (replicateModelId: string) => {
    try {
      const response = await axiosInstance.get<{
        description: string;
        cover_image_url: string;
        latest_version: { id: string };
      }>(`/v1/models/replicate/${replicateModelId}`);

      return response.data;
    } catch (_e) {
      setCannotFindModel(true);
      setModelLoading(false);
      return null;
    }
  }, []);

  const getFalModel = useCallback(
    async (falUrl: string): Promise<{ name: string; schema: Record<string, any>; version: string } | null> => {
      try {
        const response = await axiosInstance.post<{ name: string; schema: Record<string, any>; version: string }>(
          `/v1/models/fal/model`,
          {
            url: falUrl,
          },
        );

        return response.data;
      } catch (_e) {
        setCannotFindModel(true);
        setModelLoading(false);
        return null;
      }
    },
    [],
  );

  const handleGetCivitModel = useCallback(
    async (urlPasted: string): Promise<{ description: string; model: Model } | null> => {
      const modelVersionsResponse = await getCivitModelVersionsByNumericalId(urlPasted);
      if (!modelVersionsResponse) {
        setModelLoading(false);
        return null;
      }
      const modelVersionByIdResponse = await getCivitModelByVersionId(modelVersionsResponse.modelVersions[0].id);

      const regex = /urn:air:[^:]+:([^:]+):[^:]+:[^@]+@[^@]+/;
      const match = modelVersionByIdResponse?.air.match(regex);
      if (match?.[1] !== 'checkpoint' || !modelVersionByIdResponse) {
        setModelNotSupported(match?.[1] || t(I18N_KEYS.GENERAL.UNKNOWN));
        setModelLoading(false);
        return null;
      }
      const updatedModel: Model = {
        name: modelVersionsResponse.name,
        version: modelVersionByIdResponse.air,
        coverImage: modelVersionByIdResponse.images[0].url,
        service: 'civit',
      };
      return {
        description: 'Civit.ai Model',
        model: updatedModel,
      };
    },
    [getCivitModelByVersionId, getCivitModelVersionsByNumericalId, setModelNotSupported, t],
  );

  const handleGetReplicateModel = useCallback(
    async (urlPasted: string): Promise<{ description: string; model: Model } | null> => {
      const cleanedName = urlPasted.includes('https://replicate.com/')
        ? urlPasted.replace('https://replicate.com/', '')
        : urlPasted.split(':')[0];
      const replicateModelResponse = await getReplicateModelVersionByName(cleanedName);
      if (!replicateModelResponse) return null;

      return {
        model: {
          name: cleanedName,
          version: replicateModelResponse.latest_version.id,
          coverImage: replicateModelResponse.cover_image_url,
          service: 'replicate',
        },
        description: replicateModelResponse.description,
      };
    },
    [getReplicateModelVersionByName],
  );

  const handleModelVersionChange = useCallback(
    async (changedModel: Model) => {
      if (changedModel.version && changedModel.service) {
        let newSchema: Record<string, Schema>;
        let schemaParams:
          | {
              params: Record<string, unknown>;
              handles: {
                input: Record<string, Handle> | string[];
                output: Record<string, Handle> | string[];
              };
            }
          | undefined;
        if (changedModel.service === ModelType.Replicate.valueOf()) {
          if (Object.keys(schema).length === 0) {
            const res = await getReplicateModelVersionParams(changedModel);
            if (!res) {
              throw new Error('Could not get model version params');
            }
            // todo: all these logic should be in the server - it should return the processed schema
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- we need to add json schema types
            newSchema = extractInputSchemaDetails(res as { openapi_schema: Record<string, any> });
            schemaParams = getSchemaParams(newSchema, params, handles);
          } else {
            schemaParams = getSchemaParams(schema, params, handles);
          }
        } else if (changedModel.service === ModelType.Civit.valueOf()) {
          if (Object.keys(schema).length === 0) {
            newSchema = civitSchema;
            schemaParams = getSchemaParams(civitSchema, params, handles);
          }
        } else if (changedModel.service === ModelType.FalImported.valueOf()) {
          if (Object.keys(schema).length === 0) {
            newSchema = extractInputSchemaDetails(
              {
                openapi_schema: changedModel.openapi_schema as Record<string, any>,
              },
              'fal',
            );
            schemaParams = getSchemaParams(newSchema, params, handles);
          }
        } else {
          throw new Error('Invalid model service');
        }

        return {
          ...(schemaParams || {}),
          schema: newSchema!,
        };
      }
    },
    [handles, params, schema],
  );

  const handleModelNamePaste = useCallback(
    async (event: React.ClipboardEvent<HTMLInputElement>) => {
      const urlPasted = event.clipboardData.getData('text');
      setModelNotSupported(null);
      setModelLoading(true);

      for (const blockedModel of BLOCKED_MODELS) {
        if (urlPasted.includes(blockedModel)) {
          setModelNotSupported(blockedModel);
          setModelLoading(false);
          return;
        }
      }

      let updatedDescription: string;
      let updatedModel: Model = {
        name: urlPasted,
        version: null,
        coverImage: null,
        service: null,
        openapi_schema: undefined,
      };

      if (urlPasted.includes('/civitai.com')) {
        const civitModel = await handleGetCivitModel(urlPasted);
        if (!civitModel) return;
        updatedModel = civitModel.model;
        updatedDescription = civitModel.description;
      } else if (urlPasted.includes('/fal.ai') || urlPasted.includes('fal-ai')) {
        const falModel = await getFalModel(urlPasted);
        if (!falModel) return;
        updatedModel = {
          name: falModel.version,
          version: falModel.version,
          coverImage: (falModel.schema?.info?.['x-fal-metadata']?.thumbnailUrl as string) || '',
          service: 'fal_imported',
          openapi_schema: falModel.schema,
        };
        updatedDescription = 'Fal.ai Model';
      } else {
        const replicateModel = await handleGetReplicateModel(urlPasted);
        if (!replicateModel) return;
        updatedModel = replicateModel.model;
        updatedDescription = replicateModel.description;
      }

      const dataToUpdate: Partial<ModelBaseNodeData> & { model: Model } = {
        name: updatedModel.name,
        description: updatedDescription,
        model: updatedModel,
      };

      try {
        const newData = await handleModelVersionChange(updatedModel);

        if (newData?.params) {
          dataToUpdate.params = newData.params;
        }

        if (newData?.handles) {
          dataToUpdate.handles = newData.handles;
        }

        if (newData?.schema) {
          dataToUpdate.schema = newData.schema;
          dataToUpdate.version = 2;
        }
        updateNodeData(id, dataToUpdate);
      } catch (e) {
        logger.error('Could not get model version change', e);
      }

      if (!updatedModel.version) {
        setCannotFindModel(true);
      }
      setModelLoading(false);
    },
    [
      handleGetCivitModel,
      handleGetReplicateModel,
      handleModelVersionChange,
      id,
      setModelNotSupported,
      updateNodeData,
      getFalModel,
    ],
  );

  const handleModelNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCannotFindModel(false);
      const inputValue = event.target.value;
      if (inputValue === '') {
        const emptyModel = {
          name: '',
          label: '',
          version: '',
          coverImage: '',
          service: null,
        };

        setCannotFindModel(false);

        updateNodeData(id, {
          handles: {
            ...handles,
            input: [],
          },
          params: {},
          schema: {},
          model: emptyModel,
        });
      } else if (inputValue) {
        updateNodeData(id, {
          model: {
            ...(model || {}),
            name: inputValue,
          },
        });
      }
    },
    [handles, id, model, updateNodeData],
  );

  return { isFocused, setIsFocused, handleModelNameChange, handleModelNamePaste, cannotFindModel, modelLoading };
};
