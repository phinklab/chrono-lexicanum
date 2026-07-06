"use client";

/**
 * DirectionPanel — the "Direction · proofs" sight-check panel carried over
 * from the studies for the live review (Brief 178 session note: Philipp
 * decides in the browser what ships). Controls the backdrop art, veil,
 * brightness, grain and "Rift unrest" — the cheap rift life (word glitch +
 * lightning; the study's per-cell raster animations stay unshipped, they
 * were the lag driver). The storm variant switcher I/II/III is retired
 * (178b Runde 6: Fassungen deleted, the rift is portolan hatch now).
 *
 * Remove this component (and its state fields) once the direction is fixed.
 */

interface DirectionPanelProps {
  bgArt: boolean;
  veil: number;
  bright: number;
  grain: number;
  riftLife: boolean;
  onBgArt: (v: boolean) => void;
  onVeil: (v: number) => void;
  onBright: (v: number) => void;
  onGrain: (v: number) => void;
  onRiftLife: (v: boolean) => void;
}

export default function DirectionPanel({
  bgArt,
  veil,
  bright,
  grain,
  riftLife,
  onBgArt,
  onVeil,
  onBright,
  onGrain,
  onRiftLife,
}: DirectionPanelProps) {
  return (
    <details className="cg-debug">
      <summary>Direction · proofs</summary>
      <div className="body">
        <label className="dbg-row">
          <span className="lab">Backdrop art</span>
          <input type="checkbox" checked={bgArt} onChange={(e) => onBgArt(e.target.checked)} />
        </label>
        <div className="dbg-row">
          <span className="lab">Veil</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(veil * 100)}
            onChange={(e) => onVeil(Number(e.target.value) / 100)}
          />
          <span className="val">{veil.toFixed(2)}</span>
        </div>
        <div className="dbg-row">
          <span className="lab">Brightness</span>
          <input
            type="range"
            min={5}
            max={60}
            value={Math.round(bright * 100)}
            onChange={(e) => onBright(Number(e.target.value) / 100)}
          />
          <span className="val">{bright.toFixed(2)}</span>
        </div>
        <div className="dbg-row">
          <span className="lab">Grain</span>
          <input
            type="range"
            min={0}
            max={30}
            value={Math.round(grain * 100)}
            onChange={(e) => onGrain(Number(e.target.value) / 100)}
          />
          <span className="val">{grain.toFixed(2)}</span>
        </div>
        <label className="dbg-row">
          <span className="lab">Rift unrest</span>
          <input type="checkbox" checked={riftLife} onChange={(e) => onRiftLife(e.target.checked)} />
        </label>
      </div>
    </details>
  );
}
