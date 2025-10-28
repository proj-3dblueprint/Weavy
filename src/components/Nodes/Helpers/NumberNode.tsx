import { useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Input } from '@/UI/Input/Input';
import { DynamicNode2 } from '@/components/Nodes/DynamicNode/DynamicNode2';
import { AppCheckbox } from '@/UI/AppCheckbox/AppCheckbox';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenVer } from '@/UI/styles';
import { colorMap } from '@/colors';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { useNumberView } from '@/components/Recipe/FlowContext';
import { useNumberInput } from '@/hooks/useNumberInput';
import type { NumberData } from '@/types/node';
import type { NodeId, NumberMode } from 'web';

interface NumberInputProps {
  value?: number;
  onSubmit: (value: number) => void;
  decimals?: 0 | 1 | 2;
  disabled?: boolean;
  label?: string;
  fullWidth?: boolean;
}

function NumberInput({ value, onSubmit, disabled, decimals, label, fullWidth }: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleBlur, handleFocus, handleKeyDown, handleChange, displayedValue } = useNumberInput({
    inputRef,
    value,
    onSubmit,
    decimals,
  });

  return (
    <Input
      value={displayedValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDownCapture={handleKeyDown}
      inputRef={inputRef}
      autoComplete="off"
      disabled={disabled}
      fullWidth={fullWidth}
      label={label}
    />
  );
}

function NumberNode({ id, data }: { id: NodeId; data: NumberData }) {
  const role = useUserWorkflowRole();
  const editable = data.isLocked !== true && role === 'editor';
  const { t } = useTranslation();

  const view = useNumberView(id);
  const { value, min, max, mode } = data;

  const handleModeChange = useCallback((mode: NumberMode) => void view.setMode(mode, false), [view]);
  const handleNumberChange = useCallback((value: number) => void view.setValue(value, false), [view]);
  const handleMinChange = useCallback((value: number) => void view.setMin(value, false), [view]);
  const handleMaxChange = useCallback((value: number) => void view.setMax(value, false), [view]);

  return (
    <DynamicNode2
      id={id}
      data={data}
      className="number"
      handleColor={colorMap.get('Yambo_Green')}
      size="small"
      outputHandleYPos="31px"
    >
      <Box sx={{ width: '100%', pointerEvents: !editable ? 'none' : '' }}>
        <FlexCenVer sx={{ gap: 1 }} className="nodrag">
          <NumberInput
            disabled={!editable}
            value={value}
            onSubmit={handleNumberChange}
            decimals={mode === 'integer' ? 0 : 2}
            fullWidth
          />
        </FlexCenVer>
        <AppCheckbox
          disabled={!editable}
          checked={mode === 'number'}
          label={t(I18N_KEYS.RECIPE_MAIN.NODES.NUMBER.IS_FLOAT)}
          onChange={(_, checked) => handleModeChange(checked ? 'number' : 'integer')}
          sx={{ my: 3 }}
        />
        <FlexCenVer sx={{ justifyContent: 'space-between', gap: 1 }} className="nodrag">
          <NumberInput
            label={t(I18N_KEYS.RECIPE_MAIN.NODES.NUMBER.MIN)}
            disabled={!editable}
            value={min}
            decimals={mode === 'integer' ? 0 : 2}
            onSubmit={handleMinChange}
          />
          <NumberInput
            label={t(I18N_KEYS.RECIPE_MAIN.NODES.NUMBER.MAX)}
            disabled={!editable}
            value={max}
            decimals={mode === 'integer' ? 0 : 2}
            onSubmit={handleMaxChange}
          />
        </FlexCenVer>
      </Box>
    </DynamicNode2>
  );
}

export default NumberNode;
