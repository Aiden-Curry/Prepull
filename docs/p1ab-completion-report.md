# P1A/B completion report

Date: 2026-09-16. Scope: local Realm Finder and Armory acceptance. Staging has not been deployed or accepted by this work. Existing P0C OAuth changes are preserved separately.

Implementation details and source links: [architecture and live audit](p1ab-armory-audit.md). Evidence: [acceptance artifacts](../artifacts/acceptance/p1ab/). The checks below include the final saved-character deep-link correction.

| # | Requested item | Result |
| --- | --- | --- |
| 1 | Files changed | Exact P1 list: [changed-files.txt](../artifacts/acceptance/p1ab/changed-files.txt). Five pre-existing OAuth files are excluded and named there. |
| 2 | Migration decision | Additive migration 019 adds an optional Armory snapshot and enchant/gem IDs to existing sync tables. Applied only to isolated local PostgreSQL. Migrations 001-018 unchanged. Apply 019 before any future P1 deployment. |
| 3 | Existing data audit | Existing identity/equipment/sync/cache architecture reused. Statistics, sourced structured talents, shirt/tabard and modifier IDs were missing; see the audit's before-state table. |
| 4 | Character-sheet architecture | Shared CharacterSheet for public, saved dashboard and authenticated character preview; narrow presentation projection and fixed slot layout. |
| 5 | Public vs saved trust | Public uses allowlisted transient/durable cache data, never a saved sync. Owned saved dashboard and character/gear deep links read the latest successful persisted snapshot. Unsaved authenticated preview retains existing provider behavior. |
| 6 | Equipment slots | Nineteen explicit slots, distinct rings/trinkets, weapons, ranged/relic, shirt/tabard. Missing slots remain visible; no guessed slot duplication. |
| 7 | Item metadata | Actual equipment values, supplemented only by existing API-verified metadata for the matching ecosystem. No recommendation/manual data used to invent Armory values. |
| 8 | Item icons | Trusted available icon URLs, otherwise official Wowhead iconization in reserved boxes. Explicit mock fixture icon. Text fallback survives blocked external assets. |
| 9 | Wowhead integration | One official afterInteractive script. Public configuration only; link refresh on script readiness and equipment/ecosystem changes. No link name rewriting. |
| 10 | Era/TBC mapping | Central mapping follows character realm ecosystem: Era=classic, Anniversary=tbc. Era under the TBC content tab remains Classic. Live data environments 4 and 5 verified. |
| 11 | Tooltip fallback | Meaningful ordinary item links, visible slot/name/quality/modifiers and keyboard focus details remain when script loading fails. Mobile retains normal link navigation. |
| 12 | Enchants/gems | Actual descriptions and positive permanent enchant/socket item IDs retained, persisted and used in tooltip parameters. No inferred modifiers. |
| 13 | Statistics API | Kankan / Firemaw / EU: statistics HTTP 200 independently of other endpoints. Observed health 8669, armor 6849, attack power 982. |
| 14 | Statistics model | Finite nonnegative authoritative values, including observed scalar/effective/value shapes. Zero preserved; display filters irrelevant ancillary fields. No item-derived stat calculations. |
| 15 | Statistics persistence | Optional statistics status/source/time/values stored inside the existing successful sync's Armory JSONB snapshot. Old snapshots render unavailable until refresh. |
| 16 | Talent API | Kankan specializations HTTP 200. Actual active group, talent_rank and spell_tooltip.spell parsed; sanitized shape fixture committed. |
| 17 | Era talent capability | Observed active Protection 16 / Fury 32 / Arms 3. Returned ranks/spells supported. Positional tree metadata was not returned. |
| 18 | TBC talent capability | Existing unsupported Anniversary live mapping retained. No speculative namespace or Era fallback. Live talents explicitly unavailable. |
| 19 | Talent availability/source | Explicit available, unavailable and temporary-error states; source and retrieval time for available data. Generic mock characters do not fabricate a build. |
| 20 | Talent visualization | Grouped active selections with tree totals and returned ranks. No invented node coordinates, maximum ranks or guide build. |
| 21 | Talent tooltips | Actual spell IDs link to matching Wowhead ecosystem. Live Classic spell tooltip verified; readable spell/rank links remain without script. |
| 22 | Sync semantics | Saved success still requires summary and equipment. Optional endpoint failures preserve useful core success. Existing atomic transaction persists snapshot/items; failed refresh preserves previous success. |
| 23 | Public cache | Existing cache gains explicit safe Armory projection. Keys, TTLs, rate limiter, canonical paths and noindex preserved. Fresh hits avoid provider; older identity-only entries degrade safely. |
| 24 | Request budget | Four parallel profile requests per uncached rich lookup, at most one realm-index and one token setup request. No per-item or per-talent calls. Saved views make zero provider calls. |
| 25 | Realm source | Actual Blizzard Era EU/US index captures: 58 EU and 66 US realms, with safe fields only; live index preferred. |
| 26 | Realm caching | Server 24-hour cache and in-flight deduplication; endpoint one-hour TTL plus 24-hour stale window; fallback retry cooldown five minutes. Typing filters locally. |
| 27 | TBC catalog | Separate official-announcement registry: EU Spineshatter/Thunderstrike, US Nightslayer/Dreamscythe/Maladath. No borrowed Era IDs; catalog availability does not imply profile API support. |
| 28 | Combobox UX | Shared public/authenticated searchable control, prefix-first results, pointer/keyboard selection, invalid text prevented from submitting. |
| 29 | Combobox accessibility | Labelled combobox/listbox, active descendant, arrow keys, Enter, Escape, scrolling and result status. Representative axe checks pass. |
| 30 | Region switching | Region/ecosystem changes clear and revalidate selection; catalogs stay separated. Browser-tested. |
| 31 | Canonical URLs | Existing normalization and route formats preserved; selected canonical realm slug submitted. |
| 32 | Desktop sheet | Left/right equipment columns, stable slot spacing, center identity and weapon rows; [live desktop capture](../artifacts/acceptance/p1ab/kankan-desktop.png). |
| 33 | Mobile sheet | Stacked equipment layout, useful links and no horizontal overflow at 390px; [live mobile capture](../artifacts/acceptance/p1ab/kankan-mobile.png). |
| 34 | Public browser flow | Finder to canonical safe public sheet, account CTA, noindex, equipment/stats/talents and independent unavailable states tested. |
| 35 | Saved browser flow | Persisted dashboard and deep links tested. Provider-failing identity still renders previous persisted gear; gear deep link returns 200. |
| 36 | Refresh | Explicit refresh updates snapshot and tooltip links; failed provider refresh retains last successful sheet. No page-view refresh. |
| 37 | Unsupported specs | Armory renders independently of recommendation coverage; existing advice availability remains separate. |
| 38 | Unit tests | 225 passed, zero failed or skipped, including normalization, projection, provider failures/budget and realm catalog coverage. |
| 39 | PostgreSQL | 51 integration tests passed, zero skipped. Includes optional snapshot/modifier persistence, old-row behavior, failed refresh preservation and transaction rollback. Isolated local database only. |
| 40 | Realm browser tests | Keyboard filtering, selection clearing, ecosystem separation, accessibility and no character-quota request per keystroke passed. |
| 41 | Armory browser tests | Four tests passed, including public blocked-script/mobile/privacy, saved refresh/deep links and observed talent fixture. |
| 42 | Wowhead tests/smoke | Real Classic item and spell tooltips, TBC tooltip routing, 19 icons, one script, zero uncaught errors and no mobile overflow passed. [Result](../artifacts/acceptance/p1ab/live-tooltip-smoke.json). |
| 43 | Accessibility | Zero serious/critical axe violations on representative finder/public/saved pages. Quality also textual, links focusable, talent ranks readable. No WCAG certification claimed. |
| 44 | Security/privacy | Nested public allowlist excludes raw payload/private IDs; no secret configuration in tooltips. React escapes names; external links protected; existing authenticated cache/security policy retained. |
| 45 | P0B regression | Eight public-character browser tests passed, plus public-beta onboarding three. Public cache/privacy/canonical/abuse boundaries retained. |
| 46 | P0C regression | Four Battle.net auth browser tests and deterministic OAuth/import tests passed. This does not claim a new real OAuth staging acceptance. |
| 47 | Player regression | Onboarding 5, refresh 2, advice 3, session planner 4, prep runs 3 and readiness 7 browser tests passed. |
| 48 | Guild/calendar smoke | Guild schedule 3, guilds 2, game calendar 3, unified calendar 3 and version navigation 4 passed. Total across all bounded groups: 58 unique passing browser tests, zero skips. |
| 49 | Calendar validator | 26 occurrences, zero structural errors. Calendar data unchanged. Gear/curated/spec validators also pass; existing nonblocking dataset warnings remain. |
| 50 | TypeScript | npm run typecheck passed after final route correction. |
| 51 | ESLint | npm run lint passed after final route correction. |
| 52 | Build | Final production build passed after the saved-route correction. |
| 53 | Recommendation hashes | All ten accepted snapshots unchanged against HEAD using LF-normalized SHA-256. [All ten hashes](../artifacts/acceptance/p1ab/recommendation-hashes.json). No recommendation-data edits. |
| 54 | Limitations | Anniversary live profile support remains unavailable; Classic talents use grouped lists because positions are absent; item levels/icons depend on actual available metadata or third-party assets. Staging deployment and staging-host smoke are deferred. Migration 019 required for future deployment. |
| 55 | Local acceptance | **P1A/B LOCAL ACCEPTANCE: YES.** All 22 local gates passed; final build and diff checks passed. No Warcraft Logs/P1C or Guides/P1D started. |

Live API audit: **SUMMARY PASS; EQUIPMENT PASS; STATISTICS PASS; TALENTS PASS** for user-selected Kankan / Firemaw / EU. These were local server-side API requests, not a staging-host OAuth acceptance test.
