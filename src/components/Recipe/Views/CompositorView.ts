import { v4 as uuidv4 } from 'uuid';
import { loadFontResources } from '@/components/Recipe/resourceLoading';
import { CompositorNodeV3, UILayer } from '@/types/nodes/compositor';
import { FlowGraph } from '../FlowGraph';
import { UndoRedoEntry } from '../undoRedo';
import type {
  Alignment,
  BlendMode,
  Color,
  Font,
  HorizontalAlign,
  LayerId,
  NodeId,
  Orientation,
  ToolMode,
  VerticalAlign,
} from 'web';

export class CompositorView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  private applyLayerEdit(layerId: LayerId, apply: (layer: UILayer) => Partial<UILayer> | undefined, ongoing = false) {
    // cancelOngoingAction before reading from the graph outside an edit
    this.graph.cancelOngoingAction();
    const layer = this.getLayer(layerId);
    const newLayer = apply(layer);
    if (newLayer === undefined) {
      return;
    }

    this.graph.wasmEdit((wasm) => {
      return wasm.updateLayer(this.nodeId, layerId, { ...layer, ...newLayer });
    }, ongoing);
  }

  private updateLayerData(layerId: LayerId, data: Partial<UILayer>) {
    return this.graph.store.updateNodeData<CompositorNodeV3>(this.nodeId, (nodeData) => {
      return {
        data: {
          ...nodeData.data,
          layers: {
            ...nodeData.data.layers,
            [layerId]: { ...nodeData.data.layers[layerId], ...data },
          },
        },
      };
    });
  }

  private getLayer(layerId: LayerId): UILayer {
    const compositorData = this.graph.store.getNodeData<CompositorNodeV3>(this.nodeId).data;
    return compositorData.layers[layerId];
  }

  aspectRatioLocked(layerId: LayerId): boolean {
    const layer = this.getLayer(layerId);
    return layer.lockedAspectRatio ?? false;
  }

  zoomLevel(): number {
    return this.graph.getUIState().compositor[this.nodeId]?.zoomLevel ?? 1;
  }

  setZoomLevel(zoom: number) {
    this.graph.wasm.call((wasm) => {
      wasm.setZoomLevel(this.nodeId, zoom);
    });
  }

  zoomToFit() {
    this.graph.wasm.call((wasm) => {
      wasm.zoomToFit(this.nodeId);
    });
  }

  toolMode(): ToolMode {
    return this.graph.getUIState().compositor[this.nodeId]?.toolMode ?? 'selection';
  }

  setToolMode(mode: ToolMode) {
    this.graph.wasm.call((wasm) => wasm.setToolMode(this.nodeId, mode));
  }

  setStageDimensions(width: number, height: number) {
    this.graph.wasmEdit((wasm) => wasm.setStageDimensions(this.nodeId, width, height));
  }

  setIsLayerLocked(layerId: LayerId, locked: boolean) {
    this.applyLayerEdit(layerId, (layer) => (layer.locked === locked ? undefined : { locked }), false);
  }

  setLayerPositionX(layerId: LayerId, x: number) {
    this.applyLayerEdit(
      layerId,
      (layer) => (Math.abs(layer.position.x - x) < 0.0001 ? undefined : { position: { x, y: layer.position.y } }),
      false,
    );
  }

  setLayerPositionY(layerId: LayerId, y: number) {
    this.applyLayerEdit(
      layerId,
      (layer) => (Math.abs(layer.position.y - y) < 0.0001 ? undefined : { position: { x: layer.position.x, y } }),
      false,
    );
  }

  setLayerRotation(layerId: LayerId, angle: number) {
    this.applyLayerEdit(
      layerId,
      (layer) => {
        return Math.abs(layer.rotation - angle) < 0.0001 ? undefined : { rotation: angle };
      },
      false,
    );
  }

  setLayerWidth(layerId: LayerId, width: number) {
    this.applyLayerEdit(
      layerId,
      (layer) => {
        return Math.abs(layer.dimension.x - width) < 0.0001
          ? undefined
          : {
              dimension: {
                x: width,
                y: layer.lockedAspectRatio ? (layer.dimension.y / layer.dimension.x) * width : layer.dimension.y,
              },
            };
      },
      false,
    );
  }

  setLayerHeight(layerId: LayerId, height: number) {
    this.applyLayerEdit(
      layerId,
      (layer) => {
        return Math.abs(layer.dimension.y - height) < 0.0001
          ? undefined
          : {
              dimension: {
                x: layer.lockedAspectRatio ? (layer.dimension.x / layer.dimension.y) * height : layer.dimension.x,
                y: height,
              },
            };
      },
      false,
    );
  }

  setLayerColor(layerId: LayerId, value: Color, ongoing = false) {
    this.applyLayerEdit(layerId, (layer) => (layer.color === value ? undefined : { color: value }), ongoing);
  }

  setLayerBlendMode(layerId: LayerId, blendMode: BlendMode, ongoing: boolean) {
    this.applyLayerEdit(layerId, (layer) => (layer.blendMode === blendMode ? undefined : { blendMode }), ongoing);
  }

  setLayerTextSize(layerId: LayerId, size: number, ongoing: boolean) {
    this.applyLayerEdit(
      layerId,
      (layer) =>
        layer.kind.type !== 'text' || Math.abs(layer.kind.layoutOptions.size - size) < 0.0001
          ? undefined
          : { kind: { ...layer.kind, layoutOptions: { ...layer.kind.layoutOptions, size } } },
      ongoing,
    );
  }

  setLayerTextLetterSpacing(layerId: LayerId, letterSpacing: number, ongoing: boolean) {
    this.applyLayerEdit(
      layerId,
      (layer) =>
        layer.kind.type !== 'text' || Math.abs(layer.kind.layoutOptions.letterSpacing - letterSpacing) < 0.0001
          ? undefined
          : { kind: { ...layer.kind, layoutOptions: { ...layer.kind.layoutOptions, letterSpacing } } },
      ongoing,
    );
  }

  setLayerTextLineHeight(layerId: LayerId, lineHeight: number, ongoing: boolean) {
    this.applyLayerEdit(
      layerId,
      (layer) =>
        layer.kind.type !== 'text' || Math.abs(layer.kind.layoutOptions.lineHeight - lineHeight) < 0.0001
          ? undefined
          : { kind: { ...layer.kind, layoutOptions: { ...layer.kind.layoutOptions, lineHeight } } },
      ongoing,
    );
  }

  setLayerTextHorizontalAlign(layerId: LayerId, horizontalAlign: HorizontalAlign, ongoing: boolean) {
    this.applyLayerEdit(
      layerId,
      (layer) =>
        layer.kind.type !== 'text' || layer.kind.layoutOptions.horizontalAlign === horizontalAlign
          ? undefined
          : { kind: { ...layer.kind, layoutOptions: { ...layer.kind.layoutOptions, horizontalAlign } } },
      ongoing,
    );
  }

  setLayerTextVerticalAlign(layerId: LayerId, verticalAlign: VerticalAlign, ongoing: boolean) {
    this.applyLayerEdit(
      layerId,
      (layer) =>
        layer.kind.type !== 'text' || layer.kind.layoutOptions.verticalAlign === verticalAlign
          ? undefined
          : { kind: { ...layer.kind, layoutOptions: { ...layer.kind.layoutOptions, verticalAlign } } },
      ongoing,
    );
  }

  setLayerTextFont(layerId: LayerId, font: Font, ongoing: boolean) {
    this.applyLayerEdit(
      layerId,
      (layer) =>
        layer.kind.type !== 'text' ||
        (layer.kind.fontOptions.font.type === font.type && layer.kind.fontOptions.font.data === font.data)
          ? undefined
          : { kind: { ...layer.kind, fontOptions: { ...layer.kind.fontOptions, font } } },
      ongoing,
    );
    this.graph.wasm.call((wasm) => {
      void loadFontResources(wasm);
    });
  }

  setLayerTextWeight(layerId: LayerId, weight: number, ongoing: boolean) {
    this.applyLayerEdit(
      layerId,
      (layer) =>
        layer.kind.type !== 'text' || Math.abs(layer.kind.fontOptions.weight - weight) < 0.0001
          ? undefined
          : { kind: { ...layer.kind, fontOptions: { ...layer.kind.fontOptions, weight } } },
      ongoing,
    );
    this.graph.wasm.call((wasm) => {
      void loadFontResources(wasm);
    });
  }

  setLayerTextItalic(layerId: LayerId, italic: boolean, ongoing: boolean) {
    this.applyLayerEdit(
      layerId,
      (layer) =>
        layer.kind.type !== 'text' || layer.kind.fontOptions.italic === italic
          ? undefined
          : { kind: { ...layer.kind, fontOptions: { ...layer.kind.fontOptions, italic } } },
      ongoing,
    );
    this.graph.wasm.call((wasm) => {
      void loadFontResources(wasm);
    });
  }

  italicSupport(layerId: LayerId): boolean[] {
    const layer = this.getLayer(layerId);

    if (layer.kind.type !== 'text') {
      return [];
    }
    const font = layer.kind.fontOptions;
    return (
      this.graph.wasm.call((wasm) => {
        const support = wasm.italicSupport(font);
        return Object.values(support).map((b) => b === 1);
      }) ?? []
    );
  }

  weightSupport(layerId: LayerId): number[] {
    const layer = this.getLayer(layerId);

    if (layer.kind.type !== 'text') {
      return [];
    }
    const font = layer.kind.fontOptions;
    return (
      this.graph.wasm.call((wasm) => {
        return Array.from(wasm.weightSupport(font));
      }) ?? []
    );
  }

  setLayerOrder(layerId: LayerId, index: number) {
    this.graph.wasmEdit((wasm) => wasm.setLayerOrder(this.nodeId, layerId, index));
  }

  removeLayers(layerIds: LayerId[]) {
    this.graph.edit(() => {
      const undoEntry = this.graph.wasmChange((wasm) => {
        return wasm.removeLayers(this.nodeId, layerIds);
      });
      undoEntry.add(
        UndoRedoEntry.fromNodes([
          {
            type: 'update',
            node: { ...this.graph.store.getNode(this.nodeId) },
          },
        ]),
      );
      return undoEntry;
    });
  }

  selectedLayersIds(): LayerId[] {
    const selectedLayerId = this.graph.getUIState().compositor[this.nodeId]?.selectedLayer;
    return selectedLayerId !== undefined ? [selectedLayerId] : [];
  }

  setSelectedLayerId(layerId: LayerId | undefined) {
    this.graph.wasm.call((wasm) => {
      wasm.setSelectedLayers(this.nodeId, layerId !== undefined ? [layerId] : []);
    });
  }

  updateLayerName(layerId: LayerId, name: string) {
    this.graph.edit(() => this.updateLayerData(layerId, { name }));
  }

  updateLayerLockedAspectRatio(layerId: LayerId, lockedAspectRatio: boolean) {
    this.updateLayerData(layerId, { lockedAspectRatio });
  }

  flipLayer(layerId: LayerId, orientation: Orientation) {
    this.graph.wasmEdit((wasm) => wasm.flipCompositorLayer(this.nodeId, layerId, orientation));
  }

  alignLayer(layerId: LayerId, alignment: Alignment) {
    this.graph.wasmEdit((wasm) => wasm.alignCompositorLayer(this.nodeId, layerId, alignment));
  }

  addNodeInputHandle() {
    this.graph.edit(() => {
      const { input } = this.graph.store.getNodeData<CompositorNodeV3>(this.nodeId).data;
      let order = input.length;
      if (!input.some(([key, _]) => key === 'background')) {
        order = order + 1;
      }
      const newInputKey = `layer_${order}`;

      let newLayerId: LayerId | undefined;
      const undoEntry = this.graph.wasmChange((wasm) => {
        const { edit, layerId } = wasm.setNodeInput(this.nodeId, newInputKey, null);
        newLayerId = layerId;
        return edit;
      });
      if (newLayerId !== undefined) {
        undoEntry.add(this.updateLayerData(newLayerId, { name: `Layer ${newLayerId}` }));
      }

      undoEntry.add(
        this.graph.addNodeInputHandle(this.nodeId, newInputKey, {
          description: '',
          label: newInputKey,
          format: 'uri',
          id: uuidv4(),
          order,
          required: false,
        }),
      );

      return undoEntry;
    });
  }

  enableNodeEditor() {
    this.graph.wasm.call((wasm) => wasm.enableNodeEditor(this.nodeId));
    this.setToolMode('selection');
    this.zoomToFit();
  }

  disableNodeEditor() {
    this.graph.wasm.call((wasm) => wasm.disableNodeEditor());
  }

  renderResult() {
    void this.graph.updateNodeOutputs(this.nodeId);
  }

  cancelOngoingAction() {
    this.graph.cancelOngoingAction();
    void this.graph.loadResources();
  }

  undo() {
    this.graph.undo();
  }

  redo() {
    this.graph.redo();
  }

  clearUndoRedoHistory() {
    this.graph.clearUndoRedoHistory();
  }

  setUndoBarrier() {
    this.graph.setUndoBarrier();
  }

  disableUndoBarrier() {
    this.graph.disableUndoBarrier();
  }
}
