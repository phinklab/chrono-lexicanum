/**
 * `@modal` slot fallback — Brief 113, Phase B.
 *
 * Rendered for the modal slot whenever the current URL is reached by a HARD
 * navigation (refresh / direct link / SEO crawler) or otherwise doesn't match
 * one of the slot's intercept segments. `null` → no overlay, so the canonical
 * full SSG page in `children` is what the visitor sees. The intercepts
 * (`(.)charakter|fraktion|welt/[slug]`) only fire on in-app SOFT navigation.
 *
 * Soft-nav reset to a non-entity route (e.g. a `/buch/[slug]` link clicked
 * inside an open panel) is handled by the catch-all sibling — see
 * `[...catchAll]/page.tsx`. `default.tsx` alone does not reset a parallel slot
 * on soft navigation.
 */
export default function ModalDefault() {
  return null;
}
