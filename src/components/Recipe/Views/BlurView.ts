import { BlurKind, BlurOptions, NodeId } from 'web';
import { BlurData } from '@/types/node';
import { FlowGraph } from '../FlowGraph';

export class BlurView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  private getOptions(): BlurOptions {
    return this.graph.store.getNodeData<BlurData>(this.nodeId).options;
  }

  async setType(value: BlurKind) {
    this.graph.wasmEdit((wasm) =>
      wasm.setBlurOptions(this.nodeId, {
        ...this.getOptions(),
        type: value,
      }),
    );
    await this.graph.updateNodeOutputs(this.nodeId);
  }

  async setSize(value: number, ongoing: boolean) {
    this.graph.wasmEdit((wasm) => {
      return wasm.setBlurOptions(this.nodeId, { ...this.getOptions(), size: Math.round(value) });
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  async setIterations(value: number, ongoing: boolean) {
    this.graph.wasmEdit((wasm) => {
      return wasm.setBlurOptions(this.nodeId, { ...this.getOptions(), iterations: Math.round(value) });
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }
}
