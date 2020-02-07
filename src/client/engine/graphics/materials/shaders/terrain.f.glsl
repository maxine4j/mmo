#version 300 es

#define MAX_MAPS 8
#define DEPTH_ADJ 0.1

uniform lowp sampler2DArray u_diffuseMaps;
uniform lowp sampler2DArray u_depthMaps;
uniform lowp sampler2DArray u_blendMaps;
uniform int u_mapCount;
uniform vec2 u_tiling;

in vec2 v_uv;

out vec4 out_fragColor;

// vec3 multiBlend(vec2 tiledUV) {
//     float ma = -100.0;

//     float a[2]; // TODO: get from blend map texture
//     a[0] = 1.0;
//     a[1] = 0.25;

//     // find max alpha
//     for (int i = 0; i < MAX_MAPS; i++) {
//         vec4 px = texture2D(u_diffuseMaps[i], tiledUV);
//         float depth = texture2D(u_depthMaps[i], tiledUV).r;
//         // float depth = 0.25;
//         // float a = texture2D(u_blendMap[i], v_uv);
//         float a = a[i]; // TODO: add u_blendMap for painting
//         ma = max(ma, depth + a);

//         if (i >= u_mapCount) break;
//     }

//     ma -= DEPTH_ADJ;

//     vec4 px0 = texture2D(u_diffuseMaps[0], tiledUV);
//     float depth0 = texture2D(u_depthMaps[0], tiledUV).r;
//     // float depth = 0.25;
//     // float a = texture2D(u_blendMap[0], v_uv);
//     float a0 = a[0]; // TODO: add u_blendMap for painting
    
//     vec3 numer = px0.rgb * max(depth0 + a0 - ma, 0.0);
//     vec3 denom = px0.rgb;

//     for (int i = 1; i < MAX_MAPS; i++) {
//         vec4 px = texture2D(u_diffuseMaps[i], tiledUV);
//         float depth = texture2D(u_depthMaps[i], tiledUV).r;
//         // float depth = 0.25;
//         // float a = texture2D(u_blendMap[i], v_uv);
//         float a = a[i]; // TODO: add u_blendMap for painting
//         numer += px.rgb * max(depth + a - ma, 0.0);
//         denom += px.rgb;

//         if (i >= u_mapCount) break;
//     }

//     return numer / denom;
// }

vec3 blend(vec4 px0, float a0, vec4 px1, float a1) {
    float ma = max(px0.a + a0, px1.a + a1) - DEPTH_ADJ;
    float b0 = max(px0.a + a0 - ma, 0.0);
    float b1 = max(px1.a + a1 - ma, 0.0);
    return (px0.rgb * b0 + px1.rgb * b1) / (b0 + b1);
}

void main() {
    vec2 tiledUV = v_uv * u_tiling;

    vec4 px0 = texture(u_diffuseMaps, vec3(tiledUV, 0));
    vec4 px1 = texture(u_diffuseMaps, vec3(tiledUV, 1));
    px0.a = texture(u_depthMaps, vec3(tiledUV, 0)).r;
    px1.a = texture(u_depthMaps, vec3(tiledUV, 1)).r;
    
    // fragColor = vec4(px0.rgb, 1);

    out_fragColor = vec4(blend(px0, v_uv.x, px1, 1.0 - v_uv.x), 1);
    // out_fragColor = vec4(px0.rgb, 1);
    // gl_FragColor = vec4(multiBlend(tiledUV), 1);

    // fragColor = vec4(0.3,0.2,0.1,1.0);
}
