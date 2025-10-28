import { NodeId } from 'web';
import { FlowGraph } from '../FlowGraph';

export class TextView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  async setText(value: string, ongoing: boolean) {
    this.graph.wasmEdit((wasm) => {
      return wasm.setText(this.nodeId, value);
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }
}
