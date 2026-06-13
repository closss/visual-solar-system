import { describe, expect, it } from 'vitest';
import { createEvenSampleIndices } from '../tools/downsample-point-glb.mjs';

describe('point GLB downsampling', () => {
  it('keeps all points when the source is below the limit', () => {
    expect(Array.from(createEvenSampleIndices(4, 8))).toEqual([0, 1, 2, 3]);
  });

  it('selects a deterministic spread that includes both ends', () => {
    expect(Array.from(createEvenSampleIndices(10, 4))).toEqual([0, 3, 6, 9]);
  });

  it('rejects invalid point limits', () => {
    expect(() => createEvenSampleIndices(10, 0)).toThrow('maxPoints');
  });
});
