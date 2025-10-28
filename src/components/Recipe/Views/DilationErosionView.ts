import { NodeId } from 'web';
import { FlowGraph } from '../FlowGraph';

export class DilationErosionView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  async setSize(value: number, ongoing: boolean) {
    this.graph.wasmEdit((wasm) => {
      return wasm.setDilationErosionSize(this.nodeId, Math.round(value));
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }
}
