import { NodeId } from 'web';
import { colorMap } from '@/colors';
import { MergeAlphaData } from '@/types/node';
import { DynamicNode2 } from '../DynamicNode/DynamicNode2';
import { InputViewer } from '../Shared/FileViewer';

function MergeAlphaNode({ id, data }: { id: NodeId; data: MergeAlphaData }) {
  return (
    <DynamicNode2 id={id} data={data} handleColor={colorMap.get(data.color)}>
      <InputViewer id={id} input={data.inputNode} />
    </DynamicNode2>
  );
}

export default MergeAlphaNode;
