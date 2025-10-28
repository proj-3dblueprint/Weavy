import type { NodeId } from 'web';
import type { FlowGraph } from '../FlowGraph';

export class PromptView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  async setPrompt(value: string, ongoing: boolean) {
    this.graph.wasmEdit((wasm) => {
      return wasm.setPrompt(this.nodeId, value);
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }
}
