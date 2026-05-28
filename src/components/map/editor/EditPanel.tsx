"use client";

// Floating editor panel — opens when "Edit warp positions" is on. Shows the
// currently-selected handle (with contextual fields), then a collapsible list
// of every editable element with a Copy-as-JSON action per group. The "Copy
// ALL" button at the bottom dumps the full blob so the maintainer can paste
// the result back into galaxy-data sources.

import { useGalaxy, useGalaxyDispatch } from "../context";
import type {
  Faction,
  Landmark,
  Nebula,
  NecronDynasty,
  Theme,
  TyranidSwarm,
  WorldKind,
} from "@/lib/galaxy/types";

interface EditPanelProps {
  theme: Theme;
}

function formatNebula(n: Nebula): string {
  if (n.isRift) {
    return `  { name: '${n.name}', isRift: true, color: '${n.color}' },`;
  }
  const r = n.r ?? 0;
  const a = n.a ?? 0;
  const size = n.size ?? 2;
  return `  { name: ${JSON.stringify(n.name)}, r: ${r.toFixed(2)}, a: ${Math.round(a)}, size: ${size.toFixed(1)}, type: '${n.type ?? "warp"}', color: '${n.color}' },`;
}

function formatLandmark(l: Landmark): string {
  return `  { id: '${l.id}', name: '${l.name}', r: ${l.r.toFixed(2)}, a: ${Math.round(l.a)}, kind: '${l.kind}', faction: '${l.faction}', segment: '${l.segment}' },`;
}

function formatCicatrix([r, a]: readonly [number, number], i: number): string {
  return `  [${r.toFixed(2)}, ${Math.round(a)}],  // PT${i + 1}`;
}

function formatNecron(d: NecronDynasty): string {
  const pts = d.pts.map(([r, a]) => `[${r.toFixed(2)}, ${Math.round(a)}]`).join(", ");
  return `  { id: '${d.id}', name: ${JSON.stringify(d.name)}, color: '${d.color}', density: '${d.density}', pts: [${pts}] },`;
}

function formatTyranid(s: TyranidSwarm): string {
  const pts = s.pts.map(([r, a]) => `[${r.toFixed(2)}, ${Math.round(a)}]`).join(", ");
  return `  { id: '${s.id}', name: ${JSON.stringify(s.name)}, color: '${s.color}', density: '${s.density}', pts: [${pts}] },`;
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator?.clipboard) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    /* fall through to the textarea fallback */
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } catch {
    /* ignore */
  }
  document.body.removeChild(ta);
}

export default function EditPanel({ theme }: EditPanelProps) {
  const state = useGalaxy();
  const dispatch = useGalaxyDispatch();
  const t = theme;

  if (!state.tweaks.editWarps) return null;

  const NEB = state.data.nebulae;
  const LM = state.data.landmarks;
  const NEC = state.data.necron;
  const TYR = state.data.tyranid;
  const PTS = state.data.cicatrix;

  const nebJson = NEB.map(formatNebula).join("\n");
  const lmJson = LM.map(formatLandmark).join("\n");
  const ptsJson = PTS.map(formatCicatrix).join("\n");
  const necJson = NEC.map(formatNecron).join("\n");
  const tyrJson = TYR.map(formatTyranid).join("\n");

  const fullBlob = [
    `window.NEBULAE = [\n${nebJson}\n];`,
    `window.GALAXY_LANDMARKS = [\n${lmJson}\n];`,
    `window.CICATRIX_PTS = [\n${ptsJson}\n];`,
    `window.NECRON_DYNASTIES = [\n${necJson}\n];`,
    `window.TYRANID_SWARMS = [\n${tyrJson}\n];`,
  ].join("\n\n");

  return (
    <div
      data-no-drag
      style={{
        position: "absolute",
        top: 140,
        left: 100,
        width: 400,
        maxHeight: "calc(100vh - 220px)",
        background: `linear-gradient(180deg, ${t.bg1}f0, ${t.bg0}f5)`,
        border: `1px solid ${t.stroke}`,
        boxShadow: `0 0 30px ${t.primarySoft}, inset 0 1px 0 ${t.strokeFaint}`,
        padding: 16,
        fontFamily: t.fontMono,
        fontSize: 10,
        color: t.primary,
        zIndex: 6,
        overflow: "auto",
        pointerEvents: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div
          style={{
            fontFamily: t.fontDisplay,
            fontSize: 13,
            letterSpacing: "0.32em",
            color: t.accent,
            textTransform: "uppercase",
            textShadow: `0 0 8px ${t.primary}`,
          }}
        >
          ◈ Warp Editor
        </div>
      </div>
      <div style={{ opacity: 0.7, lineHeight: 1.55, marginBottom: 12, fontSize: 9.5 }}>
        <span style={{ color: "#ff3388" }}>●</span> Cicatrix
        <span style={{ marginLeft: 10, color: "#5cd09a" }}>●</span> Necron
        <span style={{ marginLeft: 10, color: "#ffdd66" }}>●</span> Landmarks
        <span style={{ marginLeft: 10, color: "#c97ad8" }}>●</span> Tyranid
        <span style={{ marginLeft: 10, color: "#ffaa44" }}>●</span> Warp anomalies
        <br />
        Click a handle to select; drag to move; adjust below.
      </div>

      <SelectedBlock theme={t} />

      <Section theme={t} label={`Nebulae (${NEB.length})`} body={nebJson} onCopy={() => copyToClipboard(`window.NEBULAE = [\n${nebJson}\n];`)} />
      <Section theme={t} label={`Landmarks (${LM.length})`} body={lmJson} onCopy={() => copyToClipboard(`window.GALAXY_LANDMARKS = [\n${lmJson}\n];`)} />
      <Section theme={t} label={`Cicatrix Points (${PTS.length})`} body={ptsJson} onCopy={() => copyToClipboard(`window.CICATRIX_PTS = [\n${ptsJson}\n];`)} />
      <Section theme={t} label={`Necron Dynasties (${NEC.length})`} body={necJson} onCopy={() => copyToClipboard(`window.NECRON_DYNASTIES = [\n${necJson}\n];`)} />
      <Section theme={t} label={`Tyranid Swarms (${TYR.length})`} body={tyrJson} onCopy={() => copyToClipboard(`window.TYRANID_SWARMS = [\n${tyrJson}\n];`)} />

      <button
        onClick={() => copyToClipboard(fullBlob)}
        style={{
          ...btnStyle(t),
          width: "100%",
          marginTop: 8,
          background: t.accent,
          color: t.bg0,
          fontWeight: 700,
          padding: "10px",
        }}
      >
        ⧉ Copy ALL (paste back to data sources)
      </button>

      <button
        onClick={() => dispatch({ type: "set_tweak", patch: { editWarps: false } })}
        style={{ ...btnStyle(t), width: "100%", marginTop: 6 }}
      >
        ✕ Close editor
      </button>
    </div>
  );
}

// ── Selected-handle contextual controls ────────────────────────────────────

function SelectedBlock({ theme }: { theme: Theme }) {
  const state = useGalaxy();
  const dispatch = useGalaxyDispatch();
  const sel = state.editSelection;
  if (!sel) return null;

  if (sel.kind === "nebula") {
    const n = state.data.nebulae[sel.idx];
    if (!n || n.isRift) return null;
    return (
      <SelectedCard t={theme} title={n.name} sub={`Warp anomaly · ${n.type ?? "warp"}`} swatch="#ffaa44">
        <RowSlider
          t={theme}
          label="Size"
          value={n.size ?? 2}
          min={0.4}
          max={6}
          step={0.1}
          onChange={(v) => dispatch({ type: "patch_nebula", idx: sel.idx, patch: { size: v } })}
        />
        <RowSelect
          t={theme}
          label="Type"
          value={n.type ?? "warp"}
          options={["warp", "forbidden"]}
          onChange={(v) =>
            dispatch({
              type: "patch_nebula",
              idx: sel.idx,
              patch: { type: v as Nebula["type"], color: v === "warp" ? "#ff6644" : "#88bbff" },
            })
          }
        />
        <RowColor
          t={theme}
          label="Color"
          value={n.color}
          options={["#ff6644", "#ff8866", "#a8ff66", "#88bbff", "#5cd09a", "#ff3366"]}
          onChange={(v) => dispatch({ type: "patch_nebula", idx: sel.idx, patch: { color: v } })}
        />
        <Removable t={theme} onRemove={() => dispatch({ type: "remove_element", selection: sel })} />
      </SelectedCard>
    );
  }

  if (sel.kind === "landmark") {
    const l = state.data.landmarks[sel.idx];
    if (!l) return null;
    return (
      <SelectedCard
        t={theme}
        title={l.name}
        sub={`Landmark · ${l.kind}`}
        swatch={l.faction === "chaos" ? "#ff5544" : "#ffdd66"}
      >
        <RowSelect
          t={theme}
          label="Faction"
          value={l.faction}
          options={["imperium", "chaos", "xenos", "necron", "tyranid"]}
          onChange={(v) => dispatch({ type: "patch_landmark", idx: sel.idx, patch: { faction: v as Faction } })}
        />
        <RowSelect
          t={theme}
          label="Kind"
          value={l.kind}
          options={[
            "throne",
            "fortress",
            "astartes",
            "forge",
            "hive",
            "death",
            "war",
            "warp",
            "shrine",
            "civilised",
            "xenos",
            "chaos",
            "necron",
            "tyranid",
            "dead",
          ]}
          onChange={(v) => dispatch({ type: "patch_landmark", idx: sel.idx, patch: { kind: v as WorldKind } })}
        />
        <RowText
          t={theme}
          label="Name"
          value={l.name}
          onChange={(v) => dispatch({ type: "patch_landmark", idx: sel.idx, patch: { name: v } })}
        />
        <Removable t={theme} onRemove={() => dispatch({ type: "remove_element", selection: sel })} />
      </SelectedCard>
    );
  }

  if (sel.kind === "necron") {
    const dyn = state.data.necron[sel.idx];
    if (!dyn) return null;
    return (
      <SelectedCard
        t={theme}
        title={dyn.name}
        sub={`Necron · ${dyn.pts.length}-pt ${dyn.pts.length === 2 ? "corridor" : "polygon"}`}
        swatch={dyn.color}
      >
        <RowSelect
          t={theme}
          label="Density"
          value={dyn.density}
          options={["mid", "high"]}
          onChange={(v) => dispatch({ type: "patch_necron", idx: sel.idx, patch: { density: v as NecronDynasty["density"] } })}
        />
        <RowColor
          t={theme}
          label="Color"
          value={dyn.color}
          options={["#5cd09a", "#7ad8a4", "#3fb088", "#a8ffcc"]}
          onChange={(v) => dispatch({ type: "patch_necron", idx: sel.idx, patch: { color: v } })}
        />
        <button
          onClick={() => {
            const last = dyn.pts[dyn.pts.length - 1];
            dispatch({ type: "necron_add_pt", idx: sel.idx, pt: [Math.min(0.95, last[0] + 0.05), last[1] + 5] });
          }}
          style={btnStyle(theme)}
        >
          + Add control point
        </button>
        {dyn.pts.length > 2 && (
          <button onClick={() => dispatch({ type: "necron_pop_pt", idx: sel.idx })} style={btnStyle(theme)}>
            − Remove last point
          </button>
        )}
        <Removable t={theme} onRemove={() => dispatch({ type: "remove_element", selection: sel })} />
      </SelectedCard>
    );
  }

  if (sel.kind === "tyranid") {
    const sw = state.data.tyranid[sel.idx];
    if (!sw) return null;
    return (
      <SelectedCard
        t={theme}
        title={sw.name}
        sub={`Tyranid swarm · ${sw.pts.length}-pt ${sw.pts.length === 2 ? "corridor" : "polygon"}`}
        swatch={sw.color}
      >
        <RowSelect
          t={theme}
          label="Density"
          value={sw.density}
          options={["mid", "high"]}
          onChange={(v) => dispatch({ type: "patch_tyranid", idx: sel.idx, patch: { density: v as TyranidSwarm["density"] } })}
        />
        <RowColor
          t={theme}
          label="Color"
          value={sw.color}
          options={["#c97ad8", "#a050c4", "#d895e8", "#8a3aa8"]}
          onChange={(v) => dispatch({ type: "patch_tyranid", idx: sel.idx, patch: { color: v } })}
        />
        <button
          onClick={() => {
            const last = sw.pts[sw.pts.length - 1];
            dispatch({ type: "tyranid_add_pt", idx: sel.idx, pt: [Math.min(0.95, last[0] + 0.05), last[1] + 5] });
          }}
          style={btnStyle(theme)}
        >
          + Add control point
        </button>
        {sw.pts.length > 2 && (
          <button onClick={() => dispatch({ type: "tyranid_pop_pt", idx: sel.idx })} style={btnStyle(theme)}>
            − Remove last point
          </button>
        )}
        <Removable t={theme} onRemove={() => dispatch({ type: "remove_element", selection: sel })} />
      </SelectedCard>
    );
  }

  if (sel.kind === "cicatrix") {
    return (
      <SelectedCard
        t={theme}
        title={`Cicatrix PT${sel.idx + 1}`}
        sub={`Spine control point ${sel.idx + 1} of ${state.data.cicatrix.length}`}
        swatch="#ff3388"
      >
        <div style={{ fontSize: 10, opacity: 0.65, padding: "4px 0" }}>
          Drag to reshape the rift. Points must stay in order from Eye of Terror → Scourge Stars.
        </div>
      </SelectedCard>
    );
  }

  return null;
}

// ── Inline atoms (kept local — they share visual language with the Edit panel
// and aren't re-used outside of it). ──────────────────────────────────────

function SelectedCard({
  t,
  title,
  sub,
  swatch,
  children,
}: {
  t: Theme;
  title: string;
  sub: string;
  swatch: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: `1px solid ${swatch}`,
        boxShadow: `0 0 16px ${swatch}44`,
        padding: 10,
        marginBottom: 12,
        background: "#0006",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 8, background: swatch, boxShadow: `0 0 8px ${swatch}` }} />
        <div
          style={{
            fontFamily: t.fontDisplay,
            fontSize: 12,
            letterSpacing: "0.2em",
            color: swatch,
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ fontSize: 9, opacity: 0.6, marginBottom: 8, letterSpacing: "0.12em" }}>{sub}</div>
      {children}
    </div>
  );
}

function RowSlider({
  t,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  t: Theme;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
      <div style={{ width: 60, fontSize: 10, color: t.primary, opacity: 0.7 }}>{label}</div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: t.accent }}
      />
      <div style={{ width: 40, fontFamily: t.fontMono, fontSize: 10, color: t.accent, textAlign: "right" }}>
        {Number(value).toFixed(2)}
      </div>
    </div>
  );
}

function RowSelect({
  t,
  label,
  value,
  options,
  onChange,
}: {
  t: Theme;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
      <div style={{ width: 60, fontSize: 10, color: t.primary, opacity: 0.7 }}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          padding: "4px 6px",
          background: t.bg0,
          color: t.accent,
          border: `1px solid ${t.stroke}`,
          fontFamily: t.fontMono,
          fontSize: 10,
          letterSpacing: "0.1em",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}

function RowText({
  t,
  label,
  value,
  onChange,
}: {
  t: Theme;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
      <div style={{ width: 60, fontSize: 10, color: t.primary, opacity: 0.7 }}>{label}</div>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          padding: "4px 6px",
          background: t.bg0,
          color: t.accent,
          border: `1px solid ${t.stroke}`,
          fontFamily: t.fontMono,
          fontSize: 10,
          letterSpacing: "0.08em",
          outline: "none",
        }}
      />
    </div>
  );
}

function RowColor({
  t,
  label,
  value,
  options,
  onChange,
}: {
  t: Theme;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
      <div style={{ width: 60, fontSize: 10, color: t.primary, opacity: 0.7 }}>{label}</div>
      <div style={{ display: "flex", gap: 4 }}>
        {options.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            style={{
              width: 22,
              height: 22,
              border: value === c ? `2px solid white` : `1px solid ${t.stroke}`,
              background: c,
              cursor: "pointer",
              padding: 0,
              boxShadow: value === c ? `0 0 8px ${c}` : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Removable({ t, onRemove }: { t: Theme; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      style={{
        ...btnStyle(t),
        marginTop: 4,
        borderColor: "#ff5544",
        color: "#ff7766",
      }}
    >
      ✕ Remove
    </button>
  );
}

function Section({
  theme,
  label,
  body,
  onCopy,
}: {
  theme: Theme;
  label: string;
  body: string;
  onCopy: () => void;
}) {
  const t = theme;
  return (
    <details style={{ marginBottom: 8 }}>
      <summary
        style={{
          cursor: "pointer",
          color: t.accent,
          fontSize: 10,
          letterSpacing: "0.18em",
          padding: "4px 0",
        }}
      >
        {label}
      </summary>
      <pre
        style={{
          margin: "6px 0 0 0",
          padding: 8,
          background: "#0008",
          border: `1px solid ${t.strokeFaint}`,
          fontSize: 9.5,
          lineHeight: 1.45,
          maxHeight: 180,
          overflow: "auto",
          whiteSpace: "pre",
        }}
      >
        {body}
      </pre>
      <button onClick={onCopy} style={btnStyle(t)}>
        ⧉ Copy
      </button>
    </details>
  );
}

function btnStyle(t: Theme) {
  return {
    marginTop: 6,
    padding: "5px 10px",
    background: t.bg0,
    border: `1px solid ${t.stroke}`,
    color: t.accent,
    fontFamily: t.fontMono,
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
  };
}

