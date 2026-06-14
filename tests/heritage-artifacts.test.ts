import { describe, expect, it } from 'vitest';
import {
  featuredArtifactIds,
  heritageArtifacts,
} from '../src/data/heritage-artifacts';
import { createEvenOrbitPhases, getOrbitPosition } from '../src/orbit-layout';

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

  it('lists every artifact in the overview catalog', () => {
    expect(featuredArtifactIds).toEqual([
      'nefertiti',
      'fangyi',
      'cosmic-buddha',
      'apollo-11-command-module',
      'hoa-hakananai-a',
      'incense-burner',
    ]);
  });

  it('provides a representative RGB input image for every artifact', () => {
    for (const artifact of heritageArtifacts) {
      expect(artifact.image).toBe(`/heritage/rgb/${artifact.id}.png`);
    }
  });
});

describe('artifact orbit layout', () => {
  it('spaces orbiting artifacts evenly around the solar system', () => {
    const phases = createEvenOrbitPhases(5);
    const step = (Math.PI * 2) / 5;

    expect(phases).toHaveLength(5);
    phases.forEach((phase, index) => {
      expect(phase).toBeCloseTo(0.35 + index * step);
    });
  });

  it('keeps artifacts exactly on their orbit radius and the sun at the origin', () => {
    expect(getOrbitPosition(0, 1.2)).toEqual({ x: 0, z: 0 });

    const position = getOrbitPosition(7.05, 2.4);
    expect(Math.hypot(position.x, position.z)).toBeCloseTo(7.05);
  });
});
