/**
 * Intercept: a soft-nav to /buch/[slug] from anywhere in the app opens the book
 * detail as a large centered overlay instead of the full page (Brief 120
 * polish). SERVER COMPONENT — it calls the same `loadBook` and renders the same
 * db-free `<BookDetailView>` as the canonical page; only the shared `DetailModal`
 * (the overlay shell) is `'use client'`. Zero fork: no second data path, no
 * second view.
 *
 * A hard nav / refresh / shared link bypasses the intercept and renders
 * `src/app/buch/[slug]/page.tsx` (the canonical page) full-screen, so SEO and
 * deep links are unaffected. `?store=` is honoured here too (same region
 * resolution the full page pays), so the region switcher works inside the modal.
 */
import { notFound } from "next/navigation";
import DetailModal from "@/components/shared/DetailModal";
import BookDetailView from "@/components/book/BookDetailView";
import { loadBook } from "@/lib/book/loadBook";
import { resolveRegion } from "@/lib/store-region";

export default async function BookModal({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ store?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const book = await loadBook(slug);
  if (!book) notFound();

  const region = await resolveRegion(sp.store);

  return (
    <DetailModal title={book.title}>
      <BookDetailView book={book} region={region} />
    </DetailModal>
  );
}
