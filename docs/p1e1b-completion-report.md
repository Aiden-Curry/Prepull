# P1E-1B — Razorgore and Vaelastrasz

Accepted foundation: `84283e5197f22a51b55496b0307535d6a3b842e0`. Worktree was clean before this task.

## Files changed

- `content/guides/era/blackwing-lair-bosses.ts`: two authored boss articles using existing GuideContent sections and quick summaries.
- `lib/guides/registry.ts`, `lib/guides/content.ts`: publish and load those two encounter IDs, deriving identities and order from the unchanged accepted registry.
- `content/guides/era/blackwing-lair.ts`: correct the availability sentence now that two walkthroughs are published. Overview architecture and renderer are unchanged.
- `tests/bwl-guides.test.ts`, `tests/e2e/bwl-guides.e2e.spec.ts`: partial coverage, ID resolution, routes, navigation, SEO, TBC, mobile and accessibility.
- `tests/guides.test.ts`, `tests/e2e/guides.e2e.spec.ts`: update manifest count and explicitly scope existing Molten Core assertions to its raid.
- `artifacts/acceptance/p1e1b/`: browser results and recommendation hashes.

## Sources and coverage

Reviewed 2026-09-22. Original prose; standard Classic mechanics only. Seasonal additions in mixed source pages are excluded.

- [Wowhead Classic Razorgore](https://www.wowhead.com/classic/guide/razorgore-the-untamed-blackwing-lair-strategy)
- [Icy Veins Razorgore](https://www.icy-veins.com/wow-classic/razorgore-the-untamed-guide-strategy-abilities-loot-updated-for-the-season-of-mastery): standard control, positioning and role guidance; no seasonal egg.
- [Wowhead Classic Vaelastrasz](https://www.wowhead.com/classic/guide/vaelastrasz-the-corrupt-blackwing-lair-strategy)
- [Icy Veins Vaelastrasz](https://www.icy-veins.com/wow-classic/vaelastrasz-the-corrupt-guide-strategy-abilities-loot-updated-for-the-season-of-mastery): standard positioning and threat succession; no seasonal starting health/debuff changes.
- [ClassicDB Burning Adrenaline](https://classicdb.ch/?spell=18173) and [maximum-health effect](https://classicdb.ch/?spell=23619).

Razorgore covers orb rotation, egg priority, protecting both controller and boss, corner/add assignments, interrupts/control, phase transition, final-controller tank, taunt immunity, Conflagration and second-tank threat, Fireball Volley positioning, preparation, mistakes and Fury utility.

Vaelastrasz covers 30% starting health, Essence of the Red's three-minute resource window, mana-user/tank Burning Adrenaline targeting, damage/instant-cast benefits, maximum-health loss and death explosion, non-tank isolation, controlled tank succession, fire damage, threat management, preparation, mistakes and Fury Execute pressure. Burning Adrenaline is explicitly not a normal dispel/heal-through mechanic.

## Encounter mapping

| Zone | Encounter | Published route |
| --- | --- | --- |
| 2002 | 50610 | `/era/guides/raids/blackwing-lair/razorgore-the-untamed` |
| 2002 | 50611 | `/era/guides/raids/blackwing-lair/vaelastrasz-the-corrupt` |

The overview retains eight progression cards and links exactly these two. Six remaining details are 404/unlinked. Alternate 50631 remains excluded. Previous/next navigation connects only the published pair. Logs automatically uses the existing zone/encounter resolver; its browser test uses misleading display names to prove names do not select guides. The isolated local synthetic cache projection is restored in `finally`.

## Focused validation

- Guide validator: PASS, 19 published guides, MC 10/10, zero errors.
- Typecheck and lint: PASS. An initial test-only narrowing error was corrected.
- Build: PASS using the established isolated production-build environment.
- `git diff --check`: PASS.
- Unit tests: 13/13 across guide and BWL test files.
- Browser tests: 7/7, no failures/skips/flaky tests. Both routes 200; six others 404; exact two overview links; breadcrumbs and sibling navigation; SEO/canonical/sitemap; TBC separation; Logs ID mapping; 390px no overflow; zero serious/critical axe violations on each boss page and the overview.
- All ten recommendation hashes unchanged against the accepted P1D baseline; full SHA-256 values in `artifacts/acceptance/p1e1b/recommendation-hashes.json` (UTF-8/LF normalized).

Existing Node module-format/color warnings are non-blocking. No full historical suite was run. No deployment, commit, next bosses, migrations, provider changes, recommendation changes or ERA_RAIDS edits.

**P1E-1B LOCAL ACCEPTANCE: YES**
