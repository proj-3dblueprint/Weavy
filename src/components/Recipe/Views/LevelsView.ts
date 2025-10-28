import { Histogram, LevelsOptions, NodeId } from 'web';
import { LevelsData } from '@/types/node';
import { HandleType } from '@/enums/handle-type.enum';
import { FlowGraph } from '../FlowGraph';
import { FlowView } from './FlowView';

export class LevelsView {
  private flowView: FlowView;
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {
    this.flowView = new FlowView(graph);
  }

  async setLevelsOptions(options: Partial<LevelsOptions>, ongoing: boolean) {
    this.graph.wasmEdit((wasm) => {
      const prevOptions = this.graph.store.getNodeData<LevelsData>(this.nodeId).options;
      return wasm.setLevelsOptions(this.nodeId, { ...prevOptions, ...options });
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  /// Returns a histogram for the image as input to this node.
  /// The values in the arrays are the number of pixels that have the corresponding value, where the value is in the range 0..255.
  async computeInputHistogram(): Promise<Histogram | undefined> {
    await this.graph.loadResources();
    return this.graph.wasm.call((wasm) => wasm.computeInputHistogram(this.nodeId, 'file'));
  }

  hasValidInput(): boolean {
    const data = this.graph.store.getNodeData<LevelsData>(this.nodeId);
    const inputType = data.inputNode ? this.flowView.nodeOutputTypeFromInput(data.inputNode) : undefined;
    return inputType === HandleType.Image || inputType === HandleType.Video;
  }
}
