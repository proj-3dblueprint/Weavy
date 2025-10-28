import { FlowGraph } from '../FlowGraph';
import type { Channel, NodeId } from 'web';

export class ChannelsView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  async setChannel(channel: Channel) {
    this.graph.wasmEdit((wasm) => wasm.setChannel(this.nodeId, channel));
    await this.graph.updateNodeOutputs(this.nodeId);
  }
}
