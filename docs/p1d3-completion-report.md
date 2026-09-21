# P1D-3 Combat Rogue local acceptance

Base: `361e6a4dada626b2fccfcca48a2aa7d8560cf66d`.

## Files and scope

- Added `content/guides/era/combat.ts`.
- Updated `lib/guides/registry.ts`, `content.ts` and `validate.ts`.
- Updated `tests/guides.test.ts`; added `tests/e2e/combat-guide.e2e.spec.ts`.
- Added this report and `artifacts/acceptance/p1d3/` browser/hash evidence.

Published route: `/era/guides/classes/rogue/combat`. The Rogue index and discovery entry derive from the existing manifest. No new domain model, rendering infrastructure or shared layout changes. Existing breadcrumbs, TOC, source metadata, Wowhead and SEO remain in use.

## Guide coverage

All 15 requested sections: overview, strengths/limitations, talents, stats, weapon skill/hit, rotation/priority, Slice and Dice, cooldowns, poisons, consumables, world buffs, professions, gear, raid preparation and common mistakes. The shared renderer adds Sources.

Combat swords and Combat daggers are distinguished. Special-attack hit thresholds account for weapon skill and Precision and are explicitly separate from dual-wield auto attacks. Slice and Dice duration planning, safe cleave, Windfury/poison interaction, interrupts and encounter preparation are covered. No later-expansion rotation or Discovery mechanics are prescribed.

## Sources reviewed

Access date: 2026-09-21. Each guide source is recorded in the existing structured metadata.

- [Icy Veins Classic Rogue overview](https://www.icy-veins.com/wow-classic/rogue-dps-pve-guide): strengths, limitations and professions.
- [Classic Rogue talents](https://www.icy-veins.com/wow-classic/rogue-dps-pve-spec-builds-talents) and [Wowhead Classic build allocations](https://www.wowhead.com/classic/guide/classic-rogue-pve-dps): swords and daggers.
- [Wowhead Rogue stats](https://www.wowhead.com/classic/guide/classes/rogue/dps-stat-priority-attributes-pve): attributes, glancing blows and weapon skill. Its blanket 9% recommendation was not copied as a universal requirement.
- [Wowhead Classic melee hit thresholds](https://www.wowhead.com/classic/guide/classes/warrior/fury/dps-stat-priority-attributes-pve): cross-check of the shared 300/305 weapon-skill thresholds. Subtracting Rogue Precision gives the stated gear examples; this is not a new Warrior guide.
- [Icy Veins Classic priority](https://www.icy-veins.com/wow-classic/rogue-dps-pve-rotation-cooldowns-abilities) and [Wowhead Classic abilities](https://www.wowhead.com/classic/guide/classes/rogue/dps-rotation-cooldowns-abilities-pve): builders, Slice and Dice, finishers and cooldowns.
- [Wowhead Classic poisons](https://www.wowhead.com/classic/guide/wow-classic-best-rogue-poisons): Instant Poison, utility poisons and Windfury main-hand handling.
- [Icy Veins Classic consumables](https://www.icy-veins.com/wow-classic/rogue-dps-pve-enchants-consumables) and [Wowhead Classic world buffs](https://www.wowhead.com/classic/guide/classic-world-buff-consumables).

Classic item records for Thistle Tea (7676), Grilled Squid (13928) and Juju Power (12451) were also checked. Historical item-page comments describing later patches were excluded.

## Gear and links

The sole gear block references `era-rogue-combat`, phases `[0, 1]`, resolving `era-combat-rogue-pre-raid` and `era-combat-rogue-phase-1`. No item data, accepted datasets, scoring or recommendation rules changed.

Existing exact class/spec lookup enables Combat character and saved Advice links automatically. Unit tests exclude Assassination, Subtlety, unavailable specialization and TBC Combat. Browser tests navigate from the public Combat fixture and saved Advice, then verify both non-Combat specializations omit the link using isolated localhost saved snapshots. Synthetic player state is cleaned in `finally`.

## Validation

- `validate:guides`: 14 published, Molten Core 10/10, zero errors.
- `validate:gear`, `validate:curated`, `validate:spec -- all`: PASS, existing dataset warnings only.
- `typecheck`, `lint`, `build`, `git diff --check`: PASS.
- Guide unit tests: 8 passed.
- Combat browser group only: 5 passed, zero failures, skips or flakes. Historical browser groups not rerun.
- Covered route/index/discovery, all sections, exact public/saved/Advice links, non-Combat exclusion, shared Pre-Raid/Phase 1 items, TBC 404/empty state, index/follow/canonical/sitemap, character noindex/nofollow and one tooltip script.
- At 1440px and 390px, expanded gear has no horizontal overflow; keyboard TOC and blocked-tooltip readability pass. Axe has zero serious/critical violations at both widths.
- All ten recommendation hashes unchanged against accepted P1D evidence.

## Limitations

Talent builds are practical outlines with reviewed allocation sources, not an interactive calculator. Gear is the accepted curated Combat reference, not a separate dagger dataset or personalized DPS simulation. Browser tests use local fixtures; no hosted or real-account acceptance is claimed. Existing data warnings were not changed as part of guide authoring.

No commit, deployment, migration, provider change or additional guide.

P1D-3 LOCAL ACCEPTANCE: YES
