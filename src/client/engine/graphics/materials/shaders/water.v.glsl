#version 300 es

//---------- THREE JS MESH LAMBERT SHADER LIB ----------
#define LAMBERT
varying vec3 vLightFront;
varying vec3 vIndirectFront;
#ifdef DOUBLE_SIDED
	varying vec3 vLightBack;
	varying vec3 vIndirectBack;
#endif
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <envmap_pars_vertex>
#include <bsdfs>
#include <lights_pars_begin>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
//---------- END THREE JS ----------

uniform highp float u_amplitude;
uniform highp float u_wavelength;
uniform highp float u_time;

out vec2 v_uv;
out vec3 v_normal;

float rand3D(in vec3 co) {
    return fract(sin(dot(co.xyz, vec3(12.9898, 78.233, 144.7272))) * 43758.5453);
}

float simpleInterpolate(in float a, in float b, in float x) {
   return a + smoothstep(0.0, 1.0, x) * (b - a);
}

float interpolatedNoise3D(in float x, in float y, in float z) {
    float integer_x = x - fract(x);
    float fractional_x = x - integer_x;

    float integer_y = y - fract(y);
    float fractional_y = y - integer_y;

    float integer_z = z - fract(z);
    float fractional_z = z - integer_z;

    float v1 = rand3D(vec3(integer_x, integer_y, integer_z));
    float v2 = rand3D(vec3(integer_x + 1.0, integer_y, integer_z));
    float v3 = rand3D(vec3(integer_x, integer_y + 1.0, integer_z));
    float v4 = rand3D(vec3(integer_x + 1.0, integer_y + 1.0, integer_z));

    float v5 = rand3D(vec3(integer_x, integer_y, integer_z + 1.0));
    float v6 = rand3D(vec3(integer_x + 1.0, integer_y, integer_z + 1.0));
    float v7 = rand3D(vec3(integer_x, integer_y + 1.0, integer_z + 1.0));
    float v8 = rand3D(vec3(integer_x + 1.0, integer_y + 1.0, integer_z + 1.0));

    float i1 = simpleInterpolate(v1, v5, fractional_z);
    float i2 = simpleInterpolate(v2, v6, fractional_z);
    float i3 = simpleInterpolate(v3, v7, fractional_z);
    float i4 = simpleInterpolate(v4, v8, fractional_z);

    float ii1 = simpleInterpolate(i1, i2, fractional_x);
    float ii2 = simpleInterpolate(i3, i4, fractional_x);

    return simpleInterpolate(ii1, ii2, fractional_y);
}

float noise3D(in vec3 coord, in float wavelength) {
   return interpolatedNoise3D(coord.x / wavelength, coord.y / wavelength, coord.z / wavelength);
}

void main() {
    v_uv = vec2(uv.x, -uv.y);
    v_normal = normal;

    //---------- THREE JS MESH LAMBERT SHADER LIB ----------
    #include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <lights_lambert_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
    //---------- END THREE JS ----------

	float noise = noise3D(position.xyz, u_wavelength);
	float offset = sin(noise) * u_amplitude;
	gl_Position = mix(gl_Position, gl_Position + vec4(0.0, offset, 0.0, 0.0), sin(u_time));
}
