import React from 'react';
import { colorMap } from '../../colors';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';
import MaskExtractionCore from './MaskExtractionCore';

function MasksExtractionNode({ id, recipeId, recipeVersion, data, updateNodeData }) {
  return (
    <DynamicNode2
      id={id}
      data={data}
      className="masks"
      handleColor={colorMap.get(data.color)}
      headerColor={colorMap.get(data.dark_color)}
    >
      <MaskExtractionCore
        id={id}
        recipeVersion={recipeVersion}
        recipeId={recipeId}
        data={data}
        updateNodeData={updateNodeData}
        container="node"
      />
    </DynamicNode2>
  );
}

export default MasksExtractionNode;
