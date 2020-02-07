#version 300 es

#define MAX_MAPS 256
#define DEPTH_ADJ 0.1
#define DEPTH_MAP_STR 0.0

uniform highp sampler2DArray u_diffuseMaps;
uniform highp sampler2DArray u_depthMaps;
uniform highp sampler2DArray u_blendMaps;
uniform int u_mapCount;
uniform vec2 u_tiling;

in vec2 v_uv;

out vec4 out_fragColor;

vec3 blend2(vec2 tiledUV) {
    float maxDepth = -100.0;
    for (int i = 0; i < MAX_MAPS; i++) {
        float depth = DEPTH_MAP_STR * texture(u_depthMaps, vec3(tiledUV, i)).r;
        float blend = texture(u_blendMaps, vec3(v_uv, i)).r;
        maxDepth = max(maxDepth, depth * blend);
        if (i >= u_mapCount) break;
    }
    maxDepth -= DEPTH_ADJ;

    vec3 numer = vec3(0, 0, 0);
    float denom = 0.0;
    for (int i = 0; i < MAX_MAPS; i++) {
        float depth = DEPTH_MAP_STR * texture(u_depthMaps, vec3(tiledUV, i)).r;
        float blend = texture(u_blendMaps, vec3(v_uv, i)).r;
        vec3 diffuse = texture(u_diffuseMaps, vec3(tiledUV, i)).rgb;
        blend = max((depth) - maxDepth, 0.0) * blend;
        numer += diffuse * blend;
        denom += blend;
        if (i >= u_mapCount) break;
    }
 
    return numer / denom;
}

void main() {
    vec2 tiledUV = v_uv * u_tiling;
        
    vec4 px0 = texture(u_diffuseMaps, vec3(tiledUV, 0));
    vec4 px1 = texture(u_diffuseMaps, vec3(tiledUV, 1));
    px0.a = texture(u_depthMaps, vec3(tiledUV, 0)).r;
    px1.a = texture(u_depthMaps, vec3(tiledUV, 1)).r;

    out_fragColor = vec4(blend2(tiledUV), 1.0);
}
