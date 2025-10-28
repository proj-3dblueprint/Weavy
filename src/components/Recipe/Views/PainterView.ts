import { FlowGraph } from '../FlowGraph';
import type { PainterOptions, NodeId, PainterMode } from 'web';
import type { PainterData } from '@/types/node';
import type { WebColor } from '@/UI/ColorPicker/ColorPicker';

const MAX_DIMENSION = 4096;

// FIXME: default options on TS
const DEFAULT_PAINTER_OPTIONS: PainterOptions = {
  width: 1024,
  height: 1024,
  lockAspectRatio: true,
  backgroundColor: {
    r: 0,
    g: 0,
    b: 0,
    a: 1.0,
  },
  brushColor: {
    r: 255,
    g: 255,
    b: 255,
    a: 1.0,
  },
  brushSize: 10.0,
  lines: [],
};

export class PainterView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  getOptions(): PainterOptions {
    return this.graph.store.getNodeData<PainterData>(this.nodeId).options ?? DEFAULT_PAINTER_OPTIONS;
  }

  hasInputImage(): boolean {
    const inputNode = this.graph.store.getNodeData<PainterData>(this.nodeId).inputNode;
    const fileInput = inputNode ? this.graph.wasm.call((wasm) => wasm.nodeFileInput(inputNode)) : undefined;
    return fileInput?.type === 'image';
  }

  private async setPainterOptions(options: Partial<PainterOptions>, ongoing: boolean) {
    this.graph.wasmEdit((wasm) => {
      const prevOptions = this.getOptions();
      return wasm.setPainterOptions(this.nodeId, { ...prevOptions, ...options });
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  async setBackgroundColor(color: WebColor, ongoing: boolean) {
    await this.setPainterOptions({ backgroundColor: color }, ongoing);
  }

  async setBrushColor(color: WebColor, ongoing: boolean) {
    await this.setPainterOptions({ brushColor: color }, ongoing);
  }

  async setBrushSize(size: number, ongoing: boolean) {
    await this.setPainterOptions({ brushSize: size }, ongoing);
  }

  setMode(mode: PainterMode) {
    this.graph.wasm.call((wasm) => wasm.setPainterMode(this.nodeId, mode));
  }

  async reset() {
    await this.setPainterOptions({ lines: [] }, false);
    this.setMode('brush');
  }

  // DIMENSIONS
  async setWidth(value: number, ongoing: boolean = false) {
    if (value <= 0) return;

    const options = this.getOptions();
    const { lockAspectRatio, width, height } = options;
    const aspectRatio = width / height;

    const clampedValue = Math.min(value, MAX_DIMENSION);
    let [newWidth, newHeight] = lockAspectRatio ? [clampedValue, clampedValue / aspectRatio] : [clampedValue, height];
    if (newHeight > MAX_DIMENSION) {
      newHeight = MAX_DIMENSION;
      newWidth = newHeight * aspectRatio;
    }

    await this.setPainterOptions({ width: Math.round(newWidth), height: Math.round(newHeight) }, ongoing);
  }

  async setHeight(value: number, ongoing: boolean = false) {
    if (value <= 0) return;
    const options = this.getOptions();
    const { lockAspectRatio, width, height } = options;
    const aspectRatio = width / height;

    const clampedValue = Math.min(value, MAX_DIMENSION);
    let [newWidth, newHeight] = lockAspectRatio ? [clampedValue * aspectRatio, clampedValue] : [width, clampedValue];
    if (newWidth > MAX_DIMENSION) {
      newWidth = MAX_DIMENSION;
      newHeight = newWidth / aspectRatio;
    }

    await this.setPainterOptions({ width: Math.round(newWidth), height: Math.round(newHeight) }, ongoing);
  }

  async toggleLockAspectRatio() {
    await this.setPainterOptions({ lockAspectRatio: !this.getOptions().lockAspectRatio }, false);
  }
}
