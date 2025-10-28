import { toPng } from 'html-to-image';
import { getNodesBounds, getViewportForBounds } from 'reactflow';
import { log } from '@/logger/logger.ts';
import { POSTER_WIDTH, POSTER_HEIGHT } from '@/consts/recipe-poster';
import { color } from '@/colors.ts';
import { HandleType } from '@/enums/handle-type.enum';
import { ModelItem } from '@/state/nodes/nodes.types';
import { FlowMode } from '@/enums/flow-modes.enum';
import { Connection } from './FlowComponents/FlowTour/ConnectionContext';
import type { Instance } from 'reactflow';
import type { CustomGroupData, Node } from '@/types/node';

const logger = log.getLogger('utils');

function captureVideoFrame(videoElement: HTMLVideoElement) {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Couldn't get canvas 2d context");
  videoElement.crossOrigin = 'anonymous';
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/png');
}

export async function createPoster({
  getNodes,
  posterWidth = POSTER_WIDTH,
  posterHeight = POSTER_HEIGHT,
}: {
  posterWidth: number;
  posterHeight: number;
  getNodes: Instance.GetNodes<any>;
}) {
  const nodesBounds = getNodesBounds(getNodes());
  const transform = getViewportForBounds(nodesBounds, POSTER_WIDTH, POSTER_HEIGHT, 0.1, 3);

  const videos = document.querySelectorAll('video');
  const videoReplacements = new Map<HTMLVideoElement, HTMLImageElement>();

  videos.forEach((video) => {
    const frameDataURL = captureVideoFrame(video);
    const imageElement = new Image();
    imageElement.src = frameDataURL;
    imageElement.style.width = `${video.offsetWidth}px`;
    imageElement.style.height = `${video.offsetHeight}px`;
    if (video.parentNode) {
      video.parentNode.replaceChild(imageElement, video);
      videoReplacements.set(video, imageElement);
    }
  });

  try {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) throw new Error('Viewport not found');
    const dataUrl = await toPng(viewport, {
      backgroundColor: color.Black100,
      width: posterWidth,
      height: posterHeight,
      skipFonts: true,
      style: {
        width: posterWidth.toString(),
        height: posterHeight.toString(),
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
      pixelRatio: 1,
    });

    return dataUrl;
  } catch (err) {
    logger.error('Failed to create poster image', err);
  } finally {
    videoReplacements.forEach((imageElement, video) => {
      if (!imageElement.parentNode) throw new Error('image parent not found');
      imageElement.parentNode.replaceChild(video, imageElement);
    });
  }
}

/**
 * Returns the key of the handle on the given side ("input" or "output") of the node that matches the given type.
 * If multiple handles of the same type exist (e.g., text1, text2), sorts them by their numeric suffix and returns the first one.
 * If no numeric suffix is present, treats it as 0.
 *
 * @param node - The node object containing handle definitions
 * @param type - The handle type to match (e.g., 'text', 'image', etc)
 * @param side - 'input' or 'output', indicating which side's handles to search
 * @returns The key of the first matching handle, sorted by suffix index, or undefined if not found
 */
export function getHandle(node: Node, type: HandleType, side: 'input' | 'output'): string | undefined {
  const handles = node.data.handles?.[side];
  if (!handles || Array.isArray(handles)) return undefined;
  // Sort entries by the 'order' property on the handle
  const sortedEntries = Object.entries(handles)
    .filter(([_, handle]) => handle.type === type)
    .sort(([, aHandle], [, bHandle]) => {
      const aOrder = typeof aHandle.order === 'number' ? aHandle.order : 0;
      const bOrder = typeof bHandle.order === 'number' ? bHandle.order : 0;
      return aOrder - bOrder;
    });
  return sortedEntries.length > 0 ? sortedEntries[0][0] : undefined;
}

export const getOppositeHandleKeyForConnection = (
  side: Connection['handleSide'],
): keyof Pick<ModelItem, 'inputTypes' | 'outputTypes'> => (side && side === 'source' ? 'inputTypes' : 'outputTypes');

export const isRecipeInteractionAllowed = (
  isEditorOpen: boolean,
  isGalleryOpen: boolean,
  role: string,
  flowViewingMode: FlowMode,
) => !isEditorOpen && !isGalleryOpen && role !== 'guest' && flowViewingMode === FlowMode.Workflow;

export function toReactFlowNode(node: Node, highlightedGroupId: string | null) {
  if (node.type === 'custom_group') {
    const nodeData = node.data as CustomGroupData;
    return {
      ...node,
      width: nodeData.width,
      height: nodeData.height,
      style: {
        width: nodeData.width,
        height: nodeData.height,
      },
      className: highlightedGroupId === node.id ? 'active' : undefined,
    };
  } else {
    return node;
  }
}
