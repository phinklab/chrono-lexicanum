# Preview invite console (Brief 163)

A local, operator-only tool to mint per-person, time-limited preview invite
links and see which were activated. Runs entirely on your machine — the signing
secret never leaves the browser, and nothing here is ever deployed.

## Files

- `template.html` — **the committed, secret-free source.** This is what gets
  code-reviewed. It contains the in-browser HMAC minting (the same canonical
  token format the server verifies — see `src/lib/previewToken.ts`), the link
  list, badges, and the activation overlay. No secret is baked in.
- `build.mjs` — substitutes `__PROD_BASE_URL__` and writes `console.html`.
- `serve.mjs` — builds, then serves `console.html` on `http://localhost:4178`.
- `console.html` — **generated, gitignored, never committed, never deployed.**
  This is the file you actually open.

## Use

```sh
npm run preview:console          # builds + serves on http://localhost:4178
# (custom production domain:)
npm run preview:console:build https://your-domain.example   # then serve
```

Then open **http://localhost:4178** (not `127.0.0.1` — the endpoint's CORS
allow-origin is `localhost`; and not `file://` — Web Crypto needs the
localhost secure context). In the console:

1. **Configuration** — enter the **signing secret** (the same
   `PREVIEW_INVITE_SECRET` you set in Vercel) and the **admin credential**
   (`ATLAS_USER` / `ATLAS_PASS`, used only to read activation status). Tick
   "remember" to cache them in this browser's `localStorage`, or leave them in
   memory for the session.
2. **Generate** — pick a duration (default 3 days) and an optional private
   label, click **Generate**. The signed link is added to the list and copied to
   your clipboard. Paste it to the person.
3. **Generated links** — every link with its `jti`, expiry, an active/expired
   badge, and an "activated · <time> (×count)" overlay fetched from
   `GET /api/preview-invites`. Use **Refresh** to re-fetch. Export/import keeps
   the list across a `localStorage` wipe.

## Levers

- **End everything now:** rotate `PREVIEW_INVITE_SECRET` in Vercel and redeploy
  — every outstanding link and active session dies at once. Removing a row in
  the console is bookkeeping only, **not** revocation.
- **Full public launch:** `PREVIEW_GATE=off` (gate, links, and password all
  become irrelevant).

See `.env.example` (Timed preview access section) for the env vars.
