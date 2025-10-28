import { Web, Edit, NodeId, EditState, UIState } from 'web';
import { CompositorNodeV3 } from '@/types/nodes/compositor';
import { log } from '@/logger/logger.ts';
import { FlowStore } from './FlowStore';
import { UndoRedoEntry } from './undoRedo';
import type { LogLevel } from 'loglevel';
import type { FlowUIState } from './FlowGraph';

let instance: Web | undefined = undefined;

export class WasmAPI {
  private canvas: HTMLCanvasElement;
  private wasm: Web | undefined = undefined;
  private store: FlowStore;
  private requestRef: number;
  private editable: boolean;
  private onError: (recovered: boolean) => void;
  private updateUIState: (updater: (oldState: FlowUIState) => Partial<FlowUIState>) => void;
  private updateLegacy: (nodeId: NodeId, isSeek: boolean) => void;
  private pushUndoState: (entry: UndoRedoEntry) => void;

  private log = (level: keyof LogLevel, message: string, e?: unknown) => {
    let input: any[] = [message];
    if (e instanceof Error) {
      input = [
        message + ': ' + e.message,
        e,
        {
          name: e.name,
          errorMessage: e.message,
          stack: e.stack,
        },
      ];
    }
    const logger = log.getLogger('Wasm');
    switch (level) {
      case 'ERROR':
        logger.error(...input);
        break;
      case 'WARN':
        logger.warn(...input);
        break;
      case 'INFO':
        logger.info(...input);
        break;
      case 'DEBUG':
        logger.debug(...input);
        break;
      case 'TRACE':
        logger.trace(...input);
        break;
    }
  };

  private animate = () => {
    this.call((wasm) => {
      wasm.update();
      return [];
    });
    if (this.wasm !== null) {
      this.requestRef = requestAnimationFrame(this.animate);
    }
  };

  constructor(
    canvas: HTMLCanvasElement,
    store: FlowStore,
    editable: boolean,
    {
      onError,
      updateUIState,
      pushUndoState,
      updateLegacy,
    }: {
      onError: (recovered: boolean) => void;
      updateUIState: (updater: (oldState: FlowUIState) => Partial<FlowUIState>) => void;
      pushUndoState: (entry: UndoRedoEntry) => void;
      updateLegacy: (nodeId: NodeId, isSeek: boolean) => void;
    },
  ) {
    this.store = store;
    this.canvas = canvas;
    this.editable = editable;
    this.onError = onError;
    this.pushUndoState = pushUndoState;
    this.updateUIState = updateUIState;
    this.updateLegacy = updateLegacy;
    canvas.addEventListener('webglcontextlost', this.onContextLost);

    this.requestRef = requestAnimationFrame(this.animate);

    this.createWasm();
  }

  private createWasm() {
    try {
      this.wasm = new Web(
        (nodeId: NodeId, uiState: UIState) => {
          switch (uiState.type) {
            case 'compositor': {
              this.updateUIState((s) => {
                return { compositor: { ...s.compositor, [nodeId]: uiState.data } };
              });
              break;
            }
            case 'video': {
              this.updateUIState((s) => {
                return { video: { ...s.video, [nodeId]: uiState.data } };
              });
              break;
            }
            case 'painter': {
              this.updateUIState((s) => {
                return { painter: { ...s.painter, [nodeId]: uiState.data } };
              });
              break;
            }
            default: {
              const _exhaustiveCheck: never = uiState;
            }
          }
        },
        (edit: Edit) => {
          this.onEdit(edit.editState);
          this.pushUndoState(UndoRedoEntry.fromWasmEdit(edit.undoState));
        },
        this.updateLegacy,
        this.canvas,
        this.editable,
      );

      if (instance !== undefined) {
        this.log('ERROR', 'Wasm instance already exists');
      }
      instance = this.wasm;
    } catch (e) {
      // Fatal error, not possible to recover when failing to create WebGL2 context
      this.log('WARN', 'Failed to create WebGL2 context', e);
      this.dispose();
      this.onError(false);
    }
  }

  private tryRecover = () => {
    this.createWasm();
    if (this.wasm !== undefined) {
      try {
        this.onError(true);
        this.wasm.update(); // Test that we don't get an error immediately after recovering
        this.log('INFO', 'Recovered after fatal error');
      } catch (e) {
        this.log('WARN', 'Failed to recover after fatal error', e);

        this.dispose();
        this.onError(false);
      }
    }
  };

  call<R>(apply: (wasm: Web) => R) {
    try {
      if (this.wasm !== undefined) {
        return apply(this.wasm);
      }
    } catch (e) {
      if (e instanceof WebAssembly.RuntimeError) {
        // Panic! This has already been logged
        this.tryRecover();
      } else {
        this.log('ERROR', 'Unknown error in Wasm', e);
        this.tryRecover();
      }
    }
  }

  edit(apply: (wasm: Web) => Edit): EditState[] | undefined {
    try {
      if (this.wasm !== undefined) {
        const editState = apply(this.wasm);
        this.onEdit(editState.editState);
        return editState.undoState;
      }
    } catch (e) {
      if (e instanceof WebAssembly.RuntimeError) {
        // Panic! This has already been logged
        this.tryRecover();
      } else {
        this.log('ERROR', 'Unknown error in Wasm', e);
        this.tryRecover();
      }
    }
  }

  private onEdit(editStates: EditState[]) {
    for (const editState of editStates) {
      switch (editState.type) {
        case 'update_layer': {
          const { nodeId, layerId, layer } = editState;
          this.store.updateNodeData<CompositorNodeV3>(nodeId, (prevNode) => {
            const compositorData = prevNode.data;
            return {
              data: {
                ...compositorData,
                layers: Object.fromEntries(
                  Object.entries(compositorData.layers).map(([id, prevLayer]) => [
                    id,
                    id === String(layerId) ? { ...prevLayer, ...layer } : prevLayer,
                  ]),
                ),
              },
            };
          });
          break;
        }
        case 'update_node':
        case 'insert_node': {
          const { node, nodeId } = editState;
          if (node.kind.type === 'compv3') {
            const nodeKind = node.kind;
            this.store.updateNodeData<CompositorNodeV3>(nodeId, (prevNode) => {
              const compositorData = prevNode.data;
              return {
                data: {
                  ...compositorData,
                  layers: Object.fromEntries(
                    Array.from(nodeKind.data.layers).map(([layerId, layer]) => {
                      const prevLayer = compositorData.layers[layerId];
                      return [layerId, { ...prevLayer, ...layer }];
                    }),
                  ),
                  layerOrder: nodeKind.data.layerOrder,
                  stage: nodeKind.data.stage,
                  input: nodeKind.data.input,
                },
              };
            });
            this.store.updateNode(nodeId, (_prevNode) => {
              return { ...node };
            });
          } else {
            this.store.updateNode(nodeId, (prevNode) => {
              return { data: { ...prevNode.data, ...node.kind.data }, ...node };
            });
          }
          break;
        }
        case 'remove_node': {
          // TODO
          break;
        }
      }
    }
  }

  onContextLost = () => {
    this.log('WARN', 'Context lost');
    this.wasm = undefined;
  };

  onContextRestored = () => {
    this.log('INFO', 'Context restored');
    this.tryRecover();
  };

  dispose() {
    cancelAnimationFrame(this.requestRef);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);

    this.wasm = undefined;
    instance = undefined;
  }
}
