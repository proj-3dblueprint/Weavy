import { useWorkflowStore, type ModelPricesMaps } from '@/state/workflow.state';
import DynamicFields from '@/components/Nodes/ModelComponents/DynamicFields';
import type { BaseNodeData, Node, NodeDataWithParams } from '@/types/node';

type ModelNode = Omit<Node, 'data'> & { data: NodeDataWithParams };
type LoraNode = Omit<Node, 'data'> & { data: BaseNodeData; type: 'multilora' };

interface NodeDetailsProps {
  node: ModelNode | LoraNode;
  NodeComponent: React.ComponentType<{
    id: string;
    data: BaseNodeData;
    updateNodeData: (nodeId: string, data: Partial<BaseNodeData>) => void;
    container: string;
    modelPricesMaps: ModelPricesMaps;
  }>;
  updateNodeData: (nodeId: string, data: Partial<BaseNodeData>) => void;
}

const isLoraNode = (node: LoraNode | ModelNode): node is LoraNode => {
  return node.type === 'multilora';
};

export function NodeDetails({ node, NodeComponent, updateNodeData }: NodeDetailsProps) {
  const modelPricesMaps = useWorkflowStore((state) => state.modelPricesMaps);
  return isLoraNode(node) ? (
    <NodeComponent
      id={node.id}
      data={node.data}
      updateNodeData={updateNodeData}
      container="drawer"
      modelPricesMaps={modelPricesMaps}
    />
  ) : (
    <DynamicFields nodeId={node.id} />
  );
}
