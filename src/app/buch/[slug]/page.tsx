/**
 * Per-book detail page.  /buch/eisenhorn-xenos
 *
 * Phase 3 work: server-fetch by slug, render synopsis, factions, characters,
 * map embed for primary location, "what to read next" sidebar.
 */
type Params = { slug: string };

export default async function BookPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-frost-400">Buch</p>
      <h1 className="mt-3 font-cinzel text-4xl text-aquila">{slug}</h1>
      <p className="mt-6 font-cormorant italic text-frost-50/70">
        Detail view — to be implemented in Phase 3.
      </p>
    </main>
  );
}
