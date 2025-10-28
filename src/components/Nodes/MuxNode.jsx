import { colorMap } from '../../colors';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';
import MuxCore from './MuxCore';

function MuxNode({ id, data, updateNodeData }) {
  return (
    <DynamicNode2
      id={id}
      data={data}
      className="mux"
      handleColor={colorMap.get(data.color)}
      headerColor={colorMap.get(data.dark_color)}
    >
      <MuxCore id={id} data={data} updateNodeData={updateNodeData} container="node" />
    </DynamicNode2>
  );
}

export default MuxNode;
