import { NodeId } from 'web';
import {
  rebaseChildPosition,
  constrainBoundsToChildren,
  convertChildPositionToAbsolute,
} from '@/components/Nodes/utils/nodeUtils';
import { log } from '@/logger/logger';
import { CustomGroupData, Node } from '@/types/node';
import { FlowGraph } from '../FlowGraph';
import { UndoRedoEntry } from '../undoRedo';
import { FlowView } from './FlowView';
import { DEFAULT_GROUP_PADDING, GroupBounds, LABEL_SIZE } from './NodeGrouping/groups.types';

const logger = log.getLogger('CustomGroupView');
export class CustomGroupView {
  private flowView: FlowView;
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {
    this.flowView = new FlowView(graph);
  }

  updateGroupName(name: string) {
    this.graph.edit(() => {
      return this.graph.store.updateNodeData<CustomGroupData>(this.nodeId, (data) => ({
        ...data,
        name,
      }));
    });
  }

  ungroup(): void {
    const children = this.graph.getChildNodesOfGroup(this.nodeId);

    this.graph.edit(() => {
      const undoEntry = UndoRedoEntry.empty();

      // Remove children from group (converts positions to absolute)
      if (children.length > 0) {
        undoEntry.add(this.removeNodesFromGroup(children));
      }

      // Delete the group node
      undoEntry.add(this.graph.removeNodes([this.nodeId]));

      return undoEntry;
    });
  }

  delete(): void {
    this.graph.edit(() => {
      return this.graph.removeNodes([this.nodeId]);
    });
  }

  updateGroupColor(color: string): void {
    this.graph.edit(() => {
      return this.graph.updateNodeData(this.nodeId, { color });
    });
  }

  updateGroupLabelSize(labelFontSize: number): void {
    this.graph.edit(() => {
      return this.graph.store.updateNodeData<CustomGroupData>(this.nodeId, () => ({ labelFontSize }));
    });
  }

  getGroupColor(): string | undefined {
    return this.graph.store.getNodeDataNullable<CustomGroupData>(this.nodeId)?.color;
  }

  getGroupLabelSize(): LABEL_SIZE | undefined {
    return this.graph.store.getNodeDataNullable<CustomGroupData>(this.nodeId)?.labelFontSize;
  }

  handleResize(requestedBounds: GroupBounds, isOngoing: boolean) {
    const childNodes = this.graph.getChildNodesOfGroup(this.nodeId);
    const groupNode = this.graph.store.getNode(this.nodeId);
    if (!groupNode) {
      logger.warn('CustomGroupView: handleResize: group node not found', {
        id: this.nodeId,
      });
      return;
    }
    const newBounds = constrainBoundsToChildren(requestedBounds, childNodes, groupNode.position, DEFAULT_GROUP_PADDING);
    this.updateGroupBoundsAndRebaseChildren(newBounds, groupNode, isOngoing);
  }

  private updateGroupBoundsAndRebaseChildren(newBounds: GroupBounds, groupNode: Node, ongoing: boolean) {
    const { x, y, width, height } = newBounds;

    const childPositionUpdates = this.getChildRebaseChanges(groupNode.position, { x, y });
    this.graph.edit(() => {
      const undoEntry = UndoRedoEntry.empty();
      undoEntry.add(
        this.flowView.setNodePositions([{ nodeId: this.nodeId, position: { x, y } }, ...childPositionUpdates]),
      );
      undoEntry.add(this.setGroupNodeDimensions(width, height));
      return undoEntry;
    }, ongoing);
  }

  private getChildRebaseChanges(previousPosition: { x: number; y: number }, newPosition: { x: number; y: number }) {
    const childNodes = this.graph.getChildNodesOfGroup(this.nodeId);
    return childNodes.map((child) => ({
      nodeId: child.id,
      position: rebaseChildPosition(child, previousPosition, newPosition),
      width: child.width!,
      height: child.height!,
    }));
  }

  private setGroupNodeDimensions(width: number, height: number) {
    const undoEntry = UndoRedoEntry.empty();
    undoEntry.add(this.graph.store.updateNodeData<CustomGroupData>(this.nodeId, () => ({ width, height })));
    undoEntry.add(this.graph.store.updateNode(this.nodeId, () => ({ width, height }))); // otherwise width/height are overridden by onNodesChange handler in useReactFlowProps.ts
    return undoEntry;
  }

  private removeNodesFromGroup(nodes: Node[]): UndoRedoEntry {
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
}
