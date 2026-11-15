export const MIN_SCALE = 1;
export const MAX_SCALE = 5;
export const DOUBLE_TAP_SCALE = 2.5;

export function clampScale(scale: number): number {
  "worklet";
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

// Keeps a zoomed image from being dragged past its edges. At scale 1 there is nothing to pan.
export function clampOffset(offset: number, scale: number, viewSize: number): number {
  "worklet";
  const max = (viewSize * (scale - 1)) / 2;
  return Math.min(max, Math.max(-max, offset));
}

export function nextTapScale(scale: number): number {
  "worklet";
  return scale > 1.05 ? MIN_SCALE : DOUBLE_TAP_SCALE;
}
