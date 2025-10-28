import { ParameterView } from './ParameterView/ParameterView';
import type { NodeId } from 'web';
import type { FlowGraph } from '../FlowGraph';

const parameterKey = 'options';
export class ListSelectorView {
  private parameterView: ParameterView;
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {
    this.parameterView = new ParameterView(graph, nodeId);
  }

  async setSelected(selected: number) {
    this.graph.wasmEdit((wasm) => {
      return wasm.setSelected(this.nodeId, selected);
    });
    await this.graph.updateNodeOutputs(this.nodeId);
  }

  async setIsIterator(isIterator: boolean) {
    this.graph.wasmEdit((wasm) => {
      return wasm.setIsIterator(this.nodeId, isIterator);
    });
    await this.graph.updateNodeOutputs(this.nodeId);
  }

  async setOptions(newValue: string[]) {
    await this.parameterView.setParameterValue(parameterKey, {
      type: 'string_array',
      value: newValue,
    });
  }

  getCurrentOptions(): string[] {
    const options = this.graph.wasm.call((wasm) => {
      return wasm.evaluateParameter(this.nodeId, parameterKey);
    });
    return options?.type === 'string_array' ? options.value : [];
  }

  isExposed(): boolean {
    return this.parameterView.isParameterExposed(parameterKey);
  }
}
