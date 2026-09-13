# Game Calendar authoring

Phase 6.5A stores Blizzard/world events as reviewed application content under `data/calendar/<content-version>/`. It does not use the guild schedule database: game-region dates and guild-local activity are separate temporal domains.

## Source audit and policy

Blizzard's documented Classic API surface provides game-data and profile endpoints, but no supported Classic calendar/event feed. Official announcements and hotfixes cover some occurrences, not a complete regional calendar. PrePull therefore uses curated files and no scraper or runtime third-party dependency. Prefer Blizzard, then established Classic references for gaps. Record a descriptive source label, an HTTP(S) URL when available, and the date the occurrence was checked. Never copy a community table wholesale.

The initial window is September 2026 through early January 2027. Classic Era battleground and Darkmoon occurrences are backed by live EU/US realm calendars. TBC battleground and Darkmoon occurrences use the interactive Europe and North America calendars at Classic Raid Reset, checked separately; Blizzard's June 2026 first-Friday hotfix corroborates the current TBC Darkmoon scheduling context. Seasonal events are included only where their Classic-version applicability and 2026 dates were checked.

## Schema and timing

Each `GameCalendarEvent` has a stable occurrence `id`, reusable `familyId`, explicit `contentVersion`, category, region, timing, and provenance. Use `global` only when the occurrence is semantically identical. The public selector currently exposes EU and US; KR/TW are modeled for sourced future data.

Use `date-range` when sources only state calendar dates. Its end is inclusive; omitting it means a one-date occurrence. Use `instant-range` only for offset-aware ISO instants whose actual time is sourced. Never convert a date-only source into midnight UTC. Status is calculated at read time with an injected clock; global/date-only events use the selected region's civil date.

## Adding or correcting an occurrence

1. Add a concrete occurrence to the correct version/year file. Do not add an opaque runtime recurrence rule.
2. Verify version, region, date precision, category, and provenance. Do not infer Retail parity.
3. Run `npm run validate:calendar` and `npm test`.
4. For a correction, update the occurrence and its `verifiedAt`/source. Explain material historical corrections in the change record; no database migration is needed.

The registry is keyed by `ContentVersion`, so a future version adds its data and registry entry. This phase deliberately does not add Forever to `ContentVersion`.
