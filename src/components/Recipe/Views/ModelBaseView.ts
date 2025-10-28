import { v4 as uuidv4 } from 'uuid';
import { HandleType } from '@/enums/handle-type.enum';
import {
  ModelAssetToUploadedAsset,
  UploadedAssetToModelAsset,
  type TextAsset,
  type UploadedAsset,
} from '@/types/api/assets';
import { UndoRedoEntry } from '../undoRedo';
import { type FlowGraph } from '../FlowGraph';
import type { NodeId } from 'web';
import type { AiModelData, ModelBaseNodeData } from '@/types/nodes/model';

export const mergeSeedParam = (params: ModelBaseNodeData['params'], result?: ModelBaseNodeData['result'][number]) => {
  if (!result || !params || !params.seed) {
    return params;
  }
  if (!('input' in result && 'seed' in result.input)) {
    return params;
  }
  const resultSeed = result.input.seed;
  if (typeof resultSeed !== 'number') {
    return params;
  }
  const seedParam = params.seed as { isRandom: boolean; seed: number };
  return {
    ...params,
    seed: { ...seedParam, seed: resultSeed },
  };
};

export class ModelBaseView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  setSelectedIndex(newSelectedOutput: number) {
    this.graph.edit(() => this.updateIndex(newSelectedOutput));
  }

  appendResult(resultsToAppend: UploadedAsset[], insertionIndex?: number) {
    if (resultsToAppend.length === 0) {
      return;
    }

    const currentResult = this.getGenerations();
    const index = insertionIndex ?? currentResult.length;
    const newResultArray = [...currentResult.slice(0, index), ...resultsToAppend, ...currentResult.slice(index)];
    const newSelectedIndex = index + resultsToAppend.length - 1;

    this.updateGenerations(newResultArray);
    this.updateIndex(newSelectedIndex);
  }

  deleteResult(index?: number) {
    const generations = this.getGenerations();
    const selectedOutput = index ?? this.getSelectedIndex();
    const newResult = generations.filter((_, index) => index !== selectedOutput);
    this.graph.edit(() => this.updateGenerations(newResult));
  }

  deleteAllOtherResults(index?: number) {
    const generations = this.getGenerations();
    const selectedOutput = index ?? this.getSelectedIndex();
    const newResult = generations.filter((_, index) => index === selectedOutput);
    this.graph.edit(() => this.updateGenerations(newResult));
  }

  deleteAllResults() {
    this.graph.edit(() => this.updateGenerations([]));
  }

  editText(index: number, newValue: string) {
    if (this.isSupported()) {
      this.graph.wasmChange((wasm) => wasm.editTextAsset(this.nodeId, newValue));
      return;
    }
    const generations = this.getGenerations();
    const currentItem = generations[index];
    if (currentItem?.type === 'text') {
      const textAsset = currentItem as TextAsset;
      const isFirstEdit = !textAsset.originalValue;

      generations[index] = {
        ...currentItem,
        value: newValue,
        ...(isFirstEdit && { originalValue: textAsset.value }),
      };
      this.graph.edit(() => this.updateGenerations(generations));
    }
  }

  hackyUpdateOutput() {
    if (!this.isSupported()) {
      const data = this.getData();
      const generations = data.result as UploadedAsset[];
      if (generations && generations.length > 0) {
        this.updateGenerations(generations);
        this.updateIndex(data.selectedOutput ?? 0);
      }
    }
  }

  private updateIndex(newSelectedOutput: number): UndoRedoEntry {
    const undoEntry = UndoRedoEntry.empty();
    const {
      params,
      handles: { output },
    } = this.getData();
    if (this.isSupported()) {
      undoEntry.add(this.graph.wasmChange((wasm) => wasm.setSelectedModelGeneration(this.nodeId, newSelectedOutput)));
      void this.graph.updateNodeOutputs(this.nodeId, false);
    } else {
      undoEntry.add(
        this.graph.updateModelNodeData(this.nodeId, {
          selectedOutput: newSelectedOutput,
          output: getOutput(newSelectedOutput, this.getGenerations(), output),
        }),
      );
    }
    const newParams = mergeSeedParam(params, this.getGenerations()[newSelectedOutput]);
    if (newParams !== params) {
      undoEntry.add(
        this.graph.updateModelNodeData(this.nodeId, {
          params: newParams,
        }),
      );
    }
    return undoEntry;
  }

  private updateGenerations(newGenerations: UploadedAsset[]): UndoRedoEntry {
    const currentIndex = this.getSelectedIndex();
    const undoEntry = UndoRedoEntry.empty();
    const {
      params: currentParams,
      handles: { output },
    } = this.getData();
    if (this.isSupported()) {
      undoEntry.add(
        this.graph.wasmChange((wasm) =>
          wasm.setModelGenerations(this.nodeId, newGenerations.map(UploadedAssetToModelAsset)),
        ),
      );
      if (newGenerations.length - 1 < currentIndex) {
        undoEntry.add(this.graph.wasmChange((wasm) => wasm.setSelectedModelGeneration(this.nodeId, 0)));
        const newParams = mergeSeedParam(currentParams, newGenerations[0]);
        if (newParams !== currentParams) {
          undoEntry.add(this.graph.updateModelNodeData(this.nodeId, { params: newParams }));
        }
      }
      void this.graph.updateNodeOutputs(this.nodeId, false);
    } else {
      const selectedOutput = newGenerations.length - 1 < currentIndex ? 0 : currentIndex;
      let newParams = currentParams;
      if (selectedOutput !== currentIndex) {
        newParams = mergeSeedParam(currentParams, newGenerations[selectedOutput]);
      }
      undoEntry.add(
        this.graph.updateModelNodeData(this.nodeId, {
          result: newGenerations,
          selectedOutput,
          output: getOutput(selectedOutput, newGenerations, output),
          params: newParams,
        }),
      );
    }
    return undoEntry;
  }

  addInputHandle(prefix: string, type: HandleType) {
    this.graph.edit(() => {
      const { handles } = this.graph.store.getNodeData<ModelBaseNodeData>(this.nodeId);
      const numInputsWithPrefix = Object.keys(handles.input).filter((key) => key.includes(prefix)).length;
      const newKey = `${prefix}_${numInputsWithPrefix + 1}`;

      const undoEntry = UndoRedoEntry.empty();
      if (this.isSupported()) {
        undoEntry.add(
          this.graph.wasmChange((wasm) => {
            const { edit } = wasm.setNodeInput(this.nodeId, newKey, null);
            return edit;
          }),
        );
      }
      undoEntry.add(
        this.graph.addNodeInputHandle(this.nodeId, newKey, {
          description: '',
          format: 'uri',
          id: uuidv4(),
          label: newKey,
          order: Object.keys(handles.input).length,
          required: false,
          type,
        }),
      );
      return undoEntry;
    });
  }

  addLoraInputHandles() {
    this.graph.edit(() => {
      const { handles } = this.graph.store.getNodeData<ModelBaseNodeData>(this.nodeId);
      const undoEntry = UndoRedoEntry.empty();

      const numberOfLoraInputs = Object.keys(handles.input).filter((key) => key.includes('lora')).length / 2;
      undoEntry.add(
        this.graph.addNodeInputHandle(this.nodeId, `lora_${numberOfLoraInputs + 1}`, {
          description: '',
          format: 'uri',
          id: uuidv4(),
          label: `loRA_${numberOfLoraInputs + 1}`,
          order: Object.keys(handles.input).length,
          required: false,
          type: HandleType.Lora,
        }),
      );
      undoEntry.add(
        this.graph.addNodeInputHandle(this.nodeId, `lora_${numberOfLoraInputs + 1}_scale`, {
          description: '',
          format: 'number',
          id: uuidv4(),
          label: `loRA_${numberOfLoraInputs + 1}_weight`,
          order: Object.keys(handles.input).length + 1,
          required: false,
          type: HandleType.Number,
        }),
      );

      return undoEntry;
    });
  }

  private getData(): ModelBaseNodeData {
    return this.graph.store.getNodeData<ModelBaseNodeData>(this.nodeId);
  }

  isSupported(): boolean {
    return this.graph.isSupportedNode(this.nodeId);
  }

  getGenerations(): UploadedAsset[] {
    if (this.isSupported()) {
      const data = this.graph.store.getNodeData<AiModelData>(this.nodeId);
      return data.generations.map(ModelAssetToUploadedAsset);
    }
    const nodeData = this.getData();
    if (!nodeData.result || !Array.isArray(nodeData.result)) {
      return [];
    }
    return Object.assign([], nodeData.result) || [];
  }

  getSelectedIndex(): number {
    if (this.isSupported()) {
      const data = this.graph.store.getNodeData<AiModelData>(this.nodeId);
      return data.selectedIndex;
    }
    const nodeData = this.getData();
    return nodeData.selectedOutput ?? 0;
  }
}

function getOutput(
  selectedOutput: number,
  result: Record<string, any>[],
  outputHandles: ModelBaseNodeData['handles']['output'],
) {
  const formattedOutput = {};
  if (Array.isArray(outputHandles)) {
    // Handle array case (original behavior)
    outputHandles.forEach((elementName, index) => {
      if (result[selectedOutput + index]) {
        formattedOutput[elementName] = { ...result[selectedOutput + index] };
      } else {
        formattedOutput[elementName] = undefined;
      }
    });
  } else if (outputHandles && typeof outputHandles === 'object') {
    // Handle object case (version 3)
    Object.keys(outputHandles).forEach((key) => {
      if (result[selectedOutput]) {
        formattedOutput[key] = { ...result[selectedOutput] };
      } else {
        formattedOutput[key] = undefined;
      }
    });
  }

  return formattedOutput;
}
