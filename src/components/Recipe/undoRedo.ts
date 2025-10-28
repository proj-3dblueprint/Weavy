import { EditState, NodeId } from 'web';
import { Edge, Node } from '@/types/node';

type NodeUndoEntry =
  | { type: 'add'; nodeId: NodeId }
  | { type: 'remove'; node: Node }
  | { type: 'update'; node: Node }
  | { type: 'set'; node: Node };
type EdgeUndoEntry = { type: 'add'; edgeId: string } | { type: 'remove'; edge: Edge };

type Change =
  | { type: 'edge'; entry: EdgeUndoEntry }
  | { type: 'node'; entry: NodeUndoEntry }
  | { type: 'wasm'; entry: EditState[] };
export class UndoRedoEntry {
  changes?: Change[];

  private constructor(changes?: Change[]) {
    this.changes = changes;
  }

  static empty(): UndoRedoEntry {
    return new UndoRedoEntry();
  }

  static fromEdges(entries: EdgeUndoEntry[]) {
    return new UndoRedoEntry(entries.map((entry) => ({ type: 'edge', entry })));
  }

  static fromNodes(entries: NodeUndoEntry[]) {
    return new UndoRedoEntry(entries.map((entry) => ({ type: 'node', entry })));
  }

  static fromWasmEdit(undoState?: EditState[]) {
    return undoState ? new UndoRedoEntry([{ type: 'wasm', entry: undoState }]) : UndoRedoEntry.empty();
  }

  isEmpty() {
    return !this.changes || this.changes.length === 0;
  }

  add(other: UndoRedoEntry) {
    this.changes = [...(this.changes ?? []), ...(other.changes ?? [])];
  }
}

export class UndoRedo {
  private undoStack: UndoRedoEntry[] = [];
  private redoStack: UndoRedoEntry[] = [];

  private undoLimit: number | undefined;

  constructor() {}

  undo(): UndoRedoEntry | undefined {
    if (this.undoLimit && this.undoLimit === this.undoStack.length) return;
    return this.undoStack.pop();
  }

  redo(): UndoRedoEntry | undefined {
    return this.redoStack.pop();
  }

  pushEntry(entry: UndoRedoEntry) {
    if (entry.isEmpty()) {
      return;
    }

    this.undoStack.push(entry);
    this.redoStack = [];
    while (this.undoStack.length > 100) {
      this.undoStack.shift();
    }
  }

  setUndoBarrier() {
    this.undoLimit = this.undoStack.length;
  }

  disableBarrier() {
    if (this.undoLimit === undefined) return;
    const entries = this.undoStack.splice(this.undoLimit);
    if (entries.length > 0) {
      const entry = UndoRedoEntry.empty();
      for (const e of entries) {
        entry.add(e);
      }
      this.pushEntry(entry);
    }
    this.undoLimit = undefined;
  }

  pushRedo(entry: UndoRedoEntry) {
    this.redoStack.push(entry);
  }

  pushUndo(entry: UndoRedoEntry) {
    this.undoStack.push(entry);
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  hasUndo() {
    return this.undoLimit === undefined ? this.undoStack.length > 0 : this.undoStack.length > this.undoLimit;
  }

  hasRedo() {
    return this.redoStack.length > 0;
  }
}
