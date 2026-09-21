# P1D-4B — Frost Mage visual talent builds

Base: `dfe71cb21ab8127dba17cc315a2f63ed7fca6210` (P1D-4A); clean at start.

## Files and architecture

- `lib/talents/mage.ts`: all 49 Classic Era Mage talents across Arcane, Fire and Frost, using the existing typed metadata structure. Stable IDs, all rank spell IDs, icons, one-based positions, maximum ranks and verified prerequisites are separate from selections.
- `lib/talents/mage-builds.ts` and `lib/talents/registry.ts`: two sourced Mage selections registered alongside the unchanged Fury build.
- `components/guides/guide-talent-builds.tsx`: a labelled native build selector wrapping the existing `ClassicTalentTree`. It resets tree/detail state when changing builds. It does not implement another tree renderer.
- `components/guides/guide-page.tsx`, `lib/guides/types.ts`, `lib/guides/validate.ts`: optional alternative build IDs in the existing talent-build block, with every alternative passing the same identity and talent validator.
- `content/guides/era/frost.ts`: visual builds, source metadata and variant explanation; existing textual guidance retained.
- `tests/guide-talents.test.ts`, `tests/e2e/guide-talents.e2e.spec.ts`, `tests/e2e/mage-talents.e2e.spec.ts`: focused Mage coverage and updated Fury/Armory/Combat separation expectations.
- `artifacts/acceptance/p1d4b/recommendation-hashes.json`: ten unchanged recommendation hashes.

## Sources and allocations

Metadata: [pinned WoWSims Classic Mage data](https://github.com/wowsims/classic/blob/c925c1184dcd0c5eaff2d128af899be639235b63/ui/core/talents/trees/mage.json). Names/icons were verified through Classic Wowhead first-rank spell metadata. All 49 positions, maximum ranks and complete spell-ID sequences were independently cross-checked against the [Icy Veins Classic Mage calculator data](https://static.icy-veins.com/json/classic-talent-calculator/mage.json).

Both exact allocations come from the existing reviewed [Icy Veins Classic Mage talent guide](https://www.icy-veins.com/wow-classic/mage-dps-pve-spec-builds-talents), retrieved 2026-09-21. Its calculator URLs encode one character per allocated point; selections were mapped to the source calculator talent IDs and then matched to metadata by first-rank spell ID.

| Build | Arcane / Fire / Frost | Role and representative choices |
| --- | --- | --- |
| Arcane Power Frost | 31 / 0 / 20 | Arcane Power, Presence of Mind and Arcane Instability; four Magic Absorption points and one Arctic Reach point. |
| Winter's Chill support Frost | 16 / 0 / 35 | Five Winter's Chill points, Ice Block, Ice Barrier, Permafrost and Improved Blizzard; one Arcane Meditation point. |

Each contains 51 points and passes tier/prerequisite checks. The support allocation differs from the common 19/0/32 variant previously mentioned in prose: this sourced example spends more points on Frost control, with less Arcane mana support. The prose now clearly distinguishes them.

Source calculator encodings, for reproduction:

- Arcane Power: `001115555544447778bbbcdddddeeefxxxxxyyyzzzzzDDDGHHH`
- Winter's Chill: `xxxxxyyyzzzzzCCCDDDEFFFGGHHHJLLLLLM001114555558777b`

No TBC, Season of Discovery or later Mage talents are included.

## Focused verification

- Guide validator: PASS, 14 published guides, Molten Core 10/10, no errors.
- Focused unit tests: 12 passed, including both Mage allocations, complete metadata, dependency rejection and Fury validation.
- Focused Chromium tests: 5 passed, zero failed/skipped/flaky. Includes both builds and switching back, desktop three-tree layout, 390px tree selection, readable icons, no overflow, keyboard/tap details, one Wowhead script, Armory separation, unchanged Combat prose and Fury regression checks.
- Axe: zero serious/critical violations in desktop/mobile cases.
- Typecheck, lint, production build and `git diff --check`: PASS.
- All ten LF-normalized SHA-256 recommendation hashes match the accepted P1D baseline.

Local logs and source retrieval evidence are in ignored `.vercel/p1d4b/`. Browser JSON confirmed five expected cases and zero unexpected outcomes; PowerShell reported a nonzero wrapper status due to native warning output, despite the successful Playwright run.

## Scope and limitations

Read-only guide builds, explicitly separate from a player's current talents. Full external Wowhead hover descriptions and remote icons depend on those services; local details remain available. ClassicTalentTree, its CSS and Warrior metadata/build selections are unchanged. No Rogue conversion, additional guide, migration, provider/configuration change, recommendation edit, commit or deployment.

**P1D-4B LOCAL ACCEPTANCE: YES**
