"use client";

/**
 * CartographerRoot — client root of the /map route. Owns the discrete UI
 * state (selection, census filters, course, instruments, direction proofs)
 * in one small reducer; the camera never enters React state (see
 * ChartStage/chart-bus). The chart itself is mount-gated (client-only); the
 * SSR pass renders the overture + cartouche so the route paints before
 * hydration.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";

import { parseMapHash, writeMapHash } from "@/lib/map/hash";
import type { MapPayload } from "@/lib/map/payload";
import { catalogSource } from "@/lib/map/pin-source";
import { VOYAGES, resolveVoyage } from "@/lib/map/voyages";
import { useOverlayBackGuard } from "@/lib/map/useOverlayBackGuard";
import type { ZonesMode } from "@/lib/map/zones";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useReducedMotion } from "@/lib/useReducedMotion";

import { Cartouche, Overture } from "./Cartouche";
import CartoucheSheet from "./CartoucheSheet";
import Census from "./Census";
import ChartStage from "./ChartStage";
import CourseCards from "./CourseCards";
import RouteMotionCanvas from "./RouteMotionCanvas";
import RoutesLayer from "./RoutesLayer";
import Selection from "./Selection";
import VoyageTour from "./VoyageTour";
import WorldPanel from "./WorldPanel";
import { ChartBus } from "./chart-bus";
import { GridDots, HatchDefs, PolarFrame, SegmentumWatermarks, TerraInstrument } from "./decor";
import { DustLayer, PinLayer, RegionLabels } from "./layers";
import { LumenNihilus } from "./LumenNihilus";
import ZoneEditor from "./ZoneEditor";
import { ZonesLayer } from "./ZonesLayer";

/** Active Great Journey: mode "tour" is the guided playback (step −1 =
 *  overture card, 0…n−1 = stations), mode "free" the explore tableau
 *  (step ≥ n, reached via "Show the full route" → route stands fully drawn;
 *  its Back/Restart buttons dispatch voyageStep, which returns to "tour").
 *  A free step < 0 would mean the ambient draw-in — no UI path leads there
 *  since the "Skip tour" button went (2026-07-13). */
interface VoyageState {
  id: string;
  mode: "tour" | "free";
  step: number;
}

interface CgState {
  condensed: boolean;
  selectedId: string | null;
  hiddenCls: ReadonlySet<number>;
  dustOff: boolean;
  worksOnly: boolean;
  voyage: VoyageState | null;
  lumen: boolean;
  nihilus: boolean;
  /** Force names: every visible world shows its name at every zoom — a
   *  lifeline for thin filters (e.g. fleets only). */
  names: boolean;
  /** Curated zone fields: full → dimmed (no names) → hidden. */
  zones: ZonesMode;
}

const INITIAL: CgState = {
  condensed: false,
  selectedId: null,
  hiddenCls: new Set<number>(),
  dustOff: false,
  worksOnly: false,
  voyage: null,
  lumen: false,
  nihilus: false,
  names: false,
  zones: "on",
};

type CgAction =
  | { type: "condense" }
  | { type: "select"; id: string | null }
  | { type: "toggleCls"; ci: number }
  | { type: "setCls"; cis: number[]; hidden: boolean }
  | { type: "toggleDust" }
  | { type: "toggleWorksOnly" }
  | { type: "voyageStart"; id: string }
  | { type: "voyageStep"; step: number }
  | { type: "voyageFree"; step: number }
  | { type: "voyageEnd" }
  | { type: "toggleLumen" }
  | { type: "toggleNihilus" }
  | { type: "toggleNames" }
  | { type: "cycleZones" };

function reducer(state: CgState, action: CgAction): CgState {
  switch (action.type) {
    case "condense":
      return state.condensed ? state : { ...state, condensed: true };
    case "select":
      return state.selectedId === action.id ? state : { ...state, selectedId: action.id, condensed: true };
    case "toggleCls": {
      const hiddenCls = new Set(state.hiddenCls);
      if (hiddenCls.has(action.ci)) hiddenCls.delete(action.ci);
      else hiddenCls.add(action.ci);
      return { ...state, hiddenCls };
    }
    case "setCls": {
      const hiddenCls = new Set(state.hiddenCls);
      for (const ci of action.cis) {
        if (action.hidden) hiddenCls.add(ci);
        else hiddenCls.delete(ci);
      }
      return { ...state, hiddenCls };
    }
    case "toggleDust":
      return { ...state, dustOff: !state.dustOff };
    case "toggleWorksOnly":
      return { ...state, worksOnly: !state.worksOnly };
    case "voyageStart":
      // Picking the active journey again toggles it off; a new one always
      // opens at the tour's overture.
      return {
        ...state,
        condensed: true,
        voyage:
          state.voyage?.id === action.id ? null : { id: action.id, mode: "tour", step: -1 },
      };
    case "voyageStep":
      return state.voyage
        ? { ...state, voyage: { ...state.voyage, mode: "tour", step: action.step } }
        : state;
    case "voyageFree":
      return state.voyage
        ? { ...state, voyage: { ...state.voyage, mode: "free", step: action.step } }
        : state;
    case "voyageEnd":
      return state.voyage ? { ...state, voyage: null } : state;
    case "toggleLumen":
      return { ...state, condensed: true, lumen: !state.lumen };
    case "toggleNihilus":
      return { ...state, condensed: true, nihilus: !state.nihilus };
    case "toggleNames":
      return { ...state, names: !state.names };
    case "cycleZones":
      return {
        ...state,
        zones: state.zones === "on" ? "dim" : state.zones === "dim" ? "off" : "on",
      };
  }
}

const emptySubscribe = () => () => {};

export default function CartographerRoot({ payload }: { payload: MapPayload }) {
  // Mount gate: SSR renders overture + cartouche, the chart is client-only.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const reduce = useReducedMotion();
  // Zone-editor flag (?zones=edit) — client-only, same snapshot pattern as
  // the mount gate (the hash writer preserves location.search).
  const zoneEditParam = useSyncExternalStore(
    emptySubscribe,
    () => new URLSearchParams(window.location.search).get("zones") === "edit",
    () => false,
  );
  // Hard dev gate: the curation tool exists ONLY on localhost. NODE_ENV is
  // statically replaced at build time — in the prod build zoneEdit is
  // constant false, ?zones=edit is ignored and the ZoneEditor branch
  // (including its import) drops out of the bundle as dead code. The curated
  // zones themselves (zones.json, published) still ship.
  const zoneEdit = process.env.NODE_ENV === "development" && zoneEditParam;
  const [state, dispatch] = useReducer(reducer, INITIAL);
  // Sheet expansion lives here (not in CartoucheSheet) so the phone
  // back-guard below can dismiss it.
  const [sheetOpen, setSheetOpen] = useState(false);
  const bus = useMemo(() => new ChartBus(), []);
  const magRef = useRef<HTMLSpanElement | null>(null);

  const source = useMemo(() => catalogSource(payload), [payload]);
  const selectedWorld = state.selectedId ? source.peek(state.selectedId) : null;
  const activeVoyage = useMemo(() => {
    const v = state.voyage ? VOYAGES.find((c) => c.id === state.voyage?.id) : null;
    return v ? resolveVoyage(v, payload) : null;
  }, [state.voyage, payload]);
  const hiIds = useMemo(
    () =>
      activeVoyage
        ? new Set(activeVoyage.stations.filter((s) => s.kind === "world").map((s) => s.id))
        : null,
    [activeVoyage],
  );
  /* RoutesLayer reveal: tour steps gate the drawing; free mode is the
     standing route (step = n). The null/ambient branch survives only as a
     fallback — no UI dispatches a free step < 0 anymore. */
  const voyageProgress =
    state.voyage === null
      ? null
      : state.voyage.mode === "tour"
        ? state.voyage.step
        : state.voyage.step >= 0
          ? state.voyage.step
          : null;

  /* Selection highlight, imperative: `sel-on` is NOT a PinLayer prop — a
     selection change must never re-render the 1000+-label layers. Applied
     synchronously on select (before the flight's `.moving` class gates the
     hover rules, so the hover-look hands over to `sel-on` without a single
     transition frame) and repaired after every commit. */
  const applySelClass = useCallback((id: string | null) => {
    const chart = document.querySelector(".cg-chart");
    if (!chart) return;
    for (const el of chart.querySelectorAll(".cg-w.sel-on")) {
      if (el.getAttribute("data-pin") !== id) el.classList.remove("sel-on");
    }
    if (id) {
      chart.querySelector(`.cg-w[data-pin="${CSS.escape(id)}"]`)?.classList.add("sel-on");
    }
  }, []);

  /* Focus restore (S10a): remember the control that opened the panel; when
     the panel closes while focus is INSIDE it (user tabbed in, or clicked
     the ✕), hand focus back. Opening never steals focus (S8 smoke: seek
     keeps focus while the panel opens). */
  const invokerRef = useRef<HTMLElement | null>(null);

  const selectWorld = useCallback(
    (id: string | null, fly = true) => {
      if (id) {
        const a = document.activeElement;
        invokerRef.current = a instanceof HTMLElement && a !== document.body ? a : null;
      } else {
        const pop = document.querySelector(".cg-pop");
        if (pop && pop.contains(document.activeElement)) {
          const target = invokerRef.current?.isConnected
            ? invokerRef.current
            : document.getElementById("main");
          target?.focus();
        }
        invokerRef.current = null;
      }
      applySelClass(id);
      dispatch({ type: "select", id });
      if (!id || !fly) return;
      const w = source.peek(id);
      const driver = bus.driver;
      if (w && driver) {
        bus.flyTo(w.gx, w.gy, Math.max(driver.getK(), driver.getK0() * 2.4), 900);
      }
    },
    [bus, source, applySelClass],
  );

  /* Phone back gesture: one guard history entry while any dismissible
     overlay is open — back closes the topmost (sheet > world popup >
     voyage) instead of leaving the site. Desktop stays history-free. */
  const narrow = useMediaQuery("(max-width: 900px)");
  useOverlayBackGuard(narrow, [
    { open: sheetOpen, close: () => setSheetOpen(false) },
    { open: state.selectedId !== null, close: () => selectWorld(null) },
    {
      open: state.voyage !== null,
      close: () => dispatch({ type: "voyageEnd" }),
    },
  ]);

  /* Route-scoped chrome: body class (burger instead of rail), scroll lock */
  useEffect(() => {
    document.body.classList.add("cg-on-map");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("cg-on-map");
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  /* Hash restore (once) + hash writes */
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || !mounted) return;
    restored.current = true;
    const h = parseMapHash();
    if (h.cam && bus.driver) bus.driver.setCamRel(h.cam.gx, h.cam.gy, h.cam.kr);
    if (h.world && source.peek(h.world)) {
      dispatch({ type: "condense" });
      selectWorld(h.world, !h.cam);
    }
  }, [mounted, bus, source, selectWorld]);

  useEffect(
    () =>
      bus.onFrame(() => {
        const c = bus.driver?.getCenterRel();
        if (c) writeMapHash({ cam: c });
      }),
    [bus],
  );

  useEffect(() => {
    if (restored.current) writeMapHash({ world: state.selectedId });
  }, [state.selectedId]);

  /* Escape closes the topmost layer: world popup, then the active journey.
     (The seek input and the mobile sheet intercept Escape earlier via
     stopPropagation.) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (state.selectedId !== null) selectWorld(null);
      else if (state.voyage !== null) dispatch({ type: "voyageEnd" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectWorld, state.selectedId, state.voyage]);

  /* Repair pass (no deps): a filter re-render that rewrites a pin's className
     would drop `sel-on` — re-apply after every commit. */
  useEffect(() => {
    applySelClass(state.selectedId);
  });

  const condense = useCallback(() => dispatch({ type: "condense" }), []);
  const pick = useCallback((id: string | null) => selectWorld(id), [selectWorld]);

  /* Keyboard entry: the overture's ENTER button lifts the veil and parks
     focus on #main — the next Tab lands on the first live control (desktop:
     the seek field; phones: the drawer grip). */
  const enterChart = useCallback(() => {
    dispatch({ type: "condense" });
    document.getElementById("main")?.focus();
  }, []);

  /* ONE status region (the S9 Chronicle lesson): world panel + tour steps
     speak here; everything else announces via its own control semantics.
     Derived with the "adjust state during render" pattern (same as the
     panel's setShown) — keyed, so each state speaks exactly once and the
     initial mount stays silent. */
  const [live, setLive] = useState<{ key: string; msg: string }>({ key: "init", msg: "" });
  {
    let key: string;
    let msg: string;
    if (selectedWorld) {
      const records =
        selectedWorld.n === 0
          ? "no records"
          : selectedWorld.n === 1
            ? "1 record"
            : `${selectedWorld.n} records`;
      key = `sel:${selectedWorld.id}`;
      msg = `${selectedWorld.name} — ${records} — world panel open`;
    } else if (state.voyage?.mode === "tour" && activeVoyage) {
      const s = state.voyage.step;
      const st = activeVoyage.stations[s];
      key = `tour:${activeVoyage.id}:${s}`;
      msg =
        s < 0 || !st
          ? `${activeVoyage.name} — journey tour open — ${activeVoyage.stations.length} stations`
          : `Station ${s + 1} of ${activeVoyage.stations.length} — ${st.heading}`;
    } else {
      key = "idle";
      // Announce the close only after a panel actually spoke (never on load).
      msg = live.key.startsWith("sel:") ? "World panel closed" : "";
    }
    if (key !== live.key) setLive({ key, msg });
  }
  const liveMsg = live.msg;

  /* Zoom presets: fly — the center stays put — to exactly the magnification
     at which the next name tier is loaded (band thresholds 3.1/5.6 in
     ChartStage; 3.2/6.0 leave a hair's breadth of headroom). */
  const zoomPreset = useCallback(
    (kr: number) => {
      dispatch({ type: "condense" });
      const driver = bus.driver;
      if (!driver) return;
      const c = driver.getCenterRel();
      bus.flyTo(c.gx, c.gy, driver.getK0() * kr, 650);
    },
    [bus],
  );

  const anyFiltered = state.hiddenCls.size > 0 || state.dustOff || state.worksOnly;

  /* Legend badge for the journeys section: live tour progress, else "active". */
  const voyageNote = state.voyage
    ? state.voyage.mode === "tour" && state.voyage.step >= 0 && activeVoyage
      ? `touring ${state.voyage.step + 1}/${activeVoyage.stations.length}`
      : "active"
    : null;

  // One census definition feeds both control surfaces — the desktop cartouche
  // and the mobile drawer; only one is ever displayed.
  const census = (
    <Census
      payload={payload}
      hiddenCls={state.hiddenCls}
      worksOnly={state.worksOnly}
      dustOff={state.dustOff}
      namesOn={state.names}
      zones={state.zones}
      onToggleCls={(ci) => dispatch({ type: "toggleCls", ci })}
      onSetCls={(cis, hidden) => dispatch({ type: "setCls", cis, hidden })}
      onToggleWorksOnly={() => dispatch({ type: "toggleWorksOnly" })}
      onToggleDust={() => dispatch({ type: "toggleDust" })}
      onToggleNames={() => dispatch({ type: "toggleNames" })}
      onCycleZones={() => dispatch({ type: "cycleZones" })}
    />
  );

  return (
    <>
      <div className="cg-rule top" aria-hidden />
      <div className="cg-rule bot" aria-hidden />
      {/* No "000" degree mark at north — the centered site brand
          ("Chrono Lexicanum · Tabula") sits there. */}
      <span className="cg-deg e" aria-hidden>
        090
      </span>
      <span className="cg-deg s" aria-hidden>
        180
      </span>
      <span className="cg-deg w" aria-hidden>
        270
      </span>

      {mounted && (
        <>
          <ChartStage
            bus={bus}
            lumen={state.lumen}
            nihilus={state.nihilus}
            names={state.names}
            zones={state.zones}
            // Keep the voyage alive behind a world panel, but suspend its
            // aggressive context dimming while that panel is being read.
            courseId={state.selectedId === null ? (state.voyage?.id ?? null) : null}
            condensed={state.condensed}
            reduce={reduce}
            magRef={magRef}
            onCondense={condense}
            onPick={pick}
            motionLayer={
              <>
                <RoutesLayer resolved={activeVoyage} progress={voyageProgress} />
                <TerraInstrument />
                {selectedWorld && <Selection key={selectedWorld.id} world={selectedWorld} />}
              </>
            }
          >
            <HatchDefs />
            <GridDots />
            {/* Background instruments belong below every world, label and
                route. They previously lived in the later motion SVG, which
                made the huge Lumen/Nihilus shades cover the planets. */}
            <LumenNihilus />
            <PolarFrame />
            <SegmentumWatermarks />
            {/* Zone fields come exclusively from the hand-curated zones.json. */}
            <g id="cg-fields">{!zoneEdit && <ZonesLayer />}</g>
            <DustLayer
              payload={payload}
              hiddenCls={state.hiddenCls}
              dustOff={state.dustOff}
              worksOnly={state.worksOnly}
            />
            <PinLayer featured={payload.featured} hiddenCls={state.hiddenCls} hiIds={hiIds} />
            <RegionLabels regions={payload.regions} featured={payload.featured} />
            {zoneEdit && <ZoneEditor bus={bus} />}
          </ChartStage>
          <RouteMotionCanvas
            bus={bus}
            resolved={activeVoyage}
            progress={voyageProgress}
            reduce={reduce}
          />
        </>
      )}

      <Overture condensed={state.condensed} payload={payload} onEnter={enterChart} />

      {/* The one SR status region — world panel + tour steps. */}
      <div className="cg-sr" role="status">
        {liveMsg}
      </div>

      <Cartouche
        payload={payload}
        condensed={state.condensed}
        voyageId={state.voyage?.id ?? null}
        voyageNote={voyageNote}
        lumen={state.lumen}
        nihilus={state.nihilus}
        filtered={anyFiltered}
        onPick={pick}
        onVoyage={(id) => dispatch({ type: "voyageStart", id })}
        onToggleLumen={() => dispatch({ type: "toggleLumen" })}
        onToggleNihilus={() => dispatch({ type: "toggleNihilus" })}
      >
        {census}
      </Cartouche>

      {/* Mobile counterpart — same dispatches, CSS-gated to ≤900px. */}
      <CartoucheSheet
        payload={payload}
        voyageId={state.voyage?.id ?? null}
        voyageNote={voyageNote}
        lumen={state.lumen}
        nihilus={state.nihilus}
        filtered={anyFiltered}
        suppressed={state.selectedId !== null}
        veiled={!state.condensed}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onPick={pick}
        onVoyage={(id) => dispatch({ type: "voyageStart", id })}
        onToggleLumen={() => dispatch({ type: "toggleLumen" })}
        onToggleNihilus={() => dispatch({ type: "toggleNihilus" })}
      >
        {census}
      </CartoucheSheet>

      <WorldPanel
        world={selectedWorld}
        payload={payload}
        source={source}
        bus={bus}
        suppressed={sheetOpen}
        onClose={() => selectWorld(null)}
      />

      {mounted && activeVoyage && state.voyage?.mode === "tour" && (
        <VoyageTour
          key={activeVoyage.id}
          resolved={activeVoyage}
          bus={bus}
          reduce={reduce}
          suppressed={state.selectedId !== null}
          muted={sheetOpen}
          step={state.voyage.step}
          onStep={(step) => dispatch({ type: "voyageStep", step })}
          onFin={() => dispatch({ type: "voyageFree", step: activeVoyage.stations.length })}
          onExit={() => dispatch({ type: "voyageEnd" })}
        />
      )}

      {mounted && activeVoyage && state.voyage?.mode === "free" && (
        <CourseCards
          key={activeVoyage.id}
          resolved={activeVoyage}
          suppressed={state.selectedId !== null}
          muted={sheetOpen}
          onBack={() => dispatch({ type: "voyageStep", step: activeVoyage.stations.length - 1 })}
          onRestart={() => dispatch({ type: "voyageStep", step: 0 })}
        />
      )}

      <div className="cg-zoomer" inert={!state.condensed || sheetOpen}>
        <button
          title="Magnify"
          aria-label="Magnify"
          onClick={() => {
            condense();
            bus.zoomAtCenter(1.45);
          }}
        >
          +
        </button>
        <button
          title="Withdraw"
          aria-label="Withdraw"
          onClick={() => {
            condense();
            bus.zoomAtCenter(1 / 1.45);
          }}
        >
          −
        </button>
        <button
          className="preset"
          title="Magnify to 3.2×: the recorded worlds' names come on"
          aria-label="Magnify to 3×: the recorded worlds' names come on"
          onClick={() => zoomPreset(3.2)}
        >
          3×
        </button>
        <button
          className="preset"
          title="Magnify to 6.0×: every name on the chart comes on"
          aria-label="Magnify to 6×: every name on the chart comes on"
          onClick={() => zoomPreset(6.0)}
        >
          6×
        </button>
        <button
          title="Full sweep"
          aria-label="Full sweep: withdraw to the whole chart"
          onClick={() => {
            condense();
            selectWorld(null);
            bus.home(800);
          }}
        >
          ⌂
        </button>
      </div>
      {/* Coordinates are curation internals (Excel space) — the readout shows
          only the magnification. aria-hidden: a per-frame textContent write
          is a visual instrument, not something AT should stumble into. */}
      <p className="cg-readout" aria-hidden="true">
        <span className="mag" ref={magRef}>
          MAG 1.00×
        </span>
      </p>

      {/* Curation entry point, visible only on the dev server (the editor
          itself is reached via ?zones=edit; full navigation so the query
          snapshot is re-read — the localStorage draft survives). */}
      {process.env.NODE_ENV === "development" && (
        <a className="cg-zed-toggle" href={zoneEdit ? "/map" : "/map?zones=edit"}>
          {zoneEdit ? "✕ Exit zone editor" : "⌖ Zone editor"}
        </a>
      )}

    </>
  );
}
