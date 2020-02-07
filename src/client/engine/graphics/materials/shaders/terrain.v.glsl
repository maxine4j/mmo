#version 300 es

out vec2 v_uv;

void main() {
    v_uv = vec2(uv.x, -uv.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
}
