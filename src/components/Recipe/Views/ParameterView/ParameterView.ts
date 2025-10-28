import { v4 as uuidv4 } from 'uuid';
import omit from 'lodash/omit';
import { log } from '@/logger/logger.ts';
import { validateInteger, validateNumber, validateParameterValue } from '@/utils/nodeInputValidation';
import { HandleType } from '@/enums/handle-type.enum';
import { getHandleId, getNodeTemplates } from '@/components/Nodes/Utils';
import { NodeDefinition } from '@/types/api/nodeDefinition';
import { UndoRedoEntry } from '../../undoRedo';
import { createNewNode } from '../../useGraph';
import { type FlowGraph } from '../../FlowGraph';
import { getParameterTranslation } from './parameters.utils';
import type { NodeId, ParameterConstraint, ParameterValue } from 'web';
import type { ModelBaseNodeData } from '@/types/nodes/model';
import type { NodeDataWithParams, ParameterInfo, Schema } from '@/types/node';

const logger = log.getLogger('ParameterView');

export class ParameterView {
  constructor(
    private graph: FlowGraph,
    private nodeId: NodeId,
  ) {}

  private getData(): ModelBaseNodeData {
    return this.graph.store.getNodeData<ModelBaseNodeData>(this.nodeId);
  }

  private isSupported(): boolean {
    return this.graph.isSupportedNode(this.nodeId);
  }

  getParameterIds(): string[] {
    if (this.isSupported()) {
      return this.graph.wasm.call((wasm) => wasm.parameterIds(this.nodeId)) ?? [];
    }
    const schema = this.getData().schema;
    if (!schema) {
      return [];
    }
    return Object.keys(schema)
      .sort((a, b) => schema[a]?.order - schema[b]?.order)
      .filter((key) => schema[key]?.type !== 'string');
  }

  getParameterInfo(key: string): ParameterInfo | undefined {
    if (this.isSupported()) {
      const { title, description } = this.getParameterTitleAndDescription(key);
      const constraint = this.graph.wasm.call((wasm) => wasm.parameterConstraint(this.nodeId, key)) ?? {
        type: 'string',
      };
      return {
        ...constraint,
        title,
        description,
      };
    }

    const schema = this.getData().schema[key];
    let constraint: ParameterConstraint;
    switch (schema.type) {
      case 'number':
        constraint = {
          type: 'float_with_limits',
          min: validateNumber(schema.min) ?? 0.0,
          max: validateNumber(schema.max) ?? 100.0,
        };
        break;
      case 'integer':
        constraint = {
          type: 'integer_with_limits',
          min: validateInteger(schema.min) ?? 0,
          max: validateInteger(schema.max) ?? 100,
        };
        break;
      case 'text':
      case 'string':
        constraint = {
          type: 'string',
        };
        break;
      case 'boolean':
        constraint = {
          type: 'boolean',
        };
        break;
      case 'seed':
        constraint = {
          type: 'seed',
        };
        break;
      case 'input':
      case 'input-integer':
        constraint = {
          type: 'integer',
        };
        break;
      case 'input-number':
      case 'input-float':
        constraint = {
          type: 'float',
        };
        break;
      case 'array':
        constraint = {
          type: 'string_array',
        };
        break;
      case 'enum':
        constraint = {
          type: 'enum',
          options: schema.options ?? [],
        };
        break;
      case 'fal_image_size':
        constraint = {
          type: 'image_size',
          options: schema.options ?? [],
        };
        break;
      case 'file':
        return undefined;
      case undefined:
        return undefined;
      default: {
        const _exhaustiveCheck: never = schema.type;
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        logger.error(`Invalid parameter type: ${schema.type} for node: ${this.nodeId} and key: ${key}`);
        return undefined;
      }
    }

    return {
      ...constraint,
      title: schema.title,
      description: schema.description,
    };
  }

  isParameterExposed(key: string): boolean {
    if (this.isSupported()) {
      return this.graph.wasm.call((wasm) => wasm.isParameterExposed(this.nodeId, key)) ?? false;
    }
    return this.getData().schema[key].exposed ?? false;
  }

  getParameterValue(key: string): ParameterValue | undefined {
    if (this.isSupported()) {
      return this.graph.wasm.call((wasm) => wasm.evaluateParameter(this.nodeId, key));
    }
    const data = this.getData();
    const property = data.schema[key];
    return validateParameterValue(data.params[key], property.default, property);
  }

  async setParameterValue(key: string, newValue: ParameterValue, ongoing: boolean = false) {
    this.graph.edit(() => this.setParameterValueInternal(key, newValue), ongoing);
    await this.graph.updateNodeOutputs(this.nodeId);
  }

  private setParameterValueInternal(key: string, newValue: ParameterValue): UndoRedoEntry {
    let legacyValue: any = newValue.value;
    if (newValue.type === 'image_size') {
      if (newValue.value.type === 'custom') {
        legacyValue = { width: newValue.value.width, height: newValue.value.height };
      } else if (newValue.value.value === 'match_input') {
        legacyValue = null;
      } else {
        legacyValue = newValue.value.value;
      }
    }
    const undoEntry = this.graph.store.updateNodeData<NodeDataWithParams>(this.nodeId, (prevData) => ({
      params: {
        ...prevData.params,
        [key]: legacyValue,
      },
    }));
    if (this.isSupported()) {
      undoEntry.add(this.graph.wasmChange((wasm) => wasm.setParameterValue(this.nodeId, key, newValue)));
    }
    return undoEntry;
  }

  exposeParameter(key: string, nodeTypes: NodeDefinition[]) {
    this.graph.edit(() => {
      const { params, schema } = this.graph.store.getNodeData<NodeDataWithParams>(this.nodeId);
      const undoEntry = UndoRedoEntry.empty();

      if (typeof schema[key] !== 'object') throw new Error(`${key} not present in schema`);
      const propertySchema = schema[key];

      // 1. create and add handle
      undoEntry.add(
        this.graph.addNodeInputHandle(this.nodeId, key, {
          required: propertySchema.required,
          description: propertySchema.description,
          format: propertySchema.type || 'text',
          order: propertySchema.order,
          type: getHandleType(propertySchema.type),
          id: uuidv4(),
        }),
      );

      // 2. create new node with params as values, connect
      const newNodesData = getNodeTemplates(propertySchema.type, params[key], propertySchema);
      if (newNodesData) {
        const originNode = this.graph.store.getNode(this.nodeId);
        const position = {
          x: originNode.position.x - 550,
          y: originNode.position.y + 50,
        };

        const newNode = createNewNode(newNodesData.template.id, nodeTypes, position, newNodesData.template.initialData);
        if (newNode) {
          if (newNode.type === 'muxv2') {
            const newNodeData = newNode.data as NodeDataWithParams;
            newNodeData.schema['options'].exposed = false;
          }
          const sourceHandleId = getHandleId(newNode.id, 'output', newNodesData.handleName);
          const targetHandleId = getHandleId(this.nodeId, 'input', key);

          undoEntry.add(this.graph.addNodes([newNode]));
          void this.graph.updateNodeOutputs(newNode.id, false);
          const newEdge = this.graph.createEdge(newNode.id, this.nodeId, sourceHandleId, targetHandleId);
          undoEntry.add(this.graph.addEdges([newEdge]));
        }
      }

      // 3. disable the property in the dynamic fields
      undoEntry.add(setSchemaFieldExposed(this.graph, this.nodeId, key, true));

      return undoEntry;
    });
  }

  collapseParameter(key: string) {
    this.graph.edit(() => {
      const undoEntry = UndoRedoEntry.empty();

      let value;
      if (this.isSupported()) {
        value = this.graph.wasm.call((wasm) => wasm.evaluateParameter(this.nodeId, key));
      } else {
        value = this.getParameterValue(key);
      }

      // 1. remove connected node if it still exists and has no other connections
      const targetHandleId = getHandleId(this.nodeId, 'input', key);
      const edges = this.graph.store.getEdges();
      const edgeToRemove = edges.find((e) => e.targetHandle === targetHandleId);
      if (edgeToRemove) {
        const nodeToRemove = edgeToRemove.source;
        const nodeHasOtherEdges = edges.some(
          (e) => e.id !== edgeToRemove.id && (e.source === nodeToRemove || e.target === nodeToRemove),
        );
        if (nodeHasOtherEdges) {
          undoEntry.add(this.graph.removeEdges([edgeToRemove.id]));
        } else {
          undoEntry.add(this.graph.removeNodes([nodeToRemove]));
        }
      }

      // 2. remove handle for the property
      undoEntry.add(removeNodeInputHandle(this.graph, this.nodeId, key));

      // 3. enable property in dynamic fields
      undoEntry.add(setSchemaFieldExposed(this.graph, this.nodeId, key, false));

      // 4. set parameter value
      if (value !== undefined) {
        undoEntry.add(this.setParameterValueInternal(key, value));
      }

      return undoEntry;
    });
    void this.graph.updateNodeOutputs(this.nodeId);
  }

  private getParameterTitleAndDescription(parameterKey: string): { title: string; description: string } {
    const nodeType = this.graph.getNodeType(this.nodeId);

    switch (nodeType) {
      case 'custommodelV2': {
        const modelType = this.graph.getModelNodeType(this.nodeId);
        return getParameterTranslation(nodeType, parameterKey, modelType);
      }
      case 'muxv2':
        return getParameterTranslation(nodeType, parameterKey);
    }
    throw new Error(`Invalid parameter ${parameterKey} for node type ${nodeType}`);
  }
}

function getHandleType(type: Schema['type'] | undefined): HandleType {
  switch (type) {
    case 'integer':
    case 'input':
    case 'input-integer':
    case 'input-float':
    case 'input-number':
    case 'number':
      return HandleType.Number;
    case 'string':
    case 'text':
      return HandleType.Text;
    case 'seed':
      return HandleType.Seed;
    case 'array':
      return HandleType.Array;
    case 'enum':
      return HandleType.Text;
    case 'boolean':
      return HandleType.Boolean;
    default: {
      return HandleType.Any;
    }
  }
}

function setSchemaFieldExposed(flowGraph: FlowGraph, nodeId: NodeId, key: string, exposed: boolean): UndoRedoEntry {
  const { schema } = flowGraph.store.getNodeData<NodeDataWithParams>(nodeId);
  return flowGraph.store.updateNodeData<NodeDataWithParams>(nodeId, () => ({
    schema: {
      ...schema,
      [key]: {
        ...schema[key],
        exposed,
      },
    },
  }));
}

function removeNodeInputHandle(flowGraph: FlowGraph, nodeId: NodeId, key: string) {
  return flowGraph.store.updateNodeData(nodeId, (nodeData) => ({
    handles: {
      ...nodeData.handles,
      input: omit(nodeData.handles.input, key),
    },
  }));
}
