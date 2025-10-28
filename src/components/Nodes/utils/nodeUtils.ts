import { type Node } from '@/types/node';
import { NodeType } from '@/enums/node-type.enum';
import { GroupBounds } from '@/components/Recipe/Views/NodeGrouping/groups.types';

export type XYPosition = { x: number; y: number };

/**
 * Sorts nodes for rendering. The sorting order is:
 * 1. Regular nodes (not in groups)
 * 2. Group nodes with their children immediately following
 */
export const sortNodesForRendering = (nodes: Node[]): Node[] => {
  // Separate nodes into categories
  const regularNodes: Node[] = [];
  const groupNodes: Node[] = [];
  const childrenByParent = new Map<string, Node[]>();

  nodes.forEach((node) => {
    if (node.parentId) {
      // Child node
      const children = childrenByParent.get(node.parentId) || [];
      children.push(node);
      childrenByParent.set(node.parentId, children);
    } else if (node.type === NodeType.CustomGroup) {
      // Group node
      groupNodes.push(node);
    } else {
      // Regular node
      regularNodes.push(node);
    }
  });

  // Build result: regular nodes first, then each group with its children
  const result = [...regularNodes];
  groupNodes.forEach((group) => {
    result.push(group);
    const children = childrenByParent.get(group.id) || [];
    result.push(...children);
  });

  return result;
};

/**
 * Converts a node's absolute position to relative position within a group
 */
export const getNodePositionInsideParent = (node: Partial<Node>, groupNode: Node): XYPosition => {
  const position = node.position ?? { x: 0, y: 0 };
  const nodeWidth = node.width ?? 0;
  const nodeHeight = node.height ?? 0;
  const groupWidth = groupNode.width ?? 0;
  const groupHeight = groupNode.height ?? 0;

  let relativeX: number;
  let relativeY: number;

  if (position.x < groupNode.position.x) {
    relativeX = 0;
  } else if (position.x + nodeWidth > groupNode.position.x + groupWidth) {
    relativeX = groupWidth - nodeWidth;
  } else {
    relativeX = position.x - groupNode.position.x;
  }

  if (position.y < groupNode.position.y) {
    relativeY = 0;
  } else if (position.y + nodeHeight > groupNode.position.y + groupHeight) {
    relativeY = groupHeight - nodeHeight;
  } else {
    relativeY = position.y - groupNode.position.y;
  }

  return { x: relativeX, y: relativeY };
};

/**
 * Converts a node's relative position within a group to absolute position
 */
export const getAbsolutePositionFromRelative = (relativePosition: XYPosition, groupNode: Node): XYPosition => {
  return {
    x: relativePosition.x + groupNode.position.x,
    y: relativePosition.y + groupNode.position.y,
  };
};

/**
 * Calculates bounds for a group of nodes with optional padding
 */
export const calculateMultiNodeBoundsWithPadding = (
  nodes: Node[],
  padding: number,
): { x: number; y: number; width: number; height: number } => {
  const bounds = getNodesBounds(nodes);
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + 2 * padding,
    height: bounds.height + 2 * padding,
  };
};

/**
 * Calculates the expanded bounds needed to include new nodes in an existing group.
 * Handles conversion of existing children from relative to absolute positions internally.
 * @param groupNode - The existing group node
 * @param existingChildrenRelative - Existing child nodes with relative positions
 * @param newNodes - New nodes to add with absolute positions
 * @param padding - Padding around children inside the group
 */
export const calculateExpandedGroupBounds = (
  groupNode: Node,
  existingChildrenRelative: Node[],
  newNodes: Node[],
  padding: number = 0,
): { x: number; y: number; width: number; height: number } => {
  // Convert existing children to absolute positions for bounds calculation
  const existingChildrenAbsolute = existingChildrenRelative.map((child) =>
    convertChildPositionToAbsolute(child, groupNode.position),
  );

  // Calculate bounds for all nodes (existing + new)
  const selectionBoundsChildren = getNodesBounds([...existingChildrenAbsolute, ...newNodes]);
  const selectionBoundsWithGroup = getNodesBounds([groupNode, ...existingChildrenAbsolute, ...newNodes]);

  const newGroupX = Math.min(selectionBoundsWithGroup.x, selectionBoundsChildren.x - padding);
  const newGroupY = Math.min(selectionBoundsWithGroup.y, selectionBoundsChildren.y - padding);
  const newGroupBottom = Math.max(
    selectionBoundsWithGroup.y + selectionBoundsWithGroup.height,
    selectionBoundsChildren.y + selectionBoundsChildren.height + 2 * padding,
  );
  const newGroupRight = Math.max(
    selectionBoundsWithGroup.x + selectionBoundsWithGroup.width,
    selectionBoundsChildren.x + selectionBoundsChildren.width + 2 * padding,
  );

  const newGroupWidth = newGroupRight - newGroupX;
  const newGroupHeight = newGroupBottom - newGroupY;

  return {
    x: newGroupX,
    y: newGroupY,
    width: newGroupWidth,
    height: newGroupHeight,
  };
};

/**
 * Converts child node position from absolute to relative when adding to a group
 */
export const convertChildPositionToRelative = (node: Node, groupBounds: { x: number; y: number }): XYPosition => {
  return {
    x: node.position.x - groupBounds.x,
    y: node.position.y - groupBounds.y,
  };
};

export const convertChildPositionToAbsolute = (node: Node, groupBounds: { x: number; y: number }): Node => {
  return {
    ...node,
    position: {
      x: node.position.x + groupBounds.x,
      y: node.position.y + groupBounds.y,
    },
  };
};

/**
 * Converts a child's relative position from one parent coordinate system to another.
 * Useful when a group's bounds change and children need to maintain their absolute position.
 */
export const rebaseChildPosition = (
  child: Node,
  oldParentPosition: { x: number; y: number },
  newParentPosition: { x: number; y: number },
): XYPosition => {
  // Convert to absolute, then back to relative with new parent position
  const absoluteX = child.position.x + oldParentPosition.x;
  const absoluteY = child.position.y + oldParentPosition.y;
  return {
    x: absoluteX - newParentPosition.x,
    y: absoluteY - newParentPosition.y,
  };
};

/**
 * Constrains bounds to ensure children remain contained within the group.
 * Returns the union of requested bounds and minimum bounds needed to contain all children.
 */
export const constrainBoundsToChildren = (
  requestedBounds: GroupBounds,
  childNodes: Node[],
  groupPosition: XYPosition,
  padding: number,
): { x: number; y: number; width: number; height: number } => {
  // If there are no children, return the requested bounds unchanged
  if (childNodes.length === 0) {
    return requestedBounds;
  }

  const childNodesAbsolute = childNodes.map((child) => convertChildPositionToAbsolute(child, groupPosition));
  const groupNodeBounds = calculateMultiNodeBoundsWithPadding(childNodesAbsolute, padding);

  const newX = Math.min(requestedBounds.x, groupNodeBounds.x);
  const newY = Math.min(requestedBounds.y, groupNodeBounds.y);
  const newRight = Math.max(requestedBounds.x + requestedBounds.width, groupNodeBounds.x + groupNodeBounds.width);
  const newBottom = Math.max(requestedBounds.y + requestedBounds.height, groupNodeBounds.y + groupNodeBounds.height);

  return {
    x: newX,
    y: newY,
    width: newRight - newX,
    height: newBottom - newY,
  };
};

const getNodesBounds = (nodes: Node[]): { x: number; y: number; width: number; height: number } => {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const x = Math.min(...nodes.map((node) => node.position.x));
  const y = Math.min(...nodes.map((node) => node.position.y));
  const bottom = Math.max(...nodes.map((node) => node.position.y + (node.height ?? 0)));
  const right = Math.max(...nodes.map((node) => node.position.x + (node.width ?? 0)));
  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
  };
};
