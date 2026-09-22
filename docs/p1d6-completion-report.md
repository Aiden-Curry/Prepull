# P1D-6 — Holy Priest local acceptance

Base: `7c707b545737db0edca9f88d548a955a3a4629ab`; clean at start. No commit or deployment.

## Files and sections

- `content/guides/era/holy.ts`: overview, strengths/limitations, talents, healing stats, spell selection/ranks, mana, cooldowns, dispels, consumables, world buffs, professions, gear, raid preparation and mistakes.
- `lib/guides/registry.ts`, `content.ts`, `validate.ts`: publication, discovery, content integration and required gear-phase coverage.
- `lib/talents/priest.ts`, `priest-builds.ts`, `registry.ts`: complete typed Priest metadata, separate build selections and registration. The shared validator now permits verified same-row prerequisites while rejecting self-dependencies and cycles.
- `tests/guides.test.ts`, `tests/guide-talents.test.ts`, `tests/e2e/holy-guide.e2e.spec.ts`, `tests/e2e/priest-talents.e2e.spec.ts`: focused guide, metadata and browser coverage.
- `artifacts/acceptance/p1d6/`: unchanged recommendation hashes and browser summary.

Existing renderer, build selector, mobile selector, Wowhead integration, SEO, breadcrumbs and TOC are reused. No other guide, raid, migration, provider or recommendation change.

## Sources and metadata

Reviewed Classic sources: Icy Veins [raid builds](https://www.icy-veins.com/wow-classic/priest-healer-pve-spec-builds-talents), [healing and mana](https://www.icy-veins.com/wow-classic/priest-healer-pve-rotation-cooldowns-abilities), [stats](https://www.icy-veins.com/wow-classic/priest-healer-pve-stat-priority), [spell summary](https://www.icy-veins.com/wow-classic/priest-healer-pve-spell-summary), [consumables](https://www.icy-veins.com/wow-classic/priest-healer-pve-enchants-consumables), [overview/professions](https://www.icy-veins.com/wow-classic/priest-healer-pve-guide), and [Wowhead Classic healing abilities](https://www.wowhead.com/classic/guide/classes/priest/healer-rotation-cooldowns-abilities-pve). Seasonal notes on source pages were not imported as Era mechanics. No TBC, SoD or later Priest abilities are used.

All **47 talents**, across Discipline/Holy/Shadow, use [pinned WoWSims Classic metadata](https://github.com/wowsims/classic/blob/c925c1184dcd0c5eaff2d128af899be639235b63/ui/core/talents/trees/priest.json), independently cross-checked against [Icy Veins Classic calculator data](https://static.icy-veins.com/json/classic-talent-calculator/priest.json) for positions, maximum ranks, rank IDs and prerequisites. Classic Wowhead spell records verify names/icons.

WoWSims omits Shadow Focus rank IDs 4/5 despite declaring five ranks. Direct Classic records confirm 15329 grants 8% and 15330 grants 10% resistance reduction. The completed sequence `[15260,15327,15328,15329,15330]` is covered by an assertion. Improved Vampiric Embrace has a verified same-row prerequisite, Vampiric Embrace; this explains the validator adjustment.

## Builds

Both are exact representative allocations from the reviewed source and pass all 51-point, rank, tier and dependency checks:

- **Standard Holy raid healing: 21/30/0** — Spiritual Guidance and Spiritual Healing, with Divine Spirit and mana support.
- **Power Infusion healing alternative: 32/19/0** — explicitly described as Discipline-heavy, giving up deep-Holy throughput for a coordinated caster cooldown when healing coverage permits.

Both retain Inner Focus, Meditation, Healing Focus, Divine Fury and Inspiration. This alternative is not portrayed as the player's current talents or as justification to link Discipline characters to Holy.

Source calculator encodings:

- `hhhhhjjjjjffmmmoookisssssttttt00000332226777299999c`
- `00000334447776299999cbbbbbdddddehhhhhjjjjjmmmffoook`

## Gear and links

The guide reads the unchanged **era-priest-holy** registration for Pre-Raid and Phase 1. No item copies or edits. Existing exact-spec lookup exposes public/saved Holy character links and saved Holy Advice links. Discipline and Shadow exclusions pass; TBC detail remains 404 with no Era fallback.

## Focused validation

- `validate:guides`: PASS, 16 published guides, Molten Core 10/10, no errors.
- `validate:gear`, `validate:curated`, `validate:spec -- all`: PASS; existing dataset warnings remain, no blockers.
- Typecheck, lint, production build and `git diff --check`: PASS.
- **17 focused unit tests passed**, including metadata completeness, allocations, tier/prerequisite rejection, same-row dependency support, cycle rejection, exact linking and gear phases.
- **16 focused Chromium cases passed**: seven Holy cases plus existing Fury/Frost/Combat/Hunter talent and Armory separation cases.
- Desktop three-tree rendering, 390px selector/no overflow, switching, keyboard details, one tooltip script, blocked-script fallback, gear, discovery, SEO/canonical/sitemap and TBC separation pass.
- Additional actual-touch verification passes for both builds with Wowhead blocked. Mobile screenshot inspected.
- Axe: zero serious/critical issues at desktop and 390px.
- **All ten recommendation hashes unchanged**, LF-normalized SHA-256 against the accepted P1D baseline.

The first negative prerequisite test targeted Force of Will incorrectly; it was corrected to the source-verified Mental Strength prerequisite and rerun successfully. No product workaround was made for that test error.

Local logs/source evidence/screenshots: ignored `.vercel/p1d6/`. Browser runs use isolated local fixtures, not hosted or real-account acceptance. Read-only builds and gear references do not calculate personalized healing weights or reclassify a character. External icons/hover descriptions depend on their services; local details remain available.

**P1D-6 LOCAL ACCEPTANCE: YES**
