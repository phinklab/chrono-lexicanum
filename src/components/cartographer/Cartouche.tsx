"use client";

/**
 * Cartouche + Overture: "The Cartographer" opens as a large cartouche over
 * the chart and condenses into the corner legend on first interaction. The
 * corner cartouche carries seek, courses, instruments and the census filter
 * (passed in as children).
 * Both surfaces speak the live-site glass language — no border strokes.
 *
 * Seek: live list while typing — every one of the 1054 contacts is in the
 * payload (featured + dust), ranked prefix > substring and recorded > dust.
 * Click or RET selects and flies; arrows move the cursor.
 *
 * Legend: it sits TOP-left (bottom-left is the media player's dock) and
 * folds into three sections — Courses, Instruments, Census — behind
 * full-width headers; only the census (the primary filter) is open by
 * default. Collapsed sections carry a gold state badge ("active",
 * "filtered", the lit instruments), so nothing active can hide silently.
 *
 * SeekPanel / SectionHead / CourseButtons / OverlayButtons are shared with
 * the mobile drawer (CartoucheSheet) so both surfaces render one vocabulary.
 */

import { useId, useMemo, useState } from "react";
import type { ReactNode, Ref } from "react";

import BtnFx from "@/components/shared/BtnFx";
import type { MapPayload } from "@/lib/map/payload";
import { VOYAGES } from "@/lib/map/voyages";
import { visibleZones, type MapState, type ZonesMode } from "@/lib/map/zones";

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
      <p className="hint">
        <span className="dot">●</span>&ensp;
        <span className="hint-fine">drag to survey · scroll to magnify · click a world</span>
        <span className="hint-coarse">drag to survey · pinch to magnify · tap a world</span>
      </p>
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

export type SectionId = "courses" | "instruments" | "census" | "index";

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

/** The Great Journeys list — one row per journey: name + era tag on the
 *  first line, the blurb and station count beneath. Picking one opens the
 *  guided tour (VoyageTour); picking it again closes the journey. */
export function VoyageButtons({
  voyageId,
  onVoyage,
}: {
  voyageId: string | null;
  onVoyage: (id: string) => void;
}) {
  return (
    <div className="routes">
      {VOYAGES.map((voyage) => (
        <button
          key={voyage.id}
          className={`rt${voyageId === voyage.id ? " on" : ""}`}
          aria-pressed={voyageId === voyage.id}
          onClick={() => onVoyage(voyage.id)}
        >
          {voyage.name}
          <span className="rt-tag">{voyage.tag}</span>
          <span className="rt-blurb">{voyage.blurb}</span>
          <span className="rt-meta">
            {voyage.stations.length}{" "}
            {voyage.strategic?.mode === "legion-steps"
              ? "legions"
              : voyage.stations.length === 1
                ? "station"
                : "stations"}
            {voyage.cartography ? ` · ${voyage.cartography.label}` : ""}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Shared props of the instruments section — everything that changes what
 *  the chart DRAWS (the census keeps what it POPULATES). */
export interface InstrumentProps {
  era: MapState;
  lumen: boolean;
  nihilus: boolean;
  names: boolean;
  zones: ZonesMode;
  onToggleLumen: () => void;
  onToggleNihilus: () => void;
  onToggleNames: () => void;
  onCycleZones: () => void;
}

/** Collapsed-section badge: no active non-default instrument state may hide
 *  silently behind a closed header. One wording for cartouche AND sheet. */
export function instrumentsNote({ lumen, nihilus, names, zones }: InstrumentProps): string | null {
  const parts = [
    lumen && "Lumen",
    nihilus && "Nihilus",
    zones === "dim" && "zones dim",
    zones === "off" && "zones off",
    names && "names",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** The chart instruments — the two overlays plus the two display toggles
 *  (zone fields, forced names). Nihilus is an instrument of the present
 *  chart only: off-"now" it stays in place but disabled, with the reason on
 *  its own tag line (visible, not a tooltip). */
export function InstrumentButtons(props: InstrumentProps) {
  const { era, lumen, nihilus, names, zones, onToggleLumen, onToggleNihilus, onToggleNames, onCycleZones } = props;
  const zoneCount = visibleZones(era).length;
  const nihilusLocked = era !== "now";
  return (
    <div className="routes">
      <button className={`rt${lumen ? " on" : ""}`} aria-pressed={lumen} onClick={onToggleLumen}>
        Lumen Astronomican
        <span className="rt-tag">the beacon&rsquo;s reach</span>
      </button>
      <button
        className={`rt${nihilus ? " on" : ""}${nihilusLocked ? " na" : ""}`}
        aria-pressed={nihilus}
        aria-disabled={nihilusLocked || undefined}
        onClick={nihilusLocked ? undefined : onToggleNihilus}
      >
        Imperium Nihilus
        <span className="rt-tag">
          {nihilusLocked ? "not yet charted — an M42 instrument" : "the dark half"}
        </span>
      </button>
      {zoneCount > 0 && (
        <button
          className={`rt${zones !== "off" ? " on" : ""}`}
          onClick={onCycleZones}
          aria-label={`Zones & warp storms: ${
            zones === "on" ? "shown" : zones === "dim" ? "dimmed" : "hidden"
          } — cycle`}
        >
          Zones &amp; warp storms
          <span className="rt-tag">
            {zones === "on"
              ? `${zoneCount} ${zoneCount === 1 ? "field" : "fields"} charted`
              : zones === "dim"
                ? "dimmed — names retired"
                : "hidden"}
          </span>
        </button>
      )}
      <button className={`rt${names ? " on" : ""}`} aria-pressed={names} onClick={onToggleNames}>
        World names
        <span className="rt-tag">at every magnification</span>
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
}: {
  payload: MapPayload;
  onPick: (id: string) => void;
  inputRef?: Ref<HTMLInputElement>;
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
            <p className="skmore">… {fmt(hits.length - SEEK_CAP)} more — keep typing</p>
          )}
        </div>
      )}
    </>
  );
}

/** The recorded-worlds index — the keyboard/AT parallel path to the 1 000+
 *  pointer-only pins: every world that carries records, A–Z, as real
 *  buttons. Dust contacts stay reachable through the seek (it indexes all
 *  contacts). Rendered only while its section is open — zero cost closed. */
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
    <>
      <p className="c-hint">
        every recorded world, A–Z — the seek reaches all {fmt(payload.contacts)} contacts
      </p>
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
  const [openSecs, setOpenSecs] = useState<ReadonlySet<SectionId>>(new Set(["census"]));

  const toggleSec = (id: SectionId) =>
    setOpenSecs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    // inert while the overture veil is up: the legend is invisible then
    // (opacity 0 until `.on`) and must not be a hidden tab stop.
    <aside className={`cg-cartouche${condensed ? " on" : ""}`} inert={!condensed}>
      <div className="c-head">
        <h2 className="c-title">The Cartographer</h2>
      </div>
      <SeekPanel payload={payload} onPick={onPick} />
      <SectionHead
        open={openSecs.has("courses")}
        label="Great Journeys"
        note={voyageNote}
        onToggle={() => toggleSec("courses")}
      />
      {openSecs.has("courses") && (
        <div className="c-body">
          <p className="c-hint">charted routes and curated chronologies across the galaxy</p>
          <VoyageButtons voyageId={voyageId} onVoyage={onVoyage} />
        </div>
      )}

      <SectionHead
        open={openSecs.has("instruments")}
        label="Instruments"
        note={instrumentsNote(props)}
        onToggle={() => toggleSec("instruments")}
      />
      {openSecs.has("instruments") && (
        <div className="c-body">
          <InstrumentButtons {...props} />
        </div>
      )}

      <SectionHead
        open={openSecs.has("census")}
        label="Filter worlds"
        note={filtered ? "filtered" : null}
        onToggle={() => toggleSec("census")}
      />
      {openSecs.has("census") && <div className="c-body">{children}</div>}

      <SectionHead
        open={openSecs.has("index")}
        label="World index"
        note={null}
        onToggle={() => toggleSec("index")}
      />
      {openSecs.has("index") && (
        <div className="c-body">
          <WorldIndex payload={payload} onPick={onPick} />
        </div>
      )}
    </aside>
  );
}
