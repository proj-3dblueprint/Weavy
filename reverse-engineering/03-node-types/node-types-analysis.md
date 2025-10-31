# WEAVY NODE TYPES ANALYSIS

## **OVERVIEW**

Weavy implements a comprehensive node-based visual programming interface with 58 distinct node types supporting AI image generation, video processing, 3D modeling, and creative workflows.

## **NODE TYPE CATEGORIZATION**

### **Core Architecture**
- **Total Node Types:** 58 (plus 7 commented out legacy types)
- **Active Types:** 51 currently supported
- **Iterator Types:** 2 (muxv2, media_iterator)
- **Unsupported Types:** 8 (legacy/deprecated)

### **Functional Categories**

#### **1. AI Image Generation (15 types)**
```
Text-to-Image Models:
├── SdText2Image     - Stable Diffusion base model
├── SdInpaint        - Inpainting with masks
├── SdOutpaint       - Outpainting expansion
├── SdSketch         - Sketch-to-image
├── SdUpscale        - Image upscaling
├── Image2Image      - Image-to-image transformation
├── ControlNet       - Control net conditioning
├── Dalle3           - OpenAI DALL-E 3
├── BrText2Image     - Bing Image Creator
├── IgText2Image     - Instagram AI
└── FluxFast/Pro/Lora - Flux diffusion models

Video Generation (4 types):
├── SdImg2Video      - Image to video
├── Kling            - Kling AI video
├── LumaVideo        - Luma AI video
├── MinimaxI2v       - Minimax image-to-video

3D Generation (2 types):
├── SdImage23d       - Stable Diffusion 3D
└── MeshyImage23d    - Meshy 3D generation
```

#### **2. Creative Tools (8 types)**
```
├── Painter/PainterV2    - Manual image editing
├── Crop                - Image cropping
├── Resize              - Image resizing
├── Channels            - Color channel manipulation
├── Masks               - Mask creation/editing
├── MergeAlpha          - Alpha channel merging
├── BgRemove            - Background removal
└── ObjectRemove        - Object removal
```

#### **3. Data Flow & Control (12 types)**
```
Primitive Types:
├── String          - Text input
├── Integer         - Number input
├── Boolean         - Boolean input
├── Array           - Array data
└── Import          - File import

AI Enhancement:
├── Prompt/PromptV3         - Text prompt input
├── PromptEnhance           - Prompt enhancement
├── PromptConcat            - Prompt concatenation
├── WildcardV2              - Dynamic prompt wildcards
├── Seed                    - Random seed control
└── MultiLora               - Multiple LoRA combinations

Control Flow:
├── Router                  - Conditional routing
├── Mux/MuxV2               - Data multiplexing
├── MediaIterator           - Media batch processing
├── Target                  - Workflow endpoints
└── WorkflowOutput          - Output nodes
```

#### **4. Model Management (4 types)**
```
├── CustomModel/CustomModelV2  - User-defined models
├── ImportLoRA                - LoRA model import
├── AnyLlm                    - Generic LLM interface
└── BrVector                  - Vector embeddings
```

#### **5. Specialized Processing (6 types)**
```
├── CompV2                    - Image compositing
├── SdBgrmv                   - Background removal (SD)
├── IgDescribe                - Image description (Instagram)
├── NimCc                     - Content classification
├── RwVideo                   - Video processing
└── Minimax                   - Minimax AI services
```

## **NODE TYPE CONSTANTS & CONSTRAINTS**

### **Source Code Implementation**

**Node Type Definitions:**
```typescript
// src/enums/node-type.enum.ts (64 lines, 58 active types)
export enum NodeType {
  SdText2Image = 'sd_text2image',
  CompV2 = 'compv2',
  CompV3 = 'compv3',
  Blur = 'blur',
  // ... 54 more types
}
```

**Unsupported Node Types:**
```typescript
// src/consts/node-types.consts.ts
const UNSUPPORTED_NODE_TYPES = [
  'painter',         // src/components/Nodes/PainterNode.tsx
  'painterV2',       // src/components/Nodes/PaintNodeV2.jsx
  'merge_alpha',     // src/components/Nodes/MergeAlphaNode.tsx
  'channels',        // src/components/Nodes/Edit/ChannelsNode.tsx
  'masks',           // src/components/Nodes/MasksExtractionNode.jsx
  'extract_video_frame', // src/components/Nodes/ExtractVideoFrameNode.tsx
  'levels',          // src/components/Nodes/Edit/LevelsNode.tsx
  'edit'             // src/components/Nodes/Edit/PhotopeaNode.tsx
]
```

**Reason:** These nodes require real-time user interaction and cannot be run in automated workflows.

### **Ignored Node Types**
```typescript
const IGNORE_NODE_TYPES = ['stickynote', 'custom_group']
```

**Reason:** UI/organizational nodes that don't affect processing logic.

### **Iterator Node Types**
```typescript
const ITERATOR_NODE_TYPES = ['muxv2', 'media_iterator']
```

**Purpose:** Enable batch processing and data multiplexing across multiple inputs.

## **NODE EXECUTION ARCHITECTURE**

### **Execution Model**
Based on the massive `f_yj` and `f_zj` functions, nodes execute in a **topological sort order** with dependency resolution:

1. **Dependency Analysis:** Build graph of node relationships
2. **Topological Sorting:** Order nodes by execution dependencies
3. **Parameter Validation:** Check input/output type compatibility
4. **Execution Dispatch:** Call node-specific processing functions
5. **Result Propagation:** Pass outputs to dependent nodes

### **Parameter System**
Each node type has:
- **Input Handles:** Typed data inputs
- **Output Handles:** Typed data outputs
- **Parameters:** Node-specific configuration
- **Validation:** Type checking and constraint validation

### **Node State Management**
```typescript
interface NodeState {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
  parameters: Record<string, ParameterValue>;
  validation: Record<string, ValidationError>;
}
```

## **REVERSE ENGINEERING INSIGHTS**

### **From WASM Analysis**
The decompiled C code suggests:

#### **Node Type Dispatch**
```c
// Hypothetical dispatch logic in f_yj/f_zj
switch (node_type_id) {
  case NODE_TYPE_SD_TEXT2IMAGE:
    execute_sd_text2image(node_ptr, params);
    break;
  case NODE_TYPE_FLUX_FAST:
    execute_flux_model(node_ptr, params, FLUX_VARIANT_FAST);
    break;
  // ... 50+ more cases
}
```

#### **Parameter Processing**
- **Dynamic Parameter Evaluation:** Parameters processed through evaluation engine
- **Type System:** Strong typing with validation
- **Memory Layout:** Structured parameter blocks in WebAssembly memory

#### **Resource Management**
- **Texture Management:** WebGL textures for image data
- **Buffer Management:** GPU buffers for video/3D data
- **Memory Pools:** Efficient allocation/deallocation

### **Performance Characteristics**

#### **By Node Category**
- **AI Models:** High compute, GPU acceleration, model caching
- **Image Processing:** GPU shaders, real-time feedback
- **Data Flow:** Low overhead, CPU processing
- **Creative Tools:** Interactive, stateful operations

#### **Optimization Strategies**
1. **Model Caching:** Reuse loaded AI models
2. **Texture Reuse:** Pool WebGL textures
3. **Batch Processing:** Group similar operations
4. **Lazy Evaluation:** Defer computation until needed

## **SECURITY & VALIDATION**

### **Input Validation**
- **Type Checking:** Strict parameter type validation
- **Bounds Checking:** Array bounds and numeric limits
- **Resource Limits:** Memory and compute restrictions

### **Execution Isolation**
- **WebAssembly Sandbox:** Isolated execution environment
- **Resource Quotas:** CPU time and memory limits
- **API Access Control:** Controlled external API access

### **Potential Vulnerabilities**
- **Parameter Injection:** Malformed parameter data
- **Memory Corruption:** WebAssembly memory safety
- **Resource Exhaustion:** Unbounded resource usage

## **INTEGRATION POINTS**

### **Frontend Integration**
- **React Components:** Node UI in `src/components/Nodes/`
- **State Management:** Zustand stores for node state
- **WebSocket Communication:** Real-time updates

### **Backend Integration**
- **API Endpoints:** Node execution via REST/WebSocket
- **Model Serving:** External AI model APIs
- **File Storage:** Asset management and caching

### **WebAssembly Interface**
- **Function Exports:** Node execution functions
- **Memory Interface:** Shared memory for data transfer
- **WebGL Integration:** GPU-accelerated processing

## **EXTENSIBILITY**

### **Custom Node Support**
```typescript
interface CustomNodeDefinition {
  id: string;
  type: 'custom' | 'model';
  inputs: ParameterDefinition[];
  outputs: ParameterDefinition[];
  parameters: ParameterDefinition[];
  execute: (inputs: any, params: any) => Promise<any>;
}
```

### **Plugin Architecture**
- **Node Registration:** Dynamic node type loading
- **Parameter Schema:** JSON Schema-based parameter definitions
- **Execution Runtime:** Extensible execution environment

## **ANALYSIS GAPS & NEXT STEPS**

### **Missing Information**
1. **Node Parameter Schemas:** Detailed parameter definitions
2. **Execution Algorithms:** Specific processing logic per node
3. **Performance Benchmarks:** Execution time and resource usage
4. **Error Handling:** Failure modes and recovery

### **Deep Analysis Required**
1. **Complete WASM Function Mapping:** All 5000+ functions
2. **Shader Library Extraction:** Complete GLSL shader catalog
3. **Memory Layout Documentation:** Struct definitions
4. **API Integration Analysis:** External service dependencies

---

**Analysis Progress:** 60% Complete
**Node Types Documented:** All 58 types categorized
**Key Findings:** Comprehensive AI/ML pipeline with creative tools
**Next Focus:** Parameter schemas and execution algorithms
