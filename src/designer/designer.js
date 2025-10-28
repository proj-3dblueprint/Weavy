let wasm;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    }
}

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_4.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedFloat32ArrayMemory0 = null;

function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

let cachedInt32ArrayMemory0 = null;

function getInt32ArrayMemory0() {
    if (cachedInt32ArrayMemory0 === null || cachedInt32ArrayMemory0.byteLength === 0) {
        cachedInt32ArrayMemory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32ArrayMemory0;
}

function getArrayI32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

let cachedUint32ArrayMemory0 = null;

function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

let cachedUint16ArrayMemory0 = null;

function getUint16ArrayMemory0() {
    if (cachedUint16ArrayMemory0 === null || cachedUint16ArrayMemory0.byteLength === 0) {
        cachedUint16ArrayMemory0 = new Uint16Array(wasm.memory.buffer);
    }
    return cachedUint16ArrayMemory0;
}

function getArrayU16FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint16ArrayMemory0().subarray(ptr / 2, ptr / 2 + len);
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(
state => {
    wasm.__wbindgen_export_5.get(state.dtor)(state.a, state.b);
}
);

function makeClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        try {
            return f(state.a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_5.get(state.dtor)(state.a, state.b); state.a = 0;
                CLOSURE_DTORS.unregister(state);
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

let cachedInt16ArrayMemory0 = null;

function getInt16ArrayMemory0() {
    if (cachedInt16ArrayMemory0 === null || cachedInt16ArrayMemory0.byteLength === 0) {
        cachedInt16ArrayMemory0 = new Int16Array(wasm.memory.buffer);
    }
    return cachedInt16ArrayMemory0;
}

function getArrayI16FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt16ArrayMemory0().subarray(ptr / 2, ptr / 2 + len);
}

let cachedInt8ArrayMemory0 = null;

function getInt8ArrayMemory0() {
    if (cachedInt8ArrayMemory0 === null || cachedInt8ArrayMemory0.byteLength === 0) {
        cachedInt8ArrayMemory0 = new Int8Array(wasm.memory.buffer);
    }
    return cachedInt8ArrayMemory0;
}

function getArrayI8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_4.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_export_4.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    for (let i = 0; i < array.length; i++) {
        const add = addToExternrefTable0(array[i]);
        getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}
/**
 * @param {Function} logger
 */
export function setLogger(logger) {
    wasm.setLogger(logger);
}

export function start() {
    wasm.start();
}

function __wbg_adapter_18(arg0, arg1) {
    wasm.wasm_bindgen__convert__closures_____invoke__h8a38d2e62f81e5ee(arg0, arg1);
}

const WebFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_web_free(ptr >>> 0, 1));

export class Web {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WebFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_web_free(ptr, 0);
    }
    /**
     * @param {Function} notify_ui_state_update
     * @param {Function} notify_edit
     * @param {Function} notify_legacy
     * @param {HTMLCanvasElement} canvas
     * @param {boolean} editable
     */
    constructor(notify_ui_state_update, notify_edit, notify_legacy, canvas, editable) {
        const ret = wasm.web_new(notify_ui_state_update, notify_edit, notify_legacy, canvas, editable);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        WebFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {NodeId} nodeId
     */
    enableNodeEditor(nodeId) {
        wasm.web_enableNodeEditor(this.__wbg_ptr, nodeId);
    }
    disableNodeEditor() {
        wasm.web_disableNodeEditor(this.__wbg_ptr);
    }
    /**
     * @param {NodeId} nodeId
     * @param {number} index
     * @param {HTMLCanvasElement | null} [canvas]
     */
    setNodeCanvas(nodeId, index, canvas) {
        wasm.web_setNodeCanvas(this.__wbg_ptr, nodeId, index, isLikeNone(canvas) ? 0 : addToExternrefTable0(canvas));
    }
    redraw() {
        wasm.web_redraw(this.__wbg_ptr);
    }
    /**
     * @param {string} resourceKey
     * @param {HTMLImageElement} imageElement
     */
    addImageResource(resourceKey, imageElement) {
        const ptr0 = passStringToWasm0(resourceKey, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.web_addImageResource(this.__wbg_ptr, ptr0, len0, imageElement);
    }
    /**
     * @param {string} resourceKey
     * @param {HTMLVideoElement} videoElement
     * @param {boolean} hasAudio
     */
    addVideoResource(resourceKey, videoElement, hasAudio) {
        const ptr0 = passStringToWasm0(resourceKey, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.web_addVideoResource(this.__wbg_ptr, ptr0, len0, videoElement, hasAudio);
    }
    /**
     * @param {string} resourceKey
     * @param {Uint8Array} modelBytes
     */
    addThreeDModelResource(resourceKey, modelBytes) {
        const ptr0 = passStringToWasm0(resourceKey, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(modelBytes, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.web_addThreeDModelResource(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {string} resourceKey
     * @param {Uint8Array} fontBytes
     */
    addFontResource(resourceKey, fontBytes) {
        const ptr0 = passStringToWasm0(resourceKey, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(fontBytes, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.web_addFontResource(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    update() {
        wasm.web_update(this.__wbg_ptr);
    }
    /**
     * @param {NodeId} nodeId
     */
    zoomToFit(nodeId) {
        wasm.web_zoomToFit(this.__wbg_ptr, nodeId);
    }
    /**
     * @param {NodeId} nodeId
     * @param {number} zoomLevel
     */
    setZoomLevel(nodeId, zoomLevel) {
        wasm.web_setZoomLevel(this.__wbg_ptr, nodeId, zoomLevel);
    }
    /**
     * @param {Graph} graph
     * @returns {Edit}
     */
    importGraph(graph) {
        const ret = wasm.web_importGraph(this.__wbg_ptr, graph);
        return ret;
    }
    /**
     * @returns {string[]}
     */
    imagesToLoad() {
        const ret = wasm.web_imagesToLoad(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {string[]}
     */
    videosToLoad() {
        const ret = wasm.web_videosToLoad(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {string[]}
     */
    threeDModelsToLoad() {
        const ret = wasm.web_threeDModelsToLoad(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {string[]}
     */
    fontsToLoad() {
        const ret = wasm.web_fontsToLoad(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {FontOptions} font
     * @returns {Uint16Array}
     */
    weightSupport(font) {
        const ret = wasm.web_weightSupport(this.__wbg_ptr, font);
        var v1 = getArrayU16FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 2, 2);
        return v1;
    }
    /**
     * @param {FontOptions} font
     * @returns {Uint8Array}
     */
    italicSupport(font) {
        const ret = wasm.web_italicSupport(this.__wbg_ptr, font);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {NodeId} nodeId
     * @param {string} parameter_id
     * @param {ParameterValue} value
     * @returns {Edit}
     */
    setParameterValue(nodeId, parameter_id, value) {
        const ptr0 = passStringToWasm0(parameter_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.web_setParameterValue(this.__wbg_ptr, nodeId, ptr0, len0, value);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {string} parameterId
     * @returns {ParameterValue | undefined}
     */
    evaluateParameter(nodeId, parameterId) {
        const ptr0 = passStringToWasm0(parameterId, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.web_evaluateParameter(this.__wbg_ptr, nodeId, ptr0, len0);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @returns {string[]}
     */
    parameterIds(nodeId) {
        const ret = wasm.web_parameterIds(this.__wbg_ptr, nodeId);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {NodeId} nodeId
     * @param {string} parameterId
     * @returns {boolean}
     */
    isParameterExposed(nodeId, parameterId) {
        const ptr0 = passStringToWasm0(parameterId, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.web_isParameterExposed(this.__wbg_ptr, nodeId, ptr0, len0);
        return ret !== 0;
    }
    /**
     * @param {NodeId} nodeId
     * @param {string} parameterId
     * @returns {ParameterConstraint | undefined}
     */
    parameterConstraint(nodeId, parameterId) {
        const ptr0 = passStringToWasm0(parameterId, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.web_parameterConstraint(this.__wbg_ptr, nodeId, ptr0, len0);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {number} time
     * @param {boolean} ongoing
     */
    setNodeVideoTime(nodeId, time, ongoing) {
        wasm.web_setNodeVideoTime(this.__wbg_ptr, nodeId, time, ongoing);
    }
    /**
     * @param {NodeId} nodeId
     */
    toggleNodeVideoPlay(nodeId) {
        wasm.web_toggleNodeVideoPlay(this.__wbg_ptr, nodeId);
    }
    /**
     * @param {NodeId} nodeId
     */
    toggleNodeVideoMute(nodeId) {
        wasm.web_toggleNodeVideoMute(this.__wbg_ptr, nodeId);
    }
    /**
     * @param {EditState[]} editState
     * @returns {EditState[]}
     */
    edit(editState) {
        const ptr0 = passArrayJsValueToWasm0(editState, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.web_edit(this.__wbg_ptr, ptr0, len0);
        var v2 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * @param {PointerEvent} event
     */
    onPointerMove(event) {
        wasm.web_onPointerMove(this.__wbg_ptr, event);
    }
    /**
     * @param {PointerEvent} event
     */
    onPointerDown(event) {
        wasm.web_onPointerDown(this.__wbg_ptr, event);
    }
    /**
     * @param {PointerEvent} event
     */
    onPointerUp(event) {
        wasm.web_onPointerUp(this.__wbg_ptr, event);
    }
    /**
     * @param {PointerEvent} event
     */
    onPointerLeave(event) {
        wasm.web_onPointerLeave(this.__wbg_ptr, event);
    }
    /**
     * @param {PointerEvent} event
     */
    onPointerEnter(event) {
        wasm.web_onPointerEnter(this.__wbg_ptr, event);
    }
    /**
     * @param {WheelEvent} event
     */
    onWheel(event) {
        wasm.web_onWheel(this.__wbg_ptr, event);
    }
    /**
     * @param {NodeId} nodeId
     * @param {LayerId[]} layerIds
     */
    setSelectedLayers(nodeId, layerIds) {
        const ptr0 = passArrayJsValueToWasm0(layerIds, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.web_setSelectedLayers(this.__wbg_ptr, nodeId, ptr0, len0);
    }
    /**
     * @param {NodeId} nodeId
     * @param {ToolMode} mode
     */
    setToolMode(nodeId, mode) {
        wasm.web_setToolMode(this.__wbg_ptr, nodeId, mode);
    }
    /**
     * @param {NodeId} nodeId
     * @param {LayerId} layerId
     * @param {number} index
     * @returns {Edit}
     */
    setLayerOrder(nodeId, layerId, index) {
        const ret = wasm.web_setLayerOrder(this.__wbg_ptr, nodeId, layerId, index);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {LayerId} layerId
     * @param {Layer} layer
     * @returns {Edit}
     */
    updateLayer(nodeId, layerId, layer) {
        const ret = wasm.web_updateLayer(this.__wbg_ptr, nodeId, layerId, layer);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {LayerId[]} layerIds
     * @returns {Edit}
     */
    removeLayers(nodeId, layerIds) {
        const ptr0 = passArrayJsValueToWasm0(layerIds, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.web_removeLayers(this.__wbg_ptr, nodeId, ptr0, len0);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {number} width
     * @param {number} height
     * @returns {Edit}
     */
    setStageDimensions(nodeId, width, height) {
        const ret = wasm.web_setStageDimensions(this.__wbg_ptr, nodeId, width, height);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {LayerId} layerId
     * @param {Orientation} orientation
     * @returns {Edit}
     */
    flipCompositorLayer(nodeId, layerId, orientation) {
        const ret = wasm.web_flipCompositorLayer(this.__wbg_ptr, nodeId, layerId, orientation);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {LayerId} layerId
     * @param {Alignment} alignment
     * @returns {Edit}
     */
    alignCompositorLayer(nodeId, layerId, alignment) {
        const ret = wasm.web_alignCompositorLayer(this.__wbg_ptr, nodeId, layerId, alignment);
        return ret;
    }
    /**
     * @param {InsertNode[]} nodes
     * @returns {Edit}
     */
    insertNodes(nodes) {
        const ptr0 = passArrayJsValueToWasm0(nodes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.web_insertNodes(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {NodeId[]} nodeIds
     * @returns {Edit}
     */
    removeNodes(nodeIds) {
        const ptr0 = passArrayJsValueToWasm0(nodeIds, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.web_removeNodes(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {InputId} inputId
     * @returns {DataType[]}
     */
    nodeValidInputTypes(nodeId, inputId) {
        const ret = wasm.web_nodeValidInputTypes(this.__wbg_ptr, nodeId, inputId);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {NodeId} nodeId
     * @returns {Edit}
     */
    toggleNodeLocked(nodeId) {
        const ret = wasm.web_toggleNodeLocked(this.__wbg_ptr, nodeId);
        return ret;
    }
    /**
     * @param {NodeId} targetNodeId
     * @param {InputId} targetInputId
     * @param {FileKind | null} [file]
     * @param {string | null} [string]
     * @param {string[] | null} [array]
     * @returns {Edit}
     */
    updateNodeInput(targetNodeId, targetInputId, file, string, array) {
        var ptr0 = isLikeNone(string) ? 0 : passStringToWasm0(string, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(array) ? 0 : passArrayJsValueToWasm0(array, wasm.__wbindgen_malloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.web_updateNodeInput(this.__wbg_ptr, targetNodeId, targetInputId, isLikeNone(file) ? 0 : addToExternrefTable0(file), ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {NodeId} targetNodeId
     * @param {InputId} targetInputId
     * @param {Input | null} [input]
     * @returns {SetNodeInputReturn}
     */
    setNodeInput(targetNodeId, targetInputId, input) {
        const ret = wasm.web_setNodeInput(this.__wbg_ptr, targetNodeId, targetInputId, isLikeNone(input) ? 0 : addToExternrefTable0(input));
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {InputId} inputId
     * @returns {boolean}
     */
    isInputValid(nodeId, inputId) {
        const ret = wasm.web_isInputValid(this.__wbg_ptr, nodeId, inputId);
        return ret !== 0;
    }
    /**
     * @param {NodeId} nodeId
     * @param {InputId} inputId
     * @returns {boolean}
     */
    isInputRequired(nodeId, inputId) {
        const ret = wasm.web_isInputRequired(this.__wbg_ptr, nodeId, inputId);
        return ret !== 0;
    }
    /**
     * @param {NodeId} nodeId
     * @param {OutputId | null} [outputId]
     * @returns {Base64Image | undefined}
     */
    exportNodeRender(nodeId, outputId) {
        const ret = wasm.web_exportNodeRender(this.__wbg_ptr, nodeId, isLikeNone(outputId) ? 0 : addToExternrefTable0(outputId));
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {InputId} inputId
     * @returns {EvaluatedValue | undefined}
     */
    evaluateInput(nodeId, inputId) {
        const ret = wasm.web_evaluateInput(this.__wbg_ptr, nodeId, inputId);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @returns {InputId[]}
     */
    inputIds(nodeId) {
        const ret = wasm.web_inputIds(this.__wbg_ptr, nodeId);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {NodeId} nodeId
     * @param {InputId} inputId
     * @returns {Input | undefined}
     */
    nodeInput(nodeId, inputId) {
        const ret = wasm.web_nodeInput(this.__wbg_ptr, nodeId, inputId);
        return ret;
    }
    /**
     * @param {Input} input
     * @returns {Dimensions | undefined}
     */
    nodeInputDimensions(input) {
        const ret = wasm.web_nodeInputDimensions(this.__wbg_ptr, input);
        return ret;
    }
    /**
     * @param {Input} input
     * @returns {FileKind | undefined}
     */
    nodeFileInput(input) {
        const ret = wasm.web_nodeFileInput(this.__wbg_ptr, input);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {OutputId} outputId
     * @returns {DataType | undefined}
     */
    nodeOutputType(nodeId, outputId) {
        const ret = wasm.web_nodeOutputType(this.__wbg_ptr, nodeId, outputId);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {InputId} inputId
     * @returns {DataType | undefined}
     */
    nodeInputType(nodeId, inputId) {
        const ret = wasm.web_nodeInputType(this.__wbg_ptr, nodeId, inputId);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {InputId} inputId
     * @returns {Histogram | undefined}
     */
    computeInputHistogram(nodeId, inputId) {
        const ret = wasm.web_computeInputHistogram(this.__wbg_ptr, nodeId, inputId);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {BlurOptions} options
     * @returns {Edit}
     */
    setBlurOptions(nodeId, options) {
        const ret = wasm.web_setBlurOptions(this.__wbg_ptr, nodeId, options);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {ResizeOptions} options
     * @returns {Edit}
     */
    setResizeOptions(nodeId, options) {
        const ret = wasm.web_setResizeOptions(this.__wbg_ptr, nodeId, options);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {CropOptions} options
     * @returns {Edit}
     */
    setCropOptions(nodeId, options) {
        const ret = wasm.web_setCropOptions(this.__wbg_ptr, nodeId, options);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {LevelsOptions} options
     * @returns {Edit}
     */
    setLevelsOptions(nodeId, options) {
        const ret = wasm.web_setLevelsOptions(this.__wbg_ptr, nodeId, options);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {PainterOptions} options
     * @returns {Edit}
     */
    setPainterOptions(nodeId, options) {
        const ret = wasm.web_setPainterOptions(this.__wbg_ptr, nodeId, options);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {PainterMode} mode
     */
    setPainterMode(nodeId, mode) {
        wasm.web_setPainterMode(this.__wbg_ptr, nodeId, mode);
    }
    /**
     * @param {NodeId} nodeId
     * @param {number} size
     * @returns {Edit}
     */
    setDilationErosionSize(nodeId, size) {
        const ret = wasm.web_setDilationErosionSize(this.__wbg_ptr, nodeId, size);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {FileKind[]} files
     * @returns {Edit}
     */
    setFiles(nodeId, files) {
        const ptr0 = passArrayJsValueToWasm0(files, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.web_setFiles(this.__wbg_ptr, nodeId, ptr0, len0);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {number} selected
     * @returns {Edit}
     */
    setSelectedMedia(nodeId, selected) {
        const ret = wasm.web_setSelectedMedia(this.__wbg_ptr, nodeId, selected);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {string} value
     * @returns {Edit}
     */
    setText(nodeId, value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.web_setText(this.__wbg_ptr, nodeId, ptr0, len0);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {string} value
     * @returns {Edit}
     */
    setPrompt(nodeId, value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.web_setPrompt(this.__wbg_ptr, nodeId, ptr0, len0);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {string} value
     * @returns {Edit}
     */
    setPromptConcatenator(nodeId, value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.web_setPromptConcatenator(this.__wbg_ptr, nodeId, ptr0, len0);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {Number} value
     * @returns {Edit}
     */
    setNumber(nodeId, value) {
        const ret = wasm.web_setNumber(this.__wbg_ptr, nodeId, value);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {Channel} channel
     * @returns {Edit}
     */
    setChannel(nodeId, channel) {
        const ret = wasm.web_setChannel(this.__wbg_ptr, nodeId, channel);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {number} value
     * @returns {Edit}
     */
    setSelected(nodeId, value) {
        const ret = wasm.web_setSelected(this.__wbg_ptr, nodeId, value);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {boolean} value
     * @returns {Edit}
     */
    setIsIterator(nodeId, value) {
        const ret = wasm.web_setIsIterator(this.__wbg_ptr, nodeId, value);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {number | null | undefined} selected
     * @param {NumberArray} options
     * @returns {Edit}
     */
    setNumberSelector(nodeId, selected, options) {
        const ret = wasm.web_setNumberSelector(this.__wbg_ptr, nodeId, isLikeNone(selected) ? 0x100000001 : (selected) >>> 0, options);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {string[]} array
     * @param {string} delimiter
     * @returns {Edit}
     */
    setStringArray(nodeId, array, delimiter) {
        const ptr0 = passArrayJsValueToWasm0(array, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(delimiter, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.web_setStringArray(this.__wbg_ptr, nodeId, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {boolean} value
     * @returns {Edit}
     */
    setToggle(nodeId, value) {
        const ret = wasm.web_setToggle(this.__wbg_ptr, nodeId, value);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {Seed} value
     * @returns {Edit}
     */
    setSeed(nodeId, value) {
        const ret = wasm.web_setSeed(this.__wbg_ptr, nodeId, value);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {ModelAsset[]} generations
     * @returns {Edit}
     */
    setModelGenerations(nodeId, generations) {
        const ptr0 = passArrayJsValueToWasm0(generations, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.web_setModelGenerations(this.__wbg_ptr, nodeId, ptr0, len0);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {number} value
     * @returns {Edit}
     */
    setSelectedModelGeneration(nodeId, value) {
        const ret = wasm.web_setSelectedModelGeneration(this.__wbg_ptr, nodeId, value);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {boolean} locked
     * @returns {Edit}
     */
    setImportCameraLocked(nodeId, locked) {
        const ret = wasm.web_setImportCameraLocked(this.__wbg_ptr, nodeId, locked);
        return ret;
    }
    /**
     * @param {NodeId} nodeId
     * @param {string} value
     * @returns {Edit}
     */
    editTextAsset(nodeId, value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.web_editTextAsset(this.__wbg_ptr, nodeId, ptr0, len0);
        return ret;
    }
}
if (Symbol.dispose) Web.prototype[Symbol.dispose] = Web.prototype.free;

const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default']);

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_Error_e17e777aac105295 = function(arg0, arg1) {
        const ret = Error(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_Number_998bea33bd87c3e0 = function(arg0) {
        const ret = Number(arg0);
        return ret;
    };
    imports.wbg.__wbg_String_8f0eb39a4a4c2f66 = function(arg0, arg1) {
        const ret = String(arg1);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_activeTexture_6c1913c8d98b6134 = function(arg0, arg1) {
        arg0.activeTexture(arg1 >>> 0);
    };
    imports.wbg.__wbg_activeTexture_fb07604497324f97 = function(arg0, arg1) {
        arg0.activeTexture(arg1 >>> 0);
    };
    imports.wbg.__wbg_addEventListener_775911544ac9d643 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.addEventListener(getStringFromWasm0(arg1, arg2), arg3);
    }, arguments) };
    imports.wbg.__wbg_altKey_a8b663f4f5755ab0 = function(arg0) {
        const ret = arg0.altKey;
        return ret;
    };
    imports.wbg.__wbg_attachShader_8bc6f118fa003360 = function(arg0, arg1, arg2) {
        arg0.attachShader(arg1, arg2);
    };
    imports.wbg.__wbg_attachShader_a8734551b2febdd9 = function(arg0, arg1, arg2) {
        arg0.attachShader(arg1, arg2);
    };
    imports.wbg.__wbg_bindBuffer_96956145e9aa4a24 = function(arg0, arg1, arg2) {
        arg0.bindBuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindBuffer_ca632d407a6cd394 = function(arg0, arg1, arg2) {
        arg0.bindBuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindFramebuffer_41001db5f1d804ef = function(arg0, arg1, arg2) {
        arg0.bindFramebuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindFramebuffer_50be9cff3d87d51d = function(arg0, arg1, arg2) {
        arg0.bindFramebuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindRenderbuffer_6884204d519b13d6 = function(arg0, arg1, arg2) {
        arg0.bindRenderbuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindRenderbuffer_c50e2c1a1b2acdc2 = function(arg0, arg1, arg2) {
        arg0.bindRenderbuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindTexture_344367fe0146db6b = function(arg0, arg1, arg2) {
        arg0.bindTexture(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindTexture_9d1255b2de6a3a20 = function(arg0, arg1, arg2) {
        arg0.bindTexture(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindVertexArrayOES_af3701d1c8765088 = function(arg0, arg1) {
        arg0.bindVertexArrayOES(arg1);
    };
    imports.wbg.__wbg_bindVertexArray_38371b6174c99865 = function(arg0, arg1) {
        arg0.bindVertexArray(arg1);
    };
    imports.wbg.__wbg_blendEquationSeparate_57454bc47bbdf27f = function(arg0, arg1, arg2) {
        arg0.blendEquationSeparate(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_blendEquationSeparate_5a0a1a19d0c022cc = function(arg0, arg1, arg2) {
        arg0.blendEquationSeparate(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_blendFuncSeparate_23202f696bbb3c05 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.blendFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_blendFuncSeparate_4cf8789254320bcf = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.blendFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_blitFramebuffer_44e2ef9be85cf535 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.blitFramebuffer(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0);
    };
    imports.wbg.__wbg_body_8822ca55cb3730d2 = function(arg0) {
        const ret = arg0.body;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_bufferData_711da55deac6c280 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_a964c14d0eebdeb8 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_button_47b736693b6dd97f = function(arg0) {
        const ret = arg0.button;
        return ret;
    };
    imports.wbg.__wbg_call_13410aac570ffff7 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.call(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_641db1bb5db5a579 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.call(arg1, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_a5400b25a865cfd8 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.call(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_clearColor_1b57db4542cfd480 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearColor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_clearColor_6e4857102d3b1d7f = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearColor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_clearDepth_2e2a1ed6de109fdf = function(arg0, arg1) {
        arg0.clearDepth(arg1);
    };
    imports.wbg.__wbg_clearDepth_d8956029efac4f93 = function(arg0, arg1) {
        arg0.clearDepth(arg1);
    };
    imports.wbg.__wbg_clear_7b717c6b7a62cb56 = function(arg0, arg1) {
        arg0.clear(arg1 >>> 0);
    };
    imports.wbg.__wbg_clear_b489bd1e5a12302a = function(arg0, arg1) {
        arg0.clear(arg1 >>> 0);
    };
    imports.wbg.__wbg_clientHeight_59d075cde7dbe3c7 = function(arg0) {
        const ret = arg0.clientHeight;
        return ret;
    };
    imports.wbg.__wbg_clientWidth_8a498b7a82cae772 = function(arg0) {
        const ret = arg0.clientWidth;
        return ret;
    };
    imports.wbg.__wbg_clientX_ea858fbae3debd3c = function(arg0) {
        const ret = arg0.clientX;
        return ret;
    };
    imports.wbg.__wbg_clientY_cbb39a771d53208f = function(arg0) {
        const ret = arg0.clientY;
        return ret;
    };
    imports.wbg.__wbg_cloneNode_79d46b18d5619863 = function() { return handleError(function (arg0) {
        const ret = arg0.cloneNode();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_colorMask_aff1c1224bf8c3a5 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.colorMask(arg1 !== 0, arg2 !== 0, arg3 !== 0, arg4 !== 0);
    };
    imports.wbg.__wbg_colorMask_d058f3d5b194b766 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.colorMask(arg1 !== 0, arg2 !== 0, arg3 !== 0, arg4 !== 0);
    };
    imports.wbg.__wbg_compileShader_3ed42f9f82c060ea = function(arg0, arg1) {
        arg0.compileShader(arg1);
    };
    imports.wbg.__wbg_compileShader_624cab4335331bc6 = function(arg0, arg1) {
        arg0.compileShader(arg1);
    };
    imports.wbg.__wbg_createBuffer_6a92125855922b2e = function(arg0) {
        const ret = arg0.createBuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createBuffer_c5ec555dacde83aa = function(arg0) {
        const ret = arg0.createBuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createFramebuffer_4bc5f540c042ed80 = function(arg0) {
        const ret = arg0.createFramebuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createFramebuffer_7f37b6fa900dcc83 = function(arg0) {
        const ret = arg0.createFramebuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createProgram_905f3efd8354e76c = function(arg0) {
        const ret = arg0.createProgram();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createProgram_ec729a857b19d91d = function(arg0) {
        const ret = arg0.createProgram();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createRenderbuffer_2e49517573c90672 = function(arg0) {
        const ret = arg0.createRenderbuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createRenderbuffer_fb1304cc58893f7f = function(arg0) {
        const ret = arg0.createRenderbuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createShader_8548d722c1327303 = function(arg0, arg1) {
        const ret = arg0.createShader(arg1 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createShader_fd0b69b640e9618d = function(arg0, arg1) {
        const ret = arg0.createShader(arg1 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createTexture_5fd5f5e64ea927f9 = function(arg0) {
        const ret = arg0.createTexture();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createTexture_62494769edc22521 = function(arg0) {
        const ret = arg0.createTexture();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createVertexArrayOES_21ff1ae54f601a66 = function(arg0) {
        const ret = arg0.createVertexArrayOES();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createVertexArray_54f6bb34c6bf6a01 = function(arg0) {
        const ret = arg0.createVertexArray();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ctrlKey_d6452dce5a5af017 = function(arg0) {
        const ret = arg0.ctrlKey;
        return ret;
    };
    imports.wbg.__wbg_cullFace_79a5496534125452 = function(arg0, arg1) {
        arg0.cullFace(arg1 >>> 0);
    };
    imports.wbg.__wbg_cullFace_878b43a75865e672 = function(arg0, arg1) {
        arg0.cullFace(arg1 >>> 0);
    };
    imports.wbg.__wbg_currentTime_5b624632b1247540 = function(arg0) {
        const ret = arg0.currentTime;
        return ret;
    };
    imports.wbg.__wbg_deleteBuffer_2bf895dbf2712b1c = function(arg0, arg1) {
        arg0.deleteBuffer(arg1);
    };
    imports.wbg.__wbg_deleteBuffer_85973edb45946d28 = function(arg0, arg1) {
        arg0.deleteBuffer(arg1);
    };
    imports.wbg.__wbg_deleteFramebuffer_98d173a2f5729605 = function(arg0, arg1) {
        arg0.deleteFramebuffer(arg1);
    };
    imports.wbg.__wbg_deleteFramebuffer_f7980e4d44e3be49 = function(arg0, arg1) {
        arg0.deleteFramebuffer(arg1);
    };
    imports.wbg.__wbg_deleteProgram_38897a0794ccf3e7 = function(arg0, arg1) {
        arg0.deleteProgram(arg1);
    };
    imports.wbg.__wbg_deleteProgram_aea3ac7223133383 = function(arg0, arg1) {
        arg0.deleteProgram(arg1);
    };
    imports.wbg.__wbg_deleteRenderbuffer_c373f86e30a5b1db = function(arg0, arg1) {
        arg0.deleteRenderbuffer(arg1);
    };
    imports.wbg.__wbg_deleteRenderbuffer_fd93f50d76e1f7b3 = function(arg0, arg1) {
        arg0.deleteRenderbuffer(arg1);
    };
    imports.wbg.__wbg_deleteShader_d6e382690559bdd2 = function(arg0, arg1) {
        arg0.deleteShader(arg1);
    };
    imports.wbg.__wbg_deleteShader_eb2cdf8ac72c5b0c = function(arg0, arg1) {
        arg0.deleteShader(arg1);
    };
    imports.wbg.__wbg_deleteTexture_016238d3d7033a57 = function(arg0, arg1) {
        arg0.deleteTexture(arg1);
    };
    imports.wbg.__wbg_deleteTexture_38b1bb66607dcf07 = function(arg0, arg1) {
        arg0.deleteTexture(arg1);
    };
    imports.wbg.__wbg_deltaX_e639e6be7245bedc = function(arg0) {
        const ret = arg0.deltaX;
        return ret;
    };
    imports.wbg.__wbg_deltaY_2d352968f40fb71a = function(arg0) {
        const ret = arg0.deltaY;
        return ret;
    };
    imports.wbg.__wbg_depthFunc_b8049ca7ef66025a = function(arg0, arg1) {
        arg0.depthFunc(arg1 >>> 0);
    };
    imports.wbg.__wbg_depthFunc_bc0220c6a44cc71b = function(arg0, arg1) {
        arg0.depthFunc(arg1 >>> 0);
    };
    imports.wbg.__wbg_depthMask_69d8a422f085f466 = function(arg0, arg1) {
        arg0.depthMask(arg1 !== 0);
    };
    imports.wbg.__wbg_depthMask_8fdcb3b4d4e6e61e = function(arg0, arg1) {
        arg0.depthMask(arg1 !== 0);
    };
    imports.wbg.__wbg_detachShader_02d3fa6d0f4c3802 = function(arg0, arg1, arg2) {
        arg0.detachShader(arg1, arg2);
    };
    imports.wbg.__wbg_detachShader_d7def23e0b839d0e = function(arg0, arg1, arg2) {
        arg0.detachShader(arg1, arg2);
    };
    imports.wbg.__wbg_devicePixelRatio_de772f7b570607fa = function(arg0) {
        const ret = arg0.devicePixelRatio;
        return ret;
    };
    imports.wbg.__wbg_disableVertexAttribArray_318e1f5b4fa87c2c = function(arg0, arg1) {
        arg0.disableVertexAttribArray(arg1 >>> 0);
    };
    imports.wbg.__wbg_disableVertexAttribArray_84ca048074074001 = function(arg0, arg1) {
        arg0.disableVertexAttribArray(arg1 >>> 0);
    };
    imports.wbg.__wbg_disable_21c6577232ad9696 = function(arg0, arg1) {
        arg0.disable(arg1 >>> 0);
    };
    imports.wbg.__wbg_disable_8a09d5dbbf79acd8 = function(arg0, arg1) {
        arg0.disable(arg1 >>> 0);
    };
    imports.wbg.__wbg_document_7d29d139bd619045 = function(arg0) {
        const ret = arg0.document;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_done_75ed0ee6dd243d9d = function(arg0) {
        const ret = arg0.done;
        return ret;
    };
    imports.wbg.__wbg_drawArraysInstancedANGLE_06e129915343a574 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawArraysInstancedANGLE(arg1 >>> 0, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_drawArraysInstanced_c1d4d73da5d58188 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawArraysInstanced(arg1 >>> 0, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_drawArrays_55353be689b7c9a2 = function(arg0, arg1, arg2, arg3) {
        arg0.drawArrays(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_drawArrays_a302a553321cfecb = function(arg0, arg1, arg2, arg3) {
        arg0.drawArrays(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_drawBuffersWEBGL_eadf18b1b390247f = function(arg0, arg1) {
        arg0.drawBuffersWEBGL(arg1);
    };
    imports.wbg.__wbg_drawBuffers_8371113495be89e9 = function(arg0, arg1) {
        arg0.drawBuffers(arg1);
    };
    imports.wbg.__wbg_drawElementsInstancedANGLE_5057b2800ddf2189 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.drawElementsInstancedANGLE(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_drawElementsInstanced_4be13ad9845708e5 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.drawElementsInstanced(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_drawElements_31332dbb833d202b = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_drawElements_3acf8f6523f00d29 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_drawImage_e671cebe79811b4a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.drawImage(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_duration_8af8f14af050f230 = function(arg0) {
        const ret = arg0.duration;
        return ret;
    };
    imports.wbg.__wbg_enableVertexAttribArray_0f7f10c9dbc31dfd = function(arg0, arg1) {
        arg0.enableVertexAttribArray(arg1 >>> 0);
    };
    imports.wbg.__wbg_enableVertexAttribArray_17e09202dc56b410 = function(arg0, arg1) {
        arg0.enableVertexAttribArray(arg1 >>> 0);
    };
    imports.wbg.__wbg_enable_043862f86449bfd3 = function(arg0, arg1) {
        arg0.enable(arg1 >>> 0);
    };
    imports.wbg.__wbg_enable_d2b20d4e604e4ada = function(arg0, arg1) {
        arg0.enable(arg1 >>> 0);
    };
    imports.wbg.__wbg_entries_2be2f15bd5554996 = function(arg0) {
        const ret = Object.entries(arg0);
        return ret;
    };
    imports.wbg.__wbg_framebufferRenderbuffer_45178c04e8a4b3d9 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.framebufferRenderbuffer(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_framebufferRenderbuffer_ad5f82c1a05a92fb = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.framebufferRenderbuffer(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_framebufferTexture2D_092bd9e2e1345ceb = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.framebufferTexture2D(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_framebufferTexture2D_fb4babc49cc94fd6 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.framebufferTexture2D(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_framebufferTextureLayer_b0e00b0064ff871d = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.framebufferTextureLayer(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_generateMipmap_8ae9c57507b5c814 = function(arg0, arg1) {
        arg0.generateMipmap(arg1 >>> 0);
    };
    imports.wbg.__wbg_generateMipmap_d9540bec7e200b2e = function(arg0, arg1) {
        arg0.generateMipmap(arg1 >>> 0);
    };
    imports.wbg.__wbg_getActiveAttrib_a1d4f466c9fd85f1 = function(arg0, arg1, arg2) {
        const ret = arg0.getActiveAttrib(arg1, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getActiveAttrib_d8fe7c11b8be2832 = function(arg0, arg1, arg2) {
        const ret = arg0.getActiveAttrib(arg1, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getActiveUniform_4fd679c899ae3dc0 = function(arg0, arg1, arg2) {
        const ret = arg0.getActiveUniform(arg1, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getActiveUniform_ce415ea88da673f4 = function(arg0, arg1, arg2) {
        const ret = arg0.getActiveUniform(arg1, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getAttribLocation_0de296dd6831e7e2 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getAttribLocation(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_getAttribLocation_4bc7298aff530b04 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getAttribLocation(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_getAttribute_8bfaf67e99ed2ee3 = function(arg0, arg1, arg2, arg3) {
        const ret = arg1.getAttribute(getStringFromWasm0(arg2, arg3));
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getBoundingClientRect_a2461829d8aa0b30 = function(arg0) {
        const ret = arg0.getBoundingClientRect();
        return ret;
    };
    imports.wbg.__wbg_getContext_15e158d04230a6f6 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getContext_4bfd08c32570ece4 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.getContext(getStringFromWasm0(arg1, arg2), arg3);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getExtension_bfad55fb92b4a6f1 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getExtension(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getParameter_2e3a45595197590c = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.getParameter(arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getParameter_3624d89739a2bc7e = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.getParameter(arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getProgramInfoLog_0f2cbb1decc2bdb4 = function(arg0, arg1, arg2) {
        const ret = arg1.getProgramInfoLog(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getProgramInfoLog_213b7a355f7a9ab3 = function(arg0, arg1, arg2) {
        const ret = arg1.getProgramInfoLog(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getProgramParameter_1dfaf593c91d28d4 = function(arg0, arg1, arg2) {
        const ret = arg0.getProgramParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getProgramParameter_fbfb133d8f8e5a0e = function(arg0, arg1, arg2) {
        const ret = arg0.getProgramParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getShaderInfoLog_42f0460a19309f2b = function(arg0, arg1, arg2) {
        const ret = arg1.getShaderInfoLog(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getShaderInfoLog_561bdd629638c1af = function(arg0, arg1, arg2) {
        const ret = arg1.getShaderInfoLog(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getSupportedExtensions_5a90a17f0f82d0b5 = function(arg0) {
        const ret = arg0.getSupportedExtensions();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getUniformLocation_2806716283530fdf = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getUniformLocation(arg1, getStringFromWasm0(arg2, arg3));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getUniformLocation_3c1cc7519f10e1e9 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getUniformLocation(arg1, getStringFromWasm0(arg2, arg3));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_0da715ceaecea5c8 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_get_458e874b43b18b25 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getwithrefkey_1dc361bd10053bfe = function(arg0, arg1) {
        const ret = arg0[arg1];
        return ret;
    };
    imports.wbg.__wbg_height_228fe8a75d4d09d6 = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_height_36fae1857b6cca70 = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_height_dcede88ab14fa083 = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ArrayBuffer_67f3012529f6a2dd = function(arg0) {
        let result;
        try {
            result = arg0 instanceof ArrayBuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_CanvasRenderingContext2d_8c616198ec03b12f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof CanvasRenderingContext2D;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_HtmlCanvasElement_299c60950dbb3428 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof HTMLCanvasElement;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Map_ebb01a5b6b5ffd0b = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Map;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Uint8Array_9a8378d955933db7 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Uint8Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGl2RenderingContext_0437ff340aef5ac7 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGL2RenderingContext;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Window_12d20d558ef92592 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Window;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_isArray_030cce220591fb41 = function(arg0) {
        const ret = Array.isArray(arg0);
        return ret;
    };
    imports.wbg.__wbg_isSafeInteger_1c0d1af5542e102a = function(arg0) {
        const ret = Number.isSafeInteger(arg0);
        return ret;
    };
    imports.wbg.__wbg_iterator_f370b34483c71a1c = function() {
        const ret = Symbol.iterator;
        return ret;
    };
    imports.wbg.__wbg_length_186546c51cd61acd = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_6bb7e81f9d7713e4 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_linkProgram_4bf446d2d081aa07 = function(arg0, arg1) {
        arg0.linkProgram(arg1);
    };
    imports.wbg.__wbg_linkProgram_95ebc1476a7a1a7b = function(arg0, arg1) {
        arg0.linkProgram(arg1);
    };
    imports.wbg.__wbg_load_136d585dbf0ea16a = function(arg0) {
        arg0.load();
    };
    imports.wbg.__wbg_metaKey_48d6907eef50622b = function(arg0) {
        const ret = arg0.metaKey;
        return ret;
    };
    imports.wbg.__wbg_muted_d7233d6d9b0776f1 = function(arg0) {
        const ret = arg0.muted;
        return ret;
    };
    imports.wbg.__wbg_name_9be6ea952975e526 = function(arg0, arg1) {
        const ret = arg1.name;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_new_19c25a3f2fa63a02 = function() {
        const ret = new Object();
        return ret;
    };
    imports.wbg.__wbg_new_1f3a344cf3123716 = function() {
        const ret = new Array();
        return ret;
    };
    imports.wbg.__wbg_new_2ff1f68f3676ea53 = function() {
        const ret = new Map();
        return ret;
    };
    imports.wbg.__wbg_new_638ebfaedbf32a5e = function(arg0) {
        const ret = new Uint8Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_66e4a78b971a726b = function() {
        const ret = new Error();
        return ret;
    };
    imports.wbg.__wbg_newnoargs_254190557c45b4ec = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_next_5b3530e612fde77d = function(arg0) {
        const ret = arg0.next;
        return ret;
    };
    imports.wbg.__wbg_next_692e82279131b03c = function() { return handleError(function (arg0) {
        const ret = arg0.next();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_now_2c95c9de01293173 = function(arg0) {
        const ret = arg0.now();
        return ret;
    };
    imports.wbg.__wbg_of_30e97a7ad6e3518b = function(arg0) {
        const ret = Array.of(arg0);
        return ret;
    };
    imports.wbg.__wbg_offsetHeight_e1b96512ac8f6bef = function(arg0) {
        const ret = arg0.offsetHeight;
        return ret;
    };
    imports.wbg.__wbg_offsetWidth_b88cdf0c2f174fdb = function(arg0) {
        const ret = arg0.offsetWidth;
        return ret;
    };
    imports.wbg.__wbg_offsetX_662fe3431b7cc46a = function(arg0) {
        const ret = arg0.offsetX;
        return ret;
    };
    imports.wbg.__wbg_offsetY_8483643ff853ca90 = function(arg0) {
        const ret = arg0.offsetY;
        return ret;
    };
    imports.wbg.__wbg_pause_0c720b5cc1e9f317 = function() { return handleError(function (arg0) {
        arg0.pause();
    }, arguments) };
    imports.wbg.__wbg_paused_ca83b0800fc91c40 = function(arg0) {
        const ret = arg0.paused;
        return ret;
    };
    imports.wbg.__wbg_performance_7a3ffd0b17f663ad = function(arg0) {
        const ret = arg0.performance;
        return ret;
    };
    imports.wbg.__wbg_pixelStorei_a5469272ba5f21a9 = function(arg0, arg1, arg2) {
        arg0.pixelStorei(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_pixelStorei_e3860b193984af5d = function(arg0, arg1, arg2) {
        arg0.pixelStorei(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_play_823d308ff5126fc6 = function() { return handleError(function (arg0) {
        const ret = arg0.play();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_prototypesetcall_3d4a26c1ed734349 = function(arg0, arg1, arg2) {
        Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
    };
    imports.wbg.__wbg_push_330b2eb93e4e1212 = function(arg0, arg1) {
        const ret = arg0.push(arg1);
        return ret;
    };
    imports.wbg.__wbg_readPixels_8f50625896c2de94 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_readPixels_94d302036298e2a0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_readPixels_f4f1bbd546ca2f58 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_readyState_b0799e170c9d21f2 = function(arg0) {
        const ret = arg0.readyState;
        return ret;
    };
    imports.wbg.__wbg_removeEventListener_6d5be9c2821a511e = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.removeEventListener(getStringFromWasm0(arg1, arg2), arg3);
    }, arguments) };
    imports.wbg.__wbg_renderbufferStorageMultisample_5c3fe8eb3c382231 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.renderbufferStorageMultisample(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_scissor_a3f0cbdc82abcc80 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.scissor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_scissor_e0f22a65cec561df = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.scissor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_seeking_a1644b561a8671e3 = function(arg0) {
        const ret = arg0.seeking;
        return ret;
    };
    imports.wbg.__wbg_setAttribute_d1baf9023ad5696f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.setAttribute(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_set_3f1d0b984ed272ed = function(arg0, arg1, arg2) {
        arg0[arg1] = arg2;
    };
    imports.wbg.__wbg_set_90f6c0f7bd8c0415 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_set_b7f1cf4fae26fe2a = function(arg0, arg1, arg2) {
        const ret = arg0.set(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_setcurrentTime_7de4cb2f7b424266 = function(arg0, arg1) {
        arg0.currentTime = arg1;
    };
    imports.wbg.__wbg_setheight_4fce583024b2d088 = function(arg0, arg1) {
        arg0.height = arg1 >>> 0;
    };
    imports.wbg.__wbg_setmuted_67689fa2659ab80e = function(arg0, arg1) {
        arg0.muted = arg1 !== 0;
    };
    imports.wbg.__wbg_setsrc_be636870ebc475b1 = function(arg0, arg1, arg2) {
        arg0.src = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setwidth_40a6ed203b92839d = function(arg0, arg1) {
        arg0.width = arg1 >>> 0;
    };
    imports.wbg.__wbg_shaderSource_261d7c2a863b3760 = function(arg0, arg1, arg2, arg3) {
        arg0.shaderSource(arg1, getStringFromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_shaderSource_2ed8147ed144f6d6 = function(arg0, arg1, arg2, arg3) {
        arg0.shaderSource(arg1, getStringFromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_shiftKey_cf32e1142cac9fca = function(arg0) {
        const ret = arg0.shiftKey;
        return ret;
    };
    imports.wbg.__wbg_size_88ea058cabfda9dc = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_stack_417c385e3e8b4134 = function(arg0, arg1) {
        const ret = arg1.stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_8921f820c2ce3f12 = function() {
        const ret = typeof global === 'undefined' ? null : global;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_THIS_f0a4409105898184 = function() {
        const ret = typeof globalThis === 'undefined' ? null : globalThis;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_SELF_995b214ae681ff99 = function() {
        const ret = typeof self === 'undefined' ? null : self;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_WINDOW_cde3890479c675ea = function() {
        const ret = typeof window === 'undefined' ? null : window;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_target_f2c963b447be6283 = function(arg0) {
        const ret = arg0.target;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_texImage2D_0162933bc4d227c5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_170458df6b3f9d01 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_82e4e2b78c9ba46d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_8c864b042cf8e4b4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_aa5d5fe2fabd14fd = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_e7b9ba3b4467b817 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_fdf8fdd79c1c0796 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texParameteri_0be696f1f20558e8 = function(arg0, arg1, arg2, arg3) {
        arg0.texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_texParameteri_ebae520a31bfd243 = function(arg0, arg1, arg2, arg3) {
        arg0.texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_texStorage2D_9d1cf9ec10deb70c = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.texStorage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_texSubImage2D_3a84a32e9f31aff8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_565893333677bfcc = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_f3b76d2880b85597 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_type_e68738e3b59a5d27 = function(arg0) {
        const ret = arg0.type;
        return ret;
    };
    imports.wbg.__wbg_uniform1fv_37160110742d424e = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform1fv_c03019803d5e5aaf = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform1iv_67df83b4d8de9722 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform1iv_69cae1b976f4e420 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform1uiv_780d7196917dbcfd = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1uiv(arg1, getArrayU32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform2fv_37c597d61214c92e = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform2fv_48c3b1902f6c180b = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform3fv_0c24a885009cace4 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform3fv_c8fbdd9134e8c443 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform4fv_02c6a3a02b87b438 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform4fv_138bd46c92ad254a = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniformMatrix2fv_c2f5a389d2630c5e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix2fv_fcd3cd06d6bff8b7 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix3fv_03248f168d1b8bc1 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix3fv_4f2fd4d31f0cfae4 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix4fv_79313b9da7a4af35 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix4fv_cefcf2bb4c08d391 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_useProgram_3e5c220728446c29 = function(arg0, arg1) {
        arg0.useProgram(arg1);
    };
    imports.wbg.__wbg_useProgram_9392b29dd522e4ff = function(arg0, arg1) {
        arg0.useProgram(arg1);
    };
    imports.wbg.__wbg_value_dd9372230531eade = function(arg0) {
        const ret = arg0.value;
        return ret;
    };
    imports.wbg.__wbg_vertexAttribDivisorANGLE_401e2827464d35da = function(arg0, arg1, arg2) {
        arg0.vertexAttribDivisorANGLE(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_vertexAttribDivisor_2971061206dd1904 = function(arg0, arg1, arg2) {
        arg0.vertexAttribDivisor(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_vertexAttribPointer_3549d2703f29bf38 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
    };
    imports.wbg.__wbg_vertexAttribPointer_a947e4bf88eef038 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
    };
    imports.wbg.__wbg_videoHeight_b255206018fffc83 = function(arg0) {
        const ret = arg0.videoHeight;
        return ret;
    };
    imports.wbg.__wbg_videoWidth_de4285b0f6b14bba = function(arg0) {
        const ret = arg0.videoWidth;
        return ret;
    };
    imports.wbg.__wbg_viewport_08854654c5c2bba6 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.viewport(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_viewport_fd16dca3a04df933 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.viewport(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_wbindgenbigintgetasi64_ac743ece6ab9bba1 = function(arg0, arg1) {
        const v = arg1;
        const ret = typeof(v) === 'bigint' ? v : undefined;
        getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_wbindgenbooleanget_3fe6f642c7d97746 = function(arg0) {
        const v = arg0;
        const ret = typeof(v) === 'boolean' ? v : undefined;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_wbindgencbdrop_eb10308566512b88 = function(arg0) {
        const obj = arg0.original;
        if (obj.cnt-- == 1) {
            obj.a = 0;
            return true;
        }
        const ret = false;
        return ret;
    };
    imports.wbg.__wbg_wbindgendebugstring_99ef257a3ddda34d = function(arg0, arg1) {
        const ret = debugString(arg1);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_wbindgenin_d7a1ee10933d2d55 = function(arg0, arg1) {
        const ret = arg0 in arg1;
        return ret;
    };
    imports.wbg.__wbg_wbindgenisbigint_ecb90cc08a5a9154 = function(arg0) {
        const ret = typeof(arg0) === 'bigint';
        return ret;
    };
    imports.wbg.__wbg_wbindgenisfunction_8cee7dce3725ae74 = function(arg0) {
        const ret = typeof(arg0) === 'function';
        return ret;
    };
    imports.wbg.__wbg_wbindgenisobject_307a53c6bd97fbf8 = function(arg0) {
        const val = arg0;
        const ret = typeof(val) === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbg_wbindgenisstring_d4fa939789f003b0 = function(arg0) {
        const ret = typeof(arg0) === 'string';
        return ret;
    };
    imports.wbg.__wbg_wbindgenisundefined_c4b71d073b92f3c5 = function(arg0) {
        const ret = arg0 === undefined;
        return ret;
    };
    imports.wbg.__wbg_wbindgenjsvaleq_e6f2ad59ccae1b58 = function(arg0, arg1) {
        const ret = arg0 === arg1;
        return ret;
    };
    imports.wbg.__wbg_wbindgenjsvallooseeq_9bec8c9be826bed1 = function(arg0, arg1) {
        const ret = arg0 == arg1;
        return ret;
    };
    imports.wbg.__wbg_wbindgennumberget_f74b4c7525ac05cb = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'number' ? obj : undefined;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_wbindgenstringget_0f16a6ddddef376f = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_wbindgenthrow_451ec1a8469d7eb6 = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_width_c7a070ac56976582 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_width_cb2a94a03e71098c = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_width_d69b4eebaa4e6b70 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbindgen_cast_2241b6af4c4b2941 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(String) -> Externref`.
        const ret = getStringFromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_4625c577ab2ec9ee = function(arg0) {
        // Cast intrinsic for `U64 -> Externref`.
        const ret = BigInt.asUintN(64, arg0);
        return ret;
    };
    imports.wbg.__wbindgen_cast_7c316abdc43840a3 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(U32)) -> NamedExternref("Uint32Array")`.
        const ret = getArrayU32FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_9575fb55a66c262b = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(I32)) -> NamedExternref("Int32Array")`.
        const ret = getArrayI32FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_9ae0607507abb057 = function(arg0) {
        // Cast intrinsic for `I64 -> Externref`.
        const ret = arg0;
        return ret;
    };
    imports.wbg.__wbindgen_cast_bbb4883c6389f1de = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(U16)) -> NamedExternref("Uint16Array")`.
        const ret = getArrayU16FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_cb9088102bce6b30 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
        const ret = getArrayU8FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_cd07b1914aa3d62c = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(F32)) -> NamedExternref("Float32Array")`.
        const ret = getArrayF32FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_d3f945ccc2eeeb6a = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 792, function: Function { arguments: [], shim_idx: 793, ret: Unit, inner_ret: Some(Unit) }, mutable: false }) -> Externref`.
        const ret = makeClosure(arg0, arg1, 792, __wbg_adapter_18);
        return ret;
    };
    imports.wbg.__wbindgen_cast_d6cd19b81560fd6e = function(arg0) {
        // Cast intrinsic for `F64 -> Externref`.
        const ret = arg0;
        return ret;
    };
    imports.wbg.__wbindgen_cast_e47ceb6027f5c92c = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(I16)) -> NamedExternref("Int16Array")`.
        const ret = getArrayI16FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_feefb5fadd6457fd = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(I8)) -> NamedExternref("Int8Array")`.
        const ret = getArrayI8FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_4;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedFloat32ArrayMemory0 = null;
    cachedInt16ArrayMemory0 = null;
    cachedInt32ArrayMemory0 = null;
    cachedInt8ArrayMemory0 = null;
    cachedUint16ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('designer_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
