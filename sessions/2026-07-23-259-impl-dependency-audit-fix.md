---
session: 2026-07-23-259
role: implementer
date: 2026-07-23
status: complete
slug: dependency-audit-fix
parent: none            # maintainer-prompted CI repair; no architect brief
links:
  - 2026-07-22-258
commits:
  - (dieser PR)
---

# Dependency-Audit-Fix fuer Next-Transitives

## Summary

Der Produktionsaudit wird nicht mehr von den verwundbaren, unter Next duplizierten Versionen `postcss@8.4.31` und `sharp@0.34.5` blockiert. Next und sein ESLint-Preset stehen auf `16.2.11`; enge npm-Overrides lassen Next die bereits direkten, gepatchten Versionen `postcss@8.5.16` und `sharp@0.35.3` mitbenutzen.

## What I did

- `package.json` — `next` und `eslint-config-next` von `16.2.10` auf `16.2.11` angehoben; Overrides ausschließlich fuer die beiden verwundbaren Next-Transitiven ergänzt.
- `package-lock.json` — gegen den bestehenden Lockfile neu aufgelöst; die duplizierten Next-Unterbäume fuer PostCSS, Sharp und dessen Plattformpakete entfernt.
- `scripts/test-helpers/next-runtime-stub.ts` — den DB-freien Incremental-Cache-Stub an Next 16.2.11s `generateSimpleCacheKey`-Schnittstelle angepasst.
- `sessions/2026-07-23-259-impl-dependency-audit-fix.md` — Ursache, Sicherheitsentscheidung und Verifikation dokumentiert.

## Decisions I made

- **Eigener Product/Platform-PR statt Änderung an PR #290.** Der fehlgeschlagene Audit ist eine nach dem letzten grünen Main-Lauf veröffentlichte Dependency-Advisory und unabhängig vom Doc-only-Rollup. So bleibt dessen Coordination-Scope rein.
- **Next-Patch auf `16.2.11`.** Das ist der aktuelle Patch derselben 16.2-Linie und enthält zusätzliche Security-Fixes; `eslint-config-next` bleibt versionsgleich.
- **Enge Overrides unter `next`.** Next deklariert weiterhin die anfällige PostCSS-Version und eine Sharp-Range, die den anfälligen Lockfile-Eintrag beibehielt. Die Overrides referenzieren mit `$postcss` und `$sharp` die bereits vorhandenen direkten, gepatchten Abhängigkeiten; andere Paketbäume bleiben unberührt.
- **Test-Stub auf die neue Next-Methode nachgezogen.** Next 16.2.11 ruft im realen `unstable_cache`-Pfad `generateSimpleCacheKey` statt `generateCacheKey` auf. Die Fake-Implementierung behält bewusst ihre identische deterministische Schlüsselbildung; Produktivcode musste nicht geändert werden.
- **Kein `npm audit fix --force`.** npm schlug dabei ein Downgrade auf `next@9.3.3` vor. Das wäre ein inkompatibler Framework-Rücksprung statt eines Sicherheitsfixes.
- **Keine Behebung der verbleibenden Dev-only-Funde.** `npm ci` meldet sie außerhalb des Produktionsaudits; der geforderte CI-Gate ist `npm audit --omit=dev --audit-level=high`. Eine breitere Toolchain-Aktualisierung wäre eigener Scope.

## Verification

- `npm ci` — pass; Lockfile installiert reproduzierbar.
- `npm ls next eslint-config-next postcss sharp --all` — pass; Next `16.2.11`, ESLint-Preset `16.2.11`, PostCSS `8.5.16` und Sharp `0.35.3`, jeweils dedupliziert; keine invaliden Einträge.
- `npm audit --omit=dev --audit-level=high --offline` — pass: `found 0 vulnerabilities`.
- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run text:lint` — pass.
- `npm test` — pass.
- `npm run check:eras` — pass.
- `npm run brain:lint -- --no-write` — pass.
- `npm run build` — pass.
- `npm run test:smoke` — alle 20 Browser-Smokes pass; der lokale Windows-Runner hing danach im Webserver-Teardown und erreichte das 240-s-Shell-Limit. Der identische Linux-CI-Lauf ist deshalb die maßgebliche Exit-Code-Verifikation.

## Open issues / blockers

Keine fachlichen Blocker. Online-Audit und Browser-Smoke laufen nach dem Push nochmals in den GitHub-Workflows.

## For next session

- Nach Merge dieses Security-PRs PR #290 auf den neuen Main-Stand ziehen und die Checks erneut laufen lassen.
- Verbleibende Dev-only-Advisories bei Bedarf in einem eigenen Toolchain-Sicherheits-Pass bewerten.

## References

- [Next.js 16.2.11 release](https://github.com/vercel/next.js/releases/tag/v16.2.11)
- [Sharp advisory GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj)
- [PostCSS advisory GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93)
- [npm package.json overrides](https://docs.npmjs.com/files/package.json/#overrides)
