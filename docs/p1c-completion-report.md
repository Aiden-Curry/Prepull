# P1C Era provider completion report

**P1C LOCAL ACCEPTANCE (Era scope): YES.** Fresh/TBC production support remains unavailable; its separate audit is not an acceptance claim. No staging deployment or P1D work was performed.

## Live evidence

The selected character is EU / Firemaw / Kankan. The final local smoke passed token acquisition, character lookup, canonical ID presence, world metadata, zone rankings, Molten Core encounter rankings, and recent reports. It found all seven standard Era zones and public data in all seven, with zero partial errors. Three production GraphQL HTTP calls were made; a cold process also needs one token HTTP call. A second service instance read PostgreSQL and made **zero WCL calls**.

The calibrated provider cost was **171.02 WCL points** for this character. The measured window was 172.02 points, including a separately calibrated one-point measurement query. The complete audit used eight GraphQL calls because it also checked metadata, an encounter, and cost. Cost varies with the character's observed specs and WCL pricing of query fields. One earlier smoke attempt returned unavailable after an upstream failure; the subsequent and final runs passed. No automatic request retry loop was added.

Real cached WCL data rendered in the existing PrePull character page on desktop and at 390px: seven raids, Fury/DPS and Protection/Tank, five public report links, and the canonical Vanilla character link. The Armory record for this local rendering check was explicitly seeded as **preview/mock**; it is not evidence of a fresh Blizzard lookup. The Logs section used real provider data and was not a synthetic display fixture.

Reproduce with real server WCL credentials and an explicitly local PostgreSQL `DATABASE_URL`:

```text
node --experimental-strip-types scripts/audit-era-logs-provider.ts
```

The script refuses a non-local database. It refreshes only the selected independent WCL cache row, writes sanitized evidence under `test-results/p1c`, and never prints credentials. Evidence files include `provider-live-smoke.json`, `live-render-result.json`, and desktop/mobile screenshots.

## Observed schema and registry

Molten Core's exact `zoneRankings` top-level keys were `bestPerformanceAverage`, `medianPerformanceAverage`, `difficulty`, `metric`, `partition`, `zone`, `size`, `allStars`, and `rankings`. `rankings` is an array of boss objects, containing `encounter.id/name`, `rankPercent`, `medianPercent`, `lockedIn`, `totalKills`, `fastestKill`, `allStars`, `spec`, `bestSpec`, `bestAmount`, `rankTooltip`, and, for ranked rows, `bestRank`. Some absent-data rows omit the latter fields. `allStars` is an array at zone level and an object or null on boss rows.

The all-spec MC response supplied Best Performance Avg `99.60301999999999` and Median Performance Avg `93.404`. Lucifron explicitly had 51 total kills in the all-spec query. These are WCL fields, not values inferred from percentile or report count. Production queries show the exact returned averages and kills for each explicitly filtered spec/role. The broader all-spec aggregates are not relabeled as one spec's average.

Lucifron `encounterRankings` keys were `bestAmount`, `medianPerformance`, `averagePerformance`, `totalKills`, `fastestKill`, `difficulty`, `metric`, `partition`, `zone`, and `ranks`. Rank rows additionally exposed `rankPercent`, `historicalPercent`, `todayPercent`, `rankTotalParses`, `historicalTotalParses`, `todayTotalParses`, `duration`, `startTime`, `amount`, `spec`, `bestSpec`, and `class`. Guild/report internals were omitted from fixtures. One observed rank had historical percentile 99.65757030408179 and 31,168 historical parses. Parse population is not kill count. Encounter rankings add timestamps and per-kill history; production omits those optional display values rather than fetching every boss's history.

No `role` property was returned inside ranking JSON. Role is supplied by WCL's validated `role:DPS`, `role:Healer`, or `role:Tank` query filter. Metric is `dps` for damage/tank and `hps` for healer. HPS alone does not imply healer: the unfiltered Warrior HPS audit demonstrated that distinction.

Registry source: [observed metadata](../tests/fixtures/warcraft-logs/vanilla-metadata.json). Implementation: [registry.ts](../lib/warcraft-logs/registry.ts). Exact returned encounter order and zone order are retained; display order follows raid progression.

| Zone | Raid | Observed encounters | Progression denominator |
|---|---|---:|---:|
| 2000 | Molten Core | 10 | 10 |
| 2001 | Onyxia | 1 | 1 |
| 2002 | Blackwing Lair | 9 | 8 |
| 2003 | Zul'Gurub | 11 | 8 |
| 2004 | Ruins of Ahn'Qiraj | 6 | 6 |
| 2005 | Temple of Ahn'Qiraj | 9 | 9 |
| 2006 | Naxxramas | 15 | 15 |

Every encounter has an explicit `progression` boolean. The following are product judgments, not metadata-provided progression flags: BWL 50631 Ebonroc/Flamegor is excluded as a combined alternate encounter; ZG 50794 Hakkar Hard Mode is excluded as an alternate; ZG 50788 Edge of Madness and 50790 Gahz'ranka are excluded as optional summoned encounters. Their observed records remain visible but do not change clear counts. All nine AQ40 encounters count. No trash or aggregate raid zones are added.

All seven zones expose partition 1 S0 as default, and real ranking requests echoed partition 1. Other observed partitions are 2 S0 Without World Buffs, 3�6 SoM, 7 Hardcore, and 8�11 Hardcore Fresh variants. Their exact names/default flags are preserved in the registry. Production explicitly selects **S0 only**, and rejects payloads with another zone/partition. UI identifies Classic Era / S0 / world buffs included. Season of Discovery zones 2007+ are excluded; recent report projection also accepts only the seven Era zone IDs.

## Required completion inventory

1. **Files:** new `lib/warcraft-logs` transport, context, identity, registry, provider, model, cache, service, audit and fixtures; two Logs components; public/saved page slots; abuse policy; migration 020; audit scripts; tests/fixtures; package scripts; these reports. Existing tracked edits are limited to those integration points.
2. **Migration:** keep independent migration 020. It was locally applied and verified idempotent at the preceding checkpoint. Migrations 001�019, including 018, are unchanged.
3. **Sites:** Era `https://vanilla.warcraftlogs.com/api/v2/client`; Fresh mapping is separate; no regional or `classic` Era fallback.
4. **OAuth:** server client credentials through `https://www.warcraftlogs.com/oauth/token`, Basic client authentication and form grant type.
5. **Token cache:** private process memory, deduplicated acquisition and early expiry refresh; rejected tokens invalidated.
6. **Secrets:** no token/secret persistence, browser projection, query logging, or arbitrary upstream error prose. Redirects rejected; safe diagnostics are allowlisted.
7. **Live identity:** Kankan/Firemaw/EU lookup and canonical ID succeeded.
8. **Zone shape:** actual MC keys and sanitized fixture described above.
9. **Encounter fields:** actual Lucifron history audited; optional recent/date fields omitted from production when not authoritative in zone data.
10. **Averages:** exact provider Best Performance Avg and Median Performance Avg; absent values omitted; no custom overall mean.
11. **Identity mapping:** normalized content version, realm type, region, realm slug and character name; centralized URL construction.
12. **Era mapping:** verified Vanilla, zones 2000�2006, S0 partition 1 and revisioned cache context.
13. **TBC mapping:** Anniversary selects Fresh site but production provider remains unsupported. Carlisha/Spineshatter/EU was separately audited; no Vanilla substitution.
14. **Raid registry:** seven observed standard Era raids, with Discovery excluded.
15. **Encounter registry:** exact IDs/names/order plus explicit progression decisions above.
16. **Domain model:** raw JSON is normalized to `LogsSummary` before React or PostgreSQL; runtime cache projection whitelists fields and bounds arrays/values.
17. **Kills:** positive integer `totalKills`, explicitly queried per spec/role. Patchwerk Fury 96 and Protection 36 are separate; 132 combined kills are never assigned to Fury.
18. **Progression:** distinct eligible boss IDs with positive provider-backed kills, not parse/report counts.
19. **Clear:** all eligible encounters killed and raid available; optional/alternate encounters excluded; partial failures cannot imply a clear.
20. **Multiple specs:** role discovery followed by one batched spec-filtered query, at most three observed specs per role/raid. Additional specs fail that raid safely; no guessed spec labels or merged kill totals.
21. **Healer/tank:** explicit role filters; healer HPS, damage/tank DPS. Real Holy-shaped fixture plus constructed Era schema variant tested.
22. **Reports:** public client API only, maximum five. Audit captured public code/title/start/end/zone/visibility; production retains code/start/zone only. Non-public, missing-visibility, and non-Era reports are omitted. No events or private-log argument in production queries.
23. **Hidden:** authoritative hidden response ends lookup and replaces public cached data.
24. **No logs:** zero public data is distinct from upstream failure; empty individual raids display no public ranking data.
25. **Not found:** null character without GraphQL failure is a separate state, with no ranking requests.
26. **Temporary error:** bounded transport timeout, rate-limit and upstream failures leave Armory usable.
27. **Partial GraphQL:** successful raids remain; failed aliases mark their raid unavailable and shorten cache TTL.
28. **Cache:** independent shared PostgreSQL table, no Battle.net/account foreign keys or token fields.
29. **TTL:** available 15 minutes; not found 2 minutes; hidden 1 minute; no logs 5 minutes; partial results 30 seconds.
30. **Stale:** previous public data may be used for up to one hour after success on timeout/rate-limit/upstream errors only; no auth/hidden fallback.
31. **Concurrency:** process-level deduplication plus 45-second database lease, bounded peer wait, conditional owner writes and abandoned lease recovery.
32. **Cold HTTP:** live character used three GraphQL calls plus one token call in a cold process; no per-boss HTTP requests.
33. **Cache hit:** second service instance made zero WCL calls.
34. **Query cost:** identity/reports, 21 role/raid aliases, then observed spec/raid aliases. Measured 171.02 provider points; bounded by seven zones and three specs per role.
35. **Public page:** existing normalized public identity feeds shared service; Armory lookup behavior unchanged.
36. **Saved page:** same cache key/service; saved Armory remains persisted and does not refresh through Logs.
37. **Navigation:** Character, Talents, Logs, Advice, Progress with a stable section anchor and loading boundary.
38. **Summary UI:** public progression totals, retrieved date, explicit stale/neutral states, distinct fixture label.
39. **Raid UI:** ordered expandable raids with eligible counts, exact provider aggregate labels and per-raid errors/no-data text.
40. **Boss UI:** separate spec/role/metric percentiles and kills, no invented recent dates or averages.
41. **Attribution:** fixed context-specific Warcraft Logs attribution.
42. **Links:** normalized canonical Vanilla character link; validated 16-character public report codes; no arbitrary URL fragments.
43. **Mobile:** Logs and regression groups passed at narrow viewport; live WCL page also checked at 390px.
44. **Keyboard:** navigation, raid expansion and existing flows passed.
45. **Axe:** no serious/critical violations in the bounded Logs and regression checks.
46. **Unit tests:** 274 passed, zero skips.
47. **PostgreSQL tests:** 56 passed, zero skips, isolated local database.
48. **Provider/cache tests:** real-shaped fixtures, partial progression, per-role/per-spec kills, hidden/not-found/empty, partial errors, rate/upstream errors, Discovery/partition isolation, cache reuse and leases.
49. **Logs browser tests:** 12 passed, zero skips; additional real-data desktop/mobile rendering check passed.
50. **P1A/B regression:** all four `tests/e2e/armory.e2e.spec.ts` cases passed in the final 30-case character/player group: realm finder, public Armory, persisted saved-Armory refresh, and observed Classic talents. Existing Armory/provider/realm unit and snapshot integration tests also passed in the final full suites.
51. **P0B regression:** all eight `tests/e2e/public-character.e2e.spec.ts` cases passed in that same final group (cases 19–26); both `tests/postgres.public-lookup.integration.test.ts` cases passed in the 56-test integration run. Public-character projection/cache, abuse-control and auth-callback unit tests passed in the 274-test run. Zero relevant skips. The explicit coverage and assertion limits are recorded below; this replaces the incorrect guild-coverage description.
52. **P0C regression:** all four `tests/e2e/battle-net-auth.e2e.spec.ts` cases passed in the final 30-case group: login/discovery/import, cancellation, account linking protection, and returning login with TBC context. No OAuth behavior changed.
53. **Player regression:** all 14 cases across `player-onboarding.e2e.spec.ts` (5), `player-refresh.e2e.spec.ts` (2), `player-advice.e2e.spec.ts` (3), and `session-planner.e2e.spec.ts` (4) passed in the final 30-case group, zero skips.
54. **Guild/calendar regression:** all 23 cases across `guild-readiness.e2e.spec.ts`, `guild-prep-board.e2e.spec.ts`, `guild-prep-runs.e2e.spec.ts`, `guild-schedule.e2e.spec.ts`, `unified-calendar.e2e.spec.ts`, and `game-calendar.e2e.spec.ts` passed in the separate final guild/calendar group, zero skips. These are not the P0B public-character suite.
55. **Calendar:** validator remains 26 explicit occurrences, zero structural errors; calendar data unchanged.
56. **TypeScript:** passed.
57. **ESLint:** passed.
58. **Build:** production build passed with synthetic WCL fixtures disabled. `git diff --check` passed.
59. **Recommendations:** all ten LF-normalized SHA-256 snapshots unchanged. Gear, curated and all-spec validators passed with existing dataset warnings and no blockers.
60. **Limitations:** Era only; Fresh production registry/partition policy still pending. No cross-partition history merge. No per-kill recent dates in production. Progression exclusions are explicit product judgments. Public-client observations showed only public reports; that sample alone is not proof about every possible upstream response, so projection also fails closed on visibility.
61. **Acceptance:** YES for Era scope. No Fresh acceptance, staging deployment, or P1D claim.

## Evidence and repeatability

### P0B final-gate evidence correction

The final P1C validation already executed the applicable existing P0B suites. This correction changes documentation only; no product/WCL code, test source, staging state, or P1D work changed. No test or live WCL audit rerun was needed.

Exact retained results:

- `test-results/p1c/provider-browser-character.log`: **30 passed (1.9m)**; public-character cases 19–26 are all eight P0B browser cases, each marked `ok`. No skipped cases.
- `test-results/p1c/provider-integration.log`: **56 passed, 0 failed, 0 skipped**; explicitly includes “PostgreSQL public cache survives repository recreation and suppresses a second provider call” and “PostgreSQL limiter is shared across instances and blocks before protected work”.
- `test-results/p1c/provider-unit.log`: **274 passed, 0 failed, 0 skipped**; command and individual results include `public-character.test.ts`, `abuse-control.test.ts`, `auth-callback.test.ts`, and the public Armory projection tests.

| Required P0B protection | Evidence in the final validation |
|---|---|
| Anonymous public lookup | Browser case 19, “anonymous Era lookup opens a safe shareable public character”; case 20 covers TBC/ecosystem separation. |
| Canonical public URL | Case 19 asserts the exact normalized Era path; `public-character.test.ts` verifies canonical Era/TBC URL normalization. |
| Durable public cache | Case 19 reloads through a separate browser context and verifies unchanged PostgreSQL cache timestamp; the PostgreSQL public-cache test recreates the repository and verifies one provider call. |
| Public lookup rate limiting | Case 25 checks HTTP 429 and Retry-After; the PostgreSQL limiter test verifies shared limits before protected work; abuse-control unit tests also passed. |
| Signup callback preservation | Case 21 checks the exact callback path and return URL, then authenticated trusted initial sync; auth-callback unit tests passed. |
| Sign-in callback preservation | Case 22 checks the exact callback and return URL, then verifies already-saved lookup does not duplicate the character; auth-callback unit tests passed. |
| Noindex/nofollow | Case 19 directly asserts `noindex`. Read-only review additionally confirms the page metadata sets both `index:false` and `follow:false`, and the API returns `x-robots-tag: noindex, nofollow`. The existing test does **not** separately assert `nofollow`; no such execution claim is made. |
| Public versus trusted saved state | Public-character and Armory projection unit tests exclude trusted/provider-private fields; case 19 checks the anonymous response for trusted-state leakage; case 22 checks authenticated saved identity without duplication; the saved-Armory browser case verifies changes only through persisted refresh. |
| No anonymous writes to trusted sync state | Read-only review confirms anonymous page/API lookup uses the public cache, whose writes target only `public_character_lookup_cache`; WCL writes use its independent cache. Saved identity lookup is session-gated and the save action requires authentication before trusted sync. The existing P0B suite has no dedicated before/after trusted-table assertion for an anonymous lookup; this is structural review evidence, not an invented test result. |

All applicable existing tests were executed and passed with zero relevant skips. The two narrower assertion limits above are explicit so the report does not overstate automated coverage. **P1C LOCAL ACCEPTANCE (Era scope): YES.**

[Molten Core live fixture](../tests/fixtures/warcraft-logs/vanilla-molten-core.json), [production live responses](../tests/fixtures/warcraft-logs/vanilla-provider-live.json), [constructed scenario fixtures](../tests/fixtures/warcraft-logs/provider-scenarios.json), [provider tests](../tests/warcraft-logs-provider.test.ts), and [separate Fresh audit](p1c-wcl-site-audit.md).

Local gate logs are in `test-results/p1c/provider-*.log`. No credentials, headers, cookies or access tokens are included in repository fixtures. Synthetic scenario mutations are expressly distinguished from additional live observations.

Final browser artifact scan checked 68 static files: configured WCL client secret absent. Repository fixture scan found no credential fields or configured secret.
