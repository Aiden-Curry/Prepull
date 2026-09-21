# P1D-2 Frost Mage local acceptance

Base: `9265686d8d586d0ccb02bb0500eb50032fb977af`.

## Scope and files

Added `content/guides/era/frost.ts` and registered `era-frost` in `lib/guides/registry.ts` and `content.ts`. The published route is `/era/guides/classes/mage/frost`; the Mage index is generated automatically. Existing domain types, layouts, breadcrumbs, TOC, sources, Wowhead and SEO are reused without changes.

Updated `lib/guides/validate.ts` to require both Frost gear phases. Updated `tests/guides.test.ts` and the prior unpublished-route expectation in `tests/e2e/guides.e2e.spec.ts`; added `tests/e2e/frost-guide.e2e.spec.ts`. Acceptance summaries and all ten hash comparisons are in `artifacts/acceptance/p1d2/`.

## Content and research

Twelve authored sections cover overview, strengths/limitations, talents, stats/hit, spell priority, cooldowns/mana, consumables, world buffs, professions, gear, raid preparation and common mistakes. The shared renderer adds the Sources section. Sources are recorded with access date 2026-09-21:

- [Icy Veins Classic Mage overview](https://www.icy-veins.com/wow-classic/mage-dps-pve-guide): role, utility and professions.
- [Classic talents](https://www.icy-veins.com/wow-classic/mage-dps-pve-spec-builds-talents): Arcane Power Frost versus Winter's Chill support.
- [Classic rotation](https://www.icy-veins.com/wow-classic/mage-dps-pve-rotation-cooldowns-abilities) and [Wowhead Classic abilities](https://www.wowhead.com/classic/guide/classes/mage/dps-rotation-cooldowns-abilities-pve): Frostbolt, utility and mana tools.
- [Classic stats](https://www.icy-veins.com/wow-classic/mage-dps-pve-stat-priority): boss spell-hit floor and Elemental Precision.
- [Classic buffs](https://www.icy-veins.com/wow-classic/mage-dps-pve-enchants-consumables) and [Wowhead Classic consumables](https://www.wowhead.com/classic/guide/classes/mage/dps-consumables-raid-buffs-pve): practical consumables and mature-Era world buffs.

Only Classic Era mechanics were used. Mixed-page Fire, Season of Mastery, TBC and Discovery advice was excluded. No Ice Lance, Icy Veins spell, Water Elemental, runes or later-expansion gearing mechanics were introduced. Consumable links use Classic item IDs; accepted equipment comes exclusively from the existing registry.

## Integration

Gear block: `era-mage-frost`, phases `[0, 1]`, resolving `era-frost-mage-pre-raid` and `era-frost-mage-phase-1`. No copied gear lists, item-data edits or scoring changes.

Existing exact specialization matching automatically supplies public/saved Frost character and saved Advice links. Browser tests exercise Lyria (Frost), Pyra (Fire), and saved Advice navigation; unit tests also exclude Arcane and TBC Frost. No character/provider infrastructure changes. TBC guide detail remains 404 and discovery remains truthful and empty.

## Validation

- Guide validator: 13 published, Molten Core 10/10, zero errors.
- Gear, curated and all-spec validators: PASS; existing dataset warnings remain, no blockers.
- Typecheck, lint, production build and `git diff --check`: PASS.
- Guide unit tests: 7 passed.
- Focused Frost and existing Guides browser groups: 13 passed, zero failures/skips/flakes. No historical non-guide browser groups rerun.
- Verified Frost route/discovery, both gear sets, exact character/Advice links, TBC separation, canonical/index-follow/sitemap, character noindex/nofollow, one Wowhead script, blocked-tooltip readability, 390px overflow and TOC. Axe: zero serious/critical issues.
- Ten recommendation hashes unchanged against accepted P1D evidence.

## Limitations

Talent guidance provides build outlines and reviewed sources, not an interactive point calculator. Gear remains a curated reference, not personalized simulated DPS. Browser character checks use isolated localhost fixtures; no real-account or hosted acceptance is claimed. An initial test-only TypeScript indexing error was corrected before final validation. No deployment or commit performed; no DB migration, additional guide, Battle.net or WCL change.

P1D-2 LOCAL ACCEPTANCE: YES
