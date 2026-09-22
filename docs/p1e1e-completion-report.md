# P1E-1E — Chromaggus and Nefarian

Base: accepted P1E-1D commit `042ed5d17eec2348d8a051e34c9c656a0013fbd2`. Initial worktree clean.

## Files changed

- `content/guides/era/blackwing-lair-bosses.ts`: two articles added using the existing sections, quick-summary and sources model; earlier boss articles unchanged.
- `content/guides/era/blackwing-lair.ts`: availability prose now reflects eight published walkthroughs.
- `lib/guides/registry.ts`: publish all accepted progression encounters; BWL coverage set to complete.
- `lib/guides/validate.ts`: BWL requires one published article per progression encounter, even if incorrectly downgraded to overview coverage.
- `scripts/validate-guides.ts`: report BWL 8/8 alongside MC 10/10.
- `tests/bwl-guides.test.ts`, `tests/e2e/bwl-guides.e2e.spec.ts`, `tests/guides.test.ts`: completeness, IDs, eight routes/links, exclusion, navigation, SEO, TBC, mobile and accessibility checks.
- `artifacts/acceptance/p1e1e/`: browser summary and recommendation hashes.

## Sources

Reviewed 2026-09-22, standard Classic only; original prose:

- [Wowhead Classic Chromaggus](https://www.wowhead.com/classic/guide/chromaggus-blackwing-lair-strategy)
- [Icy Veins Chromaggus](https://www.icy-veins.com/wow-classic/chromaggus-guide-strategy-abilities-loot): standard breath/cleanse preparation; seasonal affliction effects excluded.
- [ClassicDB Brood Affliction: Blue](https://classicdb.ch/?spell=23153)
- [Wowhead Classic Nefarian](https://www.wowhead.com/classic/guide/nefarian-blackwing-lair-strategy)
- [Icy Veins Nefarian](https://www.icy-veins.com/wow-classic/nefarian-guide-strategy-abilities-loot-updated-for-the-season-of-mastery): standard phases and original class calls only; empowered seasonal calls excluded.

## Coverage

Chromaggus covers lockout-specific breath pairs, all five breath identities, safe line-of-sight positioning and the Time Lapse exception, all five Brood Afflictions with cleanse assignments, Hourglass Sand priorities, Frenzy/Tranquilizing Shot, changing spell vulnerability, final enrage, consumables/resistance, roles, mistakes and Fury guidance.

Nefarian covers both Drakonid doors, resistance-aware add assignments, landing Shadow Flame and raid-wide cloaks, all nine original Classic class calls, boss facing, fear/threat, Veil of Shadow, the 20% Bone Construct transition, preparation, roles, mistakes and Fury guidance. No later-class or seasonal calls.

## Final BWL state

Zone 2002 now has **8/8 published progression guides**, mapped in accepted registry order to IDs 50610–50617. New routes:

- `/era/guides/raids/blackwing-lair/chromaggus` — 50616
- `/era/guides/raids/blackwing-lair/nefarian` — 50617

Combined 50631 stays `progression: false`, unpublished and unlinked. Its candidate detail route remains 404 and it is absent from sitemap/cards. No ERA_RAIDS edits.

Logs continues using exact zone/encounter IDs. Its isolated local fixture includes all nine observed IDs with misleading display names; exactly eight progression links are expected. The synthetic cache projection is restored in `finally`.

## Focused validation

- Guide validator: PASS, 25 published guides, BWL 8/8, MC 10/10, zero errors.
- Typecheck and lint: PASS.
- Build: PASS using the established isolated production-build environment.
- `git diff --check`: PASS.
- Unit tests: 13/13; removes each BWL article in turn and verifies completeness fails, including with an accidental overview flag.
- Browser tests: 13/13, zero skipped/flaky/unexpected tests. All eight progression routes return 200; overview and Logs have exactly eight progression links; alternate route remains 404. Breadcrumbs, sibling navigation, SEO/canonical/sitemap, TBC separation and all eight boss pages at 390px pass with no horizontal overflow or serious/critical axe issues. Overview desktop/mobile checks pass. Existing Node module/color warnings are non-blocking; browser log and JSON confirm success despite PowerShell treating the color warning as a wrapper error.
- All ten recommendation SHA-256 hashes unchanged against the accepted P1D baseline (UTF-8/LF normalized), recorded in `artifacts/acceptance/p1e1e/recommendation-hashes.json`.

No deployment, commit, additional raid, migrations, provider changes or recommendation changes. No full historical suite run.

**P1E-1E LOCAL ACCEPTANCE: YES**
