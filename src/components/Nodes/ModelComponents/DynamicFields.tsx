import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Tooltip } from '@mui/material';
import { PanelField } from '@/UI/PanelField/PanelField';
import { I18N_KEYS } from '@/language/keys';
import { useNodeData, useParameterView } from '@/components/Recipe/FlowContext';
import { ParamExposureComponent, renderComponent } from '../ModelNodesUtils';
import type { NodeId, ParameterValue } from 'web';

const horizontalLayoutTypes = ['boolean'];

function DynamicFields({ nodeId }: { nodeId: NodeId }) {
  const view = useParameterView(nodeId);
  const handleChange = useCallback(
    (key: string, newValue: ParameterValue) => void view.setParameterValue(key, newValue),
    [view],
  );
  const { t } = useTranslation();
  const version = useNodeData(nodeId).version;

  return (
    <>
      {view.getParameterIds().map((key) => {
        const property = view.getParameterInfo(key);
        if (property === undefined) return null;
        const value = view.getParameterValue(key);
        const isExposed = view.isParameterExposed(key);
        return (
          <Box key={`${key}-dynamic-field`} sx={{ position: 'relative', mb: 2 }}>
            <PanelField
              label={property.title}
              tooltipText={property.description}
              showSlotOnHoverOnly
              disabled={isExposed}
              useHorizontalLayout={horizontalLayoutTypes.includes(property.type)}
              slot={
                (version === 2 || version === 3) && (
                  <Tooltip
                    title={
                      isExposed
                        ? t(I18N_KEYS.RECIPE_MAIN.FLOW.DRAWER.MODEL_PROPERTIES.SET_AS_PARAMETER)
                        : t(I18N_KEYS.RECIPE_MAIN.FLOW.DRAWER.MODEL_PROPERTIES.SET_AS_INPUT)
                    }
                  >
                    <Box>
                      <ParamExposureComponent nodeId={nodeId} paramKey={key} isExposed={isExposed} />
                    </Box>
                  </Tooltip>
                )
              }
            >
              {value && renderComponent(key, value, property, isExposed, handleChange)}
            </PanelField>
          </Box>
        );
      })}
    </>
  );
}

export default DynamicFields;
