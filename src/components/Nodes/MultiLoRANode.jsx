import { colorMap } from '../../colors';
import MultiLoRACore from './MultiLoRACore';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';

function MultiLoRANode({ id, data, updateNodeData }) {
  return (
    <DynamicNode2
      id={id}
      data={data}
      className="import"
      handleColor={colorMap.get(data.color)}
      backgroundColor={colorMap.get(data.color)}
      headerColor={colorMap.get(data.dark_color)}
    >
      <MultiLoRACore id={id} data={data} updateNodeData={updateNodeData} container="node" />
    </DynamicNode2>
  );
}

export default MultiLoRANode;
