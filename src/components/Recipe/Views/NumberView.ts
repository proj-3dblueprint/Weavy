import { clampValue } from '@/utils/numbers';
import type { NodeId, NumberMode } from 'web';
import type { NumberData } from '@/types/node';
import type { FlowGraph } from '../FlowGraph';

export class NumberView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  private getCurrentData(): NumberData {
    return this.graph.store.getNodeData<NumberData>(this.nodeId);
  }

  async setValue(value: number, ongoing: boolean) {
    const currentData = this.getCurrentData();
    this.graph.wasmEdit((wasm) => {
      return wasm.setNumber(this.nodeId, {
        ...currentData,
        value: clampValue(value, currentData.min, currentData.max),
      });
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  async setMin(min: number, ongoing: boolean) {
    const currentData = this.getCurrentData();
    this.graph.wasmEdit((wasm) => {
      return wasm.setNumber(this.nodeId, {
        ...currentData,
        value: clampValue(currentData.value, min, currentData.max),
        min,
      });
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  async setMax(max: number, ongoing: boolean) {
    const currentData = this.getCurrentData();
    this.graph.wasmEdit((wasm) => {
      return wasm.setNumber(this.nodeId, {
        ...currentData,
        value: clampValue(currentData.value, currentData.min, max),
        max,
      });
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  async setMode(mode: NumberMode, ongoing: boolean) {
    const currentData = this.getCurrentData();
    this.graph.wasmEdit((wasm) => {
      return wasm.setNumber(this.nodeId, {
        ...currentData,
        value:
          mode == 'integer'
            ? clampValue(Math.round(currentData.value), currentData.min, currentData.max)
            : currentData.value,
        mode,
      });
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }
}
