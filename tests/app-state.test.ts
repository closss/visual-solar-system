import { describe, expect, it } from 'vitest';
import {
  chooseQuality,
  createInitialState,
  getScenePreset,
  setMode,
  setTimeScale,
} from '../src/state/app-state';

describe('app state', () => {
  it('starts with desk lab preset, science mode, and paused placement', () => {
    const state = createInitialState();

    expect(state.sceneId).toBe('desk_lab');
    expect(state.mode).toBe('science');
    expect(state.isPlaced).toBe(false);
    expect(state.timeScale).toBe(1);
  });

  it('returns scene metadata with anchor, camera, and background', () => {
    const preset = getScenePreset('campus_night');

    expect(preset.title).toBe('校园夜幕');
    expect(preset.anchor).toEqual({ x: 0.1, y: -0.84, z: 0 });
    expect(preset.camera.position.z).toBeGreaterThan(6);
    expect(preset.background).toContain('campus');
  });

  it('clamps time scale to the supported demo range', () => {
    expect(setTimeScale(createInitialState(), -3).timeScale).toBe(0);
    expect(setTimeScale(createInitialState(), 3.7).timeScale).toBe(3);
  });

  it('switches between science and cinematic modes only', () => {
    const state = createInitialState();

    expect(setMode(state, 'cinematic').mode).toBe('cinematic');
    expect(() => setMode(state, 'wireframe')).toThrow('Unknown mode');
  });

  it('uses safe quality on narrow screens and cinematic quality on desktop', () => {
    expect(chooseQuality(390, 2.5)).toBe('safe');
    expect(chooseQuality(1440, 1)).toBe('cinematic');
  });
});
