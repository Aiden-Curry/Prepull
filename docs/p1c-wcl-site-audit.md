# P1C WCL site correction and authenticated audit

> Historical site-mapping audit. The production Era adapter and final acceptance results are now documented in [the completion report](p1c-completion-report.md). Fresh findings below remain audit evidence, not enabled production support.

**P1C LOCAL ACCEPTANCE: NO.** Site correction and live response capture are complete. The production ranking adapter/registry and its acceptance run are still pending. No staging deployment occurred.

## Corrected routing

`lib/warcraft-logs/context.ts` is the endpoint authority. Era + Era selects **vanilla**; TBC + Anniversary selects **fresh**. Mixed version/ecosystem pairs are unsupported. Transport takes a required allowlisted site; the previous fixed `classic.warcraftlogs.com` endpoint is no longer used for either context. Character/report links and attribution follow the same selection. Cache keys include site, ecosystem, content version, region, realm, character and registry revision; tests prove site isolation for identical identities.

OAuth token acquisition remains server-side at `https://www.warcraftlogs.com/oauth/token`. Credentials are now valid; the earlier missing-credentials blocker is resolved.

## Requested safe audit results

| Field | Classic Era | TBC Anniversary |
|---|---|---|
| Character | Kankan / Firemaw / EU | Carlisha / Spineshatter / EU |
| tokenAcquisition | PASS | PASS |
| Selected context | vanilla | fresh |
| GraphQL hostname | vanilla.warcraftlogs.com | fresh.warcraftlogs.com |
| characterLookup | PASS | PASS |
| Canonical ID present | YES | YES |
| Generic metadataZones | 18 | 32 |
| Identity/metadata partialErrors | 0 | 0 |
| Ranking GraphQL errors | 0 | 0 |
| Audited ranking zone | 2006 — Naxxramas | 1048 — Gruul / Magtheridon |
| Audited partition | 1 — S0 | 3 — Phase 3 |
| Public recent reports returned | 5 | 3 |
| rankingAudit | OBSERVED | OBSERVED |

The first two requests separately prove identity and metadata. Optional ranking audit follows only after both succeed and the character is not hidden. Audit errors include operation name, HTTP status, validated field path and a safe message. Recognized GraphQL schema errors retain their diagnostic prefix; arbitrary prose, extensions and sensitive values are withheld.

## Vanilla zone observations

The 18-zone result includes Season of Discovery. The following seven are Era candidates; no Discovery IDs are substituted:

| Zone ID | Name | Metadata encounter count | Observed partitions |
|---|---|---:|---|
| 2000 | Molten Core | 10 | 1–11 |
| 2001 | Onyxia | 1 | 1–11 |
| 2002 | Blackwing Lair | 9 | 1–11 |
| 2003 | Zul'Gurub | 11 | 1–11 |
| 2004 | Ruins of Ahn'Qiraj | 6 | 1–11 |
| 2005 | Temple of Ahn'Qiraj | 9 | 1–11 |
| 2006 | Naxxramas | 15 | 1–11 |

For these zones partition 1 is S0/default; 2 is S0 without world buffs; 3–6 are Season of Mastery phases; 7–11 are Hardcore variants. Those contexts must not be merged. Naxxramas partition 1 returned positive live rankings.

Metadata counts are **not finalized progression denominators**. BWL includes an Ebonroc/Flamegor combined encounter alongside the individual encounters. ZG includes a Hakkar Hard Mode variant and optional encounters. The production registry must explicitly resolve these before clear-state acceptance.

Full returned IDs, names, encounter lists and partition labels are recorded in [Vanilla metadata](../tests/fixtures/warcraft-logs/vanilla-metadata.json), including the eleven excluded Discovery zones.

## Fresh metadata trap and current zones

Fresh's generic `worldData.zones` returned 32 zones, including historical TBC and later progression expansions. Historical Karazhan **1007** returned a JSON-level `Unsupported zone specified.` error even though HTTP was 200 with no GraphQL errors. It is not valid Anniversary ranking evidence.

Carlisha's public recent reports identified zone **1048**. `worldData.zone(id:1048)` independently confirmed current non-frozen Gruul/Magtheridon, expansion **1001**. Querying `worldData.expansion(id:1001).zones` then exposed the current Fresh raid metadata:

| Zone ID | Name | Encounters | Partitions | Default partition |
|---|---|---:|---|---:|
| 1047 | Karazhan | 10 | 1 Phase 1, 2 Phase 2, 3 Phase 3 | 1 |
| 1048 | Gruul / Magtheridon | 3 | 1 Phase 1, 2 Phase 2, 3 Phase 3 | 1 |
| 1056 | SSC / TK | 10 | 1 Phase 1, 2 Phase 2, 3 Phase 3 | 2 |
| 1060 | BT / Hyjal | 14 | 1 Phase 1, 2 Phase 2, 3 Phase 3 | 3 |

These metadata identities are separate from historical 1007/1008/1010/1011. “Complete Raid” aggregate zones are also separate and must not become individual boss registries. Only zone 1048 has been ranking-audited here; the other three remain metadata candidates.

Carlisha's zone 1048 partitions 1 and 2 returned zero kills. Explicit partition 3 returned a Holy/HPS Gruul ranking with one provider-backed kill. **Default partition does not imply complete character history.** No cross-partition totals have been invented.

See [generic Fresh metadata](../tests/fixtures/warcraft-logs/fresh-metadata.json) and [current Fresh metadata](../tests/fixtures/warcraft-logs/fresh-current-zones.json).

## Observed ranking semantics

- `zoneRankings`: `bestPerformanceAverage`, `medianPerformanceAverage`, `difficulty`, `metric`, `partition`, `zone`, `size`, `allStars`, `rankings`.
- Boss ranking rows: `encounter.id/name`, `rankPercent`, `medianPercent`, `totalKills`, `spec`, `bestSpec`, `bestAmount`.
- `encounterRankings`: `bestAmount`, `medianPerformance`, `averagePerformance`, `totalKills`, `fastestKill`, `difficulty`, `metric`, `partition`, `zone`, `ranks`; individual ranks include spec and startTime.
- Provider aggregates are retained exactly, without recomputing means or renaming a median.
- Kankan's all-spec Patchwerk total was 132; explicit Fury and Protection queries returned 96 and 36. The best-spec label on an all-spec row cannot be used to attribute every kill to that spec.
- Kankan also has HPS ranking values despite Warrior specs. Requesting HPS is not itself proof that a character is a healer. Role filtering/selection must preserve actual semantics.
- Carlisha provides a real Holy/HPS fixture. Hidden and no-public-data UI fixtures remain synthetic and clearly labeled.
- Recent report capture filters `visibility === "public"`, limits results to five and selects only code, timestamps and zone. No report event streams or private/unlisted report queries were made.

Captured sanitized fixtures: [Vanilla rankings](../tests/fixtures/warcraft-logs/vanilla-observed-rankings.json), [Vanilla spec-filtered rankings](../tests/fixtures/warcraft-logs/vanilla-observed-specs.json), [Fresh rankings](../tests/fixtures/warcraft-logs/fresh-observed-rankings.json). These contain observed values with irrelevant ranking/report/account metadata removed; they are not fabricated provider responses.

## Reproduction and historical checkpoint

```text
npm run audit:warcraft-logs
npm run audit:warcraft-logs -- --rankings
npm run audit:warcraft-logs -- --fresh
npm run audit:warcraft-logs -- --fresh --rankings --partition=3
```

Basic audit: two GraphQL HTTP calls, plus token acquisition on a cold process. Extended audit: three additional GraphQL calls (bounded recent reports, reported-zone metadata, aliased zone/encounter rankings). The ranking query has two zone fields and one encounter field, not one HTTP request per boss. This audit cost is not the finalized production request strategy.

At this historical checkpoint, remaining P1C work was: production registry/progression exclusions, explicit partition presentation, live ranking adapter, verified role/multi-spec request strategy, durable metadata cache, live page integration, full provider acceptance tests and the final complete acceptance run. Production display still refuses unverified ranking contexts. The audit success does not activate unaudited mappings automatically.

Correction validation: 262 unit tests, 56 PostgreSQL integration tests and 12 Logs browser tests passed, zero skips. TypeScript, ESLint, production build and whitespace checks passed. All ten recommendation hashes remain unchanged. The earlier 53 character/player/guild/calendar regression cases also passed at the preceding checkpoint; they were not rerun for this bounded site correction. No acceptance claim substitutes those fixture checks for final live-provider coverage.
