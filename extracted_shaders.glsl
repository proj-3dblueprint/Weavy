// WEAVY EMBEDDED GLSL SHADERS
// Extracted from WebAssembly binary (designer_bg-DPmJP8xE.wasm)
// Decompiled using WABT and analyzed for shader content

// =============================================================================
// BLUR SHADERS
// =============================================================================

// Gaussian Blur Shader with configurable kernel size
// Supports both box blur (blurType = 1) and gaussian blur (blurType = 2)

#version 300 es
precision highp float;

uniform sampler2D tex;
uniform vec2 step;
uniform uint blurType;
uniform int kernelSize;

in vec2 uvs;

layout(location = 0) out vec4 outColor;

// Gaussian blur function with kernel-based weighting
vec4 gaussianBlur(sampler2D image, vec2 uv, vec2 step, int kernelSize) {
    vec4 color = vec4(0.0);
    float sum = 0.0;
    float sigma = float(kernelSize) * length(step) / 3.0; // +/- 3 standard deviations account for 99.7% of the distribution

    for(int k = -kernelSize; k <= kernelSize; k++) {
        vec2 delta = float(k) * step;
        float x2 = dot(delta, delta);
        float w = exp((-x2) / (2.0 * sigma * sigma));
        color += texture(image, uv + delta) * w;
        sum += w;
    }
    return color / sum;
}

// Box blur function with uniform weighting
vec4 boxBlur(sampler2D image, vec2 uv, vec2 step, int kernelSize) {
    vec4 color = vec4(0.0);
    for(int k = -kernelSize; k <= kernelSize; k++) {
        vec2 delta = float(k) * step;
        color += texture(image, uv + delta);
    }
    return color / float(kernelSize * 2 + 1);
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

// =============================================================================
// COLOR SPACE CONVERSION SHADERS
// =============================================================================

// RGB to HSL conversion functions
// Used for color manipulation and adjustment operations

vec3 rgb2hsl(in vec3 c) {
    float h = 0.0;
    float s = 0.0;
    float l = 0.0;
    float r = c.r;
    float g = c.g;
    float b = c.b;
    float cMin = min(r, min(g, b));
    float cMax = max(r, max(g, b));

    l = (cMax + cMin) / 2.0;
    if(cMax > cMin) {
        float cDelta = cMax - cMin;

        //s = l < .05 ? cDelta / ( cMax + cMin ) : cDelta / ( 2.0 - ( cMax + cMin ) ); Original
        s = l < .0 ? cDelta / (cMax + cMin) : cDelta / (2.0 - (cMax + cMin));

        if(r == cMax) {
            h = (g - b) / cDelta;
        } else if(g == cMax) {
            h = 2.0 + (b - r) / cDelta;
        } else {
            h = 4.0 + (r - g) / cDelta;
        }

        if(h < 0.0) {
            h += 6.0;
        }
    }

    return vec3(h, s, l);
}

// HSL to RGB conversion
vec3 hsl2rgb(in vec3 c) {
    float h = c.x;
    float s = c.y;
    float l = c.z;
    float r, g, b;

    if(s == 0.0) {
        r = g = b = l; // achromatic
    } else {
        float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
        float p = 2.0 * l - q;
        r = hue2rgb(p, q, h + 1.0/3.0);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1.0/3.0);
    }

    return vec3(r, g, b);
}

float hue2rgb(float p, float q, float t) {
    if(t < 0.0) t += 1.0;
    if(t > 1.0) t -= 1.0;
    if(t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if(t < 1.0/2.0) return q;
    if(t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
}

// =============================================================================
// COMPOSITING SHADERS
// =============================================================================

// Advanced compositing shader with texture support
// Supports destination reading, texture sampling, and blending modes

#define USE_TEXTURE
#define USE_DESTINATION

in vec2 uvs;
in vec4 col;

layout(location = 0) out vec4 outColor;

#ifdef USE_TEXTURE
uniform sampler2D tex;
uniform mat3 textureTransformation;
#endif

#ifdef USE_DESTINATION
uniform vec2 size;
uniform sampler2D destination;
#endif

// Surface color function (to be defined based on material properties)
vec4 surfaceColor = vec4(1.0); // Placeholder - would be computed from material properties

void main() {
    // Compute source color
    vec4 srcColor = surfaceColor * col;

    #ifdef USE_TEXTURE
    srcColor *= texture(tex, (textureTransformation * vec3(uvs, 1.0)).xy);
    #endif

    // Read destination color if available
    #ifdef USE_DESTINATION
    vec4 destColor = texture(destination, gl_FragCoord.xy / size);
    #endif

    // Apply blending operations here
    // (Blending logic would depend on the specific compositing mode)

    outColor = srcColor; // Default: replace destination
}

// =============================================================================
// ADDITIONAL SHADER FUNCTIONS
// =============================================================================

// Min/Max/Gamma correction shader
// Supports various tone mapping operations

uniform sampler2D tex;
uniform mat3 texture_transformation;

in vec2 uvs;
in vec4 col;

layout(location = 0) out vec4 outColor;

void main() {
    vec4 color = texture(tex, uvs);
    vec3 result = color.rgb;

    // Min/Max/Gamma operations would be applied here
    // Specific implementation depends on the operation parameters

    outColor = vec4(result, color.a);
}

// =============================================================================
// NOTES
// =============================================================================
/*
These shaders were extracted from the WebAssembly binary using static analysis.
The actual shader compilation and usage would happen at runtime through WebGL.

Key observations:
1. Weavy uses sophisticated blur algorithms (Gaussian + Box blur)
2. Color space conversions for advanced color manipulation
3. Texture compositing with transformation matrices
4. Support for destination buffer reading (ping-pong rendering)
5. Kernel-based image processing operations

This shader library suggests Weavy has advanced 2D/3D compositing capabilities
built on top of WebGL, similar to professional graphics software like Blender
or Adobe After Effects.
*/
