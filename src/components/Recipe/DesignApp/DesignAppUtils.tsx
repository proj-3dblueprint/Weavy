import { ReactElement } from 'react';
import {
  Box,
  FormControl,
  Input,
  Select,
  MenuItem,
  Typography,
  Checkbox,
  Autocomplete,
  TextField,
  Slider,
  Skeleton,
  FormControlLabel,
} from '@mui/material';
import { color } from '@/colors';
import { NodeType } from '@/enums/node-type.enum';
import { I18N_KEYS } from '@/language/keys';
import { Node, Edge } from '@/types/node';
import { NumberInputField } from '../../Nodes/input-fields/number-input-field/number-input-field.component';
import { ExtraSmallFontTextField } from '../../Nodes/Utils';
import LoRA from '../../Nodes/MultiLoRA/LoRA';
import { TextFieldWithCursor } from '../../Nodes/ModelNodesUtils';
import UploadFile from './DesignAppUploadFile';
import type { TFunction } from 'i18next';

interface ValidationProps {
  error?: boolean;
  helperText?: string | null;
}

type HandleChangeFunction = (paramId: string, newValue: any) => void;

interface SeedValue {
  isRandom: boolean;
  seed: string | number;
}

interface MultiLoraValue {
  selectedLora: {
    id: string;
    name: string;
    file?: string;
    coverImage: string;
    defaultWeight: number;
    trigger: string;
    url?: string;
  } | null;
  weight: number;
}

interface PromptValue {
  prompt: string;
}

interface RenderDesignAppParamsProps {
  node?: any;
  param: any;
  handleChange: HandleChangeFunction;
  isLoading: boolean;
  validationProps: ValidationProps;
  translate: TFunction;
  disabled: boolean;
}

const getSafeNumber = (value: any): number | undefined => {
  const parsedValue = Number.parseFloat(value);
  if (isNaN(parsedValue)) {
    return undefined;
  }
  return parsedValue;
};

export const renderDesignAppParams = ({
  node,
  param,
  handleChange,
  isLoading,
  validationProps,
  translate,
  disabled,
}: RenderDesignAppParamsProps): ReactElement | null => {
  switch (param.type) {
    case 'integer':
    case 'number':
      return (
        <NumberInputField
          key={`${param.id}-numberInputField`}
          inputKey={param.id}
          title={node?.data?.name || ''}
          description=""
          // @ts-expect-error - fix this
          value={getSafeNumber(param.value)}
          // @ts-expect-error - fix this
          min={getSafeNumber(node?.data?.min)}
          // @ts-expect-error - fix this
          max={getSafeNumber(node?.data?.max)}
          type={param.mode || node?.type}
          onChange={handleChange}
          disabled={disabled}
        />
      );
    case 'input': // backward compatibility 24.10 (adding separation between input of integer and floats)
      return (
        <Input
          key={`${param.id}-textfield`}
          fullWidth
          // label={key}
          value={param.value}
          size="small"
          inputProps={{ type: 'number' }}
          onChange={(e) => handleChange(param.id, parseInt(e.target.value))}
          disabled={disabled}
        />
      );
    case 'input-integer':
      return (
        <Input
          key={`${param.id}-input-integer`}
          fullWidth
          value={param.value}
          size="small"
          inputProps={{ type: 'number' }}
          onChange={(e) => handleChange(param.id, parseInt(e.target.value))}
          disabled={disabled}
        />
      );
    case 'input-number':
      return (
        <Input
          key={`${param.id}-input-float`}
          fullWidth
          value={param.value}
          size="small"
          inputProps={{ type: 'number', step: '0.1' }}
          onChange={(e) => handleChange(param.id, parseFloat(e.target.value))}
          disabled={disabled}
        />
      );
    case 'mux':
      return (
        <FormControl fullWidth sx={{ mt: 1 }}>
          {/* <InputLabel id={`${key}-label`}>{property.title}</InputLabel> */}
          <Select
            labelId={`${param.id}-label`}
            id={param.id}
            value={param.value}
            onChange={(e) => handleChange(param.id, e.target.value)}
            size="small"
            disabled={disabled}
          >
            {node?.data?.options?.map((option: any) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            )) || []}
          </Select>
        </FormControl>
      );
    case 'muxv2': {
      let options = node?.data?.params?.options;
      // If options is not an array, or undefined, we need to convert it to an array
      if (!Array.isArray(options)) {
        if (typeof options === 'string') {
          options = options.split(',');
          // When there is one value and it is a number
        } else if (typeof options === 'number') {
          options = [options];
        } else {
          options = [];
        }
      }
      return (
        <FormControl fullWidth sx={{ mt: 1 }}>
          {/* <InputLabel id={`${key}-label`}>{property.title}</InputLabel> */}
          <Select
            labelId={`${param.id}-label`}
            id={param.id}
            value={param.value}
            onChange={(e) => handleChange(param.id, e.target.value)}
            size="small"
            disabled={disabled}
          >
            {options.map((option: any, index: number) => (
              <MenuItem key={option} value={index}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }
    case 'boolean':
      return (
        <Box
          key={`${param.id}-boolean`}
          sx={{
            mb: 2,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            position: 'relative',
            ml: -1,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <FormControl>
              <Checkbox
                inputProps={{ 'aria-label': 'Checkbox' }}
                checked={param.value as boolean}
                onChange={(e) => handleChange(param.id, e.target.checked)}
                disabled={disabled}
              />
            </FormControl>
          </Box>
        </Box>
      );
    case 'seed':
      return (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', ml: -1 }}>
          <FormControl>
            <Checkbox
              inputProps={{ 'aria-label': 'Checkbox' }}
              checked={(param.value as SeedValue)?.isRandom}
              onChange={(e) =>
                handleChange(param.id, {
                  isRandom: e.target.checked,
                  seed: (param.value as SeedValue)?.seed,
                })
              }
              disabled={disabled}
            />
          </FormControl>
          <Typography className="property-title" sx={{ mr: 0.5 }}>
            Random
          </Typography>

          <Input
            value={(param.value as SeedValue)?.seed}
            inputProps={{ type: 'number' }}
            size="small"
            onChange={(e) =>
              handleChange(param.id, { isRandom: (param.value as SeedValue)?.isRandom, seed: e.target.value })
            }
            disabled={(param.value as SeedValue)?.isRandom}
            sx={{ ml: 1 }}
          />
        </Box>
      );
    case 'array':
      return (
        <>
          <ExtraSmallFontTextField
            sx={{ mt: 1 }}
            fullWidth
            id={param.id}
            multiline
            value={Array.isArray(param.value) ? param.value.join(', ') : param.value || ''}
            rows={3}
            onChange={(e) => {
              // Just pass the raw text value
              handleChange(param.id, e.target.value);
            }}
            onBlur={(e) => {
              // Only split into array when the field loses focus
              const newValue = e.target.value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
              handleChange(param.id, newValue);
            }}
            size="small"
            disabled={disabled}
          />
          <Typography>Use comma for multiple entries </Typography>
        </>
      );
    case 'text':
      return <TextFieldWithCursor id={param.id} value={param.value} property={param} handleChange={handleChange} />;

    case 'multilora':
      return (
        <>
          {isLoading ? (
            <>
              <Skeleton width="100%" height={48} />
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                <Skeleton width="20%" height={18} />
                <Skeleton width="60%" height={18} />
                <Skeleton width="20%" height={18} />
              </Box>
            </>
          ) : (
            <>
              <Autocomplete
                id="lora-select"
                sx={{ width: '100%', mt: 1, backgroundColor: color.Black100 }}
                options={
                  node?.data?.loras && node.data.loras.length > 0 ? node.data.loras.filter((l: any) => l.file) : []
                }
                autoHighlight
                value={(param.value as MultiLoraValue).selectedLora}
                onChange={(event, newValue) => {
                  handleChange(node?.id || param.id, {
                    selectedLora: newValue,
                    weight: (param.value as MultiLoraValue).weight,
                  });
                }}
                size="small"
                autoComplete={false}
                getOptionLabel={(option: any) => option.name}
                getOptionKey={(option: any) => option.id}
                isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
                renderOption={(props, option: any) => {
                  const { key: _, ...optionProps } = props;
                  return (
                    <Box
                      key={option.id}
                      component="li"
                      {...optionProps}
                      sx={{
                        width: '100%',
                        backgroundColor: color.Yambo_Blue,
                        '&:hover': {
                          backgroundColor: color.Yambo_Blue_Stroke,
                        },
                      }}
                    >
                      <LoRA
                        lora={option}
                        container="node"
                        updateLora={() => {}}
                        deleteLora={() => {}}
                        setSelectedLora={() => {}}
                      />
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label=""
                    inputProps={{
                      ...params.inputProps,
                      autoComplete: 'new-password', // disable autocomplete and autofill
                    }}
                    error={validationProps?.error}
                    helperText={validationProps?.helperText}
                  />
                )}
                disabled={disabled}
              />
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mt: 1 }} gap={2}>
                <FormControlLabel
                  sx={{ flexGrow: 1, ml: 0 }}
                  label={translate(I18N_KEYS.GENERAL.LORA_WEIGHT)}
                  labelPlacement="start"
                  disabled={disabled}
                  control={
                    <Slider
                      size="small"
                      value={(param.value as MultiLoraValue).weight}
                      onChange={(event, newValue) => {
                        handleChange(node?.id || param.id, {
                          weight: newValue,
                          selectedLora: (param.value as MultiLoraValue).selectedLora,
                        });
                      }}
                      aria-labelledby="weight-slider"
                      max={node?.data?.maxWeight}
                      min={node?.data?.minWeight}
                      sx={{ ml: 2 }}
                      step={node?.data?.stepWeight}
                      valueLabelDisplay="auto"
                      disabled={disabled}
                    />
                  }
                />
                <Input
                  value={(param.value as MultiLoraValue).weight}
                  size="small"
                  onChange={(e) =>
                    handleChange(node?.id || param.id, {
                      weight: e.target.value,
                      selectedLora: (param.value as MultiLoraValue).selectedLora,
                    })
                  }
                  inputProps={{
                    step: node?.data?.stepWeight,
                    min: node?.data?.minWeight,
                    max: node?.data?.maxWeight,
                    type: 'number',
                    'aria-labelledby': 'input-slider',
                    style: {
                      width: '50px',
                      fontSize: '10px',
                    },
                  }}
                  sx={{ ml: 2 }}
                  disabled={disabled}
                />
              </Box>
            </>
          )}
        </>
      );
    case 'import':
      return (
        <UploadFile
          id={param.id}
          value={param.value}
          onUpload={handleChange}
          isLoading={false}
          setIsUploading={() => {}}
          isGuest={false}
        />
      );
    case NodeType.Prompt:
      return (
        <TextField
          placeholder={translate(I18N_KEYS.SHARE_WORKFLOW_MODAL.INPUTS.PROMPT_PLACEHOLDER)}
          fullWidth
          multiline
          value={(param.value as PromptValue)?.prompt}
          onChange={(e) =>
            handleChange(param.id, {
              prompt: e.target.value,
            })
          }
          rows={4}
          inputProps={{
            style: { resize: 'vertical' },
          }}
          sx={{
            background: `${color.Black100}`,
          }}
          disabled={disabled}
        />
      );
    default:
      return null;
  }
};

export function getWorkflowInputNodes(nodes: Node[], edges: Edge[]): Node[] {
  const outputNodes = nodes?.filter((node) => node.type === NodeType.WorkflowOutput);

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const reverseAdjMap = new Map<string, string[]>();

  edges.forEach((edge) => {
    const targetNodes = reverseAdjMap.get(edge.target) || [];
    targetNodes.push(edge.source);
    reverseAdjMap.set(edge.target, targetNodes);
  });

  const inputNodeIds = new Set<string>();

  function findInputsForNode(nodeId: string): void {
    const sourceNodes = reverseAdjMap.get(nodeId) || [];

    if (sourceNodes.length === 0) {
      inputNodeIds.add(nodeId);
    } else {
      sourceNodes.forEach((sourceId) => {
        findInputsForNode(sourceId);
      });
    }
  }

  outputNodes.forEach((outputNode) => {
    findInputsForNode(outputNode.id);
  });

  return Array.from(inputNodeIds)
    .map((id) => nodeMap.get(id))
    .filter((node): node is Node => node !== undefined);
}
