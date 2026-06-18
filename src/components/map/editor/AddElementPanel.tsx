"use client";

// Add-Element wizard. Lives in four phases:
//   idle   → CTA button to start
//   pick   → choose type / name / kind / size
//   place  → click the map N times; AddMode flag in state tells the hologram
//            to route clicks here instead of dive
//   review → preview captured coords → Save commits to data
//
// All mutations go through the reducer. Map-click routing is handled by
// GalaxyHologram, which dispatches `add_mode_push_pt` while state.tweaks.addMode
// is true AND state.addMode.phase === 'place'.

import { useEffect } from "react";

import { inSegment } from "@/lib/galaxy/coords";
import { getLiveSegments } from "@/lib/galaxy/data";
import type {
  AddElementTypeId,
  AddModeForm,
  Landmark,
  Nebula,
  NecronDynasty,
  Polar,
  SegmentumId,
  Theme,
  TyranidSwarm,
  WorldKind,
} from "@/lib/galaxy/types";

import { useGalaxy, useGalaxyDispatch } from "../context";

interface ElementType {
  label: string;
  swatch: string;
  /** 1 for a single-click point; -1 for a multi-point zone (>= 2). */
  points: 1 | -1;
  target: "landmarks" | "nebulae" | "necron" | "tyranid";
  kinds?: WorldKind[];
  defaultKind?: WorldKind;
  build: (form: AddModeForm, pts: readonly Polar[], segId: SegmentumId) =>
    | { kind: "landmark"; value: Landmark }
    | { kind: "nebula"; value: Nebula }
    | { kind: "necron"; value: NecronDynasty }
    | { kind: "tyranid"; value: TyranidSwarm };
}

const newId = () => `usr-${Math.random().toString(36).slice(2, 8)}`;

const ELEMENT_TYPES: Record<AddElementTypeId, ElementType> = {
  "planet-imperium": {
    label: "Planet · Imperium",
    swatch: "#f0b248",
    points: 1,
    target: "landmarks",
    kinds: ["hive", "fortress", "astartes", "forge", "death", "war", "shrine", "civilised", "throne", "dead"],
    defaultKind: "hive",
    build: (form, pts, segId) => ({
      kind: "landmark",
      value: {
        id: newId(),
        name: form.name.toUpperCase(),
        r: pts[0][0],
        a: pts[0][1],
        kind: form.kind,
        faction: "imperium",
        segment: segId,
      },
    }),
  },
  "planet-chaos": {
    label: "Planet · Chaos",
    swatch: "#d04428",
    points: 1,
    target: "landmarks",
    kinds: ["chaos", "warp", "dead", "death", "war"],
    defaultKind: "chaos",
    build: (form, pts, segId) => ({
      kind: "landmark",
      value: {
        id: newId(),
        name: form.name.toUpperCase(),
        r: pts[0][0],
        a: pts[0][1],
        kind: form.kind,
        faction: "chaos",
        segment: segId,
      },
    }),
  },
  "planet-xenos": {
    label: "Planet · Xenos",
    swatch: "#5cd09a",
    points: 1,
    target: "landmarks",
    kinds: ["xenos", "hive", "death", "war", "dead", "civilised"],
    defaultKind: "xenos",
    build: (form, pts, segId) => ({
      kind: "landmark",
      value: {
        id: newId(),
        name: form.name.toUpperCase(),
        r: pts[0][0],
        a: pts[0][1],
        kind: form.kind,
        faction: "xenos",
        segment: segId,
      },
    }),
  },
  "planet-necron": {
    label: "Planet · Necron",
    swatch: "#7ad8a4",
    points: 1,
    target: "landmarks",
    kinds: ["necron", "dead", "fortress"],
    defaultKind: "necron",
    build: (form, pts, segId) => ({
      kind: "landmark",
      value: {
        id: newId(),
        name: form.name.toUpperCase(),
        r: pts[0][0],
        a: pts[0][1],
        kind: form.kind,
        faction: "necron",
        segment: segId,
      },
    }),
  },
  "planet-tyranid": {
    label: "Planet · Tyranid",
    swatch: "#c97ad8",
    points: 1,
    target: "landmarks",
    kinds: ["tyranid", "dead", "death"],
    defaultKind: "tyranid",
    build: (form, pts, segId) => ({
      kind: "landmark",
      value: {
        id: newId(),
        name: form.name.toUpperCase(),
        r: pts[0][0],
        a: pts[0][1],
        kind: form.kind,
        faction: "tyranid",
        segment: segId,
      },
    }),
  },
  "zone-warp": {
    label: "Zone · Warp anomaly",
    swatch: "#ff6644",
    points: 1,
    target: "nebulae",
    build: (form, pts) => ({
      kind: "nebula",
      value: {
        name: form.name,
        r: pts[0][0],
        a: pts[0][1],
        size: form.size,
        type: "warp",
        color: "#ff6644",
      },
    }),
  },
  "zone-necron": {
    label: "Zone · Necron Dynasty",
    swatch: "#5cd09a",
    points: -1,
    target: "necron",
    build: (form, pts) => ({
      kind: "necron",
      value: {
        id: form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || newId(),
        name: form.name,
        color: "#5cd09a",
        density: "high",
        pts: pts.map(([r, a]) => [r, a] as Polar),
      },
    }),
  },
  "zone-tyranid": {
    label: "Zone · Tyranid Swarm",
    swatch: "#c97ad8",
    points: -1,
    target: "tyranid",
    build: (form, pts) => ({
      kind: "tyranid",
      value: {
        id: form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || newId(),
        name: form.name,
        color: "#c97ad8",
        density: "high",
        pts: pts.map(([r, a]) => [r, a] as Polar),
      },
    }),
  },
};

interface AddElementPanelProps {
  theme: Theme;
}

export default function AddElementPanel({ theme }: AddElementPanelProps) {
  const state = useGalaxy();
  const dispatch = useGalaxyDispatch();
  const t = theme;

  const { phase, typeId, form, pts } = state.addMode;
  const type = ELEMENT_TYPES[typeId];
  const isZone = type.points === -1;

  // Reset per-type default kind whenever the user picks a new type.
  useEffect(() => {
    if (!type.kinds) return;
    dispatch({
      type: "add_mode_set_form",
      patch: { kind: type.defaultKind ?? type.kinds[0] },
    });
    dispatch({ type: "add_mode_set_pts", pts: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeId]);

  if (!state.tweaks.addMode) return null;

  const setForm = (patch: Partial<AddModeForm>) => dispatch({ type: "add_mode_set_form", patch });
  const setPhase = (p: typeof phase) => dispatch({ type: "add_mode_set_phase", phase: p });

  const startPlacing = () => {
    if (!form.name.trim()) {
      window.alert("Please enter a name first.");
      return;
    }
    dispatch({ type: "add_mode_set_pts", pts: [] });
    setPhase("place");
  };

  const cancelAll = () => dispatch({ type: "add_mode_reset" });

  const finishZonePlacement = () => {
    if (pts.length < 2) {
      window.alert("A zone needs at least 2 control points. Click the map again.");
      return;
    }
    setPhase("review");
  };

  const save = () => {
    if (!pts.length) return;
    const segments = getLiveSegments(state.tweaks);
    const [r0, a0] = pts[0];
    let segId: SegmentumId = "solar";
    for (const s of segments) {
      if (inSegment(r0, a0, s)) {
        segId = s.id;
        break;
      }
    }
    const built = type.build(form, pts, segId);
    if (built.kind === "landmark") {
      dispatch({ type: "add_landmark", landmark: built.value });
    } else if (built.kind === "nebula") {
      dispatch({ type: "add_nebula", nebula: built.value });
    } else if (built.kind === "necron") {
      dispatch({ type: "add_necron", dynasty: built.value });
    } else {
      dispatch({ type: "add_tyranid", swarm: built.value });
    }
    dispatch({ type: "add_mode_reset" });
  };

  const swatch = type.swatch;

  return (
    <div
      data-no-drag
      style={{
        position: "absolute",
        // Sits to the LEFT of the floating control rail (right: 40) so the two
        // never overlap when Add Element is toggled on from the rail.
        top: 140,
        right: 240,
        width: 340,
        // Gold language: no drawn frame, no halo glow — depth is the dark
        // drop shadow + a faint bone top light-catch.
        background: "linear-gradient(180deg, rgba(6,9,16,0.97), rgba(2,4,10,0.98))",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.85), inset 0 1px 0 rgba(232,220,192,0.06)",
        padding: 16,
        fontFamily: t.fontMono,
        fontSize: 10,
        color: t.primary,
        zIndex: 6,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          fontFamily: t.fontDisplay,
          fontSize: 13,
          letterSpacing: "0.32em",
          color: t.accent,
          textTransform: "uppercase",
          textShadow: `0 0 8px ${t.primary}`,
          marginBottom: 10,
        }}
      >
        ✚ Add Element
      </div>

      {phase === "idle" && (
        <>
          <div style={{ opacity: 0.7, fontSize: 10, lineHeight: 1.55, marginBottom: 10 }}>
            Add a planet or a zone. You&apos;ll click a point on the map, then Save.
          </div>
          <AddBtn t={t} primary onClick={() => setPhase("pick")}>
            ✚ New element
          </AddBtn>
        </>
      )}

      {phase === "pick" && (
        <>
          <AddRowSelect
            t={t}
            label="Type"
            value={typeId}
            onChange={(v) => dispatch({ type: "add_mode_set_type", typeId: v as AddElementTypeId })}
            options={(Object.entries(ELEMENT_TYPES) as [AddElementTypeId, ElementType][]).map(([id, def]) => ({
              value: id,
              label: def.label,
            }))}
          />
          <AddRowText
            t={t}
            label="Name"
            value={form.name}
            placeholder={isZone ? "Hive Fleet Hydra" : "New World"}
            onChange={(v) => setForm({ name: v })}
          />
          {type.kinds && (
            <AddRowSelect<WorldKind>
              t={t}
              label="Kind"
              value={form.kind}
              onChange={(v) => setForm({ kind: v })}
              options={type.kinds.map((k) => ({ value: k, label: k.toUpperCase() }))}
            />
          )}
          {typeId === "zone-warp" && (
            <AddRowSelect<number>
              t={t}
              label="Size"
              value={form.size}
              onChange={(v) => setForm({ size: v })}
              options={[
                { value: 1.4, label: "SMALL" },
                { value: 2.0, label: "MEDIUM" },
                { value: 2.8, label: "LARGE" },
                { value: 3.6, label: "HUGE" },
              ]}
            />
          )}

          <div
            style={{
              marginTop: 10,
              padding: 8,
              background: "#0006",
              border: `1px solid ${swatch}66`,
              fontSize: 9.5,
              color: swatch,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: 8,
                background: swatch,
                boxShadow: `0 0 6px ${swatch}`,
                marginRight: 6,
                verticalAlign: "middle",
              }}
            />
            {isZone ? "◬ ZONE · multi-point" : "◉ POINT · single click"}
          </div>

          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            <AddBtn t={t} onClick={cancelAll}>
              ← Back
            </AddBtn>
            <AddBtn t={t} primary onClick={startPlacing}>
              ◎ Place on map →
            </AddBtn>
          </div>
        </>
      )}

      {phase === "place" && (
        <>
          <div
            style={{
              padding: 10,
              background: `${swatch}22`,
              border: `1px solid ${swatch}`,
              color: swatch,
              marginBottom: 10,
              fontSize: 10,
              lineHeight: 1.55,
            }}
          >
            <strong style={{ letterSpacing: "0.2em" }}>{form.name || "(unnamed)"}</strong>
            <br />
            {isZone
              ? `Click the map ${Math.max(0, 2 - pts.length)} more time(s) or more, then "Done placing".`
              : "Click the map once to drop the marker."}
          </div>
          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
            Captured points: <strong style={{ color: t.accent }}>{pts.length}</strong>
            {pts.length > 0 && (
              <div style={{ marginTop: 4, fontFamily: t.fontMono, fontSize: 9, opacity: 0.6 }}>
                {pts.map(([r, a], i) => (
                  <div key={i}>· PT{i + 1}: r {r.toFixed(3)} · a {a.toFixed(1)}°</div>
                ))}
              </div>
            )}
          </div>
          {isZone && pts.length > 0 && (
            <AddBtn t={t} onClick={() => dispatch({ type: "add_mode_pop_pt" })}>
              ⌫ Remove last
            </AddBtn>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            <AddBtn t={t} onClick={() => setPhase("pick")}>
              ← Cancel
            </AddBtn>
            {isZone && (
              <AddBtn t={t} primary disabled={pts.length < 2} onClick={finishZonePlacement}>
                ◉ Done placing
              </AddBtn>
            )}
          </div>
        </>
      )}

      {phase === "review" && (
        <>
          <div style={{ padding: 10, background: `${swatch}22`, border: `1px solid ${swatch}`, marginBottom: 10 }}>
            <div
              style={{
                fontFamily: t.fontDisplay,
                fontSize: 12,
                color: swatch,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                textShadow: `0 0 6px ${swatch}`,
                marginBottom: 4,
              }}
            >
              ◬ {form.name}
            </div>
            <div style={{ fontSize: 9, opacity: 0.8, color: swatch }}>
              {type.label.toUpperCase()}
              {type.kinds && ` · ${form.kind.toUpperCase()}`}
            </div>
          </div>
          <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 6 }}>
            Position{pts.length > 1 ? " (control points)" : ""}:
          </div>
          <div
            style={{
              fontFamily: t.fontMono,
              fontSize: 9.5,
              background: "#0008",
              border: `1px solid ${t.strokeFaint}`,
              padding: 8,
              marginBottom: 12,
              color: t.accent,
              maxHeight: 120,
              overflow: "auto",
            }}
          >
            {pts.map(([r, a], i) => (
              <div key={i}>· PT{i + 1}: r {r.toFixed(3)} · a {a.toFixed(1)}°</div>
            ))}
          </div>
          <div style={{ fontSize: 9.5, opacity: 0.6, marginBottom: 10, lineHeight: 1.5 }}>
            After saving, you can drag the handles to fine-tune in the Warp Editor.
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <AddBtn t={t} onClick={cancelAll}>
              ✕ Cancel
            </AddBtn>
            <AddBtn t={t} onClick={() => setPhase("place")}>
              ↺ Re-place
            </AddBtn>
            <AddBtn t={t} primary onClick={save}>
              ✓ Save
            </AddBtn>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Compact form atoms — kept local; they share the Edit-panel's dark
// gothic look but are smaller variants. ────────────────────────────────────

function AddBtn({
  t,
  primary,
  danger,
  onClick,
  children,
  disabled,
}: {
  t: Theme;
  primary?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 12px",
        background: primary ? t.accent : danger ? "#3a1010" : t.bg0,
        color: primary ? t.bg0 : danger ? "#ff7766" : t.accent,
        border: `1px solid ${primary ? t.accent : danger ? "#ff5544" : t.stroke}`,
        fontFamily: t.fontMono,
        fontSize: 10,
        fontWeight: primary ? 700 : 400,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function AddRowText({
  t,
  label,
  value,
  onChange,
  placeholder,
}: {
  t: Theme;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
      <div style={{ width: 64, fontSize: 10, color: t.primary, opacity: 0.7 }}>{label}</div>
      <input
        type="text"
        value={value || ""}
        placeholder={placeholder || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          padding: "5px 7px",
          background: t.bg0,
          color: t.accent,
          border: `1px solid ${t.stroke}`,
          fontFamily: t.fontMono,
          fontSize: 10.5,
          letterSpacing: "0.08em",
          outline: "none",
        }}
      />
    </div>
  );
}

interface AddRowSelectOption<T> {
  value: T;
  label: string;
}

function AddRowSelect<T extends string | number>({
  t,
  label,
  value,
  options,
  onChange,
}: {
  t: Theme;
  label: string;
  value: T;
  options: ReadonlyArray<AddRowSelectOption<T>>;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
      <div style={{ width: 64, fontSize: 10, color: t.primary, opacity: 0.7 }}>{label}</div>
      <select
        value={String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          const match = options.find((o) => String(o.value) === raw);
          if (match) onChange(match.value);
        }}
        style={{
          flex: 1,
          padding: "5px 7px",
          background: t.bg0,
          color: t.accent,
          border: `1px solid ${t.stroke}`,
          fontFamily: t.fontMono,
          fontSize: 10.5,
          letterSpacing: "0.08em",
        }}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
