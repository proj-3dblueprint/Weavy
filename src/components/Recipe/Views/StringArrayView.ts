import type { NodeId } from 'web';
import type { StringArrayData } from '@/types/node';
import type { FlowGraph } from '../FlowGraph';

export class StringArrayView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  private async update(updateFn: (data: StringArrayData) => Partial<StringArrayData>) {
    this.graph.wasmEdit((wasm) => {
      const data = this.graph.store.getNodeData<StringArrayData>(this.nodeId);
      const newData = updateFn(data);
      return wasm.setStringArray(this.nodeId, newData.array ?? data.array, newData.delimiter ?? data.delimiter);
    });
    await this.graph.updateNodeOutputs(this.nodeId);
  }

  async setItem(index: number, value: string) {
    await this.update(({ array }) => {
      if (index >= array.length) throw new Error('invalid index');
      const newArray = [...array];
      newArray[index] = value;
      return { array: newArray };
    });
  }

  async deleteItem(index: number) {
    await this.update(({ array }) => {
      if (index >= array.length) throw new Error('invalid index');
      const newArray = [...array];
      newArray.splice(index, 1);
      return { array: newArray };
    });
  }

  async addItem(value: string) {
    await this.update(({ array }) => {
      const newArray = [...array, value];
      return { array: newArray };
    });
  }

  async setDelimiter(delimiter: string) {
    await this.update(() => ({ delimiter }));
  }

  async setArray(array: string[]) {
    await this.update(() => ({ array }));
  }
}
