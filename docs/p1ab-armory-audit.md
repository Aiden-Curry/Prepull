# P1A/B realm finder and Armory audit

Audit date: 2026-09-16. Scope: local P1A/B only. P0C OAuth changes already present in the workspace were preserved. No staging deployment, Warcraft Logs, guides, recommendation-data changes, calendar-data changes, or migration 018 changes were made for P1A/B.

## Existing data, before migration 019

| Area | Existing state |
| --- | --- |
| Public route | `/{version}/characters/{realmType}/{region}/{realm}/{name}`; durable PostgreSQL cache, lookup limiter, canonical normalization, noindex/nofollow. Cached identity only. |
| Saved dashboard | `loadPrimaryAdvice` selects latest successful `character_syncs` plus `character_sync_items`; viewing does not call the provider. Explicit refresh records success/failure. |
| Older character route | Authenticated `/{version}/character/...` provider preview and slot advice deep links. After this change, owned saved characters resolve to their latest successful snapshot on these deep links too; unsaved characters retain the existing authenticated provider preview. |
| Normalized character | Identity, class/spec, equipment, professions, optional flat talent names/ranks, provider metadata. No character statistics or structured talent source/availability. |
| Persisted equipment | Explicit 17 recommendation slots, item ID/name/quality/level, icon string, stats JSON, enchant descriptions JSON, optional weapon/set/effect/source fields. |
| Missing equipment detail | Shirt/tabard were discarded; enchant IDs and socket gem IDs were discarded; icons were usually two-letter placeholders. |
| Statistics | Not requested or persisted. |
| Talents | Specializations request was mandatory; old parsing expected `talent.name` and `rank`, whereas the observed Classic response uses `spell_tooltip.spell` and `talent_rank`. Existing recommendation specialization selection is unchanged. |
| Upstream budget | Summary + equipment + specializations, plus realm/token setup and sequential per-equipped-item metadata requests. |
| Realm source | Blizzard realm index cached in memory for 24 hours for validation, with free-text finder inputs. Anniversary live namespace deliberately disabled. |
| UI/security | No installed combobox package; existing fields, panels, focus styles, Next Script available. Existing security headers do not set CSP. Global image trust policy remains unchanged. |

## Architecture and persistence

`CharacterArmory` is a deliberately narrow presentation model. Shared header, fixed equipment slots, statistics, talents, and freshness components render public, saved, and legacy-preview pages. React never receives a raw provider response.

Migration `019_character_armory_snapshot.sql` adds nullable `character_syncs.armory` JSONB and enchant/gem ID arrays on the existing item rows. The old schema had only specialized JSON fields (professions, flat talents, item stats); none was an appropriate generic snapshot field. No parallel equipment/sync system was introduced. The existing runner records the migration transactionally. Old rows remain valid: equipment renders; new sections are unavailable until refresh.

Core saved-sync success still requires identity plus an equipment response. Equipment failure aborts before recording success. Snapshot header, optional sections, item rows, and saved identity update use the existing transaction. Optional statistics/talent failures persist explicit unavailable/temporary-error states without destroying equipment. A failed attempt never replaces the latest successful sheet. The dashboard uses only the saved snapshot and existing explicit refresh action.

Public lookups call the same provider's public variant, allowing equipment failure independently of summary. All available sections enter the **existing** safe cache projection; no anonymous user linkage, sync rows, history, or progress state is created. Cache keys/TTLs, canonical paths, limiter, auth callbacks, and noindex/nofollow are preserved. A fresh durable hit calls no provider. Older identity-only cached rows render a neutral section-unavailable message until their normal expiry.

Nineteen explicit presentation slots include separate ring/trinket identities, weapons, ranged/relic, shirt, and tabard. Generic `FINGER` is not duplicated or guessed. Empty slots stay visible. Recommendation slot datasets are unchanged.

## Live Classic audit

Kankan / Firemaw / EU, namespace `profile-classic1x-eu`, authenticated using server-side client credentials:

| Endpoint | Result |
| --- | --- |
| Summary | PASS, HTTP 200 |
| Equipment | PASS, HTTP 200; 19 equipped slots including shirt/tabard; enchant IDs present |
| Statistics | PASS, HTTP 200; health 8669, effective armor 6849, attack power 982, attributes, crit, avoidance, and effective defense |
| Specializations/talents | PASS, HTTP 200; explicit active group: Protection 16, Fury 32, Arms 3 |

The initial Aidy / Firemaw / EU attempt returned 404 independently for all four endpoints; that did not establish endpoint unavailability. Kankan was supplied by the user for the subsequent successful audit.

Statistics normalize finite, nonnegative values from documented/observed scalar and effective/value shapes. Zero is retained in normalization; the presentation hides irrelevant or zero ancillary stats. No stats are calculated from item tooltip values. Missing hit/healing fields are not invented.

Classic talents use the **active** group, actual `talent_rank`, spell name, and spell ID. Tree totals sum returned selections. No positions, maximum ranks, missing trees, or guide builds are inferred. The live response lacks position metadata, so presentation uses grouped selections, not a fabricated tree. A sanitized endpoint-shape fixture drives normalization and browser tests. Generic mock characters explicitly show unavailable talents; the synthetic statistics fixture is labelled as a preview.

Anniversary/TBC retains the accepted unsupported live-provider mapping. No speculative namespace or Era fallback was added. Equipment/statistics/talents are unavailable through that live mapping. TBC mock equipment is explicitly preview data, not a claim of live API support.

## Item metadata, icons, and Wowhead

Item names/quality/modifiers come from equipment. Unknown quality is neutral and readable; known quality is also named in text. Item level uses the provider value where present, then the existing API-verified item metadata cache for the same ecosystem. Recommendation/manual metadata is not used to fill Armory stats or quality. Existing safe icon URLs take precedence. Otherwise the official Wowhead script iconizes item links into a reserved 48px box. No new Blizzard item/media requests are made, and script failure leaves names, quality, slot, enchants, and links usable.

The [official Wowhead integration](https://www.wowhead.com/tooltips) documents the script, hover/touch behavior, domain selection, enchant IDs, and colon-separated gem IDs. PrePull loads `https://wow.zamimg.com/js/tooltips.js` once with Next Script `afterInteractive`; public display options are set client-side before loading. Link refresh runs on Script readiness, including client remounts. Link renaming/color rewriting is disabled. React-provided names remain stable. No credentials or private application state enter configuration or attributes.

Central routing uses the **realm ecosystem**, not the surrounding content tab: Era → `/classic/` and `domain=classic`; Anniversary → `/tbc/` and `domain=tbc`. Thus an Era character viewed under `/tbc` still gets Classic item data. The current official script declares `CLASSIC=4`, `TBC=5`. Live browser checks confirmed Classic item tooltips/icons and TBC item 29021 requesting `nether.wowhead.com/tooltip/item/29021?dataEnv=5`. TBC is not silently routed to Era.

Only actual permanent enchant IDs and socket item IDs enter tooltip parameters. Display enchant descriptions remain visible without JavaScript. Spell links use actual returned spell IDs and the same dataset mapping. Equipment links are keyboard-focusable, open real item pages with `noopener noreferrer`, and provide local focus details; touch users retain normal link navigation even if the external tooltip fails. A blocked-script test is independent of third-party availability. Existing security headers/CSP were not weakened.

## Realm catalog and request budget

One catalog abstraction supplies both finders and provider realm validation. The checked-in Era fallback was captured from successful EU/US `dynamic-classic1x-{region}` realm indexes (58 EU, 66 US entries). Live results use the same explicit field allowlist, 24-hour server cache, and in-flight deduplication. The read-only realm endpoint has a one-hour browser/shared response TTL plus a 24-hour stale window. A retrieval failure uses the known catalog and a five-minute retry cooldown. Typing filters locally and makes no character lookup calls.

Anniversary entries have **no borrowed Era IDs**. Names are centralized from Blizzard's [EU announcement](https://eu.forums.blizzard.com/en/wow/t/realm-names-for-anniversary-realms/549988) and [US announcement](https://us.forums.blizzard.com/en/wow/t/realm-names-for-anniversary-realms/2013913); Hardcore entries are excluded from this Anniversary/TBC list. Update the registry only against an official announcement; update the Era fallback by fetching both successful realm indexes and retaining only ID, name, slug, region, and ecosystem. Review changes and run realm tests before replacing the fallback. Catalog availability does not imply Anniversary profile API availability.

The shared combobox uses a labelled ARIA combobox/listbox, active descendant, arrow navigation with scrolling, Enter selection, Escape, pointer selection, and a result-count status. Stable slugs use the existing normalization. Prefix matches precede substring matches, with deterministic ordering. Invalid text cannot submit as a selected realm. Changing region/ecosystem remounts and revalidates the selection.

An uncached rich character lookup uses **four parallel profile requests**, at most one cached realm-index setup request and one cached token request. No per-item or per-talent-node calls. Warm character cache and fresh durable public cache avoid upstream calls. Saved page views make **zero** provider calls. Wowhead's independent browser requests are outside the Blizzard request budget and are cached by the official integration/browser.

## Validation and acceptance

See `artifacts/acceptance/p1ab/` and the completion report for final command results, browser groups, snapshot hashes, and acceptance status. All ten recommendation JSON files are compared against HEAD using LF-normalized SHA-256. Calendar data and migrations 001–018 remain untouched.

Deployment prerequisite: apply migration 019 using the existing migration runner before deploying P1A/B. Staging deployment and a staging-host live smoke are deferred; the successful live API and tooltip checks above ran from the local workspace/browser.
