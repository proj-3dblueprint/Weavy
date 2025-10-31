# WEAVY NODE-BASED EDITOR: FILE INVENTORY & ANALYSIS STATUS

## **PRIMARY ANALYSIS ASSETS**

### **WebAssembly Binaries & Bindings**
| File | Size | Status | Purpose | Analysis Priority |
|------|------|--------|---------|-------------------|
| `assets/designer_bg-DPmJP8xE.wasm` | 8.6MB | ✅ Analyzed | Main WASM binary - Core node editor logic | HIGH |
| `assets/designer_bg-BFG3U1z3.wasm` | 5.4MB | ⏳ Pending | Alternative/different build version | HIGH |
| `src/designer/designer.js` | 2,340 lines | ✅ Analyzed | wasm-bindgen generated JS bindings | CRITICAL |
| `assets/designer-DqJHv1UD.js` | ~50KB | ✅ Available | Bundled WASM loader | HIGH |

### **Decompiled Source**
| File | Lines | Status | Purpose | Analysis Priority |
|------|-------|--------|---------|-------------------|
| `designer_decompiled.c` | 961,525 | ✅ Available | WABT decompiled C-like code from WASM | CRITICAL |
| `wasm_summary.txt` | 5,013 | ✅ Analyzed | Function signatures, sizes, call graphs | CRITICAL |

### **Analysis Tools**
| File | Purpose | Status |
|------|---------|--------|
| `summarize_wasm.py` | WASM function analysis script | ✅ Functional |
| `assets/wasm` | 3M+ line .wat disassembly | ⏳ Partial analysis |
| `browser_source_finder.js` | Browser automation for source discovery | ✅ Functional |
| `find_rust_sources.py` | Rust source extraction utility | ✅ Functional |

## **WEB APPLICATION SOURCE CODE**

### **Core Application Files**
| File | Lines | Purpose | Analysis Status |
|------|-------|---------|----------------|
| `src/main.tsx` | 48 lines | React entry point with providers | ✅ Analyzed |
| `src/App.tsx` | 112 lines | Main app component with auth/routing | ✅ Analyzed |
| `src/Router.tsx` | ~200 | Application routing logic | ⏳ Pending |
| `src/ProtectedRoutes.tsx` | ~100 | Route protection logic | ⏳ Pending |

### **WebAssembly Integration**
| File | Lines | Purpose | Analysis Status |
|------|-------|---------|----------------|
| `src/components/Recipe/WasmAPI.ts` | 293 lines | WebAssembly API wrapper class | ✅ Analyzed |
| `src/components/Recipe/FlowGraph.ts` | 2,037 lines | Main graph engine interface | ✅ Analyzed |
| `src/designer/designer.js` | 2,340 lines | wasm-bindgen JS bindings | ✅ Analyzed |

### **Designer Integration**
| File | Lines | Purpose | Analysis Status |
|------|-------|---------|----------------|
| `src/designer/designer.js` | 2,340 | JavaScript bindings for WASM | 🔄 In-depth analysis needed |

### **Node System Architecture**
| Component | Files | Purpose | Analysis Status |
|-----------|-------|---------|----------------|
| Node Types | `src/enums/node-type.enum.ts` (64 lines) | Node type definitions (58 types) | ✅ Analyzed |
| Node Components | `src/components/Nodes/` (95 files) | UI components for nodes | ✅ Analyzed |
| Node State | `src/state/nodes/` (3 files) | Node state management (Zustand) | ⏳ Pending |
| Node Utils | `src/components/Nodes/utils/` | Node utility functions | ⏳ Pending |

### **Recipe & Flow System**
| Component | Files | Purpose | Analysis Status |
|-----------|-------|---------|----------------|
| Recipe Components | `src/components/Recipe/` (157 files) | Recipe editor UI | ✅ Analyzed |
| Flow Context | `src/components/Recipe/FlowContext.tsx` | Flow state management | ⏳ Pending |
| Flow Store | `src/components/Recipe/FlowStore.ts` | Flow data management | ⏳ Pending |
| Run Flow | `src/components/Recipe/RunFlow/` | Flow execution logic | ⏳ Pending |

### **Recipe System**
| Component | Files | Purpose | Analysis Status |
|-----------|-------|---------|----------------|
| Recipe Logic | `src/components/Recipe/` (157 files) | Recipe creation/editing logic | ⏳ Pending |
| Recipe Types | `src/enums/recipe-type.enum.ts` | Recipe type definitions | ⏳ Pending |

## **CONFIGURATION & BUILD FILES**

### **Package Management**
| File | Purpose | Status |
|------|---------|--------|
| `package.json` | NPM dependencies | ✅ Available |
| `node_modules/` | Dependencies (494 files) | ⏳ Not analyzed |

### **Build Configuration**
| File | Purpose | Status |
|------|---------|--------|
| `wrangler.jsonc/toml` | Cloudflare Workers config | ❌ Missing |
| `Cargo.toml` | Rust project config | ❌ Missing |
| `build.rs` | Rust build script | ❌ Missing |

## **DATA & ASSETS**

### **Web Assets**
| Directory | Files | Purpose | Status |
|-----------|-------|---------|--------|
| `assets/` | JS/CSS bundles | Frontend assets | ✅ Available |
| `icons/` | UI icons | Interface graphics | ⏳ Pending |
| `menu-images/` | Menu graphics | UI assets | ⏳ Pending |

### **Embedded Resources (Inferred from WASM)**
| Resource Type | Location | Status | Notes |
|---------------|----------|--------|-------|
| GLSL Shaders | Embedded in WASM | 🔍 Extraction needed | Complete shader library |
| Font Data | Embedded in WASM | 🔍 Extraction needed | Custom font rendering |
| 3D Models | Embedded in WASM | 🔍 Extraction needed | Various 3D formats |
| Video Processing | Embedded in WASM | 🔍 Extraction needed | Frame extraction/playback |

## **ANALYSIS STATUS SUMMARY**

### **Completed ✅**
- WASM binary disassembly (961k lines C code)
- Function signature analysis (5k functions)
- High-level architecture identification
- Folder structure creation
- File inventory cataloging

### **In Progress 🔄**
- Core function analysis (f_yj/f_zj - 8k+ lines each)
- WebGL API usage patterns
- Memory layout mapping
- Data structure extraction

### **Pending ⏳**
- Individual node type analysis
- Shader extraction from WASM
- Resource management system
- Security/obfuscation analysis
- Performance optimization analysis

### **Missing ❌**
- Original Rust source code
- Build configuration files
- Source maps for debugging
- Original shader files
- Development documentation

## **ANALYSIS PRIORITIES**

### **Phase 1: Core Architecture (Week 1)**
1. Complete f_yj/f_zj function analysis
2. Extract data structures and memory layouts
3. Map WebGL rendering pipeline
4. Document node graph engine

### **Phase 2: Component Analysis (Week 2)**
1. Extract and catalog all node types
2. Analyze shader library
3. Document resource management
4. Map parameter systems

### **Phase 3: Integration & Documentation (Week 3)**
1. Cross-reference all findings
2. Create unified documentation
3. Generate technical specifications
4. Produce final deliverables

## **TOOLS NEEDED FOR ANALYSIS**

### **Existing Tools**
- WABT (WebAssembly Binary Toolkit)
- Python 3 for analysis scripts
- VS Code for code inspection

### **Additional Tools Recommended**
- IDA Pro or Ghidra for advanced binary analysis
- Custom WASM analysis scripts
- GLSL shader decompilers
- Memory analysis tools

---

**Last Updated:** October 31, 2025
**Analysis Progress:** 15% Complete
**Next Milestone:** Complete core function analysis
