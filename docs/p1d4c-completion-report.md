# P1D-4C — Combat Rogue visual talent builds

Base: `2617f60186b9294e3c8466cc73cab2495cf6dce2` (accepted P1D-4B), clean at start.

## Files changed

- `lib/talents/rogue.ts`: complete typed Classic Era metadata for 51 talents across Assassination, Combat and Subtlety.
- `lib/talents/rogue-builds.ts`: separate selections for two representative raid builds.
- `lib/talents/registry.ts`: registers both Rogue builds with the existing system.
- `content/guides/era/combat.ts`: existing talent-build block and selector, reviewed source metadata and brief build differences; textual explanations retained.
- `tests/guide-talents.test.ts`, `tests/e2e/guide-talents.e2e.spec.ts`, `tests/e2e/rogue-talents.e2e.spec.ts`: metadata/allocation validation, Armory separation and focused Rogue browser tests.
- `artifacts/acceptance/p1d4c/`: recommendation hashes and browser summary.

ClassicTalentTree, the build selector, mobile selector, tooltip integration, CSS and Warrior/Mage metadata/builds are unchanged.

## Sources and metadata audit

[Pinned WoWSims Classic Rogue metadata](https://github.com/wowsims/classic/blob/cf192c7a6200cce6c33630016fe32469d6db0e89/ui/core/talents/trees/rogue.json) supplies stable IDs, positions, rank spell IDs, maximum ranks and prerequisites. Names/icons were checked using Classic Wowhead first-rank spell records. All 51 talents were independently compared with [Icy Veins Classic calculator data](https://static.icy-veins.com/json/classic-talent-calculator/rogue.json), including complete rank ID sequences and prerequisite identities.

One upstream discrepancy was resolved: WoWSims reverses Improved Gouge ranks 2 and 3. Direct Classic spell records confirm [13793 adds 1 second](https://www.wowhead.com/classic/spell=13793) and [13792 adds 1.5 seconds](https://www.wowhead.com/classic/spell=13792). The imported metadata uses the verified order `[13741, 13793, 13792]`, with a regression assertion.

No TBC, Season of Discovery or later Rogue talent data is used. Sources reviewed 2026-09-21.

## Builds

Both exact allocations come from the reviewed [Icy Veins Classic Rogue talent guide](https://www.icy-veins.com/wow-classic/rogue-dps-pve-spec-builds-talents). Its published calculator selections were decoded and matched by first-rank spell ID, not invented.

| Build | Assassination / Combat / Subtlety | Important differences |
| --- | --- | --- |
| Combat Swords | 19 / 32 / 0 | Sword Specialization and Aggression; Ruthlessness and Relentless Strikes support finishers and energy recovery. |
| Combat Daggers | 15 / 31 / 5 | Dagger Specialization, Improved Backstab and Opportunity; this variant omits Ruthlessness, Relentless Strikes and Aggression. |

Both include Improved Slice and Dice, Weapon Expertise, Blade Flurry and Adrenaline Rush. Daggers requires a main-hand dagger and rear access for Backstab. Its higher builder energy cost makes Slice and Dice planning important. Utility variants are acknowledged without changing the sourced selections. Both are labelled guide builds, not player allocations.

Reproducible source calculator encodings:

- Swords: `2222244333555688888fffgghkkkkkllnnqqqqqstttttwwwvvx`
- Daggers: `222224455588888fffggiiikkkkkllnnpppppqqqqqsvvxzzzzz`

## Focused checks

- `npm run validate:guides`: PASS; 14 published guides, Molten Core 10/10, zero errors.
- Focused unit tests: 13 passed. Both Rogue builds total 51 and pass tier/prerequisite rules; invalid dependencies and locked rows are rejected.
- Focused browser tests: seven passed, covering Fury, Frost, Rogue and public Armory separation. After correcting Improved Gouge rank IDs, both Rogue cases passed again.
- Rogue coverage includes Swords/Daggers switching and switching back, selected/unselected weapon talents, all three desktop trees, 390px tree navigation without overflow, 44px targets, keyboard/tap details and one Wowhead script.
- Desktop/mobile axe scans: zero serious/critical issues.
- Typecheck, lint, production build and `git diff --check`: PASS.
- All ten recommendation hashes unchanged against the accepted P1D baseline (LF-normalized SHA-256).

Local logs/source evidence: ignored `.vercel/p1d4c/`. Playwright logs/JSON show passing tests; PowerShell's redirected native warning output produces a nonzero wrapper status.

No commit, deployment, new guide, migration, Battle.net/WCL change or recommendation edit. External icons and full Wowhead hover descriptions still depend on their services; local talent details remain available.

**P1D-4C LOCAL ACCEPTANCE: YES**
