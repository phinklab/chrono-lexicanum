/**
 * Public-lean per-book detail page. /buch/eisenhorn-xenos
 *
 * Audit/provenance fields live at /buch/[slug]/audit so this route stays
 * reader-facing. The data loader is `src/lib/book/loadBook` and the body is
 * `BookDetailView`, both shared verbatim with the `@modal/(.)buch` overlay
 * (zero fork). This route owns only the page chrome (`<main>` + backdrop);
 * a hard nav / refresh / shared link renders it full-screen.
 *
 * Deliberately NO `generateStaticParams`: the page reads `searchParams` and
 * `resolveRegion()` reads `headers()` — the store region is resolved
 * server-side, per request — so the route renders dynamically no matter what
 * is prerendered. Runtime perf is carried by the per-slug `cachedRead` layer
 * inside `loadBook` instead (the compendium pattern). Making this route truly
 * static would mean moving region resolution client-side — a design decision,
 * not a perf tweak.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteBackground from "@/components/chrome/SiteBackground";
import BookDetailView from "@/components/book/BookDetailView";
import { loadBook } from "@/lib/book/loadBook";
import { resolveRegion } from "@/lib/store-region";

type Params = { slug: string };

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
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ store?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const book = await loadBook(slug);
  if (!book) notFound();

  const region = await resolveRegion(sp.store);

  return (
    <main className="book-detail">
      <SiteBackground variant="vista" position="50% 22%" />
      <BookDetailView book={book} region={region} />
    </main>
  );
}
