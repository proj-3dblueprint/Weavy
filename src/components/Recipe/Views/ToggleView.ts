import { NodeId } from 'web';
import { FlowGraph } from '../FlowGraph';

export class ToggleView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  async setToggle(value: boolean, ongoing: boolean) {
    this.graph.wasmEdit((wasm) => {
      return wasm.setToggle(this.nodeId, value);
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }
}
