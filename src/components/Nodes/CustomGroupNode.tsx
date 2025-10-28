import { NodeResizer } from 'reactflow';
import { Box } from '@mui/material';
import { useCallback } from 'react';
import { parse as parseColor } from '@zag-js/color-picker';
import { CustomGroupData } from '@/types/node';
import { color } from '@/colors';
import { useWorkflowStore } from '@/state/workflow.state';
import { log } from '@/logger/logger.ts';
import { NodeId } from '@/designer/designer';
import { useCustomGroupView, useNodeNullable } from '../Recipe/FlowContext';
import { fontSizeToVariantTransformer, LABEL_SIZE } from '../Recipe/Views/NodeGrouping/groups.types';
import { EditableLabel } from '../Recipe/FlowComponents/Editor/Designer/LayerPanel/EditableLabel';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';
import type { OnResizeEnd, OnResize, OnResizeStart } from '@reactflow/node-resizer';

const logger = log.getLogger('CustomGroupNode');

// Utility function to convert color to RGBA with specified opacity using existing color picker utilities
const colorToRgba = (colorValue: string, opacity: number): string => {
  try {
    const color = parseColor(colorValue);
    return color.toFormat('rgba').withChannelValue('alpha', opacity).toString('rgba');
  } catch {
    logger.warn('Failed to parse color for custom group node', { color: colorValue });
    return '';
  }
};

const resolveColor = (color: string | undefined, opacity: number, defaultColor: string) => {
  return color ? colorToRgba(color, opacity) || defaultColor : defaultColor;
};

export const CustomGroupNode = ({ id, data }: { id: NodeId; data: CustomGroupData }) => {
  const customGroupView = useCustomGroupView(id);
  const highlightedGroupId = useWorkflowStore((state) => state.highlightedGroupId);
  const isHighlighted = highlightedGroupId === id;

  const handleResizeStart = useCallback<OnResizeStart>(
    (_, params) => {
      const { x, y, width, height } = params;
      customGroupView.handleResize({ x, y, width, height }, true);
    },
    [customGroupView],
  );

  const handleResize = useCallback<OnResize>(
    (_, params) => {
      const { x, y, width, height } = params;
      customGroupView.handleResize({ x, y, width, height }, true);
    },
    [customGroupView],
  );

  const handleResizeEnd = useCallback<OnResizeEnd>(
    (_, params) => {
      const { x, y, width, height } = params;
      customGroupView.handleResize({ x, y, width, height }, false);
    },
    [customGroupView],
  );

  const node = useNodeNullable(id);
  const isSelected = node?.selected;

  return (
    // Wrapper div fills ReactFlow's node wrapper (which has explicit dimensions)
    // ReactFlow resizes this via direct DOM manipulation (fast, no React)
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <EditableLabel
        className="custom-group-label"
        variant={fontSizeToVariantTransformer.get(data.labelFontSize as LABEL_SIZE) ?? 'body-lg-rg'}
        value={data.name}
        onSubmit={(newName) => customGroupView.updateGroupName(newName)}
        sx={{
          position: 'absolute',
          top: '-4px',
          left: '0',
          transform: 'translateY(-100%)',
          color: isSelected || isHighlighted ? color.White100 : color.White80_T,
          backgroundColor:
            isSelected || isHighlighted
              ? resolveColor(data.color, 1, color.Purple100)
              : resolveColor(data.color, 0.8, color.Purple80_T),
          paddingY: 0.5,
          paddingX: 1,
          borderRadius: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}
      />
      <DynamicNode2
        id={id}
        data={data}
        hideHandles
        hideTitle
        className="custom-group-main"
        sx={{
          width: '100%',
          height: '100%',
          border: `2px solid ${isSelected || isHighlighted ? resolveColor(data.color, 0.8, color.Purple80_T) : resolveColor(data.color, 0.16, color.Purple16_T)}`,
          backgroundColor:
            isSelected || isHighlighted
              ? resolveColor(data.color, 0.24, color.Purple24_T)
              : resolveColor(data.color, 0.16, color.Purple16_T),
          transition: 'all 0.2s ease-in-out',
          p: 0,
        }}
      />
      <NodeResizer
        nodeId={id}
        isVisible={true}
        lineStyle={{ borderColor: '#00000000', borderWidth: '10px' }}
        keepAspectRatio={false}
        handleStyle={{
          backgroundColor: '#00000000',
          borderColor: '#00000000',
          borderWidth: '10px',
        }}
        onResizeStart={handleResizeStart}
        onResize={handleResize}
        onResizeEnd={handleResizeEnd}
      />
    </Box>
  );
};
