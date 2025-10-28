import { InputId, OutputId } from 'web';
import { NodeType } from '@/components/Recipe/FlowGraph';

export interface NodeUI {
  name: string;
  description: string | undefined;
  input: Record<string, NodeParameterUI>;
  output: Record<string, NodeParameterUI>;
}
export interface NodeParameterUI {
  order: number;
  label?: string;
  description?: string;
}

export function getNodeUI(nodeType: NodeType): NodeUI | undefined {
  return nodeUIDefinitions[nodeType];
}

export function getInputHandleUI(nodeType: NodeType, key: InputId): NodeParameterUI | undefined {
  return getNodeUI(nodeType)?.['input'][key];
}

export function getOutputHandleUI(nodeType: NodeType, key: OutputId): NodeParameterUI | undefined {
  return getNodeUI(nodeType)?.['output'][key];
}

const nodeUIDefinitions: Record<string, NodeUI> = {
  compv3: {
    name: 'Compositor',
    description: 'Compose multiple inputs together',
    input: {
      background: { order: 0, label: 'Background' },
      layer_1: { order: 1, label: 'Layer 1' },
      layer_2: { order: 2, label: 'Layer 2' },
      layer_3: { order: 3, label: 'Layer 3' },
      layer_4: { order: 4, label: 'Layer 4' },
      layer_5: { order: 5, label: 'Layer 5' },
      layer_6: { order: 6, label: 'Layer 6' },
      layer_7: { order: 7, label: 'Layer 7' },
      layer_8: { order: 8, label: 'Layer 8' },
      layer_9: { order: 9, label: 'Layer 9' },
      layer_10: { order: 10, label: 'Layer 10' },
    },
    output: { image: { order: 0, label: 'Output' } },
  },
  invert: {
    name: 'Invert',
    description: 'Invert the colors of the input',
    input: { file: { order: 0, label: 'Input' } },
    output: { result: { order: 0, label: 'Output' } },
  },
  channels: {
    name: 'Channels',
    description: 'Extract a channel from the input',
    input: { map: { order: 0, label: 'Input' } },
    output: { matte: { order: 0, label: 'Output' } },
  },
  blur: {
    name: 'Blur',
    description: 'Blur the input',
    input: { file: { order: 0, label: 'Input' } },
    output: { result: { order: 0, label: 'Output' } },
  },
  merge_alpha: {
    name: 'Merge Alpha',
    description: 'Merge the color channels from the input with the alpha channel from the alpha input',
    input: {
      image: { order: 0, label: 'Input', description: 'Supplies the color channels' },
      alpha_image: { order: 1, label: 'Alpha input', description: 'Supplies the alpha channel' },
    },
    output: { image_with_alpha: { order: 0, label: 'Output' } },
  },
  levels: {
    name: 'Levels',
    description: undefined,
    input: { file: { order: 0, label: 'Input' } },
    output: { result: { order: 0, label: 'Output' } },
  },
  dilation_erosion: {
    name: 'Matte grow / shrink',
    description: undefined,
    input: { input: { order: 0, label: 'Input' } },
    output: { result: { order: 0, label: 'Output' } },
  },
  string: {
    name: 'Text',
    description: undefined,
    input: {},
    output: { text: { order: 0, label: 'Text' } },
  },
  import: {
    name: 'Import',
    description: undefined,
    input: {},
    output: {
      file: { order: 0, label: 'File' },
      image: { order: 1, label: 'Render', description: 'An image render of the 3D file' },
    },
  },
  media_iterator: {
    name: 'Image Iterator',
    description: 'Iterate over a list of images',
    input: {},
    output: {
      file: { order: 0, label: 'File' },
    },
  },
  preview: {
    name: 'Preview',
    description: 'Preview the input',
    input: { file: { order: 0, label: 'Input' } },
    output: {},
  },
  extract_video_frame: {
    name: 'Extract Video Frame',
    description: 'Extracts an image for a given frame',
    input: { file: { order: 0, label: 'Video' } },
    output: { result: { order: 0, label: 'Frame' } },
  },
  router: {
    name: 'Router',
    description: 'Route the input to the output',
    input: { in: { order: 0, label: 'Input' } },
    output: { out: { order: 0, label: 'Output' } },
  },
  promptV3: {
    name: 'Prompt',
    description: 'Generate a prompt',
    input: {},
    output: { prompt: { order: 0, label: 'Prompt' } },
  },
  prompt_concat: {
    name: 'Prompt Concatenator',
    description: 'Concatenate multiple prompts together',
    input: { prompt1: { order: 0, label: 'Prompt 1' }, prompt2: { order: 1, label: 'Prompt 2' } },
    output: { prompt: { order: 0, label: 'Combined Prompt' } },
  },
  export: {
    name: 'Export',
    description: 'Export the input',
    input: { file: { order: 0, label: 'Input' } },
    output: {},
  },
  integer: {
    name: 'Number',
    description: 'Create a number',
    input: {},
    output: { number: { order: 0, label: 'Number' } },
  },
  boolean: {
    name: 'Toggle',
    description: undefined,
    input: {},
    output: { option: { order: 0, label: 'Option' } },
  },
  seed: {
    name: 'Seed',
    description: 'Generate a seed',
    input: {},
    output: { seed: { order: 0, label: 'Seed' } },
  },
};
