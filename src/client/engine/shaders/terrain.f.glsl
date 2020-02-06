#define MAX_MAPS 16

varying vec2 v_uv;
uniform sampler2D u_maps[MAX_MAPS];
uniform sampler2D u_diffuse0;
uniform sampler2D u_depth0;
uniform sampler2D u_diffuse1;
uniform sampler2D u_depth1;

vec3 blend(vec4 px0, float a0, vec4 px1, float a1)
{
    float depth = 0.2;
    float ma = max(px0.a + a0, px1.a + a1) - depth;

    float b0 = max(px0.a + a0 - ma, 0.0);
    float b1 = max(px1.a + a1 - ma, 0.0);

    return (px0.rgb * b0 + px1.rgb * b1) / (b0 + b1);
}

void main() {
    vec4 px0 = texture2D(u_diffuse0, v_uv);
    vec4 px1 = texture2D(u_diffuse1, v_uv);

    gl_FragColor = vec4(blend(px0, 1.0, px1, 1.0), 1);
}
