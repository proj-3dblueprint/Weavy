import { useFlowState } from '@/components/Recipe/FlowContext';
import * as cursors from './cursors';
import type { Cursor, NodeId } from 'web';

const CURSOR_SIZE = 24;

export function useCursor(nodeId: NodeId) {
  const cursor = useFlowState((s) => s.compositor[nodeId]?.cursor) ?? {
    type: 'idle',
    rotation: 0,
    flipX: false,
    flipY: false,
  };

  switch (cursor.type) {
    case 'rotate':
    case 'scale-vertical':
    case 'scale-horizontal':
    case 'scale-positive-diagonal':
    case 'scale-negative-diagonal': {
      const cursorImage = getCursorUrl(cursor.type, cursor.rotation, cursor.flipX, cursor.flipY);
      const offset = CURSOR_SIZE / 2;
      return `url("${cursorImage}") ${offset} ${offset}, auto`;
    }
    case 'idle':
      return 'auto';
    default:
      return 'auto';
  }
}

function getCursorUrl(
  cursorType: Cursor['type'],
  rotation: number,
  flipX: boolean,
  flipY: boolean,
): string | undefined {
  let cursorSvg: string;
  switch (cursorType) {
    case 'scale-negative-diagonal':
    case 'scale-vertical':
    case 'scale-horizontal':
    case 'scale-positive-diagonal': {
      cursorSvg = cursors.scaleHorizontal;
      break;
    }
    case 'rotate':
      cursorSvg = cursors.rotateTopLeft;
      break;
    default:
      // cursor type doesn't have associated image
      return;
  }

  const mirrored = flipX !== flipY;
  let offset: number;
  switch (cursorType) {
    case 'rotate':
      offset = -Math.PI / 2;
      break;
    case 'scale-vertical':
      offset = Math.PI / 2;
      break;
    case 'scale-horizontal':
      offset = 0;
      break;
    case 'scale-positive-diagonal':
      offset = Math.PI / 4;
      break;
    case 'scale-negative-diagonal':
      offset = -Math.PI / 4;
      break;
  }
  const cursorRotation = rotation * (mirrored ? -1 : 1) + offset;

  const scaleX = flipX ? -1 : 1;
  const scaleY = flipY ? -1 : 1;
  const cssRotation = -cursorRotation;
  // rotate svg with css style, encode resulting svg string into url
  const rotatedSvg = cursorSvg.replace(
    /^<svg/,
    `<svg style="transform: scale(${scaleX}, ${scaleY}) rotate(${cssRotation}rad)"`,
  );
  return `data:image/svg+xml,${encodeURIComponent(rotatedSvg)}`;
}
