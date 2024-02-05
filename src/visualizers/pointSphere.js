import * as THREE from 'three';
import * as dat from 'dat.gui';

const pointsVS = `
    attribute float vertexIndex;

    uniform float u_time;
    uniform vec2 u_resolution;
    uniform sampler2D u_audioData;

    void main() {

        float lowFreq = texture2D(u_audioData, vec2(0.0, 0.5)).r;
        float midFreq = texture2D(u_audioData, vec2(0.5, 0.5)).r;
        float highFreq = texture2D(u_audioData, vec2(1.0, 0.5)).r;

        float audioData = texture2D(u_audioData, vec2(vertexIndex / -2048.0, 0.5)).r;
        //float audioData = texture2D(u_audioData, vec2(vertexIndex / 2048.0, 0.5)).r;

        vec3 newPosition = position + normalize(position) * audioData * 0.6;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

        // This changes the size of the points with the sin of the vertexIndex
        // resulting in a spiral effect across the sphere
        gl_PointSize = sin(vertexIndex *0.6) * 3.0;

        // and this causes the spiral to appear only when the audio is playing
        gl_PointSize *= sin(audioData * 1.0) * 1.5; // edit the coefficient to change sensitivity

    }
`;

const pointsFS = `
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform sampler2D u_audioData;

    uniform vec3 color1;
    uniform vec3 color2;



    void main() {
        
        float lowFreq = texture2D(u_audioData, vec2(0.0, 0.5)).r;
        float midFreq = texture2D(u_audioData, vec2(0.5, 0.5)).r;
        float highFreq = texture2D(u_audioData, vec2(1.0, 0.5)).r;

        
        //float audioData = texture2D(u_audioData, vec2(gl_PointCoord.x, 0.5)).r;
        float audioData = texture2D(u_audioData, vec2(gl_PointCoord.x, 0.5)).r;
        //float audioData = mix(color1, color2, midFreq + highFreq - lowFreq).r; // mix the colors based on the audio data

        vec3 color = mix(color1, color2, audioData);

        gl_FragColor = vec4(color, 1.0);
        gl_FragColor += abs(sin(audioData * 2.0) * 1.2); 
}
`;

export default function createSphereVisualizer(uniforms) {
    const geometry = new THREE.SphereGeometry(1, uniforms.u_segments.value, uniforms.u_segments.value);
    const vertexIndices = [...Array(geometry.getAttribute('position').count).keys()];
    geometry.setAttribute('vertexIndex', new THREE.Float32BufferAttribute(vertexIndices, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: { ...uniforms,
                    u_segments: { value: 128 },
                },
        vertexShader: pointsVS,
        fragmentShader: pointsFS,
    });
    console.log(material.uniforms.u_segments.value);
    return new THREE.Points(geometry, material);
}