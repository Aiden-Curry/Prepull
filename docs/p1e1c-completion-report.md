# P1E-1C — Broodlord Lashlayer and Firemaw

Base: accepted P1E-1B commit `8f67a520d368fcb58b481efa29f5c6126900f372`. Initial worktree clean.

## Files changed

- `content/guides/era/blackwing-lair-bosses.ts`: two articles added to the existing content map/template; previous articles unchanged.
- `lib/guides/registry.ts`: publish encounters 50612 and 50613 using accepted raid identities/order.
- `tests/bwl-guides.test.ts`: four published details, exact IDs and four remaining missing articles.
- `tests/e2e/bwl-guides.e2e.spec.ts`: four overview/Logs links, four 404s, navigation, SEO, TBC, mobile and axe.
- `tests/guides.test.ts`: expected published manifest count is now 21.
- `artifacts/acceptance/p1e1c/`: recommendation hashes and browser summary.

## Sources and coverage

Reviewed 2026-09-22; original prose using standard Classic mechanics only:

- [Wowhead Classic Broodlord](https://www.wowhead.com/classic/guide/broodlord-lashlayer-blackwing-lair-strategy)
- [Icy Veins Broodlord](https://www.icy-veins.com/wow-classic/broodlord-lashlayer-guide-strategy-abilities-loot)
- [Wowhead Classic Firemaw](https://www.wowhead.com/classic/guide/firemaw-blackwing-lair-strategy)
- [Icy Veins Firemaw](https://www.icy-veins.com/wow-classic/firemaw-guide-strategy-abilities-loot-updated-for-the-season-of-mastery), excluding seasonal lightning mechanics.
- [ClassicDB Flame Buffet](https://classicdb.ch/?spell=23341), supporting stacking fire vulnerability and no routine dispel.

Broodlord: coordinated Suppression Room transition, device reactivation, mana preservation, Mortal Strike's heavy hit and healing reduction, Knock Away threat loss, Blast Wave knockback, protected tank/melee positioning and active backup-tank threat. Includes roles, preparation, mistakes and Fury threat guidance. A wall prevents displacement, not threat reduction.

Firemaw: Flame Buffet stacking and full line-of-sight expiry, stable corner positioning, separate Wing Buffet receiver and stack-reset swaps, taunt-resist backup, healer coverage, Shadow Flame/cloak distinction, preparation, mistakes and Fury reset discipline. A suggested conservative stack threshold is explicitly not a universal safe limit. No seasonal mechanics or later expansion abilities.

## Link and progression state

Zone remains 2002 with eight progression encounters. Published, in registry order:

| ID | Guide path under `/era/guides/raids/blackwing-lair/` |
| --- | --- |
| 50610 | `razorgore-the-untamed` |
| 50611 | `vaelastrasz-the-corrupt` |
| 50612 | `broodlord-lashlayer` |
| 50613 | `firemaw` |

Exactly four overview links. Ebonroc, Flamegor, Chromaggus and Nefarian remain unlinked/404. Combined alternate 50631 stays excluded. Existing Logs resolver works without provider/component changes; the browser test substitutes misleading names for all IDs and verifies exactly four correct links. Its isolated local synthetic cache projection is restored in `finally`.

## Focused checks

- `npm run validate:guides`: PASS, 21 published, MC 10/10, zero errors.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS using the established isolated production-build environment.
- `git diff --check`: PASS.
- Unit tests: 13/13 across guides and BWL files.
- Browser tests: 9/9, zero skipped/flaky/unexpected tests. Both new routes 200, four remaining 404s, four overview links, alternate exclusion, Logs ID mapping, breadcrumbs/sibling navigation, SEO/canonical/sitemap, TBC separation, 390px without horizontal overflow, and zero serious/critical axe issues on all four published boss pages. Overview desktop/mobile checks also pass.
- All ten recommendation SHA-256 hashes unchanged against the accepted P1D baseline (UTF-8/LF normalized). Full hashes are recorded in `artifacts/acceptance/p1e1c/recommendation-hashes.json`.

Existing Node module-format/color warnings remain non-blocking. PowerShell reports a wrapper error for Playwright's color warning; the test log and JSON both confirm all nine tests passed. No full historical suite was run.

No deployment or commit. No additional bosses, ERA_RAIDS edits, migrations, provider changes or recommendation changes.

**P1E-1C LOCAL ACCEPTANCE: YES**
