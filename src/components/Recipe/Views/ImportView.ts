import { UndoRedoEntry } from '../undoRedo';
import type { ImportData } from '@/types/node';
import type { FileKind, NodeId } from 'web';
import type { FlowGraph } from '../FlowGraph';

export class ImportView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  getFilesList(): FileKind[] {
    const nodeData = this.graph.store.getNodeData<ImportData>(this.nodeId);
    return nodeData.files;
  }

  async addFile(file: FileKind, ongoing = false) {
    const files = this.getFilesList();
    this.clearPastedAndInitialData();
    this.graph.edit(() => {
      const undoRedoEntry = UndoRedoEntry.empty();
      undoRedoEntry.add(this.graph.wasmChange((wasm) => wasm.setFiles(this.nodeId, [...files, file])));
      undoRedoEntry.add(this.graph.wasmChange((wasm) => wasm.setSelectedMedia(this.nodeId, files.length)));
      return undoRedoEntry;
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  async removeFile(indexToRemove: number, ongoing = false) {
    const filesList = this.getFilesList();
    if (!filesList[indexToRemove]) throw new Error('invalid index');
    let newSelectedIndex = indexToRemove;
    // if the selected index is the last index, set the selected index to one before the last index
    if (newSelectedIndex === filesList.length - 1 && filesList.length > 1) {
      newSelectedIndex--;
    }
    this.graph.edit(() => {
      const undoRedoEntry = UndoRedoEntry.empty();
      undoRedoEntry.add(
        this.graph.wasmChange((wasm) =>
          wasm.setFiles(
            this.nodeId,
            filesList.filter((_, index) => index !== indexToRemove),
          ),
        ),
      );
      undoRedoEntry.add(this.graph.wasmChange((wasm) => wasm.setSelectedMedia(this.nodeId, newSelectedIndex)));
      return undoRedoEntry;
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  async setFiles(files: FileKind[], selectedIndex: number | undefined, ongoing: boolean) {
    this.clearPastedAndInitialData();
    this.graph.edit(() => {
      const undoRedoEntry = UndoRedoEntry.empty();
      undoRedoEntry.add(this.graph.wasmChange((wasm) => wasm.setFiles(this.nodeId, files)));
      if (selectedIndex !== undefined) {
        undoRedoEntry.add(this.graph.wasmChange((wasm) => wasm.setSelectedMedia(this.nodeId, selectedIndex)));
      }
      return undoRedoEntry;
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  async setSelectedIndex(selectedIndex: number | undefined, ongoing: boolean) {
    this.graph.wasmEdit((wasm) => {
      const filesLength = this.getFilesList().length;
      return wasm.setSelectedMedia(this.nodeId, selectedIndex ?? (filesLength > 0 ? filesLength - 1 : 0));
    }, ongoing);
    await this.graph.updateNodeOutputs(this.nodeId, ongoing);
  }

  clearPastedAndInitialData() {
    this.graph.store.updateNodeData<ImportData>(this.nodeId, (_) => {
      return {
        pastedData: undefined,
        initialData: undefined,
      };
    });
  }

  setCameraLocked(locked: boolean) {
    this.graph.wasmEdit((wasm) => wasm.setImportCameraLocked(this.nodeId, locked));
  }
}
