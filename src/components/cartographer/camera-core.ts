/**
 * Shared, renderer-agnostic Cartographer camera math.
 *
 * Both the desktop SVG stage and the Android Canvas stage consume this
 * module. Keeping the projection here prevents renderer drift in hashes,
 * world-panel placement, pinch anchors and journey flights.
 */

import { H, W } from "./chart-geometry";

export const FIT_INSET = 0.93;
export const MIN_RELATIVE_SCALE = 0.75;
export const ZOOM_STEP_FACTOR = 1.45;
/** One full control step beyond the former 9x ceiling. */
export const MAX_RELATIVE_SCALE = 13.05;

export interface CameraPose {
  tx: number;
  ty: number;
  k: number;
}

export interface CameraMetrics extends CameraPose {
  k0: number;
  vw: number;
  vh: number;
  ox: number;
  oy: number;
}

export type CameraBand = "0" | "1" | "2" | "3";

export function fitScale(vw: number, vh: number): number {
  return Math.min(vw / W, vh / H) * FIT_INSET;
}

export function clampScale(k: number, k0: number): number {
  return Math.max(k0 * MIN_RELATIVE_SCALE, Math.min(k0 * MAX_RELATIVE_SCALE, k));
}

export function cameraBand(k: number, k0: number): CameraBand {
  return k < k0 * 1.7 ? "0" : k < k0 * 3.1 ? "1" : k < k0 * 5.6 ? "2" : "3";
}

export function homePose(vw: number, vh: number, k0: number): CameraPose {
  return {
    k: k0,
    tx: (vw - W * k0) / 2,
    ty: (vh - H * k0) / 2,
  };
}

export function centeredPose(
  vw: number,
  vh: number,
  gx: number,
  gy: number,
  k: number,
  dy = 0,
): CameraPose {
  return { k, tx: vw / 2 - gx * k, ty: vh / 2 + dy - gy * k };
}

export function zoomPoseAt(pose: CameraPose, sx: number, sy: number, nextK: number): CameraPose {
  return {
    k: nextK,
    tx: sx - ((sx - pose.tx) * nextK) / pose.k,
    ty: sy - ((sy - pose.ty) * nextK) / pose.k,
  };
}

export function worldToLocal(pose: CameraPose, gx: number, gy: number): { x: number; y: number } {
  return { x: worldToLocalX(pose, gx), y: worldToLocalY(pose, gy) };
}

export function worldToLocalX(pose: CameraPose, gx: number): number {
  return pose.tx + gx * pose.k;
}

export function worldToLocalY(pose: CameraPose, gy: number): number {
  return pose.ty + gy * pose.k;
}

export function localToWorld(pose: CameraPose, sx: number, sy: number): { gx: number; gy: number } {
  return { gx: (sx - pose.tx) / pose.k, gy: (sy - pose.ty) / pose.k };
}

export function centerRelative(metrics: CameraMetrics): { gx: number; gy: number; kr: number } {
  const center = localToWorld(metrics, metrics.vw / 2, metrics.vh / 2);
  return { ...center, kr: metrics.k / metrics.k0 };
}
