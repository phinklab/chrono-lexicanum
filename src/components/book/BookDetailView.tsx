/**
 * Book-detail body — the db-free view shared by the canonical `/buch/[slug]`
 * page and the `@modal/(.)buch` overlay (Brief 120 polish). Mirrors the entity
 * arc's `EntityView`: one server component, rendered into both the full page
 * and the client modal shell, so the two can never drift.
 *
 * Everything that used to live inside `<main className="book-detail">` EXCEPT
 * the `<SiteBackground>` and the `<main>` wrapper itself lives here — the page
 * keeps the page chrome, the modal supplies its own dark ground. All
 * `book-detail__*` class names are unchanged, so `51-book-detail.css` styles
 * this identically in both contexts.
 */
import Link from "next/link";
import { entityHref } from "@/lib/entity/types";
import { FORMAT_LABELS } from "@/lib/book-labels";
import BuyListenActions from "@/components/book/BuyListenActions";
import RegionSwitcher from "@/components/book/RegionSwitcher";
import { type AudioCreditData } from "@/components/book/AudioCredit";
import { type BookDetail } from "@/lib/book/loadBook";
import { type StoreRegion } from "@/lib/store-links";

function roleSuffix(role: string | null, defaultRole: string): string {
  return role && role !== defaultRole ? ` · ${role}` : "";
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
  const metaParts = [
    book.releaseYear != null ? String(book.releaseYear) : null,
    formatLabel,
    book.eraName,
    book.seriesName
      ? `${book.seriesName}${book.seriesIndex ? ` #${book.seriesIndex}` : ""}`
      : null,
  ].filter((v): v is string => Boolean(v));

  return (
    <div className="book-detail__layout">
      <div className="book-detail__rail">
        <aside className="book-detail__cover-panel c-glass c-corners">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt=""
              width={220}
              height={330}
              className="book-detail__cover-img"
            />
          ) : (
            <div className="book-detail__cover-missing" aria-hidden>
              ?
            </div>
          )}
        </aside>

        <BuyListenActions
          title={book.title}
          author={authors[0] ?? null}
          isbn={isbn}
          region={region}
          audio={audioCredit}
        />

        <RegionSwitcher active={region} />
      </div>

      <article className="book-detail__title-block">
        <div className="book-detail__eyebrow">{"// LECTIO PROFVNDA · BOOK"}</div>
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
          </p>
        )}

        {metaParts.length > 0 && (
          <p className="book-detail__meta">{metaParts.join(" · ")}</p>
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
          <p className="book-detail__synopsis">{book.synopsis}</p>
        )}

        {book.factions.length > 0 && (
          <section className="book-detail__section">
            <div className="book-detail__section-label">{"// FACTIONS"}</div>
            <span className="c-hairline" aria-hidden />
            <ul className="book-detail__chip-row">
              {book.factions.map((f) => (
                <li key={f.id}>
                  <Link
                    href={entityHref({ type: "faction", id: f.id, name: f.name })}
                    className="book-detail__chip book-detail__chip--link"
                  >
                    {f.name}
                    {roleSuffix(f.role, "supporting")}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {book.locations.length > 0 && (
          <section className="book-detail__section">
            <div className="book-detail__section-label">{"// LOCATIONS"}</div>
            <span className="c-hairline" aria-hidden />
            <ul className="book-detail__chip-row">
              {book.locations.map((l) => (
                <li key={l.id}>
                  <Link
                    href={entityHref({ type: "location", id: l.id, name: l.name })}
                    className="book-detail__chip book-detail__chip--link"
                  >
                    {l.name}
                    {roleSuffix(l.role, "secondary")}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {book.characters.length > 0 && (
          <section className="book-detail__section">
            <div className="book-detail__section-label">{"// CHARACTERS"}</div>
            <span className="c-hairline" aria-hidden />
            <ul className="book-detail__chip-row">
              {book.characters.map((c) => (
                <li key={c.id}>
                  <Link
                    href={entityHref({ type: "character", id: c.id, name: c.name })}
                    className="book-detail__chip book-detail__chip--link"
                  >
                    {c.name}
                    {roleSuffix(c.role, "appears")}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {book.facets.length > 0 && (
          <section className="book-detail__section">
            <div className="book-detail__section-label">{"// FACETS"}</div>
            <span className="c-hairline" aria-hidden />
            <ul className="book-detail__chip-row">
              {book.facets.map((f) => (
                <li
                  key={`${f.category}-${f.name}`}
                  className="book-detail__chip book-detail__chip--mute"
                >
                  {f.name}
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="book-detail__footer">
          <Link
            href={`/buch/${book.slug}/audit`}
            className="book-detail__audit-link"
          >
            {"// audit"}
          </Link>
        </footer>
      </article>
    </div>
  );
}
