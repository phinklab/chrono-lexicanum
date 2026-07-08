/**
 * `@modal` slot reset.
 *
 * Next.js keeps a parallel slot's last active state across SOFT navigations,
 * even when the new URL matches none of the slot's segments. Without this
 * catch-all, an open entity panel would linger over a `/buch/[slug]` page after
 * an in-panel book link is clicked (the slot would have no matching segment and
 * keep rendering the stale panel). This low-priority catch-all gives every
 * non-intercepted route a matching slot segment that renders nothing, so the
 * panel clears cleanly. The `(.)`-intercepts outrank it for entity routes.
 */
export default function ModalCatchAll() {
  return null;
}
