import type { NodeId } from 'web';
import type { FlowGraph } from '../FlowGraph';

export class VideoView {
  constructor(
    private graph: FlowGraph,
    private id: NodeId,
  ) {}

  async setTime(time: number, ongoing: boolean) {
    this.graph.wasm.call((wasm) => {
      return wasm.setNodeVideoTime(this.id, time, ongoing);
    });
    if (!ongoing && this.graph.store.getNode(this.id).type === 'extract_video_frame') {
      await this.graph.updateNodeOutputs(this.id);
    }
  }

  async togglePlay() {
    this.graph.wasm.call((wasm) => {
      return wasm.toggleNodeVideoPlay(this.id);
    });
    if (
      this.graph.getUIState().video[this.id].paused &&
      this.graph.store.getNode(this.id).type === 'extract_video_frame'
    ) {
      await this.graph.updateNodeOutputs(this.id);
    }
  }

  toggleMute() {
    this.graph.wasm.call((wasm) => {
      return wasm.toggleNodeVideoMute(this.id);
    });
  }
}
