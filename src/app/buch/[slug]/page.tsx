/**
 * Public-lean per-book detail page. /buch/eisenhorn-xenos
 *
 * Brief 073 (2026-05-14): audit/provenance fields moved to
 * /buch/[slug]/audit so this route can stay reader-facing.
 * Brief 096 (2026-05-23): rebuilt in the Warhammer-Optics direction —
 * vista photo backdrop, c-glass cover panel, cyan-chip junctions.
 * Brief 120 (2026-06-02): data loader → `src/lib/book/loadBook` and body →
 * `BookDetailView`, both shared verbatim with the `@modal/(.)buch` overlay
 * (zero fork). This route now owns only the page chrome (`<main>` + backdrop);
 * a hard nav / refresh / shared link renders it full-screen as before.
 */
import { notFound } from "next/navigation";
import SiteBackground from "@/components/chrome/SiteBackground";
import BookDetailView from "@/components/book/BookDetailView";
import { loadBook } from "@/lib/book/loadBook";
import { resolveRegion } from "@/lib/store-region";

type Params = { slug: string };

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
