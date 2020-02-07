#version 300 es

#define MAX_MAPS 256
#define DEPTH_ADJ 0.1
#define DEPTH_MAP_STR 0.25


//---------- THREE JS MESH LAMBERT SHADER LIB ----------
uniform vec3 emissive;
uniform float opacity;
varying vec3 vLightFront;
varying vec3 vIndirectFront;
#ifdef DOUBLE_SIDED
	varying vec3 vLightBack;
	varying vec3 vIndirectBack;
#endif
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <fog_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
//---------- END THREE JS ----------


uniform highp sampler2DArray u_diffuseMaps;
uniform highp sampler2DArray u_depthMaps;
uniform highp sampler2DArray u_blendMaps;
uniform int u_mapCount;
uniform vec2 u_tiling;

in vec2 v_uv;
in vec3 v_position;
in vec3 v_normal;

out vec4 out_fragColor;

vec3 terrainBlend(vec2 tiledUV) {
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
    vec3 diffuse = terrainBlend(tiledUV);

    //---------- THREE JS MESH LAMBERT SHADER LIB ----------
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <emissivemap_fragment>
	reflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );
	#ifdef DOUBLE_SIDED
		reflectedLight.indirectDiffuse += ( gl_FrontFacing ) ? vIndirectFront : vIndirectBack;
	#else
		reflectedLight.indirectDiffuse += vIndirectFront;
	#endif
	#include <lightmap_fragment>
	reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );
	#ifdef DOUBLE_SIDED
		reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;
	#else
		reflectedLight.directDiffuse = vLightFront;
	#endif
	reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>

    out_fragColor = vec4(outgoingLight, 1.0);

	// #include <tonemapping_fragment>
    #if defined( TONE_MAPPING )
        out_fragColor.rgb = toneMapping( out_fragColor.rgb );
    #endif

	// #include <encodings_fragment>
    out_fragColor = linearToOutputTexel( out_fragColor );

	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
    //---------- END THREE JS ----------

}
