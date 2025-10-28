import { useNodeDataNullable } from './FlowContext';
import type { BaseNodeData } from '@/types/node';
import type { NodeProps } from 'reactflow';
import type { NodeId } from 'web';

type NodeWrapperProps<T extends BaseNodeData> = {
  id: NodeId;
  renderNode: (props: { id: NodeId; data: T }) => JSX.Element;
} & Record<string, any>;

// provide node data to node components + prevent rendering node when deleted
function NodeWrapper<T extends BaseNodeData>({ id, renderNode, ...otherProps }: NodeWrapperProps<T>) {
  const data = useNodeDataNullable<T>(id);
  if (!data) return null;
  return renderNode({ id, ...otherProps, data });
}

export function wrapNode<T extends BaseNodeData = BaseNodeData>(renderNode: (props: { data: T }) => JSX.Element) {
  // eslint-disable-next-line react/display-name
  return (props: NodeProps<T>) => <NodeWrapper id={props.id} renderNode={renderNode}></NodeWrapper>;
}
