import { KeyboardEvent, ChangeEvent, useCallback, useState, useRef } from 'react';
import { Box, InputBaseProps, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { FlexCenVer, FlexCol } from '@/UI/styles';
import { Input } from '@/UI/Input/Input';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { XIcon } from '@/UI/Icons/XIcon';
import { I18N_KEYS } from '@/language/keys';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { useStringArrayView } from '../Recipe/FlowContext';
import { hasEditingPermissions } from './Utils';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';

import type { NodeId } from 'web';
import type { StringArrayData } from '@/types/node';

interface ArrayNodeProps {
  id: NodeId;
  data: StringArrayData & { result?: string[] };
}

export function ArrayNode({ id, data }: ArrayNodeProps) {
  const { t } = useTranslation();
  const view = useStringArrayView(id);

  const { delimiter, placeholder } = data;

  const handleItemChange = useCallback((index: number, value: string) => view.setItem(index, value), [view]);
  const handleItemDelete = useCallback((index: number) => view.deleteItem(index), [view]);
  const handleItemAdd = useCallback(() => view.addItem(''), [view]);
  const setDelimiter = useCallback((value: string) => view.setDelimiter(value), [view]);

  const role = useUserWorkflowRole();
  const editable = hasEditingPermissions(role, data);

  const inputConnected = !!data.inputNode?.string;

  const currentArray: string[] = Array.isArray(data.result) ? data.result : [];

  return (
    <DynamicNode2 id={id} data={data} className="array" inputHandleYPos="31px" outputHandleYPos="31px">
      <FlexCol sx={{ gap: 1 }}>
        {inputConnected && (
          <FlexCenVer sx={{ gap: 1 }}>
            <Typography variant="body-sm-rg">{t(I18N_KEYS.RECIPE_MAIN.NODES.ARRAY.SPLIT_TEXT_BY)}</Typography>
            <TextInput
              value={delimiter}
              onSubmit={(value: string) => void setDelimiter(value)}
              disabled={!editable}
              sx={{ width: '40px' }}
            />
          </FlexCenVer>
        )}
        {currentArray?.map((item, index) => (
          <ArrayRow
            key={index}
            index={index}
            value={item}
            onSubmit={(index: number, value: string) => void handleItemChange(index, value)}
            onDelete={(index: number) => void handleItemDelete(index)}
            disabled={!editable || inputConnected}
            placeholder={placeholder || t(I18N_KEYS.RECIPE_MAIN.NODES.ARRAY.PLACEHOLDER)}
          />
        ))}
        {editable && !inputConnected && (
          <Box>
            <ButtonContained
              mode="text"
              size="small"
              onClick={() => void handleItemAdd()}
              sx={{ pointerEvents: data.isLocked ? 'none' : '' }}
            >
              {t(I18N_KEYS.RECIPE_MAIN.NODES.ARRAY.ADD_ITEM)}
            </ButtonContained>
          </Box>
        )}
      </FlexCol>
    </DynamicNode2>
  );
}

function ArrayRow({
  index,
  value,
  onSubmit,
  onDelete,
  disabled,
  placeholder,
}: {
  index: number;
  value: string;
  onSubmit: (index: number, value: string) => void;
  onDelete: (index: number) => void;
  disabled?: boolean;
  placeholder: string;
}) {
  const handleDelete = useCallback(() => onDelete(index), [index, onDelete]);

  return (
    <FlexCenVer sx={{ gap: 1 }}>
      <TextInput
        value={value}
        onSubmit={(value: string) => onSubmit(index, value)}
        disabled={disabled}
        placeholder={placeholder}
        fullWidth
      />
      {!disabled && (
        <AppIconButton onClick={handleDelete} width={32} height={32} mode="on-dark">
          <XIcon />
        </AppIconButton>
      )}
    </FlexCenVer>
  );
}

interface TextInputProps extends Omit<InputBaseProps, 'size' | 'ref' | 'onSubmit' | 'onChange' | 'onBlur' | 'onFocus'> {
  value: string;
  onSubmit: (value: string) => void;
}

function TextInput({ value, onSubmit, ...restProps }: TextInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState<string>();

  const handleSubmit = useCallback(
    (newValue: string | undefined) => {
      if (newValue !== undefined && newValue !== '') {
        onSubmit(newValue);
      } else {
        setLocalValue(value);
      }
    },
    [onSubmit, value],
  );

  const handleKeyDown = useCallback(
    (evt: KeyboardEvent<HTMLInputElement>) => {
      if (evt.code === 'Enter') {
        if (localValue === undefined || localValue === '') {
          setLocalValue(value);
        } else {
          handleSubmit(localValue);
        }
      } else if (evt.code === 'Escape') {
        // press Escape -> cancel edit
        setLocalValue(value);
      } else if (evt.code === 'z' && evt.getModifierState('Control')) {
        // stop Cmd+z propagation
        evt.stopPropagation();
        evt.preventDefault();
      } else if (evt.code === 'Backspace' || evt.code === 'Delete') {
        evt.stopPropagation();
      }
    },
    [localValue, handleSubmit, value],
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (localValue !== undefined) {
      handleSubmit(localValue);
    }
  }, [localValue, handleSubmit]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  const displayedValue = isFocused ? localValue : value;

  return (
    <Input
      ref={inputRef}
      className="nodrag"
      value={displayedValue}
      {...restProps}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
