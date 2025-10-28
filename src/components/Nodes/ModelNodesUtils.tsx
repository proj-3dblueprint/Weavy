import { Typography, TextField, CircularProgress } from '@mui/material';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { type TFunction } from 'i18next';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { HandleType } from '@/enums/handle-type.enum';
import { Flex, FlexCenVer, FlexCol } from '@/UI/styles';
import { Input as AppInput } from '@/UI/Input/Input';
import { Dropdown, Option } from '@/UI/Dropdown/Dropdown';
import { AppCheckbox } from '@/UI/AppCheckbox/AppCheckbox';
import { SetAsInputIcon } from '@/UI/Icons/SetAsInputIcon';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { RevertAsInputIcon } from '@/UI/Icons/RevertAsInputIcon';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { XIcon } from '@/UI/Icons';
import { useWorkflowStore } from '@/state/workflow.state';
import { TextArea } from '@/UI/TextArea/TextArea';
import { useParameterView } from '../Recipe/FlowContext';
import { NumberInputField as NumberInputFieldV2 } from './input-fields/number-input-field/number-input-fieldV2.component';
import { ImageSizeInput } from './input-fields/image-size-field/ImageSizeInput';
import type { NodeId, ParameterValue } from 'web';
import type { ParameterInfo } from '@/types/node';

export const ParamExposureComponent = ({
  nodeId,
  paramKey,
  isExposed,
}: {
  nodeId: NodeId;
  paramKey: string;
  isExposed: boolean;
}) => {
  const view = useParameterView(nodeId);
  const nodeTypes = useWorkflowStore((state) => state.nodeTypes);
  return (
    <AppIconButton
      mode="on-dark"
      width={24}
      height={24}
      onClick={isExposed ? () => view.collapseParameter(paramKey) : () => view.exposeParameter(paramKey, nodeTypes)}
    >
      <FlexCenVer sx={{ '&:hover': { color: color.White100 } }}>
        {isExposed ? <RevertAsInputIcon /> : <SetAsInputIcon />}
      </FlexCenVer>
    </AppIconButton>
  );
};

export const TextFieldWithCursor = ({ id, value, property, handleChange }) => {
  const inputRef = useRef(null);
  const [cursorPosition, setCursorPosition] = useState(null);

  useEffect(() => {
    // If we have a stored cursor position and the input is focused
    if (cursorPosition !== null && inputRef.current === document.activeElement) {
      // @ts-expect-error - fix this
      inputRef.current?.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [value, cursorPosition]);

  const handleInputChange = (e) => {
    const newCursorPosition = e.target.selectionStart;
    setCursorPosition(newCursorPosition);
    handleChange(id, e.target.value);
  };

  return (
    <TextArea
      disabled={property.exposed}
      id={id}
      value={value}
      rows={8}
      onChange={handleInputChange}
      inputRef={inputRef}
    />
  );
};

export const renderEmptyState = (nodeOutputType: HandleType | undefined, isProcessing: boolean, t: TFunction) => {
  switch (nodeOutputType) {
    case HandleType.Text:
      return (
        <Flex
          sx={{
            bgcolor: color.Black84,
            width: '100%',
            position: 'relative',
          }}
        >
          <TextField
            sx={{
              bgcolor: color.Black84,
              borderColor: color.White04_T,
              // borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                p: 3,
                '& fieldset': {
                  borderColor: color.White04_T,
                },
                '&:hover fieldset': {
                  borderColor: color.White04_T,
                },
                '&.Mui-focused fieldset': {
                  borderColor: color.White04_T,
                },
              },
            }}
            multiline
            minRows={16}
            // maxRows={20}
            fullWidth
            size="small"
            placeholder={t(I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.TEXT_MODEL.EMPTY_STATE_PLACEHOLDER)}
            InputProps={{
              readOnly: true,
              style: {
                fontSize: '16px',
                fontWeight: 500,
                color: color.White64_T,
              },
            }}
          />
          <Flex
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {isProcessing && (
              <CircularProgress
                size={24}
                sx={{
                  color: color.White64_T,
                }}
              />
            )}
          </Flex>
        </Flex>
      );
    default:
      return (
        <Flex className="media-container-dark" sx={{ width: '100%', height: '430px', position: 'relative' }}>
          <Flex
            sx={{
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {isProcessing && (
              <CircularProgress
                size={24}
                sx={{
                  color: color.White64_T,
                }}
              />
            )}
          </Flex>
        </Flex>
      );
  }
};

export const renderComponent = (
  key: string,
  value: ParameterValue,
  info: ParameterInfo,
  isExposed: boolean,
  handleChange: (key: string, value: ParameterValue) => void,
) => {
  const type = info.type;
  switch (type) {
    case 'integer_with_limits':
      return value.type === 'integer' ? (
        <NumberInputFieldV2
          key={`${key}-numberInputField`}
          inputKey={key}
          title={info.title}
          value={value.value}
          disabled={isExposed}
          min={info.min}
          max={info.max}
          type="integer"
          onChange={(_, newValue) => handleChange(key, { type: 'integer', value: Math.round(newValue) })}
        />
      ) : null;
    case 'float_with_limits':
      return value.type === 'float' ? (
        <NumberInputFieldV2
          key={`${key}-numberInputField`}
          inputKey={key}
          title={info.title}
          value={value.value}
          disabled={isExposed}
          min={info.min}
          max={info.max}
          type="float"
          onChange={(_, newValue) => handleChange(key, { type: 'float', value: newValue })}
        />
      ) : null;
    case 'integer':
      return value.type === 'integer' ? (
        <AppInput
          key={`${key}-input-integer`}
          fullWidth
          disabled={isExposed}
          value={value.value}
          size="small"
          inputProps={{ type: 'number' }}
          onChange={(e) => handleChange(key, { type: 'integer', value: parseInt(e.target.value) })}
        />
      ) : null;
    case 'integer_selector':
      return value.type === 'integer' ? (
        <Dropdown
          width="100%"
          matchTriggerWidth
          value={value.value}
          disabled={isExposed}
          onChange={(o: Option<number>) => handleChange(key, { type: 'integer', value: o.value })}
          options={
            info.options?.map((o) => ({
              id: `integer-${o}`,
              label: o,
              value: o,
            })) ?? []
          }
          size="large"
        />
      ) : null;
    case 'float':
      return value.type === 'float' ? (
        <AppInput
          key={`${key}-input-float`}
          fullWidth
          disabled={isExposed}
          value={value.value}
          size="small"
          inputProps={{ type: 'number', step: '0.1' }}
          onChange={(e) => handleChange(key, { type: 'float', value: parseFloat(e.target.value) })}
        />
      ) : null;
    case 'enum':
      return value.type === 'string' || value.type === 'integer' ? (
        <Dropdown
          width="100%"
          matchTriggerWidth
          value={value.value}
          disabled={isExposed}
          onChange={(o: Option<string>) =>
            handleChange(
              key,
              value.type === 'integer'
                ? { type: 'integer', value: parseInt(o.value) }
                : { type: 'string', value: o.value },
            )
          }
          options={
            info.options?.map((o) => ({
              id: o,
              label: o,
              value: o,
            })) ?? []
          }
          size="large"
        />
      ) : null;

    case 'boolean':
      return value.type === 'boolean' ? (
        <AppCheckbox
          checked={value.value}
          onChange={(e) => handleChange(key, { type: 'boolean', value: e.target.checked })}
          disabled={isExposed}
        />
      ) : null;
    case 'seed':
      return value.type === 'seed' ? (
        <FlexCenVer sx={{ gap: 2 }}>
          <AppCheckbox
            label={i18n.t(I18N_KEYS.RECIPE_MAIN.NODES.SEED.RANDOM)}
            checked={value.value.isRandom}
            onChange={(e) => handleChange(key, { type: 'seed', value: { ...value.value, isRandom: e.target.checked } })}
            disabled={isExposed}
          />
          <AppInput
            value={value.value.seed}
            inputProps={{ type: 'number' }}
            size="small"
            onChange={(e) =>
              handleChange(key, { type: 'seed', value: { ...value.value, seed: parseInt(e.target.value) } })
            }
            disabled={value.value.isRandom || isExposed}
            sx={{ ml: 1 }}
          />
        </FlexCenVer>
      ) : null;
    case 'string_array':
      return value.type === 'string_array' ? (
        <ArrayInput
          value={value.value}
          itemKey={key}
          exposed={isExposed}
          type="string"
          handleChange={(key, value) => handleChange(key, { type: 'string_array', value })}
        />
      ) : null;
    case 'string':
      return value.type === 'string' ? (
        <TextFieldWithCursor
          id={key}
          value={value.value}
          property={{ exposed: isExposed }}
          handleChange={(key, value) => handleChange(key, { type: 'string', value: value.toString() })}
        />
      ) : null;
    case 'image_size':
      return value.type === 'image_size' ? (
        <ImageSizeInput
          key={`${key}-image-size`}
          value={value.value}
          onChange={(newValue) => handleChange(key, { type: 'image_size', value: newValue })}
          options={info.options}
          disabled={isExposed}
        />
      ) : null;
    case 'file_array':
      // file array is not supported yet as model input
      return null;
    default: {
      const _exhaustiveCheck: never = type;
    }
  }
};

const ArrayInput = ({
  value,
  itemKey: key,
  exposed,
  type,
  handleChange,
}: {
  value: string[] | number[];
  itemKey: string;
  exposed: boolean;
  type: string;
  handleChange: (key: string, value: any) => void;
}) => {
  const { t } = useTranslation();

  const addItem = useCallback(() => {
    handleChange(key, [...value, type === 'string' ? '' : 0]);
  }, [value, handleChange, key]);

  return (
    <FlexCol sx={{ gap: 1 }}>
      {value.map((item, index) => (
        <FlexCenVer sx={{ gap: 1 }} key={`${key}-${index}`}>
          <Typography variant="body-sm-rg" sx={{ opacity: exposed ? 0.5 : 1, width: '12px' }}>
            {index + 1}
          </Typography>
          <AppInput
            disabled={exposed}
            fullWidth
            id={`${key}-${index}`}
            value={item}
            placeholder={t(I18N_KEYS.RECIPE_MAIN.FLOW.DRAWER.MODEL_PROPERTIES.LIST_ITEM_PLACEHOLDER)}
            onChange={(e) => {
              const inputValue: string = e.target.value;
              handleChange(key, [...value.slice(0, index), inputValue.toString(), ...value.slice(index + 1)]);
            }}
            size="small"
          />
          <AppIconButton
            disabled={exposed}
            mode="on-dark"
            width={24}
            height={24}
            onClick={() => handleChange(key, [...value.slice(0, index), ...value.slice(index + 1)])}
          >
            <XIcon width={16} height={16} />
          </AppIconButton>
        </FlexCenVer>
      ))}

      <ButtonContained onClick={addItem} size="small" mode="outlined" disabled={exposed} sx={{ width: 'fit-content' }}>
        {t(I18N_KEYS.RECIPE_MAIN.FLOW.DRAWER.MODEL_PROPERTIES.ADD_LIST_ITEM)}
      </ButtonContained>
    </FlexCol>
  );
};
