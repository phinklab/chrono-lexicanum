import type { Metadata } from "next";
import Link from "next/link";
import SiteBackground from "@/components/chrome/SiteBackground";
import AuspexSweep from "@/components/chrono/AuspexSweep";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import { factionDot } from "@/lib/faction-colors";
import FraktionenFilters from "./FraktionenFilters";
import { loadFactionGuide, type Alignment, type FactionGuide } from "./loader";
import { applyFactionFilters, hasContent, isFiltered, parseFactionParams } from "./filters";

export const metadata: Metadata = {
  title: "Factions — Chrono Lexicanum",
  description:
    "A guide to the factions of Warhammer 40,000 — each a doorway into the books, podcasts and characters of the archive.",
};

interface FraktionenPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const ALIGNMENT_LABELS: Record<Alignment, string> = {
  imperium: "Imperium",
  chaos: "Chaos",
  xenos: "Xenos",
  neutral: "Neutral",
};

const READOUT_LINES = [
  "· ORDO · FRACTIONVM",
  "· ALLEGIANCE · 4 AXES",
  "· DOORWAY · LIBRORVM / VOX",
  "· INDEX · KEY PERSONAE",
  "· COGNITIO LINK STABLE",
];

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** A short glyph (a sigil character, not an image) reads as a badge; anything
 *  longer is treated as prose and dropped to the colour dot instead. */
function shortGlyph(glyph: string | null): string | null {
  if (!glyph) return null;
  const g = glyph.trim();
  return g.length > 0 && g.length <= 3 ? g : null;
}

export default async function FraktionenPage({ searchParams }: FraktionenPageProps) {
  const sp = await searchParams;
  const params = parseFactionParams(sp);
  const factions = await loadFactionGuide();

  const guideTotal = factions.filter(hasContent).length;
  const shown = applyFactionFilters(factions, params);
  const filtering = isFiltered(params);

  return (
    <main className="factions">
      <SiteBackground variant="vista" position="50% 30%" />

      <header className="fac-hero">
        <div className="fac-hero__sweep" aria-hidden>
          <AuspexSweep r={150} sweepDuration={17} accent="var(--cl-cyan)" />
        </div>
        <div className="fac-hero__readout" aria-hidden>
          <GhostReadout
            color="var(--cl-cyan)"
            opacity={0.3}
            lineMs={5200}
            typeSpeed={80}
            max={4}
            lines={READOUT_LINES}
          />
        </div>
        <FloatingCoord
          x="60%"
          y="44px"
          label="ORDO · SEGMENTVM OBSCVRVS"
          delay={1.3}
          lifetime={5}
          color="var(--cl-cyan)"
          opacity={0.5}
        />

        <div className="fac-hero__inner">
          <div className="fac-hero__eyebrow">{"// ORDO · FRACTIONVM"}</div>
          <h1 className="fac-hero__heading">FACTIONS</h1>
          <p className="fac-hero__sub">
            {guideTotal === 0
              ? "No factions in the database yet."
              : "Every faction is a doorway. Pick an allegiance to see what the archive holds behind it — books, podcasts, and the people who carry the story."}
          </p>
        </div>
      </header>

      <div className="fac-body">
        {guideTotal > 0 && (
          <>
            <div className="fac-toolbar">
              <span className="fac-toolbar__count">{shown.length} · SHOWN</span>
              <span className="fac-toolbar__total">/ {guideTotal} factions</span>
            </div>
            <FraktionenFilters />
          </>
        )}

        {guideTotal === 0 ? (
          <div className="fac-empty c-glass c-corners">
            The database has no factions yet. Once the catalogue is ingested they
            will appear here as guide entries.
          </div>
        ) : shown.length === 0 ? (
          <div className="fac-empty c-glass c-corners">
            No factions match {filtering ? "these filters" : "this view"}. Try a
            different allegiance or clear the search.
          </div>
        ) : (
          <ul className="fac-grid">
            {shown.map((f) => (
              <li key={f.id}>
                <FactionCard faction={f} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function FactionCard({ faction: f }: { faction: FactionGuide }) {
  const glyph = shortGlyph(f.glyph);
  const dot = factionDot(f.name);
  const stats: string[] = [];
  if (f.bookCount > 0) stats.push(plural(f.bookCount, "book"));
  if (f.episodeCount > 0) stats.push(plural(f.episodeCount, "episode"));
  if (f.characterCount > 0) stats.push(plural(f.characterCount, "character"));
  if (f.subfactionCount > 0) stats.push(plural(f.subfactionCount, "sub-faction"));

  return (
    <Link
      href={`/fraktion/${f.id}`}
      className={`fac-card c-glass c-corners fac-card--${f.alignment}`}
    >
      <div className="fac-card__head">
        {glyph ? (
          <span className="fac-card__glyph" aria-hidden>
            {glyph}
          </span>
        ) : (
          <span
            className="fac-card__dot"
            aria-hidden
            style={{ background: dot }}
          />
        )}
        <span className="fac-card__align">{ALIGNMENT_LABELS[f.alignment]}</span>
      </div>

      <h2 className="fac-card__name">{f.name}</h2>

      {f.tone && <p className="fac-card__tone">{f.tone}</p>}

      <p className="fac-card__stats">
        {stats.length > 0 ? stats.join(" · ") : "Guide entry"}
      </p>
    </Link>
  );
}
