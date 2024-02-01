import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

// Visualizer imports
import createSphereVisualizer from './visualizers/pointSphere'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 2000 );
camera.position.set(1.0, 1.5, 1.0)

const gui = new dat.GUI();

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// Audio
let audioContext, audioSource, audioAnalyser, frequencyData;
const audioElement = document.createElement('audio');
audioElement.crossOrigin = 'anonymous';
audioElement.controls = true;
document.body.appendChild(audioElement);

const inputElement = document.createElement('input');
inputElement.type = 'file';
inputElement.accept = 'audio/*';
inputElement.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      audioElement.src = url;
  
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioSource = audioContext.createMediaElementSource(audioElement);
      audioAnalyser = audioContext.createAnalyser();
      audioSource.connect(audioAnalyser);
      audioSource.connect(audioContext.destination);
  
      frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
    }
  });
document.body.appendChild(inputElement);

function switchVisualizer(scene, newVisualizer) {
    scene.remove(scene.children.find(child => child instanceof THREE.Points));
    scene.add(newVisualizer);
}

const uniforms = {
    u_time: { value: 0.0 },
    u_resolution: { value: new THREE.Vector2() },
    u_audioData: { value: null },
    color1: { value: new THREE.Color(0xff0000) },
    color2: { value: new THREE.Color(0x0000ff) },
};

const sphereVisualizer = createSphereVisualizer(uniforms);
scene.add(sphereVisualizer);

gui.add({ visualizer: 'sphere' }, 'visualizer', ['sphere']).onChange((value) => {
    switch (value) {
      case 'sphere':
        switchVisualizer(scene, sphereVisualizer);
        break;
    }
  });

// Animation
function animate() {
    requestAnimationFrame(animate);
  
    if (audioAnalyser) {
      audioAnalyser.getByteFrequencyData(frequencyData);
      const dataTexture = new THREE.DataTexture(
        frequencyData,
        frequencyData.length,
        1,
        THREE.RedFormat,
        THREE.UnsignedByteType,
        THREE.UnsignedByteType
      );
      dataTexture.needsUpdate = true;
      uniforms.u_audioData.value = dataTexture;
    }
  
    uniforms.u_time.value += 0.01;
  
    controls.update();
    renderer.render(scene, camera);
  }
  
  animate();

/*
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

const pointsVS = `
    attribute float vertexIndex;

    uniform float u_time;
    uniform vec2 u_resolution;
    uniform sampler2D u_audioData;


    void main() {


        // Play around with the vertexIndex to get different effects
        // eg. when n at vec2(vertexIndex / n) is negative,
        // the shape expands and shrinks in unison;
        // when positive, the dots jump around individually according to the frequency data
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
        //vec3 color1 = vec3(1.0, 0.0, 0.0);
        //vec3 color2 = vec3(0.0, 0.654, 0.0);

        //float audioData = texture2D(u_audioData, vec2(gl_PointCoord.x, 0.5)).r;
        float audioData = texture2D(u_audioData, vec2(gl_PointCoord.x, 0.5)).r;

        vec3 color = mix(color1, color2, audioData);

        gl_FragColor = vec4(color, 1.0);
        gl_FragColor += abs(sin(audioData * 2.0) * 1.2); // alter the colors per the audio data
        //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // red color
}
`;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 2000 );
camera.position.set(1.0, 1.5, 1.0) 

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement);

const geometry = new THREE.SphereGeometry(1, 64, 64);
const vertexIndices = [...Array(geometry.getAttribute('position').count).keys()];
geometry.setAttribute('vertexIndex', new THREE.Float32BufferAttribute(vertexIndices, 1));

const uniforms = {
    u_time: { value: 0.0 },
    u_resolution: { value: new THREE.Vector2() },
    u_audioData: { value: null },
    color1: { value: new THREE.Color(0xff0000) },
    color2: { value: new THREE.Color(0x0000ff) },
};

const gui = new dat.GUI();

// Add color controllers for nuanced color changes
gui.addColor(new function() {
    this.color1 = '#' + uniforms.color1.value.getHexString();
  }, 'color1').onChange(function(value) {
    uniforms.color1.value.set(value);
  });
  gui.addColor(new function() {
    this.color2 = '#' + uniforms.color2.value.getHexString();
  }, 'color2').onChange(function(value) {
    uniforms.color2.value.set(value);
  });

const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: pointsVS,
    fragmentShader: pointsFS,
});

const points = new THREE.Points(geometry, material);
scene.add(points);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// Audio
let audioContext, audioSource, audioAnalyser, frequencyData;
const audioElement = document.createElement('audio');
audioElement.crossOrigin = 'anonymous';
audioElement.controls = true;
//audioElement.style.display = 'none';
document.body.appendChild(audioElement);

const inputElement = document.createElement('input');
inputElement.type = 'file';
inputElement.accept = 'audio/*';
inputElement.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      audioElement.src = url;
  
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioSource = audioContext.createMediaElementSource(audioElement);
      audioAnalyser = audioContext.createAnalyser();
      audioSource.connect(audioAnalyser);
      audioSource.connect(audioContext.destination);
  
      frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
    }
  });
  document.body.appendChild(inputElement);

// Animation
function animate() {
    requestAnimationFrame(animate)

    if (audioAnalyser) {
        audioAnalyser.getByteFrequencyData(frequencyData);
        const dataTexture = new THREE.DataTexture(
            frequencyData,
            frequencyData.length,
            1,
            THREE.RedFormat,
            THREE.UnsignedByteType,
            THREE.UnsignedByteType
          );
          dataTexture.needsUpdate = true;
          uniforms.u_audioData.value = dataTexture;
    }

    uniforms.u_time.value += 0.01;

    controls.update();
    renderer.render(scene, camera);
}

animate();
*/
