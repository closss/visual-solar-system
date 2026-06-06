export type SceneId = 'desk_lab' | 'campus_night';
export type DemoMode = 'science' | 'cinematic';
export type Quality = 'safe' | 'balanced' | 'cinematic';

export interface ScenePreset {
  id: SceneId;
  title: string;
  description: string;
  background: string;
  anchor: { x: number; y: number; z: number };
  camera: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  };
}

export interface AppState {
  sceneId: SceneId;
  mode: DemoMode;
  quality: Quality;
  isPlaced: boolean;
  timeScale: number;
}

const scenePresets: Record<SceneId, ScenePreset> = {
  desk_lab: {
    id: 'desk_lab',
    title: '桌面实验台',
    description: '适合展示落地阴影、桌面锚点和微缩装置比例。',
    background:
      "url('/scenes/desk-lab.svg'), radial-gradient(circle at 18% 18%, rgba(255,255,255,0.24), transparent 18%), linear-gradient(145deg, #78583f 0%, #bd9d70 31%, #314354 32%, #20262b 55%, #7e8c78 56%, #c1b28b 100%)",
    anchor: { x: -0.24, y: -0.86, z: 0 },
    camera: {
      position: { x: 4.6, y: 3.4, z: 7.2 },
      target: { x: 0, y: 0.2, z: 0 },
    },
  },
  campus_night: {
    id: 'campus_night',
    title: '校园夜幕',
    description: '适合展示辉光、轨道标签和电影模式色彩分级。',
    background:
      "url('/scenes/campus-night.svg'), radial-gradient(circle at 72% 24%, rgba(255,231,168,0.46), transparent 9%), linear-gradient(135deg, #20232a 0%, #314f67 36%, #5d7a70 37%, #2c3a34 58%, #9b7f54 59%, #d8b169 100%)",
    anchor: { x: 0.1, y: -0.84, z: 0 },
    camera: {
      position: { x: 4.2, y: 3.7, z: 7.6 },
      target: { x: 0, y: 0.2, z: 0 },
    },
  },
};

export function createInitialState(): AppState {
  return {
    sceneId: 'desk_lab',
    mode: 'science',
    quality: 'balanced',
    isPlaced: false,
    timeScale: 1,
  };
}

export function getScenePreset(sceneId: SceneId): ScenePreset {
  return scenePresets[sceneId];
}

export function getScenePresets(): ScenePreset[] {
  return Object.values(scenePresets);
}

export function setTimeScale(state: AppState, value: number): AppState {
  return {
    ...state,
    timeScale: Math.min(3, Math.max(0, value)),
  };
}

export function setMode(state: AppState, value: string): AppState {
  if (value !== 'science' && value !== 'cinematic') {
    throw new Error(`Unknown mode: ${value}`);
  }

  return {
    ...state,
    mode: value,
  };
}

export function chooseQuality(width: number, devicePixelRatio: number): Quality {
  if (width < 520 || devicePixelRatio > 2) {
    return 'safe';
  }

  if (width >= 1200 && devicePixelRatio <= 1.5) {
    return 'cinematic';
  }

  return 'balanced';
}
