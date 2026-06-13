export interface RenderPose {
  index: number;
  azimuth: number;
  elevation: number;
}

export function createMultiviewPoses(): RenderPose[] {
  const elevations = [-20, 0, 20];
  const poses: RenderPose[] = [];

  for (const elevation of elevations) {
    for (let azimuth = 0; azimuth < 360; azimuth += 30) {
      poses.push({
        index: poses.length,
        azimuth,
        elevation,
      });
    }
  }

  return poses;
}

function finiteNumber(value: string | null, fallback: number): number {
  if (value === null || value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseRenderPose(params: URLSearchParams): Pick<RenderPose, 'azimuth' | 'elevation'> {
  return {
    azimuth: finiteNumber(params.get('azimuth'), 0),
    elevation: finiteNumber(params.get('elevation'), 0),
  };
}

export function parseRenderFlags(params: URLSearchParams): { studio: boolean; mask: boolean } {
  return {
    studio: params.get('studio') === '1',
    mask: params.get('mask') === '1',
  };
}
