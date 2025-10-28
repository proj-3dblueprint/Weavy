import { NodeId } from 'web';
import { FlowGraph } from '../FlowGraph';
import type { SeedData } from '@/types/node';

export const SEED_RANDOM_RANGE_LIMIT = 1000000;

const getRandomSeed = () => {
  return Math.floor(Math.random() * SEED_RANDOM_RANGE_LIMIT) + 1;
};

export class SeedView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  async setSeed(value: number, ongoing: boolean) {
    const isRandom = this.isRandom;
    this.graph.wasmEdit((wasm) => {
      return wasm.setSeed(this.nodeId, { seed: value, isRandom });
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  async setIsRandom(value: boolean, ongoing: boolean) {
    const seed = value ? getRandomSeed() : this.seed;
    this.graph.wasmEdit((wasm) => {
      return wasm.setSeed(this.nodeId, { seed, isRandom: value });
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  private get seed() {
    return this.graph.store.getNodeData<SeedData>(this.nodeId).seed;
  }

  private get isRandom() {
    return this.graph.store.getNodeData<SeedData>(this.nodeId).isRandom;
  }
}
