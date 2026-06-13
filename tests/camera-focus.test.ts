import { describe, expect, it } from 'vitest';
import { shouldUpdateOrbitControls } from '../src/camera-focus';

describe('inspection camera', () => {
  it('does not let orbit controls overwrite the focused camera pose', () => {
    expect(shouldUpdateOrbitControls(true)).toBe(false);
    expect(shouldUpdateOrbitControls(false)).toBe(true);
  });
});
