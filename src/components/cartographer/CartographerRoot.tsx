"use client";

/**
 * CartographerRoot — client root of the /map rebuild (Brief 178, Studie I
 * "Maledictum"). Owns the discrete UI state (selection, census filters,
 * course, instruments, direction proofs) in one small reducer; the camera
 * never enters React state (see ChartStage/chart-bus). The chart itself is
 * mount-gated (client-only); the SSR pass renders the overture + cartouche
 * so the route paints before hydration.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useSyncExternalStore } from "react";

import { parseMapHash, writeMapHash } from "@/lib/map/hash";
import type { MapPayload } from "@/lib/map/payload";
import { catalogSource } from "@/lib/map/pin-source";
import { COURSES } from "@/lib/map/routes";
import { useReducedMotion } from "@/lib/useReducedMotion";

import { Cartouche, Overture } from "./Cartouche";
import Census from "./Census";
import ChartStage from "./ChartStage";
import CourseCards from "./CourseCards";
import DirectionPanel from "./DirectionPanel";
import GreatRift from "./GreatRift";
import RoutesLayer from "./RoutesLayer";
import Selection from "./Selection";
import Sweep from "./Sweep";
import WorldPanel from "./WorldPanel";
import { ChartBus } from "./chart-bus";
import type { SegmentumMark } from "./chart-geometry";
import { Areas, GridDots, PolarFrame, SegmentumWatermarks, Storms, TerraInstrument } from "./decor";
import { DustLayer, PinLayer, RegionLabels } from "./layers";
import { LumenNihilus } from "./LumenNihilus";

interface CgState {
  condensed: boolean;
  selectedId: string | null;
  hiddenCls: ReadonlySet<number>;
  dustOff: boolean;
  worksOnly: boolean;
  showAll: boolean;
  courseId: string | null;
  lumen: boolean;
  nihilus: boolean;
  /* Direction proofs (defaults = the study's approved slider positions). */
  storm: 1 | 2 | 3;
  riftLife: boolean;
  bgArt: boolean;
  veil: number;
  bright: number;
  grain: number;
}

const INITIAL: CgState = {
  condensed: false,
  selectedId: null,
  hiddenCls: new Set<number>(),
  dustOff: false,
  worksOnly: false,
  showAll: false,
  courseId: null,
  lumen: false,
  nihilus: false,
  storm: 2,
  riftLife: false,
  bgArt: true,
  veil: 0.82,
  bright: 0.2,
  grain: 0.09,
};

type CgAction =
  | { type: "condense" }
  | { type: "select"; id: string | null }
  | { type: "toggleCls"; ci: number }
  | { type: "setCls"; cis: number[]; hidden: boolean }
  | { type: "toggleDust" }
  | { type: "toggleWorksOnly" }
  | { type: "toggleShowAll" }
  | { type: "course"; id: string }
  | { type: "toggleLumen" }
  | { type: "toggleNihilus" }
  | { type: "storm"; v: 1 | 2 | 3 }
  | { type: "riftLife"; v: boolean }
  | { type: "bgArt"; v: boolean }
  | { type: "veil"; v: number }
  | { type: "bright"; v: number }
  | { type: "grain"; v: number };

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
    case "toggleShowAll":
      return { ...state, showAll: !state.showAll };
    case "course":
      return {
        ...state,
        condensed: true,
        courseId: state.courseId === action.id ? null : action.id,
      };
    case "toggleLumen":
      return { ...state, condensed: true, lumen: !state.lumen };
    case "toggleNihilus":
      return { ...state, condensed: true, nihilus: !state.nihilus };
    case "storm":
      return { ...state, storm: action.v };
    case "riftLife":
      return { ...state, riftLife: action.v };
    case "bgArt":
      return { ...state, bgArt: action.v };
    case "veil":
      return { ...state, veil: action.v };
    case "bright":
      return { ...state, bright: action.v };
    case "grain":
      return { ...state, grain: action.v };
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
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const bus = useMemo(() => new ChartBus(), []);
  const magRef = useRef<HTMLSpanElement | null>(null);

  const source = useMemo(() => catalogSource(payload), [payload]);
  const selectedWorld = state.selectedId ? source.detail(state.selectedId) : null;
  const activeCourse = useMemo(
    () => COURSES.find((c) => c.id === state.courseId) ?? null,
    [state.courseId],
  );
  const hiNames = useMemo(
    () => (activeCourse ? new Set(activeCourse.stations) : null),
    [activeCourse],
  );

  const selectWorld = useCallback(
    (id: string | null, fly = true) => {
      dispatch({ type: "select", id });
      if (!id || !fly) return;
      const w = source.detail(id);
      const driver = bus.driver;
      if (w && driver) {
        bus.flyTo(w.gx, w.gy, Math.max(driver.getK(), driver.getK0() * 2.4), 900);
      }
    },
    [bus, source],
  );

  const seek = useCallback(
    (query: string) => {
      // Exact featured > exact dust > partial featured > partial dust —
      // the seek covers all 1054 contacts, not just the recorded ones.
      const q = query.toLowerCase();
      let exact: string | null = null;
      let partial: string | null = null;
      for (const f of payload.featured) {
        const n = f.name.toLowerCase();
        if (n === q) {
          exact = f.id;
          break;
        }
        if (!partial && (n.startsWith(q) || n.includes(q))) partial = f.id;
      }
      if (!exact) {
        for (const d of payload.dust) {
          const n = d[4].toLowerCase();
          if (n === q) {
            exact = d[3];
            break;
          }
          if (!partial && (n.startsWith(q) || n.includes(q))) partial = d[3];
        }
      }
      const best = exact ?? partial;
      if (best) selectWorld(best);
    },
    [payload, selectWorld],
  );

  const jump = useCallback(
    (seg: SegmentumMark) => {
      dispatch({ type: "condense" });
      const driver = bus.driver;
      if (driver) bus.flyTo(seg.jump.x, seg.jump.y, driver.getK0() * seg.jump.k, 1100);
    },
    [bus],
  );

  /* ── Route-scoped chrome: body class (burger statt Rail), scroll lock ── */
  useEffect(() => {
    document.body.classList.add("cg-on-map");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("cg-on-map");
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  /* ── Direction proofs → root CSS vars (the site background photo is a
     sibling of this tree, so the vars live on <html>) ── */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--cg-veil", String(state.veil));
    root.style.setProperty("--cg-bright", String(state.bright));
    root.style.setProperty("--cg-grain", String(state.grain));
    root.classList.toggle("cg-nobg", !state.bgArt);
    return () => {
      root.style.removeProperty("--cg-veil");
      root.style.removeProperty("--cg-bright");
      root.style.removeProperty("--cg-grain");
      root.classList.remove("cg-nobg");
    };
  }, [state.veil, state.bright, state.grain, state.bgArt]);

  /* ── Hash restore (once) + hash writes ── */
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || !mounted) return;
    restored.current = true;
    const h = parseMapHash();
    if (h.cam && bus.driver) bus.driver.setCamRel(h.cam.gx, h.cam.gy, h.cam.kr);
    if (h.world && source.detail(h.world)) {
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

  /* ── Escape closes the popup ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch({ type: "select", id: null });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const condense = useCallback(() => dispatch({ type: "condense" }), []);
  const pick = useCallback((id: string | null) => selectWorld(id), [selectWorld]);

  return (
    <>
      <div className="cg-veil" aria-hidden />
      <div className="cg-grainlayer" aria-hidden />
      <div className="cg-rule top" aria-hidden />
      <div className="cg-rule bot" aria-hidden />
      <span className="cg-deg n" aria-hidden>
        000
      </span>
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
        <ChartStage
          bus={bus}
          storm={state.storm}
          lumen={state.lumen}
          nihilus={state.nihilus}
          showAll={state.showAll}
          riftLife={state.riftLife}
          courseId={state.courseId}
          reduce={reduce}
          magRef={magRef}
          onCondense={condense}
          onPick={pick}
        >
          <GridDots />
          <PolarFrame />
          <SegmentumWatermarks />
          <g id="cg-fields">
            <Storms />
            <GreatRift riftLife={state.riftLife} />
            <Areas />
          </g>
          <DustLayer
            payload={payload}
            hiddenCls={state.hiddenCls}
            dustOff={state.dustOff}
            worksOnly={state.worksOnly}
          />
          <PinLayer
            featured={payload.featured}
            hiddenCls={state.hiddenCls}
            vbCut={payload.vbCut}
            hiNames={hiNames}
            selectedId={state.selectedId}
          />
          <RegionLabels regions={payload.regions} featured={payload.featured} />
          <LumenNihilus />
          <RoutesLayer course={activeCourse} featured={payload.featured} />
          <Sweep reduce={reduce} />
          <TerraInstrument />
          {selectedWorld && <Selection key={selectedWorld.id} world={selectedWorld} />}
        </ChartStage>
      )}

      <Overture condensed={state.condensed} payload={payload} />

      <Cartouche
        payload={payload}
        condensed={state.condensed}
        courseId={state.courseId}
        lumen={state.lumen}
        nihilus={state.nihilus}
        onSeek={seek}
        onJump={jump}
        onCourse={(id) => dispatch({ type: "course", id })}
        onToggleLumen={() => dispatch({ type: "toggleLumen" })}
        onToggleNihilus={() => dispatch({ type: "toggleNihilus" })}
      >
        <Census
          payload={payload}
          hiddenCls={state.hiddenCls}
          worksOnly={state.worksOnly}
          dustOff={state.dustOff}
          showAll={state.showAll}
          onToggleCls={(ci) => dispatch({ type: "toggleCls", ci })}
          onSetCls={(cis, hidden) => dispatch({ type: "setCls", cis, hidden })}
          onToggleWorksOnly={() => dispatch({ type: "toggleWorksOnly" })}
          onToggleDust={() => dispatch({ type: "toggleDust" })}
          onToggleShowAll={() => dispatch({ type: "toggleShowAll" })}
        />
      </Cartouche>

      <WorldPanel
        world={selectedWorld}
        payload={payload}
        bus={bus}
        onClose={() => selectWorld(null)}
      />

      {mounted && activeCourse && (
        <CourseCards
          key={activeCourse.id}
          course={activeCourse}
          featured={payload.featured}
          bus={bus}
          reduce={reduce}
        />
      )}

      <div className="cg-zoomer">
        <button
          title="Magnify"
          onClick={() => {
            condense();
            bus.zoomAtCenter(1.45);
          }}
        >
          +
        </button>
        <button
          title="Withdraw"
          onClick={() => {
            condense();
            bus.zoomAtCenter(1 / 1.45);
          }}
        >
          −
        </button>
        <button
          title="Full sweep"
          onClick={() => {
            condense();
            selectWorld(null);
            bus.home(800);
          }}
        >
          ⌂
        </button>
      </div>
      {/* Koordinaten sind Kurations-Interna (Excel-Raum) — der Readout zeigt
          nur noch die Vergrößerung. */}
      <p className="cg-readout">
        <span className="mag" ref={magRef}>
          MAG 1.00×
        </span>
      </p>

      <DirectionPanel
        bgArt={state.bgArt}
        veil={state.veil}
        bright={state.bright}
        grain={state.grain}
        storm={state.storm}
        riftLife={state.riftLife}
        onBgArt={(v) => dispatch({ type: "bgArt", v })}
        onVeil={(v) => dispatch({ type: "veil", v })}
        onBright={(v) => dispatch({ type: "bright", v })}
        onGrain={(v) => dispatch({ type: "grain", v })}
        onStorm={(v) => dispatch({ type: "storm", v })}
        onRiftLife={(v) => dispatch({ type: "riftLife", v })}
      />
    </>
  );
}
