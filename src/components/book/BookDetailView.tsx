/**
 * Book-detail body — the db-free view shared by the canonical `/buch/[slug]`
 * page and the `@modal/(.)buch` overlay. One server component rendered into
 * both surfaces, so the two can never drift.
 *
 * Brief 184: the record speaks the title-page language on the centre axis —
 * format rubric, the title as the cover, byline with series, era line, then
 * Synopsis → Appendix (dramatis personae / factions / locations with roles) →
 * motifs → Acquire → the quiet provenance link. All information of the old
 * layout is retained; only the cover image is retired (the title is the
 * cover — Brief 184 canon).
 */
import Link from "next/link";
import { entityHref } from "@/lib/entity/types";
import { FORMAT_LABELS } from "@/lib/book-labels";
import BuyListenActions from "@/components/book/BuyListenActions";
import RegionSwitcher from "@/components/book/RegionSwitcher";
import { type AudioCreditData } from "@/components/book/AudioCredit";
import { type BookDetail } from "@/lib/book/loadBook";
import { type StoreRegion } from "@/lib/store-links";

function roleLabel(role: string | null, fallback: string): string {
  return (role ?? fallback).replace(/_/g, " ");
}

const AUDIO_ROLES = new Set(["narrator", "co_narrator", "full_cast"]);
const AUDIO_ROLE_ORDER: Record<string, number> = {
  narrator: 0,
  co_narrator: 1,
  full_cast: 2,
};

/**
 * Brief 105 — collapse the audio-credit rows into a render shape. Cast dramas
 * (any `full_cast` role) render as an ensemble, never as a lone narrator.
 */
function buildAudioCredit(
  persons: { name: string; role: string; displayOrder: number }[],
): AudioCreditData | null {
  const audio = persons
    .filter((p) => AUDIO_ROLES.has(p.role))
    .sort(
      (a, b) =>
        (AUDIO_ROLE_ORDER[a.role] ?? 9) - (AUDIO_ROLE_ORDER[b.role] ?? 9) ||
        a.displayOrder - b.displayOrder,
    );
  if (audio.length === 0) return null;
  const names = audio.map((p) => p.name);
  if (audio.some((p) => p.role === "full_cast")) return { kind: "cast", names };
  if (names.length === 1) return { kind: "single", names };
  if (names.length === 2) return { kind: "duet", names };
  return { kind: "ensemble", names };
}

function AppendixColumn({
  heading,
  entries,
}: {
  heading: string;
  entries: {
    key: string;
    name: string;
    href: string;
    role: string;
  }[];
}) {
  if (entries.length === 0) return null;
  return (
    <div className="book-detail__appendix-col">
      <h3 className="book-detail__appendix-head">{heading}</h3>
      <ul>
        {entries.map((e) => (
          <li key={e.key}>
            <Link href={e.href}>{e.name}</Link>
            <span
              className={`book-detail__role${
                e.role === "antagonist" ? " book-detail__role--antagonist" : ""
              }`}
            >
              {e.role}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BookDetailView({
  book,
  region,
}: {
  book: BookDetail;
  region: StoreRegion;
}) {
  const audioCredit = buildAudioCredit(book.persons);
  const isbn = book.isbn13 ?? book.isbn10 ?? null;
  const authorRows = book.persons.filter((p) => p.role === "author");
  const authors = authorRows.map((p) => p.name);
  const formatLabel = book.format ? FORMAT_LABELS[book.format] ?? book.format : null;
  const seriesLine = book.seriesName
    ? `${book.seriesName}${book.seriesIndex ? ` #${book.seriesIndex}` : ""}`
    : null;
  const hasAppendix =
    book.characters.length + book.factions.length + book.locations.length > 0;

  return (
    <article className="book-detail__body">
      <p className="book-detail__rubric">{formatLabel ?? "Book"}</p>
      <h1 className="book-detail__title">{book.title}</h1>

      {authorRows.length > 0 && (
        <p className="book-detail__byline">
          by{" "}
          {authorRows.map((a, i) => (
            <span key={a.id}>
              {i > 0 && ", "}
              <Link
                href={entityHref({ type: "person", id: a.id, name: a.name })}
                className="book-detail__byline-link"
              >
                {a.name}
              </Link>
            </span>
          ))}
          {seriesLine && <> · {seriesLine}</>}
        </p>
      )}

      {book.eraName && <p className="book-detail__chrono">{book.eraName}</p>}
      {book.releaseYear != null && (
        <p className="book-detail__pub">First published {book.releaseYear}</p>
      )}

      {book.containedIn.length > 0 && (
        <p className="book-detail__contained">
          Also contained in:{" "}
          {book.containedIn.map((c, i) => (
            <span key={c.collectionSlug}>
              {i > 0 && ", "}
              <Link
                href={`/buch/${c.collectionSlug}`}
                className="book-detail__contained-link"
              >
                {c.collectionTitle}
              </Link>
            </span>
          ))}
        </p>
      )}

      {book.synopsis && (
        <>
          <h2 className="lx-sect book-detail__sect">Synopsis</h2>
          <p className="book-detail__synopsis">{book.synopsis}</p>
        </>
      )}

      {hasAppendix && (
        <>
          <h2 className="lx-sect book-detail__sect">Appendix</h2>
          <div className="book-detail__appendix">
            <AppendixColumn
              heading="Dramatis Personae"
              entries={book.characters.map((c) => ({
                key: c.id,
                name: c.name,
                href: entityHref({ type: "character", id: c.id, name: c.name }),
                role: roleLabel(c.role, "appears"),
              }))}
            />
            <AppendixColumn
              heading="Factions"
              entries={book.factions.map((f) => ({
                key: f.id,
                name: f.name,
                href: entityHref({ type: "faction", id: f.id, name: f.name }),
                role: roleLabel(f.role, "supporting"),
              }))}
            />
            <AppendixColumn
              heading="Locations"
              entries={book.locations.map((l) => ({
                key: l.id,
                name: l.name,
                href: entityHref({ type: "location", id: l.id, name: l.name }),
                role: roleLabel(l.role, "secondary"),
              }))}
            />
          </div>
        </>
      )}

      {book.facets.length > 0 && (
        <p className="book-detail__motifs">
          {book.facets.map((f, i) => (
            <span key={`${f.category}-${f.name}`}>
              {i > 0 && <span className="book-detail__motif-sep"> · </span>}
              {f.name}
            </span>
          ))}
        </p>
      )}

      <BuyListenActions
        title={book.title}
        author={authors[0] ?? null}
        isbn={isbn}
        region={region}
        audio={audioCredit}
      />
      <RegionSwitcher active={region} />

      <footer className="book-detail__footer">
        <Link href={`/buch/${book.slug}/audit`} className="book-detail__audit-link">
          Provenance &amp; audit record →
        </Link>
      </footer>
    </article>
  );
}
