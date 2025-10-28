import { useCallback } from 'react';
import { LayerId, NodeId } from 'web';
import { useTranslation } from 'react-i18next';
import { useCompositorView, useNodeData } from '@/components/Recipe/FlowContext';
import { ColorPickerField } from '@/UI/ColorPicker/ColorPickerField';
import { CompositorNodeV3 } from '@/types/nodes/compositor';
import { log } from '@/logger/logger.ts';
import { PropertyToggleButtons } from '@/UI/AppToggleButtons';
import {
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
  TextAlignTopIcon,
  TextAlignBottomIcon,
  TextAlignMiddleIcon,
} from '@/UI/Icons';
import { GroupKey, layerProperties } from './layerProperties';
import { NumberInput } from './NumberInput';
import { SelectInput } from './SelectInput';
import type React from 'react';
import type { WebColor } from '@/UI/ColorPicker/ColorPicker';
import type {
  ColorPropertyKey,
  NumberPropertyKey,
  PropertyKey,
  SelectPropertyKey,
  TogglePropertyKey,
} from './layerProperties';

const logger = log.getLogger('LayerPropertyInput');

// Type guard to narrow property types
function isNumberProperty(propKey: PropertyKey): propKey is NumberPropertyKey {
  return layerProperties[propKey].type === 'number';
}

function isSelectProperty(propKey: PropertyKey): propKey is SelectPropertyKey {
  return layerProperties[propKey].type === 'select';
}

function isColorProperty(propKey: PropertyKey): propKey is ColorPropertyKey {
  return layerProperties[propKey].type === 'color';
}

function isToggleProperty(propKey: PropertyKey): propKey is TogglePropertyKey {
  return layerProperties[propKey].type === 'toggle';
}

interface LayerPropertyInputProps {
  layerId: LayerId;
  groupKey: GroupKey;
  propKey: PropertyKey;
  nodeId: NodeId;
  size?: 'small' | 'large';
}

// Separate components for different property types
function NumberPropertyInput({
  propKey,
  nodeId,
  layerId,
}: {
  propKey: NumberPropertyKey;
  nodeId: NodeId;
  layerId: LayerId;
}) {
  const compositorView = useCompositorView(nodeId);
  const layer = useNodeData<CompositorNodeV3>(nodeId).data.layers[layerId];
  if (!layer) {
    logger.warn('NumberPropertyInput(): missing layer', { nodeId, layerId });
  }
  const prop = layerProperties[propKey];
  const { label, unit } = prop;

  const value = prop.getValue(layer);
  const onSubmit = useCallback<(v: number) => void>(
    (value: number) => prop.setValue(compositorView, layerId, value),
    [prop, compositorView, layerId],
  );

  return (
    <NumberInput
      value={value}
      onSubmit={onSubmit}
      disabled={layer?.locked}
      prefix={label}
      unit={unit}
      format={prop.format}
      parse={prop.parse}
      decimals={prop.decimals}
    />
  );
}

function SelectPropertyInput({
  propKey,
  nodeId,
  layerId,
  size = 'small',
}: {
  propKey: SelectPropertyKey;
  nodeId: NodeId;
  layerId: LayerId;
  size?: 'small' | 'large';
}) {
  const compositorView = useCompositorView(nodeId);
  const layer = useNodeData<CompositorNodeV3>(nodeId).data.layers[layerId];
  if (!layer) {
    logger.warn('SelectPropertyInput(): missing layer', { nodeId, layerId });
  }
  const prop = layerProperties[propKey];
  const { t } = useTranslation();
  const translatedOptions = prop.options(compositorView, layerId).map((option: { value: string; label: string }) => ({
    value: option.value,
    label: t(option.label),
    id: option.value,
  }));

  const value = prop.getValue(layer);
  const onSubmit = useCallback<(value: string, ongoing?: boolean) => void>(
    (value: string, ongoing = false) => prop.setValue(compositorView, layerId, value, ongoing),
    [prop, compositorView, layerId],
  );
  const handleReset = useCallback(() => compositorView.cancelOngoingAction(), [compositorView]);

  return (
    <SelectInput
      disabled={layer?.locked}
      value={value}
      helperText={prop.helperText}
      noOptionsText={prop.noOptionsText}
      onReset={handleReset}
      onSubmit={onSubmit}
      options={translatedOptions}
      search={prop.search}
      size={size}
    />
  );
}

function TogglePropertyInput({
  propKey,
  nodeId,
  layerId,
}: {
  propKey: TogglePropertyKey;
  nodeId: NodeId;
  layerId: LayerId;
}) {
  const compositorView = useCompositorView(nodeId);
  const layer = useNodeData<CompositorNodeV3>(nodeId).data.layers[layerId];
  if (!layer) {
    logger.warn('TogglePropertyInput(): missing layer', { nodeId, layerId });
  }
  const prop = layerProperties[propKey];
  const { t } = useTranslation();

  const value = prop.getValue(layer);
  const onSubmit = useCallback<(value: string | null, ongoing?: boolean) => void>(
    (value: string | null, ongoing = false) => {
      if (value !== null) {
        prop.setValue(compositorView, layerId, value, ongoing);
      }
    },
    [prop, compositorView, layerId],
  );

  // Create options with icons for text alignment
  const rawOptions = prop.options();
  const options = rawOptions.map((option: { value: string; label: string }) => {
    let iconComponent: React.ReactNode = null;

    // Map alignment values to icons
    if (propKey === 'textHorizontalAlign') {
      switch (option.value) {
        case 'left':
          iconComponent = <TextAlignLeftIcon />;
          break;
        case 'center':
          iconComponent = <TextAlignCenterIcon />;
          break;
        case 'right':
          iconComponent = <TextAlignRightIcon />;
          break;
      }
    }
    if (propKey === 'textVerticalAlign') {
      switch (option.value) {
        case 'top':
          iconComponent = <TextAlignTopIcon />;
          break;
        case 'bottom':
          iconComponent = <TextAlignBottomIcon />;
          break;
        case 'center':
          iconComponent = <TextAlignMiddleIcon />;
          break;
      }
    }

    return {
      value: option.value,
      label: iconComponent || t(option.label),
      'aria-label': t(option.label),
    };
  });

  return (
    <PropertyToggleButtons
      disabled={layer?.locked}
      value={value}
      onChange={onSubmit}
      options={options}
      allowDeselect={false}
    />
  );
}

function ColorPropertyInput({
  propKey,
  nodeId,
  layerId,
}: {
  propKey: ColorPropertyKey;
  nodeId: NodeId;
  layerId: LayerId;
}) {
  const compositorView = useCompositorView(nodeId);
  const layer = useNodeData<CompositorNodeV3>(nodeId).data.layers[layerId];
  if (!layer) {
    logger.warn('ColorPropertyInput(): missing layer', { nodeId, layerId });
  }
  const prop = layerProperties[propKey];

  const value = prop.getValue(layer);
  const onChange = useCallback(
    (value: WebColor) => prop.setValue(compositorView, layerId, value, true),
    [compositorView, prop, layerId],
  );

  const onChangeEnd = useCallback(
    (value: WebColor) => prop.setValue(compositorView, layerId, value, false),
    [compositorView, prop, layerId],
  );

  return (
    <ColorPickerField
      color={value}
      disabled={layer?.locked}
      offset={30}
      onChange={onChange}
      onChangeEnd={onChangeEnd}
    />
  );
}

// function BooleanPropertyInput({
//   propKey,
//   nodeId,
//   layerId,
// }: {
//   propKey: BooleanPropertyKey;
//   nodeId: NodeId;
//   layerId: LayerId;
// }) {
//   const compositorView = useCompositorView();
//   const prop = layerProperties[propKey];
//   const disabled = compositorView.getLayer(nodeId, layerId).locked;

//   const getValue = useCallback(() => prop.getValue(compositorView, nodeId, layerId), [prop, compositorView, nodeId, layerId]);
//   const onChange = useCallback(
//     (_event, checked: boolean) => prop.setValue(compositorView, nodeId, layerId, checked),
//     [prop, compositorView, nodeId, layerId],
//   );

//   return <Checkbox checked={getValue()} onChange={onChange} disabled={disabled} />;
// }

export function LayerPropertyInput({ propKey, nodeId, layerId, size = 'small' }: LayerPropertyInputProps) {
  if (!layerProperties[propKey]) return null;

  if (isNumberProperty(propKey)) {
    return <NumberPropertyInput propKey={propKey} nodeId={nodeId} layerId={layerId} />;
  }

  if (isSelectProperty(propKey)) {
    return <SelectPropertyInput propKey={propKey} nodeId={nodeId} layerId={layerId} size={size} />;
  }

  if (isColorProperty(propKey)) {
    return <ColorPropertyInput propKey={propKey} nodeId={nodeId} layerId={layerId} />;
  }

  if (isToggleProperty(propKey)) {
    return <TogglePropertyInput propKey={propKey} nodeId={nodeId} layerId={layerId} />;
  }

  // if (isBooleanProperty(propKey)) {
  //   return <BooleanPropertyInput propKey={propKey} nodeId={nodeId} layerId={layerId} />;
  // }

  return null;
}
