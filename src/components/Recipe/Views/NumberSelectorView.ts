import type { NodeId } from 'web';
import type { FlowGraph } from '../FlowGraph';
import type { NumberSelectorData } from '@/types/node';

export class NumberSelectorView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  async setSelected(selected: number, ongoing: boolean) {
    this.graph.wasmEdit((wasm) => {
      return wasm.setNumberSelector(this.nodeId, selected, this.getCurrentOptions());
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  async setNumberSelector(selected: number | undefined, options: number[], ongoing: boolean) {
    this.graph.wasmEdit((wasm) => {
      return wasm.setNumberSelector(this.nodeId, selected, options);
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  getCurrentOptions(): number[] {
    const nodeData = this.graph.store.getNodeData<NumberSelectorData>(this.nodeId);
    // First check if there's input data, then fall back to params
    const inputArray = nodeData.inputNode?.stringArray;
    if (inputArray) {
      // Convert string array to numbers, filtering out invalid values
      return inputArray.map((str) => parseFloat(str)).filter((num) => !isNaN(num));
    }
    return nodeData.params.options || [];
  }
}
