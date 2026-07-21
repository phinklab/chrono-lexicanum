/**
 * Root error boundary. Catches
 * any uncaught render/data error below the root layout — a DB outage, a flaky
 * loader, a bad row — which would otherwise surface as the unstyled Next
 * default error page (immersion break). The layout chrome (menu, fonts, tokens) stays
 * mounted; only the page content is replaced. Errors thrown by the root layout
 * ITSELF are caught one level up by `global-error.tsx`.
 *
 * Must be a Client Component (Next contract for error boundaries); `reset()`
 * re-renders the failed segment — for the transient pooler-timeout class of
 * failure a retry is genuinely likely to succeed.
 */
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { captureException } from "@sentry/browser";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side detail is already in the Vercel function logs; this keeps a
    // client-side trace for local dev without leaking anything new.
    console.error(error);
    // React-render errors don't hit the SDK's global handlers — report them
    // explicitly. No-op while the DSN is unset (init never ran); server-side
    // originals arrive separately via onRequestError, correlated by digest.
    captureException(error);
  }, [error]);

  return (
    <main id="main" tabIndex={-1} className="syspage" role="alert">
      <p className="syspage__eyebrow">{"COGITATOR FAVLT · LINK SEVERED"}</p>
      <h1 className="syspage__heading">TRANSMISSION INTERRUPTED</h1>
      <div className="syspage__rule" aria-hidden />
      <p className="syspage__sub">
        The machine spirit faltered while assembling this folio. Nothing is
        lost: re-consecrate the link, or fall back to the archive gate.
      </p>
      {error.digest ? (
        <p className="syspage__digest">{`REF · ${error.digest}`}</p>
      ) : null}
      <div className="syspage__actions">
        <button type="button" className="lx-btn" onClick={reset}>
          Re-consecrate the link
        </button>
        <Link href="/" className="lx-btn">
          Return to the archive
        </Link>
      </div>
    </main>
  );
}
