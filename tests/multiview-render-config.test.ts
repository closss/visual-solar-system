import { describe, expect, it } from 'vitest';
import {
  createMultiviewPoses,
  parseRenderFlags,
  parseRenderPose,
} from '../src/multiview-render-config';

describe('multiview render config', () => {
  it('creates 36 evenly distributed poses across three elevation rings', () => {
    const poses = createMultiviewPoses();

    expect(poses).toHaveLength(36);
    expect(new Set(poses.map((pose) => pose.elevation))).toEqual(
      new Set([-20, 0, 20]),
    );
    expect(poses.filter((pose) => pose.elevation === 0)).toHaveLength(12);
    expect(poses[0]).toEqual({ index: 0, azimuth: 0, elevation: -20 });
    expect(poses[35]).toEqual({ index: 35, azimuth: 330, elevation: 20 });
  });

  it('parses finite render angles and falls back for invalid values', () => {
    expect(parseRenderPose(new URLSearchParams('azimuth=45&elevation=20'))).toEqual({
      azimuth: 45,
      elevation: 20,
    });
    expect(parseRenderPose(new URLSearchParams('azimuth=nope&elevation='))).toEqual({
      azimuth: 0,
      elevation: 0,
    });
  });

  it('enables studio and mask rendering only for explicit flags', () => {
    expect(parseRenderFlags(new URLSearchParams('studio=1&mask=1'))).toEqual({
      studio: true,
      mask: true,
    });
    expect(parseRenderFlags(new URLSearchParams('studio=true&mask=0'))).toEqual({
      studio: false,
      mask: false,
    });
  });
});
