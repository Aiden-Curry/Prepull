# P1D-4A local acceptance

Base: `6078cfaa17355a78c3308b7d2cba5abcbfffc01b`. No commit or deployment performed.

## Implementation

- `lib/talents/types.ts`, `warrior.ts`, `builds.ts`, and `registry.ts` separate typed Classic talent metadata from guide build selections. All 52 Warrior talents include stable IDs, tree positions, maximum ranks, rank spell IDs, and icons; nine verified prerequisites are represented. Validation checks ranks, tier gates, prerequisites, positions and allocation.
- `components/guides/classic-talent-tree.tsx` and `app/globals.css` implement original HTML/CSS/SVG trees with icons, rank badges, dimmed unselected icons, prerequisite connectors, tree totals and accessible details.
- `lib/guides/types.ts`, `lib/guides/validate.ts`, `components/guides/guide-page.tsx`, and `content/guides/era/fury.ts` integrate a reusable talent-build block into the existing guide system. Fury retains explanatory prose and explicitly labels the visualization as a guide build, not the player's current talents.
- `tests/guide-talents.test.ts`, `tests/e2e/guide-talents.e2e.spec.ts`, and `package.json` add focused validation coverage.

## Verified build and sources

Recommended dual-wield Fury build: **17 Arms / 34 Fury / 0 Protection**, 51 points.

Arms: Improved Heroic Strike 3, Improved Rend 3, Tactical Mastery 5, Anger Management 1, Deep Wounds 3, Impale 2.

Fury: Cruelty 5, Unbridled Wrath 5, Improved Battle Shout 5, Dual Wield Specialization 5, Improved Execute 2, Enrage 5, Death Wish 1, Flurry 5, Bloodthirst 1.

Metadata and build sources are pinned independently:

- [WoWSims Classic Warrior metadata](https://github.com/wowsims/classic/blob/ade8d105bb81fb3e4620077b6ddfa73f11c7a60c/ui/core/talents/trees/warrior.json): positions, maximum ranks, all rank spell IDs and prerequisites.
- [WoWSims Classic Warrior presets](https://github.com/wowsims/classic/blob/3cf450be2f9d82df39d93c5f5410f0cc61167754/ui/warrior/presets.ts): Phase 1 DPS allocation `30305001302-05050005525010051`.
- [Wowhead Classic Fury talents](https://www.wowhead.com/classic/guide/classes/warrior/fury/dps-talent-builds-pve): Classic dual-wield build context. Classic Wowhead spell tooltip data independently supplies names and icon identifiers for all 52 first-rank spells; tooltip HTML/CSS is not copied.

No TBC, Season of Discovery or later talent metadata is used.

## Desktop, mobile and tooltips

Three trees appear side by side when the component has sufficient space. At 390px, an explicitly labelled native selector displays one tree at a time, retaining 44px icons and avoiding horizontal overflow. Keyboard focus and taps expose local rank and prerequisite details. Hover links reuse the existing single Wowhead tooltip script and Classic spell URLs; local details remain usable when that external script is blocked.

Character Armory talents remain separate. Frost and Combat guides retain their existing textual talent sections.

## Validation

- `npm run validate:guides`: PASS, 14 published guides, Molten Core 10/10, zero errors.
- Focused guide unit tests: PASS, 11 tests.
- Focused browser coverage: PASS, 12 unique cases: nine existing guide cases passed in the combined run; all three new talent cases passed in the final rerun. The initial mobile selector accessible-name failure was fixed with an explicit label association before that rerun.
- Desktop and 390px mobile axe checks: zero serious/critical issues.
- Browser checks cover allocation, selected/unselected ranks, nine connectors, keyboard/tap details, one tooltip script, blocked-script fallback, mobile overflow and Armory/other-guide separation. Existing guide cases also cover routes, gear, SEO and version separation.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS using the established local production-test bootstrap, without hosted configuration changes.
- `git diff --check`: PASS.
- Recommendation hashes: **10/10 unchanged**, compared against the accepted P1D baseline using LF-normalized SHA-256; see `artifacts/acceptance/p1d4a/recommendation-hashes.json`.

Local run logs and desktop/mobile screenshots are under ignored `.vercel/p1d4a/`.

## Limitations and scope

This is a read-only guide build, not an interactive talent calculator or an import of a player's allocation. Remote icon images and full Wowhead hover descriptions depend on their external services; rank/prerequisite details remain local. No Frost/Combat conversion, new guides, database migrations, Battle.net/WCL changes, recommendation edits or deployment were performed.

**P1D-4A LOCAL ACCEPTANCE: YES**
