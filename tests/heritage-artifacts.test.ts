import { describe, expect, it } from 'vitest';
import {
  featuredReconstructionIds,
  heritageArtifacts,
} from '../src/data/heritage-artifacts';

describe('MapAnything point-cloud artifacts', () => {
  it('registers the compact Nefertiti reconstruction as a 36-view point cloud', () => {
    const artifact = heritageArtifacts.find((item) => item.id === 'nefertiti');

    expect(artifact?.model.path).toBe('/heritage/recon/nefertiti-object-lite.glb');
    expect(artifact?.model.representation).toBe('point-cloud');
    expect(artifact?.reconstructionViews).toBe(36);
  });

  it('keeps Lewis Queen labeled as an experimental point-cloud result', () => {
    const artifact = heritageArtifacts.find((item) => item.id === 'lewis-queen');

    expect(artifact?.model.representation).toBe('point-cloud');
    expect(artifact?.reconstructionQuality).toBe('experimental');
  });

  it('features both 36-view reconstructions in the overview', () => {
    expect(featuredReconstructionIds).toEqual(['nefertiti', 'lewis-queen']);
  });
});
