# P1D Guides vertical slice — local acceptance

**P1D VERTICAL SLICE LOCAL ACCEPTANCE: YES.** Completed 2026-09-21 against accepted base `bd9f17d76959dc2ad9ed5c39d92e370e2aa6eb20`. Changes are uncommitted. No migration, deployment, tag movement, additional spec or additional raid content.

## Completion record

| # | Requirement | Result |
|---|---|---|
| 1 | Files changed | New guide modules in `lib/guides`, authored content in `content/guides`, shared UI in `components/guides`, optional catch-all Guides route, sitemap, validator, unit/browser tests, authoring documentation and acceptance artifacts. Narrow edits to Header, character sheet, Logs, dashboard, CSS, package scripts and `.env.example`. Two existing browser assertions extended/scoped. |
| 2 | Migration | None required; no database schema changes. |
| 3 | Storage | Local typed TypeScript content, separate from rendering and game identities. |
| 4 | Domain | Guide discriminated union for spec/raid/boss; typed status, review/source metadata, sections, structured blocks and boss quick summary. |
| 5 | Registry | One manifest supplies discovery, routes, sitemap and cross-links. Twelve published articles. |
| 6 | Publishing | Published-only resolver and static parameters; draft/unavailable/unknown routes do not become public. Negative unit and direct-route browser checks pass. |
| 7 | Review metadata | Every article shows Classic Era, last reviewed 2026-09-21, and source title/publisher/URL/access date. |
| 8 | Research | Wowhead Classic overview, talents, stats, rotation, consumables and encounter guides; Icy Veins Classic raid/encounter and Warrior guides; indexed Warcraft Tavern raid material. Exact URLs are in article source records. Mixed seasonal mechanics were excluded. See authoring notes for access limitations and rejected source. |
| 9 | Version separation | URL version is authoritative. TBC has an empty state; Era detail routes under TBC return 404. |
| 10 | Fury sections | Overview/limits, talents, contextual stats and weapon skill, priority, cooldowns, consumables, world buffs, professions, shared gear, raid preparation, boss notes and mistakes. |
| 11 | Talents | Common 17/34/0 grouped build outline, core talent goals, verified one-point Bloodthirst/Death Wish links, and source for full allocation. No invented node positions or imported-character talent claims. |
| 12 | Stats | Special-attack miss thresholds distinguish 300/305 weapon skill and dual-wield white attacks; position, loadout and buffs provide context. Advice scoring unchanged. |
| 13 | Priority | Single-target, Execute, multiple targets and cooldown windows; rage conservation and threat/interrupt obligations. |
| 14 | Consumables/buffs | Core/useful/situational categories with verified item IDs; factual world-buff education without readiness requirements. |
| 15 | Professions/macros | Engineering, budget-supporting professions and First Aid discussed. Macros omitted; no macro library is necessary for this slice. |
| 16 | Shared gear | Reads the accepted Fury recommendation profile and candidate/shared item metadata. Reuses phase availability and source rules. Pre-Raid and Phase 1 resolve without scoring or mutation. |
| 17 | Snapshot integrity | All ten accepted recommendation SHA-256 snapshots unchanged. |
| 18 | MC overview | Entry/attunement, rune dousing, role assignments, resistance/consumables, dispels/interrupts, trash, mistakes and boss cards. |
| 19 | Encounter identity | Existing `ERA_RAIDS` zone 2000 supplies IDs, names, ordering and progression. Registry untouched. |
| 20 | Coverage | 10/10 progression boss guides published and validated. |
| 21 | Ordering | Accepted order retained, including Shazzrah before Baron Geddon; guide distinguishes navigation order from chosen pull order. |
| 22 | Boss template | Shared mechanics, positioning, tank/healer/DPS, dispels, preparation, mistakes, Fury note and related navigation. |
| 23 | Quick summaries | Every boss has Before pull / During fight / Watch for. |
| 24 | Roles | Encounter-specific target control, movement, damage response and interrupts. No mandatory fixed raid composition. |
| 25 | Fury boss notes | All ten pages include a concise melee/Fury implication. |
| 26 | Logs links | Exact zone ID plus encounter ID; browser proof uses a deliberately different display name and verifies a same-name synthetic ID does not link. No ranking/cache semantics changed. |
| 27 | Character link | Supported Era Fury links from public and persisted saved Armory. Protection Warrior browser fixture and unsupported-spec units prove class alone is insufficient. |
| 28 | Advice link | Supported saved Fury dashboard Advice surface links to the guide. Recommendation results unchanged. |
| 29 | Personalization | Public guides use no private player/session data. Optional personalized return CTA intentionally omitted. |
| 30 | Guides home | Published Fury, MC and boss discovery with a small client-side filter. No existing global guide search was found. |
| 31 | Class index | Published class/spec discovery and Warrior index; no active unbuilt specs. |
| 32 | Raid index | MC only; no empty future raid links. |
| 33 | TBC | Truthful coming-later state, no Era article fallback. Version switching from a guide leads to target-version guide home. |
| 34 | Breadcrumbs | Labelled semantic breadcrumb navigation with current-page indication. |
| 35 | TOC/anchors | Stable section IDs, sticky desktop TOC, native collapsible mobile TOC and keyboard deep links. |
| 36 | Wowhead | Existing ecosystem helper and single tooltip component/script reused. Verified item/spell links retain readable text with external script blocked. Quality shown; trusted icons used when available. |
| 37 | SEO | Guide title, description, canonical, Open Graph and index/follow verified. Character noindex/nofollow remains intact. |
| 38 | Canonicals | New `PREPULL_SITE_URL` origin abstraction, then existing `NEXTAUTH_URL`, then local development fallback. No staging domain hardcoded or preview hostname inferred. Production build test explicitly used reserved `guides.example.test`; configure the real public origin before deployment. |
| 39 | Structured data | Optional schema.org deferred; no invented author/reviewer claims. |
| 40 | Static rendering | All 12 articles prerendered; all 19 public article/index routes return 200. Production smoke with outbound sockets blocked recorded zero attempted connections. No guide session/provider/guild queries. |
| 41 | Mobile | 390px home, Fury, MC, Ragnaros and TBC checks pass without horizontal overflow; visual screenshots inspected. |
| 42 | Keyboard | Header menu, breadcrumbs, TOC, anchors, item links, boss cards and next navigation exercised. Visible focus checked. |
| 43 | Axe | Representative desktop and mobile guide pages: zero serious/critical violations. No certification claim. |
| 44 | Guide validator | `npm run validate:guides` passes offline; duplicate IDs/slugs, statuses/versions, dates, anchors, links, references and publishing leakage covered. |
| 45 | Sources validator | Published content requires valid reviewed source records and HTTPS URLs without credentials. |
| 46 | MC validator | Checks every authoritative progression ID exactly once, correct raid and complete boss template. 10/10. |
| 47 | Units | `npm test`: 280 passed, zero failed/skipped, including six new guide tests and negative-data cases. |
| 48 | Browser | 86 unique cases passed, zero relevant skips. Nine new Guides cases, 24 Armory/Logs/public cases, 24 player/OAuth cases, 29 guild/calendar/navigation cases. |
| 49 | P1C | WCL units, PostgreSQL cache integration and browser regressions pass. Real-provider audits not repeated; transport, cache, averages, kills and ecosystem registry unchanged. |
| 50 | P1A/B | Public/saved Armory, realm picker, equipment, stats, talents and Wowhead regressions pass. |
| 51 | P0B/P0C | Public crawl policy, lookup protection and local mock OAuth/session/import/callback regressions pass. This is not new interactive real-account OAuth acceptance. |
| 52 | Player | Onboarding, refresh, Advice, Session Planner and unsupported-spec browser regressions pass. |
| 53 | Guild/calendar | Readiness/consent, Prep Board, Prep Runs, schedules, unified/game calendar, guild access and version navigation pass. |
| 54 | Calendar | 26 explicit occurrences; zero structural errors; calendar data unchanged. |
| 55 | TypeScript | `npm run typecheck` and build type validation pass. |
| 56 | ESLint | `npm run lint` passes, including final checks. |
| 57 | Build | `npm run build` passes with isolated placeholder credentials and an unreachable local DB. Generated pages then pass production-mode smoke. `git diff --check` passes. |
| 58 | Hashes/other validators | Ten hashes unchanged; validate:gear, validate:curated and validate:spec -- all pass. Existing dataset warnings remain; no accepted data was edited to suppress them. |
| 59 | Limitations | One spec/raid only; no TBC article content, CMS, personalized guide CTA, full talent calculator, macros or schema.org. No live provider re-audit or deployment. Canonical production origin must be configured before publishing. |
| 60 | Acceptance | **P1D VERTICAL SLICE LOCAL ACCEPTANCE: YES.** All required local gates pass. |

## Failures and resolutions

- Initial guide validation found an item absent from the candidate list. The resolver was completed using the same shared metadata fallback used by the accepted recommendation engine; phase availability and phase-specific sources also reuse existing helpers. Final validation and browser checks pass.
- One guild test matched the now-collapsed global Characters navigation item rather than roster content. Its assertion now scopes to `main`; the intended roster check passes. Other 28 guild cases passed initially, and both guild workspace cases passed on rerun. No guild behavior changed.
- Automatic approval review temporarily rejected the final localhost smoke because its review service hit a usage limit. After the user instructed continuation, the same read-only smoke was approved and passed. No approval blocker remains.
- Optional features above are deliberate scope choices, not skipped required tests. No required local test remains skipped or failing.

## Evidence

- [Browser summary: 86 unique passing cases](../artifacts/acceptance/p1d/browser-summary.json)
- [Production static-route and outbound-call smoke](../artifacts/acceptance/p1d/production-static-smoke.json)
- [Ten unchanged recommendation hashes](../artifacts/acceptance/p1d/recommendation-hashes.json)
- [Authoring, research and canonical-origin documentation](guides-authoring.md)

Detailed local command logs, browser JSON, screenshots and isolated harness files remain under ignored `.vercel/p1d/`. PostgreSQL integration: 56 passed, zero failed/skipped. Test activity used the isolated localhost test database; staging was not touched.
