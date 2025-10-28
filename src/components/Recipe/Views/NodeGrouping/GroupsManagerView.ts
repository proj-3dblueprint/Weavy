import { v4 as uuidv4 } from 'uuid';
import { Instance, Node as ReactFlowNode } from 'reactflow';
import { chain } from 'lodash';
import {
  calculateExpandedGroupBounds,
  calculateMultiNodeBoundsWithPadding,
  convertChildPositionToAbsolute,
  convertChildPositionToRelative,
  rebaseChildPosition,
} from '@/components/Nodes/utils/nodeUtils';
import { BaseNodeData, CustomGroupData, DEFAULT_CUSTOM_GROUP_DATA, Node } from '@/types/node';
import { NodeType } from '@/enums/node-type.enum';
import { log } from '@/logger/logger';
import { FlowGraph } from '../../FlowGraph';
import { UndoRedoEntry } from '../../undoRedo';
import { GroupBounds, DEFAULT_GROUP_PADDING } from './groups.types';
/**
 * Manages node grouping operations including creation, attachment, detachment,
 * and drag interactions with groups in the flow graph.
 */

const logger = log.getLogger('NodeGroupingView');
export class NodeGroupingView {
  constructor(private graph: FlowGraph) {}

  /**
   * Creates a new group from currently selected nodes.
   * Selected nodes become children of the new group.
   */
  createGroupFromSelectedNodes(): void {
    const selectedNodesIds = this.graph.getSelectedNodes();
    const selectedNodes = selectedNodesIds.map((id) => this.graph.store.getNode(id));

    if (selectedNodes.length === 0) {
      return;
    }

    // Don't allow grouping if any selected node is already a group
    if (selectedNodes.some((node) => node.type === NodeType.CustomGroup)) {
      // todo: should we merge groups to one if other groups are selected? Maybe a problem if group is customized already...
      return;
    }

    this.graph.edit(() => {
      const groupNodeBounds = calculateMultiNodeBoundsWithPadding(selectedNodes, DEFAULT_GROUP_PADDING);
      const groupNodeData = this.createGroupNodeStructure(groupNodeBounds);

      // todo: send metric (as in Flow.jsx when adding a new node)
      const undoEntry = this.graph.addNodes([groupNodeData]);
      undoEntry.add(this.setNodesParentAndPosition(selectedNodes, groupNodeData.id, groupNodeBounds));
      this.graph.setSelectedNodes([groupNodeData.id]);

      return undoEntry;
    });
  }

  /**
   * Attaches nodes to an existing group when dropped over it.
   * Recalculates group bounds to accommodate new children and rebases existing children.
   */
  attachNodesToGroup(nodes: Node[], groupId: string): UndoRedoEntry {
    const groupNode = this.graph.store.getNode(groupId);
    if (!groupNode) {
      logger.warn('NodeGroupingView: attachNodesToGroup: group node not found', {
        groupId,
      });
      return UndoRedoEntry.empty();
    }
    const existingChildren = this.graph.getChildNodesOfGroup(groupId);

    const newBounds = calculateExpandedGroupBounds(groupNode, existingChildren, nodes, DEFAULT_GROUP_PADDING);

    const undoEntry = this.updateGroupBounds(groupId, newBounds);
    undoEntry.add(this.setNodesParentAndPosition(nodes, groupId, newBounds));
    undoEntry.add(this.rebaseExistingChildren(existingChildren, groupNode.position, newBounds));
    return undoEntry;
  }

  /**
   * Sets parent relationship for nodes and converts their positions to relative coordinates
   */
  private setNodesParentAndPosition(nodes: Node[], groupId: string, groupBounds: GroupBounds): UndoRedoEntry {
    const undoEntry = UndoRedoEntry.empty();
    for (const node of nodes) {
      const position = convertChildPositionToRelative(node, groupBounds);
      undoEntry.add(
        this.graph.store.setNode(node.id, {
          ...node,
          position,
          parentId: groupId,
        }),
      );
    }
    return undoEntry;
  }

  /**
   * Expands a group when a child is dragged to accommodate the new position.
   * Rebases sibling positions to maintain their absolute positions.
   * Uses positionAbsolute to avoid coordinate system issues during drag operations.
   */
  expandGroupAndRebaseChildrenIfNeeded(childNode: Node): UndoRedoEntry {
    if (!childNode.parentId) {
      return UndoRedoEntry.empty();
    }

    const groupNode = this.graph.store.getNode(childNode.parentId);
    const siblingNodes = this.graph.getChildNodesOfGroup(childNode.parentId).filter((n) => n.id !== childNode.id);

    // Check if the node has positionAbsolute (from ReactFlow during drag operations)
    // This is a runtime property that won't be saved to backend
    const nodeWithPositionAbsolute = childNode as Node & { positionAbsolute?: { x: number; y: number } };

    // Use positionAbsolute for the dragged child node to get the current absolute position
    const childNodeAbsolute = {
      ...childNode,
      position:
        nodeWithPositionAbsolute.positionAbsolute ??
        convertChildPositionToAbsolute(childNode, groupNode.position).position,
    };

    // For siblings, convert their relative positions to absolute using current group position
    const siblingNodesAbsolute = siblingNodes.map((sibling) =>
      convertChildPositionToAbsolute(sibling, groupNode.position),
    );

    const allChildrenAbsolute = [childNodeAbsolute, ...siblingNodesAbsolute];

    // Calculate new group bounds using absolute positions
    const newGroupBounds = calculateExpandedGroupBounds(groupNode, [], allChildrenAbsolute, DEFAULT_GROUP_PADDING);

    // Apply all updates in one transaction
    const undoEntry = this.updateGroupBounds(groupNode.id, newGroupBounds);

    // Update all children to new relative position within expanded bounds
    allChildrenAbsolute.forEach((node) => {
      const relativePosition = convertChildPositionToRelative(node, newGroupBounds);
      undoEntry.add(
        this.graph.store.updateNode(node.id, () => ({
          position: relativePosition,
        })),
      );
    });
    return undoEntry;
  }

  /**
   * Updates existing children positions after group bounds change
   */
  private rebaseExistingChildren(
    children: Node[],
    oldParentPosition: { x: number; y: number },
    newBounds: GroupBounds,
  ): UndoRedoEntry {
    const undoEntry = UndoRedoEntry.empty();
    for (const child of children) {
      const position = rebaseChildPosition(child, oldParentPosition, newBounds);
      undoEntry.add(
        this.graph.store.updateNode(child.id, () => ({
          position,
        })),
      );
    }
    return undoEntry;
  }

  /**
   * Updates a group node's bounds (position and size)
   */
  private updateGroupBounds(groupId: string, bounds: GroupBounds): UndoRedoEntry {
    const undoEntry = UndoRedoEntry.empty();
    undoEntry.add(
      this.graph.store.updateNode(groupId, () => ({
        position: { x: bounds.x, y: bounds.y },
        // TODO: we have to set these otherwise the onNodesChange handler in useReactFlowProps.ts overrides them - remove when possible
        width: bounds.width,
        height: bounds.height,
      })),
    );
    undoEntry.add(
      this.graph.store.updateNodeData<CustomGroupData>(groupId, () => ({
        width: bounds.width,
        height: bounds.height,
      })),
    );
    return undoEntry;
  }

  /**
   * Finds a group node that intersects with the given nodes.
   * Returns null if nodes already have parents or are groups themselves.
   */
  findIntersectingGroup(
    nodes: Node[],
    getIntersectingNodes: Instance.GetIntersectingNodes<BaseNodeData>,
  ): string | null {
    if (nodes.some((node) => node.parentId || node.type === NodeType.CustomGroup)) {
      return null;
    }

    const intersections = nodes
      .map((node) => getIntersectingNodes(node as ReactFlowNode<BaseNodeData>))
      .flat()
      .filter((n) => n.type === NodeType.CustomGroup);

    return intersections.length > 0 ? intersections[0].id : null;
  }

  /**
   * Checks if all nodes share the same parent ID (all must have a parent)
   * Returns false if any node has no parent or if parents differ
   */
  areAllNodesInSameGroup(nodes: Node[]): boolean {
    const parentIds = chain(nodes)
      .map((node) => node.parentId)
      .compact()
      .value();
    return parentIds.length === nodes.length && new Set(parentIds).size === 1;
  }

  /**
   * Handles removal of nodes from their parent group when modifier key is used
   */
  removeNodesFromGroup(nodes: Node[]): UndoRedoEntry {
    const undoEntry = UndoRedoEntry.empty();

    for (const node of nodes) {
      const parentGroup = this.graph.store.getNode(node.parentId!);
      const absolutePosition = convertChildPositionToAbsolute(node, parentGroup.position);

      undoEntry.add(
        this.graph.store.updateNode(node.id, () => ({
          parentId: undefined,
          position: absolutePosition.position,
        })),
      );
    }

    return undoEntry;
  }

  /**
   * Creates the data structure for a new group node
   */
  private createGroupNodeStructure(bounds: GroupBounds): Node {
    return {
      id: uuidv4(),
      type: NodeType.CustomGroup,
      data: { ...DEFAULT_CUSTOM_GROUP_DATA, ...{ width: bounds.width, height: bounds.height } },
      position: { x: bounds.x, y: bounds.y },
      locked: false,
    };
  }
}
