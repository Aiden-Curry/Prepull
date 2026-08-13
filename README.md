# PrePull

PrePull is a World of Warcraft Classic preparation companion built with Next.js, TypeScript, and Tailwind CSS.

## Character provider modes

Mock mode is the default when Blizzard credentials are absent:

```env
PREPULL_CHARACTER_PROVIDER=mock
```

The mock records are useful for UI development and deterministic testing. Try:

- Era content / Era realm: `EU / Firemaw / Aidy`
- Era content / Era realm: `US / Whitemane / Lyria`
- TBC content / Anniversary realm: `EU / Spineshatter / Aidy`
- TBC content / Anniversary realm: `US / Benediction / Selene`

Character URLs include both concepts, for example `/tbc/character/anniversary/eu/spineshatter/aidy`. The main site content switch remains `/era` and `/tbc`; it is independent from the character realm ecosystem.

To enable the server-only Blizzard adapter, create an application in the [Battle.net Community Developer Portal](https://community.developer.battle.net/) and configure `.env.local`:

```env
BATTLENET_CLIENT_ID=your-client-id
BATTLENET_CLIENT_SECRET=your-client-secret
PREPULL_CHARACTER_PROVIDER=blizzard
```

Never use `NEXT_PUBLIC_` for these values. The OAuth client-credentials exchange and all Blizzard requests run in server components/services only.

## Blizzard integration status

The adapter uses the documented server authentication flow at `{region}.battle.net/oauth/token` and the World of Warcraft profile/equipment paths under `{region}.api.blizzard.com`. Classic Era is mapped to `profile-classic1x-{region}` and `static-classic1x-{region}`.

Anniversary realms are intentionally marked unsupported by the live adapter until their current profile namespace, realm index, and equipment response are verified. PrePull will never fall back to Retail or another Classic ecosystem for an Anniversary lookup. Anniversary mock routes remain available.

Live validation confirmed OAuth for EU and US, and a current Era profile through `profile-classic1x` with equipment, specialization/talents, and `static-classic1x` item metadata. The similarly named `profile-classic` namespace returned a different historical product snapshot for the same Era character, so it is not used. Anniversary candidate profiles either returned 404 in `classic1x` or stale/different data in `classic`; Anniversary remains explicitly unsupported.

The item service has a long-lived in-memory cache; character profiles have a short-lived in-memory cache; OAuth requests are deduplicated and cached until shortly before expiry. A distributed cache can replace this abstraction later.

## Phase 4 gear analysis

The gear engine is isolated under `lib/gear-analysis`. It compares complete loadouts using the curated `era-fury-warrior-v2` profile, including configurable Hit breakpoint weighting, weapons, set bonuses, curated special effects, item availability, confidence, and source grouping. The profile version was bumped from v1 because Phase 4.5 changed meaningful weapon-slot and activity-ranking semantics. The profile remains a documented heuristic rather than a DPS simulator. Only Classic Era Fury Warrior analysis is enabled; other specs and Anniversary characters receive an explicit unsupported-analysis state.

Phase 4.5 adds assumption provenance, a 35-item curated Era dataset spanning dungeon, quest, crafted, Molten Core, Onyxia, Blackwing Lair, Zul'Gurub, AQ20/AQ40, and Naxxramas sources, synthetic progression fixtures, dual-ring/trinket/weapon evaluation, and a development data validator. Source records are marked curated unless separately verified; repeated source destinations are surfaced as warnings for review.

The methodology is available at `/{version}/gear/methodology` and explains the profile, complete-loadout comparison, breakpoints, confidence, realistic-vs-BiS recommendations, and limitations.

Phase 4.7 provides a manual Fury calibration workflow. Use `npm run calibrate:fury -- --pending` or `npm run calibrate:fury -- --case=<id>` to print reproducible simulator templates. Enter permitted external results only in `lib/gear-analysis/calibration/references.ts`; the evaluator checks DPS fields, iterations, timestamps, tool version, and scenario comparability. Pending or non-comparable cases are excluded from agreement metrics.

Run the automated engine checks with:

```bash
npm test
```

Validate the curated item records with:

```bash
npm run validate:gear
```

Node currently emits a harmless module-type warning because the test runner executes TypeScript directly with Node's type stripping. The tests still pass; adding `type: module` globally would unnecessarily change Next's module behavior.

## Development

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

When the live provider is unavailable, the character page shows an explicit provider error. It does not silently substitute mock data.
