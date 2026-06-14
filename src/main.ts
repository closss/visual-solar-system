import './styles/main.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { shouldUpdateOrbitControls } from './camera-focus';
import {
  featuredReconstructionIds,
  heritageArtifacts,
  type HeritageArtifact,
} from './data/heritage-artifacts';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app root');

app.innerHTML = `
  <main class="heritage-shell">
    <section class="stage">
      <canvas id="solarCanvas" aria-label="文物太阳系三维画布"></canvas>
      <div class="topbar">
        <div>
          <p>Object Reconstruction / Web 3D</p>
          <h1>文物太阳系</h1>
        </div>
        <div class="status" id="loadStatus">加载资产中...</div>
      </div>
      <div class="orbit-caption" id="orbitCaption">点击任意文物查看介绍</div>
    </section>
    <aside class="artifact-panel" id="artifactPanel"></aside>
  </main>
`;

interface OrbitBody {
  artifact: HeritageArtifact;
  pivot: THREE.Object3D;
  body: THREE.Group;
  visual: THREE.Group;
  baseScale: number;
}

const canvas = document.querySelector<HTMLCanvasElement>('#solarCanvas');
const panel = document.querySelector<HTMLElement>('#artifactPanel');
const loadStatus = document.querySelector<HTMLElement>('#loadStatus');
const orbitCaption = document.querySelector<HTMLElement>('#orbitCaption');
if (!canvas || !panel || !loadStatus || !orbitCaption) throw new Error('Missing app nodes');
const solarCanvas = canvas;
const artifactPanel = panel;
const statusNode = loadStatus;
const captionNode = orbitCaption;

const renderer = new THREE.WebGLRenderer({ canvas: solarCanvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080b0f);
scene.fog = new THREE.Fog(0x080b0f, 10, 27);

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
camera.position.set(0, 8.2, 15.5);

const controls = new OrbitControls(camera, solarCanvas);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 5;
controls.maxDistance = 28;
controls.target.set(0, 0, 0);

scene.add(new THREE.AmbientLight(0x526070, 0.9));

const sunLight = new THREE.PointLight(0xffdf9a, 820, 35, 1.7);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
scene.add(sunLight);

const rimLight = new THREE.DirectionalLight(0x8bdcff, 2.2);
rimLight.position.set(-7, 9, 6);
scene.add(rimLight);

function createStarField(): THREE.Points {
  const starCount = 900;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    const radius = 28 + Math.random() * 32;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi) * 0.68 + 3;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    const warmth = Math.random();
    colors[i * 3] = 0.72 + warmth * 0.24;
    colors[i * 3 + 1] = 0.78 + warmth * 0.18;
    colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.055,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
    }),
  );
}

scene.add(createStarField());

const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.1;
const pointer = new THREE.Vector2();
const clock = new THREE.Clock();
const normalCameraPosition = new THREE.Vector3(0, 9.4, 18.2);
const normalTarget = new THREE.Vector3(0, 0, 0);
const focusTarget = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
const desiredTarget = new THREE.Vector3();
const scaleTarget = new THREE.Vector3();
const focusBox = new THREE.Box3();
const bodies: OrbitBody[] = [];
let selected: HeritageArtifact | null = null;
let isInspecting = false;
let draggedBody: OrbitBody | null = null;
let lastPointerX = 0;
let lastPointerY = 0;

camera.position.copy(normalCameraPosition);
controls.target.copy(normalTarget);
controls.update();

function renderPanel(artifact: HeritageArtifact | null): void {
  if (!artifact) {
    artifactPanel.innerHTML = `
      <div class="panel-kicker">Heritage Orbit</div>
      <h2>物体太阳系</h2>
      <p class="subtitle">6 个筛选后的高质量重建对象组成文物太阳系。</p>
      <dl>
        <div><dt>后端</dt><dd>MapAnything 离线重建，保留 12 视角扫描资产与 36 视角彩色点云。</dd></div>
        <div><dt>交互</dt><dd>点击任意物体，太阳系暂停，物体放大后可拖拽旋转。</dd></div>
        <div><dt>资产</dt><dd>公开扫描资产、高清参考图与程序化近似几何组合。</dd></div>
      </dl>
      <div class="sample-picker">
        <div class="sample-picker-label">36-view point clouds</div>
        ${featuredReconstructionIds.map((id) => {
          const item = heritageArtifacts.find((artifact) => artifact.id === id);
          if (!item) return '';
          return `<button class="sample-button" data-artifact-id="${item.id}" type="button">
            <span>${item.title}</span>
            <small>${item.reconstructionQuality === 'experimental' ? '实验结果' : '推荐展示'}</small>
          </button>`;
        }).join('')}
      </div>
      <p class="body-copy">这个版本面向课堂 presentation：删掉低质量占位模型，只保留可说明多视角输入、遮罩重建和 Web 3D 展示链路的资产。</p>
    `;
    captionNode.textContent = '点击任意文物进入观察模式';
    artifactPanel.querySelectorAll<HTMLButtonElement>('[data-artifact-id]').forEach((button) => {
      button.addEventListener('click', () => selectArtifact(button.dataset.artifactId ?? ''));
    });
    return;
  }

  artifactPanel.innerHTML = `
    <div class="panel-head">
      <div>
        <div class="panel-kicker">${artifact.orbitRole}</div>
        <h2>${artifact.title}</h2>
      </div>
      <button class="return-button" id="returnButton" type="button">返回</button>
    </div>
    <p class="subtitle">${artifact.subtitle}</p>
    ${artifact.image ? `<img class="artifact-image" src="${artifact.image}" alt="${artifact.title}" />` : ''}
    <dl>
      <div><dt>年代</dt><dd>${artifact.period}</dd></div>
      <div><dt>角色</dt><dd>${artifact.orbitRole}，${artifact.orbitRole === '太阳' ? '中心不公转，仅自转' : '围绕太阳公转并自转'}</dd></div>
      <div><dt>重建</dt><dd>${describeReconstruction(artifact)}</dd></div>
    </dl>
    <p class="body-copy">${artifact.body}</p>
    <ul class="detail-list">
      ${artifact.details.map((detail) => `<li>${detail}</li>`).join('')}
    </ul>
    <p class="source-copy">${artifact.source}</p>
  `;
  captionNode.textContent = `${artifact.orbitRole} · ${artifact.title}`;

  document.querySelector<HTMLButtonElement>('#returnButton')?.addEventListener('click', clearSelection);
}

function describeReconstruction(artifact: HeritageArtifact): string {
  const views = artifact.reconstructionViews ?? 12;
  if (artifact.model.representation !== 'point-cloud') {
    return `GLB / MapAnything ${views} 视角离线重建`;
  }

  const pointCount = artifact.model.pointCount
    ? `${Math.round(artifact.model.pointCount / 10000)} 万点`
    : '彩色点云';
  const quality = artifact.reconstructionQuality === 'experimental' ? ' / 实验结果' : '';
  return `MapAnything ${views} 视角 / ${pointCount}${quality}`;
}

function makeMaterial(artifact: HeritageArtifact): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: artifact.model.color,
    emissive: artifact.id === 'sanxingdui-tree' ? artifact.model.accent : 0x000000,
    emissiveIntensity: artifact.id === 'sanxingdui-tree' ? 0.35 : 0.03,
    metalness: artifact.id.includes('tree') ? 0.62 : 0.28,
    roughness: 0.42,
  });
}

function tagObject(root: THREE.Object3D, artifact: HeritageArtifact): void {
  root.traverse((node) => {
    node.userData.artifactId = artifact.id;
    if (node instanceof THREE.Mesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
}

let pointSprite: THREE.CanvasTexture | null = null;

function getPointSprite(): THREE.CanvasTexture {
  if (pointSprite) return pointSprite;

  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = 32;
  spriteCanvas.height = 32;
  const context = spriteCanvas.getContext('2d');
  if (!context) throw new Error('Unable to create point sprite');
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(16, 16, 14, 0, Math.PI * 2);
  context.fill();

  pointSprite = new THREE.CanvasTexture(spriteCanvas);
  pointSprite.colorSpace = THREE.SRGBColorSpace;
  return pointSprite;
}

function stylePointCloud(root: THREE.Object3D, artifact: HeritageArtifact): void {
  root.traverse((node) => {
    if (!(node instanceof THREE.Points)) return;
    node.material = new THREE.PointsMaterial({
      size: artifact.model.pointSize ?? 0.018,
      sizeAttenuation: true,
      vertexColors: Boolean(node.geometry.getAttribute('color')),
      color: artifact.model.color,
      map: getPointSprite(),
      alphaTest: 0.5,
      transparent: true,
      opacity: 0.96,
      depthWrite: true,
      toneMapped: false,
    });
  });
}

function normalizeObject(root: THREE.Object3D, targetSize: number): void {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSide = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxSide;
  root.scale.multiplyScalar(scale);
  root.position.sub(center.multiplyScalar(scale));
}

function createBronzeTree(artifact: HeritageArtifact): THREE.Group {
  const group = new THREE.Group();
  const bark = makeMaterial(artifact);
  const green = new THREE.MeshStandardMaterial({ color: artifact.model.accent, metalness: 0.74, roughness: 0.36 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.2, 12), bark);
  trunk.position.y = 0.9;
  group.add(trunk);

  for (let level = 0; level < 3; level += 1) {
    const y = 0.55 + level * 0.58;
    for (let i = 0; i < 3; i += 1) {
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 1.1 - level * 0.12, 10), bark);
      branch.position.y = y;
      branch.rotation.z = Math.PI / 2.8;
      branch.rotation.y = (i / 3) * Math.PI * 2 + level * 0.45;
      branch.translateY(0.42);
      group.add(branch);

      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 12), green);
      leaf.position.set(Math.cos(branch.rotation.y) * (0.58 + level * 0.06), y + 0.28, Math.sin(branch.rotation.y) * (0.58 + level * 0.06));
      group.add(leaf);
    }
  }

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 20), new THREE.MeshStandardMaterial({
    color: 0xffc95c,
    emissive: 0xff8a30,
    emissiveIntensity: 1.15,
    roughness: 0.3,
  }));
  core.position.y = 0.15;
  group.add(core);
  return group;
}

function createDuguSeal(artifact: HeritageArtifact): THREE.Group {
  const group = new THREE.Group();
  const seal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 1), makeMaterial(artifact));
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(seal.geometry),
    new THREE.LineBasicMaterial({ color: artifact.model.accent, transparent: true, opacity: 0.58 }),
  );
  group.add(seal, edges);
  return group;
}

function createTerracotta(artifact: HeritageArtifact): THREE.Group {
  const group = new THREE.Group();
  const mat = makeMaterial(artifact);
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

function createMoai(artifact: HeritageArtifact): THREE.Group {
  const group = new THREE.Group();
  const mat = makeMaterial(artifact);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.05, 0.42), mat);
  head.position.y = 0.58;
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.16), new THREE.MeshStandardMaterial({ color: artifact.model.accent, roughness: 0.5 }));
  nose.position.set(0, 0.68, 0.28);
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.12), mat);
  brow.position.set(0, 0.88, 0.28);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.36, 0.5), mat);
  base.position.y = -0.15;
  group.add(head, nose, brow, base);
  return group;
}

function createProcedural(artifact: HeritageArtifact): THREE.Group {
  if (artifact.model.variant === 'bronze-tree') return createBronzeTree(artifact);
  if (artifact.model.variant === 'dugu-seal') return createDuguSeal(artifact);
  if (artifact.model.variant === 'terracotta') return createTerracotta(artifact);
  return createMoai(artifact);
}

async function loadModel(artifact: HeritageArtifact): Promise<THREE.Group> {
  if (artifact.model.kind === 'procedural') {
    const procedural = createProcedural(artifact);
    normalizeObject(procedural, artifact.model.size);
    tagObject(procedural, artifact);
    return procedural;
  }

  if (artifact.model.kind === 'glb') {
    const gltf = await new GLTFLoader().loadAsync(artifact.model.path ?? '');
    const group = gltf.scene;
    if (artifact.model.representation === 'point-cloud') {
      stylePointCloud(group, artifact);
    }
    group.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        if (!node.material) node.material = makeMaterial(artifact);
      }
    });
    normalizeObject(group, artifact.model.size);
    tagObject(group, artifact);
    return group;
  }

  const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
    const loader = artifact.model.kind === 'ply' ? new PLYLoader() : new STLLoader();
    loader.load(artifact.model.path ?? '', resolve, undefined, reject);
  });
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, makeMaterial(artifact));
  const group = new THREE.Group();
  group.add(mesh);
  normalizeObject(group, artifact.model.size);
  tagObject(group, artifact);
  return group;
}

function createOrbitLine(radius: number, color: number): THREE.Line {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 160; i += 1) {
    const a = (i / 160) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.26 }),
  );
}

function createSaturnRing(): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 1.05, 80),
    new THREE.MeshBasicMaterial({ color: 0xe9d7b9, transparent: true, opacity: 0.48, side: THREE.DoubleSide }),
  );
  ring.rotation.x = Math.PI / 2.35;
  return ring;
}

async function initBodies(): Promise<void> {
  let loaded = 0;
  for (const artifact of heritageArtifacts) {
    const pivot = new THREE.Object3D();
    const body = new THREE.Group();
    const visual = await loadModel(artifact);

    if (artifact.orbitRadius > 0) {
      scene.add(createOrbitLine(artifact.orbitRadius, artifact.model.accent));
      body.position.x = artifact.orbitRadius;
      pivot.rotation.y = loaded * 0.42;
    }

    if (artifact.id === 'armadillo') visual.add(createSaturnRing());

    body.add(visual);
    pivot.add(body);
    scene.add(pivot);
    bodies.push({ artifact, pivot, body, visual, baseScale: 1 });
    loaded += 1;
    statusNode.textContent = `加载资产 ${loaded}/${heritageArtifacts.length}`;
  }
  statusNode.textContent = '资产加载完成';
}

function resize(): void {
  const rect = solarCanvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);
}

function selectArtifact(id: string): void {
  const next = heritageArtifacts.find((artifact) => artifact.id === id);
  if (!next) return;
  selected = next;
  isInspecting = true;
  controls.enabled = false;
  solarCanvas.classList.add('inspecting');
  renderPanel(selected);
}

function clearSelection(): void {
  selected = null;
  isInspecting = false;
  draggedBody = null;
  controls.enabled = true;
  camera.position.copy(normalCameraPosition);
  controls.target.copy(normalTarget);
  controls.update();
  solarCanvas.classList.remove('inspecting', 'dragging');
  renderPanel(null);
}

function findBody(id: string): OrbitBody | undefined {
  return bodies.find((item) => item.artifact.id === id);
}

function getHitBody(event: PointerEvent): OrbitBody | null {
  const rect = solarCanvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  const hit = hits.find((entry) => entry.object.userData.artifactId);
  if (!hit) return null;
  return findBody(hit.object.userData.artifactId) ?? null;
}

solarCanvas.addEventListener('pointerdown', (event) => {
  const hitBody = getHitBody(event);
  if (!hitBody) return;

  if (isInspecting && selected?.id === hitBody.artifact.id) {
    draggedBody = hitBody;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    solarCanvas.classList.add('dragging');
    solarCanvas.setPointerCapture(event.pointerId);
    return;
  }

  selectArtifact(hitBody.artifact.id);
});

solarCanvas.addEventListener('pointermove', (event) => {
  if (!draggedBody) return;
  const dx = event.clientX - lastPointerX;
  const dy = event.clientY - lastPointerY;
  draggedBody.visual.rotation.y += dx * 0.012;
  draggedBody.visual.rotation.x += dy * 0.008;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
});

solarCanvas.addEventListener('pointerup', (event) => {
  if (!draggedBody) return;
  draggedBody = null;
  solarCanvas.classList.remove('dragging');
  solarCanvas.releasePointerCapture(event.pointerId);
});

solarCanvas.addEventListener('pointercancel', () => {
  draggedBody = null;
  solarCanvas.classList.remove('dragging');
});

window.addEventListener('resize', resize);
resize();
renderPanel(null);

await initBodies();

function animate(): void {
  const delta = Math.min(clock.getDelta(), 0.033);
  for (const item of bodies) {
    if (!isInspecting) {
      item.pivot.rotation.y += item.artifact.orbitSpeed * delta;
      item.visual.rotation.y += item.artifact.spinSpeed * delta;
    }
    const target = selected?.id === item.artifact.id ? 3.15 : 1;
    scaleTarget.set(target, target, target);
    item.body.scale.lerp(scaleTarget, 0.08);
  }

  if (isInspecting && selected) {
    const selectedBody = findBody(selected.id);
    if (selectedBody) {
      focusBox.setFromObject(selectedBody.visual);
      focusBox.getCenter(focusTarget);
      desiredTarget.copy(focusTarget).add(new THREE.Vector3(0, 0.25, 0));
      desiredCamera.copy(desiredTarget).add(new THREE.Vector3(0, 1.35, 4.8));
      camera.position.lerp(desiredCamera, 0.08);
      controls.target.lerp(desiredTarget, 0.12);
      camera.lookAt(controls.target);
    }
  }
  if (shouldUpdateOrbitControls(isInspecting)) {
    controls.update();
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
