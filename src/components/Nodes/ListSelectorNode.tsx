import { useEffect, useCallback, useState } from 'react';
import { useUpdateNodeInternals } from 'reactflow';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Dropdown } from '@/UI/Dropdown/Dropdown';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenVer, FlexCol } from '@/UI/styles';
import { useIsHovered } from '@/hooks/useIsHovered';
import { Input } from '@/UI/Input/Input';
import { AppXBtn } from '@/UI/AppXBtn/AppXBtn';
import { FF_TEXT_ITERATOR } from '@/consts/featureFlags';
import { TextIteratorIcon } from '@/UI/Icons';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { getListSelectorIteratorMaxOptions } from '@/utils/listNode';
import { useListSelectorView, useNode, useNodeData } from '../Recipe/FlowContext';
import { AddItemButton } from '../Common/AddItemButton/AddItemButton';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';
import type { ListSelectorData } from '@/types/node';

interface ListSelectorProps {
  id: string;
  data: ListSelectorData;
  disabled: boolean;
}

const ListSelectorListView = ({ id, data, disabled }: ListSelectorProps) => {
  const { t } = useTranslation();
  const view = useListSelectorView(id);

  const handleDropdownChange = useCallback(
    (optionId: string) => {
      const newIndex = Number(optionId);
      void view.setSelected(newIndex);
    },
    [view],
  );

  const dropdownOptions = view.getCurrentOptions();

  return (
    <Dropdown
      width="100%"
      size="large"
      matchTriggerWidth
      options={dropdownOptions.map((option, index) => ({ id: String(index), label: option, value: option }))}
      value={dropdownOptions[data.selected]}
      onChange={(option) => handleDropdownChange(option.id)}
      emptyState={
        dropdownOptions.length === 0
          ? t(I18N_KEYS.RECIPE_MAIN.NODES.LIST_NODE.ADD_OPTIONS_VIA_PROPERTIES_PANEL)
          : t(I18N_KEYS.RECIPE_MAIN.NODES.LIST_NODE.SELECT_AN_OPTION)
      }
      disabled={disabled}
    />
  );
};

const IteratorItem = ({
  editable = false,
  item,
  index,
  onValueChange,
  onDelete,
  disableDelete = false,
}: {
  editable?: boolean;
  item: string;
  index: number;
  onValueChange: (value: string) => void;
  onDelete: () => void;
  disableDelete?: boolean;
}) => {
  const { t } = useTranslation();
  const { isHovered, ...hoverProps } = useIsHovered();
  const [isFocused, setIsFocused] = useState(false);
  return (
    <FlexCenVer sx={{ width: '100%', height: '32px', gap: 0.5 }} {...hoverProps} className={isFocused ? 'nodrag' : ''}>
      <Input
        fullWidth
        disabled={!editable}
        value={item}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={t(I18N_KEYS.RECIPE_MAIN.NODES.LIST_NODE.ITERATOR.PLACEHOLDER, { index: index + 1 })}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {editable && isHovered ? <AppXBtn disabled={disableDelete} onClick={onDelete} size={20} /> : null}
    </FlexCenVer>
  );
};

const ListSelectorIteratorView = ({ id, disabled: disabledProp }: ListSelectorProps) => {
  const { t } = useTranslation();
  const view = useListSelectorView(id);
  const disabled = disabledProp || view.isExposed();
  const options = view.getCurrentOptions();

  const handleValueChange = useCallback(
    (value: string, index: number) => {
      const newOptions = options.map((option, i) => (i === index ? value : option));
      void view.setOptions(newOptions);
    },
    [view, options],
  );

  const handleAddItem = useCallback(() => {
    const newOptions = [...options, ''];
    void view.setOptions(newOptions);
  }, [view, options]);

  const handleDelete = useCallback(
    (index: number) => {
      const newOptions = options.filter((_, i) => i !== index);
      void view.setOptions(newOptions);
    },
    [view, options],
  );

  return (
    <FlexCol sx={{ width: '100%', gap: 0.75, cursor: 'default' }}>
      {options.map((option, index) => (
        <IteratorItem
          key={index}
          item={option}
          index={index}
          onValueChange={(newValue) => handleValueChange(newValue, index)}
          onDelete={() => handleDelete(index)}
          editable={!disabled}
          disableDelete={options.length === 1}
        />
      ))}
      {!disabled ? (
        <div>
          <AddItemButton
            show
            onClick={handleAddItem}
            text={t(I18N_KEYS.RECIPE_MAIN.NODES.LIST_NODE.ITERATOR.ADD_ITEM)}
            disabled={options.length >= getListSelectorIteratorMaxOptions()}
          />
        </div>
      ) : null}
    </FlexCol>
  );
};

export function ListSelectorNode({ id }: ListSelectorProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  const role = useUserWorkflowRole();
  const textIteratorEnabled = useFeatureFlagEnabled(FF_TEXT_ITERATOR);
  const data = useNodeData<ListSelectorData>(id);
  const node = useNode(id);
  const disabled = role !== 'editor' || node.locked;

  useEffect(() => {
    // this is to update the node internals when the input handles are exposed
    updateNodeInternals(id);
  }, [data.handles.input, updateNodeInternals, id]);

  return (
    <DynamicNode2
      id={id}
      data={data}
      className="mux"
      size={data.isIterator && textIteratorEnabled ? 'medium' : 'small'}
      icon={data.isIterator && textIteratorEnabled ? <TextIteratorIcon /> : null}
      outputHandleYPos="31px"
      inputHandleYPos="31px"
    >
      <Box
        sx={{
          width: '100%',
          pointerEvents: disabled ? 'none' : '',
        }}
      >
        {data.isIterator && textIteratorEnabled ? (
          <ListSelectorIteratorView id={id} data={data} disabled={disabled} />
        ) : (
          <ListSelectorListView id={id} data={data} disabled={disabled} />
        )}
      </Box>
    </DynamicNode2>
  );
}
