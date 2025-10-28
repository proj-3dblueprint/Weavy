import { useEffect, useMemo, useCallback } from 'react';
import { useUpdateNodeInternals } from 'reactflow';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Dropdown, Option } from '@/UI/Dropdown/Dropdown';
import { I18N_KEYS } from '@/language/keys';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { useNumberSelectorView } from '../Recipe/FlowContext';
import { hasEditingPermissions } from './Utils';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';

import type { NumberSelectorData } from '@/types/node';

interface NumberSelectorProps {
  id: string;
  data: NumberSelectorData;
}

export function NumberSelectorNode({ id, data }: NumberSelectorProps) {
  const { t } = useTranslation();
  const updateNodeInternals = useUpdateNodeInternals();
  const role = useUserWorkflowRole();
  const view = useNumberSelectorView(id);

  const selectedIndex = data.selected ?? 0;

  useEffect(() => {
    // this is to update the node internals when the input handles are exposed
    updateNodeInternals(id);
  }, [data.handles.input, updateNodeInternals, id]);

  const handleDropdownChange = useCallback(
    (option: Option<number>) => {
      const newIndex = Number(option.id);
      void view.setSelected(newIndex, false);
    },
    [view],
  );

  const optionsAsObjects: Option<number>[] = useMemo(() => {
    const options = view.getCurrentOptions();
    if (Array.isArray(options)) {
      return options
        .filter((option) => option !== null && option !== undefined)
        .map((option, index) => ({ id: String(index), label: String(option), value: option }));
    }
    return [];
  }, [view]);

  const dropdownOptions = optionsAsObjects ?? [];
  const selectedValue = dropdownOptions[selectedIndex]?.value ?? null;

  return (
    <DynamicNode2 id={id} data={data} className="mux" size="small" outputHandleYPos="31px" inputHandleYPos="31px">
      <Box
        sx={{
          width: '100%',
          pointerEvents: !hasEditingPermissions(role, data) ? 'none' : '',
        }}
      >
        <Dropdown
          width="100%"
          size="large"
          matchTriggerWidth
          options={dropdownOptions}
          value={selectedValue}
          onChange={handleDropdownChange}
          emptyState={
            dropdownOptions.length === 0
              ? t(I18N_KEYS.RECIPE_MAIN.NODES.LIST_NODE.ADD_OPTIONS_VIA_PROPERTIES_PANEL)
              : t(I18N_KEYS.RECIPE_MAIN.NODES.LIST_NODE.SELECT_AN_OPTION)
          }
        />
      </Box>
    </DynamicNode2>
  );
}
