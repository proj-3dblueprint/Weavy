import { v4 as uuidv4 } from 'uuid';
import { HandleType } from '@/enums/handle-type.enum';
import type { NodeId } from 'web';
import type { FlowGraph } from '../FlowGraph';
import type { BaseNodeData, PromptConcatenatorData } from '@/types/node';

export class PromptConcatView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  async setAdditionalPrompt(value: string, ongoing: boolean) {
    this.graph.wasmEdit((wasm) => {
      return wasm.setPromptConcatenator(this.nodeId, value);
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  addInputHandle() {
    this.graph.edit(() => {
      const { handles } = this.graph.store.getNodeData<PromptConcatenatorData>(this.nodeId);
      const promptCount = Object.keys(handles.input).length;
      const newPromptKey = `prompt${promptCount + 1}`;

      const undoEntry = this.graph.wasmChange((wasm) => {
        const { edit } = wasm.setNodeInput(this.nodeId, newPromptKey, null);
        return edit;
      });

      if (Array.isArray(handles.input)) {
        const newInput = [...handles.input, newPromptKey];
        undoEntry.add(
          this.graph.store.updateNodeData<BaseNodeData>(this.nodeId, () => ({
            handles: {
              ...handles,
              input: newInput,
            },
          })),
        );
      } else {
        undoEntry.add(
          this.graph.addNodeInputHandle(this.nodeId, newPromptKey, {
            description: '',
            format: 'text',
            id: uuidv4(),
            order: promptCount,
            required: false,
            label: `text_${promptCount + 1}`,
            type: HandleType.Text,
          }),
        );
      }

      return undoEntry;
    });
  }
}
