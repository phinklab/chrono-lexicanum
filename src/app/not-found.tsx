/**
 * Root 404 boundary (Report 144 § R.5, carried over from 141-E.2). Catches
 * every URL no route matches AND every explicit `notFound()` a segment throws
 * without a closer `not-found.tsx` — previously both fell through to the
 * unstyled Next default page (immersion break). Renders inside the root
 * layout, so the chrome (menu, fonts, tokens) stays mounted.
 */
import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="syspage">
      <p className="syspage__eyebrow">{"COGNITIO LINK · NVLL RECORD"}</p>
      <h1 className="syspage__heading">ARCHIVE FRAGMENT LOST</h1>
      <div className="syspage__rule" aria-hidden />
      <p className="syspage__sub">
        The requested folio is not held in this archive. The path may be
        mistyped, or the record was never committed to the Lexicanum.
      </p>
      <div className="syspage__actions">
        <Link href="/" className="lx-btn">
          Return to the archive
        </Link>
      </div>
    </main>
  );
}
