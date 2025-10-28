import { NodeId } from 'web';
import { colorMap } from '@/colors';
import { DynamicNode2 } from '@/components/Nodes/DynamicNode/DynamicNode2';
import { InvertData } from '@/types/node';
import { InputViewer } from '../Shared/FileViewer';

function InvertNode({ id, data }: { id: NodeId; data: InvertData }) {
  return (
    <DynamicNode2 id={id} data={data} className="invert" handleColor={colorMap.get(data.color)}>
      <InputViewer id={id} input={data.inputNode} />
    </DynamicNode2>
  );
}

export default InvertNode;
