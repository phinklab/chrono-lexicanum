/**
 * Global error boundary. Catches errors thrown by the ROOT
 * layout itself — the one place `app/error.tsx` cannot reach. When this
 * renders, the root layout (and with it globals.css, the font variables and
 * every token) is gone, so it must ship its own <html>/<body> and inline
 * styles with hard-coded values mirroring 00-tokens.css (void #02030a, bone
 * #e8dcc0, gold #c9a65a) and system font fallbacks. Kept deliberately minimal:
 * this surface only appears when the app shell itself is broken.
 */
"use client";

const page: React.CSSProperties = {
  minHeight: "100vh",
  margin: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "96px 24px 120px",
  background: "#02030a",
  textAlign: "center",
};

const eyebrow: React.CSSProperties = {
  margin: 0,
  fontFamily: "ui-monospace, monospace",
  fontSize: "11px",
  letterSpacing: "0.34em",
  textTransform: "uppercase",
  color: "rgba(232, 220, 192, 0.62)",
};

const heading: React.CSSProperties = {
  margin: "14px 0 0",
  fontFamily: "Georgia, serif",
  fontWeight: 400,
  fontSize: "clamp(26px, 5vw, 44px)",
  letterSpacing: "0.08em",
  color: "#e8dcc0",
};

const sub: React.CSSProperties = {
  maxWidth: "560px",
  margin: "16px auto 0",
  fontFamily: "Georgia, serif",
  fontStyle: "italic",
  fontSize: "17px",
  lineHeight: 1.55,
  color: "rgba(232, 220, 192, 0.62)",
};

const button: React.CSSProperties = {
  marginTop: "34px",
  fontFamily: "ui-monospace, monospace",
  fontSize: "12px",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "#c9a65a",
  border: "1px solid rgba(201, 166, 90, 0.45)",
  background: "transparent",
  padding: "11px 24px",
  cursor: "pointer",
};

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={page}>
        <p style={eyebrow}>{"COGITATOR FAVLT · SHELL DOWN"}</p>
        <h1 style={heading}>TRANSMISSION INTERRUPTED</h1>
        <p style={sub}>
          The archive shell itself failed to assemble. Re-consecrate the link —
          if the fault persists, the machine spirit needs a moment.
        </p>
        <button type="button" style={button} onClick={reset}>
          Re-consecrate the link
        </button>
      </body>
    </html>
  );
}
