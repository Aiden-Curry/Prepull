# P1E-1D — Ebonroc and Flamegor

Base: accepted P1E-1C commit `6b976752d61d509c7292c47d438db9cf0b63e0e0`. Initial worktree clean.

## Files changed

- `content/guides/era/blackwing-lair-bosses.ts`: Ebonroc and Flamegor articles in the existing content map, with quick summaries and the accepted sections. Earlier articles unchanged.
- `lib/guides/registry.ts`: publish 50614 and 50615, deriving identities/order from the unchanged raid registry.
- `tests/bwl-guides.test.ts`: six published bosses, exact ID resolution, two remaining articles absent, alternate excluded.
- `tests/e2e/bwl-guides.e2e.spec.ts`: six overview/Logs links, unpublished routes, navigation, SEO, TBC, mobile and axe.
- `tests/guides.test.ts`: published manifest expectation now 23.
- `artifacts/acceptance/p1e1d/`: browser summary and recommendation hashes.

## Sources

Reviewed 2026-09-22. Standard Classic sections only; seasonal combined-encounter mechanics excluded. Prose is original.

- [Wowhead Classic Ebonroc](https://www.wowhead.com/classic/guide/ebonroc-blackwing-lair-strategy)
- [Icy Veins Ebonroc](https://www.icy-veins.com/wow-classic/ebonroc-guide-strategy-abilities-loot), used for tank rotation/positioning. Its conflicting claim tying cloak protection to Shadow of Ebonroc was not adopted; the article distinguishes Shadow Flame from Shadow of Ebonroc.
- [Wowhead Classic Flamegor](https://www.wowhead.com/classic/guide/flamegor-blackwing-lair-strategy)
- [Icy Veins Flamegor](https://www.icy-veins.com/wow-classic/flamegor-guide-strategy-abilities-loot), standard separate encounter.

## Coverage

Ebonroc includes Shadow of Ebonroc, rapid unaffected-tank taunts, taunt failure backups, prevention of boss healing, healer target changes, Wing Buffet threat loss, stable facing and Shadow Flame/cloak preparation. Tank healing itself is explicitly not the boss-heal trigger. Preparation, mistakes and Fury guidance are included.

Flamegor includes Frenzy/Fire Nova, learned Tranquilizing Shot, Hunter rotation and miss backup, tank handoffs, Wing Buffet threat, protected tank positioning, Shadow Flame and cloak coverage. It explicitly distinguishes this fight from Firemaw's Flame Buffet reset cycle. Roles, preparation, mistakes and Fury guidance are included.

## Publication and progression

Zone 2002 retains eight progression encounters. Exactly six overview links: 50610 Razorgore, 50611 Vaelastrasz, 50612 Broodlord, 50613 Firemaw, 50614 Ebonroc and 50615 Flamegor.

New routes:

- `/era/guides/raids/blackwing-lair/ebonroc`
- `/era/guides/raids/blackwing-lair/flamegor`

Chromaggus and Nefarian remain unlinked/404. Combined 50631 remains `progression: false`, unpublished and unlinked; `/era/guides/raids/blackwing-lair/ebonroc-flamegor` returns 404. It never contributes to the progression denominator.

Logs uses the existing exact zone/encounter resolver. The local browser fixture includes all nine observed IDs with deliberately misleading names and must produce exactly six boss links. The synthetic local cache projection is restored in `finally`. No provider code or real provider data is changed.

## Focused validation

- Guide validator: PASS, 23 published guides, Molten Core 10/10, zero errors.
- Typecheck: PASS.
- Lint: PASS.
- Build: PASS using the established isolated production-build environment.
- `git diff --check`: PASS.
- Unit tests: 13/13 across guides and BWL tests.
- Browser tests: 11/11, zero unexpected/skipped/flaky tests. Includes both new routes 200, exactly six overview and Logs links, Chromaggus/Nefarian and combined-route 404s, alternate exclusion, navigation/breadcrumbs, SEO, TBC separation and all six published pages at 390px without overflow or serious/critical axe issues. Overview desktop/mobile checks also pass. Existing Node module/color warnings remain non-blocking; Playwright log and JSON confirm success despite PowerShell treating the color warning as a wrapper error.
- All ten accepted recommendation SHA-256 hashes unchanged against the P1D baseline (UTF-8/LF normalized); see `artifacts/acceptance/p1e1d/recommendation-hashes.json`.

No deployment, commit, next bosses, migrations, ERA_RAIDS edits, Battle.net/WCL changes or recommendation changes. No full historical suite run.

**P1E-1D LOCAL ACCEPTANCE: YES**
