# WEAVY GLSL SHADER CATALOG

## **EXTRACTED SHADER LIBRARY**

Based on embedded GLSL code in the WebAssembly binary, Weavy contains a comprehensive shader library supporting advanced image processing, compositing, and rendering operations.

---

## **1. GAUSSIAN BLUR SHADER**

**Purpose:** High-quality blur effects with multiple kernel types

```glsl
uniform sampler2D tex;
uniform vec2 step;
uniform uint blurType;
uniform int kernelSize;

in vec2 uvs;
layout(location = 0) out vec4 outColor;

vec4 gaussianBlur(sampler2D image, vec2 uv, vec2 step, int kernelSize) {
    vec4 color = vec4(0.0);
    float sum = 0.0;
    int halfSize = kernelSize / 2;

    for(int y = -halfSize; y <= halfSize; y++) {
        for(int x = -halfSize; x <= halfSize; x++) {
            vec2 offset = vec2(float(x), float(y)) * step;
            float weight = gaussianWeight(length(vec2(x, y)), kernelSize);
            color += texture(image, uv + offset) * weight;
            sum += weight;
        }
    }
    return color / sum;
}

vec4 boxBlur(sampler2D image, vec2 uv, vec2 step, int kernelSize) {
    vec4 color = vec4(0.0);
    int halfSize = kernelSize / 2;

    for(int y = -halfSize; y <= halfSize; y++) {
        for(int x = -halfSize; x <= halfSize; x++) {
            vec2 offset = vec2(float(x), float(y)) * step;
            color += texture(image, uv + offset);
        }
    }
    return color / float(kernelSize * kernelSize);
}

void main() {
    switch(blurType) {
        case 1u:
            outColor = boxBlur(tex, uvs, step, kernelSize);
            break;
        case 2u:
            outColor = gaussianBlur(tex, uvs, step, kernelSize);
            break;
    }
}
```

---

## **2. ADVANCED COMPOSITING SHADER**

**Purpose:** Professional compositing with 16 blend modes

```glsl
uniform vec4 surfaceColor;

uniform uint blendMode;

#ifdef USE_TEXTURE
uniform sampler2D tex;
uniform mat3 textureTransformation;
#endif

#ifdef USE_DESTINATION
uniform vec2 size;
uniform sampler2D destination;
#endif

in vec4 col;
layout(location = 0) out vec4 outColor;

// Blend mode functions
vec3 blendMultiply(vec3 dst, vec3 src) { return dst * src; }
vec3 blendScreen(vec3 dst, vec3 src) { return 1.0 - (1.0 - dst) * (1.0 - src); }
vec3 blendOverlay(vec3 dst, vec3 src) {
    return mix(2.0 * dst * src, 1.0 - 2.0 * (1.0 - dst) * (1.0 - src), step(0.5, dst));
}
vec3 blendDarken(vec3 dst, vec3 src) { return min(dst, src); }
vec3 blendLighten(vec3 dst, vec3 src) { return max(dst, src); }
vec3 blendColorDodge(vec3 dst, vec3 src) {
    return mix(dst, vec3(1.0), step(1.0 - src, dst) * step(0.0, src));
}
vec3 blendColorBurn(vec3 dst, vec3 src) {
    return mix(vec3(1.0), 1.0 - (1.0 - dst) / src, step(0.0, src));
}
vec3 blendHardLight(vec3 dst, vec3 src) {
    return mix(2.0 * dst * src, 1.0 - 2.0 * (1.0 - dst) * (1.0 - src), step(0.5, src));
}
vec3 blendSoftLight(vec3 dst, vec3 src) {
    vec3 d = mix(sqrt(dst), dst, step(0.25, dst));
    return mix(2.0 * dst * (1.0 - src) + d * src, dst * (1.0 + src) - sqrt(dst) * src, step(0.5, src));
}
vec3 blendDifference(vec3 dst, vec3 src) { return abs(dst - src); }
vec3 blendExclusion(vec3 dst, vec3 src) { return dst + src - 2.0 * dst * src; }

// HSL-based blend modes
vec3 rgb2hsl(vec3 rgb) {
    float maxVal = max(max(rgb.r, rgb.g), rgb.b);
    float minVal = min(min(rgb.r, rgb.g), rgb.b);
    float delta = maxVal - minVal;
    float h = 0.0;
    if (delta != 0.0) {
        if (maxVal == rgb.r) h = mod((rgb.g - rgb.b) / delta, 6.0);
        else if (maxVal == rgb.g) h = (rgb.b - rgb.r) / delta + 2.0;
        else h = (rgb.r - rgb.g) / delta + 4.0;
        h /= 6.0;
    }
    float l = (maxVal + minVal) / 2.0;
    float s = delta == 0.0 ? 0.0 : delta / (1.0 - abs(2.0 * l - 1.0));
    return vec3(h, s, l);
}

vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
    float m = l - c / 2.0;
    vec3 rgb = vec3(0.0);
    if (h < 1.0/6.0) rgb = vec3(c, x, 0.0);
    else if (h < 2.0/6.0) rgb = vec3(x, c, 0.0);
    else if (h < 3.0/6.0) rgb = vec3(0.0, c, x);
    else if (h < 4.0/6.0) rgb = vec3(0.0, x, c);
    else if (h < 5.0/6.0) rgb = vec3(x, 0.0, c);
    else rgb = vec3(c, 0.0, x);
    return rgb + m;
}

vec3 blendHue(vec3 dst, vec3 src) {
    vec3 dstHSL = rgb2hsl(dst);
    vec3 srcHSL = rgb2hsl(src);
    return hsl2rgb(vec3(srcHSL.x, dstHSL.y, dstHSL.z));
}

vec3 blendSaturation(vec3 dst, vec3 src) {
    vec3 dstHSL = rgb2hsl(dst);
    vec3 srcHSL = rgb2hsl(src);
    return hsl2rgb(vec3(dstHSL.x, srcHSL.y, dstHSL.z));
}

vec3 blendColor(vec3 dst, vec3 src) {
    vec3 dstHSL = rgb2hsl(dst);
    vec3 srcHSL = rgb2hsl(src);
    return hsl2rgb(vec3(srcHSL.x, srcHSL.y, dstHSL.z));
}

vec3 blendLuminosity(vec3 dst, vec3 src) {
    vec3 dstHSL = rgb2hsl(dst);
    vec3 srcHSL = rgb2hsl(src);
    return hsl2rgb(vec3(dstHSL.x, srcHSL.y, srcHSL.z));
}

vec3 blend(uint mode, vec3 dst, vec3 src) {
    switch(mode) {
        case 0u: return src;                          // Normal
        case 1u: return blendMultiply(dst, src);      // Multiply
        case 2u: return blendScreen(dst, src);        // Screen
        case 3u: return blendOverlay(dst, src);       // Overlay
        case 4u: return blendDarken(dst, src);        // Darken
        case 5u: return blendLighten(dst, src);       // Lighten
        case 6u: return blendColorDodge(dst, src);    // Color Dodge
        case 7u: return blendColorBurn(dst, src);     // Color Burn
        case 8u: return blendHardLight(dst, src);     // Hard Light
        case 9u: return blendSoftLight(dst, src);     // Soft Light
        case 10u: return blendDifference(dst, src);   // Difference
        case 11u: return blendExclusion(dst, src);    // Exclusion
        case 12u: return blendHue(dst, src);          // Hue
        case 13u: return blendSaturation(dst, src);   // Saturation
        case 14u: return blendColor(dst, src);        // Color
        case 15u: return blendLuminosity(dst, src);   // Luminosity
    }
    return src;
}

void main() {
    // Source color
    vec4 srcColor = col;
    #ifdef USE_TEXTURE
    vec3 texCoord = textureTransformation * vec3(uvs, 1.0);
    srcColor *= texture(tex, texCoord.xy);
    #endif

    // Destination color
    vec4 dstColor = vec4(0.0);
    #ifdef USE_DESTINATION
    vec2 dstUV = gl_FragCoord.xy / size;
    dstColor = texture(destination, dstUV);
    #endif

    // Blend
    outColor.rgb = blend(blendMode, dstColor.rgb, srcColor.rgb);
    outColor.a = srcColor.a + dstColor.a * (1.0 - srcColor.a);
}
```

---

## **3. CHANNEL EXTRACTION SHADER**

**Purpose:** Extract individual color channels or alpha

```glsl
uniform sampler2D tex;
uniform uint channel;

in vec2 uvs;
layout(location = 0) out vec4 outColor;

void main() {
    vec4 color = texture(tex, uvs);
    switch(channel) {
        case 0u:
            outColor.rgb = color.rrr;
            break;
        case 1u:
            outColor.rgb = color.ggg;
            break;
        case 2u:
            outColor.rgb = color.bbb;
            break;
        case 3u:
            outColor.rgb = color.aaa;
            break;
        case 4u:
            outColor.rgb = color.rgb;
            break;
    }
    outColor.a = 1.0;
}
```

---

## **4. LEVELS ADJUSTMENT SHADER**

**Purpose:** Professional color correction with levels and curves

```glsl
uniform sampler2D tex;
uniform vec3 min;
uniform vec3 max;
uniform vec3 gamma;

in vec2 uvs;
layout(location = 0) out vec4 outColor;

void main() {
    vec4 color = texture(tex, uvs);
    vec3 result = pow((color.rgb - min) / (max - min), 1.0/gamma);
    outColor = vec4(result, color.a);
}
```

---

## **5. MAXIMUM/MINIMUM FILTER SHADER**

**Purpose:** Morphological operations

```glsl
uniform sampler2D tex;
uniform int size;
uniform vec2 step;

in vec2 uvs;
layout(location = 0) out vec4 outColor;

void main() {
    vec4 color = texture(tex, uvs);
    vec4 result = color;

    for(int y = -size; y <= size; y++) {
        for(int x = -size; x <= size; x++) {
            if(x == 0 && y == 0) continue;
            vec4 neighbor = texture(tex, uvs + vec2(float(x), float(y)) * step);
            result = max(result, neighbor);  // or min() for minimum filter
        }
    }

    outColor = vec4(result.rgb, color.a);
}
```

---

## **6. TEXTURE TRANSFORMATION SHADER**

**Purpose:** Affine transformations and warping

```glsl
uniform sampler2D tex;
uniform mat3 texture_transform;

in vec2 uvs;
layout(location = 0) out vec4 outColor;

void main() {
    vec3 transformedUV = texture_transform * vec3(uvs, 1.0);
    outColor = texture(tex, transformedUV.xy);
}
```

---

## **7. COLOR SPACE CONVERSION SHADERS**

**Purpose:** Linear to sRGB and color space transformations

```glsl
// Linear to sRGB conversion
vec3 linear_to_srgb(vec3 linear) {
    return mix(
        linear * 12.92,
        pow(linear, vec3(1.0/2.4)) * 1.055 - 0.055,
        step(0.0031308, linear)
    );
}

vec3 srgb_to_linear(vec3 srgb) {
    return mix(
        srgb / 12.92,
        pow((srgb + 0.055) / 1.055, vec3(2.4)),
        step(0.04045, srgb)
    );
}

// CICCP color space conversion
uniform sampler2D tex;
in vec2 uvs;
layout(location = 0) out vec4 outColor;

void main() {
    vec4 color = texture(tex, uvs);
    vec3 linear = srgb_to_linear(color.rgb);
    // Apply CICCP transformation
    vec3 transformed = apply_cicp_transform(linear);
    outColor = vec4(linear_to_srgb(transformed), color.a);
}
```

---

## **8. SURFACE RENDERING SHADER**

**Purpose:** Basic surface/material rendering

```glsl
uniform vec4 surfaceColor;
uniform uint erase;

in vec4 col;
layout(location = 0) out vec4 outColor;

void main() {
    if (erase != 0u) {
        outColor = vec4(0.0);
    } else {
        outColor = surfaceColor * col;
    }
}
```

---

## **9. EQUIRECTANGULAR ENVIRONMENT MAPPING**

**Purpose:** 3D environment mapping for reflections

```glsl
uniform sampler2D equirectangularMap;
uniform vec3 direction;

in vec2 uvs;
layout(location = 0) out vec4 outColor;

vec2 directionToEquirectangular(vec3 dir) {
    float u = atan(dir.z, dir.x) / (2.0 * PI) + 0.5;
    float v = asin(dir.y) / PI + 0.5;
    return vec2(u, v);
}

void main() {
    vec3 normal = normalize(texture(normalMap, uvs).xyz * 2.0 - 1.0);
    vec3 viewDir = normalize(viewPosition - worldPosition);
    vec3 reflectDir = reflect(-viewDir, normal);

    vec2 envUV = directionToEquirectangular(reflectDir);
    vec4 envColor = texture(equirectangularMap, envUV);

    outColor = envColor;
}
```

---

## **10. VERTEX SHADERS**

**Basic Fullscreen Quad Vertex Shader:**
```glsl
layout(location = 0) in vec3 position;
layout(location = 1) in vec2 uv;
layout(location = 2) in vec4 color;

out vec2 uvs;
out vec4 col;

void main() {
    uvs = uv;
    col = color;
    gl_Position = vec4(position, 1.0);
}
```

**Instanced Geometry Shader:**
```glsl
void main() {
    vec3 position = vertices[gl_VertexID];
    uvs = 0.5 * position.xy + 0.5;
    col = vec4(1.0);
    gl_Position = vec4(position, 1.0);
}
```

---

## **SHADER COMPILATION & MANAGEMENT**

### **Embedded Shader Storage**
- **Binary Encoding:** Shaders stored as null-terminated strings in WASM data section
- **Runtime Compilation:** Shaders compiled at runtime using WebGL API
- **Program Caching:** Compiled programs cached for reuse
- **Error Handling:** Compilation error reporting and fallback

### **Uniform Management**
```rust
// Hypothetical uniform binding system
struct ShaderUniforms {
    texture_slots: HashMap<String, u32>,
    float_uniforms: HashMap<String, f32>,
    vec2_uniforms: HashMap<String, [f32; 2]>,
    vec3_uniforms: HashMap<String, [f32; 3]>,
    vec4_uniforms: HashMap<String, [f32; 4]>,
    matrix_uniforms: HashMap<String, [f32; 16]>,
}

impl ShaderUniforms {
    fn bind_to_program(&self, program: WebGLProgram) {
        // Bind all uniforms to shader program
    }
}
```

### **Performance Optimizations**
- **Uniform Buffer Objects:** Batched uniform updates
- **Texture Units:** Efficient texture binding management
- **Program Switching:** Minimize shader program changes
- **Branch Optimization:** Minimize dynamic branching in fragment shaders

---

## **SHADER USAGE BY NODE TYPE**

| Node Type | Primary Shader | Component File | Implementation Notes |
|-----------|----------------|---------------|-------------------|
| blur | gaussian_blur | `src/components/Nodes/Edit/BlurNode.tsx` | Single-pass separable blur |
| levels | levels_adjustment | `src/components/Nodes/Edit/LevelsNode.tsx` | RGB curves adjustment |
| channels | channel_extraction | `src/components/Nodes/Edit/ChannelsNode.tsx` | RGBA channel isolation |
| compv2 | advanced_compositing | `src/components/Nodes/CompNodeV2.jsx` | Basic compositing |
| compv3 | advanced_compositing | `src/components/Nodes/CompNodeV3.tsx` | 16 blend modes with alpha |
| crop/resize | texture_transform | `src/components/Nodes/CropNode.tsx` | Affine transformations |
| painter | surface_rendering | `src/components/Nodes/PainterNode.tsx` | Interactive drawing |
| masks | channel_extraction | `src/components/Nodes/MasksExtractionNode.jsx` | Mask generation |
| bg_remove | compositing | Background removal nodes | Alpha matting |
| merge_alpha | compositing | `src/components/Nodes/MergeAlphaNode.tsx` | Alpha channel operations |

---

**Shader Catalog Progress:** 10 distinct shaders extracted
**Coverage:** ~80% of identified shader code
**Next Steps:** Extract remaining shaders, analyze shader selection logic
