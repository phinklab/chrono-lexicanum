"use client";

import Link from "next/link";
import { useState, type KeyboardEvent } from "react";

type Row = {
  kicker: string;
  title: string;
  tease: string;
  href: string;
  cta: string;
  body: string;
};

const ROWS: Row[] = [
  {
    kicker: "ORACVLVM",
    title: "Ask the Archive",
    tease: "five questions, one entry book",
    href: "/ask",
    cta: "Ask now",
    body:
      "Five questions about mood, faction and reading appetite — the cogitator narrows the catalogue to exactly one entry book.",
  },
  {
    kicker: "BIBLIOTHECA",
    title: "Atlas",
    tease: "every faction · world · character",
    href: "/atlas",
    cta: "Open Atlas",
    body:
      "The full inventory behind the archive: twelve decks from Works down to Junctions, each with drift marks and audit trails.",
  },
  {
    kicker: "CARTOGRAPHIA",
    title: "Cartographer",
    tease: "every novel pinned to a world",
    href: "/map",
    cta: "Open Map",
    body:
      "A galactic chart of sectors, worlds and book-pins — filterable by era, faction and segmentum.",
  },
  {
    kicker: "CHRONOS",
    title: "Chronicle",
    tease: "the timeline of the 41st millennium",
    href: "/timeline",
    cta: "Open Timeline",
    body:
      "An interactive in-universe timeline from M30 to M42 — every novel carries its date, every era its own anchor.",
  },
];

export default function ToolsAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i));

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (i + 1) % ROWS.length;
      document.getElementById(`tools-acc-head-${next}`)?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (i + ROWS.length - 1) % ROWS.length;
      document.getElementById(`tools-acc-head-${prev}`)?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      document.getElementById(`tools-acc-head-0`)?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      document.getElementById(`tools-acc-head-${ROWS.length - 1}`)?.focus();
    }
  };

  return (
    <div className="tools-accordion" role="list">
      {ROWS.map((row, i) => {
        const open = openIndex === i;
        const headId = `tools-acc-head-${i}`;
        const bodyId = `tools-acc-body-${i}`;
        return (
          <div
            key={row.kicker}
            className="tools-accordion__row c-corners"
            data-open={open ? "true" : "false"}
            role="listitem"
          >
            <button
              type="button"
              id={headId}
              aria-expanded={open}
              aria-controls={bodyId}
              className="tools-accordion__head"
              onClick={() => toggle(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <span className="tools-accordion__kicker">{row.kicker}</span>
              <span className="tools-accordion__title">{row.title}</span>
              <span className="tools-accordion__tease">{row.tease}</span>
              <span className="tools-accordion__indicator" aria-hidden>
                +
              </span>
            </button>
            <div
              id={bodyId}
              role="region"
              aria-labelledby={headId}
              className="tools-accordion__body"
            >
              <div className="tools-accordion__body-inner">
                <p className="tools-accordion__body-text">{row.body}</p>
                <Link href={row.href} className="tools-accordion__cta">
                  {row.cta} →
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
