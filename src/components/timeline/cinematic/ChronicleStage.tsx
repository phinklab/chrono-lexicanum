"use client";

/**
 * Chronicle stage — root client island of /timeline.
 * Owns the discrete state: view mode (cinematic / index), active era, active
 * entry, and the era-wipe transition. Both views stay mounted (CSS crossfade
 * via `data-mode`) and are remounted per era via keys.
 *
 * URL state: `?era=<id>` (+ `?view=index` / `?view=cine`) is mirrored via
 * history.replaceState, so the current chapter is shareable and survives a
 * reload. The entry within an era is deliberately not in the URL — a shared
 * link opens the chapter at its era intro.
 *
 * View default: CINEMATIC on every device — Philipp's explicit call during
 * the S9 browser acceptance, overriding the launch plan's coarse-pointer
 * index default. `?view=index` opts into the index, `?view=cine` is accepted
 * as an explicit (shareable) stage link; without a `?view=` the URL stays
 * bare.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChronicleEraData } from "@/lib/chronicle/loadTimeline";
import CinematicView from "./CinematicView";
import IndexView from "./IndexView";
import { clamp, usePrefersReducedMotion } from "./shared";

export type ChronicleViewMode = "cine" | "index";

interface ChronicleStageProps {
  eras: ChronicleEraData[];
  initialEraId: string | null;
  /** Explicit `?view=` choice; null = default (cinematic, bare URL). */
  initialView: ChronicleViewMode | null;
}

export default function ChronicleStage({
  eras,
  initialEraId,
  initialView,
}: ChronicleStageProps) {
  // `choice` is the user's explicit pick (URL param or toggle); null = the
  // cinematic default with a bare URL (only explicit picks write `view=`).
  const [choice, setChoice] = useState<ChronicleViewMode | null>(initialView);
  const mode: ChronicleViewMode = choice ?? "cine";
  const [eraIdx, setEraIdx] = useState(() => {
    const i = eras.findIndex((e) => e.id === initialEraId);
    return i >= 0 ? i : 0;
  });
  const [entry, setEntry] = useState(0);
  const [wipe, setWipe] = useState({ on: false, label: "" });

  const reduced = usePrefersReducedMotion();
  const reducedRef = useRef(reduced);
  const eraIdxRef = useRef(eraIdx);
  const wipingRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Becomes true on the first era navigation: the keyed views remount per era,
  // and a mount caused by navigation (vs. initial page load) may take focus.
  const [navigated, setNavigated] = useState(false);
  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);
  useEffect(() => {
    eraIdxRef.current = eraIdx;
  }, [eraIdx]);
  useEffect(
    () => () => timersRef.current.forEach((t) => clearTimeout(t)),
    [],
  );

  // Route-scoped body class — fixed chrome (media-player stud) dodges the
  // Chronicle's bottom sheet via `body.on-chron` rules.
  useEffect(() => {
    document.body.classList.add("on-chron");
    return () => document.body.classList.remove("on-chron");
  }, []);

  const era = eras[eraIdx];

  // era switch behind the wipe; when entering at the first entry the era
  // intro provides the title reveal, so the wipe stays blank
  const gotoEra = useCallback(
    (e: number, idx: number) => {
      if (wipingRef.current) return;
      const target = clamp(e, 0, eras.length - 1);
      if (target === eraIdxRef.current) return;
      setNavigated(true);
      const landIdx = clamp(idx, 0, eras[target].events.length - 1);
      if (reducedRef.current) {
        setEraIdx(target);
        setEntry(landIdx);
        return;
      }
      wipingRef.current = true;
      setWipe({
        on: true,
        label: landIdx ? `${eras[target].m} · ${eras[target].name}` : "",
      });
      timersRef.current.push(
        setTimeout(() => {
          setEraIdx(target);
          setEntry(landIdx);
          timersRef.current.push(
            setTimeout(() => {
              setWipe((w) => ({ ...w, on: false }));
              wipingRef.current = false;
            }, 700),
          );
        }, 600),
      );
    },
    [eras],
  );

  const openCinematic = useCallback((i: number) => {
    setEntry(i);
    setChoice("cine");
  }, []);

  // mirror era + view into the URL (shareable, replace — no history spam);
  // the default keeps the URL bare, only an explicit choice writes `view`
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    sp.set("era", era.id);
    if (choice === "index") sp.set("view", "index");
    else if (choice === "cine") sp.set("view", "cine");
    else sp.delete("view");
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${sp.toString()}`,
    );
  }, [era.id, choice]);

  // Exactly ONE screen-reader announcement per position change (S9): a single
  // status region, stable across era remounts. Silent on initial load, in
  // index mode (real buttons announce themselves there), and on era changes
  // that land on the era intro (the focused intro announces itself).
  const [liveMsg, setLiveMsg] = useState("");
  const announcedRef = useRef<{ era: number; entry: number } | null>(null);
  useEffect(() => {
    const prev = announcedRef.current;
    announcedRef.current = { era: eraIdx, entry };
    if (!prev) return;
    if (mode !== "cine") return;
    if (prev.era === eraIdx && prev.entry === entry) return;
    const changedEra = prev.era !== eraIdx;
    if (changedEra && entry === 0) return;
    const ev = era.events[entry];
    if (!ev) return;
    setLiveMsg(
      (changedEra ? `${era.m}, ${era.name}. ` : "") +
        `Entry ${entry + 1} of ${era.events.length}: ${ev.title}, ${ev.dateLabel}`,
    );
  }, [era, eraIdx, entry, mode]);

  return (
    <div className="chron" data-mode={mode}>
      <CinematicView
        key={`cine:${era.id}`}
        era={era}
        eras={eras}
        eraIdx={eraIdx}
        entry={entry}
        active={mode === "cine"}
        wipeActive={wipe.on}
        reduced={reduced}
        focusOnMount={navigated}
        onEntryChange={setEntry}
        onGotoEra={gotoEra}
      />
      <IndexView
        key={`index:${era.id}`}
        era={era}
        eras={eras}
        eraIdx={eraIdx}
        entry={entry}
        active={mode === "index"}
        reduced={reduced}
        focusOnMount={navigated}
        onEntryChange={setEntry}
        onGotoEra={gotoEra}
        onOpenCinematic={openCinematic}
      />

      {/* mode toggle — bottom right, under the artwork credit */}
      <nav className="chron-mode-toggle" aria-label="View mode">
        <span className="lab" aria-hidden="true">
          VIEW
        </span>
        <div className="pill">
          <button
            type="button"
            className={mode === "cine" ? "sel" : ""}
            aria-pressed={mode === "cine"}
            onClick={() => setChoice("cine")}
          >
            CINEMATIC
          </button>
          <button
            type="button"
            className={mode === "index" ? "sel" : ""}
            aria-pressed={mode === "index"}
            onClick={() => setChoice("index")}
          >
            INDEX
          </button>
        </div>
      </nav>

      <div className="chron-sr" role="status">
        {liveMsg}
      </div>

      <div className={`chron-wipe${wipe.on ? " on" : ""}`} aria-hidden="true">
        <div className="wipe-name">{wipe.label}</div>
      </div>
    </div>
  );
}
