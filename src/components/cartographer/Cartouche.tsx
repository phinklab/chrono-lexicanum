"use client";

/**
 * The full overture condenses into the top-left chart cartouche. Seek ranks
 * prefix before substring and recorded worlds before dust; its A–Z index is
 * the keyboard/AT path parallel to pointer-only pins.
 *
 * Journeys and the combined overlay/census legend expose badges while
 * collapsed. Their control primitives are shared with `CartoucheSheet`.
 */

import { Fragment, useId, useMemo, useState } from "react";
import type { ReactNode, Ref } from "react";

import BtnFx from "@/components/shared/BtnFx";
import type { MapPayload } from "@/lib/map/payload";
import { VOYAGES } from "@/lib/map/voyages";
import { MAP_STATES, visibleZones, type MapState, type NamesMode, type ZonesMode } from "@/lib/map/zones";

import { BONE, GOLD } from "./chart-geometry";
import { ERA_LABELS } from "./EraPlate";

/** 1054 → "1 054" — space-grouped chart figures. */
export function fmt(n: number): string {
  return n.toLocaleString("en-US").replace(/,/g, " ");
}

export function Overture({
  condensed,
  payload,
  onEnter,
}: {
  condensed: boolean;
  payload: MapPayload;
  onEnter: () => void;
}) {
  // While the veil stands, the invisible chart chrome behind it is inert
  // (CartographerRoot) — this button is the keyboard door: it lifts the
  // veil and hands focus to the live controls. Once condensed the section
  // goes inert itself so the hidden button leaves the tab order.
  return (
    <section className={`cg-overture${condensed ? " off" : ""}`} aria-hidden={condensed} inert={condensed}>
      <p className="over">Chartae Imperialis · Maledictum</p>
      <h1>
        The <em>Cartographer</em>
      </h1>
      <p className="edition">
        <b>{fmt(payload.contacts)} worlds</b> upon the chart · {fmt(payload.coverage.placed)} of{" "}
        {fmt(payload.coverage.total)} records placed
      </p>
      {/* No gesture hint line: drag/scroll/pinch/tap are conventional map
          gestures and need no instruction text (NN/g onboarding; WM-B1). */}
      {/* Site-wide Sternwarte button: origin dot blooms into rings + survey
          stars on hover (BtnFx). */}
      <button type="button" className="lx-btn cg-enter" onClick={onEnter}>
        Enter the chart
        <BtnFx />
      </button>
    </section>
  );
}

interface SeekHit {
  id: string;
  name: string;
  n: number;
}

/** Render cap for very short queries — the list stays scrollable, the rest
 *  is a "keep typing" line. */
const SEEK_CAP = 160;

export type SectionId = "courses" | "legend";

/** Collapsible-section header — car glyph + label + optional gold state note. */
export function SectionHead({
  open,
  label,
  note,
  onToggle,
}: {
  open: boolean;
  label: string;
  note: string | null;
  onToggle: () => void;
}) {
  return (
    <button className={`c-sec${open ? " open" : ""}`} aria-expanded={open} onClick={onToggle}>
      <span className="car">▸</span>
      <span className="lab">{label}</span>
      {note ? <span className="note">{note}</span> : null}
    </button>
  );
}

/** The Great Journeys list — the chart's content door, laid out as a
 *  numbered atlas index: one intro line says what a journey IS, then the
 *  rows sit behind three unfoldable era groups (the chart editions the
 *  journeys BEGIN on — each voyage's `mapState`, W3b-B2), each group led
 *  by a one-line account of its era. Each entry stays a teaser — numeral,
 *  name in the display face, era tag, blurb clamped to two lines (the full
 *  account lives on the tour's overture card; the Esri story-map tour
 *  convention). Picking one opens the guided tour (VoyageTour); picking it
 *  again closes the journey. The chart's current edition stands open by
 *  default; a group holding the active journey opens itself, and shows a
 *  gold "active" note while closed — nothing active hides silently. */
/** Era-grouped roster + continuous atlas numbering ("01"…"12"), precomputed
 *  once — the roster is a module constant. */
const VOYAGE_GROUPS = MAP_STATES.map((era) => ({
  era,
  voyages: VOYAGES.filter((voyage) => voyage.mapState === era),
})).filter((group) => group.voyages.length > 0);
const VOYAGE_NUM = new Map(
  VOYAGE_GROUPS.flatMap((group) => group.voyages).map((voyage, i) => [
    voyage.id,
    String(i + 1).padStart(2, "0"),
  ]),
);

/** One line of era context under each unfolded group header. */
const ERA_BLURBS: Record<MapState, string> = {
  pre: "The Legions spread out from Terra to reunite mankind's scattered worlds.",
  hh: "Half the Legions turn with the Warmaster; the war runs from Isstvan to Terra.",
  now: "The Great Rift splits the galaxy; the Imperium fights on in a darkened age.",
};

export function VoyageButtons({
  era,
  voyageId,
  onVoyage,
}: {
  /** The chart's current edition — its group stands open by default. */
  era: MapState;
  voyageId: string | null;
  onVoyage: (id: string) => void;
}) {
  const [open, setOpen] = useState<ReadonlySet<MapState>>(() => new Set([era]));
  const activeEra = voyageId
    ? (VOYAGES.find((v) => v.id === voyageId)?.mapState ?? null)
    : null;
  // Follow the chart: switching the edition (era plate) or starting a
  // journey unfolds the matching group; manual folds elsewhere survive.
  // State-adjust during render off the last seen era/journey pair — not an
  // effect (react-hooks/set-state-in-effect).
  const [seen, setSeen] = useState({ era, activeEra });
  if (seen.era !== era || seen.activeEra !== activeEra) {
    setSeen({ era, activeEra });
    const next = new Set(open);
    if (seen.era !== era) next.add(era);
    if (activeEra && seen.activeEra !== activeEra) next.add(activeEra);
    setOpen(next);
  }

  const toggle = (groupEra: MapState) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(groupEra)) next.delete(groupEra);
      else next.add(groupEra);
      return next;
    });

  return (
    <div className="routes">
      <p className="rt-intro">
        Guided voyages over the chart: choose one and follow its story across
        the stars, station by station.
      </p>
      {VOYAGE_GROUPS.map(({ era: groupEra, voyages }) => {
        const unfolded = open.has(groupEra);
        const holdsActive = voyageId !== null && voyages.some((v) => v.id === voyageId);
        return (
          <Fragment key={groupEra}>
            <button
              type="button"
              className={`rt-era${unfolded ? " open" : ""}`}
              aria-expanded={unfolded}
              onClick={() => toggle(groupEra)}
            >
              <span className="car" aria-hidden>
                ▸
              </span>
              <span className="lab">
                {ERA_LABELS[groupEra].m} · {ERA_LABELS[groupEra].name}
              </span>
              <span className={`tag${holdsActive && !unfolded ? " on" : ""}`}>
                {holdsActive && !unfolded
                  ? "active"
                  : `${voyages.length} ${voyages.length === 1 ? "journey" : "journeys"}`}
              </span>
            </button>
            {unfolded && (
              <>
                <p className="rt-era-blurb">{ERA_BLURBS[groupEra]}</p>
                {voyages.map((voyage) => (
                  <button
                    key={voyage.id}
                    className={`jr${voyageId === voyage.id ? " on" : ""}`}
                    aria-pressed={voyageId === voyage.id}
                    onClick={() => onVoyage(voyage.id)}
                  >
                    {/* aria-hidden: the accessible name must start with the
                        journey's name, not a decorative numeral. */}
                    <span className="jr-num" aria-hidden>
                      {VOYAGE_NUM.get(voyage.id)}
                    </span>
                    <span className="jr-main">
                      <span className="jr-head">
                        <span className="jr-name">{voyage.name}</span>
                        <span className="jr-tag">{voyage.tag}</span>
                      </span>
                      <span className="jr-blurb">{voyage.blurb}</span>
                    </span>
                  </button>
                ))}
              </>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/** Shared props of the instruments section — everything that changes what
 *  the chart DRAWS (the census keeps what it POPULATES). */
export interface InstrumentProps {
  era: MapState;
  lumen: boolean;
  nihilus: boolean;
  names: NamesMode;
  zones: ZonesMode;
  onToggleLumen: () => void;
  onToggleNihilus: () => void;
  onCycleNames: () => void;
  onCycleZones: () => void;
}

/** Collapsed-legend badge: no active non-default state may hide silently
 *  behind the closed header — lit overlays, retired zones, forced names and
 *  the census filter all surface here. */
export function legendNote(
  { lumen, nihilus, names, zones }: InstrumentProps,
  filtered: boolean,
): string | null {
  const parts = [
    lumen && "Lumen",
    nihilus && "Nihilus",
    zones === "dim" && "zones dim",
    zones === "off" && "zones off",
    names === "all" && "names all",
    names === "off" && "names off",
    filtered && "filtered",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Legend symbols — each overlay row shows a miniature of what its layer
 *  paints on the chart, in the census's 18px symbol slot. */
const SYM_LUMEN = (
  <svg viewBox="-8 -8 16 16" width={18} height={18} aria-hidden>
    <circle r={4.2} fill="none" stroke={GOLD} strokeOpacity={0.6} strokeWidth={1} />
    <circle r={1.2} fill={GOLD} />
    <g stroke={GOLD} strokeOpacity={0.8} strokeWidth={0.9}>
      <line y1={-5.7} y2={-7.3} />
      <line y1={5.7} y2={7.3} />
      <line x1={-5.7} x2={-7.3} />
      <line x1={5.7} x2={7.3} />
    </g>
  </svg>
);
const SYM_NIHILUS = (
  <svg viewBox="-8 -8 16 16" width={18} height={18} aria-hidden>
    <circle r={4.6} fill="none" stroke="var(--cg-warp-l)" strokeOpacity={0.55} strokeWidth={1} />
    <path d="M 0 -4.6 A 4.6 4.6 0 0 1 0 4.6 Z" fill="var(--cg-warp-v)" fillOpacity={0.6} />
  </svg>
);
const SYM_ZONES = (
  <svg viewBox="-8 -8 16 16" width={18} height={18} aria-hidden>
    <path
      d="M -5.2 -1.6 L -1.4 -5.4 L 4.8 -3.2 L 4 3.6 L -2.2 5.2 Z"
      fill="var(--cg-warp-v)"
      fillOpacity={0.14}
      stroke="var(--cg-warp-m)"
      strokeOpacity={0.7}
      strokeWidth={1}
      strokeDasharray="2 2.4"
    />
  </svg>
);
const SYM_NAMES = (
  <svg viewBox="-8 -8 16 16" width={18} height={18} aria-hidden>
    <text
      y={3.6}
      textAnchor="middle"
      fontFamily="var(--font-body)"
      fontStyle="italic"
      fontSize={10}
      fill={BONE}
      fillOpacity={0.85}
    >
      Aa
    </text>
  </svg>
);

/** The overlay rows of the interactive legend — the legend entry IS the
 *  switch: each row pairs a miniature of its layer with the toggle, in the
 *  census's row grammar so the whole legend reads as one column. State
 *  notes appear only off-default ("dimmed", "hidden") — a lit row already
 *  says "on". Nihilus is an instrument of the present chart only: off-"now"
 *  it stays in place but disabled, the reason on a visible line, not a
 *  tooltip. */
export function LegendOverlays(props: InstrumentProps) {
  const { era, lumen, nihilus, names, zones, onToggleLumen, onToggleNihilus, onCycleNames, onCycleZones } = props;
  const zoneCount = visibleZones(era).length;
  const nihilusLocked = era !== "now";
  return (
    <div className="cg-overlays">
      <button className={`cx${lumen ? " on" : ""}`} aria-pressed={lumen} onClick={onToggleLumen}>
        <span className="pad" />
        <span className="sym">{SYM_LUMEN}</span>
        <span className="lab">Lumen Astronomican</span>
      </button>
      <button
        className={`cx${nihilus ? " on" : ""}${nihilusLocked ? " na" : ""}`}
        aria-pressed={nihilus}
        aria-disabled={nihilusLocked || undefined}
        onClick={nihilusLocked ? undefined : onToggleNihilus}
      >
        <span className="pad" />
        <span className="sym">{SYM_NIHILUS}</span>
        <span className="lab">
          Imperium Nihilus
          {nihilusLocked && <i className="hint">not yet charted: an M42 instrument</i>}
        </span>
      </button>
      {zoneCount > 0 && (
        <button
          className={`cx${zones === "on" ? " on" : ""}${zones === "dim" ? " dim" : ""}`}
          onClick={onCycleZones}
          aria-label={`Zones & warp storms: ${
            zones === "on" ? "shown" : zones === "dim" ? "dimmed" : "hidden"
          }; cycle`}
        >
          <span className="pad" />
          <span className="sym">{SYM_ZONES}</span>
          <span className="lab">Zones &amp; warp storms</span>
          {zones !== "on" && <span className="st">{zones === "dim" ? "dimmed" : "hidden"}</span>}
        </button>
      )}
      <button
        className={`cx${names === "all" ? " on" : ""}`}
        onClick={onCycleNames}
        aria-label={`World names: ${
          names === "auto" ? "by magnification" : names === "all" ? "all shown" : "hidden"
        }; cycle`}
      >
        <span className="pad" />
        <span className="sym">{SYM_NAMES}</span>
        <span className="lab">World names</span>
        {names !== "auto" && <span className="st">{names === "all" ? "all" : "hidden"}</span>}
      </button>
    </div>
  );
}

/** Seek input + live result list. Owns its query state; picking a hit clears
 *  the query and hands the id to `onPick`.
 *  A11y (S10a): a real combobox — the input keeps focus for the whole
 *  seek→pick→Escape loop (pinned by the S8 smoke) while
 *  `aria-activedescendant` walks the listbox options. Two instances render
 *  (cartouche + sheet), so every id is `useId`-scoped. */
export function SeekPanel({
  payload,
  onPick,
  inputRef,
  trailing,
}: {
  payload: MapPayload;
  onPick: (id: string) => void;
  inputRef?: Ref<HTMLInputElement>;
  /** Extra control at the seek row's edge (the A–Z index opener). */
  trailing?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [focused, setFocused] = useState(false);
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optId = (i: number) => `${baseId}-opt-${i}`;

  const index = useMemo<SeekHit[]>(() => {
    const arr: SeekHit[] = payload.featured.map((f) => ({ id: f.id, name: f.name, n: f.n }));
    for (const d of payload.dust) arr.push({ id: d[3], name: d[4], n: 0 });
    return arr;
  }, [payload]);

  const q = query.trim().toLowerCase();
  const hits = useMemo(() => {
    if (!q) return [];
    const scored: { hit: SeekHit; rank: number }[] = [];
    for (const hit of index) {
      const n = hit.name.toLowerCase();
      if (!n.includes(q)) continue;
      scored.push({ hit, rank: (n.startsWith(q) ? 0 : 2) + (hit.n > 0 ? 0 : 1) });
    }
    scored.sort((a, b) => a.rank - b.rank || a.hit.name.localeCompare(b.hit.name));
    return scored.map((s) => s.hit);
  }, [index, q]);

  const open = focused && hits.length > 0;
  const cur = Math.max(0, Math.min(cursor, hits.length - 1));

  const pickHit = (hit: SeekHit) => {
    onPick(hit.id);
    setQuery("");
    setCursor(0);
  };

  return (
    <>
      <div className="seek">
        <input
          ref={inputRef}
          type="text"
          placeholder="Seek a world…"
          aria-label="Seek a world"
          role="combobox"
          aria-expanded={open}
          // Only while the listbox exists — a dangling id reference is an
          // axe violation (aria-valid-attr-value).
          aria-controls={open ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={open ? optId(cur) : undefined}
          spellCheck={false}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && hits.length > 0) {
              e.preventDefault();
              setCursor((cur + 1) % hits.length);
            } else if (e.key === "ArrowUp" && hits.length > 0) {
              e.preventDefault();
              setCursor((cur - 1 + hits.length) % hits.length);
            } else if (e.key === "Enter" && hits.length > 0) {
              e.preventDefault();
              pickHit(hits[cur]);
            } else if (e.key === "Escape" && query) {
              // Clear the query only — the global Escape (close popup) must
              // not fire while the seek is being dismissed.
              e.stopPropagation();
              setQuery("");
              setCursor(0);
            }
          }}
        />
        {trailing}
      </div>
      {open && (
        // preventDefault keeps the input focused so the click lands before
        // the list would close on blur. The listbox itself is the inner
        // wrapper — options only, the "keep typing" line stays outside it.
        <div className="seeklist" onMouseDown={(e) => e.preventDefault()}>
          <div role="listbox" id={listId} aria-label="Matching worlds">
            {hits.slice(0, SEEK_CAP).map((hit, i) => (
              <button
                key={hit.id}
                role="option"
                id={optId(i)}
                aria-selected={i === cur}
                className={`skitem${i === cur ? " cur" : ""}`}
                ref={i === cur ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
                onClick={() => pickHit(hit)}
              >
                <span className="nm">{hit.name}</span>
                <span className="tag">
                  {hit.n > 0 ? (hit.n === 1 ? "1 work" : `${hit.n} works`) : "dust"}
                </span>
              </button>
            ))}
          </div>
          {hits.length > SEEK_CAP && (
            <p className="skmore">… {fmt(hits.length - SEEK_CAP)} more, keep typing</p>
          )}
        </div>
      )}
    </>
  );
}

/** The recorded-worlds index — the keyboard/AT parallel path to the 1 000+
 *  pointer-only pins: every world that carries records, A–Z, as real
 *  buttons. Dust contacts stay reachable through the seek (it indexes all
 *  contacts). Rendered only while unfolded — zero cost closed. */
export function WorldIndex({
  payload,
  onPick,
}: {
  payload: MapPayload;
  onPick: (id: string) => void;
}) {
  const rows = useMemo(
    () => [...payload.featured].sort((a, b) => a.name.localeCompare(b.name)),
    [payload],
  );
  return (
    <ul className="cg-windex">
      {rows.map((f) => (
        <li key={f.id}>
          <button onClick={() => onPick(f.id)}>
            <span className="nm">{f.name}</span>
            <span className="tag">{f.n === 1 ? "1 work" : `${f.n} works`}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Seek + the A–Z opener: the head of both surfaces. The quiet "A–Z" button
 *  at the seek's edge unfolds the WorldIndex — the index keeps S10a parity
 *  (one tab stop after the seek) without spending a visible section on it. */
export function SeekHead({
  payload,
  onPick,
  inputRef,
}: {
  payload: MapPayload;
  onPick: (id: string) => void;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const [indexOpen, setIndexOpen] = useState(false);
  const indexId = useId();
  return (
    <>
      <SeekPanel
        payload={payload}
        onPick={onPick}
        inputRef={inputRef}
        trailing={
          <button
            type="button"
            className={`sk-az${indexOpen ? " open" : ""}`}
            aria-expanded={indexOpen}
            // Only while the index exists — a dangling id reference is an
            // axe violation (aria-valid-attr-value).
            aria-controls={indexOpen ? indexId : undefined}
            aria-label="World index: every recorded world, A to Z"
            onClick={() => setIndexOpen((o) => !o)}
          >
            A–Z
          </button>
        }
      />
      {indexOpen && (
        <div className="c-body" id={indexId}>
          <WorldIndex payload={payload} onPick={onPick} />
        </div>
      )}
    </>
  );
}

interface CartoucheProps extends InstrumentProps {
  payload: MapPayload;
  condensed: boolean;
  voyageId: string | null;
  /** Journeys-section badge — "touring 3/9" during a tour, "active" after. */
  voyageNote: string | null;
  /** Any census filter off default — the collapsed section shows a badge. */
  filtered: boolean;
  /** Select a world by id (flies there) — seek list click/RET. */
  onPick: (id: string) => void;
  onVoyage: (id: string) => void;
  /** The census filter block. */
  children: ReactNode;
}

export function Cartouche(props: CartoucheProps) {
  const { payload, condensed, voyageId, voyageNote, filtered, onPick, onVoyage, children } = props;
  // The legend — the single layers entrance — stands open on arrival
  // (Philipp, S255); the Great Journeys are opt-in behind their header, whose
  // badge keeps a running tour visible while collapsed.
  const [openSecs, setOpenSecs] = useState<ReadonlySet<SectionId>>(new Set(["legend"]));

  const toggleSec = (id: SectionId) =>
    setOpenSecs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    // inert while the overture veil is up: the cartouche is invisible then
    // (opacity 0 until `.on`) and must not be a hidden tab stop.
    <aside className={`cg-cartouche${condensed ? " on" : ""}`} inert={!condensed}>
      <div className="c-head">
        <h2 className="c-title">The Cartographer</h2>
      </div>
      <SeekHead payload={payload} onPick={onPick} />
      <SectionHead
        open={openSecs.has("courses")}
        label="Great Journeys"
        note={voyageNote}
        onToggle={() => toggleSec("courses")}
      />
      {openSecs.has("courses") && (
        <div className="c-body">
          <VoyageButtons era={props.era} voyageId={voyageId} onVoyage={onVoyage} />
        </div>
      )}

      <SectionHead
        open={openSecs.has("legend")}
        label="Legend"
        note={legendNote(props, filtered)}
        onToggle={() => toggleSec("legend")}
      />
      {openSecs.has("legend") && (
        <div className="c-body">
          <LegendOverlays {...props} />
          {children}
        </div>
      )}
    </aside>
  );
}
