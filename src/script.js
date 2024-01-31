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
gui.addColor(uniforms.color1, 'value').name('Color 1');
gui.addColor(uniforms.color2, 'value').name('Color 2');

const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: pointsVS,
    fragmentShader: pointsFS,
    //transparent: true,
    //depthTest: false,
    //blending: THREE.AdditiveBlending,
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

/*
// starter
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Objects
const geometry = new THREE.TorusGeometry( .7, .2, 16, 100 );
//const geometry = new THREE.SphereGeometry(1, 32, 32)
//const geometry = new THREE.BoxGeometry(1, 1, 1, 20, 20, 20)

// Materials

const pointsMaterial = new THREE.PointsMaterial()
pointsMaterial.color = new THREE.Color(0xff0000)
pointsMaterial.size = 0.002

// Mesh
const shape = new THREE.Points(geometry,pointsMaterial)
scene.add(shape)

// Lights

const pointLight = new THREE.PointLight(0xffffff, 0.1)
pointLight.position.x = 2
pointLight.position.y = 3
pointLight.position.z = 4
scene.add(pointLight)

/**
 * Sizes

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera

// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 2
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer

const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate


const clock = new THREE.Clock()

const tick = () =>
{

    const elapsedTime = clock.getElapsedTime()

    // Update objects
    shape.rotation.y = .05 * elapsedTime

    // Update Orbital Controls
    // controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
*/