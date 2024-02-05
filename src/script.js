import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

// Visualizer imports
import createSphereVisualizer from './visualizers/pointSphere'
import createParticleCloudVisualizer from './visualizers/particleCloud'
import createPlaneVisualizer from './visualizers/particlePlane'

// Setting up the scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 2000 );
camera.position.set(1.0, 1.5, 1.0)

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.05;

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
    u_segments: { value: 128 },
};

const gui = new dat.GUI();

// further visualizers can be added here
// ...

const sphereVisualizer = createSphereVisualizer(uniforms);
const particleCloudVisualizer = createParticleCloudVisualizer(uniforms);
const particlePlaneVisualizer = createPlaneVisualizer(uniforms);

scene.add(sphereVisualizer);

const visualizers = {
    "sphere": sphereVisualizer,
    "particle cloud": particleCloudVisualizer,
    "particle plane": particlePlaneVisualizer,
  };

gui.add({ visualizer: 'sphere' }, 'visualizer', Object.keys(visualizers)).onChange((value) => {
    if (value === 'particle cloud') {
        controls.minDistance = 1;
        controls.maxDistance = 20;
    }
    if (value === 'particle plane') {
        controls.autoRotate = false;
    }
    switchVisualizer(scene, visualizers[value]);
});

const sphereFolder = gui.addFolder('Particle sphere');
sphereFolder.addColor(new function() {
    this.color1 = '#' + uniforms.color1.value.getHexString();
  }, 'color1').onChange(function(value) {
    uniforms.color1.value.set(value);
  });
sphereFolder.addColor(new function() {
    this.color2 = '#' + uniforms.color2.value.getHexString();
  }, 'color2').onChange(function(value) {
    uniforms.color2.value.set(value);
});

sphereFolder.add(uniforms.u_segments, 'value').min(8).max(256).step(1).name('Segments').onChange((value) => {
    switchVisualizer(scene, createSphereVisualizer({ ...uniforms, u_segments: { value } }));
    //visualizer = createSphereVisualizer(uniforms);
});

const particleCloudFolder = gui.addFolder('Particle cloud');
particleCloudFolder.addColor(new function() {
    this.color1 = '#' + uniforms.color1.value.getHexString();
  }, 'color1').onChange(function(value) {
    uniforms.color1.value.set(value);
  });
particleCloudFolder.addColor(new function() {
    this.color2 = '#' + uniforms.color2.value.getHexString();
  }, 'color2').onChange(function(value) {
    uniforms.color2.value.set(value);
});




// Animation
function animate() {
    requestAnimationFrame(animate);
  
    uniforms.u_time.value = performance.now() / 1000;
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
  
    controls.update();
    renderer.render(scene, camera);
  }
  
  animate();
