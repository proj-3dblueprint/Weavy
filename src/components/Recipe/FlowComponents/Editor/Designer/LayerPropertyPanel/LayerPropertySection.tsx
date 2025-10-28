import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Divider, Box } from '@mui/material';
import { FlexCol, FlexRow } from '@/UI/styles';
import { color } from '@/colors';
import { useIsHovered } from '@/hooks/useIsHovered';
import { I18N_KEYS } from '@/language/keys';
import { layerPropertyGroups } from './layerProperties';
import { LayerPropertyInput } from './LayerPropertyInput';
import { LayerPropertyPanelField } from './LayerPropertyPanelField';
import { DimensionsLockAspectRatioButton } from './LockDimensionsAspectRatioButton';
import { FlipLayerButtons } from './FlipLayerButtons';
import { AlignmentButtons } from './AlignmentButtons';
import type { LayerId, NodeId } from 'web';
import type { LayerProperty, PropertyKey, LayerPropertyLayoutRow, LayerPropertyLayoutSection } from './layerProperties';

interface LayerPropertiesSectionProps {
  index: number;
  section: LayerPropertyLayoutSection;
  nodeId: NodeId;
  layerId: LayerId;
}

export const LayerPropertiesSection = ({ index, section, nodeId, layerId }: LayerPropertiesSectionProps) => {
  return (
    <FlexCol key={`section-${index}`} sx={{ gap: 2 }}>
      {index !== 0 ? <Divider sx={{ borderColor: color.White08_T }} /> : null}
      <FlexCol sx={{ gap: 2 }}>
        {section.map((row: LayerPropertyLayoutRow) => {
          const key = Array.isArray(row) ? row.join('-') : row;
          return (
            <Fragment key={key}>
              <Row row={row} nodeId={nodeId} layerId={layerId} />
              {key === 'dimensions' ? <AlignmentRow nodeId={nodeId} layerId={layerId} /> : null}
            </Fragment>
          );
        })}
      </FlexCol>
    </FlexCol>
  );
};

interface AlignmentRowProps {
  nodeId: NodeId;
  layerId: LayerId;
}

const AlignmentRow = ({ nodeId, layerId }: AlignmentRowProps) => {
  const { t } = useTranslation();
  return (
    <FlexRow sx={{ gap: 0.5, flexShrink: 1 }}>
      <LayerPropertyPanelField key="layer-alignment" label={t(I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.ALIGNMENT)}>
        <AlignmentButtons layerId={layerId} nodeId={nodeId} />
      </LayerPropertyPanelField>
    </FlexRow>
  );
};

const Row = ({ row, nodeId, layerId }: { row: LayerPropertyLayoutRow; nodeId: NodeId; layerId: LayerId }) => {
  const { t } = useTranslation();
  const { isHovered: isHovering, ...elementProps } = useIsHovered();
  return (
    <FlexRow sx={{ gap: 0.5, flexShrink: 1 }} {...elementProps}>
      {Array.isArray(row) ? (
        <FlexRow sx={{ gap: 0.5 }}>
          {row.map((groupKey) => (
            <Group nodeId={nodeId} layerId={layerId} groupKey={groupKey} key={groupKey} />
          ))}
        </FlexRow>
      ) : (
        <Group fullWidth nodeId={nodeId} layerId={layerId} groupKey={row} key={row} />
      )}

      {row === 'rotation' ? (
        <LayerPropertyPanelField label={t(I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.FLIP)}>
          <FlipLayerButtons nodeId={nodeId} layerId={layerId} />
        </LayerPropertyPanelField>
      ) : null}
      {row === 'dimensions' ? (
        <Box sx={{ alignSelf: 'end' }}>
          <DimensionsLockAspectRatioButton layerId={layerId} nodeId={nodeId} isHovering={isHovering} />
        </Box>
      ) : null}
    </FlexRow>
  );
};

function Group({
  layerId,
  nodeId,
  groupKey,
  fullWidth,
}: {
  groupKey: LayerProperty;
  nodeId: NodeId;
  layerId: LayerId;
  fullWidth?: boolean;
}) {
  const { t } = useTranslation();
  const group = layerPropertyGroups[groupKey];
  return (
    <LayerPropertyPanelField key={groupKey} label={t(group.label)}>
      {group.properties.map((propKey: PropertyKey) => {
        return (
          <LayerPropertyInput
            key={`property-${groupKey}-${propKey}`}
            layerId={layerId}
            groupKey={groupKey}
            propKey={propKey}
            nodeId={nodeId}
            size={fullWidth ? 'large' : 'small'}
          />
        );
      })}
    </LayerPropertyPanelField>
  );
}
