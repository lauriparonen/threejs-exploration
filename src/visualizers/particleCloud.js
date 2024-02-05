import * as THREE from 'three';

const particleCloudVS  = `
    attribute float vertexIndex;

    uniform float u_time;
    uniform vec2 u_resolution;
    uniform sampler2D u_audioData;

    void main() {

        float audioData = texture2D(u_audioData, vec2(vertexIndex / -2048.0, 0.5)).r;
        //float audioData = texture2D(u_audioData, vec2(vertexIndex / 2048.0, 0.5)).r;

        vec3 newPosition = position + normalize(position) * audioData * 20.6;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

        gl_PointSize = sin(vertexIndex *0.6) * 3.0;

        gl_PointSize *= sin(audioData * 1.01) * 1.5; 

    }
`;

const particleCloudFS = `
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform sampler2D u_audioData;

    uniform vec3 color1;
    uniform vec3 color2;

    void main() {
        
        //float audioData = texture2D(u_audioData, vec2(gl_PointCoord.x, 0.5)).r;
        float audioData = texture2D(u_audioData, vec2(gl_PointCoord.x, 0.5)).r;

        vec3 color = mix(color1, color2, audioData);

        gl_FragColor = vec4(color, 1.0);
        gl_FragColor += abs(sin(audioData * 2.0) * 1.2); 
}
`;

export default function createParticleCloudVisualizer(uniforms) {
    const geometry = new THREE.BufferGeometry();
    const count = 8000;
    const positions = new Float32Array(count * 3);
    const vertexIndices = new Float32Array(count);
    //const vertexIndices = [...Array(count).keys()];
    
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 100;
        positions[i3 + 1] = (Math.random() - 0.5) * 100;
        positions[i3 + 2] = (Math.random() - 0.5) * 100;
        vertexIndices[i] = i;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('vertexIndex', new THREE.BufferAttribute(vertexIndices, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: particleCloudVS,
        fragmentShader: particleCloudFS,
    });
    console.log(material.uniforms);
    return new THREE.Points(geometry, material);
}