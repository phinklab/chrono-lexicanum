/**
 * Public-lean per-book detail page. /book/eisenhorn-xenos
 *
 * Audit/provenance fields live at /book/[slug]/audit so this route stays
 * reader-facing. The data loader is `src/lib/book/loadBook` and the body is
 * `BookDetailView`, both shared verbatim with the `@modal/(.)book` overlay
 * (zero fork). This route owns only the page chrome (`<main>` + backdrop);
 * a hard nav / refresh / shared link renders it full-screen.
 *
 * SSG/ISR since Launch S4: the store region — the route's only per-request
 * input — is resolved client-side in the <StoreActions> island (`?store=` +
 * browser language), so no `searchParams`/`headers()` dynamic driver remains
 * on the server path. Freshness follows the entity-route model: real
 * invalidation is the `books` tag purged by `POST /api/revalidate` after an
 * apply run; the 24 h TTL is only the backstop.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteBackground from "@/components/chrome/SiteBackground";
import BookDetailView from "@/components/book/BookDetailView";
import JsonLd from "@/components/seo/JsonLd";
import { routeOg } from "@/lib/seo";
import { siteOrigin } from "@/lib/site-url";
import { listHotBookSlugs, loadBook } from "@/lib/book/loadBook";

type Params = { slug: string };

// On-demand ISR for every slug; a page carries itself into the Data Cache on
// its first real visit. Never pair with `force-dynamic` — that defeats SSG.
export const dynamicParams = true;

// ISR backstop only — real freshness is the tag purge (see header).
export const revalidate = 86400;

// Build-prerender the curated hot subset from the committed snapshot (S4b,
// the entity `listHotEntityIds` pattern) — zero DB reads on the build path;
// `loadBook` serves those slugs from `books/<slug>.json`. The ~900-book long
// tail renders on demand and self-caches.
export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await listHotBookSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Per-book OG/social metadata (share-card-relevant for launch).
// `loadBook` is request-memoised, so this shares one DB fan-out (or
// one cache hit) with the page render below.
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await loadBook(slug);
  if (!book) return { title: "Unknown book" };
  const authors = book.persons
    .filter((p) => p.role === "author")
    .map((p) => p.name);
  // Social-card description: the synopsis lead, capped to card length.
  const synopsis = book.synopsis?.trim();
  const description = synopsis
    ? synopsis.length > 240
      ? `${synopsis.slice(0, 240).trimEnd()}…`
      : synopsis
    : `${book.title}${authors.length > 0 ? ` by ${authors.join(", ")}` : ""} — a Warhammer 40,000 novel in the Chrono Lexicanum archive.`;
  return {
    title: book.title,
    description,
    // `?store=` is client-island state — canonical stays the bare book URL
    // (URL matrix A.3).
    alternates: { canonical: `/book/${book.slug}` },
    openGraph: routeOg({
      title: book.title,
      description,
      type: "book",
      ...(book.coverUrl ? { images: [{ url: book.coverUrl }] } : {}),
    }),
  };
}

export default async function BookPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const book = await loadBook(slug);
  if (!book) notFound();

  // schema.org Book — only fields the catalogue actually holds, nothing
  // fabricated. Authors only (narrators are audiobook metadata, not `author`).
  const authors = book.persons
    .filter((p) => p.role === "author")
    .map((p) => ({ "@type": "Person", name: p.name }));
  return (
    <main className="book-detail">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Book",
          name: book.title,
          url: `${siteOrigin()}/book/${book.slug}`,
          inLanguage: "en",
          ...(authors.length > 0 ? { author: authors } : {}),
          ...(book.synopsis ? { description: book.synopsis } : {}),
          ...(book.coverUrl ? { image: book.coverUrl } : {}),
          ...(book.isbn13 ?? book.isbn10
            ? { isbn: book.isbn13 ?? book.isbn10 }
            : {}),
          ...(book.releaseYear ? { datePublished: String(book.releaseYear) } : {}),
          ...(book.seriesName
            ? {
                isPartOf: {
                  "@type": "BookSeries",
                  name: book.seriesName,
                },
                ...(book.seriesIndex != null
                  ? { position: book.seriesIndex }
                  : {}),
              }
            : {}),
        }}
      />
      <SiteBackground variant="vista" position="50% 22%" />
      <BookDetailView book={book} />
    </main>
  );
}
