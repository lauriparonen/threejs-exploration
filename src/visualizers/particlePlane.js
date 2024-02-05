import * as THREE from 'three';

const planeVS = `
    uniform sampler2D u_audioData;
    uniform float u_segments;
    uniform float u_time;

    attribute float vertexIndex;
    attribute float rowIndex;
    attribute float colIndex;

    void main() {
        //vec2 uv = vec2(vertexIndex / 2048.0, 0.5);
        //float audioData = texture2D(u_audioData, vec2(vertexIndex / u_segments, 0.5)).r;
        vec2 uv = vec2(colIndex / u_segments, rowIndex / u_segments);
        float audioData = texture2D(u_audioData, uv).r;
        
        float low = texture2D(u_audioData, vec2(0.0, 0.5)).r;
        float mid = texture2D(u_audioData, vec2(0.5, 0.5)).r;
        float high = texture2D(u_audioData, vec2(1.0, 0.5)).r;
        vec3 position = position;

        vec3 newPosition = position + vec3(0.0, 0.0, audioData * 0.6);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        gl_PointSize = 2.0;

        
    }

`;

const planeFS = `
    uniform sampler2D u_audioData;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float u_time;

    void main() {
        float audioData = texture2D(u_audioData, vec2(gl_PointCoord.x, 0.5)).r;
        
        //vec3 color = mix(color1, color2, audioData);
        vec3 color = mix(color1, color2, audioData * 2.0);
        gl_FragColor = vec4(color, 1.0);
        //gl_FragColor += abs(sin(u_time * 0.5));
        gl_FragColor += audioData;
    }
`;

export default function createPlaneVisualizer(uniforms) {
    const geometry = new THREE.PlaneGeometry(2, 2, uniforms.u_segments.value, uniforms.u_segments.value);
    //const vertexIndices = [...Array(geometry.getAttribute('position').count).keys()];
    //geometry.setAttribute('vertexIndex', new THREE.Float32BufferAttribute(vertexIndices, 1));
  
    const vertexIndices = [];
    const rowIndex = [];
    const colIndex = [];

    for (let i = 0; i < geometry.getAttribute('position').count; i++) {
        vertexIndices.push(i)
        rowIndex.push(Math.floor(i / (uniforms.u_segments.value + 1)))
        colIndex.push(i % (uniforms.u_segments.value + 1))
    }
    geometry.setAttribute('vertexIndex', new THREE.Float32BufferAttribute(vertexIndices, 1));
    geometry.setAttribute('rowIndex', new THREE.Float32BufferAttribute(rowIndex, 1));
    geometry.setAttribute('colIndex', new THREE.Float32BufferAttribute(colIndex, 1));

    console.log(rowIndex);
    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: planeVS,
      fragmentShader: planeFS,
    });
  
    return new THREE.Points(geometry, material);
  }