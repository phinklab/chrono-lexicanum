/**
 * JSON-LD structured-data block (Launch S5). Server component — renders one
 * `<script type="application/ld+json">` with the given schema.org object.
 *
 * `<` is escaped to the unicode sequence u003c so payload strings (titles,
 * synopses) can never break out of the script element (`</script>` injection). CSP note:
 * `application/ld+json` is a data block, not an executable script type —
 * script-src does not apply to it.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
