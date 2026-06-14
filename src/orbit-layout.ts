const DEFAULT_START_PHASE = 0.35;

export function createEvenOrbitPhases(
  count: number,
  startPhase = DEFAULT_START_PHASE,
): number[] {
  if (count <= 0) return [];

  const step = (Math.PI * 2) / count;
  return Array.from({ length: count }, (_, index) => startPhase + index * step);
}

export function getOrbitPosition(
  radius: number,
  phase: number,
): { x: number; z: number } {
  if (radius === 0) return { x: 0, z: 0 };

  return {
    x: Math.cos(phase) * radius,
    z: Math.sin(phase) * radius,
  };
}
