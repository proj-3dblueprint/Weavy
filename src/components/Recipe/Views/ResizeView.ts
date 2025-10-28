import { DEFAULT_DIMENSIONS } from '@/consts/dimensions';
import { FlowGraph } from '../FlowGraph';
import type { NodeId, ResizeOptions } from 'web';
import type { ResizeData } from '@/types/node';

const MAX_DIMENSION = 8192;

export class ResizeView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  getOptions(): ResizeOptions {
    return (
      this.graph.store.getNodeData<ResizeData>(this.nodeId).options ?? { lockAspectRatio: true, ...DEFAULT_DIMENSIONS }
    );
  }

  async setWidth(value: number, ongoing: boolean = false) {
    if (value <= 0) return;

    this.graph.wasmEdit((wasm) => {
      const options = this.getOptions();
      const { lockAspectRatio, width, height } = options;
      const aspectRatio = width / height;

      const clampedValue = Math.min(value, MAX_DIMENSION);
      let [newWidth, newHeight] = lockAspectRatio ? [clampedValue, clampedValue / aspectRatio] : [clampedValue, height];
      if (newHeight > MAX_DIMENSION) {
        newHeight = MAX_DIMENSION;
        newWidth = newHeight * aspectRatio;
      }

      return wasm.setResizeOptions(this.nodeId, {
        width: Math.round(newWidth),
        height: Math.round(newHeight),
        lockAspectRatio,
      });
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  async setHeight(value: number, ongoing: boolean = false) {
    if (value <= 0) return;

    this.graph.wasmEdit((wasm) => {
      const { lockAspectRatio, width, height } = this.getOptions();
      const aspectRatio = width / height;

      const clampedValue = Math.min(value, MAX_DIMENSION);
      let [newWidth, newHeight] = lockAspectRatio ? [clampedValue * aspectRatio, clampedValue] : [width, clampedValue];
      if (newWidth > MAX_DIMENSION) {
        newWidth = MAX_DIMENSION;
        newHeight = newWidth / aspectRatio;
      }
      return wasm.setResizeOptions(this.nodeId, {
        width: Math.round(newWidth),
        height: Math.round(newHeight),
        lockAspectRatio,
      });
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  async toggleLockAspectRatio() {
    this.graph.wasmEdit((wasm) => {
      const options = this.getOptions();
      return wasm.setResizeOptions(this.nodeId, {
        ...options,
        lockAspectRatio: !options.lockAspectRatio,
      });
    });
    await this.graph.updateNodeOutputs(this.nodeId);
  }
}
