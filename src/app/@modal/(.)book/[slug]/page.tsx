/**
 * Intercept: a soft-nav to /book/[slug] from anywhere in the app opens the book
 * detail as a large centered overlay instead of the full page.
 * SERVER COMPONENT — it calls the same `loadBook` and renders the same
 * db-free `<BookDetailView>` as the canonical page; only the shared `DetailModal`
 * (the overlay shell) is `'use client'`. Zero fork: no second data path, no
 * second view.
 *
 * A hard nav / refresh / shared link bypasses the intercept and renders
 * `src/app/book/[slug]/page.tsx` (the canonical SSG/ISR page) full-screen, so
 * SEO and deep links are unaffected. `?store=` is honoured here too — the
 * <StoreActions> island inside `BookDetailView` reads it client-side (Launch
 * S4), so the region switcher works identically in the modal and on the page.
 */
import { notFound } from "next/navigation";
import DetailModal from "@/components/shared/DetailModal";
import BookDetailView from "@/components/book/BookDetailView";
import { loadBook } from "@/lib/book/loadBook";

export default async function BookModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await loadBook(slug);
  if (!book) notFound();

  return (
    <DetailModal title={book.title}>
      <BookDetailView book={book} />
    </DetailModal>
  );
}
