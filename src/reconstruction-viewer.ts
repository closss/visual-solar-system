import './styles/reconstruction.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const modelPath = '/doc/demo_outputs/scannet_scene0000_00/scene0000_00_6views.glb';
const cameraPath = '/doc/demo_outputs/scannet_scene0000_00/scene0000_00_6views.cameras.json';
const inputFrames = ['0000.jpg', '0100.jpg', '0200.jpg', '0300.jpg', '0400.jpg', '0500.jpg'];

const root = document.querySelector<HTMLDivElement>('#viewer');
if (!root) throw new Error('Missing #viewer root');

root.innerHTML = `
  <main class="viewer-shell">
    <section class="viewport">
      <canvas id="reconstructionCanvas" aria-label="MapAnything 3D reconstruction viewer"></canvas>
      <div class="hud">
        <strong>MapAnything / ScanNet scene0000_00</strong>
        <span id="status">加载重建结果...</span>
      </div>
    </section>
    <aside class="side-panel">
      <header>
        <p>Offline 3D Reconstruction</p>
        <h1>6 视角重建演示</h1>
      </header>
      <dl>
        <div><dt>输入</dt><dd>6 张普通 RGB 帧</dd></div>
        <div><dt>输出</dt><dd>GLB 三维场景 + camera JSON</dd></div>
        <div><dt>交互</dt><dd>拖拽旋转，滚轮缩放</dd></div>
      </dl>
      <div class="thumbs">
        ${inputFrames.map((name) => `<img src="/doc/demo_outputs/scannet_scene0000_00/${name}" alt="input frame ${name}" />`).join('')}
      </div>
      <a class="download" href="${modelPath}" download>下载 GLB</a>
    </aside>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#reconstructionCanvas');
const status = document.querySelector<HTMLElement>('#status');
if (!canvas || !status) throw new Error('Missing viewer nodes');
const viewerCanvas = canvas;

const renderer = new THREE.WebGLRenderer({ canvas: viewerCanvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111513);

const camera = new THREE.PerspectiveCamera(48, 1, 0.01, 1000);
camera.position.set(0.45, 0.35, 1.6);

const controls = new OrbitControls(camera, viewerCanvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 0, 0);

scene.add(new THREE.HemisphereLight(0xffffff, 0x27312c, 1.6));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(3, 4, 5);
scene.add(keyLight);

const grid = new THREE.GridHelper(2, 20, 0x45605a, 0x26302d);
grid.position.y = -0.08;
scene.add(grid);

function resize(): void {
  const rect = viewerCanvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);
}

function frameObject(object: THREE.Object3D): void {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) || 1;

  controls.target.copy(center);
  camera.near = Math.max(radius / 1000, 0.001);
  camera.far = radius * 100;
  camera.position.copy(center).add(new THREE.Vector3(radius * 0.75, radius * 0.45, radius * 1.35));
  camera.updateProjectionMatrix();
  controls.update();
}

new GLTFLoader().load(
  modelPath,
  async (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    frameObject(model);

    const cameras = await fetch(cameraPath).then((response) => response.json()) as unknown[];
    status.textContent = `已加载：${cameras.length} 个估计相机，GLB 可旋转查看`;
  },
  undefined,
  (error) => {
    console.error(error);
    status.textContent = '加载失败：请确认 GLB 文件存在';
  },
);

window.addEventListener('resize', resize);
resize();

function animate(): void {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
