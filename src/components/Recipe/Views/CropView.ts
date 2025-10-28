import { clampValue } from '@/utils/numbers';
import { DEFAULT_DIMENSIONS } from '@/consts/dimensions';
import { FlowGraph } from '../FlowGraph';

import type { CropOptions, NodeId, Vec2 } from 'web';
import type { CropData } from '@/types/node';
import type { CornerType, EdgeType } from '@/components/Nodes/Crop/types';

const defaultCrop: CropOptions = {
  x: 0,
  y: 0,
  width: DEFAULT_DIMENSIONS.width,
  height: DEFAULT_DIMENSIONS.height,
  lockAspectRatio: true,
};

export class CropView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  private async updateNodeOutput() {
    await this.graph.updateNodeOutputs(this.nodeId);
  }

  private updateCrop(update: (crop?: CropOptions) => Partial<CropOptions>, ongoing = false) {
    this.graph.wasmEdit((wasm) => {
      const { options } = this.getCropNodeData();
      const newCrop = update(options);
      return wasm.setCropOptions(this.nodeId, {
        x: Math.max(0, Math.round(newCrop.x ?? options?.x ?? defaultCrop.x)),
        y: Math.max(0, Math.round(newCrop.y ?? options?.y ?? defaultCrop.y)),
        width: Math.max(1, Math.round(newCrop.width ?? options?.width ?? defaultCrop.width)),
        height: Math.max(1, Math.round(newCrop.height ?? options?.height ?? defaultCrop.height)),
        lockAspectRatio: newCrop.lockAspectRatio ?? options?.lockAspectRatio ?? defaultCrop.lockAspectRatio,
      });
    }, ongoing);

    if (!ongoing) {
      void this.updateNodeOutput();
    }
  }

  getInputDimensions(): { width: number; height: number } | undefined {
    const { inputNode } = this.getCropNodeData();
    if (!inputNode) return undefined;
    return this.graph.wasm.call((wasm) => wasm.nodeInputDimensions(inputNode));
  }

  private getCropNodeData() {
    return this.graph.store.getNodeData<CropData>(this.nodeId);
  }

  resetCrop() {
    const inputDimensions = this.getInputDimensions();
    if (!inputDimensions) return;
    this.updateCrop(() => ({ x: 0, y: 0, width: inputDimensions.width, height: inputDimensions.height }));
  }

  updateWidth(width: number) {
    const lockAspectRatio = this.getCropNodeData().options?.lockAspectRatio ?? true;
    const inputDimensions = this.getInputDimensions();

    this.updateCrop((crop) => {
      if (!crop) return { width };
      const aspectRatio = crop.width / crop.height;
      if (!inputDimensions) {
        return {
          x: 0,
          y: 0,
          width,
          height: lockAspectRatio ? width / aspectRatio : crop.height,
        };
      }

      const widthBound = inputDimensions.width;
      const heightBound = inputDimensions.height;
      const clampedWidth = clampValue(width, 1, widthBound);
      const targetHeight = Math.round(clampedWidth / aspectRatio);

      const [newWidth, newHeight] = lockAspectRatio
        ? targetHeight < heightBound
          ? [clampedWidth, targetHeight]
          : [heightBound * aspectRatio, heightBound]
        : [clampedWidth, crop.height];

      return {
        x: crop.x + newWidth < widthBound ? crop.x : widthBound - newWidth,
        y: crop.y + newHeight < heightBound ? crop.y : heightBound - newHeight,
        width: newWidth,
        height: newHeight,
      };
    });
  }

  updateHeight(height: number) {
    const lockAspectRatio = this.getCropNodeData().options?.lockAspectRatio ?? true;
    const inputDimensions = this.getInputDimensions();

    this.updateCrop((crop) => {
      if (!crop) return { height };
      const aspectRatio = crop.width / crop.height;
      if (!inputDimensions) {
        return {
          x: 0,
          y: 0,
          width: lockAspectRatio ? height * aspectRatio : crop.width,
          height,
        };
      }

      const widthBound = inputDimensions.width;
      const heightBound = inputDimensions.height;
      const clampedHeight = clampValue(height, 1, heightBound);
      const targetWidth = Math.round(clampedHeight * aspectRatio);

      const [newWidth, newHeight] = lockAspectRatio
        ? targetWidth < widthBound
          ? [targetWidth, clampedHeight]
          : [widthBound, widthBound / aspectRatio]
        : [crop.width, clampedHeight];

      return {
        x: crop.x + newWidth < widthBound ? crop.x : widthBound - newWidth,
        y: crop.y + newHeight < heightBound ? crop.y : heightBound - newHeight,
        width: newWidth,
        height: newHeight,
      };
    });
  }

  changeAspectRatio(value: number) {
    this.graph.wasmEdit((wasm) => {
      const inputDimensions = this.getInputDimensions();

      const targetWidth = inputDimensions ? inputDimensions.width : DEFAULT_DIMENSIONS.width;
      const targetHeight = inputDimensions ? inputDimensions.height : DEFAULT_DIMENSIONS.height;
      const aspectRatio = value;

      // center and fit to bounds
      const newCrop =
        aspectRatio > targetWidth / targetHeight
          ? {
              x: 0,
              y: Math.round((targetHeight - Math.round(targetWidth / aspectRatio)) / 2),
              width: targetWidth,
              height: Math.round(targetWidth / aspectRatio),
            }
          : {
              x: Math.round((targetWidth - Math.round(targetHeight * aspectRatio)) / 2),
              y: 0,
              width: Math.round(targetHeight * aspectRatio),
              height: targetHeight,
            };

      return wasm.setCropOptions(this.nodeId, { ...newCrop, lockAspectRatio: true });
    });

    void this.updateNodeOutput();
  }

  dragBox(dx: number, dy: number, ongoing: boolean) {
    this.updateCrop((crop) => {
      if (!crop) throw new Error('expected crop data');
      const inputDimensions = this.getInputDimensions();
      if (!inputDimensions) return crop;

      const x = clampValue(crop.x + dx, 0, inputDimensions.width - crop.width);
      const y = clampValue(crop.y + dy, 0, inputDimensions.height - crop.height);
      return { x, y };
    }, ongoing);
  }

  dragCorner(dx: number, dy: number, type: CornerType, ongoing: boolean) {
    const lockAspectRatio = this.getCropNodeData().options?.lockAspectRatio ?? true;
    this.updateCrop((crop) => {
      if (!crop) throw new Error('expected crop data');
      const inputDimensions = this.getInputDimensions();
      if (!inputDimensions) return crop;
      const { width: widthBound, height: heightBound } = inputDimensions;
      const { x, y, width, height } = crop;

      const isTop = type === 'nw' || type === 'ne';
      const isLeft = type === 'nw' || type === 'sw';

      // constrain delta such that dragged corner doesn't leave bounds
      let delta: Vec2;
      switch (type) {
        case 'nw': {
          const ptX = clampValue(x + dx, 0, x + width - 1);
          const ptY = clampValue(y + dy, 0, y + height - 1);
          delta = { x: ptX - x, y: ptY - y };
          break;
        }
        case 'sw': {
          const ptX = clampValue(x + dx, 0, x + width - 1);
          const ptY = clampValue(y + height + dy, y + 1, heightBound);
          delta = { x: ptX - x, y: ptY - (y + height) };
          break;
        }
        case 'ne': {
          const ptX = clampValue(x + width + dx, x + 1, widthBound);
          const ptY = clampValue(y + dy, 0, y + height - 1);
          delta = { x: ptX - (x + width), y: ptY - y };
          break;
        }
        case 'se': {
          const ptX = clampValue(x + width + dx, x + 1, widthBound);
          const ptY = clampValue(y + height + dy, y + 1, heightBound);
          delta = { x: ptX - (x + width), y: ptY - (y + height) };
          break;
        }
      }

      // calculate new diagonal in terms of moving point and fixed corner
      const corner = { x: isLeft ? x : x + width, y: isTop ? y : y + height };
      const fixed = { x: isLeft ? x + width : x, y: isTop ? y + height : y };

      const fixedToCorner = { x: corner.x - fixed.x, y: corner.y - fixed.y };
      const movingDiag = { x: fixedToCorner.x + delta.x, y: fixedToCorner.y + delta.y };

      let finalDiag: Vec2;
      if (!lockAspectRatio) {
        finalDiag = movingDiag;
      } else {
        // preserve aspect ratio
        const aspectRatio = width / height;

        const cross = (v1: Vec2, v2: Vec2) => v1.x * v2.y - v1.y * v2.x;
        const positiveWinding = cross(fixedToCorner, movingDiag) > 0;
        const isVerticalDrag = positiveWinding ? type === 'nw' || type === 'se' : type === 'sw' || type === 'ne';

        const correctedDiag = isVerticalDrag
          ? { x: Math.sign(movingDiag.x) * Math.abs(movingDiag.y * aspectRatio), y: movingDiag.y }
          : { x: movingDiag.x, y: Math.sign(movingDiag.y) * (Math.abs(movingDiag.x) / aspectRatio) };

        const newMoving = { x: fixed.x + correctedDiag.x, y: fixed.y + correctedDiag.y };

        // scale down into file bounds
        let scale = 1;
        if (newMoving.x < 0) {
          scale = fixed.x / correctedDiag.x;
        } else if (newMoving.x > widthBound) {
          scale = (widthBound - fixed.x) / correctedDiag.x;
        } else if (newMoving.y < 0) {
          scale = fixed.y / correctedDiag.y;
        } else if (newMoving.y > heightBound) {
          scale = (heightBound - fixed.y) / correctedDiag.y;
        }

        finalDiag = { x: correctedDiag.x * Math.abs(scale), y: correctedDiag.y * Math.abs(scale) };
      }

      return {
        x: isLeft ? fixed.x + finalDiag.x : fixed.x,
        y: isTop ? fixed.y + finalDiag.y : fixed.y,
        width: Math.abs(finalDiag.x),
        height: Math.abs(finalDiag.y),
      };
    }, ongoing);
  }

  dragEdge(dx: number, dy: number, type: EdgeType, ongoing: boolean) {
    const lockAspectRatio = this.getCropNodeData().options?.lockAspectRatio ?? true;
    this.updateCrop((crop) => {
      if (!crop) throw new Error('expected crop data');
      const inputDimensions = this.getInputDimensions();
      if (!inputDimensions) return crop;
      const { width: widthBound, height: heightBound } = inputDimensions;
      const { x, y, width, height } = crop;

      // constrain delta such that dragged edge doesn't leave bounds
      let delta: { x: number; y: number };
      switch (type) {
        case 'n': {
          const coord = clampValue(y + dy, 0, y + height - 1);
          delta = { x: dx, y: coord - y };
          break;
        }
        case 's': {
          const coord = clampValue(y + height + dy, y + 1, heightBound);
          delta = { x: dx, y: coord - (y + height) };
          break;
        }
        case 'w': {
          const coord = clampValue(x + dx, 0, x + width - 1);
          delta = { x: coord - x, y: dy };
          break;
        }
        case 'e': {
          const coord = clampValue(x + width + dx, x + 1, widthBound);
          delta = { x: coord - (x + width), y: dy };
          break;
        }
      }

      let fromOppositeEdge: number;
      let newEdgeCoord: number;
      switch (type) {
        case 'n': {
          fromOppositeEdge = -height + delta.y;
          newEdgeCoord = clampValue(y + delta.y, 0, y + height - 1);
          break;
        }
        case 's': {
          fromOppositeEdge = height + delta.y;
          newEdgeCoord = clampValue(y + height + delta.y, y + 1, heightBound);
          break;
        }
        case 'w': {
          fromOppositeEdge = -width + delta.x;
          newEdgeCoord = clampValue(x + delta.x, 0, x + width - 1);
          break;
        }
        case 'e': {
          fromOppositeEdge = width + delta.x;
          newEdgeCoord = clampValue(x + width + delta.x, x + 1, widthBound);
          break;
        }
      }

      // calculate new edge in terms of moving edge and fixed edge
      const isHorizontal = type === 'n' || type === 's';
      if (!lockAspectRatio) {
        return {
          x: type === 'w' ? newEdgeCoord : x,
          y: type === 'n' ? newEdgeCoord : y,
          width: isHorizontal ? width : Math.abs(fromOppositeEdge),
          height: !isHorizontal ? height : Math.abs(fromOppositeEdge),
        };
      } else {
        const isHorizontal = type === 'n' || type === 's';
        const aspectRatio = width / height;

        const scalingDimension = Math.abs(fromOppositeEdge);
        const targetOtherDimension = isHorizontal ? aspectRatio * scalingDimension : scalingDimension / aspectRatio;
        const targetCrop = {
          x: type === 'w' ? newEdgeCoord : x,
          y: type === 'n' ? newEdgeCoord : y,
          width: isHorizontal ? targetOtherDimension : Math.abs(fromOppositeEdge),
          height: !isHorizontal ? targetOtherDimension : Math.abs(fromOppositeEdge),
        };

        // constrain target crop to bounds and preserve aspect ratio
        let constrainedCrop = targetCrop;
        if (targetCrop.x + targetCrop.width > widthBound) {
          const newWidth = widthBound - targetCrop.x;
          constrainedCrop = {
            x: targetCrop.x,
            y: targetCrop.y,
            width: newWidth,
            height: newWidth / aspectRatio,
          };
        } else if (targetCrop.y + targetCrop.height > heightBound) {
          const newHeight = heightBound - targetCrop.y;
          constrainedCrop = {
            x: targetCrop.x,
            y: targetCrop.y,
            width: newHeight * aspectRatio,
            height: newHeight,
          };
        }

        return constrainedCrop;
      }
    }, ongoing);
  }

  toggleLockAspectRatio() {
    const options = this.getCropNodeData().options;
    this.graph.wasmEdit((wasm) =>
      wasm.setCropOptions(
        this.nodeId,
        options
          ? { ...options, lockAspectRatio: !options.lockAspectRatio }
          : { x: 0, y: 0, ...DEFAULT_DIMENSIONS, lockAspectRatio: false },
      ),
    );
  }
}
