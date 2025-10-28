import { NodeId } from 'web';
import { colorMap } from '@/colors';
import { OutputIcon } from '@/UI/Icons/OutputIcon';
import { BaseNodeData } from '@/types/node';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';

function OutputNode({ id, data }: { id: NodeId; data: BaseNodeData }) {
  return (
    <>
      <DynamicNode2
        id={id}
        data={data}
        hideBody={true}
        inputHandleYPos="50%"
        className="output"
        handleColor={colorMap.get(data.color)}
        icon={<OutputIcon />}
        size="small"
      />
    </>
  );
}

export default OutputNode;
