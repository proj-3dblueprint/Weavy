import { HandleType } from '@/enums/handle-type.enum';
import { NodeType } from '@/enums/node-type.enum';
import { FileKind } from '@/designer/designer';
import { color } from '@/colors';
import type {
  Blur,
  Channels,
  Invert,
  Levels,
  ListSelector,
  NumberSelector,
  MergeAlpha,
  NodeId,
  Text,
  Prompt,
  Number,
  ExtractVideoFrame,
  Preview,
  PromptConcatenator,
  StringArray,
  Export,
  Import,
  Toggle,
  Seed,
  Router,
  Resize,
  Crop,
  DilationErosion,
  ParameterConstraint,
  Node as WasmNode,
  MediaIterator,
  Painter,
} from 'web';

export type IteratorRunMode = 'parallel'; // TODO: add other run modes here

export interface IteratorRunModeData {
  runMode: IteratorRunMode;
}

export type IteratorInput = Record<string, { options: string[] | FileKind[] }> & IteratorRunModeData;

export interface BaseNodeData {
  /**
   * @deprecated
   */
  color: string;
  /**
   * @deprecated
   */
  dark_color?: string;
  /**
   * @deprecated
   */
  description: string;
  /**
   * @deprecated
   */
  handles: {
    /**
     * @deprecated
     */
    input: Record<string, Handle> | string[];
    /**
     * @deprecated
     */
    output: Record<string, Handle> | string[];
  };
  /**
   * @deprecated
   */
  initialData?: Record<string, unknown> | null;
  /**
   * @deprecated
   */
  input?: Record<string, any> | any[];
  /**
   * @deprecated
   */
  iteratorInput?: IteratorInput;
  /**
   * @deprecated
   */
  isLocked?: boolean;
  /**
   * @deprecated
   */
  name: string;
  /**
   * @deprecated
   */
  output?: Record<string, any> | any[];
  /**
   * @deprecated
   */
  pastedData?: Record<string, unknown>;
  /**
   * @deprecated
   */
  result?: unknown;
  /**
   * @deprecated
   */
  type: string;
  /**
   * @deprecated
   */
  version?: number;
}

export interface Handle {
  description: string;
  format: HandleFormat;
  label?: string;
  id: string;
  order: number;
  required: boolean;
  type?: HandleType;
}

type HandleFormat = string; // 'uri'  what else?
export type HandleSide = 'source' | 'target';

export interface Node extends Omit<WasmNode, 'kind'> {
  id: NodeId;
  type?: string;
  selected?: boolean;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  data: BaseNodeData;
  createdAt?: string;
  isModel?: boolean;
  parentId?: string;
}

export type EdgeId = string;

export interface Edge {
  id: EdgeId;
  source: NodeId;
  target: NodeId;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  /**
   * @deprecated
   */
  data?: {
    /**
     * @deprecated
     */
    sourceColor?: string;
    /**
     * @deprecated
     */
    targetColor?: string;
    /**
     * @deprecated
     */
    sourceHandleType?: string;
    /**
     * @deprecated
     */
    targetHandleType?: string;
  };
  type?: string;
  selected?: boolean;
}

export interface ImageResult {
  type: 'image';
  width: number;
  height: number;
  url: string;
  id: string | undefined;
}

export interface VideoResult {
  type: 'video';
  url: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  id: string | undefined;
}

export interface CloudinaryVideo extends VideoResult {
  publicId: string;
  transformations?: unknown[];
  // this might be redundant
  cloudinaryType?: 'video';
  suffix?: string;
}

export type ParameterInfo = ParameterConstraint & {
  title: string;
  description: string;
};

export interface Schema extends Record<string, unknown> {
  /**
   * @deprecated
   */
  title: string;
  /**
   * @deprecated
   */
  description: string;
  /**
   * @deprecated
   */
  exposed?: boolean;
  /**
   * @deprecated
   */
  format?: string; //
  /**
   * @deprecated
   */
  order: number;
  /**
   * @deprecated
   */
  required: boolean;
  /**
   * @deprecated
   */
  type:
    | 'integer'
    | 'number'
    | 'string'
    | 'text'
    | 'seed'
    | 'input'
    | 'input-integer'
    | 'input-float'
    | 'input-number'
    | 'array'
    | 'enum'
    | 'boolean'
    | 'fal_image_size'
    | 'file';
  min?: number;
  max?: number;
  options?: string[];
}
// TODO schema subtypes

export type Param = any; // parameter value type, should correspond with schema

export interface NodeDataWithParams extends BaseNodeData {
  /**
   * @deprecated
   */
  schema: Record<string, Schema>;
  /**
   * @deprecated
   */
  params: Record<string, Param>;
}

export type PreviewData = BaseNodeData & Preview;

export type ImportData = BaseNodeData & Import;

export type MediaIteratorData = BaseNodeData & MediaIterator;

export type MergeAlphaData = BaseNodeData & MergeAlpha;

export type InvertData = BaseNodeData & Invert;

export type LevelsData = BaseNodeData & Levels;

export const DEFAULT_LEVELS_DATA: LevelsData = {
  version: 3,
  color: '#000000',
  description: '',
  type: 'levels',
  name: 'Levels',
  handles: {
    input: {
      file: {
        description: 'File',
        type: HandleType.Image,
        format: 'uri',
        order: 0,
        required: true,
        id: 'file',
      },
    },
    output: {
      result: {
        description: 'Result',
        type: HandleType.Image,
        format: 'uri',
        order: 0,
        required: true,
        id: 'result',
      },
    },
  },
  inputNode: undefined,
  options: {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 1, y: 1, z: 1 },
    inverseGamma: { x: 1, y: 1, z: 1 },
  },
};

export type DilationErosionData = BaseNodeData & DilationErosion;

export const DEFAULT_DILATION_EROSION_DATA: DilationErosionData = {
  version: 3,
  color: '#000000',
  description: '',
  type: 'dilation_erosion',
  name: 'Matte grow / shrink',
  handles: {
    input: {
      input: {
        description: 'Input',
        label: 'Input',
        type: HandleType.Mask,
        format: 'uri',
        order: 0,
        required: true,
        id: 'input',
      },
    },
    output: {
      result: {
        description: 'Result',
        label: 'Result',
        type: HandleType.Mask,
        format: 'uri',
        order: 0,
        required: true,
        id: 'result',
      },
    },
  },
  inputNode: undefined,
  size: 1,
};

export type ResizeData = BaseNodeData & Resize;

export type PainterData = BaseNodeData & Painter;

export type ExtractVideoFrameData = BaseNodeData & ExtractVideoFrame;

export type ChannelsData = BaseNodeData & Channels;

export type BlurData = BaseNodeData & Blur;

export type TextData = BaseNodeData & Text;

export type NumberData = BaseNodeData & Number;

export type PromptData = BaseNodeData & Prompt;

export type PromptConcatenatorData = BaseNodeData & PromptConcatenator;

export type ListSelectorData = BaseNodeData &
  ListSelector & { schema?: { options: Schema }; params?: { options: string[] } };

export const DEFAULT_LIST_SELECTOR_ITERATOR_DATA: ListSelectorData = {
  version: 3,
  description: 'Iterate over a list of text values',
  type: 'list_selector',
  name: 'Text Iterator',
  handles: {
    input: {
      options: {
        id: 'd83d338b-f6c1-4ff2-a160-e81d918995fc',
        type: HandleType.Array,
        label: 'Array',
        format: 'array',
        required: false,
        order: 0,
        description: 'Array of elements to populate the iterator',
      },
    },
    output: {
      option: {
        id: 'xK9mP2vR8nL4jH7tF5wQ123',
        type: HandleType.Text,
        label: 'Text',
        order: 0,
        format: 'text',
        description: 'Iterator item',
        required: false,
      },
    },
  },
  options: {
    type: 'input',
    data: undefined,
  },
  selected: 0,
  schema: {
    options: {
      order: 0,
      type: 'array',
      title: 'Options',
      exposed: true,
      required: false,
      description: 'Array of elements to populate the list',
    },
  },
  isIterator: true,
  color: '#000000',
};

export const DEFAULT_IMAGE_ITERATOR_DATA: MediaIteratorData = {
  version: 3,
  description: 'Iterate over a list of images',
  type: 'media_iterator',
  name: 'Image Iterator',
  handles: {
    input: {},
    output: {
      file: {
        id: 'image-iterator-output',
        type: HandleType.Image,
        label: 'Image',
        order: 0,
        format: 'uri',
        description: 'The selected image',
        required: false,
      },
    },
  },
  color: '#000000',
  files: { type: 'value', data: { type: 'file_array', value: [] } },
  selectedIndex: 0,
};

export const DEFAULT_LIST_SELECTOR_DATA: ListSelectorData = {
  version: 3,
  description: 'Select an option from a list',
  type: 'list_selector',
  name: 'List',
  handles: {
    input: {
      options: {
        id: 'd83d338b-f6c1-4ff2-a160-e81d918995fc',
        type: HandleType.Array,
        label: 'Options',
        format: 'array',
        required: false,
        order: 0,
        description: 'Array of options to choose from',
      },
    },
    output: {
      option: {
        id: 'xK9mP2vR8nL4jH7tF5wQ123',
        type: HandleType.Text,
        label: 'Text',
        order: 0,
        format: 'text',
        description: 'The selected option',
        required: false,
      },
    },
  },
  options: {
    type: 'input',
    data: undefined,
  },
  selected: 0,
  schema: {
    options: {
      order: 0,
      type: 'array',
      title: 'Options',
      exposed: true,
      required: false,
      description: 'Array of options to choose from',
    },
  },
  isIterator: false,
  color: 'Yambo_Green',
};

export type NumberSelectorData = BaseNodeData & NumberSelector & { schema: { options: Schema } };

export const DEFAULT_NUMBER_SELECTOR_DATA: NumberSelectorData = {
  version: 3,
  color: '#000000',
  description: '',
  type: 'number_selector',
  name: 'Number Selector',
  handles: {
    input: {
      options: {
        description: 'Array of numbers to populate the list',
        type: HandleType.Array,
        label: 'Array',
        format: 'array',
        order: 0,
        required: false,
        id: 'array',
      },
    },
    output: {
      option: {
        id: 'xK9mP2vR8nL4jH7tF5wQ123',
        description: 'The selected option',
        type: HandleType.Number,
        order: 0,
        format: 'text',
        required: false,
      },
    },
  },
  selected: undefined,
  params: { options: [] },
  schema: {
    options: {
      order: 0,
      type: 'array',
      title: 'Options',
      exposed: false,
      required: false,
      description: 'Array of elements to populate the list',
    },
  },
  inputNode: undefined,
};

export type CustomGroupData = BaseNodeData & { width: number; height: number; labelFontSize?: number };

export const DEFAULT_CUSTOM_GROUP_DATA: CustomGroupData = {
  version: 3,
  color: color.Purple64_T,
  description: 'Group of nodes',
  type: NodeType.CustomGroup,
  name: 'Custom Group',
  handles: { input: [], output: [] },
  width: 400,
  height: 500,
  labelFontSize: 16,
};

export type StringArrayData = BaseNodeData & StringArray & { result?: string[]; placeholder?: string };

export type CropData = BaseNodeData & Crop;

type LoRA = {
  id: string;
  name: string;
  file?: string;
  coverImage: string;
  defaultWeight: number;
  trigger: string;
  url?: string;
};

export interface MultiLoRACoreData extends BaseNodeData {
  selectedLora: LoRA | null;
  weight: number;
  loras: LoRA[];
  minWeight: number;
  maxWeight: number;
  stepWeight: number;
}

export type ExportData = BaseNodeData & Export;

export type ToggleData = BaseNodeData & Toggle;

export type SeedData = BaseNodeData & Seed;

export type RouterData = BaseNodeData & Router;
