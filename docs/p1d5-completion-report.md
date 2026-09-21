# P1D-5 — Marksmanship Hunter local acceptance

Base: `e86c5fdf3049863af1a888e9e86af4aad8a4b18d`, clean at start. No commit or deployment.

## Files and guide coverage

- `content/guides/era/marksmanship.ts`: published guide content covering overview, strengths/limitations, talents, stats/hit, rotation, Auto Shot timing, Aimed Shot/Multi-Shot, pets, cooldowns, consumables, world buffs, professions, gear, raid preparation and mistakes.
- `lib/guides/registry.ts`, `content.ts`, `validate.ts`: publication, discovery, existing renderer integration and required Pre-Raid/Phase 1 gear validation.
- `lib/talents/hunter.ts`, `hunter-builds.ts`, `registry.ts`: complete Hunter metadata and separate selections registered in the existing talent system.
- `tests/guides.test.ts`, `tests/guide-talents.test.ts`, `tests/e2e/hunter-guide.e2e.spec.ts`, `tests/e2e/hunter-talents.e2e.spec.ts`: focused validation and browser coverage.
- `artifacts/acceptance/p1d5/`: recommendation hashes and browser results.

No changes to ClassicTalentTree, selectors, layouts, tooltip script, Warrior/Mage/Rogue data, providers, migrations or recommendation datasets. No Holy Priest guide or raid added.

## Sources and talent data

The guide records reviewed Classic-only sources from Icy Veins for [talents](https://www.icy-veins.com/wow-classic/hunter-dps-pve-spec-builds-talents), [rotation](https://www.icy-veins.com/wow-classic/hunter-dps-pve-rotation-cooldowns-abilities), [stats](https://www.icy-veins.com/wow-classic/hunter-dps-pve-stat-priority), [pets](https://www.icy-veins.com/wow-classic/hunter-dps-pets-guide), [consumables](https://www.icy-veins.com/wow-classic/hunter-dps-pve-enchants-consumables) and [overview/professions](https://www.icy-veins.com/wow-classic/hunter-dps-pve-guide), plus [Wowhead Classic abilities](https://www.wowhead.com/classic/guide/classes/hunter/dps-rotation-cooldowns-abilities-pve). Season of Mastery notes on source pages were not treated as Era mechanics; no TBC/SoD/later abilities were imported.

All **46 talents** across Beast Mastery, Marksmanship and Survival use [pinned WoWSims Classic metadata](https://github.com/wowsims/classic/blob/c925c1184dcd0c5eaff2d128af899be639235b63/ui/core/talents/trees/hunter.json). Stable IDs, complete rank spell sequences, coordinates, maximum ranks and prerequisite identities were independently checked against [Icy Veins Classic calculator data](https://static.icy-veins.com/json/classic-talent-calculator/hunter.json). Names/icons were verified from Classic Wowhead first-rank spell records.

One source discrepancy was resolved: WoWSims reverses Deflection ranks 4/5. Classic spell effects confirm 19301 grants 4% parry and 19300 grants 5%. Metadata and a regression assertion use `[19295, 19297, 19298, 19301, 19300]`.

## Useful raid builds

Both exact allocations are decoded from the reviewed Icy Veins calculator links and total 51 points:

- **Standard raid Marksmanship: 20/31/0** — pet damage through Unleashed Fury/Ferocity alongside Trueshot Aura.
- **Marksmanship with Surefooted: 2/31/18** — trades pet investment for hit and Survival utility when gear leaves a meaningful hit shortfall. It is not presented as an automatic upgrade when hit-capped.

Source encodings:

- `hhhhhjjjjjmmmkioooooqqqiissssst000005544488888aaaaa`
- `hhhhhjjjjjmmmkioooooqqqiissssstuuuvvvyyxxAABBBEEE00`

The existing build selector, tree renderer, mobile selector, keyboard/touch details and single Wowhead script are reused. Guide recommendations remain separate from Armory allocations.

## Gear and exact links

The actual accepted registry key is **`era-hunter-marksman`**, not `era-hunter-marksmanship` in the request. The guide directly reads that unchanged registration, yielding `era-marksmanship-hunter-pre-raid` and `era-marksmanship-hunter-phase-1`. No item records are duplicated or edited.

Existing exact-spec lookup automatically supplies the public/saved Marksmanship character and saved Advice links. Browser tests verified both positive paths and exclusion of Beast Mastery/Survival. TBC index stays empty; TBC Hunter detail returns 404 with no Era fallback.

## Focused checks

- `validate:guides`: PASS, 15 published guides, Molten Core 10/10, no errors.
- `validate:gear`, `validate:curated`, `validate:spec -- all`: PASS; existing candidate warnings remain unchanged, no blockers.
- `typecheck`, `lint`, production `build`, `git diff --check`: PASS.
- Focused unit tests: **15 passed**, including complete metadata, both 51-point allocations, tier/prerequisite checks, gear requirements and exact-spec/version separation.
- Focused Chromium: **14 passed**, including seven Hunter cases and seven existing Fury/Frost/Combat/Armory talent cases. No historical suite rerun.
- Hunter coverage: route/discovery, sections, sitemap/SEO/canonical, shared gear phases, public/saved/Advice links, non-Marksmanship exclusion, both build selections, desktop three-tree layout, 390px no overflow, keyboard details, one script, blocked-script fallback, TOC and axe.
- Additional actual-touch check: both builds' local details work with Wowhead blocked. An initially broad test selector matched Next.js's route announcer; scoping it to the talent component resolved the test-only issue.
- Axe: zero serious/critical issues at desktop and 390px.
- **Ten recommendation hashes unchanged** against the accepted P1D baseline using LF-normalized SHA-256.

Local logs, source evidence and mobile screenshot are in ignored `.vercel/p1d5/`. Browser tests use isolated local fixtures, not real-account acceptance. Guide builds are read-only recommendations, and the shared gear reference does not dynamically recalculate for talent selection. External icons/hover descriptions depend on their services; local details remain available.

**P1D-5 LOCAL ACCEPTANCE: YES**
