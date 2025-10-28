import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import { CaretIcon } from '@/UI/Icons/CaretIcon';
import { EL_COLORS } from '@/colors';
import { useWorkflowStore } from '@/state/workflow.state';
import { Flex, FlexCenVer } from '@/UI/styles';
import { getNodeIcon } from '@/components/Nodes/utils/NodeIcon';
import { EllipsisText } from '@/UI/EllipsisText/EllipsisText';
import { AsteriskIcon } from '@/UI/Icons/AsteriskIcon';
import { getModelPrice } from '../../Nodes/Utils';
import nodeTypesMap from '../nodeTypesMapV2';
import { NodeDetails } from './NodeDetails';
import type { Node, NodeDataWithParams } from '@/types/node';
import type { ModelBaseNodeData } from '@/types/nodes/model';

type ModelNode = Node & { data: ModelBaseNodeData };

interface NodePropertiesProps {
  node: Node;
  selectedNodes: Node[];
  updateNodeData: (nodeId: string, data: Partial<NodeDataWithParams>) => void;
}

export const NodeProperties = ({ node: propNode, selectedNodes, updateNodeData }: NodePropertiesProps) => {
  const modelPricesMaps = useWorkflowStore((state) => state.modelPricesMaps);
  const getNodeModelPrice = (node: Node) => {
    if (!node.isModel) {
      return undefined;
    }
    const modelNode = node as ModelNode;
    return getModelPrice(modelNode.data.model || {}, modelPricesMaps, modelNode.data.params) as number;
  };

  const NodeComponent = nodeTypesMap[propNode.type ?? ''];
  if (!NodeComponent) {
    return null;
  }

  const node = propNode as ModelNode;

  return (
    <Box key={node.id}>
      {selectedNodes.length > 1 ? (
        <Accordion sx={{ background: 'none', borderBottom: `1px solid ${EL_COLORS.BoxBorder}` }} elevation={0}>
          <AccordionSummary
            expandIcon={<CaretIcon />}
            aria-controls="panel1-content"
            data-testid={`properties-drawer-item-${node.id}`}
          >
            <FlexCenVer sx={{ gap: 1, justifyContent: 'space-between', width: '100%' }}>
              <Flex sx={{ gap: 1, minWidth: 0 }}>
                {getNodeIcon(node.data.model, '16px')}
                <EllipsisText variant="body-sm-rg" maxWidth="105px" disableHoverListener>
                  {node.data.name}
                </EllipsisText>
              </Flex>
              {node.isModel && (
                <FlexCenVer sx={{ gap: 1, flexShrink: 0 }}>
                  <AsteriskIcon width={16} height={16} />
                  <Typography variant="body-sm-rg">{getNodeModelPrice(node)}</Typography>
                </FlexCenVer>
              )}
            </FlexCenVer>
          </AccordionSummary>
          <AccordionDetails>
            <NodeDetails node={node} NodeComponent={NodeComponent} updateNodeData={updateNodeData} />
          </AccordionDetails>
        </Accordion>
      ) : (
        <Box>
          <FlexCenVer sx={{ mb: 2, justifyContent: 'space-between' }}>
            <Flex sx={{ gap: 1 }}>
              {getNodeIcon(node.data.model, '16px')}
              <Typography component="div" variant="body-sm-rg">
                {node.data.name}
              </Typography>
            </Flex>
            {node.isModel && (
              <FlexCenVer sx={{ gap: 1 }}>
                <AsteriskIcon width={16} height={16} />
                <Typography variant="body-sm-rg">{getNodeModelPrice(node)}</Typography>
              </FlexCenVer>
            )}
          </FlexCenVer>
          <NodeDetails node={node} NodeComponent={NodeComponent} updateNodeData={updateNodeData} />
        </Box>
      )}
    </Box>
  );
};
