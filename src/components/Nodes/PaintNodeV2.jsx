import React from 'react';
import { colorMap } from '../../colors';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';
import PaintCore from './PaintCore';

function PaintNodeV2({ id, data, updateNodeData, onCanvasInteraction }) {
  return (
    <DynamicNode2 id={id} data={data} className="painterV2" handleColor={colorMap.get(data.color)}>
      <PaintCore
        id={id}
        data={data}
        updateNodeData={updateNodeData}
        onCanvasInteraction={onCanvasInteraction}
        container="node"
      />
    </DynamicNode2>
  );
}

export default PaintNodeV2;
