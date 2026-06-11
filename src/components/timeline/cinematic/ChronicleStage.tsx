"use client";

/**
 * Chronicle stage — root client island of the new /timeline (Brief 138).
 * Owns the discrete state the prototype kept in its module scope: view mode
 * (cinematic / index), active era, active entry, and the era-wipe transition.
 * Both views stay mounted (CSS crossfade via `data-mode`, prototype parity)
 * and are remounted per era via keys — the prototype's `loadEra` rebuild.
 *
 * URL state replaces the prototype's localStorage: `?era=<id>` (+
 * `?view=index`) is mirrored via history.replaceState, so the current chapter
 * is shareable and survives a reload. The entry within an era is deliberately
 * not in the URL — a shared link opens the chapter at its era intro.
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
  initialView: ChronicleViewMode;
}

export default function ChronicleStage({
  eras,
  initialEraId,
  initialView,
}: ChronicleStageProps) {
  const [mode, setMode] = useState<ChronicleViewMode>(initialView);
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

  const era = eras[eraIdx];

  // era switch behind the wipe (prototype `gotoEra`); entering at the first
  // entry → the era intro provides the title reveal, so the wipe stays blank
  const gotoEra = useCallback(
    (e: number, idx: number) => {
      if (wipingRef.current) return;
      const target = clamp(e, 0, eras.length - 1);
      if (target === eraIdxRef.current) return;
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
    setMode("cine");
  }, []);

  // mirror era + view into the URL (shareable, replace — no history spam)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    sp.set("era", era.id);
    if (mode === "index") sp.set("view", "index");
    else sp.delete("view");
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${sp.toString()}`,
    );
  }, [era.id, mode]);

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
        onEntryChange={setEntry}
        onGotoEra={gotoEra}
        onOpenCinematic={openCinematic}
      />

      {/* mode toggle — bottom right, under the artwork credit */}
      <nav className="chron-mode-toggle" aria-label="View mode">
        <span className="lab">VIEW</span>
        <div className="pill">
          <button
            type="button"
            className={mode === "cine" ? "sel" : ""}
            onClick={() => setMode("cine")}
          >
            CINEMATIC
          </button>
          <button
            type="button"
            className={mode === "index" ? "sel" : ""}
            onClick={() => setMode("index")}
          >
            INDEX
          </button>
        </div>
      </nav>

      <div className={`chron-wipe${wipe.on ? " on" : ""}`} aria-hidden="true">
        <div className="wipe-name">{wipe.label}</div>
      </div>
    </div>
  );
}
