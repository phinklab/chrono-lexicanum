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
import { loadBook } from "@/lib/book/loadBook";

type Params = { slug: string };

// On-demand ISR for every slug; a page carries itself into the Data Cache on
// its first real visit. Never pair with `force-dynamic` — that defeats SSG.
export const dynamicParams = true;

// ISR backstop only — real freshness is the tag purge (see header).
export const revalidate = 86400;

// Build-prerender NOTHING yet: the committed snapshot has no book projection
// until S4b extends the exporter (launch-master-plan § S4/S4b), and the
// DB-free build must not fan ~900 `loadBook` reads into Postgres. S4b feeds a
// snapshot-backed hot subset here (the entity `listHotEntityIds` pattern);
// until then every book renders on demand and self-caches.
export function generateStaticParams(): Params[] {
  return [];
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
    openGraph: {
      title: book.title,
      description,
      type: "book",
      ...(book.coverUrl ? { images: [{ url: book.coverUrl }] } : {}),
    },
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

  return (
    <main className="book-detail">
      <SiteBackground variant="vista" position="50% 22%" />
      <BookDetailView book={book} />
    </main>
  );
}
