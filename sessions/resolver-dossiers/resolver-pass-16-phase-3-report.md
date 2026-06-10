# Resolver-Pass 16 — Phase 3 (Characters) — Status

**Wave:** `ssot-w40k-058..060` (W40K-0571..W40K-0592, 22 Bücher).
**Phase:** phase-3-characters. **Ergebnis:** Done (kein `## Needs decision`-Stop).
**Quelle:** Runbook `scripts/runbooks/resolver-pass-runbook.md` §3 Phase 3 + §4 + §5 (FK-Reihenfolge);
Config `scripts/resolver-pass.config.json`; Dossier `sessions/resolver-dossiers/resolver-pass-16-dossier.md`.

## Promotions (characters.json) — 7 neue Canonical-Rows

| id | name | primaryFactionId | Evidenz / Schwelle |
| --- | --- | --- | --- |
| `morvenn_vahl` | Morvenn Vahl | `sisters_of_battle` | **freq-1 lore-iconic** (Dossier §7c) — Abbess Sanctorum, supreme commander der Adepta Sororitas, aktueller GW-Major-Character. Title-Character von W40K-0576 *Morvenn Vahl: Spear of Faith*. |
| `torquemada_coteaz` | Torquemada Coteaz | `ordo_malleus` | **freq-1 lore-iconic** — Inquisitor Coteaz, langjährig ikonischer Ordo-Malleus-Inquisitor. Title-Character von W40K-0581 *Daemonhammer*. |
| `arcadian_leontus` | Arcadian Leontus | `astra_militarum` | **freq-1 lore-iconic** — Lord Solar Leontus, 10th-edition Astra-Militarum-Supreme-Commander. Title-Character von W40K-0590 *Leontus*. |
| `grotsnik` | Grotsnik | `orks` | **freq-1 lore-iconic** — Mad Dok / Painboss Grotsnik, ikonischer benannter Ork. Title-Character von W40K-0583 *Grotsnik: Da Mad Dok*. |
| `aestred_thurga` | Aestred Thurga | `order_pronatus` | **freq-1 lore-iconic** — Order-Pronatus-Reliquienträgerin, Title-Character von W40K-0571 *Aestred Thurga: Pyre of Faith*. |
| `xantine` | Xantine | `emperors_children` | **freq-1 lore-iconic** — „Xantine, the Adored", Emperor's-Children-Title-Antagonist von W40K-0592 *Renegades: Lord of Excess* (Chaos-POV). |
| `darya_nevic` | Darya Nevic | `astra_militarum` | **strict freq-2 cross-batch spine** (Dossier §7b) — einziger freq≥2-*unresolved* Character der Welle (W40K-0587 *Blood of the Imperium* + W40K-0590 *Leontus*). |

Modellierungs-Notizen:

- **`aestred_thurga` → `order_pronatus`** (statt der coarse `sisters_of_battle`): die `order_pronatus`-Row
  landete in Phase 1 und gibt den feineren Sororitas-Order-Grain (Aestred Thurga *ist* Order Pronatus). Der
  Phase-1-Report nennt diese Wahl explizit als Phase-3-Option. **`morvenn_vahl` → `sisters_of_battle`**
  hingegen bleibt coarse, weil die Abbess Sanctorum die *gesamte* Adepta Sororitas befehligt, nicht einen
  einzelnen Order.
- **`torquemada_coteaz` → `ordo_malleus`** (statt der coarse `inquisition`): Coteaz ist spezifisch
  Ordo-Malleus-Inquisitor; die präzise Row existiert, also der feinere Grain.
- **`darya_nevic` single-identity (Dossier §7d.1).** Freq-2 über *Anthologie* (W40K-0587) + *Novel*
  (W40K-0590), beide Astra-Militarum-adjazent. „Darya Nevic" ist ein distinktiver, eindeutiger Vollname
  (kein generischer Name wie „Marcus") → vernachlässigbares Same-Name-Different-Character-Risiko →
  **eine** `darya_nevic`-Row per runbook §4 freq≥2-strict-Schwelle. **Kein `## Needs decision`-Stop** —
  die Identitäts-Unsicherheit des Dossiers ist durch den distinktiven Vollnamen + den gemeinsamen
  Astra-Militarum-Kontext beider Bücher hinreichend aufgelöst.

## Aliases (character-aliases.json) — 3 neue Short-Form-Einträge

| surface form | → canonical id | Begründung |
| --- | --- | --- |
| `Leontus` | `arcadian_leontus` | Diskretionärer Short-Form-Alias (Dossier §7a; runbook §4 Character-Honor-Title-Split-Konvention). Buchtitel ist *Leontus* — die Kurzform ist die dominante Lese-Surface; lore-eindeutig (nur ein Leontus), keine Cross-Axis-Kollision (§4-Scan leer). |
| `Coteaz` | `torquemada_coteaz` | Diskretionärer Short-Form-Alias. „Coteaz" ist die dominante Tabletop-/Lore-Surface für Inquisitor Coteaz; lore-eindeutig, keine Cross-Axis-Kollision. |
| `Vahl` | `morvenn_vahl` | Diskretionärer Short-Form-Alias. Kurzform für die Abbess Sanctorum; lore-eindeutig (nur eine Vahl im aktuellen Kanon), keine Cross-Axis-Kollision. |

Disziplin-Hinweis: Diese Short-Forms tauchen in der Wellen-Aggregate **nicht** als eigene Surface-Form auf
(nur die Vollnamen tun das) — sie sind daher per Dossier §7a *diskretionär*. Sie werden trotzdem aufgenommen,
weil die runbook-§4-Character-Honor-Title-Split-Konvention das Pre-Adding einer lore-eindeutigen Kurzform für
eine frisch angelegte Title-Character-Row ausdrücklich sanktioniert (Kriterien (b) lore-eindeutig + (c) keine
Cross-Axis-Disambig-Falle sind erfüllt; nur (a) „Surface-Form in der Welle" ist durch die Title-Split-Ausnahme
ersetzt). So resolved die Kurzform beim ersten Wieder-Auftauchen statt unresolved zu fallen. Die Title-Form
selbst (`Morvenn Vahl` / `Torquemada Coteaz` / `Arcadian Leontus`) resolved **direct** — kein Alias nötig.

## Bewusst unresolved gelassen (kein Raten — runbook §2/§4)

Der supporting-cast freq-1 Long-Tail (Dossier §7c) bleibt unresolved, sofern nicht lore-ikonisch mit
sauberer primary-faction-FK: u. a. Beastboss Bakmun, Captain Obeysekera, Cardinal Wangenheim,
Cardinal-Astra Xaphan, Castellan Emeric, Cerastes, Commissar Roshant, Confessor Tenaxus, Daggan Zaidu,
Myrtun Dammergot, The Red Marshal, Valtun the Patient, Wulf Khan, Ariken, Baldr, Cross, Elias, Ensor Cutler,
Fjolnir, Glavia Aerand, Holt Iverson, Ikor, Kol Rakhul, Lorenzo, Olgeir, Palatine Aesura, S'janth, Skjoldis,
Takka, Talin Sherax, Torrin Vey, Tyborc, Voltas. Keine lore-eindeutige Promotion-Basis bei freq-1 → unresolved
(runbook §2 „lieber Long-Tail offen als falsche Canonical-Kante").

## Confirmations (kein Edit nötig — bereits direct/alias)

Bereits in früheren W40K-Pässen gelandet, resolven diese Welle ohne Edit: Amberley Vail, Asenath Hyades,
Ciaphas Cain, Ephrael Stern, Gunnlaugur, Ingvar, Jurgen, Kyganil, Lord Commissar Rasp, Lucille von Shard
(freq 2), Minka Lesk, Saint Celestine, Sebastian Yarrick / Commissar Yarrick (→ `sebastian_yarrick`),
Sergeant Greiss, Yvraine. (Pre-Pass-16-Baseline aus Dossier §1: 490 character-Rows / 69 Aliases.)

## Idempotenz

Pro Row/Alias gegen den Pre-Pass-16-Stand geprüft: keine der 7 neuen Rows (`morvenn_vahl`,
`torquemada_coteaz`, `arcadian_leontus`, `grotsnik`, `aestred_thurga`, `xantine`, `darya_nevic`) und keiner
der 3 neuen Aliases (`Leontus`/`Coteaz`/`Vahl`) existierte zuvor. Alle 7 `primaryFactionId`-Targets
(`sisters_of_battle`, `ordo_malleus`, `astra_militarum`, `orks`, `order_pronatus`, `emperors_children`)
sind bestehende oder in Phase 1 gelandete Faction-Rows (FK-Reihenfolge §5 eingehalten — Phase 1 strikt vor
Phase 3). Re-Run dieser Phase legt nichts doppelt an.

## Resolver-Test-Cases — 11 neue (≥ 5 gefordert; davon 4 Alias-Konsolidierung ≥ 2 gefordert)

In `scripts/test-resolver.ts`, `resolveCharacter`-Sektion (nach dem letzten Pass-15-Character-Check, vor
`normalizeCharacterRole`):

Direct-Match (7):
1. `Morvenn Vahl` → `morvenn_vahl`
2. `Torquemada Coteaz` → `torquemada_coteaz`
3. `Arcadian Leontus` → `arcadian_leontus`
4. `Grotsnik` → `grotsnik`
5. `Aestred Thurga` → `aestred_thurga`
6. `Xantine` → `xantine`
7. `Darya Nevic` → `darya_nevic` (strict freq-2 spine)

Alias-Konsolidierung (4):
8. **Case A (cross-batch identity-merge, bereits gelandet):** `Commissar Yarrick` (W40K-0572, batch 058) +
   `Sebastian Yarrick` (W40K-0585, batch 059) → beide `sebastian_yarrick`.
9. `Leontus` → `arcadian_leontus` (neuer Short-Form-Alias).
10. `Coteaz` → `torquemada_coteaz` (neuer Short-Form-Alias).
11. `Vahl` → `morvenn_vahl` (neuer Short-Form-Alias).

## Verifikation (runbook §10)

- `npm run test:resolver` → **497 passed, 0 failed** (inkl. der 11 neuen Cases).
- `npm run test:resolver-data` → **resolver data integrity ok** („character primaryFactionIds point at
  existing factions or null" grün → alle 7 neuen FK-Targets valide; alias targets point at canonical ids grün).
- `npm run test:resolver-coverage` → exit 0 (below-threshold rows = Daten-Findings, keine Failures).
- `npm run test:apply-override-dry` → **ok** (missing resolved FK targets=0, dangling refs=0;
  out-of-range=0, unknown-work=0 — forward-ref-Guard clean).
- JSON-Validität von `characters.json` + `character-aliases.json` bestätigt.

## Write-Scope

Berührt ausschließlich: `scripts/seed-data/characters.json`, `scripts/seed-data/character-aliases.json`,
`scripts/test-resolver.ts`, diese Statusdatei. Ein Commit.
