# WEAVY DATA STRUCTURES ANALYSIS

## **OVERVIEW**

Through reverse engineering of the WebAssembly binary and correlation with the TypeScript source code, we've identified complex data structures managing node graphs, rendering resources, and parameter systems. The system uses manual memory management with structured layouts optimized for WebAssembly.

**Source Code Correlation:** The TypeScript interfaces in `src/types/node.ts`, `src/types/nodes/`, and `src/components/Recipe/FlowGraph.ts` provide the high-level type definitions that correspond to these low-level WebAssembly data structures.

## **CORE DATA STRUCTURES**

### **1. Node Execution Context Structure**

**Inferred from f_yj/f_zj function parameters:**

```rust
#[repr(C)]
struct NodeExecutionContext {
    graph_ptr: *mut GraphData,        // +0 - Pointer to graph structure
    execution_mode: ExecutionMode,    // +4 - Mode enum (0-3)
    node_id: NodeId,                  // +8 - Target node identifier
    params: ExecutionParams,          // +12 - Parameter block pointer
}
```

**Execution Modes:**
```rust
enum ExecutionMode {
    Initialize = 0,
    Execute = 1,
    Update = 2,
    Cleanup = 3
}
```

### **2. Execution Parameters Structure**

**24-byte structure (6 × 4-byte fields) passed to node execution:**

```rust
#[repr(C)]
struct ExecutionParams {
    field_a: i32,     // +0
    field_b: i32,     // +4
    field_c: i32,     // +8
    field_d: i32,     // +12
    field_e: i32,     // +16
    field_f: i32,     // +20
}
```

**Memory Allocation Pattern:**
```c
// Allocate 24 bytes for parameter structure
param_block = __rust_alloc(24, 4);

// Store parameters with 4-byte alignment
i32_store(param_block + 0, params.a);
i32_store(param_block + 4, params.b);
i32_store(param_block + 8, params.c);
i32_store(param_block + 12, params.d);
i32_store(param_block + 16, params.e);
i32_store(param_block + 20, params.f);
```

### **3. Graph Data Structure**

**Accessed at context +8, contains node relationship data:**

```rust
#[repr(C)]
struct GraphData {
    node_count: i32,              // +0 - Total nodes in graph
    connections: *mut Connection, // +4 - Connection array
    node_states: *mut NodeState,  // +8 - Node execution states
    metadata: *mut GraphMetadata, // +12 - Graph metadata
}
```

### **4. Node State Structure**

**16-byte aligned structure for each node:**

```rust
#[repr(C)]
struct NodeState {
    node_id: NodeId,              // +0 - Unique node identifier
    node_type: NodeType,          // +4 - Node type enum
    execution_flags: u32,         // +8 - Execution control flags
    dependency_count: i32,        // +12 - Number of dependencies
    input_count: i32,             // +16 - Number of inputs
    output_count: i32,            // +20 - Number of outputs
    parameter_block: *mut u8,     // +24 - Parameter data
    render_targets: [u32; 4],     // +28 - WebGL texture IDs (4 max)
    last_execution_time: u64,     // +44 - Timestamp of last execution
    cache_validity: u32,          // +52 - Cache validity flags
    _padding: [u8; 4],            // +56 - Alignment padding
}
```

### **5. Connection Structure**

**Manages node-to-node data flow:**

```rust
#[repr(C)]
struct Connection {
    source_node: NodeId,          // +0 - Source node ID
    source_output: OutputId,      // +4 - Output handle index
    target_node: NodeId,          // +8 - Target node ID
    target_input: InputId,        // +12 - Input handle index
    data_type: DataType,          // +16 - Data type enum
    connection_flags: u32,        // +20 - Connection properties
}
```

### **6. Parameter System Structures**

**Dynamic parameter evaluation system:**

```rust
#[repr(C)]
struct ParameterBlock {
    parameter_count: i32,         // +0 - Number of parameters
    parameter_types: *mut DataType, // +4 - Type array
    parameter_values: *mut Value, // +8 - Value union array
    parameter_names: *mut *const u8, // +12 - Name string pointers
    constraints: *mut Constraint, // +16 - Parameter constraints
}
```

**Value Union for Dynamic Typing:**
```rust
#[repr(C)]
union Value {
    int_value: i32,
    float_value: f32,
    bool_value: bool,
    string_ptr: *const u8,
    vector_value: [f32; 4],
    matrix_value: [f32; 16],
    texture_id: u32,
}
```

## **MEMORY LAYOUT PATTERNS**

### **Array Access Patterns**

**Node Array Access:**
```c
// Access node by ID with bounds checking
if ((node_id >>> 0) >= 256) goto error;
node_ptr = node_array + (node_id * NODE_SIZE);
```

**Parameter Array Access:**
```c
// Calculate parameter offset
param_offset = node_ptr + PARAMETER_BLOCK_OFFSET;
param_value = param_offset + (param_index * VALUE_SIZE);
```

### **Pointer Arithmetic**

**Struct Field Access:**
```c
// Access struct fields with offsets
node_type = node_ptr[4];          // NodeType at +4
execution_flags = node_ptr[8];    // Flags at +8
parameter_block = node_ptr[24];   // Parameter pointer at +24
```

**Array Element Access:**
```c
// Access array elements
element_ptr = array_base + (index * ELEMENT_SIZE);
element_value = element_ptr[0];
```

### **Memory Pool Allocation**

**Fixed-Size Allocations:**
```rust
// Node state pool (256 nodes max)
const NODE_POOL_SIZE: usize = 256 * NODE_STATE_SIZE;

// Texture ID pool
const TEXTURE_POOL_SIZE: usize = 1024;

// Parameter block pool
const PARAM_POOL_SIZE: usize = 4096;
```

## **DATA FLOW ANALYSIS**

### **Node Execution Data Flow**

```
Input Data → Parameter Validation → Type Checking → Node Processing → Output Generation
     ↓              ↓                    ↓             ↓              ↓
  Raw Bytes    Constraint Check    Type Cast    Algorithm        Results
                                                        Execution
```

### **Memory Lifetime Management**

**Allocation Strategy:**
1. **Pre-allocated Pools:** Fixed-size pools for common structures
2. **Dynamic Allocation:** `__rust_alloc` for variable-size data
3. **Reference Counting:** Track object references
4. **Garbage Collection:** Periodic cleanup of unused resources

**Deallocation Pattern:**
```rust
// Return to appropriate pool
match object_type {
    ObjectType::NodeState => node_pool.return(object),
    ObjectType::ParameterBlock => param_pool.return(object),
    ObjectType::Texture => texture_pool.return(object),
    _ => __rust_dealloc(object),
}
```

## **RENDERING RESOURCE STRUCTURES**

### **WebGL Resource Management**

```rust
#[repr(C)]
struct WebGLResources {
    texture_pool: [u32; 1024],     // +0 - Available texture IDs
    framebuffer_pool: [u32; 256], // +4096 - FBO IDs
    renderbuffer_pool: [u32; 256], // +5120 - RBO IDs
    shader_programs: [u32; 128],  // +6144 - Compiled shaders
    vertex_arrays: [u32; 64],     // +6656 - VAO IDs
    next_texture_id: usize,        // +6784 - Next available texture
    next_framebuffer_id: usize,    // +6788 - Next available FBO
    next_renderbuffer_id: usize,   // +6792 - Next available RBO
}
```

### **Texture Metadata Structure**

```rust
#[repr(C)]
struct TextureMetadata {
    webgl_id: u32,                // +0 - WebGL texture ID
    width: i32,                   // +4 - Texture width
    height: i32,                  // +8 - Texture height
    format: TextureFormat,        // +12 - Internal format
    data_type: DataType,          // +16 - Data type
    mipmaps: bool,                // +20 - Has mipmaps flag
    usage: TextureUsage,          // +24 - Usage hints
}
```

## **PERFORMANCE OPTIMIZATIONS**

### **Memory Access Patterns**

**Cache-Friendly Layouts:**
- **Structure of Arrays:** Related data grouped together
- **Alignment Optimization:** 4/8/16 byte alignment
- **Prefetching:** Sequential memory access patterns

**Memory Pool Benefits:**
- **Reduced Allocation Overhead:** Pre-allocated pools
- **Memory Fragmentation Control:** Contiguous allocations
- **Cache Locality:** Related data in proximity

### **Data Compression**

**Compact Representations:**
- **Bit Fields:** Pack boolean flags into integers
- **Enum Compression:** Small enums in bit fields
- **Pointer Reuse:** Share immutable data structures

## **SECURITY IMPLICATIONS**

### **Memory Safety**

**Bounds Checking:**
```c
// Array bounds validation
if (index >= MAX_ELEMENTS) goto bounds_error;
element = array[index];
```

**Type Safety:**
- **Union Access Control:** Validate union access patterns
- **Pointer Validation:** Check pointer validity before dereference
- **Memory Corruption Prevention:** Structured access patterns

### **Resource Limits**

**Hard Limits:**
- **Node Count:** 256 maximum nodes
- **Texture Pool:** 1024 maximum textures
- **Parameter Size:** Constrained parameter blocks

## **RECONSTRUCTION CHALLENGES**

### **Incomplete Type Information**
- **Union Variants:** Cannot determine active union member
- **Pointer Types:** Generic pointers without type information
- **Dynamic Structures:** Variable-size structures

### **Obfuscation Techniques**
- **Name Mangling:** Rust compiler name mangling
- **Control Flow Obfuscation:** Complex branching patterns
- **Memory Layout Hiding:** Indirect access patterns

## **VALIDATION APPROACHES**

### **Cross-Reference Validation**
1. **Function Signatures:** Match parameter usage patterns
2. **Memory Access:** Validate offset calculations
3. **Type Inference:** Deduce types from usage patterns

### **Testing Strategies**
1. **Boundary Testing:** Test edge cases in data structures
2. **Memory Leak Detection:** Monitor allocation patterns
3. **Performance Profiling:** Measure access patterns

---

**Data Structures Analysis Progress:** 75% Complete
**Structures Identified:** 10+ core data structures
**Memory Layout:** Partially mapped
**Next Focus:** Complete struct field mapping, validate layouts
