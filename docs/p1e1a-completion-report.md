# P1E-1A local acceptance

Base: `477b659d75c1f382f73034fd6668e2fdcc6847f3`. Initial worktree was clean.

## Scope and files

- `content/guides/era/blackwing-lair.ts`: published Classic Era overview content and reviewed sources.
- `lib/guides/registry.ts`, `content.ts`, `types.ts`: register the overview, expose progression encounters from the accepted raid registry, and distinguish overview coverage from complete boss-article coverage.
- `components/guides/guide-page.tsx`: existing boss-card renderer uses registry order and links only published articles. Unpublished encounters have plain availability text.
- `lib/guides/validate.ts`: enforce BWL zone 2002, eight progression encounters and alternate exclusion; allow overview coverage while retaining Molten Core's complete coverage and boss identity validation.
- `tests/bwl-guides.test.ts`, `tests/e2e/bwl-guides.e2e.spec.ts`: focused foundation tests.
- `tests/guides.test.ts`, `tests/e2e/guides.e2e.spec.ts`: update published count and the previously unpublished BWL route expectation.
- `artifacts/acceptance/p1e1a/`: browser summary and ten recommendation hashes.

## Content and research

Nine sections: overview; entry/attunement; raid preparation; raid-wide habits/mechanics; role preparation; consumables/resistance; suppression/trash; common mistakes; boss quick-reference.

Reviewed 2026-09-22:

- [Wowhead Classic BWL overview](https://www.wowhead.com/classic/guide/blackwing-lair-raid-overview-classic-wow)
- [Wowhead Classic attunement](https://www.wowhead.com/classic/guide/blackwing-lair-attunement-blackhands-command-classic-wow)
- [Wowhead Classic suppression/Broodlord](https://www.wowhead.com/classic/guide/broodlord-lashlayer-blackwing-lair-strategy)
- [Icy Veins BWL entry and trash](https://www.icy-veins.com/wow-classic/blackwing-lair-raid-guides)
- [Icy Veins Chromaggus preparation](https://www.icy-veins.com/wow-classic/chromaggus-guide-strategy-abilities-loot)

Only standard Classic sections inform the overview. Seasonal material on the mixed Icy Veins pages was excluded, along with TBC/later mechanics. No individual boss walkthroughs were added.

## Progression mapping

All production identities, membership and ordering are read from the existing `ERA_RAIDS` zone 2002; no second encounter list was created.

| Order | Encounter ID | Encounter |
| --- | --- | --- |
| 1 | 50610 | Razorgore the Untamed |
| 2 | 50611 | Vaelastrasz the Corrupt |
| 3 | 50612 | Broodlord Lashlayer |
| 4 | 50613 | Firemaw |
| 5 | 50614 | Ebonroc |
| 6 | 50615 | Flamegor |
| 7 | 50616 | Chromaggus |
| 8 | 50617 | Nefarian |

Combined alternate 50631, Ebonroc / Flamegor, remains `progression: false` and is excluded from cards and the denominator. All eight boss detail URLs return 404 and have no overview links. The overview appears in discovery and sitemap; unpublished boss pages do not. Existing published MC cards retain their ten links.

## Validation

- `npm run validate:guides`: PASS, 17 published guides, Molten Core 10/10, zero errors.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS using the existing isolated production-build environment.
- `git diff --check`: PASS.
- Focused unit tests: 12/12 across `guides.test.ts` and `bwl-guides.test.ts`.
- Focused browser tests: 6/6, zero skipped or flaky. Includes BWL route/discovery, eight ordered IDs, alternate exclusion, all eight unpublished routes, SEO/index-follow/canonical, breadcrumbs/sections/sitemap, TBC 404/empty state, desktop and 390px overflow/axe, existing discovery and all ten MC boss routes.
- Axe: zero serious/critical issues at 1440px and 390px. No horizontal overflow at either width.
- All ten accepted recommendation SHA-256 hashes unchanged against the existing P1D baseline (UTF-8, LF normalized); recorded in `artifacts/acceptance/p1e1a/recommendation-hashes.json`.

An initial test-only TypeScript narrowing error was corrected before the final checks. Playwright reported all six passing; PowerShell returned a wrapper error for Node's existing NO_COLOR/FORCE_COLOR warning. Its JSON result confirms zero unexpected tests/errors. Existing Node module-format warnings remain non-blocking.

No deployment, source commit, migrations, provider changes, recommendation changes, class guides or boss articles. Hosted behavior was not tested in this local-only task.

**P1E-1A LOCAL ACCEPTANCE: YES**
