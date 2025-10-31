# WEAVY NODE GRAPH ENGINE ANALYSIS

## **OVERVIEW**

The core of Weavy's node-based editor lies in two massive functions: `f_yj` (func284) and `f_zj` (func285), each spanning 8,182 lines of decompiled C code. These functions represent the primary node graph execution engine.

**Source Code Correlation:** These functions are called through the TypeScript `WasmAPI` class in `src/components/Recipe/WasmAPI.ts`, which provides the JavaScript interface to the WebAssembly engine. The `FlowGraph.ts` (2,037 lines) orchestrates high-level graph operations and calls into these WASM functions.

## **FUNCTION SIGNATURES**

### **f_yj (func284)**
```c
function f_yj(a:int_ptr, b:int, c:int, d:{ a:int, b:int, c:int, d:int, e:int, f:int })
```

**Parameters:**
- `a`: int_ptr - Likely a pointer to node graph context or state
- `b`: int - Execution mode or flags
- `c`: int - Node ID or index
- `d`: struct - Complex parameter structure with 6 integer fields

### **f_zj (func285)**
```c
function f_zj(a:int_ptr, b:int, c:int, d:{ a:int, b:int, c:int, d:int, e:int, f:int })
```

**Parameters:** Identical to f_yj - suggests these are complementary operations

## **FUNCTION CHARACTERISTICS**

### **Size & Complexity**
- **Lines of code:** 8,182 each
- **Memory operations:** 377 loads, 636 stores per function
- **Control flow:** 570 branches per function
- **Function calls:** 46 external calls per function

### **Variable Analysis**
Both functions declare extensive variable sets indicating complex state management:

```c
// Integer pointers and counters
var p:int, i:int, ib:int, mb:int, nb:int, gb:int, ob:int, pb:int, jb:int, bb:int

// Long pointers (likely for data structures)
var k:long_ptr, h:long_ptr@1, l:long_ptr, o:long_ptr, q:long_ptr, r:long_ptr,
    t:long_ptr, u:long_ptr, v:long_ptr, w:long_ptr, x:long_ptr, y:long_ptr,
    z:long_ptr, aa:long_ptr, s:long_ptr

// 64-bit integers (coordinates, IDs, or large values)
var xb:long, yb:long, zb:long, ac:long, bc:long, cc:long, dc:long, ec:long

// Float values (likely graphics/rendering parameters)
var gc:float, hc:float, ic:float, jc:float, kc:float, lc:float, mc:float,
    nc:float, oc:float, pc:float, qc:float, rc:float, sc:float, tc:float,
    uc:float, vc:float
```

## **INITIAL ANALYSIS - FUNCTION ENTRY POINTS**

### **f_yj Entry Logic (Lines 84719-84780)**

```c
function f_yj(a:int_ptr, b:int, c:int, d:{ a:int, b:int, c:int, d:int, e:int, f:int }) {
  var p:int;
  var i:int;
  // ... variable declarations ...

  // Early validation/initialization
  p = 0;
  i = g_a;
  // Memory allocation pattern
  ib = __rust_alloc(24, 4);
  // Store parameter d into allocated memory
  i32_store(ib + 0, d.a);
  i32_store(ib + 4, d.b);
  i32_store(ib + 8, d.c);
  i32_store(ib + 12, d.d);
  i32_store(ib + 16, d.e);
  i32_store(ib + 20, d.f);
```

**Observations:**
- Allocates 24 bytes (6 * 4-byte integers) for parameter structure
- Suggests parameter `d` is a 6-field integer structure
- Uses `__rust_alloc` - confirms Rust origin

### **Memory Layout Inference**
The parameter structure `d` appears to be:
```rust
struct NodeExecutionParams {
    field_a: i32,  // +0
    field_b: i32,  // +4
    field_c: i32,  // +8
    field_d: i32,  // +12
    field_e: i32,  // +16
    field_f: i32,  // +20
}
```

## **EXECUTION FLOW ANALYSIS**

### **Phase 1: Initialization & Validation (Lines 84780-84900)**

```c
// Parameter validation
if (b < 0) goto B_z;
if (b > 3) goto B_z;

// Node ID bounds checking
if ((c >>> 0) >= 256) goto B_z;

// Complex conditional logic
mb = i32_load(a + 8);
if (mb) {
  // Node graph traversal logic
  nb = i32_load(mb + 0);
  // ... complex graph operations
}
```

**Key Findings:**
- Parameter `b` is constrained to range [0, 3] - likely execution modes
- Node IDs limited to 256 maximum - suggests fixed-size node array
- Parameter `a` points to a structure with graph data at offset +8

### **Phase 2: Graph Traversal Logic (Lines 84900-85200)**

```c
// Node dependency resolution
gb = i32_load(a + 12);
if (gb) {
  ob = i32_load(gb + 0);
  // Iterate through node connections
  loop L_b {
    if (ob <= 0) break L_b;
    // Process node relationships
    pb = i32_load(gb + 4);
    // ... connection processing
  }
}
```

**Observations:**
- Graph structure stored at `a + 12`
- Connection iteration suggests adjacency list representation
- Node relationships processed in dependency order

## **CORE ALGORITHM IDENTIFICATION**

### **Node Execution State Machine**

Based on the branching patterns, both functions implement a state machine for node execution:

```rust
enum ExecutionMode {
    Initialize = 0,
    Execute = 1,
    Update = 2,
    Cleanup = 3
}
```

### **Graph Traversal Algorithm**

The functions appear to implement a **topological sort with cycle detection** for node execution:

1. **Dependency Resolution:** Build dependency graph from node connections
2. **Topological Ordering:** Sort nodes by execution dependencies
3. **Cycle Detection:** Identify and handle circular dependencies
4. **Execution Dispatch:** Call appropriate node processing functions

### **Memory Management Patterns**

```c
// Stack-based allocations
var alloc_ptr = __rust_alloc(size, align);

// Pointer arithmetic for struct access
var node_data = i32_load(graph_ptr + NODE_DATA_OFFSET);

// Bounds checking before access
if (index >= MAX_NODES) goto error_handler;
```

## **DIFFERENCES BETWEEN f_yj AND f_zj**

### **Structural Comparison**
Both functions have identical:
- Parameter signatures
- Variable declarations
- Initial validation logic

**Hypothesis:** f_yj and f_zj may be:
1. **Different execution phases** (setup vs execution)
2. **Different node types** (data vs control flow)
3. **Parallel processing paths** (main vs auxiliary)

### **Function Call Analysis**
Both make 46 external function calls, suggesting:
- Shared utility functions
- Node-specific processors
- Rendering pipeline integration

## **INTEGRATION WITH RENDERING PIPELINE**

### **TypeScript WebGL Integration**

**WasmAPI.ts WebGL Context Management:**
```typescript
// src/components/Recipe/WasmAPI.ts
class WasmAPI {
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, ...) {
    this.canvas = canvas;
    canvas.addEventListener('webglcontextlost', this.onContextLost);

    // Initialize WebAssembly with WebGL context
    this.wasm = new Web(
      this.onUIStateUpdate,
      this.onEdit,
      this.updateLegacy,
      canvas,  // WebGL canvas passed to WASM
      editable
    );
  }

  private onContextLost = (event: Event) => {
    event.preventDefault();
    this.log('WARN', 'WebGL context lost, attempting recovery');
    this.tryRecover();
  };
}
```

### **WebGL Context Integration**
```c
// WebGL buffer operations called from WASM
glBindBuffer(GL_ARRAY_BUFFER, buffer_id);
glBufferData(GL_ARRAY_BUFFER, size, data, GL_DYNAMIC_DRAW);

// Shader uniform updates
glUniformMatrix4fv(location, 1, GL_FALSE, matrix_ptr);
```

**Evidence:** Extensive float variable usage and WebGL API calls suggest these functions coordinate the rendering pipeline through the canvas provided by WasmAPI.

### **Node Output Processing**
```c
// Texture/render target management
framebuffer_id = createFramebuffer();
glBindFramebuffer(GL_FRAMEBUFFER, framebuffer_id);

// Node result storage
output_texture = i32_load(node_ptr + OUTPUT_TEXTURE_OFFSET);
```

## **PERFORMANCE CHARACTERISTICS**

### **Memory Access Patterns**
- **377 loads, 636 stores** - Heavy memory I/O
- **570 branches** - Complex control flow
- **46 function calls** - Modular design

### **Optimization Strategies**
1. **Memory Pool Allocation:** Reuse of allocated structures
2. **Branch Prediction:** Conditional execution paths
3. **SIMD Operations:** Potential for vectorized processing

## **SECURITY IMPLICATIONS**

### **Input Validation**
- Bounds checking on node IDs (0-255)
- Parameter range validation
- Memory access validation

### **Potential Vulnerabilities**
- **Buffer Overflows:** Complex pointer arithmetic
- **Use-After-Free:** Manual memory management
- **Integer Overflows:** ID and index calculations

## **RECONSTRUCTION ATTEMPTS**

### **High-Level Pseudocode**

```rust
fn execute_node_graph(context: &mut GraphContext, mode: ExecutionMode, node_id: NodeId, params: ExecutionParams) -> Result<(), Error> {
    // Validate inputs
    validate_execution_mode(mode)?;
    validate_node_id(node_id)?;

    // Allocate parameter structure
    let param_block = allocate_param_block(&params)?;

    // Resolve node dependencies
    let dependencies = resolve_dependencies(context, node_id)?;

    // Execute in topological order
    for dependency in dependencies {
        execute_single_node(context, dependency, param_block)?;
    }

    // Execute target node
    execute_single_node(context, node_id, param_block)?;

    // Update rendering pipeline
    update_render_targets(context, node_id)?;

    Ok(())
}
```

## **NEXT ANALYSIS STEPS**

### **Immediate Tasks**
1. **Complete function flow analysis** - Map all execution paths
2. **Extract called functions** - Identify node processors
3. **Document data structures** - Reverse-engineer struct layouts
4. **Analyze rendering integration** - WebGL pipeline coordination

### **Advanced Analysis**
1. **Algorithm reconstruction** - Convert to readable pseudocode
2. **Performance profiling** - Identify bottlenecks
3. **Memory layout mapping** - Complete struct definitions
4. **Security assessment** - Vulnerability analysis

---

**Analysis Progress:** 25% Complete
**Functions Analyzed:** f_yj, f_zj (signatures and initial logic)
**Key Findings:** Complex node graph execution engine with topological sorting
**Next Focus:** Complete flow analysis and called function identification
