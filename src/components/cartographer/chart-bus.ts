/**
 * chart-bus.ts — the imperative seam between the chart camera and the HTML
 * overlays. The camera lives in refs inside ChartStage and never touches
 * React state per frame; overlays (world panel, course cards, hash writer,
 * readouts) subscribe here and reposition themselves imperatively.
 */

export type FrameListener = () => void;

/** Installed by ChartStage once mounted; null before/after. */
export interface CameraDriver {
  /** Multiply zoom around the viewport center. */
  zoomAtCenter(factor: number): void;
  /** Eased flight to a grid point at an absolute scale. */
  flyTo(gx: number, gy: number, kAbs: number, ms?: number): void;
  /** Back to the full sweep. */
  home(ms?: number): void;
  /** Instant restore: center on a grid point at kr = k/k0 (hash restore). */
  setCamRel(gx: number, gy: number, kr: number): void;
  /** Current center + relative zoom (hash write). */
  getCenterRel(): { gx: number; gy: number; kr: number };
  /** Grid → stage-viewport pixels (fixed-position overlays). */
  worldToScreen(gx: number, gy: number): { x: number; y: number };
  /** Client pixels → grid (zone-editor vertex drags). */
  screenToWorld(sx: number, sy: number): { gx: number; gy: number };
  getViewport(): { vw: number; vh: number };
  getK(): number;
  getK0(): number;
}

export class ChartBus {
  driver: CameraDriver | null = null;

  private listeners = new Set<FrameListener>();

  private flightListeners = new Set<(active: boolean) => void>();

  /** Installed/cleared by ChartStage's mount effect. */
  setDriver(driver: CameraDriver | null): void {
    this.driver = driver;
  }

  /** Subscribe to camera frames; returns the unsubscribe. */
  onFrame(cb: FrameListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** ChartStage calls this once per applied camera frame. */
  emitFrame(): void {
    for (const cb of this.listeners) cb();
  }

  /** Eased flight started/ended — overlays duck out of the way (world panel
   *  fades during the flight instead of racing pinned across the chart). */
  onFlightChange(cb: (active: boolean) => void): () => void {
    this.flightListeners.add(cb);
    return () => this.flightListeners.delete(cb);
  }

  emitFlightChange(active: boolean): void {
    for (const cb of this.flightListeners) cb(active);
  }

  zoomAtCenter(factor: number): void {
    this.driver?.zoomAtCenter(factor);
  }

  flyTo(gx: number, gy: number, kAbs: number, ms?: number): void {
    this.driver?.flyTo(gx, gy, kAbs, ms);
  }

  home(ms?: number): void {
    this.driver?.home(ms);
  }
}
