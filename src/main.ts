import './styles/main.css';
import Stats from 'stats.js';
import { toPng } from 'html-to-image';
import {
  chooseQuality,
  createInitialState,
  getScenePreset,
  getScenePresets,
  setMode,
  setTimeScale,
  type AppState,
  type DemoMode,
  type SceneId,
} from './state/app-state';
import { CosmosScene } from './core/cosmos-scene';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app root');
}

app.innerHTML = `
  <main class="shell">
    <section class="stage-wrap" aria-label="口袋宇宙实验台">
      <div class="scene-backdrop" id="sceneBackdrop">
        <div class="scene-photo" id="scenePhoto"></div>
        <canvas id="cosmosCanvas" aria-label="交互式微缩宇宙三维画布"></canvas>
        <div class="labels-layer" id="labelsLayer"></div>
        <button class="placement-hint" id="placementHint" type="button">点击画面放置微缩宇宙</button>
      </div>
    </section>

    <aside class="control-panel" aria-label="演示控制">
      <div class="brand">
        <p>Web 3D / Image Augmentation</p>
        <h1>口袋宇宙实验台</h1>
        <span>真实场景图 + 透明 Three.js 画布 + 三体层级动画</span>
      </div>

      <div class="control-row scene-tabs" id="sceneTabs" aria-label="场景选择"></div>

      <div class="segmented" role="group" aria-label="模式切换">
        <button type="button" data-mode="science" class="active">Science</button>
        <button type="button" data-mode="cinematic">Cinematic</button>
      </div>

      <label class="slider-row">
        <span>时间倍率</span>
        <input id="timeScale" type="range" min="0" max="3" value="1" step="0.05" />
        <strong id="timeValue">1.00x</strong>
      </label>

      <div class="action-grid">
        <button type="button" id="resetBtn">重置锚点</button>
        <button type="button" id="compareBtn">增强前</button>
        <label class="file-button" for="uploadInput">上传场景</label>
        <button type="button" id="captureBtn">保存截图</button>
        <input id="uploadInput" type="file" accept="image/*" />
      </div>

      <dl class="metrics">
        <div><dt>质量</dt><dd id="qualityText">Balanced</dd></div>
        <div><dt>当前场景</dt><dd id="sceneText">桌面实验台</dd></div>
        <div><dt>核心关系</dt><dd>太阳 → 地球 → 月球</dd></div>
      </dl>
    </aside>
  </main>
`;

let state: AppState = {
  ...createInitialState(),
  quality: chooseQuality(window.innerWidth, window.devicePixelRatio),
};

function requireNode<T extends Element>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) {
    throw new Error(`Missing application node: ${selector}`);
  }
  return node;
}

const stage = requireNode<HTMLElement>('#sceneBackdrop');
const photo = requireNode<HTMLElement>('#scenePhoto');
const canvas = requireNode<HTMLCanvasElement>('#cosmosCanvas');
const labels = requireNode<HTMLElement>('#labelsLayer');
const hint = requireNode<HTMLButtonElement>('#placementHint');
const sceneTabs = requireNode<HTMLElement>('#sceneTabs');
const timeInput = requireNode<HTMLInputElement>('#timeScale');
const timeValue = requireNode<HTMLElement>('#timeValue');
const sceneText = requireNode<HTMLElement>('#sceneText');
const qualityText = requireNode<HTMLElement>('#qualityText');
const resetBtn = requireNode<HTMLButtonElement>('#resetBtn');
const captureBtn = requireNode<HTMLButtonElement>('#captureBtn');
const compareBtn = requireNode<HTMLButtonElement>('#compareBtn');
const uploadInput = requireNode<HTMLInputElement>('#uploadInput');
const modeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode]'));

const cosmos = new CosmosScene({
  canvas,
  stage,
  labels,
  preset: getScenePreset(state.sceneId),
  quality: state.quality,
});

const stats = new Stats();
stats.dom.classList.add('stats-panel');
document.body.appendChild(stats.dom);
requestAnimationFrame(function tickStats() {
  stats.update();
  requestAnimationFrame(tickStats);
});

function renderSceneTabs(): void {
  sceneTabs.innerHTML = '';
  getScenePresets().forEach((preset) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = preset.title;
    button.className = preset.id === state.sceneId ? 'active' : '';
    button.addEventListener('click', () => {
      state = { ...state, sceneId: preset.id };
      applyPreset(preset.id);
    });
    sceneTabs.appendChild(button);
  });
}

function applyPreset(sceneId: SceneId): void {
  const preset = getScenePreset(sceneId);
  photo.style.backgroundImage = preset.background;
  photo.dataset.scene = preset.id;
  sceneText.textContent = preset.title;
  cosmos.applyPreset(preset);
  hint.hidden = false;
  renderSceneTabs();
}

function applyMode(mode: DemoMode): void {
  state = setMode(state, mode);
  cosmos.setMode(state.mode);
  stage.dataset.mode = state.mode;
  modeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === state.mode);
  });
}

function placeFromEvent(event: PointerEvent | MouseEvent): void {
  cosmos.placeFromPointer(event.clientX, event.clientY);
  state = { ...state, isPlaced: true };
  hint.hidden = true;
}

stage.addEventListener('pointerdown', (event) => {
  if ((event.target as HTMLElement).closest('button')) return;
  placeFromEvent(event);
});
hint.addEventListener('click', placeFromEvent);

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applyMode(button.dataset.mode as DemoMode);
  });
});

timeInput.addEventListener('input', () => {
  state = setTimeScale(state, Number(timeInput.value));
  timeInput.value = String(state.timeScale);
  timeValue.textContent = `${state.timeScale.toFixed(2)}x`;
  cosmos.setTimeScale(state.timeScale);
});

resetBtn.addEventListener('click', () => {
  cosmos.resetPlacement();
  state = { ...state, isPlaced: false };
  hint.hidden = false;
});

compareBtn.addEventListener('click', () => {
  const isBefore = stage.dataset.compare === 'before';
  stage.dataset.compare = isBefore ? 'after' : 'before';
  compareBtn.textContent = isBefore ? '增强前' : '增强后';
});

uploadInput.addEventListener('change', () => {
  const [file] = Array.from(uploadInput.files ?? []);
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    const imageUrl = String(reader.result);
    photo.style.backgroundImage = `url("${imageUrl}")`;
    photo.dataset.scene = 'uploaded';
    sceneText.textContent = '自定义场景';
    cosmos.resetPlacement();
    state = { ...state, isPlaced: false };
    hint.hidden = false;
  });
  reader.readAsDataURL(file);
});

captureBtn.addEventListener('click', async () => {
  captureBtn.disabled = true;
  captureBtn.textContent = '生成中';
  const link = document.createElement('a');
  link.download = 'pocket-cosmos-lab.png';
  try {
    link.href = await toPng(stage, {
      cacheBust: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    });
    link.click();
  } finally {
    captureBtn.disabled = false;
    captureBtn.textContent = '保存截图';
  }
});

window.addEventListener('resize', () => {
  state = { ...state, quality: chooseQuality(window.innerWidth, window.devicePixelRatio) };
  cosmos.applyQuality(state.quality);
  qualityText.textContent = state.quality;
});

applyPreset(state.sceneId);
applyMode(state.mode);
stage.dataset.compare = 'after';
cosmos.setTimeScale(state.timeScale);
qualityText.textContent = state.quality;
