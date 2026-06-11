/**
 * Preview gate — shared constants for src/proxy.ts (route gate) and the
 * /login server action.
 *
 * Credential defaults are deliberately committed (public repo — this is a
 * soft lock against drive-by visitors pre-launch, not a vault); both are
 * overridable per environment without a code change. `PREVIEW_GATE=off`
 * disables the gate entirely (launch kill-switch).
 */

export const PREVIEW_COOKIE = "cl-preview";

export const PREVIEW_USER = process.env.PREVIEW_USER ?? "PreviewAccount";
export const PREVIEW_PASS = process.env.PREVIEW_PASS ?? "lexipreview";

export const previewGateEnabled = () =>
  process.env.NODE_ENV === "production" && process.env.PREVIEW_GATE !== "off";
