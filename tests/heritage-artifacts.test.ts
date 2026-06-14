import { describe, expect, it } from 'vitest';
import {
  featuredReconstructionIds,
  heritageArtifacts,
} from '../src/data/heritage-artifacts';

describe('MapAnything point-cloud artifacts', () => {
  it('keeps only the curated high-quality reconstruction set in the solar system', () => {
    expect(heritageArtifacts.map((item) => item.id)).toEqual([
      'nefertiti',
      'fangyi',
      'cosmic-buddha',
      'apollo-11-command-module',
      'hoa-hakananai-a',
      'incense-burner',
    ]);
  });

  it('registers the compact Nefertiti reconstruction as a 36-view point cloud', () => {
    const artifact = heritageArtifacts.find((item) => item.id === 'nefertiti');

    expect(artifact?.model.path).toBe('/heritage/recon/nefertiti-object-lite.glb');
    expect(artifact?.model.representation).toBe('point-cloud');
    expect(artifact?.reconstructionViews).toBe(36);
  });

  it('registers the three remaining assets as 36-view point clouds', () => {
    for (const id of ['apollo-11-command-module', 'hoa-hakananai-a', 'incense-burner']) {
      const artifact = heritageArtifacts.find((item) => item.id === id);

      expect(artifact?.model.representation).toBe('point-cloud');
      expect(artifact?.reconstructionViews).toBe(36);
      expect(artifact?.model.pointCount).toBe(400000);
    }
  });

  it('features both 36-view reconstructions in the overview', () => {
    expect(featuredReconstructionIds).toEqual([
      'nefertiti',
      'apollo-11-command-module',
      'hoa-hakananai-a',
      'incense-burner',
    ]);
  });
});
