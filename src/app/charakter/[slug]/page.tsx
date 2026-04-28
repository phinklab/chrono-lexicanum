/** Per-character detail. /charakter/horus */
type Params = { slug: string };

export default async function CharacterPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-frost-400">Charakter</p>
      <h1 className="mt-3 font-cinzel text-4xl text-aquila">{slug}</h1>
      <p className="mt-6 font-cormorant italic text-frost-50/70">Detail view — Phase 3.</p>
    </main>
  );
}
