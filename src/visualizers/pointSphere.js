import * as THREE from 'three';

const pointsVS = `
    attribute float vertexIndex;

    uniform float u_time;
    uniform vec2 u_resolution;
    uniform sampler2D u_audioData;

    void main() {

        float audioData = texture2D(u_audioData, vec2(vertexIndex / -2048.0, 0.5)).r;
        //float audioData = texture2D(u_audioData, vec2(vertexIndex / 2048.0, 0.5)).r;

        vec3 newPosition = position + normalize(position) * audioData * 0.6;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

        // This changes the size of the points with the sin of the vertexIndex
        // resulting in a spiral effect across the sphere
        gl_PointSize = sin(vertexIndex *0.6) * 3.0;

        // and this causes the spiral to appear only when the audio is playing
        gl_PointSize *= sin(audioData * 1.01) * 1.5; // edit the coefficient to change sensitivity

        //gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        //gl_PointSize = 2.0 + sin(vertexIndex * 50.1);
        //gl_PointSize += sin(u_time * 2.0) * 2.0;
    }
`;

const pointsFS = `
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
        gl_FragColor += abs(sin(audioData * 2.0) * 1.2); // alter the colors per the audio data
        //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // red color
}
`;

export default function createSphereVisualizer(uniforms) {
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const vertexIndices = [...Array(geometry.getAttribute('position').count).keys()];
    geometry.setAttribute('vertexIndex', new THREE.Float32BufferAttribute(vertexIndices, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: pointsVS,
        fragmentShader: pointsFS,
    });
    console.log(material.uniforms);
    return new THREE.Points(geometry, material);
}