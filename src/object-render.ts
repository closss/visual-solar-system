import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { heritageArtifacts, type HeritageArtifact } from './data/heritage-artifacts';
import { createMultiviewPoses, parseRenderFlags, parseRenderPose } from './multiview-render-config';

const root = document.querySelector<HTMLDivElement>('#renderRoot');
if (!root) throw new Error('Missing render root');

root.innerHTML = `
  <style>
    body { margin: 0; overflow: hidden; background: #f4f0e8; }
    #renderCanvas { display: block; width: 512px; height: 512px; }
    #ready { position: fixed; left: -999px; top: -999px; }
  </style>
  <canvas id="renderCanvas" width="512" height="512"></canvas>
  <div id="ready">loading</div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#renderCanvas');
const ready = document.querySelector<HTMLElement>('#ready');
if (!canvas || !ready) throw new Error('Missing render nodes');
const renderCanvas = canvas;
const readyNode = ready;

const params = new URLSearchParams(window.location.search);
const artifactId = params.get('artifact') ?? 'stanford-bunny';
const angle = Number(params.get('angle') ?? 0);
const fit = Number(params.get('fit') ?? 1.65);
const sourcePath = params.get('source');
const pose = parseRenderPose(params);
const renderFlags = parseRenderFlags(params);
const useStudio = renderFlags.studio;
const maskMode = renderFlags.mask;
const batchMode = params.get('batch') === '1';
const artifact = heritageArtifacts.find((item) => item.id === artifactId) ?? heritageArtifacts[3];

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setSize(512, 512, false);
renderer.setPixelRatio(1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(maskMode ? 0x000000 : useStudio ? 0xd8dde2 : 0xf4f0e8);
const maskMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
gltfLoader.setDRACOLoader(dracoLoader);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20);
camera.position.set(0, 0.35, 3.1);

scene.add(new THREE.HemisphereLight(0xffffff, 0xc9b59b, 2.4));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(2.6, 3.6, 4.2);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x87c9ff, 1.2);
fillLight.position.set(-3.2, 1.2, 2.8);
scene.add(fillLight);

function createStudioTexture(width: number, height: number): THREE.CanvasTexture {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = width;
  textureCanvas.height = height;
  const context = textureCanvas.getContext('2d');
  if (!context) throw new Error('Unable to create studio texture');

  context.fillStyle = '#d8dde2';
  context.fillRect(0, 0, width, height);

  const panelColors = ['#b7c7c1', '#d5b38f', '#9fb4c8', '#c5b8ca', '#b8c49f', '#d2a5a0'];
  const panelWidth = width / panelColors.length;
  panelColors.forEach((color, index) => {
    context.fillStyle = color;
    context.fillRect(index * panelWidth, 0, panelWidth, height);
  });

  context.strokeStyle = 'rgba(42, 53, 59, 0.48)';
  context.lineWidth = 5;
  for (let x = 0; x <= width; x += 96) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 64; y < height; y += 96) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.fillStyle = 'rgba(255, 255, 255, 0.72)';
  for (let x = 48; x < width; x += 160) {
    context.beginPath();
    context.arc(x, height * 0.28, 18, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createStudio(): THREE.Group {
  const studio = new THREE.Group();
  const floorTexture = createStudioTexture(768, 768);
  floorTexture.repeat.set(3, 3);
  const wallTexture = createStudioTexture(1024, 512);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(5, 96),
    new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.82,
      metalness: 0,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.02;
  floor.receiveShadow = true;

  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 4.5, 96, 1, true),
    new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.9,
      metalness: 0,
      side: THREE.BackSide,
    }),
  );
  wall.position.y = 1.2;
  studio.add(floor, wall);
  return studio;
}

const studio = useStudio ? createStudio() : null;
if (studio) {
  scene.add(studio);
  studio.visible = !maskMode;
}

function materialFor(item: HeritageArtifact): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: item.model.color,
    metalness: 0.22,
    roughness: 0.46,
  });
}

function createBronzeTree(item: HeritageArtifact): THREE.Group {
  const group = new THREE.Group();
  const bark = materialFor(item);
  const accent = new THREE.MeshStandardMaterial({ color: item.model.accent, metalness: 0.5, roughness: 0.4 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.2, 12), bark);
  trunk.position.y = 0.9;
  group.add(trunk);
  for (let level = 0; level < 3; level += 1) {
    const y = 0.55 + level * 0.58;
    for (let i = 0; i < 3; i += 1) {
      const angle = (i / 3) * Math.PI * 2 + level * 0.45;
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.88 - level * 0.1, 10), bark);
      branch.position.set(Math.cos(angle) * 0.26, y, Math.sin(angle) * 0.26);
      branch.rotation.z = Math.PI / 2.8;
      branch.rotation.y = angle;
      group.add(branch);
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 12), accent);
      leaf.position.set(Math.cos(angle) * (0.62 + level * 0.06), y + 0.28, Math.sin(angle) * (0.62 + level * 0.06));
      group.add(leaf);
    }
  }
  return group;
}

function createDuguSeal(item: HeritageArtifact): THREE.Group {
  const group = new THREE.Group();
  const seal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.78, 1), materialFor(item));
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(seal.geometry),
    new THREE.LineBasicMaterial({ color: item.model.accent, transparent: true, opacity: 0.65 }),
  );
  group.add(seal, edges);
  return group;
}

function createTerracotta(item: HeritageArtifact): THREE.Group {
  const group = new THREE.Group();
  const mat = materialFor(item);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 28, 18), mat);
  head.position.y = 1.12;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.74, 6, 18), mat);
  body.position.y = 0.46;
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.72), mat);
  base.position.y = -0.05;
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.16, 0.32), mat);
  shoulder.position.y = 0.83;
  group.add(head, body, base, shoulder);
  return group;
}

function createMoai(item: HeritageArtifact): THREE.Group {
  const group = new THREE.Group();
  const mat = materialFor(item);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.05, 0.42), mat);
  head.position.y = 0.58;
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.16), new THREE.MeshStandardMaterial({ color: item.model.accent, roughness: 0.5 }));
  nose.position.set(0, 0.68, 0.28);
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.12), mat);
  brow.position.set(0, 0.88, 0.28);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.36, 0.5), mat);
  base.position.y = -0.15;
  group.add(head, nose, brow, base);
  return group;
}

function createProceduralModel(item: HeritageArtifact): THREE.Group {
  if (item.model.variant === 'bronze-tree') return createBronzeTree(item);
  if (item.model.variant === 'dugu-seal') return createDuguSeal(item);
  if (item.model.variant === 'terracotta') return createTerracotta(item);
  if (item.model.variant === 'moai') return createMoai(item);
  const fallback = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 2), materialFor(item));
  const group = new THREE.Group();
  group.add(fallback);
  return group;
}

function normalize(rootObject: THREE.Object3D): void {
  const box = new THREE.Box3().setFromObject(rootObject);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSide = Math.max(size.x, size.y, size.z) || 1;
  const scale = fit / maxSide;
  rootObject.scale.multiplyScalar(scale);
  rootObject.position.sub(center.multiplyScalar(scale));
}

function kindFromPath(path: string): HeritageArtifact['model']['kind'] | null {
  const extension = path.split('?')[0]?.split('.').pop()?.toLowerCase();
  if (extension === 'glb') return 'glb';
  if (extension === 'ply') return 'ply';
  if (extension === 'stl') return 'stl';
  return null;
}

async function loadGeometryModel(item: HeritageArtifact): Promise<THREE.Group> {
  const path = sourcePath ?? item.model.path;
  const kind = sourcePath ? kindFromPath(sourcePath) : item.model.kind;

  if (!path || kind === 'procedural' || !kind) {
    return createProceduralModel(item);
  }

  if (kind === 'glb') {
    const gltf = await gltfLoader.loadAsync(path);
    const group = gltf.scene;
    group.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = !maskMode;
        node.receiveShadow = !maskMode;
        if (maskMode) {
          node.material = maskMaterial;
        } else if (!node.material) {
          node.material = materialFor(item);
        }
      }
    });
    return group;
  }

  const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
    const loader = kind === 'ply' ? new PLYLoader() : new STLLoader();
    loader.load(path, resolve, undefined, reject);
  });
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geometry,
    maskMode
      ? new THREE.MeshBasicMaterial({ color: 0xffffff })
      : materialFor(item),
  );
  const group = new THREE.Group();
  group.add(mesh);
  return group;
}

const object = await loadGeometryModel(artifact);
normalize(object);
object.rotation.y = THREE.MathUtils.degToRad(angle);
scene.add(object);

const originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
object.traverse((node) => {
  if (node instanceof THREE.Mesh) {
    originalMaterials.set(node, node.material);
  }
});

function setMaskMode(enabled: boolean): void {
  scene.background = new THREE.Color(enabled ? 0x000000 : useStudio ? 0xd8dde2 : 0xf4f0e8);
  if (studio) studio.visible = useStudio && !enabled;
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.castShadow = !enabled;
    node.receiveShadow = !enabled;
    node.material = enabled ? maskMaterial : originalMaterials.get(node) ?? materialFor(artifact);
  });
}

function setCameraPose(renderPose: Pick<typeof pose, 'azimuth' | 'elevation'>): void {
  const azimuth = THREE.MathUtils.degToRad(renderPose.azimuth);
  const elevation = THREE.MathUtils.degToRad(renderPose.elevation);
  const radius = 3.25;
  camera.position.set(
    Math.sin(azimuth) * Math.cos(elevation) * radius,
    Math.sin(elevation) * radius + 0.12,
    Math.cos(azimuth) * Math.cos(elevation) * radius,
  );
  camera.lookAt(0, 0, 0);
}

function renderFrame(renderPose: Pick<typeof pose, 'azimuth' | 'elevation'>, enabledMask: boolean): string {
  setMaskMode(enabledMask);
  setCameraPose(renderPose);
  renderer.render(scene, camera);
  return renderCanvas.toDataURL('image/png');
}

if (!useStudio) {
  object.rotation.x = THREE.MathUtils.degToRad(-8);
}

declare global {
  interface Window {
    renderObjectFrames?: (
      renderPoses: Array<{ index: number; azimuth: number; elevation: number }>,
    ) => Array<{ index: number; image: string; mask: string }>;
  }
}

window.renderObjectFrames = (renderPoses) => renderPoses.map((renderPose) => ({
  index: renderPose.index,
  image: renderFrame(renderPose, false),
  mask: renderFrame(renderPose, true),
}));

const dataUrl = renderFrame(pose, maskMode);
if (batchMode) {
  readyNode.textContent = JSON.stringify(window.renderObjectFrames?.(createMultiviewPoses()) ?? []);
} else {
  readyNode.textContent = params.get('export') === 'data-url' ? dataUrl : 'ready';
}
