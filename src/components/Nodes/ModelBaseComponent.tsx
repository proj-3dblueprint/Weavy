import { useEffect, useState, useMemo, useCallback } from 'react';
import { Box } from '@mui/material';
import { useUpdateNodeInternals } from 'reactflow';
import { color } from '@/colors';
import { useModelBaseView } from '@/components/Recipe/FlowContext';
import { HandleType } from '@/enums/handle-type.enum';
import { NodeViewMode } from '@/enums/node-view-mode.enum';
import { useOnMount } from '@/hooks/useOnMount';
import { useBatchesByNodeId } from '../Recipe/RunFlow/batches.store';
import { ModelResults } from './ModelComponents/ModelResult';
import { ImportModelInput } from './ModelComponents/ImportModelInput';
import { use3DModelParameters } from './ModelComponents/use3DModelParameters';
import { ModelNodeFooter } from './ModelComponents/ModelNodeFooter/ModelNodeFooter';
import type { ModelBaseNodeData } from '@/types/nodes/model';

interface ModelBaseComponentProps {
  data: ModelBaseNodeData;
  editable: boolean;
  hasValidModel: boolean;
  id: string;
  isSelected: boolean;
  modelPrice?: number;
  selectedOutput: number;
  setSelectedOutput: (selectedOrUpdater: number | ((selected: number) => number)) => void;
  updateNodeData: (id: string, data: Partial<ModelBaseNodeData>) => void;
  viewMode?: NodeViewMode;
}
function ModelBaseComponent({
  data,
  editable,
  hasValidModel,
  id,
  isSelected,
  modelPrice,
  selectedOutput,
  setSelectedOutput,
  updateNodeData,
  viewMode = NodeViewMode.Single,
}: ModelBaseComponentProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  const [errorMessage, setErrorMessage] = useState<string | object | null>(null);
  const modelBaseView = useModelBaseView(id);
  const isUsingNewModelNode = modelBaseView.isSupported();
  const { handles, input, schema, model } = data;
  const params = useMemo(() => data.params || {}, [data.params]);

  const batches = useBatchesByNodeId(id);
  const isProcessing = useMemo(() => {
    return batches.some((batch) =>
      batch.recipeRuns.some(
        (recipeRun) =>
          recipeRun.status === 'RUNNING' &&
          recipeRun.nodeRuns.some(
            (nodeRun) => nodeRun.nodeId === id && ['PENDING', 'RUNNING'].includes(nodeRun.status),
          ),
      ),
    );
  }, [batches, id]);

  // 3D viewer related
  const threeDProps = use3DModelParameters(id, data, updateNodeData);

  useEffect(() => {
    // this is to update the node internals when the input handles are exposed
    updateNodeInternals(id);
  }, [handles.input]);

  useEffect(() => {
    if (!input || (Array.isArray(input) && input.length === 0)) return;
    // recheck validation;
    setErrorMessage(null);
    /// when a connection is made or present we need to update the params (dynamic fields accordingly)
    // added params to avoid errors for models without params (Remove Background for example)
    const newParams = { ...params };
    Object.keys(handles.input).forEach((key) => {
      if (params[key] !== undefined || params[key] !== null) {
        // connect
        newParams[key] = input[key];
      } else {
        // disconnect
        newParams[key] = schema[key].default || undefined;
      }
    });
    updateNodeData(id, {
      params: newParams,
    });
  }, [input]);

  useOnMount(() => {
    modelBaseView.hackyUpdateOutput();
  }); // to fill in empty output on mount, see WEA-955 - also to update seed params on mount

  const nodeOutputType = useMemo(() => {
    if (typeof data.handles.output === 'object' && !Array.isArray(data.handles.output)) {
      const outputItems = Object.values(data.handles.output);
      const firstOutput = outputItems.find((item) => item.order === 0);
      return firstOutput?.type;
    }
    return HandleType.Image;
  }, [data.handles.output]);

  const handleTextChange = useCallback(
    (index: number, newValue: string) => {
      modelBaseView.editText(index, newValue);
    },
    [modelBaseView],
  );

  return (
    <Box sx={{ pointerEvents: 'auto' }}>
      {editable && !model?.version ? (
        <ImportModelInput data={data} id={id} updateNodeData={updateNodeData} />
      ) : hasValidModel ? (
        <>
          <Box
            sx={{
              overflow: 'hidden',
              mb: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: !isSelected ? color.White08_T : 'transparent',
            }}
          >
            <ModelResults
              data={data}
              id={id}
              shouldUseLegacyFileViewer={!isUsingNewModelNode}
              selected={selectedOutput}
              setSelected={setSelectedOutput}
              coverImage={model?.coverImage || undefined}
              noEmptyState={editable && !hasValidModel}
              nodeOutputType={nodeOutputType}
              onTextChange={handleTextChange}
              threeDProps={threeDProps}
              isProcessing={isProcessing}
              viewMode={viewMode}
            />
          </Box>

          <ModelNodeFooter
            setErrorMessage={setErrorMessage}
            canSaveModel={Boolean(editable && model?.name && model?.version)}
            data={data}
            errorMessage={typeof errorMessage === 'string' ? errorMessage : undefined}
            id={id}
            modelName={model?.name || ''}
            modelPrice={modelPrice}
          />
        </>
      ) : null}
    </Box>
  );
}

export default ModelBaseComponent;
