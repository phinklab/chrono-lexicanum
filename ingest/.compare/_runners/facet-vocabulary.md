# Facet vocabulary (use ONLY these IDs, bare value-IDs only)

## Format (`format`, multi-value) — Medium of the work.
- `book` (Book)
- `audiobook` (Audiobook)
- `animation` (Animation)
- `live_action` (Live Action)
- `audio_drama` (Audio Drama)
- `podcast` (Podcast)

## Protagonist Gender (`protagonist_gender`, multi-value) — Gender of the principal viewpoint character(s).
- `male` (Male)
- `female` (Female)
- `non_binary` (Non-binary)
- `mixed` (Mixed)
- `ensemble` (Ensemble)

## Protagonist Class (`protagonist_class`, multi-value) — Faction/role archetype of the main protagonist(s).
- `space_marine` (Space Marine)
- `guardsman` (Guardsman)
- `inquisitor` (Inquisitor)
- `tech_priest` (Tech-Priest)
- `sister` (Sister of Battle)
- `custodes` (Custodes)
- `civilian` (Civilian)
- `pc_xenos` (Xenos) — Non-human protagonist (Eldar, Tyranid, Ork, etc.). ID prefixed `pc_` to disambiguate from pov_side.xenos.
- `daemon` (Daemon)
- `multi` (Multi-class)

## POV Side (`pov_side`, multi-value) — Whose viewpoint the reader follows.
- `imperium` (Imperium)
- `chaos` (Chaos)
- `xenos` (Xenos)
- `dual` (Dual) — Sustained POV across two opposing sides.
- `neutral` (Neutral)

## Scope (`scope`, multi-value) — Scale of the conflict the story covers.
- `squad` (Squad)
- `company` (Company)
- `regiment` (Regiment)
- `planetary` (Planetary)
- `sector` (Sector)
- `galactic` (Galactic)

## Entry Point (`entry_point`, single-value) — Reader-onboarding role within the broader catalog.
- `standalone` (Standalone)
- `series_start` (Series Start)
- `mid_series` (Mid Series)
- `series_finale` (Series Finale)
- `requires_context` (Requires Context) — Best read after specific prerequisites.

## Length (`length_tier`, single-value) — Approximate length bucket.
- `novella` (Novella)
- `short` (Short Novel)
- `standard` (Standard)
- `doorstopper` (Doorstopper)

## Plot Type (`plot_type`, multi-value) — Dominant narrative structure.
- `war_story` (War Story)
- `heist` (Heist)
- `mystery` (Mystery)
- `siege` (Siege)
- `court_intrigue` (Court Intrigue)
- `journey` (Journey)
- `last_stand` (Last Stand)
- `political_thriller` (Political Thriller)
- `character_study` (Character Study)

## Tone (`tone`, multi-value) — Emotional register of the prose.
- `grimdark` (Grimdark)
- `hopepunk` (Hopepunk)
- `somber` (Somber)
- `action_heavy` (Action-heavy)
- `philosophical` (Philosophical)
- `cosmic_horror` (Cosmic Horror)
- `satirical` (Satirical)

## Theme (`theme`, multi-value) — Recurring thematic concern.
- `betrayal` (Betrayal)
- `redemption` (Redemption)
- `war` (War)
- `faith` (Faith)
- `loyalty` (Loyalty)
- `hubris` (Hubris)
- `brotherhood` (Brotherhood)
- `sacrifice` (Sacrifice)
- `doubt` (Doubt)

## Content Warning (`content_warning`, multi-value) — NEON-14 trigger-warning set per Bridgland et al. 2022 (PMC9067675).
- `cw_violence` (Violence) — Physical violence, combat, gore.
- `cw_sex` (Sexual Content)
- `cw_stigma` (Stigma & Prejudice)
- `cw_disturbing` (Disturbing Content)
- `cw_language` (Strong Language)
- `cw_risky_behaviour` (Risky Behaviour)
- `cw_mental_health` (Mental Health)
- `cw_death` (Death)
- `cw_parental_guidance` (Parental Guidance)
- `cw_crime` (Crime)
- `cw_abuse` (Abuse)
- `cw_socio_political` (Socio-political Content)
- `cw_flashing_lights` (Flashing Lights)
- `cw_objects` (Specific Objects) — Spiders, needles, or other commonly-feared objects.

## Language (`language`, multi-value) — Original publication language of the work (not the site's UI language).
- `en` (English)
- `de` (German)
- `fr` (French)
- `it` (Italian)
- `es` (Spanish)
