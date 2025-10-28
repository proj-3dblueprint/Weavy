import { Box, Typography, Tooltip, TextField, Skeleton, Divider, Chip, FormControlLabel, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useContext, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';
import noop from 'lodash/noop';
import { log } from '@/logger/logger.ts';
import { color } from '@/colors';
import { CreditsContext } from '@/services/CreditsContext';
import { I18N_KEYS } from '@/language/keys';
import { NodeType } from '@/enums/node-type.enum';
import { DesignAppMode } from '@/enums/design-app-modes.enum';
import { WarningCircleIcon } from '@/UI/Icons/WarningCircleIcon';
import { useUserWorkflowRole, useWorkflowStore } from '@/state/workflow.state';
import { AppSwitch } from '@/UI/AppSwitch/AppSwitch';
import {
  Edge,
  Node,
  type BaseNodeData,
  type ImportData,
  type MultiLoRACoreData,
  type PromptData,
  type TextData,
  MediaIteratorData,
} from '@/types/node';
import { Flex, FlexCenHorVer, FlexCenVer, FlexCol, FlexColCenHor, FlexColCenHorVer } from '@/UI/styles';
import { getAxiosInstance } from '@/services/axiosConfig';
import { useSaveRecipe } from '@/hooks/useSaveRecipe';
import { CostResponse, DesignAppData, DesignAppInput, DesignAppResult } from '@/types/design-app.types';
import { PriceInfo } from '@/components/Common/PriceInfo/PriceInfo.tsx';
import { RunCounter } from '@/components/Recipe/Drawer/RunModelsSection.tsx';
import { ParameterValue } from '@/designer/designer';
import CancellableLoadingButton from '../../CancellableLoadingButton/CancellableLoadingButton';
import { NotificationsPanel } from '../FlowComponents/NotificationsPanel';
import { useStatusPolling } from './useStatusPolling';
import { renderDesignAppParams, getWorkflowInputNodes } from './DesignAppUtils';
import DesignAppUploadFile from './DesignAppUploadFile';
import DesignAppToolbar from './DesignAppToolbar';
import DesignAppPrompt from './DesignAppPrompt';
import DesignAppInputHeader from './DesignAppInputHeader';
import Preview from './Preview/Preview';
import Params from './Params/Params';
import type { DesignAppMetadataItem, Recipe } from '@/types/api/recipe';
import type { MediaAsset } from '@/types/api/assets';

const logger = log.getLogger('DesignApp');
const axiosInstance = getAxiosInstance();

const PARAM_TYPES = ['seed', 'array', 'number', 'integer', 'boolean', 'mux', 'muxv2'];
const HIDDEN_INPUT_TYPES = ['ImportLoRA'];
const DESIGN_APP_HEADER_HEIGHT = 40;
const PARAMS_DRAWER_ID = '[PARAMS_DRAWER]';

const SetAsParameterLabel = () => {
  const { t } = useTranslation();
  return (
    <Typography variant="body-sm-rg" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box>{t(I18N_KEYS.SHARED_DESIGN_APP.INPUTS.SET_AS_PARAMETER)}</Box>
    </Typography>
  );
};

export const InputPanelSkeleton = () => {
  return (
    <FlexCol data-testid="design-app-inputs-container-skeleton" sx={{ width: '100%', mb: 1, p: 2 }}>
      <Divider sx={{ ml: -2 }} textAlign="left">
        <FlexCenVer sx={{ gap: 1 }}>
          <Chip size="small" label={<Skeleton variant="rounded" width={100} height={16} />} />
        </FlexCenVer>
      </Divider>
      <FlexCol sx={{ my: 2 }}>
        <Skeleton animation="wave" variant="rounded" width="90%" height={8} />
      </FlexCol>
      <FlexCol sx={{ border: `1px solid ${color.Dark_Grey}`, borderRadius: 1, p: 1, gap: 1 }}>
        <Skeleton animation="wave" variant="rounded" width="100%" height={8} />
        <Skeleton animation="wave" variant="rounded" width="100%" height={8} />
        <Skeleton animation="wave" variant="rounded" width="80%" height={8} />
        <Skeleton animation="wave" variant="rounded" width="60%" height={8} />
      </FlexCol>
    </FlexCol>
  );
};

const getParsedInputValue = (input: Node, existingValue?: DesignAppInput['value']) => {
  // todo: simplify conditions

  if (input.type === NodeType.MultiLora) {
    const multiLoraData = input.data as MultiLoRACoreData;
    return (
      existingValue || {
        weight: multiLoraData.weight,
        selectedLora: multiLoraData.selectedLora,
      }
    );
  }

  if (input.type === 'ImportLoRA') {
    const importLoRAData = input.data as { result: { lora: string } };
    return existingValue || importLoRAData.result.lora;
  }

  if (input.type === NodeType.Prompt || input.type === NodeType.PromptV3) {
    const promptData = input.data as PromptData & { result: { prompt: string } };
    return existingValue && 'prompt' in existingValue && existingValue?.prompt
      ? existingValue
      : {
          prompt: promptData.result.prompt,
        };
  }
  if (input.type === NodeType.Import) {
    const importData = input.data as ImportData & { result: { file: MediaAsset } };
    return existingValue && 'file' in existingValue && existingValue?.file
      ? existingValue
      : {
          file: importData.files?.[importData.selectedIndex] ?? importData.result.file,
        };
  }
  if (input.type === NodeType.MediaIterator) {
    const mediaIteratorData = input.data as MediaIteratorData;
    const files = (mediaIteratorData.files.data as ParameterValue).value;
    return existingValue && 'file' in existingValue && existingValue?.file
      ? existingValue
      : {
          file: files?.[mediaIteratorData.selectedIndex],
        };
  }
  if (input.type === NodeType.String) {
    const stringData = input.data as TextData & { result: { string: string } };
    return existingValue && 'string' in existingValue && existingValue?.string
      ? existingValue
      : {
          string: stringData.value ?? stringData.result.string,
        };
  }

  return existingValue ?? input.data.result;
};

interface DesignAppProps {
  isGuest: boolean;
  recipeId: string;
  nodes: Node[];
  edges: Edge[];
  readOnly: boolean;
  updateNodeData: (nodeId: string, data: BaseNodeData) => void;
}
function DesignApp({ isGuest, recipeId, nodes, edges, readOnly = false, updateNodeData }: DesignAppProps) {
  // todo: disable button while input file is being uploaded

  // TODO - merge inputs, hiddenInputs, results into designAppData
  const [_designAppData, setDesignAppData] = useState<DesignAppData | null>(null);
  const { setUserCredits, setWorkspaceCredits } = useContext(CreditsContext);
  const [runCost, setRunCost] = useState<number | null>(null);

  // designApp object
  const [inputs, setInputs] = useState<DesignAppInput[]>([]);
  const [hiddenInputs, setHiddenInputs] = useState<DesignAppInput[]>([]);
  const [results, setResults] = useState<DesignAppResult[]>([]);
  const [numberOfRuns, setNumberOfRuns] = useState(1);
  const [isLoadingDesignApp, setIsLoadingDesignApp] = useState(true);
  const [isLoadingCost, setIsLoadingCost] = useState(true);
  const [isParsingInputs, setIsParsingInputs] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const role = useUserWorkflowRole();

  const mode = role === 'editor' && !readOnly ? DesignAppMode.Editing : DesignAppMode.Running;

  const canCancel = useRef(false);
  const isLoading = isLoadingDesignApp || isParsingInputs;

  const [leftPanelWidth, setLeftPanelWidth] = useState(`${localStorage.getItem('designAppLeftPanelWidth') || '30'}%`);
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);

  // handle validation
  const [validationErrors, setValidationErrors] = useState({});

  // drag and drop
  const [draggedInputId, setDraggedInputId] = useState<string | null>(null);
  const [targetInputId, setTargetInputId] = useState<string | null>(null);
  const [isEditingInputMetadata, setIsEditingInputMetadata] = useState(false); // to prevent dragging input metadata while editing text

  const [notificationData, setNotificationData] = useState({
    isOpen: false,
    text: '',
  });

  const inputRefs = useRef<Record<string, HTMLElement>>({});

  const { t } = useTranslation();

  const updateResults = useCallback(
    (newResults: DesignAppResult[], userRemainingCredits?: number, workspaceRemainingCredits?: number) => {
      try {
        if (!newResults) {
          throw new Error('No results received');
        }
        setResults((prevResults) => {
          if (!prevResults) {
            logger.error('No previous results received', { newResults, prevResults });
            return newResults;
          }
          return [...newResults, ...prevResults];
        });
        if (userRemainingCredits !== undefined) {
          setUserCredits(userRemainingCredits);
        }
        if (workspaceRemainingCredits !== undefined) {
          setWorkspaceCredits(workspaceRemainingCredits);
        }
      } catch (error) {
        logger.error('Failed to update results', { error, newResults });
      }
    },
    [setUserCredits, setWorkspaceCredits],
  );

  const [isRunningApp, setIsRunningApp] = useState(false);

  const setAppAsDone = useCallback(() => {
    setIsRunningApp(false);
    canCancel.current = false;
  }, []);

  // App run status
  const {
    isProcessing,
    progress,
    errorMessage: pollingErrorMessage,
    startPolling,
    numberOfLoadingResults,
  } = useStatusPolling({
    addCurrentResults: updateResults,
    recipeId,
    onDonePolling: setAppAsDone,
  });
  const setRecipe = useWorkflowStore((state) => state.setRecipe);
  const recipe = useWorkflowStore((state) => state.recipe);
  const [designAppMetadata, setDesignAppMetadata] = useState(recipe?.designAppMetadata || {});
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const navigate = useNavigate();

  const { exposedInputs, concealedInputs } = useMemo(() => {
    if (!inputs) return { exposedInputs: [], concealedInputs: [] };
    return inputs.reduce<{ exposedInputs: DesignAppInput[]; concealedInputs: DesignAppInput[] }>(
      (acc, input) => {
        if (input.exposed) {
          acc.exposedInputs.push(input);
        } else {
          acc.concealedInputs.push(input);
        }
        return acc;
      },
      { exposedInputs: [], concealedInputs: [] },
    );
  }, [inputs]);

  const isEditMode = role === 'editor' && mode === DesignAppMode.Editing;

  /// validate inputs
  const validateInputs = () => {
    const errors = {};
    exposedInputs
      .filter((input) => !input.disabled)
      .forEach((input) => {
        if (
          input.value == null ||
          (input.type === NodeType.Prompt && !input.value.prompt) ||
          (input.type === NodeType.PromptV3 && !input.value.prompt) ||
          (input.type === NodeType.String && !input.value.string?.trim())
        ) {
          errors[input.id] = t(I18N_KEYS.SHARED_DESIGN_APP.INPUTS.REQUIRED_ERROR);
        }
        if (
          (input.type === NodeType.Import || input.type === NodeType.MediaIterator) &&
          !input.value.file?.url &&
          !input.value.url
        ) {
          errors[input.id] = t(I18N_KEYS.SHARED_DESIGN_APP.INPUTS.REQUIRED_ERROR_FILE);
        }
        if (input.type === NodeType.MultiLora && !input.value.selectedLora?.file) {
          errors[input.id] = t(I18N_KEYS.SHARED_DESIGN_APP.INPUTS.REQUIRED_ERROR_LORA);
        }
      });

    setValidationErrors(errors);
    // If there are errors, scroll to the first one
    if (Object.keys(errors).length > 0) {
      const firstErrorId = Object.keys(errors)[0];
      const inputsContainer: HTMLElement | null = document.querySelector('#design-app-inputs-container');
      const errorElement = inputRefs.current[firstErrorId];

      if (inputsContainer && errorElement) {
        inputsContainer.scrollTo({
          top: errorElement.offsetTop - inputsContainer.offsetTop - 16,
          behavior: 'smooth',
        });
      }
    }
    return Object.keys(errors).length === 0;
  };

  /// end validate inputs

  /// parsing workflow inputs

  const parseInputNode = (node: Node, index: number, initialDesignAppData: DesignAppData, defaultExposed = true) => {
    const currentInput = initialDesignAppData?.inputs?.find((i) => i.id === node.id);

    const existingValue = currentInput?.value;
    const existingOrder = currentInput?.order;
    const existingExposed = currentInput?.exposed;
    const existingDisabled = currentInput?.disabled;

    let inputMetadata: DesignAppMetadataItem;
    if (designAppMetadata[node.id]) {
      inputMetadata = designAppMetadata[node.id];
    } else {
      inputMetadata = {
        order: existingOrder || index,
        required: false,
        exposed: defaultExposed,
        disabled: typeof existingDisabled === 'boolean' ? existingDisabled : false,
      };
      setDesignAppMetadata((prevMetadata) => ({
        ...prevMetadata,
        [node.id]: inputMetadata,
      }));
    }
    return {
      id: node.id,
      type: node.type,
      description: node.data.description,
      value: getParsedInputValue(node, existingValue),
      exposed: role === 'editor' && isEditMode ? (existingExposed ?? inputMetadata.exposed) : inputMetadata.exposed,
      order: role === 'editor' && isEditMode ? (existingOrder ?? inputMetadata.order) : inputMetadata.order,
      mode: 'mode' in node.data && node.data.mode ? node.data.mode : undefined,
      required: inputMetadata.required,
      disabled: typeof existingDisabled === 'boolean' ? existingDisabled : false,
    };
  };

  const parseInputs = (inputNodes, initialDesignAppData) => {
    setIsParsingInputs(true);
    const clonedInput = cloneDeep(inputNodes);
    const filteredPrompts = clonedInput.filter((n) => {
      return (n.type === NodeType.Prompt || n.type === NodeType.PromptV3) && !n.data.isLocked;
    });
    const filteredImports = clonedInput.filter((n) => {
      return n.type === NodeType.Import && !n.data.isLocked;
    });
    const filteredMediaIterators = clonedInput.filter((n) => {
      return n.type === NodeType.MediaIterator && !n.data.isLocked;
    });
    const filteredStrings = clonedInput.filter((n) => {
      return n.type === NodeType.String && !n.data.isLocked;
    });
    const filteredLoRas = clonedInput.filter((n) => {
      return n.type === NodeType.MultiLora && !n.data.isLocked;
    });
    const filteredParamNodes = clonedInput.filter((n) => {
      return PARAM_TYPES.includes(n.type) && !n.data.isLocked;
    });
    const filteredHiddenInputs = clonedInput.filter((n) => {
      return HIDDEN_INPUT_TYPES.includes(n.type) && !n.data.isLocked;
    });

    const allInputs = [
      ...filteredPrompts,
      ...filteredStrings,
      ...filteredImports,
      ...filteredMediaIterators,
      ...filteredLoRas,
    ];

    const parsedInputs: any[] = [];

    // Parse regular inputs (exposed by default)
    allInputs.forEach((input, index) => {
      const parsedInput = parseInputNode(input, index, initialDesignAppData);
      parsedInputs.push(parsedInput);
    });

    // Parse parameter nodes (not exposed by default)
    filteredParamNodes.forEach((paramNode, index) => {
      const parsedParam = parseInputNode(paramNode, index, initialDesignAppData, false);
      parsedInputs.push(parsedParam);
    });

    // Parse hidden inputs (not added to the parsedInputs array)
    const parsedHiddenInputs: any[] = [];
    filteredHiddenInputs.forEach((hiddenInput, index) => {
      const parsedHiddenInput = parseInputNode(hiddenInput, index, initialDesignAppData);
      parsedHiddenInputs.push(parsedHiddenInput);
    });

    // Sort inputs by order
    const sortedInputs = parsedInputs.sort((a: any, b: any) => {
      return a.order - b.order;
    });

    setHiddenInputs(parsedHiddenInputs);
    setInputs(sortedInputs);
    setIsParsingInputs(false);
  };

  /// end parsing workflow inputs

  function getRunBody(numberOfRuns: number) {
    const allInputs = [...(inputs || []), ...(hiddenInputs || [])];
    return {
      inputs: allInputs.map((input) => ({
        nodeId: input.id,
        input: input.value,
        disabled: input.disabled,
        name: nodes.find((node) => node.id === input.id)?.data.name,
      })),
      numberOfRuns,
      recipeVersion: recipe.version,
    };
  }

  const fetchRunCost = async () => {
    try {
      if (isGuest) {
        return;
      }

      const costBody = getRunBody(1);
      const costResponse = await axiosInstance.post<CostResponse>(
        `/v1/recipe-runs/recipes/${recipeId}/cost`,
        costBody,
        {
          'axios-retry': { retries: 0 },
        },
      );
      const runCost = costResponse.data?.cost;
      setRunCost(runCost);
    } catch (error) {
      logger.error('Failed to fetch run cost', error);
    } finally {
      setIsLoadingCost(false);
    }
  };

  const fetchDesignAppData = async (version) => {
    if (isGuest) {
      setIsLoadingDesignApp(false);
      const workflowInputNodes = getWorkflowInputNodes(nodes, edges);
      parseInputs(workflowInputNodes, []);
      return;
    }

    try {
      const response = await axiosInstance.get<DesignAppData>(
        `/v1/recipes/${recipeId}/user-design-app?version=${version}`,
      );
      const fetchedData = response.data;
      setDesignAppData(fetchedData);
      setResults(fetchedData?.results || []);

      // Initialize inputs based on fetched data
      const workflowInputNodes = getWorkflowInputNodes(nodes, edges);
      parseInputs(workflowInputNodes, fetchedData);

      // Check for running tasks
      if (fetchedData?.latestRuns?.length) {
        startPolling(fetchedData.latestRuns.map((run) => run.runId));
        canCancel.current = true;
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to fetch design app data');
      logger.error('Error fetching design app data.', error);
    } finally {
      setTimeout(() => {
        setIsLoadingDesignApp(false);
      }, 1000);
    }
  };

  // init
  useEffect(() => {
    setIsLoadingDesignApp(true);
    void fetchDesignAppData(recipe.version);
  }, []);

  // Fetch cost after inputs are parsed
  useEffect(() => {
    if (!isParsingInputs && inputs.length > 0) {
      void fetchRunCost();
    }
  }, [isParsingInputs, inputs.length]);

  /// handle input change
  const updateInput = (inputId, field, newValue) => {
    setInputs((prevInputs) => {
      return prevInputs.map((input) => {
        if (input.id === inputId) {
          let updatedInput = cloneDeep(input);
          updatedInput = set(updatedInput, field, newValue);
          return updatedInput;
        }
        return input;
      });
    });
  };

  const updateMetadata = (inputId, field, newValue) => {
    setDesignAppMetadata((prevMetadata) => {
      const updatedMetadata = { ...prevMetadata };
      updatedMetadata[inputId] = { ...updatedMetadata[inputId], [field]: newValue };
      return updatedMetadata;
    });
    const updatedRecipeData = { ...recipe };
    if (!updatedRecipeData.designAppMetadata || !updatedRecipeData.designAppMetadata[inputId]) {
      return updatedRecipeData;
    }
    updatedRecipeData.designAppMetadata[inputId][field] = newValue;
    setRecipe(updatedRecipeData);
  };

  //todo: remove externalValue and make it more generic. was added since string node has different value structure
  const handleChange = (paramId: string, newValue: any) => {
    setErrorMessage(undefined);
    setValidationErrors((prev) => {
      const updated = { ...prev };
      delete updated[paramId];
      return updated;
    });

    updateInput(paramId, 'value', newValue);
  };

  const handleExposeParam = (paramId, exposed) => {
    updateMetadata(paramId, 'exposed', exposed);
    updateInput(paramId, 'exposed', exposed);
  };

  const handleDisableInput = (inputId, disabled) => {
    updateMetadata(inputId, 'disabled', disabled);
    updateInput(inputId, 'disabled', disabled);
  };

  /// end handle input change

  /// debounce save design app
  const debounceDesignAppTimeoutRef = useRef<NodeJS.Timeout>();
  const debounceDesignAppMetadataTimeoutRef = useRef<NodeJS.Timeout>();

  const saveDesignApp = useCallback(
    async (updatedInputs: DesignAppInput[]) => {
      if (isGuest) {
        return;
      }
      try {
        await axiosInstance.post(`/v1/recipes/${recipeId}/design-app-params/save`, {
          designApp: updatedInputs,
        });

        // Optionally update local state with the response
        setDesignAppData((current) => ({
          ...(current || { results: [], latestRuns: [] }),
          inputs: updatedInputs,
        }));
      } catch (error) {
        logger.error('Failed to save design app', error);
      }
    },
    [isGuest, recipeId],
  );

  const debouncedSaveApp = useCallback(
    (currentInputs: DesignAppInput[]) => {
      clearTimeout(debounceDesignAppTimeoutRef.current);
      debounceDesignAppTimeoutRef.current = setTimeout(() => {
        void saveDesignApp(currentInputs);
      }, 500);
    },
    [saveDesignApp],
  );

  useEffect(() => {
    setDesignAppData((current) => ({ inputs, results, latestRuns: current?.latestRuns || [] }));
    debouncedSaveApp(inputs);

    return () => {
      clearTimeout(debounceDesignAppTimeoutRef.current);
    };
  }, [inputs, debouncedSaveApp, results]);

  const saveDesignAppMetadata = useSaveRecipe();

  // debounce save design app metadata
  const debouncedSaveDesignAppMetadata = useCallback(
    (currentDesignAppMetadata: Recipe['designAppMetadata']) => {
      clearTimeout(debounceDesignAppMetadataTimeoutRef.current);
      debounceDesignAppMetadataTimeoutRef.current = setTimeout(() => {
        void saveDesignAppMetadata({ designAppMetadata: currentDesignAppMetadata });
      }, 500);
    },
    [saveDesignAppMetadata],
  );

  useEffect(() => {
    debouncedSaveDesignAppMetadata(designAppMetadata);

    return () => {
      clearTimeout(debounceDesignAppMetadataTimeoutRef.current);
    };
  }, [designAppMetadata, debouncedSaveDesignAppMetadata]);

  /// end debounce save design app metadata

  const DefaultsComment = () => {
    if (mode === DesignAppMode.Running) return null;

    return (
      <FlexCenHorVer sx={{ width: '100%', mt: 1 }}>
        <Typography variant="body-sm-rg" sx={{ color: 'transparent' }}>
          {t(I18N_KEYS.SHARED_DESIGN_APP.INPUTS.DEFAULTS_COMMENT)}
        </Typography>
      </FlexCenHorVer>
    );
  };

  const renderInputContent = (input) => {
    const hasError = !!validationErrors[input.id];

    const validationProps = {
      error: hasError,
      helperText: hasError ? validationErrors[input.id] : null,
    };

    const disabledConcealAction = {
      label: <SetAsParameterLabel />,
      disabled: true,
      onClick: noop,
      id: 'set-as-parameter-disabled',
    };

    const concealAction = {
      label: <SetAsParameterLabel />,
      disabled: false,
      onClick: () => handleExposeParam(input.id, false),
      id: 'set-as-parameter',
    };
    switch (input.type) {
      case NodeType.Prompt:
      case NodeType.PromptV3:
        return (
          <FlexCol sx={{ width: '100%' }}>
            <DesignAppInputHeader
              inputId={input.id}
              updateNodeData={updateNodeData}
              role={role}
              inputColor={color.Yambo_Green}
              nodes={nodes}
              setIsEditingInputMetadata={setIsEditingInputMetadata}
              mode={mode}
              actions={[disabledConcealAction]}
            />
            <DesignAppPrompt
              id={input.id}
              value={input.value?.prompt}
              onChange={handleChange}
              setIsEditingInputMetadata={setIsEditingInputMetadata}
              disabled={isGuest}
              isLoading={isLoading}
              {...validationProps}
            />
          </FlexCol>
        );
      case NodeType.MediaIterator:
        return (
          <FlexCol sx={{ width: '100%' }}>
            <DesignAppInputHeader
              inputId={input.id}
              updateNodeData={updateNodeData}
              role={role}
              inputColor={color.Yambo_Blue}
              nodes={nodes}
              setIsEditingInputMetadata={setIsEditingInputMetadata}
              mode={mode}
              actions={[disabledConcealAction]}
            />
            <DesignAppUploadFile
              id={input.id}
              value={input.value}
              acceptedFileType={'image'} // TODO: support other media types for media iterator
              onUpload={handleChange}
              isLoading={isLoading}
              setIsUploading={setIsUploading}
              {...validationProps}
              isGuest={isGuest}
            />
          </FlexCol>
        );
      case NodeType.Import:
        return (
          <FlexCol sx={{ width: '100%' }}>
            <DesignAppInputHeader
              inputId={input.id}
              updateNodeData={updateNodeData}
              role={role}
              inputColor={color.Yambo_Blue}
              nodes={nodes}
              setIsEditingInputMetadata={setIsEditingInputMetadata}
              mode={mode}
              actions={[disabledConcealAction]}
            />
            <DesignAppUploadFile
              id={input.id}
              value={input.value}
              onUpload={handleChange}
              isLoading={isLoading}
              setIsUploading={setIsUploading}
              {...validationProps}
              isGuest={isGuest}
            />
          </FlexCol>
        );
      case NodeType.String:
        return (
          <FlexCol sx={{ width: '100%' }}>
            <DesignAppInputHeader
              inputId={input.id}
              updateNodeData={updateNodeData}
              role={role}
              inputColor={color.Yambo_Blue}
              nodes={nodes}
              setIsEditingInputMetadata={setIsEditingInputMetadata}
              mode={mode}
              actions={[disabledConcealAction]}
            />
            <TextField
              fullWidth
              multiline
              onFocus={() => setIsEditingInputMetadata(true)}
              onBlur={() => setIsEditingInputMetadata(false)}
              size="small"
              value={input.value?.string}
              disabled={isGuest}
              onChange={(e) => handleChange(input.id, { string: e.target.value })}
              sx={{
                background: `${color.Black100}`,
              }}
              {...validationProps}
              // todo: add validation
            />
          </FlexCol>
        );
      case NodeType.MultiLora: {
        const metadataInput = designAppMetadata[input.id];
        const onDisable = (_e, currentChecked) => {
          handleDisableInput(input.id, !currentChecked);
        };
        return (
          <FlexCol sx={{ width: '100%' }}>
            <DesignAppInputHeader
              inputId={input.id}
              updateNodeData={updateNodeData}
              role={role}
              inputColor={color.Yambo_Blue}
              nodes={nodes}
              setIsEditingInputMetadata={setIsEditingInputMetadata}
              mode={mode}
              actions={[disabledConcealAction]}
            />
            <Flex sx={{ width: '100%' }}>
              <FlexCenVer>
                <FormControlLabel
                  labelPlacement="top"
                  control={<AppSwitch checked={!metadataInput.disabled} onChange={onDisable} />}
                  label={t(
                    metadataInput.disabled
                      ? I18N_KEYS.SHARED_DESIGN_APP.INPUTS.HEADER.DISABLED
                      : I18N_KEYS.SHARED_DESIGN_APP.INPUTS.HEADER.ENABLED,
                  )}
                />
              </FlexCenVer>
              <Box sx={{ flexGrow: 1 }}>
                {renderDesignAppParams({
                  node: nodes.find((node) => node.id === input.id),
                  param: input,
                  handleChange,
                  isLoading,
                  validationProps,
                  translate: t,
                  disabled: isGuest || metadataInput.disabled,
                })}
              </Box>
            </Flex>
          </FlexCol>
        );
      }
      default:
        return (
          <FlexCol sx={{ width: '100%' }}>
            <DesignAppInputHeader
              inputId={input.id}
              updateNodeData={updateNodeData}
              role={role}
              inputColor={color.Yambo_Green}
              nodes={nodes}
              setIsEditingInputMetadata={setIsEditingInputMetadata}
              mode={mode}
              actions={[concealAction]}
            />
            {renderDesignAppParams({
              node: nodes.find((node) => node.id === input.id),
              param: input,
              handleChange,
              isLoading,
              validationProps,
              translate: t,
              disabled: isGuest,
            })}
          </FlexCol>
        );
    }
  };

  // Run
  const run = async () => {
    if (!validateInputs()) {
      setErrorMessage('Please fill in all required fields');
      return;
    }
    canCancel.current = false;

    const runBody = getRunBody(numberOfRuns);

    setIsRunningApp(true);
    setErrorMessage(undefined);

    try {
      const response = await axiosInstance.post(`/v1/recipe-runs/recipes/${recipeId}/run`, runBody, {
        'axios-retry': { retries: 0 },
      });
      const runIds = response.data.runIds;
      canCancel.current = true;

      // should solve the issue of going to the workflow tab and back here. the data needs to be updated
      // todo: replace with actual to get the design app api when entering this page
      setDesignAppData((current) => ({
        ...(current || { inputs: [], results: [] }),
        latestRuns: runIds.map((runId: string) => ({ runId, status: 'RUNNING' })),
      }));

      // Start polling in the background
      startPolling(runIds);
    } catch (e: any) {
      logger.error('Failed to run recipe', e);
      setErrorMessage(e instanceof Error ? e.message : 'Something went wrong');
      setIsRunningApp(false);
    }
  };

  const cancelRun = async () => {
    try {
      await axiosInstance.post(`/v1/recipe-runs/recipes/${recipeId}/runs/cancel`);
    } catch (e) {
      logger.error('Failed to cancel prediction', e);
    }
  };

  /// handle drag and drop for reordering inputs & exposing / concealing inputs
  const draggedInput = useMemo(() => inputs.find((input) => input.id === draggedInputId), [draggedInputId, inputs]);

  const handleDragStart = (e, inputId) => {
    setDraggedInputId(inputId);
    e.dataTransfer.setData('text/plain', inputId);
  };

  const handleDragEnd = () => {
    setDraggedInputId(null);
    setTargetInputId(null);
  };

  const handleDragOver = (e: React.DragEvent, inputId: string) => {
    e.preventDefault();
    setTargetInputId(inputId);
  };

  const handleParamsDrawerDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setTargetInputId(PARAMS_DRAWER_ID);
    if (!draggedInput || !PARAM_TYPES.includes(draggedInput.type)) {
      e.dataTransfer.dropEffect = 'none';
      e.stopPropagation();
    } else {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleInputContainerDrop = (e) => {
    e.preventDefault();
    if (!draggedInputId || draggedInputId === targetInputId) return;

    // We need to expose the input if it's dropped in the inputs container
    handleExposeParam(draggedInputId, true);

    setDraggedInputId(null);
    setTargetInputId(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedInputId || draggedInputId === targetInputId) return;

    // If the target is the params drawer, we need to conceal the input
    if (targetInputId === PARAMS_DRAWER_ID) {
      if (draggedInput && PARAM_TYPES.includes(draggedInput.type)) {
        handleExposeParam(draggedInputId, false);
        setDraggedInputId(null);
        setTargetInputId(null);
      }
      return;
    }

    setInputs((prevInputs: any[]) => {
      const newInputs = [...prevInputs];
      const draggedIndex = newInputs.findIndex((input) => input.id === draggedInputId);
      const targetIndex = newInputs.findIndex((input) => input.id === targetInputId);

      // Remove dragged item and insert at new position
      const [draggedItem] = newInputs.splice(draggedIndex, 1);
      // Expose the input if it's dropped in the inputs container
      draggedItem.exposed = true;
      newInputs.splice(targetIndex, 0, draggedItem);

      // Update order property for all inputs
      const reorderedInputs = newInputs.map((input, index) => ({
        ...input,
        order: index,
      }));

      // Update metadata if user is editor
      if (role === 'editor') {
        reorderedInputs.forEach((input) => {
          updateMetadata(input.id, 'order', input.order);
        });
      }
      return reorderedInputs;
    });
  };

  const shouldShowTopIndicator = (hoverTargetInputId) => {
    if (!hoverTargetInputId || !draggedInputId) return false;

    // Get the indices from the inputs array
    const targetIndex = inputs.findIndex((input) => input.id === hoverTargetInputId);
    const draggedIndex = inputs.findIndex((input) => input.id === draggedInputId);

    // Show top indicator if dragged item is coming from below
    return draggedIndex > targetIndex;
  };

  const getInputContainerStyles = (inputId) => {
    const validDragging = targetInputId === inputId && !!draggedInputId;
    const showTopIndicator = shouldShowTopIndicator(inputId);
    return {
      width: '100%',
      p: 2,
      borderTop: validDragging && showTopIndicator ? `2px solid ${color.Yambo_Purple}` : 'none',
      borderBottom: validDragging && !showTopIndicator ? `2px solid ${color.Yambo_Purple}` : 'none',
      opacity: draggedInputId === inputId ? 0.5 : 1,
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        zIndex: '1001',
        left: '0px',
        top: '-4px',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: color.Yambo_Purple,
        display: validDragging && showTopIndicator ? 'block' : 'none',
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        zIndex: '1001',
        left: '0px',
        bottom: '-4px',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: color.Yambo_Purple,
        display: validDragging && !showTopIndicator ? 'block' : 'none',
      },
    };
  };

  function getButtonTitle() {
    if (isGuest) {
      return 'Sign in to run';
    }
    if (isProcessing || isRunningApp) {
      return 'Running';
    }

    return results?.length ? 'Re-run' : 'Run';
  }

  const formatError = (error) => {
    if (!error) return 'Something went wrong';

    return typeof error === 'string' ? error : JSON.stringify(error);
  };

  const formattedMessage = formatError(pollingErrorMessage || errorMessage);

  const disableRunButton = () => {
    return isLoadingDesignApp || isUploading;
  };

  const handleMouseDown = (e) => {
    setIsDraggingPanel(true);
    e.preventDefault(); // Prevent text selection while dragging
  };

  useEffect(() => {
    let tempWidth;
    const handleMouseMove = (e) => {
      if (!isDraggingPanel) return;
      const container = document.getElementById('design-app-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Limit the width between 20% and 80%
      const limitedWidth = Math.min(Math.max(newWidth, 20), 80);
      setLeftPanelWidth(`${limitedWidth}%`);
      localStorage.setItem('designAppLeftPanelWidth', `${limitedWidth}%`);
      tempWidth = limitedWidth;
    };

    const handleMouseUp = () => {
      setIsDraggingPanel(false);
      localStorage.setItem('designAppLeftPanelWidth', tempWidth);
    };

    if (isDraggingPanel) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPanel]);

  useEffect(() => {
    if (readOnly) {
      setNotificationData({
        text: t(I18N_KEYS.RECIPE_MAIN.FLOW.GENERAL.READ_ONLY_PANEL.TITLE_EDITOR),
        isOpen: true,
        icon: <WarningCircleIcon width={20} height={20} />,
        action: {
          text: t(I18N_KEYS.RECIPE_MAIN.FLOW.GENERAL.READ_ONLY_PANEL.CTA_EDITOR),
          onClick: () => (window.location.href = window.location.pathname),
        },
      } as any);
    } else if (isGuest) {
      setNotificationData({
        text: t(I18N_KEYS.RECIPE_MAIN.FLOW.GENERAL.READ_ONLY_PANEL.TITLE_READER),
        isOpen: true,
        icon: <WarningCircleIcon width={20} height={20} />,
        action: {
          text: t(I18N_KEYS.RECIPE_MAIN.FLOW.GENERAL.READ_ONLY_PANEL.CTA_GUEST),
          onClick: () => navigate('/signin', { state: { from: window.location.pathname } }),
        },
      } as any);
    }
  }, [readOnly, isGuest, t]);

  return (
    <FlexColCenHorVer
      data-testid="design-app-container"
      id="design-app-container"
      sx={{ width: '100%', height: '100%', position: 'relative', background: `${color.Black40_T}`, zIndex: 9999, p: 1 }}
    >
      {role === 'editor' && <DesignAppToolbar height={DESIGN_APP_HEADER_HEIGHT} />}
      {/* @ts-expect-error fix this */}
      {notificationData.isOpen && <NotificationsPanel height={DESIGN_APP_HEADER_HEIGHT} content={notificationData} />}
      <Flex
        sx={{
          width: `100%`,
          height: role === 'editor' ? `calc(100% - ${DESIGN_APP_HEADER_HEIGHT}px)` : '100%',
          overflow: 'hidden',
          gap: 0,
        }}
      >
        <FlexColCenHor
          data-testid="design-app-inputs-controls-container"
          sx={{
            justifyContent: 'space-between',
            width: leftPanelWidth,
            gap: 2,
            overflow: 'auto',
            minWidth: '20%',
            maxWidth: '80%',
            position: 'relative',
          }}
        >
          {/* Inputs */}
          <Box
            id="design-app-inputs-container"
            sx={{
              width: '100%',
              background: `${color.Black92}`,
              height: '100%',
              overflow: 'auto',
              border: `1px solid ${color.Dark_Grey}`,
              position: 'relative',
              borderRadius: 3,
            }}
            onDrop={handleInputContainerDrop}
          >
            {isLoading && <InputPanelSkeleton />}
            {!isLoading && exposedInputs.length > 0 && <DefaultsComment />}
            {!isLoading && exposedInputs.length > 0 // empty state
              ? exposedInputs.map((input) => (
                  <Box
                    key={`input-${input.id}`}
                    ref={(el: HTMLElement | null) => {
                      if (el) {
                        inputRefs.current[input.id] = el;
                      }
                    }}
                    sx={getInputContainerStyles(input.id)}
                    draggable={isEditMode && !isEditingInputMetadata}
                    onDragStart={(e) => handleDragStart(e, input.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, input.id)}
                    onDrop={handleDrop}
                  >
                    {renderInputContent(input)}
                  </Box>
                ))
              : !isLoading && (
                  <FlexColCenHorVer sx={{ width: '100%', height: '100%' }}>
                    <img
                      src="/illustrations/no-inputs.png"
                      alt="No inputs"
                      style={{ width: '60%', filter: 'grayscale(100%)', opacity: 0.7 }}
                    />
                    <Typography variant="body-std-md">{t(I18N_KEYS.SHARED_DESIGN_APP.NO_INPUTS.TITLE)}</Typography>
                    <Typography variant="body-sm-rg">{t(I18N_KEYS.SHARED_DESIGN_APP.NO_INPUTS.TIP)}</Typography>
                  </FlexColCenHorVer>
                )}
          </Box>
          {/* Run button and settings */}
          <FlexCol
            data-testid="design-app-controls-container"
            sx={{
              justifyContent: 'space-between',
              background: `${color.Black92}`,
              width: '100%',
              zIndex: 9998,
              border: `1px solid ${color.Dark_Grey}`,
              p: 2,
              borderRadius: 3,
              gap: 1.5,
            }}
          >
            <RunCounter runs={numberOfRuns} setRuns={setNumberOfRuns} isProcessing={isProcessing} />

            {isLoadingCost || runCost ? (
              <PriceInfo
                longTitle
                cost={runCost ? Math.round(runCost * Math.floor(numberOfRuns) * 100) / 100 : undefined}
                isLoading={isLoadingCost}
              />
            ) : null}

            <Flex
              data-testid="design-app-run-and-params-buttons-container"
              sx={{ justifyContent: 'space-between', width: '100%', gap: concealedInputs.length > 0 ? 1 : 0 }}
            >
              {concealedInputs?.length > 0 && (
                <Flex sx={{ flexGrow: 1 }} onDragOver={handleParamsDrawerDragEnter} onDrop={handleDrop}>
                  <Params
                    concealedInputs={concealedInputs}
                    nodes={nodes}
                    isEditMode={isEditMode}
                    leftPanelWidth={leftPanelWidth}
                    handleExposeParam={handleExposeParam}
                    handleChange={handleChange}
                  />
                </Flex>
              )}

              <CancellableLoadingButton
                onClick={isGuest ? () => navigate('/signin', { state: { from: window.location.pathname } }) : run}
                onCancel={cancelRun}
                isProcessing={isProcessing || isRunningApp}
                title={getButtonTitle()}
                data={{}}
                canCancel={canCancel.current}
                disabled={disableRunButton()}
                subtitle={undefined}
                shouldShowEndIcon={undefined}
              />
            </Flex>
            {pollingErrorMessage || errorMessage ? (
              <FlexCenVer data-testid="model-error-container" sx={{ mt: 0.5 }}>
                <Tooltip title={formattedMessage} placement="top">
                  <Alert
                    severity="error"
                    sx={{
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '12px',
                      alignContent: 'center',
                      justifyContent: 'center',
                      fontWeight: 'regular',
                    }}
                    slotProps={{
                      icon: {
                        sx: {
                          fontSize: 'inherit',
                        },
                      },
                    }}
                    icon={<i className="fa-sharp fa-light fa-triangle-exclamation"></i>}
                  >
                    {formattedMessage}
                  </Alert>
                </Tooltip>
              </FlexCenVer>
            ) : null}
          </FlexCol>
        </FlexColCenHor>
        <Box
          data-testid="design-app-panel-resizer"
          onMouseDown={handleMouseDown}
          sx={{
            width: '12px',
            height: '100%',
            background: 'transparent',
            position: 'relative',
            cursor: 'col-resize',
          }}
        >
          <Box
            sx={{
              width: '2px',
              left: 'calc(50% - 1px)',
              height: '20px',
              background: color.Yambo_Purple,
              position: 'relative',
              top: 'calc(45% - 10px)',
              cursor: 'col-resize',
              borderRadius: '2px',
              outline: `1px solid ${color.Yambo_Purple}`,
            }}
          />
        </Box>
        {/* Preview window */}
        <Preview
          isLoading={isLoading}
          isProcessing={isProcessing || isRunningApp}
          numberOfLoadingResults={numberOfLoadingResults}
          progress={progress}
          recipeName={recipe.name}
          results={results}
          setResults={setResults}
          version={String(recipe.version)}
          recipeId={recipeId}
        />
      </Flex>
    </FlexColCenHorVer>
  );
}

export default DesignApp;
