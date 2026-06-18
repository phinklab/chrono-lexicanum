"use client";

// GalaxyContext — the only writeable state for the whole Cartographer port.
// Reducer-shaped (discriminated union of actions). Hydration happens lazily
// on mount inside an effect so SSR can render a stable scaffold; localStorage
// reads stay client-side.
//
// 2026-05-27 demo lock: persistence is OFF. Reads still hydrate the locked
// state from localStorage, but no `save*` calls run anywhere in this module
// — any drag / toggle / placement is in-memory only and disappears on
// reload. See the comment block on the persistence effects below.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

import { DEFAULT_TWEAKS, makeDefaultGalaxyData } from "@/lib/galaxy/data";
import { DEFAULT_ERA, isPlayableEra } from "@/lib/galaxy/eras";
import { parseHash, writeHash } from "@/lib/galaxy/share";
import {
  loadElementsFor,
  loadEra,
  loadTweaks,
  migrateLegacyKey,
} from "@/lib/galaxy/storage";
import type {
  AddModeState,
  EditSelection,
  EraId,
  GalaxyData,
  GalaxyView,
  Landmark,
  Nebula,
  NecronDynasty,
  Polar,
  SegmentumId,
  Tweaks,
  TyranidSwarm,
  World,
} from "@/lib/galaxy/types";

const DEFAULT_ADD_MODE: AddModeState = {
  phase: "idle",
  typeId: "planet-imperium",
  form: { name: "", kind: "hive", size: 2.0 },
  pts: [],
};

const DIVE_TRANSITION_MS = 700;
const SURFACE_TRANSITION_MS = 460;
type TransitionKind = "dive" | "surface";

export interface GalaxyState {
  era: EraId;
  view: GalaxyView;
  selectedWorldId: string | null;
  // Viewport-space anchor (the click position) for the world codex tooltip, so
  // the panel can float next to the planet that was clicked. Null when nothing
  // is selected or when a world is opened via deep-link (no click to anchor to).
  worldAnchor: { x: number; y: number } | null;
  // Which character "voyage" path overlay is shown on the galaxy view (null =
  // none). Not persisted (no localStorage / hash); resets implicitly only via
  // a full reload.
  selectedVoyageId: string | null;
  pan: { x: number; y: number };
  userZoom: number;
  transitioning: boolean;
  transitionKind: TransitionKind | null;
  transitionTargetView: GalaxyView | null;
  hoveredSeg: SegmentumId | null;
  hoveredLandmark: string | null;
  hoveredWorld: string | null;
  cursorPolar: { r: number; a: number } | null;
  tweaks: Tweaks;
  data: GalaxyData;
  addMode: AddModeState;
  editSelection: EditSelection | null;
  isAdmin: boolean;
  hydrated: boolean;
}

interface HydratePayload {
  era?: EraId;
  view?: GalaxyView;
  selectedWorldId?: string | null;
  tweaks?: Tweaks;
  data?: GalaxyData;
}

export type GalaxyAction =
  | { type: "hydrate"; payload: HydratePayload }
  | { type: "set_era"; era: EraId; data: GalaxyData }
  | { type: "set_view"; view: GalaxyView }
  | { type: "select_world"; worldId: string | null; anchor?: { x: number; y: number } | null }
  | { type: "select_voyage"; id: string | null }
  | { type: "set_pan"; pan: { x: number; y: number } }
  | { type: "set_zoom"; userZoom: number }
  | { type: "set_transitioning"; value: boolean }
  | { type: "begin_dive"; view: Exclude<GalaxyView, "galaxy"> }
  | { type: "begin_surface" }
  | { type: "finish_transition" }
  | { type: "set_hovered_seg"; id: SegmentumId | null }
  | { type: "set_hovered_landmark"; id: string | null }
  | { type: "set_hovered_world"; id: string | null }
  | { type: "set_cursor_polar"; coords: { r: number; a: number } | null }
  | { type: "set_tweak"; patch: Partial<Tweaks> }
  | { type: "patch_landmark"; idx: number; patch: Partial<Landmark> }
  | { type: "patch_nebula"; idx: number; patch: Partial<Nebula> }
  | { type: "patch_cicatrix_pt"; idx: number; pt: Polar }
  | { type: "patch_necron_pt"; idx: number; ptIdx: number; pt: Polar }
  | { type: "patch_tyranid_pt"; idx: number; ptIdx: number; pt: Polar }
  | { type: "patch_necron"; idx: number; patch: Partial<NecronDynasty> }
  | { type: "patch_tyranid"; idx: number; patch: Partial<TyranidSwarm> }
  | { type: "necron_add_pt"; idx: number; pt: Polar }
  | { type: "necron_pop_pt"; idx: number }
  | { type: "tyranid_add_pt"; idx: number; pt: Polar }
  | { type: "tyranid_pop_pt"; idx: number }
  | { type: "remove_element"; selection: EditSelection }
  | { type: "add_landmark"; landmark: Landmark }
  | { type: "add_nebula"; nebula: Nebula }
  | { type: "add_necron"; dynasty: NecronDynasty }
  | { type: "add_tyranid"; swarm: TyranidSwarm }
  | { type: "edit_select"; selection: EditSelection | null }
  | { type: "add_mode_set_phase"; phase: AddModeState["phase"] }
  | { type: "add_mode_set_type"; typeId: AddModeState["typeId"] }
  | { type: "add_mode_set_form"; patch: Partial<AddModeState["form"]> }
  | { type: "add_mode_push_pt"; pt: Polar }
  | { type: "add_mode_pop_pt" }
  | { type: "add_mode_set_pts"; pts: Polar[] }
  | { type: "add_mode_reset" }
  | { type: "reset_era_data"; data: GalaxyData };

function clampZoom(z: number): number {
  return Math.max(0.5, Math.min(4, z));
}

// Editor mutations always apply in-memory so a non-admin viewer can drag &
// drop and feel the map respond. Persistence (localStorage) is the layer
// that enforces "only admin's changes survive a reload" — see the save
// effects below. The 3-arg signature is preserved verbatim so we don't
// have to rewrite every case; the first/third args are no longer read.
function applyEditor<T>(_state: GalaxyState, mut: () => T, _fallback: T): T {
  return mut();
}

function reducer(state: GalaxyState, action: GalaxyAction): GalaxyState {
  switch (action.type) {
    case "hydrate": {
      const p = action.payload;
      // Add Element must never come up pre-armed on load — force it off even if
      // a previous (pre-demo-lock) session persisted addMode:true into
      // localStorage. Same for the warp-edit toggle, which is an editor mode.
      const tweaks = p.tweaks
        ? { ...p.tweaks, addMode: false, editWarps: false }
        : state.tweaks;
      return {
        ...state,
        era: p.era ?? state.era,
        view: p.view ?? state.view,
        selectedWorldId: p.selectedWorldId !== undefined ? p.selectedWorldId : state.selectedWorldId,
        tweaks,
        data: p.data ?? state.data,
        hydrated: true,
      };
    }
    case "set_era":
      return {
        ...state,
        era: action.era,
        data: action.data,
        // Switching era resets per-era view bookkeeping; the disc re-mounts.
        view: "galaxy",
        selectedWorldId: null,
        worldAnchor: null,
        pan: { x: 0, y: 0 },
        userZoom: 1,
        transitioning: false,
        transitionKind: null,
        transitionTargetView: null,
        hoveredSeg: null,
        hoveredLandmark: null,
        hoveredWorld: null,
        addMode: DEFAULT_ADD_MODE,
        editSelection: null,
      };
    case "set_view":
      return { ...state, view: action.view };
    case "select_world":
      return {
        ...state,
        selectedWorldId: action.worldId,
        worldAnchor: action.worldId ? action.anchor ?? null : null,
      };
    case "select_voyage":
      return { ...state, selectedVoyageId: action.id };
    case "set_pan":
      return { ...state, pan: action.pan };
    case "set_zoom":
      return { ...state, userZoom: clampZoom(action.userZoom) };
    case "set_transitioning":
      return {
        ...state,
        transitioning: action.value,
        transitionKind: action.value ? state.transitionKind : null,
        transitionTargetView: action.value ? state.transitionTargetView : null,
      };
    case "begin_dive":
      // Mirror of begin_surface: view, pan, and userZoom swap atomically at
      // dispatch time. The FLIP layout effect in GalaxyHologram then captures
      // the previous baseScale (1.0) vs the new dived baseScale (≥1.8) and
      // animates the bounded inverse delta — same mechanism the zoom-out uses,
      // just running toward the segmentum instead of away from it.
      return {
        ...state,
        view: action.view,
        selectedWorldId: null,
        worldAnchor: null,
        pan: { x: 0, y: 0 },
        userZoom: 1,
        transitioning: true,
        transitionKind: "dive",
        transitionTargetView: action.view,
        hoveredSeg: null,
        hoveredLandmark: null,
        hoveredWorld: null,
      };
    case "begin_surface":
      return {
        ...state,
        view: "galaxy",
        selectedWorldId: null,
        worldAnchor: null,
        pan: { x: 0, y: 0 },
        userZoom: 1,
        transitioning: true,
        transitionKind: "surface",
        transitionTargetView: "galaxy",
        hoveredSeg: null,
        hoveredLandmark: null,
        hoveredWorld: null,
      };
    case "finish_transition":
      return {
        ...state,
        transitioning: false,
        transitionKind: null,
        transitionTargetView: null,
      };
    case "set_hovered_seg":
      return { ...state, hoveredSeg: action.id };
    case "set_hovered_landmark":
      return { ...state, hoveredLandmark: action.id };
    case "set_hovered_world":
      return { ...state, hoveredWorld: action.id };
    case "set_cursor_polar":
      return { ...state, cursorPolar: action.coords };
    case "set_tweak": {
      const next: Tweaks = { ...state.tweaks, ...action.patch };
      // Closing the addMode toggle also clears any in-flight placement state
      // so reopening starts clean rather than mid-phase.
      const addMode = !next.addMode && state.addMode.phase !== "idle"
        ? DEFAULT_ADD_MODE
        : state.addMode;
      return { ...state, tweaks: next, addMode };
    }

    // ── Editor mutations (admin-only; all clone the affected list so external
    // consumers comparing by reference detect the change.) ────────────────
    case "patch_landmark":
      return applyEditor(state, () => {
        const landmarks = state.data.landmarks.slice();
        if (!landmarks[action.idx]) return state;
        landmarks[action.idx] = { ...landmarks[action.idx], ...action.patch };
        return { ...state, data: { ...state.data, landmarks } };
      }, state);
    case "patch_nebula":
      return applyEditor(state, () => {
        const nebulae = state.data.nebulae.slice();
        if (!nebulae[action.idx]) return state;
        nebulae[action.idx] = { ...nebulae[action.idx], ...action.patch };
        return { ...state, data: { ...state.data, nebulae } };
      }, state);
    case "patch_cicatrix_pt":
      return applyEditor(state, () => {
        const cicatrix = state.data.cicatrix.slice();
        if (action.idx < 0 || action.idx >= cicatrix.length) return state;
        cicatrix[action.idx] = action.pt;
        return { ...state, data: { ...state.data, cicatrix } };
      }, state);
    case "patch_necron_pt":
      return applyEditor(state, () => {
        const necron = state.data.necron.slice();
        const dyn = necron[action.idx];
        if (!dyn) return state;
        const pts = dyn.pts.slice();
        if (action.ptIdx < 0 || action.ptIdx >= pts.length) return state;
        pts[action.ptIdx] = action.pt;
        necron[action.idx] = { ...dyn, pts };
        return { ...state, data: { ...state.data, necron } };
      }, state);
    case "patch_tyranid_pt":
      return applyEditor(state, () => {
        const tyranid = state.data.tyranid.slice();
        const sw = tyranid[action.idx];
        if (!sw) return state;
        const pts = sw.pts.slice();
        if (action.ptIdx < 0 || action.ptIdx >= pts.length) return state;
        pts[action.ptIdx] = action.pt;
        tyranid[action.idx] = { ...sw, pts };
        return { ...state, data: { ...state.data, tyranid } };
      }, state);
    case "patch_necron":
      return applyEditor(state, () => {
        const necron = state.data.necron.slice();
        if (!necron[action.idx]) return state;
        necron[action.idx] = { ...necron[action.idx], ...action.patch };
        return { ...state, data: { ...state.data, necron } };
      }, state);
    case "patch_tyranid":
      return applyEditor(state, () => {
        const tyranid = state.data.tyranid.slice();
        if (!tyranid[action.idx]) return state;
        tyranid[action.idx] = { ...tyranid[action.idx], ...action.patch };
        return { ...state, data: { ...state.data, tyranid } };
      }, state);
    case "necron_add_pt":
      return applyEditor(state, () => {
        const necron = state.data.necron.slice();
        const dyn = necron[action.idx];
        if (!dyn) return state;
        necron[action.idx] = { ...dyn, pts: [...dyn.pts, action.pt] };
        return { ...state, data: { ...state.data, necron } };
      }, state);
    case "necron_pop_pt":
      return applyEditor(state, () => {
        const necron = state.data.necron.slice();
        const dyn = necron[action.idx];
        if (!dyn || dyn.pts.length <= 2) return state;
        necron[action.idx] = { ...dyn, pts: dyn.pts.slice(0, -1) };
        return { ...state, data: { ...state.data, necron } };
      }, state);
    case "tyranid_add_pt":
      return applyEditor(state, () => {
        const tyranid = state.data.tyranid.slice();
        const sw = tyranid[action.idx];
        if (!sw) return state;
        tyranid[action.idx] = { ...sw, pts: [...sw.pts, action.pt] };
        return { ...state, data: { ...state.data, tyranid } };
      }, state);
    case "tyranid_pop_pt":
      return applyEditor(state, () => {
        const tyranid = state.data.tyranid.slice();
        const sw = tyranid[action.idx];
        if (!sw || sw.pts.length <= 2) return state;
        tyranid[action.idx] = { ...sw, pts: sw.pts.slice(0, -1) };
        return { ...state, data: { ...state.data, tyranid } };
      }, state);
    case "remove_element":
      return applyEditor(state, () => {
        const { kind, idx } = action.selection;
        const data = state.data;
        if (kind === "landmark") {
          return {
            ...state,
            data: { ...data, landmarks: data.landmarks.filter((_, i) => i !== idx) },
            editSelection: null,
          };
        }
        if (kind === "nebula") {
          return {
            ...state,
            data: { ...data, nebulae: data.nebulae.filter((_, i) => i !== idx) },
            editSelection: null,
          };
        }
        if (kind === "necron") {
          return {
            ...state,
            data: { ...data, necron: data.necron.filter((_, i) => i !== idx) },
            editSelection: null,
          };
        }
        if (kind === "tyranid") {
          return {
            ...state,
            data: { ...data, tyranid: data.tyranid.filter((_, i) => i !== idx) },
            editSelection: null,
          };
        }
        return state; // cicatrix points are not individually removable
      }, state);
    case "add_landmark":
      return applyEditor(state, () => ({
        ...state,
        data: { ...state.data, landmarks: [...state.data.landmarks, action.landmark] },
      }), state);
    case "add_nebula":
      return applyEditor(state, () => ({
        ...state,
        data: { ...state.data, nebulae: [...state.data.nebulae, action.nebula] },
      }), state);
    case "add_necron":
      return applyEditor(state, () => ({
        ...state,
        data: { ...state.data, necron: [...state.data.necron, action.dynasty] },
      }), state);
    case "add_tyranid":
      return applyEditor(state, () => ({
        ...state,
        data: { ...state.data, tyranid: [...state.data.tyranid, action.swarm] },
      }), state);
    case "edit_select":
      return { ...state, editSelection: action.selection };
    case "add_mode_set_phase":
      return { ...state, addMode: { ...state.addMode, phase: action.phase } };
    case "add_mode_set_type":
      return { ...state, addMode: { ...state.addMode, typeId: action.typeId, pts: [] } };
    case "add_mode_set_form":
      return {
        ...state,
        addMode: { ...state.addMode, form: { ...state.addMode.form, ...action.patch } },
      };
    case "add_mode_push_pt":
      return { ...state, addMode: { ...state.addMode, pts: [...state.addMode.pts, action.pt] } };
    case "add_mode_pop_pt":
      return {
        ...state,
        addMode: { ...state.addMode, pts: state.addMode.pts.slice(0, -1) },
      };
    case "add_mode_set_pts":
      return { ...state, addMode: { ...state.addMode, pts: action.pts } };
    case "add_mode_reset":
      return { ...state, addMode: DEFAULT_ADD_MODE };
    case "reset_era_data":
      return { ...state, data: action.data, editSelection: null, addMode: DEFAULT_ADD_MODE };
    default:
      return state;
  }
}

function initialState(isAdmin: boolean): GalaxyState {
  return {
    era: DEFAULT_ERA,
    view: "galaxy",
    selectedWorldId: null,
    worldAnchor: null,
    selectedVoyageId: null,
    pan: { x: 0, y: 0 },
    userZoom: 1,
    transitioning: false,
    transitionKind: null,
    transitionTargetView: null,
    hoveredSeg: null,
    hoveredLandmark: null,
    hoveredWorld: null,
    cursorPolar: null,
    tweaks: { ...DEFAULT_TWEAKS },
    data: makeDefaultGalaxyData(),
    addMode: DEFAULT_ADD_MODE,
    editSelection: null,
    isAdmin,
    hydrated: false,
  };
}

const GalaxyStateContext = createContext<GalaxyState | null>(null);
const GalaxyDispatchContext = createContext<Dispatch<GalaxyAction> | null>(null);

export interface GalaxyProviderProps {
  initialIsAdmin: boolean;
  children: ReactNode;
}

export function GalaxyProvider({ initialIsAdmin, children }: GalaxyProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialIsAdmin, initialState);

  // ── Hydration: only on the client, after mount. Migrates legacy key,
  // reads tweaks + active era + per-era data, and lets URL-hash override
  // era/view/world for deep links.
  useEffect(() => {
    migrateLegacyKey();
    const hash = parseHash();
    const storedEra = loadEra();
    let era: EraId;
    if (hash.era && isPlayableEra(hash.era)) {
      era = hash.era;
    } else if (storedEra && isPlayableEra(storedEra)) {
      era = storedEra;
    } else {
      era = DEFAULT_ERA;
    }
    const tweaks = loadTweaks();
    const data = loadElementsFor(era);
    const view: GalaxyView = hash.view ?? "galaxy";
    const selectedWorldId = hash.world ?? null;
    dispatch({
      type: "hydrate",
      payload: { era, view, selectedWorldId, tweaks, data },
    });
    // Mirror the booted era into the hash so a copy-of-URL always carries it.
    writeHash({ era });
  }, []);

  // ── Persistence is intentionally OFF on /map (2026-05-27 demo lock).
  //
  // The page is treated as a frozen exhibit: whatever state lives in local-
  // Storage when the user lands is what they see, and drag & drop responds
  // in-memory but never writes back. This means a visitor (or Philipp him-
  // self showing the page on his laptop) can play with the map without
  // mutating the saved state. To re-enable saving for an editing session,
  // temporarily revert the gates here and in `switchEra` / `resetCurrentEra`
  // below — there is no UI escape hatch by design.
  //
  // Reads (loadTweaks / loadElementsFor / loadEra during hydration) stay
  // intact so the locked state still hydrates from whatever Philipp last
  // committed to localStorage.

  // ── Persistence: era + view + selected world → URL hash. share.writeHash
  // already debounces 80ms internally, so we just call it on change.
  useEffect(() => {
    if (!state.hydrated) return;
    writeHash({
      era: state.era,
      view: state.view === "galaxy" ? null : state.view,
      world: state.selectedWorldId,
    });
  }, [state.hydrated, state.era, state.view, state.selectedWorldId]);

  return (
    <GalaxyStateContext.Provider value={state}>
      <GalaxyDispatchContext.Provider value={dispatch}>
        {children}
      </GalaxyDispatchContext.Provider>
    </GalaxyStateContext.Provider>
  );
}

export function useGalaxy(): GalaxyState {
  const ctx = useContext(GalaxyStateContext);
  if (!ctx) throw new Error("useGalaxy must be used inside <GalaxyProvider>");
  return ctx;
}

export function useGalaxyDispatch(): Dispatch<GalaxyAction> {
  const ctx = useContext(GalaxyDispatchContext);
  if (!ctx) throw new Error("useGalaxyDispatch must be used inside <GalaxyProvider>");
  return ctx;
}

// Convenience hooks composed over the dispatcher — used by GalaxyHologram /
// EraSwitcher / WorldPanel.

export function useGalaxyActions() {
  const dispatch = useGalaxyDispatch();
  const state = useGalaxy();

  const switchEra = useCallback(
    (next: EraId) => {
      if (next === state.era) return;
      if (!isPlayableEra(next)) return;
      // Persistence is OFF — see the comment block above the effects. We
      // still LOAD from localStorage so the locked state for the target era
      // is what the user sees, but we never write back. Anything the visitor
      // dragged in the outgoing era is dropped on the floor; reloading the
      // page restores the locked baseline.
      const data = loadElementsFor(next);
      writeHash({ era: next });
      dispatch({ type: "set_era", era: next, data });
    },
    [dispatch, state.era],
  );

  const dive = useCallback(
    (segId: Exclude<GalaxyView, "galaxy">) => {
      if (state.view !== "galaxy" || state.transitioning) return;
      dispatch({ type: "begin_dive", view: segId });
      setTimeout(() => dispatch({ type: "finish_transition" }), DIVE_TRANSITION_MS);
    },
    [dispatch, state.transitioning, state.view],
  );

  const surface = useCallback(() => {
    if (state.transitioning) return;
    dispatch({ type: "begin_surface" });
    setTimeout(() => dispatch({ type: "finish_transition" }), SURFACE_TRANSITION_MS);
  }, [dispatch, state.transitioning]);

  const chooseWorld = useCallback(
    (w: World | null) => {
      dispatch({ type: "select_world", worldId: w ? w.id : null });
    },
    [dispatch],
  );

  // resetCurrentEra is no longer reachable from the UI (the reset button was
  // dropped per the 2026-05-27 demo-lock spec). Kept in the hook so the
  // action survives for future opt-in reuse — but it never writes to local-
  // Storage in this build.
  const resetCurrentEra = useCallback(() => {
    const fresh = makeDefaultGalaxyData();
    dispatch({ type: "reset_era_data", data: fresh });
  }, [dispatch]);

  return useMemo(
    () => ({ switchEra, dive, surface, chooseWorld, resetCurrentEra }),
    [switchEra, dive, surface, chooseWorld, resetCurrentEra],
  );
}
