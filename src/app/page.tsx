import Link from "next/link";
import { Aquila } from "@/components/Aquila";

/**
 * Hub — the entry route. Inspired by the prototype's `Hub.jsx` mode picker.
 *
 * For now this is a static landing page with three "doorways" into the
 * archive: Timeline, Galaxy, Ask. The richer animated version (Hub mode)
 * will be ported once the Aquila + AnimatedStarfield components are migrated.
 */
const DOORWAYS = [
  {
    href: "/timeline",
    title: "Chronicle",
    sub: "The 12,000-year reading order",
    body: "From the Great Crusade to the Indomitus Era — every novel, in time.",
  },
  {
    href: "/map",
    title: "Cartographer",
    sub: "The galaxy by sector and book",
    body: "Where the wars happened. Filter by faction or era.",
  },
  {
    href: "/ask",
    title: "Ask the Archive",
    sub: "Tell us your mood — receive a path",
    body: "Five questions, then ranked recommendations.",
  },
] as const;

export default function HubPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-12 px-6 py-24">
      <header className="flex flex-col items-center gap-6 text-center">
        <Aquila className="h-20 w-20 text-aquila" />
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-frost-400">
            Chrono · Lexicanum
          </p>
          <h1 className="mt-3 font-cinzel text-5xl font-semibold text-aquila">
            The 41st Millennium Novel Archive
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-cormorant text-xl italic text-frost-50/80">
            A fan-made guide to the books of Warhammer 40,000 — by era, faction, world, and mood.
          </p>
        </div>
      </header>

      <section className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
        {DOORWAYS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="group flex flex-col gap-3 rounded border border-frost-900/60 bg-void-900/60 p-8 transition hover:border-aquila/60 hover:bg-void-800"
          >
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-frost-400 group-hover:text-aquila">
              {d.sub}
            </span>
            <h2 className="font-cinzel text-3xl text-frost-50 group-hover:text-aquila">
              {d.title}
            </h2>
            <p className="font-cormorant text-lg italic text-frost-50/70">{d.body}</p>
          </Link>
        ))}
      </section>

      <footer className="mt-16 max-w-2xl text-center font-mono text-[11px] uppercase tracking-widest text-frost-900">
        Unofficial fan project. Warhammer 40,000 © Games Workshop. No affiliation.
      </footer>
    </main>
  );
}
