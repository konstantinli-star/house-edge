// Eye-contact estimate from MediaPipe FaceLandmarker landmarks (pure).
// "Looking at the camera" = head roughly frontal AND both irises near the
// centre of the eye opening. A simple, explainable proxy, not eye tracking.

export type Point = { x: number; y: number };

// FaceMesh indices (478-point model with irises).
const IDX = {
  rightIris: 468, rightOuter: 33, rightInner: 133, rightTop: 159, rightBottom: 145,
  leftIris: 473, leftInner: 362, leftOuter: 263, leftTop: 386, leftBottom: 374,
  nose: 1, rightCheek: 234, leftCheek: 454, forehead: 10, chin: 152,
} as const;

export const GAZE_LIMITS = {
  irisHorizontal: 0.14, // max offset from eye centre (0.5), as a share of eye width
  irisVerticalMin: 0.25, // iris centre between top and bottom lid
  irisVerticalMax: 0.75,
  yaw: 0.14, // nose offset from face centre, as a share of face width
  pitchMin: 0.38, // nose height between forehead and chin
  pitchMax: 0.68,
};

const ratio = (v: number, a: number, b: number) => (b === a ? 0.5 : (v - a) / (b - a));

export type GazeReading = { looking: boolean; irisH: number; irisV: number; yaw: number; pitch: number };

export function readGaze(lm: Point[]): GazeReading | null {
  if (lm.length < 478) return null;
  const p = (i: number) => lm[i];

  const rightH = ratio(p(IDX.rightIris).x, p(IDX.rightOuter).x, p(IDX.rightInner).x);
  const leftH = ratio(p(IDX.leftIris).x, p(IDX.leftInner).x, p(IDX.leftOuter).x);
  const rightV = ratio(p(IDX.rightIris).y, p(IDX.rightTop).y, p(IDX.rightBottom).y);
  const leftV = ratio(p(IDX.leftIris).y, p(IDX.leftTop).y, p(IDX.leftBottom).y);
  const irisH = (rightH + leftH) / 2;
  const irisV = (rightV + leftV) / 2;
  const yaw = ratio(p(IDX.nose).x, p(IDX.rightCheek).x, p(IDX.leftCheek).x) - 0.5;
  const pitch = ratio(p(IDX.nose).y, p(IDX.forehead).y, p(IDX.chin).y);

  const g = GAZE_LIMITS;
  const looking =
    Math.abs(irisH - 0.5) <= g.irisHorizontal &&
    irisV >= g.irisVerticalMin &&
    irisV <= g.irisVerticalMax &&
    Math.abs(yaw) <= g.yaw &&
    pitch >= g.pitchMin &&
    pitch <= g.pitchMax;

  return { looking, irisH, irisV, yaw, pitch };
}

export type GazeStats = { frames: number; faceFrames: number; lookingFrames: number; multiFaceFrames: number };

export const emptyStats = (): GazeStats => ({ frames: 0, faceFrames: 0, lookingFrames: 0, multiFaceFrames: 0 });

// Frames without a face count as not looking.
export const eyeContactPct = (s: GazeStats) => (s.frames ? Math.round((s.lookingFrames / s.frames) * 100) : null);
export const faceMissingShare = (s: GazeStats) => (s.frames ? 1 - s.faceFrames / s.frames : 1);
